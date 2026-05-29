import type { AIContext } from '../types'
import type {
  PlanningSummary,
  PlanningOptions,
  PlanningResult,
  RiskLevel,
} from './types'
import { analyzeWorkload } from './stages/workloadAnalyzer'
import { prioritizeTasks } from './stages/taskPrioritizer'
import { allocateFocusBlocks } from './stages/focusAllocator'
import {
  generateCarryOverProposals,
  generateRebalanceProposals,
} from './stages/rebalanceEngine'
import { buildRecommendations, buildWarnings } from './stages/recommendationBuilder'

// ─── Headline Builder ─────────────────────────────────────────────────────────

const RISK_HEADLINES: Record<RiskLevel, (pending: number, overloaded: number) => string> = {
  critical: (p) => `Critical workload — ${p} pending tasks, immediate rebalancing needed`,
  high: (p, o) => `High pressure week — ${p} pending across ${o} overloaded day${o > 1 ? 's' : ''}`,
  medium: (p) => `Moderate load — ${p} pending tasks, planning will help`,
  low: (p) => `Light week — ${p} pending tasks, good conditions for deep work`,
  balanced: () => 'Balanced week — no overload detected, focus on quality',
}

function buildHeadline(risk: RiskLevel, pending: number, overloaded: number): string {
  return RISK_HEADLINES[risk](pending, overloaded)
}

// ─── Planning Reasoning ───────────────────────────────────────────────────────

function buildPlanningReasoning(
  result: Omit<PlanningResult, 'planningReasoning' | 'generatedAt'>
): string[] {
  const lines: string[] = []
  const { workloadAnalysis: wa, prioritizedTasks: pt, rebalanceSuggestions: rb } = result

  if (wa.carryOverCount > 0) {
    lines.push(
      `${wa.carryOverCount} carry-over task${wa.carryOverCount > 1 ? 's' : ''} were elevated in priority because they missed their original scheduled day.`
    )
  }

  if (wa.overloadedDays.length > 0) {
    const names = wa.overloadedDays.map((d) => d.shortName).join(', ')
    lines.push(
      `Overloaded days detected: ${names}. Tasks on these days received a priority score penalty to signal that rescheduling should be considered.`
    )
  }

  if (wa.peakDay && wa.peakDayLabel) {
    lines.push(
      `${wa.peakDayLabel} is flagged as the peak output day based on historical completion counts — focus blocks are recommended there.`
    )
  }

  if (pt.some((t) => t.focusType === 'deep')) {
    const deepCount = pt.filter((t) => t.focusType === 'deep').length
    lines.push(
      `${deepCount} task${deepCount > 1 ? 's' : ''} identified as deep-focus work. Batching them together reduces context-switching overhead.`
    )
  }

  if (rb.length > 0) {
    lines.push(
      `${rb.length} rebalance proposal${rb.length > 1 ? 's' : ''} generated. All require explicit user confirmation before any task moves are applied.`
    )
  }

  if (wa.completionRate >= 70) {
    lines.push(`Completion rate is ${wa.completionRate}% — strong execution momentum this week.`)
  } else if (wa.completionRate > 0 && wa.completionRate < 40) {
    lines.push(
      `Completion rate is ${wa.completionRate}%. Consider reducing planned scope to improve throughput.`
    )
  }

  return lines
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * The Planning Engine pipeline.
 *
 * Stages:
 * 1. Workload analysis  — pressure scores, overload detection, risk level
 * 2. Task prioritization — composite score with explicit reasoning per task
 * 3. Focus allocation   — theme grouping + focus block suggestions
 * 4. Rebalance engine   — concrete overload-relief proposals (requires confirmation)
 * 5. Recommendations    — synthesized, actionable advice with reasoning
 * 6. Warnings           — immediate risks that need attention
 * 7. Planning reasoning — transparency log explaining key decisions
 *
 * All output is proposal-based. Nothing mutates the store.
 */
export function runPlanningPipeline(
  context: AIContext,
  options: PlanningOptions = { mode: 'week' }
): PlanningResult {
  const { mode, targetDay, focusObjective, constraints = [], maxRebalanceProposals = 3, maxRecommendations = 5 } =
    options

  // ── Stage 1: Workload Analysis ───────────────────────────────────────────
  const workloadAnalysis = analyzeWorkload(context)

  // ── Stage 2: Task Prioritization ─────────────────────────────────────────
  // In day mode, filter to just the target day + unscheduled tasks
  const filteredContext =
    mode === 'day' && targetDay
      ? {
          ...context,
          tasks: {
            ...context.tasks,
            items: context.tasks.items.filter(
              (t) => t.status === 'pending' && (t.day === targetDay || !t.day)
            ),
          },
        }
      : context

  const prioritizedTasks = prioritizeTasks(filteredContext, workloadAnalysis)

  // ── Stage 3: Focus Allocation ─────────────────────────────────────────────
  const { focusAreas, suggestedFocusBlocks } = allocateFocusBlocks(
    prioritizedTasks,
    workloadAnalysis,
    context
  )

  // ── Stage 4: Rebalance Engine ─────────────────────────────────────────────
  const rebalanceSuggestions = [
    ...generateCarryOverProposals(context, workloadAnalysis, 1),
    ...generateRebalanceProposals(context, workloadAnalysis, maxRebalanceProposals),
  ].slice(0, maxRebalanceProposals)

  // ── Stage 5: Recommendations ──────────────────────────────────────────────
  const recommendations = buildRecommendations(
    workloadAnalysis,
    prioritizedTasks,
    rebalanceSuggestions,
    context,
    maxRecommendations
  )

  // ── Stage 6: Warnings ─────────────────────────────────────────────────────
  const warnings = buildWarnings(workloadAnalysis, context)

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary: PlanningSummary = {
    mode,
    riskLevel: workloadAnalysis.riskLevel,
    headline: buildHeadline(
      workloadAnalysis.riskLevel,
      workloadAnalysis.pendingTotal,
      workloadAnalysis.overloadedDays.length
    ),
    overallPressure: workloadAnalysis.overallPressure,
    totalPending: workloadAnalysis.pendingTotal,
    highPriorityCount: workloadAnalysis.highPriorityPending,
    overloadedDayCount: workloadAnalysis.overloadedDays.length,
    focusMinutesLogged: context.focus.totalMinutes,
    completionRate: workloadAnalysis.completionRate,
    topPriorityTitle: prioritizedTasks[0]?.title,
  }

  const partial = {
    mode,
    context: {
      weekTitle: context.week.title,
      today: context.today?.label,
      completionRate: context.metrics.completionRate,
      focusMinutes: context.focus.totalMinutes,
    },
    summary,
    workloadAnalysis,
    focusAreas,
    prioritizedTasks,
    suggestedFocusBlocks,
    rebalanceSuggestions,
    warnings,
    recommendations,
  }

  // ── Stage 7: Planning Reasoning ───────────────────────────────────────────
  const planningReasoning = buildPlanningReasoning(partial)

  // Add constraint notes to reasoning
  for (const c of constraints) {
    planningReasoning.push(`Constraint acknowledged: ${c}`)
  }
  if (focusObjective) {
    planningReasoning.push(`Primary objective set: "${focusObjective}"`)
  }

  return {
    ...partial,
    planningReasoning,
    generatedAt: new Date().toISOString(),
  }
}
