import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── System Prompts ───────────────────────────────────────────────────────────

const GLOBAL_RULES = `
You are the WeeklyOS AI Assistant. Follow these rules strictly:
- Primary Language: Arabic. Naturally include English terms like AI, WeeklyOS.
- Formatting: Plain text ONLY. NO markdown symbols.
- Spacing: Clear spacing.
- Bullets: Use "•" symbol only.
- Tone: Friendly, modern.
- Structure:
👋 Greeting
🎯 Context
⚡ Main Answer
💡 Tip
🚀 Action
`

const WORKSPACE_RULES = `
You are WeeklyOS AI, a calm contextual productivity operating layer.
Use the workspace context provided to give strategic, actionable guidance.
Avoid generic motivation. Prefer specific insights grounded in the real data.
When you call a tool, do so because it is the right action — not speculatively.
Respond in the same language the user writes in.
`

const SCHEDULE_RULES = `
You are a planning engine that must return strict JSON only.
Do not include markdown, explanations, headings, emoji, or extra text.
Return exactly one JSON object with a "tasks" array.
Each task must include:
- title: string
- priority: "high" | "medium" | "low"
- day: "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday"
- estimatedTime: optional string
- tags: optional string[]
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function withProviderTelemetry(data: Record<string, unknown>, startedAt: number) {
  return {
    ...data,
    telemetry: {
      ...((data.telemetry as Record<string, unknown> | undefined) ?? {}),
      providerMs: Math.max(0, Math.round(performance.now() - startedAt)),
    },
  }
}

function normalizeHistory(history: any[]) {
  if (!Array.isArray(history) || history.length === 0) return []

  const normalized = history.map((m: any) => ({
    role: (m.role === 'assistant' || m.role === 'ai' || m.role === 'model') ? 'model' : 'user',
    parts: [{ text: m.content || m.text || '' }],
  }))

  let startIdx = 0
  while (startIdx < normalized.length && normalized[startIdx].role === 'model') {
    startIdx++
  }

  const filtered = normalized.slice(startIdx)
  const validHistory: any[] = []
  let expectedRole = 'user'
  for (const msg of filtered) {
    if (msg.role === expectedRole && msg.parts[0]?.text?.trim()) {
      validHistory.push(msg)
      expectedRole = expectedRole === 'user' ? 'model' : 'user'
    }
  }
  return validHistory
}

type SupportedProvider = 'gemini' | 'grok' | 'ollama'

const DEFAULT_MODELS: Record<SupportedProvider, string> = {
  gemini: 'gemini-2.5-flash',
  grok: 'grok-4.3',
  ollama: 'llama3.2',
}

class ProviderRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ProviderRequestError'
    this.status = status
  }
}

function normalizeProvider(provider: string | null | undefined): SupportedProvider {
  if (provider === 'grok' || provider === 'ollama') return provider
  return 'gemini'
}

function getProviderCredential(provider: SupportedProvider, storedValue?: string | null) {
  // Treat empty string as missing so it doesn't shadow the env-var fallback
  const stored = storedValue?.trim() || undefined
  if (provider === 'gemini') return stored || Deno.env.get('GEMINI_API_KEY') || ''
  if (provider === 'grok') return stored || Deno.env.get('XAI_API_KEY') || ''
  return stored || Deno.env.get('OLLAMA_BASE_URL') || 'http://localhost:11434'
}

function buildSystemInstruction(rawMessages: any[], fallback: string) {
  return (rawMessages || [])
    .filter((m: any) => m.role === 'system')
    .map((m: any) => m.content)
    .filter(Boolean)
    .join('\n\n') || fallback
}

function normalizeOpenAiMessages(rawMessages: any[], fallbackSystem: string, fallbackUserText = '') {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
  const systemInstruction = buildSystemInstruction(rawMessages, fallbackSystem)
  if (systemInstruction.trim()) messages.push({ role: 'system', content: systemInstruction })

  for (const message of rawMessages || []) {
    if (message.role === 'system') continue
    const content = (message.content || message.text || '').toString().trim()
    if (!content) continue
    messages.push({
      role: message.role === 'assistant' || message.role === 'model' || message.role === 'ai' ? 'assistant' : 'user',
      content,
    })
  }

  if (messages.filter(m => m.role !== 'system').length === 0 && fallbackUserText.trim()) {
    messages.push({ role: 'user', content: fallbackUserText })
  }

  return messages
}

function toJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return { type: 'object', properties: {} }
  const next: any = { ...schema }
  if (typeof next.type === 'string') next.type = next.type.toLowerCase()
  if (next.properties && typeof next.properties === 'object') {
    next.properties = Object.fromEntries(
      Object.entries(next.properties).map(([key, value]) => [key, toJsonSchema(value)])
    )
  }
  if (next.items) next.items = toJsonSchema(next.items)
  return next
}

function toOpenAiTools(toolDeclarations: any[]) {
  if (!Array.isArray(toolDeclarations)) return []
  return toolDeclarations
    .filter((tool: any) => tool?.name)
    .map((tool: any) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: toJsonSchema(tool.parameters || { type: 'object', properties: {} }),
      },
    }))
}

function parseToolArgs(args: unknown) {
  if (!args) return {}
  if (typeof args === 'string') {
    try {
      return JSON.parse(args)
    } catch {
      return {}
    }
  }
  return typeof args === 'object' ? args : {}
}

async function fetchJson(url: string, init: RequestInit, provider: string) {
  const response = await fetch(url, init)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error ||
      payload?.message ||
      `${provider} request failed with ${response.status}`
    throw new ProviderRequestError(message, response.status)
  }
  return payload
}

function ollamaChatUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? `${trimmed}/chat` : `${trimmed}/api/chat`
}

// ─── Workspace Handler (Phase 2.4+) ──────────────────────────────────────────
//
// Accepts a structured message array assembled by the client orchestrator.
// Supports Gemini function declarations when tools are provided.
// Returns: { response, toolCalls?, reasoning?, providerUsed, model }

async function handleWorkspace(
  reqData: any,
  credential: string,
  provider: SupportedProvider,
  aiModel: string
) {
  const providerStartedAt = performance.now()
  const {
    messages: rawMessages,
    tools: toolDeclarations,
    context,
  } = reqData

  if (provider === 'grok') {
    const messages = normalizeOpenAiMessages(
      rawMessages || [],
      WORKSPACE_RULES,
      typeof context?.serialized === 'string' ? `Context: ${context.serialized}` : ''
    )
    const payload = await fetchJson('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credential}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages,
        stream: false,
        ...(Array.isArray(toolDeclarations) && toolDeclarations.length > 0
          ? { tools: toOpenAiTools(toolDeclarations) }
          : {}),
      }),
    }, 'xAI')

    const message = payload?.choices?.[0]?.message
    const toolCalls = (message?.tool_calls || []).map((tc: any) => ({
      toolId: tc.function?.name,
      input: parseToolArgs(tc.function?.arguments),
    })).filter((tc: any) => tc.toolId)

    return json(withProviderTelemetry({
      response: message?.content || '',
      toolCalls,
      providerUsed: provider,
      model: payload?.model || aiModel,
    }, providerStartedAt))
  }

  if (provider === 'ollama') {
    const messages = normalizeOpenAiMessages(
      rawMessages || [],
      WORKSPACE_RULES,
      typeof context?.serialized === 'string' ? `Context: ${context.serialized}` : ''
    )
    const payload = await fetchJson(ollamaChatUrl(credential), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: aiModel,
        messages,
        stream: false,
        ...(Array.isArray(toolDeclarations) && toolDeclarations.length > 0
          ? { tools: toOpenAiTools(toolDeclarations) }
          : {}),
      }),
    }, 'Ollama')

    const message = payload?.message || {}
    const toolCalls = (message.tool_calls || []).map((tc: any) => ({
      toolId: tc.function?.name,
      input: parseToolArgs(tc.function?.arguments),
    })).filter((tc: any) => tc.toolId)

    return json(withProviderTelemetry({
      response: message.content || '',
      reasoning: message.thinking,
      toolCalls,
      providerUsed: provider,
      model: payload?.model || aiModel,
    }, providerStartedAt))
  }

  const apiKey = credential
  const genAI = new GoogleGenerativeAI(apiKey)

  // Validate model name against known valid Gemini model prefixes.
  // This prevents invalid names (e.g. 'gemini-flash-latest', 'gemini-3.x') from
  // reaching the Gemini API and returning a cryptic 400 error.
  const GEMINI_MODEL_FALLBACK = 'gemini-2.5-flash'
  const VALID_GEMINI_PREFIXES = [
    'gemini-2.5-', 'gemini-2.0-', 'gemini-1.5-', 'gemini-1.0-',
    'gemini-pro', 'gemini-ultra', 'gemini-nano',
  ]
  const isValidGeminiModel = typeof aiModel === 'string' &&
    VALID_GEMINI_PREFIXES.some(prefix => aiModel.startsWith(prefix))
  const resolvedModel = isValidGeminiModel ? aiModel : GEMINI_MODEL_FALLBACK
  if (!isValidGeminiModel) {
    console.warn(`[ai-handler] Invalid Gemini model "${aiModel}", using fallback: ${GEMINI_MODEL_FALLBACK}`)
  }
  // Extract system messages and build the system instruction
  // (Gemini treats all system messages as a single system instruction)
  const systemMessages = (rawMessages || [])
    .filter((m: any) => m.role === 'system')
    .map((m: any) => m.content)
    .join('\n\n')

  const systemInstruction = systemMessages || WORKSPACE_RULES

  // Build Gemini model config
  const modelConfig: any = {
    model: resolvedModel,
    systemInstruction,
  }

  // Attach function declarations if provided
  if (Array.isArray(toolDeclarations) && toolDeclarations.length > 0) {
    modelConfig.tools = [{ functionDeclarations: toolDeclarations }]
    // Use AUTO mode: model decides whether to call a function or respond with text
    modelConfig.toolConfig = { functionCallingConfig: { mode: 'AUTO' } }
  }

  const geminiModel = genAI.getGenerativeModel(modelConfig)

  // Convert non-system messages to Gemini history + final user message
  const nonSystemMessages = (rawMessages || []).filter((m: any) => m.role !== 'system')

  // All messages except the last user message go into history
  const historyMessages = nonSystemMessages.slice(0, -1)
  const lastMessage = nonSystemMessages[nonSystemMessages.length - 1]

  const geminiHistory = historyMessages
    .filter((m: any) => m.content?.trim())
    .map((m: any) => ({
      role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // Remove consecutive same-role messages (Gemini requirement)
  const cleanHistory: any[] = []
  let expectedRole = 'user'
  for (const msg of geminiHistory) {
    if (msg.role === expectedRole) {
      cleanHistory.push(msg)
      expectedRole = expectedRole === 'user' ? 'model' : 'user'
    }
  }

  const chat = geminiModel.startChat({ history: cleanHistory })
  const userText = lastMessage?.content || (
    // Legacy fallback: type=workspace with old-style context
    typeof context?.serialized === 'string' ? `Context: ${context.serialized}` : ''
  )

  if (!userText.trim()) {
    return json(withProviderTelemetry({ error: 'Missing user message' }, providerStartedAt), 400)
  }

  const result = await chat.sendMessage(userText)
  const candidate = result.response.candidates?.[0]

  // Check for function calls in the response
  const functionCallPart = candidate?.content?.parts?.find((p: any) => p.functionCall)
  if (functionCallPart?.functionCall) {
    const fc = functionCallPart.functionCall
    return json(withProviderTelemetry({
      response: '',
      toolCalls: [{
        toolId: fc.name,
        input: fc.args ?? {},
      }],
      providerUsed: provider,
      model: aiModel,
    }, providerStartedAt))
  }

  return json(withProviderTelemetry({
    response: result.response.text(),
    toolCalls: [],
    providerUsed: provider,
    model: resolvedModel,
  }, providerStartedAt))
}

async function generateLegacyResponse(
  provider: SupportedProvider,
  credential: string,
  aiModel: string,
  systemPrompt: string,
  resolvedInput: string,
  history: any[],
  type: string
) {
  const providerStartedAt = performance.now()
  if (provider === 'grok') {
    const messages = normalizeOpenAiMessages([
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: resolvedInput },
    ], systemPrompt)

    const payload = await fetchJson('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credential}`,
      },
      body: JSON.stringify({ model: aiModel, messages, stream: false }),
    }, 'xAI')

    return json(withProviderTelemetry({
      response: payload?.choices?.[0]?.message?.content || '',
      providerUsed: provider,
      model: payload?.model || aiModel,
    }, providerStartedAt))
  }

  if (provider === 'ollama') {
    const messages = normalizeOpenAiMessages([
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: resolvedInput },
    ], systemPrompt)

    const payload = await fetchJson(ollamaChatUrl(credential), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: aiModel,
        messages,
        stream: false,
        ...(type === 'schedule' ? { format: 'json' } : {}),
      }),
    }, 'Ollama')

    return json(withProviderTelemetry({
      response: payload?.message?.content || '',
      reasoning: payload?.message?.thinking,
      providerUsed: provider,
      model: payload?.model || aiModel,
    }, providerStartedAt))
  }

  const LEGACY_GEMINI_FALLBACK = 'gemini-2.5-flash'
  const VALID_LEGACY_PREFIXES = [
    'gemini-2.5-', 'gemini-2.0-', 'gemini-1.5-', 'gemini-1.0-',
    'gemini-pro', 'gemini-ultra',
  ]
  const isValidLegacyModel = typeof aiModel === 'string' &&
    VALID_LEGACY_PREFIXES.some(p => aiModel.startsWith(p))
  const safeModel = isValidLegacyModel ? aiModel : LEGACY_GEMINI_FALLBACK
  if (!isValidLegacyModel) {
    console.warn(`[ai-handler/legacy] Invalid model "${aiModel}", using ${LEGACY_GEMINI_FALLBACK}`)
  }

  const genAI = new GoogleGenerativeAI(credential)
  const geminiModel = genAI.getGenerativeModel({
    model: safeModel,
    systemInstruction: systemPrompt,
    ...(type === 'schedule' ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
  })

  const chat = geminiModel.startChat({ history: normalizeHistory(history || []) })
  const result = await chat.sendMessage(resolvedInput)
  return json(withProviderTelemetry({ response: result.response.text(), providerUsed: provider, model: safeModel }, providerStartedAt))
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization') ?? ''
    if (!authHeader) return json({ error: 'No Authorization header' }, 401)

    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const payload = decodeJWT(jwt)
    if (!payload?.sub) return json({ error: 'Invalid JWT' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

    const userId = payload.sub as string
    const reqData = await req.json()
    const { type, input, context, overrideProvider, model, history } = reqData

    // Fetch user settings + API keys
    const [settingsRes, keysRes] = await Promise.all([
      supabaseClient
        .from('ai_settings')
        .select('default_provider, active_model')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseClient
        .from('ai_keys')
        .select('provider, api_key')
        .eq('user_id', userId),
    ])

    const provider = normalizeProvider(overrideProvider || settingsRes.data?.default_provider || 'gemini')
    const storedCredential = (keysRes.data || []).find((k: any) => k.provider === provider)?.api_key
    const credential = getProviderCredential(provider, storedCredential)
    const aiModel = model || settingsRes.data?.active_model || DEFAULT_MODELS[provider]

    // ── Phase 2.4+ structured workspace requests ──────────────────────────────
    if (type === 'workspace' && Array.isArray(reqData.messages)) {
      if (!credential) return json({ error: `No ${provider} configuration found` }, 400)
      return await handleWorkspace(reqData, credential, provider, aiModel)
    }

    // ── Legacy request types (backward compat) ────────────────────────────────
    const contextStr =
      typeof context?.serialized === 'string' ? context.serialized : JSON.stringify(context || {})

    const systemPrompt =
      type === 'schedule'
        ? `${SCHEDULE_RULES}\nContext: ${contextStr}`
        : `${GLOBAL_RULES}\nContext: ${contextStr}`

    if (['chat', 'reflection', 'challenge', 'insight', 'schedule'].includes(type)) {
      if (!credential) return json({ error: `No ${provider} configuration found` }, 400)

      const fallbackInputs: Record<string, string> = {
        challenge: `Create a concise weekly challenge from these pending tasks: ${(context?.tasks || '').toString()}`,
        insight: 'Give me a very short encouraging insight based on the provided context.',
        reflection: 'Write a short weekly reflection based on the provided context.',
        schedule: 'Turn the provided brain dump into a structured weekly plan.',
        chat: input || '',
      }

      const resolvedInput = (input?.trim() || fallbackInputs[type] || '').trim()
      if (!resolvedInput) return json({ error: 'Missing input' }, 400)

      return await generateLegacyResponse(provider, credential, aiModel, systemPrompt, resolvedInput, history || [], type)
    }

    return json({ error: 'Unsupported request type' }, 400)
  } catch (error: any) {
    return json({ error: error.message }, error instanceof ProviderRequestError ? error.status : 500)
  }
})
