import type { AIContext, DayOfWeek } from '../../types'
import type {
  AnyExtractedItem,
  BrainDumpSuggestion,
  ExtractedHabit,
  ExtractedTask,
} from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Rough word-overlap similarity between two strings (Jaccard-like). */
function textSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    )

  const setA = tokenize(a)
  const setB = tokenize(b)
  const intersection = [...setA].filter((w) => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

const OVERLOAD_THRESHOLD = 3

// ─── Contextualizer ───────────────────────────────────────────────────────────

/**
 * Enriches extracted items using the live `AIContext`.
 *
 * Actions:
 * - Match extracted habits against existing workspace habits → boost confidence
 * - Detect task → overloaded day assignments → add rebalance suggestion
 * - Detect probable duplicates of existing pending tasks → add duplicate warning
 * - Validate day assignments against context week data
 */
export function contextualizeExtraction(
  items: AnyExtractedItem[],
  context: AIContext
): { enrichedItems: AnyExtractedItem[]; suggestions: BrainDumpSuggestion[] } {
  const suggestions: BrainDumpSuggestion[] = []
  const existingHabits = context.habits.items
  const pendingTasks = context.tasks.items.filter((t) => t.status === 'pending')

  const enrichedItems = items.map((item): AnyExtractedItem => {
    // ── Habit matching ──────────────────────────────────────────────────────
    if (item.category === 'habit') {
      const habit = item as ExtractedHabit
      const match = existingHabits.find(
        (h) => textSimilarity(h.name, habit.name) > 0.4
      )
      if (match) {
        return {
          ...habit,
          confidence: 'high',
          existingHabitMatch: match.name,
        }
      }
    }

    // ── Task: overloaded day detection ──────────────────────────────────────
    if (item.category === 'task') {
      const task = item as ExtractedTask
      if (task.day) {
        const dayMetrics = context.tasks.byDay[task.day as DayOfWeek]
        if (dayMetrics && dayMetrics.pending >= OVERLOAD_THRESHOLD) {
          const alreadySuggested = suggestions.some(
            (s) => s.kind === 'rebalance_day' && s.relatedDay === task.day
          )
          if (!alreadySuggested) {
            suggestions.push({
              kind: 'rebalance_day',
              message: `${capitalize(task.day as string)} already has ${dayMetrics.pending} pending tasks — consider scheduling "${task.title}" on a lighter day.`,
              relatedItemId: task.id,
              relatedDay: task.day as DayOfWeek,
            })
          }
        }
      }

      // ── Duplicate detection ───────────────────────────────────────────────
      const duplicate = pendingTasks.find(
        (t) => textSimilarity(t.title, task.title) > 0.55
      )
      if (duplicate) {
        suggestions.push({
          kind: 'duplicate_warning',
          message: `"${task.title}" looks similar to an existing pending task: "${duplicate.title}". Consider linking or skipping.`,
          relatedItemId: task.id,
        })
      }
    }

    return item
  })

  return { enrichedItems, suggestions }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
