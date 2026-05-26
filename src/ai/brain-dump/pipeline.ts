import type { AIContext } from '../types'
import type {
  AmbiguousItem,
  AnyExtractedItem,
  BrainDumpExtraction,
  BrainDumpSuggestion,
  ExtractedDeadline,
  ExtractedEvent,
  ExtractedGoal,
  ExtractedHabit,
  ExtractedReminder,
  ExtractedTask,
} from './types'
import { detectAmbiguity } from './stages/ambiguityDetector'
import { classifySegment } from './stages/classifier'
import { contextualizeExtraction } from './stages/contextualizer'
import { preprocessBrainDump } from './stages/preprocessor'

// ─── ID Generator ─────────────────────────────────────────────────────────────

let _idCounter = 0
function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++_idCounter}`
}

// ─── Item Builders ────────────────────────────────────────────────────────────

function buildItemsFromClassification(
  segments: ReturnType<typeof preprocessBrainDump>,
  ambiguousItems: AmbiguousItem[]
): {
  tasks: ExtractedTask[]
  habits: ExtractedHabit[]
  goals: ExtractedGoal[]
  reminders: ExtractedReminder[]
  events: ExtractedEvent[]
  deadlines: ExtractedDeadline[]
} {
  const tasks: ExtractedTask[] = []
  const habits: ExtractedHabit[] = []
  const goals: ExtractedGoal[] = []
  const reminders: ExtractedReminder[] = []
  const events: ExtractedEvent[] = []
  const deadlines: ExtractedDeadline[] = []
  const ambiguousIds = new Set(ambiguousItems.map((a) => a.id))

  for (const segment of segments) {
    const classification = classifySegment(segment)
    const id = nextId(classification.category)

    // Items routed to ambiguousItems are excluded from concrete lists
    if (ambiguousIds.has(id)) continue

    const base = {
      id,
      rawText: segment.text,
      confidence: classification.confidence,
    }

    switch (classification.category) {
      case 'task':
        tasks.push({
          ...base,
          category: 'task',
          title: classification.title,
          priority: classification.priority,
          day: classification.day,
          deadlineText: classification.deadlineText,
        })
        break

      case 'habit':
        habits.push({
          ...base,
          category: 'habit',
          name: classification.title,
          frequency: classification.frequency ?? 'unknown',
          isBreakHabit: classification.isBreakHabit,
        })
        break

      case 'goal':
        goals.push({
          ...base,
          category: 'goal',
          description: classification.title,
          timeframe: classification.timeframe,
        })
        break

      case 'reminder':
        reminders.push({
          ...base,
          category: 'reminder',
          text: classification.title,
          when: classification.when,
          day: classification.day,
        })
        break

      case 'event':
        events.push({
          ...base,
          category: 'event',
          title: classification.title,
          day: classification.day,
          isDayAmbiguous: classification.isDayAmbiguous,
        })
        break

      case 'deadline':
        deadlines.push({
          ...base,
          category: 'deadline',
          title: classification.title,
          day: classification.day,
          rawDate: classification.deadlineText,
          isDayAmbiguous: classification.isDayAmbiguous,
        })
        break

      // Notes are skipped (too low signal for actionable items)
      default:
        break
    }
  }

  return { tasks, habits, goals, reminders, events, deadlines }
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * The Brain Dump parsing pipeline.
 *
 * Stages:
 * 1. Preprocess  — segment the raw text into classifiable units
 * 2. Classify    — assign each segment a category + confidence
 * 3. Detect ambiguity — pull out uncertain items before building the list
 * 4. Build items — convert classifications into typed extracted items
 * 5. Contextualize — enrich with live workspace data, add suggestions
 *
 * The output is a `BrainDumpExtraction` — a structured intermediate layer.
 * Nothing is written to the store until the user confirms.
 */
export function runBrainDumpPipeline(
  rawText: string,
  context: AIContext
): BrainDumpExtraction {
  // ── Stage 1: Preprocess ──────────────────────────────────────────────────
  const segments = preprocessBrainDump(rawText)

  if (segments.length === 0) {
    return emptyExtraction(rawText)
  }

  // ── Stage 2+3: Classify + detect ambiguity in a single pass ─────────────
  const ambiguousItems: AmbiguousItem[] = []
  const classifiedSegments: typeof segments = []

  for (const segment of segments) {
    const classification = classifySegment(segment)
    const itemId = nextId(classification.category)

    const ambiguous = detectAmbiguity({
      segment,
      classification,
      itemId,
    })

    if (ambiguous) {
      ambiguousItems.push(ambiguous)
    } else {
      // Keep track so builder can use the same IDs
      classifiedSegments.push(segment)
    }
  }

  // ── Stage 4: Build concrete item lists ──────────────────────────────────
  // Re-classify the non-ambiguous segments to build properly-typed items
  const { tasks, habits, goals, reminders, events, deadlines } =
    buildItemsFromClassification(classifiedSegments, ambiguousItems)

  // ── Stage 5: Contextualize ───────────────────────────────────────────────
  const allConcrete: AnyExtractedItem[] = [
    ...tasks, ...habits, ...goals, ...reminders, ...events, ...deadlines,
  ]

  const { enrichedItems, suggestions: contextSuggestions } =
    contextualizeExtraction(allConcrete, context)

  // Add clarification suggestions for ambiguous items
  const clarificationSuggestions: BrainDumpSuggestion[] = ambiguousItems.map((a) => ({
    kind: 'clarify_ambiguous',
    message: a.clarificationQuestion,
    relatedItemId: a.id,
  }))

  const allSuggestions: BrainDumpSuggestion[] = [
    ...clarificationSuggestions,
    ...contextSuggestions,
  ]

  // Repartition enriched items back into typed arrays
  const enrichedTasks = enrichedItems.filter((i): i is ExtractedTask => i.category === 'task')
  const enrichedHabits = enrichedItems.filter((i): i is ExtractedHabit => i.category === 'habit')
  const enrichedGoals = enrichedItems.filter((i): i is ExtractedGoal => i.category === 'goal')
  const enrichedReminders = enrichedItems.filter((i): i is ExtractedReminder => i.category === 'reminder')
  const enrichedEvents = enrichedItems.filter((i): i is ExtractedEvent => i.category === 'event')
  const enrichedDeadlines = enrichedItems.filter((i): i is ExtractedDeadline => i.category === 'deadline')

  const totalExtracted =
    enrichedTasks.length + enrichedHabits.length + enrichedGoals.length +
    enrichedReminders.length + enrichedEvents.length + enrichedDeadlines.length

  return {
    rawInput: rawText,
    tasks: enrichedTasks,
    habits: enrichedHabits,
    goals: enrichedGoals,
    reminders: enrichedReminders,
    events: enrichedEvents,
    deadlines: enrichedDeadlines,
    ambiguousItems,
    suggestions: allSuggestions,
    totalExtracted,
    ambiguousCount: ambiguousItems.length,
    processingSource: 'heuristic',
  }
}

function emptyExtraction(rawInput: string): BrainDumpExtraction {
  return {
    rawInput,
    tasks: [],
    habits: [],
    goals: [],
    reminders: [],
    events: [],
    deadlines: [],
    ambiguousItems: [],
    suggestions: [],
    totalExtracted: 0,
    ambiguousCount: 0,
    processingSource: 'heuristic',
  }
}
