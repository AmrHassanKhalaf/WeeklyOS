import type { OrchestratorUIBlock } from '../orchestrator/types'
import type { BrainDumpExtraction } from './types'

// ─── UI Block Builders ────────────────────────────────────────────────────────

/**
 * Converts a `BrainDumpExtraction` into a set of structured UI blocks
 * that the AIWorkspace can render as rich cards instead of plain text.
 *
 * Block order:
 * 1. Summary — total extracted + source note
 * 2. Tasks — extracted tasks with priorities
 * 3. Habits — detected habits (with frequency + existing matches)
 * 4. Goals — extracted goals
 * 5. Reminders — extracted reminders
 * 6. Events / Deadlines — calendar-like items
 * 7. Ambiguous — items needing user clarification
 * 8. Suggestions — planning recommendations
 */
export function buildBrainDumpUIBlocks(
  extraction: BrainDumpExtraction
): OrchestratorUIBlock[] {
  const blocks: OrchestratorUIBlock[] = []

  // ── 1. Summary block ────────────────────────────────────────────────────
  blocks.push({
    kind: 'brain_dump_summary',
    title: 'Brain Dump Extraction',
    content: buildSummaryContent(extraction),
    data: {
      totalExtracted: extraction.totalExtracted,
      ambiguousCount: extraction.ambiguousCount,
      processingSource: extraction.processingSource,
    },
  })

  // ── 2. Tasks ─────────────────────────────────────────────────────────────
  if (extraction.tasks.length > 0) {
    blocks.push({
      kind: 'brain_dump_tasks',
      title: `Tasks (${extraction.tasks.length})`,
      content: extraction.tasks
        .map((t) => {
          const parts = [`• ${t.title}`]
          if (t.priority === 'high') parts.push('[high priority]')
          if (t.day) parts.push(`→ ${t.day}`)
          if (t.deadlineText) parts.push(`| ${t.deadlineText}`)
          return parts.join(' ')
        })
        .join('\n'),
      data: extraction.tasks,
    })
  }

  // ── 3. Habits ─────────────────────────────────────────────────────────────
  if (extraction.habits.length > 0) {
    blocks.push({
      kind: 'brain_dump_habits',
      title: `Habits (${extraction.habits.length})`,
      content: extraction.habits
        .map((h) => {
          const parts = [h.isBreakHabit ? `• Break: ${h.name}` : `• ${h.name}`]
          if (h.frequency !== 'unknown') parts.push(`[${h.frequency}]`)
          if (h.existingHabitMatch) parts.push(`← matches "${h.existingHabitMatch}"`)
          return parts.join(' ')
        })
        .join('\n'),
      data: extraction.habits,
    })
  }

  // ── 4. Goals ──────────────────────────────────────────────────────────────
  if (extraction.goals.length > 0) {
    blocks.push({
      kind: 'brain_dump_goals',
      title: `Goals (${extraction.goals.length})`,
      content: extraction.goals
        .map((g) => {
          const parts = [`• ${g.description}`]
          if (g.timeframe) parts.push(`[${g.timeframe}]`)
          return parts.join(' ')
        })
        .join('\n'),
      data: extraction.goals,
    })
  }

  // ── 5. Reminders ──────────────────────────────────────────────────────────
  if (extraction.reminders.length > 0) {
    blocks.push({
      kind: 'brain_dump_reminders',
      title: `Reminders (${extraction.reminders.length})`,
      content: extraction.reminders
        .map((r) => {
          const parts = [`• ${r.text}`]
          if (r.when) parts.push(`[${r.when}]`)
          return parts.join(' ')
        })
        .join('\n'),
      data: extraction.reminders,
    })
  }

  // ── 6. Events + Deadlines ─────────────────────────────────────────────────
  const calendarCount = extraction.events.length + extraction.deadlines.length
  if (calendarCount > 0) {
    const calendarLines: string[] = [
      ...extraction.events.map((e) => {
        const dayStr = e.day ? `${e.day}${e.isDayAmbiguous ? ' (?)' : ''}` : ''
        return [`• ${e.title}`, dayStr ? `→ ${dayStr}` : ''].filter(Boolean).join(' ')
      }),
      ...extraction.deadlines.map((d) => {
        const dayStr = d.day ? `${d.day}${d.isDayAmbiguous ? ' (?)' : ''}` : ''
        return [`• ${d.title}`, dayStr ? `→ ${dayStr}` : '', d.rawDate ? `| ${d.rawDate}` : ''].filter(Boolean).join(' ')
      }),
    ]
    blocks.push({
      kind: 'brain_dump_events',
      title: `Calendar Items (${calendarCount})`,
      content: calendarLines.join('\n'),
      data: [...extraction.events, ...extraction.deadlines],
    })
  }

  // ── 7. Ambiguous items ────────────────────────────────────────────────────
  if (extraction.ambiguousItems.length > 0) {
    blocks.push({
      kind: 'brain_dump_ambiguous',
      title: `Needs Clarification (${extraction.ambiguousItems.length})`,
      content: extraction.ambiguousItems
        .map((a) => `• ${a.clarificationQuestion}`)
        .join('\n'),
      data: extraction.ambiguousItems,
    })
  }

  // ── 8. Suggestions ────────────────────────────────────────────────────────
  if (extraction.suggestions.length > 0) {
    const nonClarify = extraction.suggestions.filter((s) => s.kind !== 'clarify_ambiguous')
    if (nonClarify.length > 0) {
      blocks.push({
        kind: 'brain_dump_suggestions',
        title: `Planning Suggestions (${nonClarify.length})`,
        content: nonClarify.map((s) => `• ${s.message}`).join('\n'),
        data: nonClarify,
      })
    }
  }

  return blocks
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSummaryContent(extraction: BrainDumpExtraction): string {
  if (extraction.totalExtracted === 0 && extraction.ambiguousCount === 0) {
    return 'No actionable items detected. Try adding more specific language like action verbs or day references.'
  }

  const parts: string[] = []

  const counts = [
    extraction.tasks.length > 0 ? `${extraction.tasks.length} task${extraction.tasks.length > 1 ? 's' : ''}` : '',
    extraction.habits.length > 0 ? `${extraction.habits.length} habit${extraction.habits.length > 1 ? 's' : ''}` : '',
    extraction.goals.length > 0 ? `${extraction.goals.length} goal${extraction.goals.length > 1 ? 's' : ''}` : '',
    extraction.reminders.length > 0 ? `${extraction.reminders.length} reminder${extraction.reminders.length > 1 ? 's' : ''}` : '',
    (extraction.events.length + extraction.deadlines.length) > 0
      ? `${extraction.events.length + extraction.deadlines.length} calendar item${extraction.events.length + extraction.deadlines.length > 1 ? 's' : ''}`
      : '',
  ].filter(Boolean)

  if (counts.length > 0) {
    parts.push(`Extracted: ${counts.join(', ')}`)
  }

  if (extraction.ambiguousCount > 0) {
    parts.push(`${extraction.ambiguousCount} item${extraction.ambiguousCount > 1 ? 's' : ''} need clarification`)
  }

  return parts.join(' • ') || 'Processing complete.'
}
