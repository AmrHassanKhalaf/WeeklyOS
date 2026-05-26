// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextSegment {
  /** The cleaned text of this segment. */
  text: string
  /** Zero-based position in the original segmentation order. */
  position: number
}

// ─── Separators ───────────────────────────────────────────────────────────────

/**
 * Regex that splits on natural language sentence boundaries and list connectors.
 * Keeps splits minimal to preserve context clues like "by Thursday".
 */
const SEGMENT_SPLITTER =
  /\n+|(?<=[.!?])\s+|(?:,?\s+(?:and\s+(?:then|also)\s+|also\s+|then\s+|plus\s+|additionally\s+|furthermore\s+|moreover\s+))/i

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizeSegment(text: string): string {
  return text
    .trim()
    // Collapse inner whitespace
    .replace(/\s+/g, ' ')
    // Drop leading list characters
    .replace(/^[-*•–—]\s+/, '')
    // Drop leading ordinal markers like "1. " "2) "
    .replace(/^\d+[.)]\s+/, '')
}

// ─── Preprocessor ─────────────────────────────────────────────────────────────

/**
 * Splits raw brain-dump text into clean, individually classifiable segments.
 *
 * Design goals:
 * - Split on natural boundaries (newlines, full stops, list connectors)
 * - Preserve short but meaningful fragments ("gym", "API", "study AI")
 * - Drop pure noise (empty strings, punctuation-only fragments)
 */
export function preprocessBrainDump(rawInput: string): TextSegment[] {
  if (!rawInput.trim()) return []

  const normalized = rawInput.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  return normalized
    .split(SEGMENT_SPLITTER)
    .map(normalizeSegment)
    .filter((text) => {
      if (!text) return false
      // At least 2 non-punctuation characters
      if (text.replace(/[^\w\s]/g, '').length < 2) return false
      return true
    })
    .map((text, position) => ({ text, position }))
}
