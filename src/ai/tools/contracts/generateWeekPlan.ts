import type { AIContext, AITool, AIToolResult, PlanGenerationResult, Priority } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface GenerateWeekPlanInput {
  focusObjective?: string
  constraints?: string[]
  includeRollover?: boolean
}

// Output reuses the existing PlanGenerationResult shape
export type GenerateWeekPlanOutput = PlanGenerationResult

// ─── Contract ─────────────────────────────────────────────────────────────────

export const generateWeekPlanContract: AITool<GenerateWeekPlanInput, GenerateWeekPlanOutput> = {
  id: 'generateWeekPlan',
  name: 'Generate Week Plan',
  description:
    'Build a structured weekly plan from current workspace context — pending tasks, focus metrics, and workload distribution. Returns a plan skeleton; the AI layer populates day-level objectives.',
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
        description: 'Whether to explicitly include pending rollover tasks in the plan',
      },
    },
    required: [],
  },

  outputSchema: {
    type: 'object',
    description: 'Structured weekly plan',
    properties: {
      weekTitle: { type: 'string', description: 'Suggested week title or theme' },
      dailyPlan: { type: 'array', description: 'Per-day objectives and task suggestions' },
      recommendations: { type: 'array', description: 'Planning recommendations' },
      risks: { type: 'array', description: 'Identified workload risks' },
    },
    required: ['dailyPlan', 'recommendations', 'risks'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<GenerateWeekPlanOutput>> => {
    const { tasks, metrics, week } = context

    const pendingTasks = tasks.items.filter((t) => t.status === 'pending')
    const highPriorityPending = pendingTasks.filter((t) => t.priority === 'high')

    const recommendations: string[] = []
    const risks: string[] = []

    if (input.focusObjective) {
      recommendations.push(`Primary objective: ${input.focusObjective}`)
    }

    if (metrics.pendingCount > 0) {
      recommendations.push(
        `${metrics.pendingCount} pending tasks available — prioritize by energy level, not just urgency`
      )
    }

    if (highPriorityPending.length > 3) {
      risks.push(
        `${highPriorityPending.length} high-priority tasks pending — risk of overcommitting the week`
      )
      recommendations.push('Protect time for the top 2–3 high-priority items before scheduling others')
    }

    if (input.includeRollover && metrics.pendingCount > 0) {
      recommendations.push(
        `${metrics.pendingCount} rollover tasks from current week — review before planning new work`
      )
    }

    for (const constraint of input.constraints ?? []) {
      recommendations.push(`Constraint noted: ${constraint}`)
    }

    // Produce a skeleton daily plan — the AI orchestrator (Phase 2.4) will flesh this out
    const topTasks = pendingTasks
      .sort((a, b) => {
        const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      })
      .slice(0, 5)

    return {
      ok: true,
      output: {
        weekTitle: week.title,
        dailyPlan: [],
        recommendations,
        risks,
        // Attach top tasks as metadata for the LLM orchestrator to use
        _pendingTaskSummary: topTasks.map((t) => ({
          title: t.title,
          priority: t.priority,
          day: t.day,
        })),
      } as GenerateWeekPlanOutput & Record<string, unknown>,
    }
  },
}
