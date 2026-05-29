import type { AIContext, AITool, AIToolResult } from '../../types'
import { runPlanningPipeline } from '../../planning/pipeline'
import type { PlanningResult } from '../../planning/types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface GenerateWeekPlanInput {
  focusObjective?: string
  constraints?: string[]
  includeRollover?: boolean
}

export type GenerateWeekPlanOutput = PlanningResult

// ─── Contract ─────────────────────────────────────────────────────────────────

export const generateWeekPlanContract: AITool<GenerateWeekPlanInput, GenerateWeekPlanOutput> = {
  id: 'generateWeekPlan',
  name: 'Generate Week Plan',
  description:
    'Run the Planning Engine to produce a strategic weekly plan. Analyzes workload pressure, prioritizes tasks with reasoning, suggests focus blocks, proposes rebalancing for overloaded days, and generates actionable recommendations. All proposals require user confirmation.',
  category: 'planning',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Week plan generation parameters',
    properties: {
      focusObjective: {
        type: 'string',
        description: 'The primary outcome to aim for this week',
      },
      constraints: {
        type: 'array',
        description: 'Known constraints (e.g. "no meetings Wednesday", "short week")',
        items: { type: 'string' },
      },
      includeRollover: {
        type: 'boolean',
        description: 'Whether to explicitly flag pending rollover tasks in the plan',
      },
    },
    required: [],
  },

  outputSchema: {
    type: 'object',
    description: 'Full PlanningResult from the Planning Engine',
    properties: {
      mode: { type: 'string' },
      summary: { type: 'object' },
      workloadAnalysis: { type: 'object' },
      prioritizedTasks: { type: 'array', items: { type: 'object' } },
      suggestedFocusBlocks: { type: 'array', items: { type: 'object' } },
      rebalanceSuggestions: { type: 'array', items: { type: 'object' } },
      recommendations: { type: 'array', items: { type: 'object' } },
      warnings: { type: 'array', items: { type: 'object' } },
      planningReasoning: { type: 'array', items: { type: 'string' } },
    },
    required: ['mode', 'summary', 'prioritizedTasks', 'recommendations'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<GenerateWeekPlanOutput>> => {
    const result = runPlanningPipeline(context, {
      mode: 'week',
      focusObjective: input.focusObjective,
      constraints: input.constraints,
      maxRebalanceProposals: input.includeRollover ? 4 : 3,
    })
    return { ok: true, output: result }
  },
}
