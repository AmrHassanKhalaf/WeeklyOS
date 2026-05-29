import type { AITool, AIToolResult, DayOfWeek, Priority, TaskStatus } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface UpdateTaskFields {
  title?: string
  priority?: Priority
  status?: TaskStatus
  day?: DayOfWeek
  estimatedTime?: string
}

export interface UpdateTaskInput {
  taskId: string
  updates: UpdateTaskFields
}

export interface UpdateTaskOutput {
  taskId: string
  proposedUpdates: UpdateTaskFields
  requiresConfirmation: true
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export const updateTaskContract: AITool<UpdateTaskInput, UpdateTaskOutput> = {
  id: 'updateTask',
  name: 'Update Task',
  description:
    'Propose updating an existing task in the workspace. Returns a proposed change set that requires user confirmation before being applied.',
  category: 'task',
  requiresConfirmation: true,

  inputSchema: {
    type: 'object',
    description: 'Task update parameters',
    properties: {
      taskId: { type: 'string', description: 'The ID of the task to update' },
      updates: {
        type: 'object',
        description: 'The fields to update',
        properties: {
          title: { type: 'string', description: 'New title' },
          priority: { type: 'string', description: 'New priority: high | medium | low' },
          status: { type: 'string', description: 'New status: pending | done' },
          day: { type: 'string', description: 'New day assignment' },
          estimatedTime: { type: 'string', description: 'New time estimate' },
        },
      },
    },
    required: ['taskId', 'updates'],
  },

  outputSchema: {
    type: 'object',
    description: 'Proposed task update — awaits user confirmation',
    properties: {
      taskId: { type: 'string', description: 'ID of the task to update' },
      proposedUpdates: { type: 'object', description: 'The changes to apply' },
      requiresConfirmation: { type: 'boolean', description: 'Always true' },
    },
    required: ['taskId', 'proposedUpdates', 'requiresConfirmation'],
  },

  execute: async (input): Promise<AIToolResult<UpdateTaskOutput>> => {
    return {
      ok: true,
      output: {
        taskId: input.taskId,
        proposedUpdates: input.updates,
        requiresConfirmation: true,
      },
    }
  },
}
