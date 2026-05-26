import type { AIContext } from '../../types'
import type { FocusAnalysis, FocusPattern } from '../types'
import { THRESHOLDS } from '../../config/thresholds'

// ─── Pattern Classification ─────────────────────────────────────────────────────

function classifyFocusPattern(totalMinutes: number): FocusPattern {
  if (totalMinutes >= THRESHOLDS.focus.strongMinutes) return 'strong'
  if (totalMinutes >= THRESHOLDS.focus.regularMinutes) return 'regular'
  if (totalMinutes >= THRESHOLDS.focus.occasionalMinutes) return 'occasional'
  return 'none'
}

// ─── Analyzer ─────────────────────────────────────────────────────────────────

/**
 * Analyzes focus session patterns to produce a structured focus analysis.
 *
 * This stage computes:
 * - Total focus minutes and session count
 * - Average session duration
 * - Pattern classification (strong/regular/occasional/none)
 * - Which days had focus sessions
 * - Whether focus patterns are consistent across the week
 */
export function analyzeFocus(context: AIContext): FocusAnalysis {
  const { focus } = context
  const { sessions, totalMinutes, sessionCount } = focus

  const averageSessionMinutes = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0
  const pattern = classifyFocusPattern(totalMinutes)

  // Consistency: at least 3 sessions indicates consistent focus practice
  const isConsistent = sessionCount >= 3

  return {
    totalMinutes,
    sessionCount,
    averageSessionMinutes,
    pattern,
    isConsistent,
  }
}
