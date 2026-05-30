import type { AIContext, AITool, AIToolResult } from '../../types'
import { runReflectionPipeline } from '../../reflection/pipeline'
import type { ReflectionResult } from '../../reflection/types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface SummarizeReflectionInput {
  weekId?: string
}

export type SummarizeReflectionOutput = ReflectionResult

// ─── Contract ─────────────────────────────────────────────────────────────────

export const summarizeReflectionContract: AITool<
  SummarizeReflectionInput,
  SummarizeReflectionOutput
> = {
  id: 'summarizeReflection',
  name: 'Summarize Reflection',
  description:
    'Run the Reflection Engine focused on reflection notes and behavioral patterns. Analyzes completion, focus, habits, and behavior to produce structured wins, struggles, lessons, and insights. All analysis is grounded in real productivity data.',
  category: 'reflection',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Reflection summary parameters',
    properties: {
      weekId: { type: 'string', description: 'Optional week ID to summarize (defaults to current week)' },
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

  execute: async (_input, context: AIContext): Promise<AIToolResult<SummarizeReflectionOutput>> => {
    // Check if user has captured any reflection notes
    const { reflections } = context
    const hasReflectionNotes =
      (reflections.wentWell?.trim() ?? '') !== '' ||
      (reflections.struggle?.trim() ?? '') !== '' ||
      (reflections.lessons?.trim() ?? '') !== ''

    if (!hasReflectionNotes) {
      return {
        ok: false,
        error: 'No reflection notes captured yet. Complete the weekly evaluation first.',
      }
    }

    const result = runReflectionPipeline(context, {
      includeUserReflections: true,
      maxInsights: 6,
      generateNextWeekRecommendations: true,
    })
    return { ok: true, output: result }
  },
}
