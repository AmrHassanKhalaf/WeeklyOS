import type { OrchestratorUIBlock } from '../orchestrator/types'
import type { PlanningResult } from './types'

// ─── Risk Color Signals ───────────────────────────────────────────────────────

const RISK_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High pressure',
  medium: 'Moderate load',
  low: 'Light week',
  balanced: 'Balanced',
}

// ─── UI Block Builders ────────────────────────────────────────────────────────

/**
 * Converts a `PlanningResult` into structured UI blocks for rich workspace display.
 *
 * Block order:
 * 1. Planning summary — risk level, headline, key stats
 * 2. Overload warnings — days that need immediate attention
 * 3. Prioritized tasks — top tasks with scores + reasoning
 * 4. Rebalance proposals — proposed task moves (require confirmation)
 * 5. Focus blocks — suggested deep-work windows
 * 6. Recommendations — strategic advice with reasoning
 */
export function buildPlanningUIBlocks(plan: PlanningResult): OrchestratorUIBlock[] {
  const blocks: OrchestratorUIBlock[] = []

  // ── 1. Summary ────────────────────────────────────────────────────────────
  blocks.push({
    kind: 'planning_summary',
    title: `Plan — ${RISK_LABELS[plan.summary.riskLevel] ?? 'Analysis'}`,
    content: buildSummaryContent(plan),
    data: {
      riskLevel: plan.summary.riskLevel,
      overallPressure: plan.summary.overallPressure,
      mode: plan.mode,
    },
  })

  // ── 2. Overload warnings (before tasks to catch attention first) ──────────
  if (plan.warnings.length > 0) {
    const critical = plan.warnings.filter((w) => w.severity === 'critical' || w.severity === 'high')
    if (critical.length > 0) {
      blocks.push({
        kind: 'planning_overload',
        title: `Overload Warnings (${critical.length})`,
        content: critical.map((w) => `• ${w.message}`).join('\n'),
        data: critical,
      })
    }
  }

  // ── 3. Prioritized tasks ──────────────────────────────────────────────────
  if (plan.prioritizedTasks.length > 0) {
    blocks.push({
      kind: 'planning_tasks',
      title: `Top ${Math.min(plan.prioritizedTasks.length, 7)} Prioritized Tasks`,
      content: plan.prioritizedTasks
        .slice(0, 7)
        .map((t) => {
          const parts = [`• ${t.title}`]
          if (t.priority === 'high') parts.push('[high]')
          if (t.isCarryOver) parts.push('[carry-over]')
          if (t.day) parts.push(`→ ${t.day}`)
          parts.push(`[${t.focusType.replace('_', ' ')}]`)
          return parts.join(' ')
        })
        .join('\n'),
      data: plan.prioritizedTasks.slice(0, 7),
    })
  }

  // ── 4. Rebalance proposals ─────────────────────────────────────────────────
  if (plan.rebalanceSuggestions.length > 0) {
    blocks.push({
      kind: 'planning_rebalance',
      title: `Rebalance Proposals (${plan.rebalanceSuggestions.length}) — Confirm to Apply`,
      content: plan.rebalanceSuggestions
        .map(
          (r) =>
            `• Move "${r.taskTitle}" from ${r.fromDayLabel} → ${r.toDayLabel}\n  ${r.reason}`
        )
        .join('\n'),
      data: plan.rebalanceSuggestions,
    })
  }

  // ── 5. Focus blocks ───────────────────────────────────────────────────────
  if (plan.suggestedFocusBlocks.length > 0) {
    blocks.push({
      kind: 'planning_focus_blocks',
      title: `Focus Block Suggestions (${plan.suggestedFocusBlocks.length})`,
      content: plan.suggestedFocusBlocks
        .map((b) => {
          const parts = [`• ${b.label}`]
          if (b.recommendedDayLabel) parts.push(`→ ${b.recommendedDayLabel}`)
          if (b.durationMinutes) parts.push(`(~${b.durationMinutes} min)`)
          parts.push(`\n  ${b.reason}`)
          return parts.join(' ')
        })
        .join('\n'),
      data: plan.suggestedFocusBlocks,
    })
  }

  // ── 6. Recommendations ───────────────────────────────────────────────────
  if (plan.recommendations.length > 0) {
    blocks.push({
      kind: 'planning_recommendations',
      title: `Planning Recommendations (${plan.recommendations.length})`,
      content: plan.recommendations
        .map((r) => {
          const urgencyLabel = r.urgency === 'high' ? ' [urgent]' : ''
          return `• ${r.message}${urgencyLabel}\n  ↳ ${r.reasoning}`
        })
        .join('\n'),
      data: plan.recommendations,
    })
  }

  return blocks
}

// ─── Summary Content Builder ──────────────────────────────────────────────────

function buildSummaryContent(plan: PlanningResult): string {
  const { summary, workloadAnalysis: wa } = plan
  const lines: string[] = []

  lines.push(summary.headline)
  lines.push('')

  const stats = [
    `Pending: ${summary.totalPending}`,
    summary.highPriorityCount > 0 ? `High priority: ${summary.highPriorityCount}` : '',
    summary.overloadedDayCount > 0 ? `Overloaded days: ${summary.overloadedDayCount}` : '',
    `Completion: ${summary.completionRate}%`,
    summary.focusMinutesLogged > 0 ? `Focus: ${summary.focusMinutesLogged} min` : '',
  ].filter(Boolean)

  lines.push(stats.join(' • '))

  if (wa.pressureReasons.length > 0) {
    lines.push('')
    for (const reason of wa.pressureReasons.slice(0, 3)) {
      lines.push(`• ${reason}`)
    }
  }

  if (summary.topPriorityTitle) {
    lines.push('')
    lines.push(`Top priority: "${summary.topPriorityTitle}"`)
  }

  return lines.join('\n')
}
