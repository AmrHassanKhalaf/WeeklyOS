import type { AIContext } from '../../types'
import type {
  CompletionAnalysis,
  FocusAnalysis,
  HabitAnalysis,
  BehaviorAnalysis,
  ReflectionInsight,
  InsightKind,
} from '../types'
import { THRESHOLDS } from '../../config/thresholds'
import { SCORING_WEIGHTS } from '../../config/scoringWeights'

// ─── ID Generator ─────────────────────────────────────────────────────────────

let _idCounter = 0
function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++_idCounter}`
}

// ─── Insight Builders ────────────────────────────────────────────────────────

function buildCompletionInsights(
  completion: CompletionAnalysis,
  context: AIContext
): ReflectionInsight[] {
  const insights: ReflectionInsight[] = []
  const { completionRate, quality, carryOverConcern, highPriorityPending } = completion

  // Win: Strong completion
  if (quality === 'excellent') {
    insights.push({
      id: nextId('win'),
      kind: 'win',
      title: 'Strong execution momentum',
      description: `You completed ${completionRate}% of planned tasks this week.`,
      evidence: [`${completion.totalCompleted} tasks completed out of ${completion.totalPlanned} planned`],
      suggestedAction: 'Maintain this planning scope next week.',
      priority: 'high',
      source: 'completion',
    })
  }

  // Struggle: Poor completion
  if (quality === 'poor') {
    insights.push({
      id: nextId('struggle'),
      kind: 'struggle',
      title: 'Low completion rate',
      description: `Only ${completionRate}% of planned tasks were completed.`,
      evidence: [`${completion.pendingCount} tasks remain pending`],
      suggestedAction: 'Reduce planned scope by 30-40% next week.',
      priority: 'high',
      source: 'completion',
    })
  }

  // Warning: Critical carry-over
  if (carryOverConcern === 'critical') {
    insights.push({
      id: nextId('warning'),
      kind: 'warning',
      title: 'Critical carry-over buildup',
      description: `${completion.carryOverCount} tasks missed their scheduled day.`,
      evidence: [
        `${completion.carryOverCount} carry-over tasks (${Math.round(completion.carryOverRatio * 100)}% of planned)`,
      ],
      suggestedAction: 'Audit planning accuracy and reduce daily task counts.',
      priority: 'high',
      source: 'completion',
    })
  }

  // Warning: High-priority backlog
  if (highPriorityPending >= 3) {
    insights.push({
      id: nextId('warning'),
      kind: 'warning',
      title: 'High-priority backlog',
      description: `${highPriorityPending} high-priority tasks remain pending.`,
      evidence: [`${highPriorityPending} high-priority tasks not completed`],
      suggestedAction: 'Prioritize high-priority tasks in next week\'s planning.',
      priority: 'high',
      source: 'completion',
    })
  }

  // Lesson: Planning accuracy
  if (completionRate < 50 && completion.totalPlanned > 0) {
    insights.push({
      id: nextId('lesson'),
      kind: 'lesson',
      title: 'Planning scope exceeded capacity',
      description: 'More was planned than could be realistically completed.',
      evidence: [`${completionRate}% completion rate indicates overplanning`],
      suggestedAction: 'Set a weekly task ceiling and protect it from scope creep.',
      priority: 'medium',
      source: 'completion',
    })
  }

  return insights
}

function buildFocusInsights(focus: FocusAnalysis, context: AIContext): ReflectionInsight[] {
  const insights: ReflectionInsight[] = []
  const { pattern, sessionCount, totalMinutes, isConsistent } = focus

  // Win: Strong focus pattern
  if (pattern === 'strong') {
    insights.push({
      id: nextId('win'),
      kind: 'win',
      title: 'Strong deep work practice',
      description: `${totalMinutes} minutes of focused work logged across ${sessionCount} sessions.`,
      evidence: [`${sessionCount} focus sessions`, `${totalMinutes} total minutes`],
      suggestedAction: 'Continue protecting focus blocks in next week\'s schedule.',
      priority: 'high',
      source: 'focus',
    })
  }

  // Struggle: No focus sessions
  if (pattern === 'none') {
    insights.push({
      id: nextId('struggle'),
      kind: 'struggle',
      title: 'No focus sessions logged',
      description: 'Deep work patterns are not visible this week.',
      evidence: ['Zero focus sessions recorded'],
      suggestedAction: 'Block 2-3 focus sessions before the week fills with reactive work.',
      priority: 'high',
      source: 'focus',
    })
  }

  // Pattern: Inconsistent focus
  if (!isConsistent && sessionCount > 0) {
    insights.push({
      id: nextId('pattern'),
      kind: 'pattern',
      title: 'Inconsistent focus practice',
      description: 'Focus sessions are not evenly distributed across the week.',
      evidence: [`${sessionCount} sessions logged but inconsistent timing`],
      suggestedAction: 'Schedule focus blocks on the same days each week to build habit.',
      priority: 'medium',
      source: 'focus',
    })
  }

  // Improvement: Occasional focus
  if (pattern === 'occasional') {
    insights.push({
      id: nextId('improvement'),
      kind: 'improvement',
      title: 'Increase focus consistency',
      description: `${totalMinutes} minutes logged, but could be more consistent.`,
      evidence: [`${sessionCount} sessions`, `${totalMinutes} total minutes`],
      suggestedAction: 'Aim for 3+ focus sessions per week for better deep work momentum.',
      priority: 'medium',
      source: 'focus',
    })
  }

  return insights
}

function buildHabitInsights(habit: HabitAnalysis, context: AIContext): ReflectionInsight[] {
  const insights: ReflectionInsight[] = []
  const { consistency, activeCount, totalCompletions } = habit

  // Win: Strong habit consistency
  if (consistency === 'strong') {
    insights.push({
      id: nextId('win'),
      kind: 'win',
      title: 'Strong habit consistency',
      description: `${totalCompletions} habit completions across ${activeCount} active habits.`,
      evidence: [`${habit.consistencyScore}% consistency score`],
      suggestedAction: 'Maintain current habit tracking practices.',
      priority: 'medium',
      source: 'habit',
    })
  }

  // Struggle: Weak habit consistency
  if (consistency === 'weak' || consistency === 'missing') {
    insights.push({
      id: nextId('struggle'),
      kind: 'struggle',
      title: 'Habit tracking gaps',
      description: `Habit consistency is at ${habit.consistencyScore}% - below target.`,
      evidence: [`${totalCompletions} completions across ${activeCount} habits`],
      suggestedAction: 'Review habit relevance and reduce to 2-3 core habits.',
      priority: 'medium',
      source: 'habit',
    })
  }

  return insights
}

function buildBehaviorInsights(
  behavior: BehaviorAnalysis,
  completion: CompletionAnalysis,
  context: AIContext
): ReflectionInsight[] {
  const insights: ReflectionInsight[] = []
  const { peakDay, peakDayLabel, sustainability, planningAccuracy } = behavior

  // Pattern: Peak day identification
  if (peakDay && peakDayLabel) {
    insights.push({
      id: nextId('pattern'),
      kind: 'pattern',
      title: `Peak output day: ${peakDayLabel}`,
      description: `${peakDayLabel} had the highest completion count this week.`,
      evidence: [`${behavior.peakDayCompletions} completions on ${peakDayLabel}`],
      suggestedAction: 'Schedule high-priority deep work on peak days.',
      priority: 'medium',
      source: 'behavior',
    })
  }

  // Warning: Sustainability concerns
  if (sustainability === 'high_risk') {
    insights.push({
      id: nextId('warning'),
      kind: 'warning',
      title: 'High workload sustainability risk',
      description: 'Workload is consistently exceeding capacity.',
      evidence: [`Execution ratio: ${Math.round(behavior.executionRatio * 100)}%`],
      suggestedAction: 'Reduce planned scope and address carry-over tasks immediately.',
      priority: 'high',
      source: 'behavior',
    })
  }

  // Lesson: Planning accuracy
  if (planningAccuracy === 'overplanned') {
    insights.push({
      id: nextId('lesson'),
      kind: 'lesson',
      title: 'Consistent overplanning pattern',
      description: 'Planning scope regularly exceeds execution capacity.',
      evidence: [`Planning accuracy: ${planningAccuracy}`],
      suggestedAction: 'Use the Planning Engine to detect overload before committing to tasks.',
      priority: 'medium',
      source: 'behavior',
    })
  }

  // Burnout signal: Multiple high-priority indicators
  const burnoutSignals = [
    completion.quality === 'poor',
    completion.carryOverConcern === 'critical',
    sustainability === 'high_risk',
  ].filter(Boolean).length

  if (burnoutSignals >= 2) {
    insights.push({
      id: nextId('burnout_signal'),
      kind: 'burnout_signal',
      title: 'Burnout risk detected',
      description: 'Multiple indicators suggest unsustainable workload patterns.',
      evidence: [
        completion.quality === 'poor' ? 'Poor completion rate' : '',
        completion.carryOverConcern === 'critical' ? 'Critical carry-over' : '',
        sustainability === 'high_risk' ? 'High sustainability risk' : '',
      ].filter(Boolean),
      suggestedAction: 'Consider a lighter week with reduced scope and focus on recovery.',
      priority: 'high',
      source: 'cross_domain',
    })
  }

  return insights
}

// ─── Insight Generator ───────────────────────────────────────────────────────

/**
 * Generates insights from all analysis stages.
 *
 * This stage synthesizes:
 * - Completion insights (wins, struggles, lessons)
 * - Focus insights (patterns, improvements)
 * - Habit insights (consistency issues)
 * - Behavior insights (peak days, sustainability, burnout signals)
 * - Cross-domain insights (burnout detection, planning issues)
 */
export function generateInsights(
  completion: CompletionAnalysis,
  focus: FocusAnalysis,
  habit: HabitAnalysis,
  behavior: BehaviorAnalysis,
  context: AIContext,
  maxInsights: number = 8
): ReflectionInsight[] {
  const allInsights: ReflectionInsight[] = [
    ...buildCompletionInsights(completion, context),
    ...buildFocusInsights(focus, context),
    ...buildHabitInsights(habit, context),
    ...buildBehaviorInsights(behavior, completion, context),
  ]

  // Sort by priority (high first), then by kind (wins first, warnings last)
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const kindOrder = { win: 0, pattern: 1, lesson: 2, improvement: 3, struggle: 4, warning: 5, burnout_signal: 6, planning_issue: 7 }

  allInsights.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return kindOrder[a.kind] - kindOrder[b.kind]
  })

  return allInsights.slice(0, maxInsights)
}
