import type { AIContext, BaseContextLayer } from '../../types'

/**
 * Extracts week-level metadata from the assembled AI context.
 * This layer is stable and cheap to compute — it never changes within a session.
 */
export function buildBaseContext(context: AIContext): BaseContextLayer {
  return {
    weekTitle: context.week.title,
    weekNumber: context.week.weekNumber,
    year: context.week.year,
    dateRange: context.week.dateRange,
    score: context.week.score,
    completionRate: context.metrics.completionRate,
    createdAt: context.createdAt,
  }
}
