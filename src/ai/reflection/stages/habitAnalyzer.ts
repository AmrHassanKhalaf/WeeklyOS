import type { AIContext } from '../../types'
import type { HabitAnalysis, HabitConsistency } from '../types'
import { THRESHOLDS } from '../../config/thresholds'

// ─── Consistency Classification ─────────────────────────────────────────────────

function classifyHabitConsistency(score: number): HabitConsistency {
  if (score >= THRESHOLDS.habit.strong) return 'strong'
  if (score >= THRESHOLDS.habit.moderate) return 'moderate'
  if (score >= THRESHOLDS.habit.weak) return 'weak'
  return 'missing'
}

// ─── Analyzer ─────────────────────────────────────────────────────────────────

/**
 * Analyzes habit consistency to produce a structured habit analysis.
 *
 * This stage computes:
 * - Number of active habits
 * - Total habit completions
 * - Consistency score (0–100)
 * - Habits with strong vs weak consistency
 *
 * Note: Current AIContext only provides aggregate counts, not per-habit
 * completion data. This is a simplified analysis that can be enhanced when
 * more granular habit data is available.
 */
export function analyzeHabits(context: AIContext): HabitAnalysis {
  const { habits } = context
  const activeCount = habits.items.length
  const totalCompletions = habits.completionCount

  // Consistency score: (completions / (activeCount * 7)) * 100
  // Assumes weekly tracking (7 days per habit)
  const consistencyScore =
    activeCount > 0 ? Math.min(100, Math.round((totalCompletions / (activeCount * 7)) * 100)) : 0

  const consistency = classifyHabitConsistency(consistencyScore)

  // Since we don't have per-habit completion data, we can't classify
  // individual habits as strong/weak. This will be enhanced when granular
  // data is available.
  const strongHabits: Array<{ name: string; consistency: number }> = []
  const weakHabits: Array<{ name: string; consistency: number }> = []

  return {
    activeCount,
    totalCompletions,
    consistencyScore,
    consistency,
    strongHabits,
    weakHabits,
  }
}
