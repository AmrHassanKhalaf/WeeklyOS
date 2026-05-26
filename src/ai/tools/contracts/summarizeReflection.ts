import type { AIContext, AITool, AIToolResult, ReflectionSummary } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface SummarizeReflectionInput {
  weekId?: string
}

// Output reuses the existing ReflectionSummary shape
export type SummarizeReflectionOutput = ReflectionSummary

// ─── Contract ─────────────────────────────────────────────────────────────────

export const summarizeReflectionContract: AITool<
  SummarizeReflectionInput,
  SummarizeReflectionOutput
> = {
  id: 'summarizeReflection',
  name: 'Summarize Reflection',
  description:
    'Distill the captured reflection notes (went well, struggles, lessons) into a structured summary with actionable next steps. Focused specifically on the reflection layer, not full week metrics.',
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
    description: 'Structured reflection summary',
    properties: {
      wins: { type: 'array', description: 'Wins from reflection notes', items: { type: 'string' } },
      struggles: { type: 'array', description: 'Struggles from reflection notes', items: { type: 'string' } },
      lessons: { type: 'array', description: 'Lessons extracted from notes', items: { type: 'string' } },
      nextActions: { type: 'array', description: 'Suggested next steps', items: { type: 'string' } },
      sourceWeekId: { type: 'string', description: 'Week ID that was summarized' },
    },
    required: ['wins', 'struggles', 'lessons', 'nextActions'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<SummarizeReflectionOutput>> => {
    const { reflections, week } = context

    const wins: string[] = []
    const struggles: string[] = []
    const lessons: string[] = []
    const nextActions: string[] = []

    if (reflections.wentWell?.trim()) {
      wins.push(reflections.wentWell.trim().slice(0, 300))
    }
    if (reflections.struggle?.trim()) {
      struggles.push(reflections.struggle.trim().slice(0, 300))
    }
    if (reflections.lessons?.trim()) {
      lessons.push(reflections.lessons.trim().slice(0, 300))
    }

    if (wins.length === 0 && struggles.length === 0 && lessons.length === 0) {
      return {
        ok: false,
        error: 'No reflection notes captured yet. Complete the weekly evaluation first.',
      }
    }

    // Suggest next actions from lessons
    if (lessons.length > 0) {
      nextActions.push('Apply the lesson identified above in the next planning session')
    }
    if (struggles.length > 0) {
      nextActions.push('Address the struggle identified before starting next week\'s planning')
    }

    return {
      ok: true,
      output: {
        wins,
        struggles,
        lessons,
        nextActions,
        sourceWeekId: input.weekId ?? week.id,
      },
    }
  },
}
