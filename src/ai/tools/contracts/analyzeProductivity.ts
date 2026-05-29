import type { AIContext, AITool, AIToolResult } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export type ProductivityFocus = 'tasks' | 'focus' | 'habits' | 'all'

export interface AnalyzeProductivityInput {
  focus?: ProductivityFocus
}

export type ProductivitySignal = 'positive' | 'neutral' | 'concern'

export interface AnalyzeProductivityOutput {
  insights: string[]
  risks: string[]
  recommendations: string[]
  overallSignal: ProductivitySignal
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export const analyzeProductivityContract: AITool<
  AnalyzeProductivityInput,
  AnalyzeProductivityOutput
> = {
  id: 'analyzeProductivity',
  name: 'Analyze Productivity',
  description:
    'Compute a structured productivity analysis from workspace context — task completion, focus quality, and habit consistency. Returns insights, risks, and recommendations without requiring an LLM call.',
  category: 'analysis',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Productivity analysis parameters',
    properties: {
      focus: {
        type: 'string',
        description: 'Analysis scope: tasks | focus | habits | all (default: all)',
      },
    },
    required: [],
  },

  outputSchema: {
    type: 'object',
    description: 'Structured productivity analysis',
    properties: {
      insights: { type: 'array', description: 'Positive signals observed', items: { type: 'string' } },
      risks: { type: 'array', description: 'Problem patterns identified', items: { type: 'string' } },
      recommendations: { type: 'array', description: 'Suggested next actions', items: { type: 'string' } },
      overallSignal: { type: 'string', description: 'positive | neutral | concern' },
    },
    required: ['insights', 'risks', 'recommendations', 'overallSignal'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<AnalyzeProductivityOutput>> => {
    const { tasks, focus, habits, metrics } = context
    const scope: ProductivityFocus = input.focus ?? 'all'

    const insights: string[] = []
    const risks: string[] = []
    const recommendations: string[] = []

    // ── Task Analysis ────────────────────────────────────────────────────────
    if (scope === 'tasks' || scope === 'all') {
      if (metrics.totalPlanned === 0) {
        risks.push('No tasks planned this week — workspace may not reflect actual work')
        recommendations.push('Add tasks to get meaningful context and planning support')
      } else if (metrics.completionRate >= 75) {
        insights.push(`Strong completion: ${metrics.completionRate}% of ${metrics.totalPlanned} planned tasks finished`)
      } else if (metrics.completionRate >= 40) {
        insights.push(`Moderate completion: ${metrics.completionRate}% of ${metrics.totalPlanned} tasks done`)
        if (metrics.pendingCount > 4) {
          recommendations.push('Consider reducing planned tasks next week — current backlog is building')
        }
      } else if (metrics.totalPlanned > 0) {
        risks.push(`Low completion: ${metrics.completionRate}% — ${metrics.pendingCount} tasks remain`)
        recommendations.push('Audit pending tasks: cancel, defer, or break down anything stalled')
      }

      const highPending = tasks.items.filter(
        (t) => t.status === 'pending' && t.priority === 'high'
      ).length
      if (highPending > 3) {
        risks.push(`${highPending} high-priority tasks still pending — risk of extended delay`)
        recommendations.push('Protect dedicated time for high-priority items before new work')
      } else if (highPending === 0 && metrics.pendingCount > 0) {
        insights.push('No high-priority tasks are stuck — pending load is lower-stakes')
      }
    }

    // ── Focus Analysis ───────────────────────────────────────────────────────
    if (scope === 'focus' || scope === 'all') {
      if (focus.sessionCount === 0) {
        risks.push('No focus sessions logged — unable to verify actual deep-work patterns')
        recommendations.push('Log at least one focused work block per day using the timer')
      } else if (focus.totalMinutes >= 120) {
        insights.push(
          `${focus.totalMinutes} focus minutes across ${focus.sessionCount} sessions — sustained engagement`
        )
      } else {
        insights.push(
          `${focus.totalMinutes} focus minutes logged — consider longer uninterrupted blocks`
        )
        if (focus.totalMinutes < 60) {
          recommendations.push('Aim for at least 60 consecutive focus minutes per working day')
        }
      }
    }

    // ── Habit Analysis ───────────────────────────────────────────────────────
    if (scope === 'habits' || scope === 'all') {
      if (habits.items.length === 0) {
        // No habits set up — not a risk, just no signal
      } else if (habits.completionCount === 0) {
        risks.push('Active habits have zero completions logged this week')
        recommendations.push('Log habit completions daily to maintain pattern visibility')
      } else {
        insights.push(
          `${habits.completionCount} habit completions across ${habits.items.length} tracked habits`
        )
      }
    }

    // ── Overall Signal ───────────────────────────────────────────────────────
    const overallSignal: ProductivitySignal =
      risks.length === 0 && insights.length > 0
        ? 'positive'
        : risks.length >= 2
          ? 'concern'
          : 'neutral'

    if (recommendations.length === 0 && risks.length > 0) {
      recommendations.push('Reduce scope and focus on one high-impact task before adding new commitments')
    }

    return { ok: true, output: { insights, risks, recommendations, overallSignal } }
  },
}
