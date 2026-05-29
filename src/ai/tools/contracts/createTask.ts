import type { AITool, AIToolResult, DayOfWeek, Priority } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string
  priority: Priority
  day?: DayOfWeek
  estimatedTime?: string
  tags?: string[]
  description?: string
}

export interface CreateTaskOutput {
  proposedTask: CreateTaskInput
  requiresConfirmation: true
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export const createTaskContract: AITool<CreateTaskInput, CreateTaskOutput> = {
  id: 'createTask',
  name: 'Create Task',
  description:
    'Propose creating a new task in the weekly workspace. Returns a proposed task structure that requires user confirmation before being written to the plan.',
  category: 'task',
  requiresConfirmation: true,

  inputSchema: {
    type: 'object',
    description: 'Task creation parameters',
    properties: {
      title: { type: 'string', description: 'The task title (required)' },
      priority: { type: 'string', description: 'Priority level: high | medium | low' },
      day: { type: 'string', description: 'Day of week to schedule the task' },
      estimatedTime: { type: 'string', description: 'Time estimate, e.g. "2h" or "30m"' },
      tags: {
        type: 'array',
        description: 'Optional category tags',
        items: { type: 'string' },
      },
      description: { type: 'string', description: 'Optional longer task description' },
    },
    required: ['title', 'priority'],
  },

  outputSchema: {
    type: 'object',
    description: 'Proposed task — awaits user confirmation',
    properties: {
      proposedTask: { type: 'object', description: 'The task as it would be created' },
      requiresConfirmation: { type: 'boolean', description: 'Always true' },
    },
    required: ['proposedTask', 'requiresConfirmation'],
  },

  execute: async (input): Promise<AIToolResult<CreateTaskOutput>> => {
    return {
      ok: true,
      output: {
        proposedTask: {
          title: input.title,
          priority: input.priority,
          day: input.day,
          estimatedTime: input.estimatedTime,
          tags: input.tags,
          description: input.description,
        },
        requiresConfirmation: true,
      },
    }
  },
}
