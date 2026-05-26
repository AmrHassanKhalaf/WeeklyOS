import type { AIContext } from '../../types'
import type { CompletionAnalysis, CompletionQuality } from '../types'
import { THRESHOLDS } from '../../config/thresholds'
import { SCORING_WEIGHTS } from '../../config/scoringWeights'
import { WEEK_ORDER } from '../../planning/utils'

// ─── Quality Classification ─────────────────────────────────────────────────────

function classifyCompletionQuality(rate: number): CompletionQuality {
  if (rate >= THRESHOLDS.completion.excellent) return 'excellent'
  if (rate >= THRESHOLDS.completion.good) return 'good'
  if (rate >= THRESHOLDS.completion.fair) return 'fair'
  return 'poor'
}

// ─── Carry-Over Concern ─────────────────────────────────────────────────────

function classifyCarryOverConcern(ratio: number): 'none' | 'concerning' | 'critical' {
  if (ratio >= THRESHOLDS.carryOver.criticalRatio) return 'critical'
  if (ratio >= THRESHOLDS.carryOver.concernRatio) return 'concerning'
  return 'none'
}

// ─── Analyzer ─────────────────────────────────────────────────────────────────

/**
 * Analyzes task completion patterns to produce a structured completion analysis.
 *
 * This stage computes:
 * - Overall completion rate and quality classification
 * - High-priority task completion performance
 * - Carry-over detection (tasks missing their scheduled day)
 * - Carry-over concern level
 */
export function analyzeCompletion(context: AIContext): CompletionAnalysis {
  const { tasks, metrics, today } = context
  const todayOrder = today ? (WEEK_ORDER[today.day] ?? -1) : -1

  const totalPlanned = metrics.totalPlanned
  const totalCompleted = metrics.totalCompleted
  const pendingCount = tasks.pending
  const completionRate = metrics.completionRate

  // High-priority performance
  const highPriorityItems = tasks.items.filter((t) => t.priority === 'high')
  const highPriorityCompleted = highPriorityItems.filter((t) => t.status === 'completed').length
  const highPriorityPending = highPriorityItems.filter((t) => t.status === 'pending').length

  // Carry-over detection (tasks scheduled for past days still pending)
  const carryOverItems =
    todayOrder >= 0
      ? tasks.items.filter(
          (t) => t.status === 'pending' && t.day != null && (WEEK_ORDER[t.day] ?? 999) < todayOrder
        )
      : []
  const carryOverCount = carryOverItems.length
  const carryOverRatio = totalPlanned > 0 ? carryOverCount / totalPlanned : 0
  const carryOverConcern = classifyCarryOverConcern(carryOverRatio)

  const quality = classifyCompletionQuality(completionRate)

  return {
    completionRate,
    totalCompleted,
    totalPlanned,
    pendingCount,
    quality,
    highPriorityCompleted,
    highPriorityPending,
    carryOverCount,
    carryOverRatio,
    carryOverConcern,
  }
}
