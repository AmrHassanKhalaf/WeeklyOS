import type { AIContext, AssembledAIContext, WorkspaceMode } from '../types'
import { buildBaseContext } from './layers/baseContext'
import { buildConversationContext, type ConversationTurn } from './layers/conversationContext'
import { buildModeContext } from './layers/modeContext'
import { buildWorkspaceContext } from './layers/workspaceContext'

// ─── Assembler ────────────────────────────────────────────────────────────────

/**
 * Assembles all four context layers from a normalized AIContext plus the
 * active mode and optional conversation history.
 *
 * The assembled context is the single source of truth for any AI request
 * originating from the workspace. It is NOT coupled to UI components — the
 * same function is safe to call from hooks, orchestrators, or edge functions.
 */
export function assembleContext(
  context: AIContext,
  mode: WorkspaceMode,
  history: ConversationTurn[] = []
): AssembledAIContext {
  const base = buildBaseContext(context)
  const workspace = buildWorkspaceContext(context)
  const modeLayer = buildModeContext(mode, workspace)
  const conversation = buildConversationContext(history)

  return { base, workspace, mode: modeLayer, conversation }
}

// ─── Serializer ───────────────────────────────────────────────────────────────

/**
 * Serializes an AssembledAIContext into a compact, plain-text string suitable
 * for use as a system-prompt context block.
 *
 * Design goals:
 * - Token-efficient: no JSON nesting, no repeated field names
 * - Human-readable: the LLM can parse it without extra instructions
 * - Structured: clear sections with consistent formatting
 * - Safe: no raw database rows or user-identifiable metadata beyond the week
 */
export function serializeContextForLLM(assembled: AssembledAIContext): string {
  const { base, workspace, mode: modeCtx } = assembled
  const lines: string[] = []

  // ─── Week header ──────────────────────────────────────────────────────────
  const weekParts = [`Week ${base.weekNumber ?? '--'}`]
  if (base.dateRange) weekParts.push(`(${base.dateRange})`)
  weekParts.push(`| Score: ${base.score}%`, `| Completion: ${base.completionRate}%`)
  lines.push(weekParts.join(' '))

  // ─── Task summary ─────────────────────────────────────────────────────────
  const highPendingCount = workspace.topPendingTasks.filter((t) => t.priority === 'high').length
  const taskLine =
    `Tasks: ${workspace.pendingCount} pending, ${workspace.completedCount} done` +
    (highPendingCount > 0 ? ` | ${highPendingCount} high priority pending` : '')
  lines.push(taskLine)

  // ─── Risk / overload ──────────────────────────────────────────────────────
  if (workspace.riskCount > 0) {
    const riskLine =
      `Overloaded day: ${workspace.riskDay} — ${workspace.riskCount} pending` +
      (workspace.riskHighEffortCount > 0 ? ` (${workspace.riskHighEffortCount} high priority)` : '') +
      (workspace.riskTaskTitles.length ? `: ${workspace.riskTaskTitles.join(', ')}` : '')
    lines.push(riskLine)
  }

  // ─── Peak day & today ─────────────────────────────────────────────────────
  const peakTodayParts = [`Peak output: ${workspace.peakDay}`]
  if (workspace.todayLabel !== 'Today') {
    peakTodayParts.push(`| Today: ${workspace.todayLabel} — ${workspace.todayTaskCount} tasks`)
  }
  lines.push(peakTodayParts.join(' '))

  // ─── Focus ────────────────────────────────────────────────────────────────
  if (workspace.focusSessionCount > 0) {
    lines.push(`Focus: ${workspace.focusSessionCount} sessions, ${workspace.focusMinutes} min total`)
  } else {
    lines.push('Focus: no sessions logged this week')
  }

  // ─── Habits ───────────────────────────────────────────────────────────────
  if (workspace.habitCount > 0) {
    lines.push(`Habits: ${workspace.habitCount} active | ${workspace.habitCompletionCount} completions`)
  }

  // ─── Brain dump ───────────────────────────────────────────────────────────
  if (workspace.brainDumpCount > 0) {
    lines.push(
      `Brain dump: ${workspace.brainDumpCount} items (${workspace.brainDumpSelectedCount} selected)`
    )
  }

  // ─── Reflections ──────────────────────────────────────────────────────────
  const hasReflections =
    workspace.reflections.wentWell || workspace.reflections.struggle || workspace.reflections.lessons
  if (hasReflections) {
    lines.push('Reflections: captured')
    if (workspace.reflections.wentWell) {
      lines.push(`• Wins: ${workspace.reflections.wentWell.slice(0, 120)}`)
    }
    if (workspace.reflections.struggle) {
      lines.push(`• Struggles: ${workspace.reflections.struggle.slice(0, 120)}`)
    }
    if (workspace.reflections.lessons) {
      lines.push(`• Lessons: ${workspace.reflections.lessons.slice(0, 120)}`)
    }
  } else {
    lines.push('Reflections: none captured yet')
  }

  // ─── Mode context ─────────────────────────────────────────────────────────
  lines.push('')
  lines.push(`Mode: ${modeCtx.label}`)
  lines.push(`Focus: ${modeCtx.focus.join('; ')}`)
  if (modeCtx.relevantSignals.length > 0) {
    lines.push(`Key signals: ${modeCtx.relevantSignals.join('; ')}`)
  }

  return lines.join('\n')
}
