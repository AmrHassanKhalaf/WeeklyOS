import type { AIContext, AITool, AIToolResult, ReflectionSummary } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface SummarizeWeekInput {
  includeReflections?: boolean
  format?: 'brief' | 'detailed'
}

// Output reuses the existing ReflectionSummary shape
export type SummarizeWeekOutput = ReflectionSummary

// ─── Contract ─────────────────────────────────────────────────────────────────

export const summarizeWeekContract: AITool<SummarizeWeekInput, SummarizeWeekOutput> = {
  id: 'summarizeWeek',
  name: 'Summarize Week',
  description:
    'Generate a structured summary of the week from task completions, focus sessions, habits, and reflection notes. Returns wins, struggles, lessons, and suggested next actions.',
  category: 'reflection',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Week summary parameters',
    properties: {
      includeReflections: {
        type: 'boolean',
        description: 'Include user reflection notes in the summary (default: true)',
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
    description: 'Structured week summary',
    properties: {
      wins: { type: 'array', description: 'Accomplishments and positive signals', items: { type: 'string' } },
      struggles: { type: 'array', description: 'Difficulties and unresolved items', items: { type: 'string' } },
      lessons: { type: 'array', description: 'Extracted lessons for next week', items: { type: 'string' } },
      nextActions: { type: 'array', description: 'Suggested first actions for next week', items: { type: 'string' } },
      sourceWeekId: { type: 'string', description: 'ID of the summarized week' },
    },
    required: ['wins', 'struggles', 'lessons', 'nextActions'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<SummarizeWeekOutput>> => {
    const { tasks, focus, habits, reflections, metrics, week } = context
    const includeReflections = input.includeReflections !== false
    const isBrief = input.format === 'brief'

    const wins: string[] = []
    const struggles: string[] = []
    const lessons: string[] = []
    const nextActions: string[] = []

    // ── Wins ──────────────────────────────────────────────────────────────────
    if (metrics.totalCompleted > 0) {
      wins.push(
        `${metrics.totalCompleted} tasks completed — ${metrics.completionRate}% completion rate`
      )
    }
    if (focus.sessionCount > 0) {
      wins.push(
        isBrief
          ? `${focus.totalMinutes} focus min logged`
          : `${focus.sessionCount} focus sessions — ${focus.totalMinutes} total minutes of tracked deep work`
      )
    }
    if (habits.completionCount > 0 && habits.items.length > 0) {
      wins.push(
        isBrief
          ? `${habits.completionCount} habit completions`
          : `${habits.completionCount} habit completions across ${habits.items.length} tracked habits`
      )
    }
    if (includeReflections && reflections.wentWell) {
      wins.push(reflections.wentWell.slice(0, 200))
    }

    // ── Struggles ─────────────────────────────────────────────────────────────
    if (metrics.pendingCount > metrics.totalCompleted && metrics.totalPlanned > 0) {
      struggles.push(
        `${metrics.pendingCount} tasks remain pending — more was planned than completed`
      )
    }
    if (focus.sessionCount === 0 && metrics.totalPlanned > 0) {
      struggles.push('No focus sessions logged — deep work patterns are not visible this week')
    }
    if (includeReflections && reflections.struggle) {
      struggles.push(reflections.struggle.slice(0, 200))
    }

    // ── Lessons ───────────────────────────────────────────────────────────────
    if (includeReflections && reflections.lessons) {
      lessons.push(reflections.lessons.slice(0, 200))
    }
    if (metrics.completionRate < 50 && metrics.totalPlanned > 0) {
      lessons.push('Plan fewer tasks — set a weekly ceiling and protect it from scope creep')
    }
    if (focus.sessionCount === 0) {
      lessons.push('Block focused time before the week fills with reactive work')
    }

    // ── Next Actions ──────────────────────────────────────────────────────────
    const highPending = tasks.items
      .filter((t) => t.status === 'pending' && t.priority === 'high')
      .slice(0, 3)
    highPending.forEach((t) => nextActions.push(`Continue: "${t.title}"`))

    if (nextActions.length === 0 && metrics.pendingCount > 0) {
      nextActions.push(`Review the ${metrics.pendingCount} remaining pending tasks`)
    }
    if (nextActions.length === 0 && metrics.pendingCount === 0) {
      nextActions.push('Set a clear objective for next week before the week starts')
    }

    return {
      ok: true,
      output: { wins, struggles, lessons, nextActions, sourceWeekId: week.id },
    }
  },
}
