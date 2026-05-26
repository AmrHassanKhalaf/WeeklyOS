import { assembleContext, serializeContextForLLM } from '../context'
import { getWorkspaceModeDefinition } from '../modes'
import { buildModePrompt, buildWorkspaceSystemPrompt } from '../prompts'
import { defaultAIToolRegistry, type AIToolRegistry } from '../tools'
import { executeTool } from '../tools/executor'
import type {
  AIContext,
  AIMessage,
  AIProvider,
  AIProviderToolCall,
  AITool,
  AIToolId,
  WorkspaceMode,
} from '../types'
import { buildBrainDumpUIBlocks } from '../brain-dump/blocks'
import type { BrainDumpExtraction } from '../brain-dump/types'
import { buildPlanningUIBlocks } from '../planning/blocks'
import type { PlanningResult } from '../planning/types'
import { buildReflectionUIBlocks } from '../reflection/blocks'
import type { ReflectionResult } from '../reflection/types'
import type {
  OrchestratorRequest,
  OrchestratorResponse,
  OrchestratorToolCall,
  OrchestratorUIBlock,
  PendingToolConfirmation,
} from './types'

// ─── Prepared Request (internal) ─────────────────────────────────────────────

export interface AIOrchestratorPreparedRequest {
  mode: WorkspaceMode
  context: AIContext
  messages: AIMessage[]
  tools: AITool[]
}

// ─── Orchestrator Interface ───────────────────────────────────────────────────

export interface AIOrchestrator {
  /**
   * Build the full AI payload (messages + tools) without calling the provider.
   * Useful for inspection, testing, or passing to a custom provider.
   */
  prepare: (request: OrchestratorRequest) => AIOrchestratorPreparedRequest
  /**
   * Full execution: prepare → provider → process tool calls → structured response.
   */
  execute: (request: OrchestratorRequest) => Promise<OrchestratorResponse>
}

export interface AIOrchestratorOptions {
  provider?: AIProvider
  toolRegistry?: AIToolRegistry
}

// ─── Tool Call Processing ─────────────────────────────────────────────────────

async function processToolCalls(
  toolCalls: AIProviderToolCall[],
  registry: AIToolRegistry,
  context: AIContext,
  mode: WorkspaceMode
): Promise<{
  executed: OrchestratorToolCall[]
  pending: PendingToolConfirmation[]
}> {
  const executed: OrchestratorToolCall[] = []
  const pending: PendingToolConfirmation[] = []

  for (const tc of toolCalls) {
    const tool = registry.get(tc.toolId as AIToolId)
    if (!tool) continue

    const execResult = await executeTool(tool, tc.input, { aiContext: context, mode })

    if (execResult.status === 'pending_confirmation') {
      pending.push({
        confirmationId: `${tc.toolId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        toolId: tc.toolId as AIToolId,
        toolName: tool.name,
        input: tc.input,
        proposedOutput: execResult.output,
      })
    } else {
      executed.push({
        toolId: tc.toolId as AIToolId,
        toolName: tool.name,
        input: tc.input,
        result: { ok: execResult.ok, output: execResult.output, error: execResult.error },
        executionStatus: execResult.status,
      })
    }
  }

  return { executed, pending }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAIOrchestrator(options: AIOrchestratorOptions = {}): AIOrchestrator {
  const toolRegistry = options.toolRegistry ?? defaultAIToolRegistry

  // ── Prepare ────────────────────────────────────────────────────────────────
  const prepare = (request: OrchestratorRequest): AIOrchestratorPreparedRequest => {
    const { mode, context, userMessage, history = [] } = request

    // Build the context summary for the system prompt
    const assembled = assembleContext(context, mode, history)
    const contextSummary = serializeContextForLLM(assembled)

    // System prompt stack
    const messages: AIMessage[] = [
      buildWorkspaceSystemPrompt(),
      buildModePrompt(mode),
      { role: 'system', content: `[Workspace Context]\n${contextSummary}` },
    ]

    // Inject conversation history (skip system messages from history)
    for (const turn of history) {
      const role = turn.role === 'assistant' || turn.role === 'ai' ? 'assistant' : 'user'
      if (turn.content?.trim()) {
        messages.push({ role: role as AIMessage['role'], content: turn.content.trim() })
      }
    }

    // Append the current user message
    messages.push({ role: 'user', content: userMessage })

    // Resolve tools allowed for this mode
    const modeDefinition = getWorkspaceModeDefinition(mode)
    const tools = toolRegistry.resolve(modeDefinition.allowedToolIds)

    return { mode, context, messages, tools }
  }

  // ── Execute ────────────────────────────────────────────────────────────────
  const execute = async (request: OrchestratorRequest): Promise<OrchestratorResponse> => {
    if (!options.provider) {
      throw new Error(
        'No AI provider is configured. Connect a provider before calling execute().'
      )
    }

    const prepared = prepare(request)

    // Call the provider
    const providerResponse = await options.provider.generate({
      messages: prepared.messages,
      tools: prepared.tools,
      mode: request.mode,
      model: request.overrideModel,
    })

    // Process any tool calls the provider returned
    const { executed, pending } = await processToolCalls(
      providerResponse.toolCalls ?? [],
      toolRegistry,
      request.context,
      request.mode
    )

    // Post-process: convert known tool outputs into structured UI blocks
    const uiBlocks: OrchestratorUIBlock[] = []
    for (const tc of executed) {
      if (tc.toolId === 'organizeBrainDump' && tc.result?.ok && tc.result.output) {
        const extraction = tc.result.output as BrainDumpExtraction
        uiBlocks.push(...buildBrainDumpUIBlocks(extraction))
      }
      if (
        (tc.toolId === 'generateWeekPlan' ||
          tc.toolId === 'generateDayPlan' ||
          tc.toolId === 'rescheduleTasks') &&
        tc.result?.ok &&
        tc.result.output
      ) {
        const plan = tc.result.output as PlanningResult
        uiBlocks.push(...buildPlanningUIBlocks(plan))
      }
      if (
        (tc.toolId === 'summarizeWeek' || tc.toolId === 'summarizeReflection') &&
        tc.result?.ok &&
        tc.result.output
      ) {
        const reflection = tc.result.output as ReflectionResult
        uiBlocks.push(...buildReflectionUIBlocks(reflection))
      }
    }
    // Also check pending (rescheduleTasks returns pending_confirmation but still has output)
    for (const pc of pending) {
      if (pc.toolId === 'rescheduleTasks' && pc.proposedOutput) {
        const plan = pc.proposedOutput as PlanningResult
        uiBlocks.push(...buildPlanningUIBlocks(plan))
      }
    }

    return {
      message: providerResponse.message.content,
      reasoning: providerResponse.reasoning,
      toolCalls: executed.length > 0 ? executed : undefined,
      pendingConfirmations: pending.length > 0 ? pending : undefined,
      uiBlocks: uiBlocks.length > 0 ? uiBlocks : undefined,
      provider: providerResponse.provider,
      model: providerResponse.model,
      fromTool: (providerResponse.toolCalls?.length ?? 0) > 0,
    }
  }

  return { prepare, execute }
}
