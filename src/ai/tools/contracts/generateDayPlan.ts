import type { AIContext, AITool, AIToolResult, DayOfWeek } from '../../types'
import { runPlanningPipeline } from '../../planning/pipeline'
import type { PlanningResult } from '../../planning/types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface GenerateDayPlanInput {
  day: DayOfWeek
  objective?: string
  availableMinutes?: number
}

export type GenerateDayPlanOutput = PlanningResult

// ─── Contract ─────────────────────────────────────────────────────────────────

export const generateDayPlanContract: AITool<GenerateDayPlanInput, GenerateDayPlanOutput> = {
  id: 'generateDayPlan',
  name: 'Generate Day Plan',
  description:
    'Run the Planning Engine for a single day — filters to tasks assigned to or unscheduled for that day, prioritizes them with reasoning, suggests focus blocks, and surfaces overload warnings specific to that day.',
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
    description: 'PlanningResult scoped to a single day',
    properties: {
      mode: { type: 'string' },
      summary: { type: 'object' },
      prioritizedTasks: { type: 'array', items: { type: 'object' } },
      suggestedFocusBlocks: { type: 'array', items: { type: 'object' } },
      recommendations: { type: 'array', items: { type: 'object' } },
    },
    required: ['mode', 'summary', 'prioritizedTasks'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<GenerateDayPlanOutput>> => {
    const result = runPlanningPipeline(context, {
      mode: 'day',
      targetDay: input.day,
      focusObjective: input.objective,
      maxRebalanceProposals: 1,
      maxRecommendations: 3,
    })
    return { ok: true, output: result }
  },
}

// Keep legacy types for any external consumers that imported them
export type { DayOfWeek }
