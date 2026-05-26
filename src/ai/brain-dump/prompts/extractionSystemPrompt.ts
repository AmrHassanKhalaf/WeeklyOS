import type { AIContext } from '../../types'
import type { BrainDumpExtraction } from '../types'

// ─── LLM System Prompt (for future LLM-backed parsing) ───────────────────────

/**
 * Builds the extraction system prompt for LLM-backed brain dump parsing.
 *
 * Currently used as additional context when the orchestrator handles a
 * brain dump organization request. The heuristic pipeline (Phase 2.5)
 * handles extraction; the LLM uses this prompt to interpret results and
 * generate natural language commentary.
 *
 * Phase 2.6+ will use this to drive full LLM-native extraction.
 */
export function buildBrainDumpExtractionSystemPrompt(context: AIContext): string {
  const existingHabitNames = context.habits.items.map((h) => h.name).slice(0, 10).join(', ')
  const pendingTaskTitles = context.tasks.items
    .filter((t) => t.status === 'pending')
    .slice(0, 5)
    .map((t) => t.title)
    .join(', ')

  return [
    'You are a WeeklyOS Brain Dump Analyst.',
    '',
    'When the user shares raw brain dump text:',
    '1. Call the organizeBrainDump tool with the raw text',
    '2. After the tool returns results, provide a calm structured summary:',
    '   • How many items were extracted and in which categories',
    '   • Call out ambiguous items and ask clarifying questions directly',
    '   • Suggest how tasks could fit into the current week',
    '   • Note any deadline risks or overload concerns',
    '3. Never automatically create tasks or habits — propose only',
    '',
    'Workspace context for better extraction:',
    existingHabitNames
      ? `• Existing habits: ${existingHabitNames}`
      : '• No habits currently tracked',
    pendingTaskTitles
      ? `• Pending tasks: ${pendingTaskTitles}`
      : '• No pending tasks this week',
    '',
    'Tone: calm, organized, specific. Avoid generic AI summaries.',
    'Language: match the user\'s input language.',
  ].join('\n')
}

// ─── Post-Extraction Commentary Prompt ───────────────────────────────────────

/**
 * Builds a prompt that guides the LLM to generate useful commentary
 * AFTER the heuristic pipeline has already run and produced an extraction.
 *
 * This is injected as part of the user message when handling brain dumps.
 */
export function buildBrainDumpCommentaryPrompt(extraction: BrainDumpExtraction): string {
  const parts: string[] = []

  parts.push(
    `The brain dump parser extracted ${extraction.totalExtracted} items from the user's text.`
  )

  if (extraction.tasks.length > 0) {
    const priorityCounts = extraction.tasks.reduce(
      (acc, t) => {
        acc[t.priority] = (acc[t.priority] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const priorityStr = Object.entries(priorityCounts)
      .map(([p, n]) => `${n} ${p}`)
      .join(', ')
    parts.push(`Tasks: ${extraction.tasks.length} (${priorityStr} priority)`)
  }

  if (extraction.habits.length > 0) {
    parts.push(`Habits: ${extraction.habits.length} detected`)
  }

  if (extraction.goals.length > 0) {
    parts.push(`Goals: ${extraction.goals.length}`)
  }

  if (extraction.deadlines.length > 0) {
    const risky = extraction.deadlines.filter((d) => d.isDayAmbiguous)
    parts.push(
      `Deadlines: ${extraction.deadlines.length}${risky.length ? ` (${risky.length} need date clarification)` : ''}`
    )
  }

  if (extraction.ambiguousCount > 0) {
    parts.push(`Ambiguous: ${extraction.ambiguousCount} items need clarification`)
  }

  if (extraction.suggestions.length > 0) {
    parts.push(`Suggestions: ${extraction.suggestions.length} planning recommendations`)
  }

  parts.push('')
  parts.push('Please summarize this extraction for the user and ask any needed clarification questions.')

  return parts.join('\n')
}
