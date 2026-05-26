import type { AIContext, AITool, AIToolResult, WorkspaceMode } from '../types'
import { formatValidationErrors, validateToolInput, type ToolValidationResult } from './validation'

// ─── Execution Types ──────────────────────────────────────────────────────────

/**
 * Describes the outcome status of a tool execution attempt.
 *
 * - `success`              → tool ran and produced output
 * - `pending_confirmation` → tool requires user confirmation before changes take effect
 * - `validation_error`     → input did not pass schema validation
 * - `not_implemented`      → tool has no execute function yet
 * - `error`                → tool threw an unexpected error
 */
export type ToolExecutionStatus =
  | 'success'
  | 'pending_confirmation'
  | 'validation_error'
  | 'not_implemented'
  | 'error'

/** Extended AIToolResult that adds execution metadata for the orchestrator layer. */
export interface AIToolExecutionResult<Output = unknown> extends AIToolResult<Output> {
  status: ToolExecutionStatus
  validation?: ToolValidationResult
  /** True when the tool produced a proposed output but has not yet been committed. */
  pendingConfirmation?: boolean
}

// ─── Execution Context ────────────────────────────────────────────────────────

/**
 * The context passed to the executor.
 * Provides the normalized workspace data and active mode to all tools.
 */
export interface ToolExecutionContext {
  aiContext: AIContext
  mode: WorkspaceMode
}

// ─── Executor ─────────────────────────────────────────────────────────────────

/**
 * Centralized tool execution gateway.
 *
 * Responsibilities:
 * 1. Validate the raw input against the tool's input schema
 * 2. Dispatch to the tool's `execute` function if present
 * 3. Mark write-tools as `pending_confirmation` so the orchestrator can
 *    route them to a confirmation step before touching the store
 * 4. Wrap all errors into a typed, structured result
 *
 * Tools are NOT coupled to UI or store — they receive only `AIContext` and
 * return structured data. Store mutations happen outside this layer.
 */
export async function executeTool<Input extends object, Output>(
  tool: AITool<Input, Output>,
  input: unknown,
  execContext: ToolExecutionContext
): Promise<AIToolExecutionResult<Output>> {
  const safeInput = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>

  // ── 1. Validate input ──────────────────────────────────────────────────────
  const validation = validateToolInput(tool.inputSchema, safeInput)
  if (!validation.valid) {
    return {
      ok: false,
      status: 'validation_error',
      error: `Invalid tool input for "${tool.id}": ${formatValidationErrors(validation)}`,
      validation,
    }
  }

  // ── 2. Guard — no execute function ────────────────────────────────────────
  if (!tool.execute) {
    return {
      ok: false,
      status: 'not_implemented',
      error: `Tool "${tool.id}" does not have an execute function yet.`,
      validation,
    }
  }

  // ── 3. Execute ────────────────────────────────────────────────────────────
  try {
    const result: AIToolResult<Output> = await tool.execute(
      safeInput as Input,
      execContext.aiContext
    )

    // Write-tools that require confirmation are always `pending_confirmation`
    // regardless of what their execute function returns.
    const isPending = tool.requiresConfirmation
    return {
      ...result,
      status: isPending ? 'pending_confirmation' : result.ok ? 'success' : 'error',
      pendingConfirmation: isPending || undefined,
      validation,
    }
  } catch (err) {
    return {
      ok: false,
      status: 'error',
      error: err instanceof Error ? err.message : `Unexpected error in tool "${tool.id}"`,
      validation,
    }
  }
}
