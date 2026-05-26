import type { AmbiguousItem, BrainDumpCategory } from '../types'
import type { ClassificationResult } from './classifier'
import type { TextSegment } from './preprocessor'

// ─── Ambiguity Rules ──────────────────────────────────────────────────────────

/** Signal words that reliably indicate the user is uncertain. */
const UNCERTAINTY_WORDS =
  /\b(?:maybe|possibly|might|thinking\s+about|considering|perhaps|not\s+sure|or\s+something|somehow|restart|resume|again|back\s+to)\b/i

/** Verbs that are genuinely ambiguous between task and habit. */
const HABIT_TASK_DUAL_VERBS = /\b(?:study|learn|read|practice|train|exercise|run|code|write)\b/i

/** Short segments (<= 3 words) without strong signals are usually ambiguous. */
function isVagueSegment(text: string): boolean {
  const words = text.trim().split(/\s+/)
  return words.length <= 3
}

// ─── Clarification Generator ──────────────────────────────────────────────────

function generateClarificationQuestion(
  text: string,
  possibleCategories: BrainDumpCategory[],
  reasons: string[]
): string {
  // Specific patterns first
  if (/\b(?:gym|workout|run|jog|exercise|meditate|yoga|swim)\b/i.test(text)) {
    if (UNCERTAINTY_WORDS.test(text)) {
      return `"${text}" — are you setting a goal to restart this habit, or planning a specific session this week?`
    }
    return `Is "${text}" a one-time task or a recurring daily/weekly habit?`
  }

  if (/\b(?:study|learn|read|practice)\b/i.test(text)) {
    const hasDay = /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b/i.test(text)
    if (hasDay) {
      return `"${text}" — is this a one-time study session or a recurring habit you want to track daily?`
    }
    return `Is "${text}" a scheduled task or a habit you want to build over time?`
  }

  if (/\bproject\b/i.test(text) && !/\b(?:the|my|our)\s+\w+\s+project\b/i.test(text)) {
    return `Which project does "${text}" refer to?`
  }

  if (reasons.includes('temporal_ambiguity')) {
    const dayMatch = text.match(
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    )
    if (dayMatch) {
      return `"${dayMatch[1]}" — do you mean this ${dayMatch[1]} or next ${dayMatch[1]}?`
    }
  }

  // Generic by category pair
  if (possibleCategories.includes('habit') && possibleCategories.includes('goal')) {
    return `Is "${text}" a one-time goal or a recurring habit you'd like to track?`
  }
  if (possibleCategories.includes('task') && possibleCategories.includes('habit')) {
    return `Is "${text}" a single task this week, or a habit you want to build?`
  }
  if (possibleCategories.includes('goal') && possibleCategories.includes('task')) {
    return `Is "${text}" something you want to accomplish this week, or a longer-term goal?`
  }

  return `What exactly do you mean by "${text}"? Can you be more specific?`
}

// ─── Ambiguity Detector ───────────────────────────────────────────────────────

export interface AmbiguityDetectionInput {
  segment: TextSegment
  classification: ClassificationResult
  itemId: string
}

/**
 * Determines whether a classified item has enough ambiguity to warrant
 * user clarification. Returns an `AmbiguousItem` if so, `null` otherwise.
 *
 * An item is considered ambiguous when:
 * - Its classification confidence is 'low'
 * - It matches multiple possible categories
 * - It contains explicit uncertainty language
 * - It has temporal ambiguity (bare day name without week qualifier)
 * - It is very short with no strong signal
 */
export function detectAmbiguity(input: AmbiguityDetectionInput): AmbiguousItem | null {
  const { segment, classification, itemId } = input
  const { text } = segment

  const reasons: string[] = []
  const possibleCategories: BrainDumpCategory[] = [classification.category]

  // Check explicit uncertainty language
  if (UNCERTAINTY_WORDS.test(text)) {
    reasons.push('explicit_uncertainty')
  }

  // Check dual-verb ambiguity (task vs habit)
  if (HABIT_TASK_DUAL_VERBS.test(text)) {
    if (!possibleCategories.includes('habit')) possibleCategories.push('habit')
    if (!possibleCategories.includes('task')) possibleCategories.push('task')
    reasons.push('dual_category_verb')
  }

  // Temporal ambiguity
  if (classification.isDayAmbiguous) {
    reasons.push('temporal_ambiguity')
  }

  // Vague segment
  if (isVagueSegment(text) && classification.confidence === 'low') {
    reasons.push('vague_segment')
    if (!possibleCategories.includes('note')) possibleCategories.push('note')
  }

  // Goal that could be a habit
  if (
    classification.category === 'goal' &&
    /\b(?:restart|resume|start\s+(?:going|doing)|begin\s+(?:going|doing))\b/i.test(text)
  ) {
    if (!possibleCategories.includes('habit')) possibleCategories.push('habit')
    reasons.push('goal_habit_overlap')
  }

  // Only flag as ambiguous if there's a real reason
  const isAmbiguous =
    reasons.length > 0 &&
    (classification.confidence === 'low' ||
      possibleCategories.length > 1 ||
      reasons.includes('explicit_uncertainty') ||
      reasons.includes('temporal_ambiguity'))

  if (!isAmbiguous) return null

  return {
    id: itemId,
    rawText: text,
    category: 'ambiguous',
    confidence: 'low',
    text,
    possibleCategories: [...new Set(possibleCategories)],
    ambiguityReasons: reasons,
    clarificationQuestion: generateClarificationQuestion(text, possibleCategories, reasons),
  }
}
