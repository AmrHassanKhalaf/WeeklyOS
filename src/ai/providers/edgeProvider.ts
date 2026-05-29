import { supabase } from '../../lib/supabase'
import { useSettingsStore } from '../../store/useSettingsStore'
import type {
  AIMessage,
  AIProvider,
  AIProviderRequest,
  AIProviderResponse,
  AIProviderToolCall,
  AITool,
} from '../types'
import { recordAITelemetry, roundDuration } from '../telemetry'

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLIC_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string)

// ─── Schema Conversion ────────────────────────────────────────────────────────

/**
 * Converts an AITool's inputSchema to the Gemini FunctionDeclaration format.
 * Only surface-level properties are mapped; deeply nested objects are passed through.
 */
function convertToolToFunctionDeclaration(tool: AITool): Record<string, unknown> {
  const properties: Record<string, unknown> = {}

  for (const [key, prop] of Object.entries(tool.inputSchema.properties ?? {})) {
    const geminiType = (prop.type ?? 'string').toUpperCase()
    const entry: Record<string, unknown> = {
      type: geminiType === 'UNKNOWN' ? 'STRING' : geminiType,
      description: prop.description ?? '',
    }
    if (prop.type === 'array' && prop.items) {
      entry.items = {
        type: (prop.items.type ?? 'string').toUpperCase(),
      }
    }
    properties[key] = entry
  }

  return {
    name: tool.id,
    description: tool.description,
    parameters: {
      type: 'OBJECT',
      properties,
      required: tool.inputSchema.required ?? [],
    },
  }
}

// ─── Message Normalization ────────────────────────────────────────────────────

function normalizeMessagesForEdge(
  messages: AIMessage[]
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : m.role === 'system' ? 'system' : 'user',
    content: m.content,
  }))
}

// ─── Edge Provider ────────────────────────────────────────────────────────────

/**
 * AI provider that routes requests through the Supabase Edge Function.
 *
 * The edge function handles:
 * - API key retrieval (server-side, not exposed to client)
 * - Provider API calls with optional function calling
 * - Authentication via JWT
 *
 * This provider translates the orchestrator's normalized request into the
 * edge function's wire format and back.
 */
export function createEdgeProvider(): AIProvider {
  return {
    id: 'edge',
    label: 'Edge AI',
    supportsTools: true,
    supportsStreaming: false,

    generate: async (request: AIProviderRequest): Promise<AIProviderResponse> => {
      if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
        throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
      }

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const state = useSettingsStore.getState()
      const provider = state.activeProvider || 'gemini'
      const model = request.model || state.activeModel || 'gemini-2.5-flash'

      // Build tool declarations for function calling
      const functionDeclarations = (request.tools ?? []).map(convertToolToFunctionDeclaration)

      const payload: Record<string, unknown> = {
        type: 'workspace',
        messages: normalizeMessagesForEdge(request.messages),
        overrideProvider: provider,
        model,
        mode: request.mode,
      }

      if (functionDeclarations.length > 0) {
        payload.tools = functionDeclarations
      }

      // Fetch with one token-refresh retry
      const callEdge = async (token: string) =>
        fetch(`${SUPABASE_URL}/functions/v1/ai-handler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: SUPABASE_PUBLIC_KEY,
          },
          body: JSON.stringify(payload),
        })

      const edgeStartedAt = performance.now()
      let response = await callEdge(session.access_token)

      if (response.status === 401) {
        const { data: refreshData } = await supabase.auth.refreshSession()
        const refreshedToken = refreshData.session?.access_token
        if (refreshedToken) {
          response = await callEdge(refreshedToken)
        }
      }

      if (!response.ok) {
        const errPayload = await response.json().catch(() => null)
        throw new Error(errPayload?.error || `Edge function returned ${response.status}`)
      }

      const edgeRoundTripMs = roundDuration(performance.now() - edgeStartedAt)

      const data = (await response.json()) as {
        response?: string
        toolCalls?: Array<{ toolId: string; input: Record<string, unknown> }>
        reasoning?: string
        providerUsed?: string
        model?: string
        telemetry?: Record<string, unknown>
      }

      // Normalize tool calls
      const toolCalls: AIProviderToolCall[] = (data.toolCalls ?? []).map((tc) => ({
        toolId: tc.toolId,
        toolName: tc.toolId,
        input: tc.input ?? {},
      }))

      const providerMetadata = {
        ...(data.telemetry ?? {}),
        edgeRoundTripMs,
      }

      recordAITelemetry({
        name: 'ai.provider.edge',
        durationMs: edgeRoundTripMs,
        mode: request.mode,
        provider: data.providerUsed ?? 'edge',
        model: data.model ?? model,
        metadata: {
          toolCallCount: toolCalls.length,
        },
      })

      return {
        message: { role: 'assistant', content: data.response ?? '' },
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        reasoning: data.reasoning,
        provider: data.providerUsed ?? 'edge',
        model: data.model ?? model,
        metadata: providerMetadata,
        raw: data,
      }
    },
  }
}
