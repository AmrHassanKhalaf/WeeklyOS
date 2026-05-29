import type { DayOfWeek, Priority } from '../../types'
import type { BrainDumpCategory, ItemConfidence } from '../types'
import type { TextSegment } from './preprocessor'

// ─── Pattern Sets ─────────────────────────────────────────────────────────────

const TASK_VERBS = [
  'finish', 'complete', 'write', 'build', 'fix', 'review', 'send', 'call',
  'schedule', 'implement', 'create', 'update', 'add', 'prepare', 'submit',
  'deliver', 'deploy', 'test', 'check', 'set up', 'setup', 'work on',
  'launch', 'publish', 'edit', 'design', 'research', 'debug', 'refactor',
  'clean', 'organize', 'sync', 'discuss', 'present', 'demo', 'document',
  'configure', 'install', 'migrate', 'integrate', 'connect', 'look into',
  'handle', 'address', 'resolve', 'close', 'make', 'draft', 'outline',
  'brainstorm', 'explore', 'validate', 'upload', 'process', 'analyze',
  'collect', 'gather', 'share', 'post', 'reply', 'respond', 'finalize',
  'wrap up', 'kick off', 'reach out', 'contact', 'book', 'plan',
  'follow up', 'read', 'study', 'look at', 'go through', 'go over',
]

const GOAL_SIGNALS = [
  'want to', 'need to', 'plan to', 'aim to', 'hoping to', 'try to',
  "would like to", 'intend to', 'by end of', 'achieve', 'become',
  'reach', 'improve', 'grow', 'develop', 'master', 'learn how to',
  'get better at', 'start', 'restart', 'begin', 'focus on', 'commit to',
]

const HABIT_WORDS = [
  'gym', 'workout', 'exercise', 'run', 'running', 'jog', 'jogging',
  'walk', 'walking', 'meditate', 'meditation', 'journal', 'journaling',
  'yoga', 'swim', 'cycling', 'bike', 'reading habit', 'sleep',
  'wake up', 'morning routine', 'evening routine', 'diet', 'habit',
  'hydrate', 'drink water', 'stretch', 'cold shower',
]

const HABIT_FREQUENCY_PATTERNS = [
  /every\s+(?:day|morning|evening|night|week|weekday)/i,
  /each\s+(?:day|morning|evening|night)/i,
  /\bdaily\b/i,
  /\bweekly\b/i,
  /\bregularly\b/i,
  /\bconsistently\b/i,
  /\brepeat\b.*\bhabit\b/i,
  /\bhabit\b/i,
  /\broutine\b/i,
]

const REMINDER_PATTERNS = [
  /\bdon['\u2019t]*t?\s+forget\b/i,
  /\bremind(?:\s+me)?\b/i,
  /\bremember\s+to\b/i,
  /\bfollow[\s-]up\b/i,
  /\bcheck\s+(?:in|on|with)\b/i,
  /\bmake\s+sure\b/i,
  /\bverify\b/i,
  /\bconfirm\b/i,
  /\btrack\b/i,
  /\bnotify\b/i,
]

const EVENT_SIGNALS = [
  'meeting', 'appointment', 'call with', 'presentation', 'demo',
  'interview', 'workshop', 'conference', 'standup', 'stand-up',
  'check-in', 'catchup', 'catch-up', '1:1', 'sync with',
  'session with', 'dinner with', 'lunch with', 'review with',
]

const BREAK_HABIT_SIGNALS = [
  /\bstop\b/i, /\bquit\b/i, /\breduce\b/i, /\bcut\s+down\b/i,
  /\bless\b/i, /\bno\s+more\b/i, /\bavoid\b/i, /\blimit\b/i,
  /\beliminate\b/i, /\bbreak\s+the\b/i,
]

// ─── Day Map ──────────────────────────────────────────────────────────────────

const DAY_NAME_MAP: Record<string, DayOfWeek> = {
  monday: 'monday', mon: 'monday',
  tuesday: 'tuesday', tue: 'tuesday', tues: 'tuesday',
  wednesday: 'wednesday', wed: 'wednesday',
  thursday: 'thursday', thu: 'thursday', thurs: 'thursday',
  friday: 'friday', fri: 'friday',
  saturday: 'saturday', sat: 'saturday',
  sunday: 'sunday', sun: 'sunday',
}

// ─── Extractor Helpers ────────────────────────────────────────────────────────

function extractDay(text: string): { day: DayOfWeek | undefined; isAmbiguous: boolean } {
  const lower = text.toLowerCase()

  // "this Monday", "on Tuesday", "by Wednesday", "next Thursday"
  const qualified = lower.match(
    /(?:this|on|by|next|for|every)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/
  )
  if (qualified) {
    const day = DAY_NAME_MAP[qualified[1]]
    return { day, isAmbiguous: false }
  }

  // Bare day name without qualifier
  const bare = lower.match(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/
  )
  if (bare) {
    const day = DAY_NAME_MAP[bare[1]]
    // Bare day name is temporally ambiguous — which week?
    return { day, isAmbiguous: true }
  }

  return { day: undefined, isAmbiguous: false }
}

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase()
  if (/\b(?:urgent|asap|critical|high\s+priority|must|!!|important)\b/.test(lower)) {
    return 'high'
  }
  if (/\b(?:whenever|someday|low\s+priority|if\s+(?:time|i\s+have|we|possible)|perhaps|maybe|minor)\b/.test(lower)) {
    return 'low'
  }
  // "need to", "have to", "should" signals medium-high
  if (/\b(?:need\s+to|have\s+to|should|must\s+(?:get|do|finish))\b/.test(lower)) {
    return 'high'
  }
  return 'medium'
}

function hasTaskVerb(text: string): boolean {
  const lower = text.toLowerCase()
  return TASK_VERBS.some((verb) => {
    const escaped = verb.replace(/\s+/g, '\\s+')
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower)
  })
}

function hasGoalSignal(text: string): boolean {
  const lower = text.toLowerCase()
  return GOAL_SIGNALS.some((signal) => lower.includes(signal))
}

function hasHabitWord(text: string): boolean {
  const lower = text.toLowerCase()
  return HABIT_WORDS.some((word) => lower.includes(word))
}

function hasHabitFrequency(text: string): boolean {
  return HABIT_FREQUENCY_PATTERNS.some((pattern) => pattern.test(text))
}

function hasReminderSignal(text: string): boolean {
  return REMINDER_PATTERNS.some((pattern) => pattern.test(text))
}

function hasEventSignal(text: string): boolean {
  const lower = text.toLowerCase()
  return EVENT_SIGNALS.some((signal) => lower.includes(signal))
}

function hasDeadlineSignal(text: string): boolean {
  return /\b(?:by|due|deadline|before|until|no\s+later\s+than|deliver\s+by|submit\s+by)\b/i.test(text)
}

function hasBreakHabitSignal(text: string): boolean {
  return BREAK_HABIT_SIGNALS.some((p) => p.test(text))
}

// ─── Classification Result ────────────────────────────────────────────────────

export interface ClassificationResult {
  category: BrainDumpCategory
  confidence: ItemConfidence
  title: string
  priority: Priority
  day?: DayOfWeek
  isDayAmbiguous?: boolean
  frequency?: 'daily' | 'weekly' | 'unknown'
  timeframe?: string
  when?: string
  isBreakHabit?: boolean
  deadlineText?: string
}

// ─── Main Classifier ──────────────────────────────────────────────────────────

/**
 * Classifies a single text segment into a productivity category.
 *
 * Priority order for conflicts:
 * 1. Reminder patterns — most distinctive phrasing
 * 2. Event patterns — meeting/appointment language
 * 3. Deadline patterns — explicit deadline language
 * 4. Habit patterns — frequency words or known habit nouns
 * 5. Goal patterns — aspiration language without clear action
 * 6. Task patterns — action verbs
 * 7. Note — fallback
 *
 * Ambiguity is detected separately in the ambiguity stage based on
 * confidence scores and conflicting signals.
 */
export function classifySegment(segment: TextSegment): ClassificationResult {
  const { text } = segment
  const lower = text.toLowerCase()

  const { day, isAmbiguous: isDayAmbiguous } = extractDay(text)
  const priority = detectPriority(text)

  // Extract timeframe expressions for goals
  const timeframeMatch = lower.match(
    /\b(this\s+week|this\s+month|by\s+end\s+of\s+(?:week|month|year)|this\s+year|in\s+(?:a\s+(?:week|month|year)|\d+\s+(?:days?|weeks?|months?)))\b/
  )
  const timeframe = timeframeMatch?.[1]

  // Extract deadline text
  const deadlineMatch = text.match(
    /\b(by\s+\S+(?:\s+\S+){0,2}|due\s+\S+(?:\s+\S+){0,2}|before\s+\S+(?:\s+\S+){0,2}|until\s+\S+(?:\s+\S+){0,2})\b/i
  )
  const deadlineText = deadlineMatch?.[1]

  // 1. Reminder check
  if (hasReminderSignal(text)) {
    const whenMatch = lower.match(/\b(tomorrow|today|tonight|end\s+of\s+(?:day|week)|this\s+(?:morning|afternoon|evening))\b/)
    return {
      category: 'reminder',
      confidence: 'high',
      title: text,
      priority,
      day,
      when: whenMatch?.[1],
    }
  }

  // 2. Event check
  if (hasEventSignal(text)) {
    return {
      category: 'event',
      confidence: 'high',
      title: text,
      priority,
      day,
      isDayAmbiguous,
    }
  }

  // 3. Explicit deadline language
  if (hasDeadlineSignal(text) && !hasHabitFrequency(text)) {
    return {
      category: 'deadline',
      confidence: day ? 'high' : 'medium',
      title: text.replace(/\b(?:by|due|deadline|before|until)\b\s*/i, '').trim(),
      priority,
      day,
      isDayAmbiguous,
      deadlineText,
    }
  }

  // 4. Habit: frequency word OR well-known habit noun
  const hasFreq = hasHabitFrequency(text)
  const hasHabitNoun = hasHabitWord(text)
  const isBreakHabit = hasBreakHabitSignal(text)

  if (hasFreq || (hasHabitNoun && !hasTaskVerb(text))) {
    // Determine frequency
    let frequency: 'daily' | 'weekly' | 'unknown' = 'unknown'
    if (/every\s+(?:day|morning|evening|night|weekday)|\bdaily\b/i.test(text)) frequency = 'daily'
    else if (/every\s+week|\bweekly\b/i.test(text)) frequency = 'weekly'

    return {
      category: 'habit',
      confidence: hasFreq ? 'high' : 'medium',
      title: text,
      priority: 'low',
      frequency,
      isBreakHabit,
    }
  }

  // 5. Goal: aspiration language
  if (hasGoalSignal(text) && !hasTaskVerb(text)) {
    return {
      category: 'goal',
      confidence: timeframe ? 'high' : 'medium',
      title: text,
      priority,
      timeframe,
    }
  }

  // 6. Task: clear action verb
  if (hasTaskVerb(text)) {
    return {
      category: 'task',
      confidence: day ? 'high' : 'medium',
      title: text,
      priority,
      day,
      isDayAmbiguous,
      deadlineText,
    }
  }

  // 7. Goal with aspiration (want/need without clear action verb) — still possible
  if (hasGoalSignal(text)) {
    return {
      category: 'goal',
      confidence: 'low',
      title: text,
      priority,
      timeframe,
    }
  }

  // 8. Note — fallback
  return {
    category: 'note',
    confidence: 'low',
    title: text,
    priority: 'low',
  }
}
