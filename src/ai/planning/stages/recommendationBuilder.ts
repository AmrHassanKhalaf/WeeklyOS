import type { AIContext } from '../../types'
import type {
  PlanningRecommendation,
  PlanningWarning,
  PrioritizedTask,
  RebalanceProposal,
  WorkloadAnalysis,
} from '../types'


// ─── Warning Generators ───────────────────────────────────────────────────────

export function buildWarnings(
  workload: WorkloadAnalysis,
  context: AIContext
): PlanningWarning[] {
  const warnings: PlanningWarning[] = []

  // Overload warnings
  for (const day of workload.overloadedDays) {
    warnings.push({
      kind: 'overload',
      message: `${day.shortName} has ${day.totalPending} pending tasks (${day.highPriorityPending} high priority) — overload risk`,
      affectedDay: day.day,
      severity: day.highPriorityPending >= 3 ? 'critical' : 'high',
    })
  }

  // Carry-over accumulation
  if (workload.carryOverCount >= 3) {
    warnings.push({
      kind: 'carryover_buildup',
      message: `${workload.carryOverCount} tasks from past scheduled days are still pending — carry-over is building`,
      severity: workload.carryOverCount >= 5 ? 'critical' : 'high',
    })
  }

  // No focus sessions
  if (context.focus.sessionCount === 0 && workload.pendingTotal > 4) {
    warnings.push({
      kind: 'no_focus_time',
      message: 'No focus sessions logged with significant pending work — deep focus patterns are invisible',
      severity: 'medium',
    })
  }

  // Unrealistic scope: pending > 15 tasks
  if (workload.pendingTotal > 15) {
    warnings.push({
      kind: 'unrealistic_scope',
      message: `${workload.pendingTotal} pending tasks is above a healthy weekly scope — consider deferring some`,
      severity: workload.pendingTotal > 20 ? 'high' : 'medium',
    })
  }

  // High-priority stacking: multiple high-priority on same overloaded day
  for (const day of workload.overloadedDays) {
    if (day.highPriorityPending >= 3) {
      warnings.push({
        kind: 'high_priority_stacked',
        message: `${day.shortName} has ${day.highPriorityPending} high-priority tasks — quality will suffer under that pressure`,
        affectedDay: day.day,
        severity: 'high',
      })
    }
  }

  return warnings
}

// ─── Recommendation Generators ───────────────────────────────────────────────

export function buildRecommendations(
  workload: WorkloadAnalysis,
  prioritizedTasks: PrioritizedTask[],
  rebalanceSuggestions: RebalanceProposal[],
  context: AIContext,
  maxRecommendations: number = 5
): PlanningRecommendation[] {
  const recs: PlanningRecommendation[] = []

  // ── 1. Address carry-over (highest urgency) ──────────────────────────────
  if (workload.carryOverCount > 0) {
    const carryOverTasks = prioritizedTasks.filter((t) => t.isCarryOver)
    recs.push({
      kind: 'address_carryover',
      message: `Address ${workload.carryOverCount} carry-over task${workload.carryOverCount > 1 ? 's' : ''} before planning new work`,
      reasoning:
        'Tasks that missed their scheduled day accumulate pressure and distort future planning. Clear these first.',
      relatedTaskTitles: carryOverTasks.slice(0, 2).map((t) => t.title),
      urgency: 'high',
    })
  }

  // ── 2. Rebalance overloaded days ─────────────────────────────────────────
  if (workload.overloadedDays.length > 0 && rebalanceSuggestions.length > 0) {
    const worstDay = workload.overloadedDays[0]
    recs.push({
      kind: 'rebalance',
      message: `Rebalance ${worstDay.shortName} — move ${Math.min(2, rebalanceSuggestions.length)} lower-priority task${rebalanceSuggestions.length > 1 ? 's' : ''} to lighter days`,
      reasoning: `${worstDay.shortName} has ${worstDay.totalPending} pending tasks with pressure score ${worstDay.pressureScore}/100. Redistributing reduces risk of incomplete sprint days.`,
      relatedDay: worstDay.day,
      relatedTaskTitles: rebalanceSuggestions.slice(0, 2).map((r) => r.taskTitle),
      urgency: worstDay.pressureScore >= 80 ? 'high' : 'medium',
    })
  }

  // ── 3. Protect peak day for deep work ────────────────────────────────────
  if (workload.peakDay && workload.peakDayLabel) {
    const deepTasks = prioritizedTasks.filter((t) => t.focusType === 'deep')
    if (deepTasks.length > 0) {
      recs.push({
        kind: 'protect',
        message: `Protect ${workload.peakDayLabel} for deep work — your strongest historical output day`,
        reasoning: `${workload.peakDayLabel} shows the most completed tasks this week. Reserve it for high-focus work and avoid filling it with shallow tasks.`,
        relatedDay: workload.peakDay,
        relatedTaskTitles: deepTasks.slice(0, 2).map((t) => t.title),
        urgency: 'medium',
      })
    }
  }

  // ── 4. Batch theme-related tasks ─────────────────────────────────────────
  const deepWorkTasks = prioritizedTasks.filter((t) => t.focusType === 'deep')
  if (deepWorkTasks.length >= 2) {
    recs.push({
      kind: 'batch',
      message: `Batch ${deepWorkTasks.length} deep-work tasks together to eliminate context switching`,
      reasoning:
        'Deep focus tasks interrupted by shallow work lose 20+ minutes of recovery time each switch. Grouping them protects your most productive mental state.',
      relatedTaskTitles: deepWorkTasks.slice(0, 3).map((t) => t.title),
      urgency: 'medium',
    })
  }

  // ── 5. Reduce scope if overloaded ────────────────────────────────────────
  if (workload.pendingTotal > 12 && recs.length < maxRecommendations) {
    const lowPriorityPending = prioritizedTasks.filter((t) => t.priority === 'low')
    recs.push({
      kind: 'reduce_scope',
      message: `Defer ${Math.max(2, lowPriorityPending.length)} low-priority tasks to next week to reduce scope pressure`,
      reasoning: `${workload.pendingTotal} pending tasks exceeds a realistic weekly throughput. Reducing scope now prevents end-of-week pile-up and protects completion rate.`,
      relatedTaskTitles: lowPriorityPending.slice(0, 2).map((t) => t.title),
      urgency: workload.pendingTotal > 18 ? 'high' : 'low',
    })
  }

  // ── 6. Establish focus sessions ──────────────────────────────────────────
  if (context.focus.sessionCount === 0 && recs.length < maxRecommendations) {
    recs.push({
      kind: 'focus',
      message: 'Start tracking focus sessions — even one 25-min block builds meaningful productivity data',
      reasoning:
        'Without focus session data, the planning engine cannot detect your energy patterns or protect your peak hours. One session gives the system a signal to work from.',
      urgency: 'low',
    })
  }

  return recs.slice(0, maxRecommendations)
}
