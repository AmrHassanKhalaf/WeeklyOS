import type { AIContext, AITool, AIToolResult, DayOfWeek } from '../../types'
import { runPlanningPipeline } from '../../planning/pipeline'
import type { PlanningResult } from '../../planning/types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface RescheduleTasksInput {
  fromDay?: DayOfWeek
  reason?: string
  maxTasksToMove?: number
}

export type RescheduleTasksOutput = PlanningResult

// ─── Contract ─────────────────────────────────────────────────────────────────

export const rescheduleTasksContract: AITool<RescheduleTasksInput, RescheduleTasksOutput> = {
  id: 'rescheduleTasks',
  name: 'Reschedule Tasks',
  description:
    'Run the Planning Engine in rebalance mode — surfaces overloaded days, proposes concrete task moves to lighter days, and generates a focused rebalancing plan. All moves require user confirmation before being applied.',
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
        description: 'Optional context label for the rebalancing session',
      },
      maxTasksToMove: {
        type: 'number',
        description: 'Maximum number of tasks to propose moving (default: 3)',
      },
    },
    required: [],
  },

  outputSchema: {
    type: 'object',
    description: 'PlanningResult in rebalance mode',
    properties: {
      mode: { type: 'string' },
      summary: { type: 'object' },
      rebalanceSuggestions: { type: 'array', items: { type: 'object' } },
      workloadAnalysis: { type: 'object' },
    },
    required: ['mode', 'rebalanceSuggestions'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<RescheduleTasksOutput>> => {
    const result = runPlanningPipeline(context, {
      mode: 'rebalance',
      targetDay: input.fromDay,
      maxRebalanceProposals: input.maxTasksToMove ?? 3,
      maxRecommendations: 2,
    })
    return { ok: true, output: result }
  },
}

// Keep legacy types for any external consumers
export type { RescheduleTasksInput as RescheduleInput }
