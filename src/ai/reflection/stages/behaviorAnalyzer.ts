import type { AIContext } from '../../types'
import type { BehaviorAnalysis, SustainabilityLevel, PlanningAccuracy } from '../types'
import { THRESHOLDS } from '../../config/thresholds'
import { ALL_DAYS, DAY_SHORT_NAMES } from '../../planning/utils'

// ─── Sustainability Classification ─────────────────────────────────────────────

function classifySustainability(overallPressure: number): SustainabilityLevel {
  if (overallPressure >= THRESHOLDS.sustainability.highRiskPressure) return 'high_risk'
  if (overallPressure >= THRESHOLDS.sustainability.moderatePressure) return 'moderate_concern'
  if (overallPressure >= THRESHOLDS.sustainability.mildPressure) return 'mild_concern'
  return 'healthy'
}

// ─── Planning Accuracy Classification ─────────────────────────────────────────

function classifyPlanningAccuracy(completionRate: number): PlanningAccuracy {
  if (completionRate >= THRESHOLDS.planningAccuracy.balanced) return 'balanced'
  if (completionRate < THRESHOLDS.planningAccuracy.overplanned) return 'underplanned'
  return 'overplanned'
}

// ─── Analyzer ─────────────────────────────────────────────────────────────────

/**
 * Analyzes behavioral patterns to produce a structured behavior analysis.
 *
 * This stage computes:
 * - Peak day (most completions) and quietest day
 * - Overall workload sustainability
 * - Planning accuracy (balanced/overplanned/underplanned)
 * - Execution ratio
 */
export function analyzeBehavior(context: AIContext): BehaviorAnalysis {
  const { tasks, metrics } = context

  // Per-day completion counts
  const dayCompletions = ALL_DAYS.map((day) => {
    const dayMetrics = tasks.byDay[day]
    return {
      day,
      completed: dayMetrics?.completed ?? 0,
    }
  })

  // Peak day
  const peakDayData = dayCompletions
    .filter((d) => d.completed > 0)
    .sort((a, b) => b.completed - a.completed)[0]
  const peakDay = peakDayData?.day ?? null
  const peakDayLabel = peakDay ? DAY_SHORT_NAMES[peakDay] : null
  const peakDayCompletions = peakDayData?.completed ?? 0

  // Quietest day
  const quietestDayData = dayCompletions
    .filter((d) => d.completed >= 0)
    .sort((a, b) => a.completed - b.completed)[0]
  const quietestDay = quietestDayData?.day ?? null
  const quietestDayLabel = quietestDay ? DAY_SHORT_NAMES[quietestDay] : null

  // Sustainability: based on pending vs completed ratio
  // Higher pending count relative to completed = higher pressure
  const executionRatio = metrics.totalPlanned > 0 ? metrics.totalCompleted / metrics.totalPlanned : 0
  const overallPressure = Math.round((1 - executionRatio) * 100)
  const sustainability = classifySustainability(overallPressure)

  // Planning accuracy
  const planningAccuracy = classifyPlanningAccuracy(metrics.completionRate)

  return {
    peakDay,
    peakDayLabel,
    peakDayCompletions,
    quietestDay,
    quietestDayLabel,
    sustainability,
    planningAccuracy,
    executionRatio,
  }
}
