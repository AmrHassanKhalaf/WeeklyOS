import type { AIContext } from '../../types'
import type { DayPressureScore, RiskLevel, WorkloadAnalysis } from '../types'
import { ALL_DAYS, DAY_SHORT_NAMES, WEEK_ORDER } from '../utils'
import { THRESHOLDS } from '../../config/thresholds'
import { SCORING_WEIGHTS } from '../../config/scoringWeights'

// ─── Pressure Formula ─────────────────────────────────────────────────────────
//
// pressureScore = (pending * pressurePendingWeight) + (high-priority-pending * pressureHighPriorityWeight)
// Capped at 100. A day with 4 pending (2 high-priority) scores ~68 → overloaded.

function computePressureScore(pending: number, highPriorityPending: number): number {
  return Math.min(
    100,
    pending * SCORING_WEIGHTS.planning.pressurePendingWeight +
      highPriorityPending * SCORING_WEIGHTS.planning.pressureHighPriorityWeight
  )
}

// ─── Risk Level ───────────────────────────────────────────────────────────────

function deriveRiskLevel(
  overallPressure: number,
  overloadedCount: number,
  maxHighPriorityOnSingleDay: number
): RiskLevel {
  if (
    overallPressure >= THRESHOLDS.workload.riskCritical ||
    maxHighPriorityOnSingleDay >= THRESHOLDS.workload.criticalHighPriorityPerDay
  )
    return 'critical'
  if (overallPressure >= THRESHOLDS.workload.riskHigh || overloadedCount >= 3) return 'high'
  if (overallPressure >= THRESHOLDS.workload.riskMedium || overloadedCount >= 1) return 'medium'
  if (overallPressure >= 15) return 'low'
  return 'balanced'
}

// ─── Analyzer ─────────────────────────────────────────────────────────────────

/**
 * Produces a WorkloadAnalysis snapshot from the normalized AIContext.
 *
 * This is the first stage of the planning pipeline — all other stages consume
 * the analysis it produces. It does not mutate anything.
 */
export function analyzeWorkload(context: AIContext): WorkloadAnalysis {
  const { tasks, focus, metrics } = context
  const todayOrder = context.today ? (WEEK_ORDER[context.today.day] ?? -1) : -1

  // ── Per-day pressure scores ──────────────────────────────────────────────
  const dayPressures: DayPressureScore[] = ALL_DAYS.map((day) => {
    const dayMetrics = tasks.byDay[day]
    const totalPending = dayMetrics?.pending ?? 0
    const completedCount = dayMetrics?.completed ?? 0

    const pendingForDay = tasks.items.filter(
      (t) => t.day === day && t.status === 'pending'
    )
    const highPriorityPending = pendingForDay.filter((t) => t.priority === 'high').length
    const pressureScore = computePressureScore(totalPending, highPriorityPending)

    const isOverloaded =
      totalPending >= THRESHOLDS.workload.overloadPendingCount ||
      pressureScore >= THRESHOLDS.workload.overloadPressureScore

    return {
      day,
      shortName: DAY_SHORT_NAMES[day],
      totalPending,
      highPriorityPending,
      pressureScore,
      isOverloaded,
      completedCount,
    }
  })

  const overloadedDays = dayPressures.filter((d) => d.isOverloaded)

  // ── Peak day — historically strongest (most completions) ────────────────
  const peakDayData = dayPressures
    .filter((d) => d.completedCount > 0)
    .sort((a, b) => b.completedCount - a.completedCount)[0]

  const peakDay = peakDayData?.day ?? null
  const peakDayLabel = peakDay ? DAY_SHORT_NAMES[peakDay] : null

  // ── Quiet days — well below average pending, good move targets ──────────
  const avgPending = tasks.pending > 0 ? tasks.pending / 7 : 0
  const quietDays = dayPressures
    .filter((d) => !d.isOverloaded && d.totalPending < Math.max(1, avgPending * 0.6))
    .map((d) => d.day)

  // ── Carry-over tasks — past days still pending ───────────────────────────
  const carryOverCount =
    todayOrder >= 0
      ? tasks.items.filter(
          (t) => t.status === 'pending' && t.day != null && (WEEK_ORDER[t.day] ?? 999) < todayOrder
        ).length
      : 0

  // ── Overall pressure ─────────────────────────────────────────────────────
  const highPriorityPendingTotal = tasks.items.filter(
    (t) => t.status === 'pending' && t.priority === 'high'
  ).length

  const overallPressure = Math.min(
    100,
    Math.round(
      tasks.pending * 8 + highPriorityPendingTotal * 12 + carryOverCount * 15
    )
  )

  const maxHighPriorityOnSingleDay = Math.max(
    0,
    ...dayPressures.map((d) => d.highPriorityPending)
  )
  const riskLevel = deriveRiskLevel(
    overallPressure,
    overloadedDays.length,
    maxHighPriorityOnSingleDay
  )

  // ── Pressure reason strings ───────────────────────────────────────────────
  const pressureReasons: string[] = []
  if (carryOverCount > 0) {
    pressureReasons.push(
      `${carryOverCount} carry-over task${carryOverCount > 1 ? 's' : ''} from past scheduled days`
    )
  }
  if (overloadedDays.length > 0) {
    pressureReasons.push(
      `${overloadedDays.length} overloaded ${overloadedDays.length === 1 ? 'day' : 'days'}: ${overloadedDays.map((d) => d.shortName).join(', ')}`
    )
  }
  if (highPriorityPendingTotal > 3) {
    pressureReasons.push(`${highPriorityPendingTotal} high-priority tasks still pending`)
  }
  if (focus.sessionCount === 0 && tasks.pending > 0) {
    pressureReasons.push('No focus sessions logged — deep work patterns not tracked')
  }

  return {
    dayPressures,
    overloadedDays,
    peakDay,
    peakDayLabel,
    quietDays,
    pendingTotal: tasks.pending,
    highPriorityPending: highPriorityPendingTotal,
    carryOverCount,
    completionRate: metrics.completionRate,
    riskLevel,
    overallPressure,
    pressureReasons,
  }
}
