import { getWorkspaceModeDefinition } from '../../modes'
import type { ModeContextLayer, WorkspaceContextLayer, WorkspaceMode } from '../../types'

// ─── Mode-specific AI focus instructions ─────────────────────────────────────

const MODE_FOCUS: Record<WorkspaceMode, string[]> = {
  analyze: [
    'Identify workload concentration and risk days',
    'Diagnose focus quality from session data',
    'Surface completion and pending task patterns',
  ],
  plan: [
    'Prioritize pending tasks by energy and priority',
    'Rebalance overloaded days before adding new work',
    'Protect high-output windows for deep focus blocks',
  ],
  reflect: [
    'Connect completed work to weekly objectives',
    'Extract lessons from struggles and incomplete tasks',
    'Generate concrete next-week behaviors from this week',
  ],
  chat: [
    'Answer contextual questions using live workspace data',
    'Suggest next actions based on pending load',
    'Explain workspace state in plain language',
  ],
}

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Produces a mode-scoped context layer that tells the AI what to focus on
 * and surfaces the most relevant productivity signals for the active mode.
 */
export function buildModeContext(mode: WorkspaceMode, workspace: WorkspaceContextLayer): ModeContextLayer {
  const definition = getWorkspaceModeDefinition(mode)
  const relevantSignals: string[] = []

  if (workspace.riskCount > 0) {
    relevantSignals.push(`${workspace.riskDay} overloaded — ${workspace.riskCount} pending tasks`)
  }
  if (workspace.focusMinutes > 0) {
    relevantSignals.push(`${workspace.focusMinutes} focus minutes logged`)
  }
  if (workspace.completionRate > 0) {
    relevantSignals.push(`${workspace.completionRate}% completion rate`)
  }
  if (workspace.brainDumpCount > 0) {
    relevantSignals.push(`${workspace.brainDumpCount} brain dump items waiting`)
  }
  if (workspace.reflections.wentWell || workspace.reflections.struggle) {
    relevantSignals.push('Reflection notes captured')
  }

  return {
    mode,
    label: definition.label,
    focus: MODE_FOCUS[mode],
    relevantSignals,
  }
}
