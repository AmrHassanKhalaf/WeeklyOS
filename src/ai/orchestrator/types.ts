import type { AIActionId, AIContext, AIToolId, AIToolResult, WorkspaceMode } from '../types'
import type { ConversationTurn } from '../context/layers/conversationContext'

// ─── Orchestrator Request ─────────────────────────────────────────────────────

/**
 * Everything the orchestrator needs to build and dispatch a full AI request.
 * This is the entry point from any UI layer — it carries no raw display state,
 * only semantic workspace data.
 */
export interface OrchestratorRequest {
  userMessage: string
  mode: WorkspaceMode
  context: AIContext
  history?: ConversationTurn[]
  /** Override the configured provider (e.g. for testing). */
  overrideProvider?: string
  /** Override the configured model (e.g. for testing). */
  overrideModel?: string
}

// ─── Tool Call / Confirmation Types ──────────────────────────────────────────

/**
 * A tool call that was executed and returned a result.
 * Read-only tools appear here; write tools move to pendingConfirmations.
 */
export interface OrchestratorToolCall {
  toolId: AIToolId
  toolName: string
  input: Record<string, unknown>
  result?: AIToolResult
  executionStatus?: string
}

/**
 * A write-tool call that produced a proposed output and is now waiting for
 * the user to confirm or dismiss before the store is mutated.
 */
export interface PendingToolConfirmation {
  /** Unique ID used by the UI to reference this confirmation. */
  confirmationId: string
  toolId: AIToolId
  toolName: string
  input: Record<string, unknown>
  proposedOutput: unknown
}

// ─── UI Block Types ───────────────────────────────────────────────────────────

export type OrchestratorUIBlockKind =
  | 'insight'
  | 'plan_summary'
  | 'task_list'
  | 'reflection_summary'
  | 'reschedule_proposal'
  | 'warning'

/**
 * A structured display block that can be rendered as a rich card in the UI,
 * rather than as plain text inside the message bubble.
 */
export interface OrchestratorUIBlock {
  kind: OrchestratorUIBlockKind
  title: string
  content: string
  /** Typed data for the specific block kind — consumed by the rendering layer. */
  data?: unknown
}

// ─── Orchestrator Response ────────────────────────────────────────────────────

/**
 * The normalized, structured response produced by the orchestrator after it
 * has assembled the request, called the provider, and processed any tool calls.
 *
 * This replaces the raw text response that previously came from the edge function
 * directly. Every field except `message` is optional — the response may be a
 * plain text reply with no tools, or a complex multi-tool flow.
 */
export interface OrchestratorResponse {
  /** Primary text message for the user. */
  message: string
  /** Internal reasoning trace, when provided by the model. */
  reasoning?: string
  /** Action IDs the orchestrator suggests the user consider next. */
  suggestedActions?: AIActionId[]
  /** Read-tool calls that ran synchronously and returned results. */
  toolCalls?: OrchestratorToolCall[]
  /** Write-tool proposals awaiting user confirmation. */
  pendingConfirmations?: PendingToolConfirmation[]
  /** Structured display blocks for richer UI rendering. */
  uiBlocks?: OrchestratorUIBlock[]
  /** Provider that handled the response. */
  provider?: string
  model?: string
  /** True when the response was generated primarily from a tool result. */
  fromTool?: boolean
  metadata?: Record<string, unknown>
}
