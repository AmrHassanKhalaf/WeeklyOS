import type { DayOfWeek, Priority } from '../types'
import type { HabitCategory } from '../../store/useHabitStore'

// ─── Confidence & Category ────────────────────────────────────────────────────

export type ItemConfidence = 'high' | 'medium' | 'low'

export type BrainDumpCategory =
  | 'task'
  | 'habit'
  | 'goal'
  | 'reminder'
  | 'event'
  | 'deadline'
  | 'ambiguous'
  | 'note'

// ─── Base Item ────────────────────────────────────────────────────────────────

export interface BaseExtractedItem {
  /** Stable ID for this item within a single extraction run. */
  id: string
  /** The original fragment of text that produced this item. */
  rawText: string
  category: BrainDumpCategory
  confidence: ItemConfidence
}

// ─── Concrete Item Types ──────────────────────────────────────────────────────

export interface ExtractedTask extends BaseExtractedItem {
  category: 'task'
  title: string
  priority: Priority
  day?: DayOfWeek
  estimatedTime?: string
  /** Raw date/deadline expression from the text, e.g. "by Thursday". */
  deadlineText?: string
  /** ID or name of an existing task/project this may relate to. */
  contextMatch?: string
}

export interface ExtractedHabit extends BaseExtractedItem {
  category: 'habit'
  name: string
  frequency: 'daily' | 'weekly' | 'unknown'
  habitType?: HabitCategory
  /** True when the user wants to *break* a bad habit. */
  isBreakHabit?: boolean
  /** Name of existing habit this matched against. */
  existingHabitMatch?: string
}

export interface ExtractedGoal extends BaseExtractedItem {
  category: 'goal'
  description: string
  /** Natural language timeframe, e.g. "this week", "by end of month". */
  timeframe?: string
}

export interface ExtractedReminder extends BaseExtractedItem {
  category: 'reminder'
  text: string
  /** Raw time expression from the text, e.g. "tomorrow", "end of day". */
  when?: string
  day?: DayOfWeek
}

export interface ExtractedEvent extends BaseExtractedItem {
  category: 'event'
  title: string
  day?: DayOfWeek
  time?: string
  isDayAmbiguous?: boolean
}

export interface ExtractedDeadline extends BaseExtractedItem {
  category: 'deadline'
  title: string
  day?: DayOfWeek
  rawDate?: string
  /**
   * True when the day is mentioned without enough context to confirm which
   * week — e.g. "Thursday" when there's no "this" or "next" qualifier.
   */
  isDayAmbiguous?: boolean
}

export interface AmbiguousItem extends BaseExtractedItem {
  category: 'ambiguous'
  text: string
  /** Categories this item could reasonably belong to. */
  possibleCategories: BrainDumpCategory[]
  /** Human-readable reasons for the ambiguity. */
  ambiguityReasons: string[]
  /** The clarification question to ask the user. */
  clarificationQuestion: string
}

export type AnyExtractedItem =
  | ExtractedTask
  | ExtractedHabit
  | ExtractedGoal
  | ExtractedReminder
  | ExtractedEvent
  | ExtractedDeadline
  | AmbiguousItem

// ─── Suggestions ──────────────────────────────────────────────────────────────

export type BrainDumpSuggestionKind =
  | 'rebalance_day'
  | 'defer_to_next_week'
  | 'split_into_smaller'
  | 'clarify_ambiguous'
  | 'habit_instead_of_task'
  | 'duplicate_warning'
  | 'deadline_risk'

export interface BrainDumpSuggestion {
  kind: BrainDumpSuggestionKind
  message: string
  /** ID of the item this suggestion relates to. */
  relatedItemId?: string
  relatedDay?: DayOfWeek
}

// ─── Full Extraction Result ───────────────────────────────────────────────────

/**
 * The structured output of the Brain Dump pipeline.
 *
 * Designed as an intermediate layer — never written directly to the store.
 * The user reviews and confirms which items to apply before any mutations occur.
 */
export interface BrainDumpExtraction {
  rawInput: string
  tasks: ExtractedTask[]
  habits: ExtractedHabit[]
  goals: ExtractedGoal[]
  reminders: ExtractedReminder[]
  events: ExtractedEvent[]
  deadlines: ExtractedDeadline[]
  ambiguousItems: AmbiguousItem[]
  suggestions: BrainDumpSuggestion[]
  /** Total number of items successfully extracted (excluding ambiguous). */
  totalExtracted: number
  /** Number of items needing clarification. */
  ambiguousCount: number
  /** Which processing mode produced this result. */
  processingSource: 'heuristic' | 'llm' | 'hybrid'
}

// ─── Confirmation Flow ────────────────────────────────────────────────────────

export type BrainDumpItemAction = 'accept' | 'reject' | 'edit'

export interface BrainDumpItemConfirmation {
  itemId: string
  action: BrainDumpItemAction
  category: BrainDumpCategory
}
