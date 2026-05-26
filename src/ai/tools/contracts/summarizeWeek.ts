import type { AIContext, AITool, AIToolResult } from '../../types'
import { runReflectionPipeline } from '../../reflection/pipeline'
import type { ReflectionResult } from '../../reflection/types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface SummarizeWeekInput {
  includeReflections?: boolean
  format?: 'brief' | 'detailed'
}

export type SummarizeWeekOutput = ReflectionResult

// ─── Contract ─────────────────────────────────────────────────────────────────

export const summarizeWeekContract: AITool<SummarizeWeekInput, SummarizeWeekOutput> = {
  id: 'summarizeWeek',
  name: 'Summarize Week',
  description:
    'Run the Reflection Engine to produce a comprehensive weekly analysis. Analyzes completion patterns, focus consistency, habit tracking, and behavioral signals. Returns structured wins, struggles, lessons, insights, and next-week recommendations. All analysis is grounded in real productivity data.',
  category: 'reflection',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Week summary parameters',
    properties: {
      includeReflections: {
        type: 'boolean',
        description: 'Include user reflection notes in the analysis (default: true)',
      },
      format: {
        type: 'string',
        description: 'Output verbosity: brief | detailed (default: detailed)',
      },
    },
    required: [],
  },

  outputSchema: {
    type: 'object',
    description: 'Full ReflectionResult from the Reflection Engine',
    properties: {
      generatedAt: { type: 'string' },
      context: { type: 'object' },
      completion: { type: 'object' },
      focus: { type: 'object' },
      habit: { type: 'object' },
      behavior: { type: 'object' },
      insights: { type: 'array', items: { type: 'object' } },
      summary: { type: 'object' },
      score: { type: 'object' },
      reflectionReasoning: { type: 'array', items: { type: 'string' } },
    },
    required: ['generatedAt', 'context', 'completion', 'focus', 'habit', 'behavior', 'insights', 'summary', 'score'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<SummarizeWeekOutput>> => {
    const result = runReflectionPipeline(context, {
      includeUserReflections: input.includeReflections !== false,
      maxInsights: input.format === 'brief' ? 5 : 8,
      generateNextWeekRecommendations: true,
    })
    return { ok: true, output: result }
  },
}
