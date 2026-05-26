import type { OrchestratorUIBlock } from '../orchestrator/types'
import type { ReflectionResult, ReflectionInsight } from './types'

// ─── Insight Color Signals ───────────────────────────────────────────────────

const INSIGHT_ICONS: Record<string, string> = {
  win: '✓',
  struggle: '!',
  lesson: '→',
  improvement: '↑',
  warning: '⚠',
  pattern: '◇',
  burnout_signal: '🔥',
  planning_issue: '📋',
}

// ─── UI Block Builders ────────────────────────────────────────────────────────

/**
 * Converts a `ReflectionResult` into structured UI blocks for rich workspace display.
 *
 * Block order:
 * 1. Reflection summary — overall score, headline, key stats
 * 2. Score breakdown — completion, focus, habit contributions
 * 3. Wins — accomplishments and positive signals
 * 4. Struggles — difficulties and unresolved items
 * 5. Lessons — extracted lessons for next week
 * 6. Improvements — actionable improvement suggestions
 * 7. Insights — all insights with evidence and suggested actions
 * 8. Next week recommendations — specific actions for next week
 */
export function buildReflectionUIBlocks(reflection: ReflectionResult): OrchestratorUIBlock[] {
  const blocks: OrchestratorUIBlock[] = []

  // ── 1. Summary block ────────────────────────────────────────────────────
  blocks.push({
    kind: 'reflection_summary',
    title: `Weekly Reflection — Score: ${reflection.score.overall}%`,
    content: buildSummaryContent(reflection),
    data: {
      overallScore: reflection.score.overall,
      completionScore: reflection.score.completion,
      focusScore: reflection.score.focus,
      habitScore: reflection.score.habit,
      weekTitle: reflection.context.weekTitle,
    },
  })

  // ── 2. Score breakdown ────────────────────────────────────────────────────
  blocks.push({
    kind: 'reflection_score_breakdown',
    title: 'Score Breakdown',
    content: buildScoreBreakdownContent(reflection),
    data: reflection.score,
  })

  // ── 3. Wins ─────────────────────────────────────────────────────────────
  if (reflection.summary.wins.length > 0) {
    blocks.push({
      kind: 'reflection_wins',
      title: `Wins (${reflection.summary.wins.length})`,
      content: reflection.summary.wins.map((w) => `• ${w}`).join('\n'),
      data: reflection.summary.wins,
    })
  }

  // ── 4. Struggles ────────────────────────────────────────────────────────
  if (reflection.summary.struggles.length > 0) {
    blocks.push({
      kind: 'reflection_struggles',
      title: `Struggles (${reflection.summary.struggles.length})`,
      content: reflection.summary.struggles.map((s) => `• ${s}`).join('\n'),
      data: reflection.summary.struggles,
    })
  }

  // ── 5. Lessons ────────────────────────────────────────────────────────────
  if (reflection.summary.lessons.length > 0) {
    blocks.push({
      kind: 'reflection_lessons',
      title: `Lessons (${reflection.summary.lessons.length})`,
      content: reflection.summary.lessons.map((l) => `• ${l}`).join('\n'),
      data: reflection.summary.lessons,
    })
  }

  // ── 6. Improvements ───────────────────────────────────────────────────────
  if (reflection.summary.improvements.length > 0) {
    blocks.push({
      kind: 'reflection_improvements',
      title: `Improvements (${reflection.summary.improvements.length})`,
      content: reflection.summary.improvements.map((i) => `• ${i}`).join('\n'),
      data: reflection.summary.improvements,
    })
  }

  // ── 7. Insights (detailed) ────────────────────────────────────────────────
  if (reflection.insights.length > 0) {
    blocks.push({
      kind: 'reflection_insights',
      title: `Key Insights (${reflection.insights.length})`,
      content: buildInsightsContent(reflection.insights),
      data: reflection.insights,
    })
  }

  // ── 8. Next week recommendations ─────────────────────────────────────────
  if (reflection.summary.nextWeekRecommendations.length > 0) {
    blocks.push({
      kind: 'reflection_next_week',
      title: `Next Week (${reflection.summary.nextWeekRecommendations.length})`,
      content: reflection.summary.nextWeekRecommendations.map((r) => `• ${r}`).join('\n'),
      data: reflection.summary.nextWeekRecommendations,
    })
  }

  return blocks
}

// ─── Content Builders ────────────────────────────────────────────────────────

function buildSummaryContent(reflection: ReflectionResult): string {
  const { score, completion, focus, habit, behavior } = reflection
  const lines: string[] = []

  // Headline based on overall score
  if (score.overall >= 80) {
    lines.push('Strong week — excellent execution and consistency.')
  } else if (score.overall >= 60) {
    lines.push('Good week — solid progress with room for improvement.')
  } else if (score.overall >= 40) {
    lines.push('Mixed week — some wins but notable challenges.')
  } else {
    lines.push('Challenging week — focus on recovery and planning adjustments.')
  }

  lines.push('')

  // Key stats
  const stats = [
    `Completion: ${completion.completionRate}% (${completion.quality})`,
    `Focus: ${focus.totalMinutes} min (${focus.pattern})`,
    `Habits: ${habit.consistencyScore}% (${habit.consistency})`,
    `Sustainability: ${behavior.sustainability.replace('_', ' ')}`,
  ]
  lines.push(stats.join(' • '))

  return lines.join('\n')
}

function buildScoreBreakdownContent(reflection: ReflectionResult): string {
  const { score } = reflection
  const lines: string[] = []

  lines.push(`Completion: ${score.completion}%`)
  lines.push(`Focus: ${score.focus}%`)
  lines.push(`Habits: ${score.habit}%`)

  return lines.join('\n')
}

function buildInsightsContent(insights: ReflectionInsight[]): string {
  return insights
    .map((insight) => {
      const icon = INSIGHT_ICONS[insight.kind] || '•'
      const lines: string[] = [`${icon} ${insight.title}`]

      if (insight.description) {
        lines.push(`  ${insight.description}`)
      }

      if (insight.evidence.length > 0) {
        lines.push(`  Evidence: ${insight.evidence.join(', ')}`)
      }

      if (insight.suggestedAction) {
        lines.push(`  Action: ${insight.suggestedAction}`)
      }

      return lines.join('\n')
    })
    .join('\n\n')
}
