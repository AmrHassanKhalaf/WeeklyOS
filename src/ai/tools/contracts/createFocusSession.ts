import type { AITool, AIToolResult } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface CreateFocusSessionInput {
  taskId?: string
  taskTitle?: string
  durationMinutes?: number
}

export interface CreateFocusSessionOutput {
  navigationTarget: '/focused-day'
  suggested: {
    taskTitle?: string
    durationMinutes: number
  }
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export const createFocusSessionContract: AITool<
  CreateFocusSessionInput,
  CreateFocusSessionOutput
> = {
  id: 'createFocusSession',
  name: 'Create Focus Session',
  description:
    'Prepare a focus session for a given task and navigate to the Focused Day timer. Does not write to the store — the user starts the session from the timer UI.',
  category: 'focus',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Focus session parameters',
    properties: {
      taskId: { type: 'string', description: 'ID of the task to focus on' },
      taskTitle: { type: 'string', description: 'Display title for the focus session' },
      durationMinutes: { type: 'number', description: 'Target session duration in minutes (default: 25)' },
    },
    required: [],
  },

  outputSchema: {
    type: 'object',
    description: 'Navigation instruction with session suggestion',
    properties: {
      navigationTarget: { type: 'string', description: 'Route to navigate to' },
      suggested: { type: 'object', description: 'Suggested session settings' },
    },
    required: ['navigationTarget', 'suggested'],
  },

  execute: async (input): Promise<AIToolResult<CreateFocusSessionOutput>> => {
    return {
      ok: true,
      output: {
        navigationTarget: '/focused-day',
        suggested: {
          taskTitle: input.taskTitle,
          durationMinutes: input.durationMinutes ?? 25,
        },
      },
    }
  },
}
