import type { AIContext, AITool, AIToolResult, DayOfWeek, Priority } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface GenerateDayPlanInput {
  day: DayOfWeek
  objective?: string
  availableMinutes?: number
}

export interface DayPlanTask {
  title: string
  priority: Priority
  estimatedTime?: string
}

export interface DayPlanFocusBlock {
  label: string
  durationMinutes?: number
}

export interface GenerateDayPlanOutput {
  day: DayOfWeek
  objective?: string
  availableTasks: DayPlanTask[]
  suggestedFocusBlocks: DayPlanFocusBlock[]
  notes: string
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export const generateDayPlanContract: AITool<GenerateDayPlanInput, GenerateDayPlanOutput> = {
  id: 'generateDayPlan',
  name: 'Generate Day Plan',
  description:
    'Build a focused single-day plan from tasks assigned to that day and pending rollover. Suggests focus blocks based on task priority and available time.',
  category: 'planning',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Day plan generation parameters',
    properties: {
      day: { type: 'string', description: 'Target day of week (required)' },
      objective: { type: 'string', description: 'The one main outcome for this day' },
      availableMinutes: {
        type: 'number',
        description: 'Total available working minutes for this day',
      },
    },
    required: ['day'],
  },

  outputSchema: {
    type: 'object',
    description: 'Structured single-day plan',
    properties: {
      day: { type: 'string', description: 'The planned day' },
      objective: { type: 'string', description: 'Day objective' },
      availableTasks: { type: 'array', description: 'Tasks available for this day' },
      suggestedFocusBlocks: { type: 'array', description: 'Suggested focus time blocks' },
      notes: { type: 'string', description: 'Planning notes for this day' },
    },
    required: ['day', 'availableTasks', 'suggestedFocusBlocks', 'notes'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<GenerateDayPlanOutput>> => {
    const { tasks } = context
    const { day, objective, availableMinutes } = input

    // Tasks assigned to this day or unscheduled (pending)
    const dayTasks = tasks.items.filter(
      (t) => t.status === 'pending' && (t.day === day || !t.day)
    )

    const availableTasks: DayPlanTask[] = dayTasks
      .sort((a, b) => {
        const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      })
      .slice(0, 6)
      .map((t) => ({ title: t.title, priority: t.priority, estimatedTime: t.estimatedTime }))

    // Suggest focus blocks based on task count and available time
    const suggestedFocusBlocks: DayPlanFocusBlock[] = []
    const highPriorityTasks = availableTasks.filter((t) => t.priority === 'high')

    if (highPriorityTasks.length > 0) {
      suggestedFocusBlocks.push({
        label: `Deep work — ${highPriorityTasks[0].title}`,
        durationMinutes: availableMinutes ? Math.min(90, Math.floor(availableMinutes * 0.4)) : 90,
      })
    }

    if (availableTasks.length > 1) {
      suggestedFocusBlocks.push({
        label: 'Medium tasks batch',
        durationMinutes: availableMinutes ? Math.min(60, Math.floor(availableMinutes * 0.3)) : 60,
      })
    }

    const notes =
      availableTasks.length === 0
        ? 'No tasks currently assigned to this day — consider pulling from pending backlog.'
        : `${availableTasks.length} tasks available for ${day}. Start with the highest priority item before context switching.`

    return {
      ok: true,
      output: {
        day,
        objective,
        availableTasks,
        suggestedFocusBlocks,
        notes,
      },
    }
  },
}
