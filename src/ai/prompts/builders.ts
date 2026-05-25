import { getWorkspaceModeDefinition } from '../modes'
import type { AIContext, AIMessage, WorkspaceMode } from '../types'

export function buildWorkspaceSystemPrompt(): AIMessage {
  return {
    role: 'system',
    content:
      'You are WeeklyOS AI, a calm contextual productivity operating layer. Use actual workspace context, avoid generic motivation, and prefer strategic, actionable guidance.',
  }
}

export function buildModePrompt(mode: WorkspaceMode): AIMessage {
  const definition = getWorkspaceModeDefinition(mode)
  return {
    role: 'system',
    content: `Current workspace mode: ${definition.label}. Purpose: ${definition.description}`,
  }
}

export function buildContextPrompt(context: AIContext): AIMessage {
  return {
    role: 'system',
    content: [
      `Week: ${context.week.title} (${context.week.dateRange || 'current range'})`,
      `Tasks: ${context.tasks.pending} pending, ${context.tasks.completed} completed, ${context.metrics.completionRate}% complete`,
      `Focus: ${context.focus.totalMinutes} minutes across ${context.focus.sessionCount} sessions`,
      `Habits: ${context.habits.items.length} active/contextual habits, ${context.habits.completionCount} completions`,
    ].join('\n'),
    metadata: {
      promptBuilder: 'context-summary',
    },
  }
}

export function buildWorkspacePromptMessages(mode: WorkspaceMode, context: AIContext, userInput: string): AIMessage[] {
  return [
    buildWorkspaceSystemPrompt(),
    buildModePrompt(mode),
    buildContextPrompt(context),
    {
      role: 'user',
      content: userInput,
    },
  ]
}
