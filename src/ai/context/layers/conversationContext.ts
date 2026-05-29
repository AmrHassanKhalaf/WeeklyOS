import type { ConversationContextLayer } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal shape required to build the conversation layer. */
export interface ConversationTurn {
  role: string
  content: string
}

const MAX_RECENT_TURNS = 6

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Normalizes raw conversation history into a structured context layer.
 *
 * Strips system messages, enforces user/assistant alternation, and limits to
 * the most recent turns to keep token usage bounded. The result is suitable
 * for inclusion in any AI provider request.
 */
export function buildConversationContext(history: ConversationTurn[]): ConversationContextLayer {
  const validTurns = history
    .filter((m) => {
      const role = m.role?.toLowerCase()
      return (role === 'user' || role === 'assistant' || role === 'ai') && m.content?.trim()
    })
    .slice(-MAX_RECENT_TURNS)
    .map((m) => ({
      role: m.role === 'assistant' || m.role === 'ai' ? ('assistant' as const) : ('user' as const),
      content: m.content.trim(),
    }))

  return {
    messageCount: history.length,
    hasHistory: validTurns.length > 0,
    recentTurns: validTurns,
  }
}
