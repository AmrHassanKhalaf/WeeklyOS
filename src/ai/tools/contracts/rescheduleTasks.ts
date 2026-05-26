import type { AIContext, AITool, AIToolResult, DayOfWeek } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface RescheduleTasksInput {
  fromDay?: DayOfWeek
  reason?: string
  maxTasksToMove?: number
}

export interface RescheduleProposal {
  taskId: string
  title: string
  fromDay: DayOfWeek
  toDay: DayOfWeek
  reason: string
}

export interface RescheduleTasksOutput {
  proposed: RescheduleProposal[]
  requiresConfirmation: true
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_DAYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

// ─── Contract ─────────────────────────────────────────────────────────────────

export const rescheduleTasksContract: AITool<RescheduleTasksInput, RescheduleTasksOutput> = {
  id: 'rescheduleTasks',
  name: 'Reschedule Tasks',
  description:
    'Analyze workload distribution and propose moving lower-priority tasks from overloaded days to lighter ones. Returns a proposed reschedule plan that requires user confirmation.',
  category: 'planning',
  requiresConfirmation: true,

  inputSchema: {
    type: 'object',
    description: 'Reschedule parameters',
    properties: {
      fromDay: {
        type: 'string',
        description: 'Source day to relieve. Defaults to the most overloaded day.',
      },
      reason: {
        type: 'string',
        description: 'Optional reason label to include in proposed moves',
      },
      maxTasksToMove: {
        type: 'number',
        description: 'Maximum number of tasks to propose moving (default: 2)',
      },
    },
    required: [],
  },

  outputSchema: {
    type: 'object',
    description: 'Proposed reschedule plan — awaits user confirmation',
    properties: {
      proposed: {
        type: 'array',
        description: 'List of proposed task moves',
        items: { type: 'object' },
      },
      requiresConfirmation: { type: 'boolean', description: 'Always true' },
    },
    required: ['proposed', 'requiresConfirmation'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<RescheduleTasksOutput>> => {
    const { tasks } = context
    const maxMoves = input.maxTasksToMove ?? 2

    // Build per-day pending counts
    const dayPendingCount = new Map<DayOfWeek, number>()
    for (const day of ALL_DAYS) {
      const metrics = tasks.byDay[day]
      if (metrics && metrics.pending > 0) {
        dayPendingCount.set(day, metrics.pending)
      }
    }

    if (dayPendingCount.size === 0) {
      return { ok: true, output: { proposed: [], requiresConfirmation: true } }
    }

    // Determine source day (most overloaded or specified)
    const sourceDay: DayOfWeek =
      input.fromDay ??
      ([...dayPendingCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as DayOfWeek)

    if (!sourceDay) {
      return { ok: true, output: { proposed: [], requiresConfirmation: true } }
    }

    // Determine lightest destination day (fewest pending, different from source)
    const destinationDay: DayOfWeek =
      ([...dayPendingCount.entries()]
        .filter(([day]) => day !== sourceDay)
        .sort((a, b) => a[1] - b[1])[0]?.[0] as DayOfWeek) ?? 'friday'

    // Find non-high-priority pending tasks on the source day
    const moveCandidates = tasks.items
      .filter((t) => t.status === 'pending' && t.day === sourceDay && t.priority !== 'high')
      .slice(0, maxMoves)

    if (moveCandidates.length === 0) {
      return { ok: true, output: { proposed: [], requiresConfirmation: true } }
    }

    const proposed: RescheduleProposal[] = moveCandidates.map((t) => ({
      taskId: t.id,
      title: t.title,
      fromDay: sourceDay,
      toDay: destinationDay,
      reason: input.reason ?? `Relieving overload on ${sourceDay} — moved to lighter ${destinationDay}`,
    }))

    return { ok: true, output: { proposed, requiresConfirmation: true } }
  },
}
