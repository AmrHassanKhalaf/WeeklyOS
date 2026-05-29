import type { AIContext } from '../types'
import type {
  ReflectionResult,
  ReflectionOptions,
  WeeklySummary,
  ReflectionScore,
} from './types'
import { analyzeCompletion } from './stages/completionAnalyzer'
import { analyzeFocus } from './stages/focusAnalyzer'
import { analyzeHabits } from './stages/habitAnalyzer'
import { analyzeBehavior } from './stages/behaviorAnalyzer'
import { generateInsights } from './stages/insightGenerator'
import { SCORING_WEIGHTS } from '../config/scoringWeights'

// ─── Weekly Summary Builder ─────────────────────────────────────────────────

function buildWeeklySummary(
  insights: ReflectionResult['insights'],
  context: AIContext,
  options: Pick<ReflectionOptions, 'includeUserReflections' | 'generateNextWeekRecommendations'>
): WeeklySummary {
  const wins: string[] = []
  const struggles: string[] = []
  const lessons: string[] = []
  const improvements: string[] = []
  const nextWeekRecommendations: string[] = []

  // Extract from insights
  for (const insight of insights) {
    switch (insight.kind) {
      case 'win':
        wins.push(insight.description)
        if (insight.suggestedAction) nextWeekRecommendations.push(insight.suggestedAction)
        break
      case 'struggle':
        struggles.push(insight.description)
        if (insight.suggestedAction) improvements.push(insight.suggestedAction)
        break
      case 'lesson':
        lessons.push(insight.description)
        if (insight.suggestedAction) improvements.push(insight.suggestedAction)
        break
      case 'improvement':
        improvements.push(insight.description)
        if (insight.suggestedAction) nextWeekRecommendations.push(insight.suggestedAction)
        break
      case 'warning':
        struggles.push(insight.description)
        if (insight.suggestedAction) improvements.push(insight.suggestedAction)
        break
      case 'burnout_signal':
        struggles.push(insight.description)
        if (insight.suggestedAction) nextWeekRecommendations.push(insight.suggestedAction)
        break
    }
  }

  // User-entered reflection notes are opt-in so callers can run a data-only summary.
  if (options.includeUserReflections && context.reflections.wentWell) {
    wins.push(context.reflections.wentWell.slice(0, 200))
  }
  if (options.includeUserReflections && context.reflections.struggle) {
    struggles.push(context.reflections.struggle.slice(0, 200))
  }
  if (options.includeUserReflections && context.reflections.lessons) {
    lessons.push(context.reflections.lessons.slice(0, 200))
  }

  // Default recommendations if none generated
  if (options.generateNextWeekRecommendations && nextWeekRecommendations.length === 0) {
    if (context.tasks.pending > 0) {
      nextWeekRecommendations.push('Review and prioritize pending tasks for next week')
    } else {
      nextWeekRecommendations.push('Set a clear objective for next week before planning')
    }
  }

  return {
    wins,
    struggles,
    lessons,
    improvements,
    nextWeekRecommendations,
  }
}

// ─── Score Calculator ───────────────────────────────────────────────────────

function calculateReflectionScore(
  completion: ReflectionResult['completion'],
  focus: ReflectionResult['focus'],
  habit: ReflectionResult['habit']
): ReflectionScore {
  // Completion score contribution
  const completionScore =
    completion.quality === 'excellent'
      ? SCORING_WEIGHTS.reflection.completion.excellent
      : completion.quality === 'good'
        ? SCORING_WEIGHTS.reflection.completion.good
        : completion.quality === 'fair'
          ? SCORING_WEIGHTS.reflection.completion.fair
          : SCORING_WEIGHTS.reflection.completion.poor

  // Focus score contribution
  const focusScore =
    focus.pattern === 'strong'
      ? SCORING_WEIGHTS.reflection.focus.strong
      : focus.pattern === 'regular'
        ? SCORING_WEIGHTS.reflection.focus.regular
        : focus.pattern === 'occasional'
          ? SCORING_WEIGHTS.reflection.focus.occasional
          : SCORING_WEIGHTS.reflection.focus.none

  // Habit score contribution
  const habitScore =
    habit.consistency === 'strong'
      ? SCORING_WEIGHTS.reflection.habit.strong
      : habit.consistency === 'moderate'
        ? SCORING_WEIGHTS.reflection.habit.moderate
        : habit.consistency === 'weak'
          ? SCORING_WEIGHTS.reflection.habit.weak
          : SCORING_WEIGHTS.reflection.habit.missing

  // Weighted overall score
  const overall = Math.round(
    completionScore * SCORING_WEIGHTS.completionWeight +
      focusScore * SCORING_WEIGHTS.focusWeight +
      habitScore * SCORING_WEIGHTS.habitWeight
  )

  return {
    overall,
    completion: Math.round(completionScore * 100),
    focus: Math.round(focusScore * 100),
    habit: Math.round(habitScore * 100),
  }
}

// ─── Reflection Reasoning Builder ───────────────────────────────────────────

function buildReflectionReasoning(result: Omit<ReflectionResult, 'reflectionReasoning' | 'generatedAt'>): string[] {
  const lines: string[] = []
  const { completion, focus, habit, behavior, insights } = result

  // Completion reasoning
  if (completion.quality === 'excellent') {
    lines.push(`Strong completion rate (${completion.completionRate}%) indicates effective planning and execution.`)
  } else if (completion.quality === 'poor') {
    lines.push(`Low completion rate (${completion.completionRate}%) suggests planning scope exceeded capacity.`)
  }

  if (completion.carryOverConcern === 'critical') {
    lines.push(
      `Critical carry-over (${completion.carryOverCount} tasks) indicates planning accuracy issues that need immediate attention.`
    )
  }

  // Focus reasoning
  if (focus.pattern === 'strong') {
    lines.push(`Strong focus pattern (${focus.totalMinutes} min) supports deep work momentum.`)
  } else if (focus.pattern === 'none') {
    lines.push('No focus sessions logged — deep work patterns are not visible this week.')
  }

  // Habit reasoning
  if (habit.consistency === 'strong') {
    lines.push(`Strong habit consistency (${habit.consistencyScore}%) shows effective habit tracking.`)
  } else if (habit.consistency === 'weak') {
    lines.push(`Weak habit consistency (${habit.consistencyScore}%) may indicate habit relevance issues.`)
  }

  // Behavior reasoning
  if (behavior.peakDay) {
    lines.push(`${behavior.peakDayLabel} identified as peak output day — consider scheduling high-priority work there.`)
  }

  if (behavior.sustainability === 'high_risk') {
    lines.push('High sustainability risk detected — workload is consistently exceeding capacity.')
  }

  // Insight count
  const warningCount = insights.filter((i) => i.kind === 'warning' || i.kind === 'burnout_signal').length
  if (warningCount > 0) {
    lines.push(`${warningCount} warning${warningCount > 1 ? 's' : ''} generated that require attention.`)
  }

  return lines
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

/**
 * The Reflection Engine pipeline.
 *
 * Stages:
 * 1. Completion analysis  — completion rate, quality, carry-over detection
 * 2. Focus analysis       — session patterns, consistency
 * 3. Habit analysis       — consistency score, strong/weak habits
 * 4. Behavior analysis    — peak day, sustainability, planning accuracy
 * 5. Insight generation   — wins, struggles, lessons, warnings, burnout signals
 * 6. Weekly summary       — structured wins/struggles/lessons/improvements
 * 7. Score calculation    — overall score with breakdown
 * 8. Reflection reasoning — transparency log explaining key decisions
 *
 * All output is proposal-based. Nothing mutates the store.
 * All insights are grounded in real productivity data, not generic advice.
 */
export function runReflectionPipeline(
  context: AIContext,
  options: ReflectionOptions = {}
): ReflectionResult {
  const {
    includeUserReflections = true,
    maxInsights = 8,
    generateNextWeekRecommendations = true,
  } = options

  // ── Stage 1: Completion Analysis ───────────────────────────────────────
  const completion = analyzeCompletion(context)

  // ── Stage 2: Focus Analysis ─────────────────────────────────────────────
  const focus = analyzeFocus(context)

  // ── Stage 3: Habit Analysis ─────────────────────────────────────────────
  const habit = analyzeHabits(context)

  // ── Stage 4: Behavior Analysis ─────────────────────────────────────────
  const behavior = analyzeBehavior(context)

  // ── Stage 5: Insight Generation ─────────────────────────────────────────
  const insights = generateInsights(completion, focus, habit, behavior, maxInsights)

  // ── Stage 6: Weekly Summary ─────────────────────────────────────────────
  const summary = buildWeeklySummary(insights, context, {
    includeUserReflections,
    generateNextWeekRecommendations,
  })

  // ── Stage 7: Score Calculation ─────────────────────────────────────────
  const score = calculateReflectionScore(completion, focus, habit)

  const partial = {
    generatedAt: new Date().toISOString(),
    context: {
      weekTitle: context.week.title,
      weekId: context.week.id,
      dateRange: context.week.dateRange,
    },
    completion,
    focus,
    habit,
    behavior,
    insights,
    summary,
    score,
  }

  // ── Stage 8: Reflection Reasoning ───────────────────────────────────────
  const reflectionReasoning = buildReflectionReasoning(partial)

  return {
    ...partial,
    reflectionReasoning,
  }
}
