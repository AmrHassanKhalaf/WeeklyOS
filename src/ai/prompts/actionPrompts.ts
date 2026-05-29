import { AI_ACTIONS } from '../actions'
import type { AIActionId } from '../types'

export interface ActionPromptInput {
  brainDumpText?: string
}

/**
 * Builds the user-facing prompt for a given workspace action.
 *
 * For brain dump actions, the prompt explicitly instructs the LLM to:
 * 1. Call the organizeBrainDump tool with the raw text
 * 2. After the tool returns, generate a useful summary + clarification questions
 * 3. Not automatically apply any items — propose only
 */
export function buildActionPrompt(actionId: AIActionId, input: ActionPromptInput = {}): string {
  if (actionId === 'organize-brain-dump') {
    const text = input.brainDumpText?.trim()
    if (text) {
      return [
        'Call the organizeBrainDump tool on the brain dump below. After it returns:',
        '• Summarize what was extracted by category',
        '• For ambiguous items, ask clarifying questions directly (one per item)',
        '• Suggest which tasks could fit into the current week plan',
        '• Note any deadline risks or overloaded day conflicts',
        '• Do NOT create anything automatically — show the proposal first',
        '',
        `Brain dump:\n${text}`,
      ].join('\n')
    }
    return 'Ask the user to share their brain dump text in the composer, then call the organizeBrainDump tool to parse and structure it.'
  }

  return AI_ACTIONS[actionId].promptIntent
}
