import { AI_ACTIONS } from '../actions'
import type { AIActionId } from '../types'

export interface ActionPromptInput {
  brainDumpText?: string
}

export function buildActionPrompt(actionId: AIActionId, input: ActionPromptInput = {}): string {
  if (actionId === 'organize-brain-dump' && input.brainDumpText?.trim()) {
    return `Organize this brain dump into tasks, goals, habits, reminders, and deadlines:\n\n${input.brainDumpText.trim()}`
  }

  return AI_ACTIONS[actionId].promptIntent
}
