import type { DayOfWeek } from '../types'

// ─── Quality Levels ─────────────────────────────────────────────────────────────

export type CompletionQuality = 'excellent' | 'good' | 'fair' | 'poor'
export type FocusPattern = 'strong' | 'regular' | 'occasional' | 'none'
export type HabitConsistency = 'strong' | 'moderate' | 'weak' | 'missing'
export type SustainabilityLevel = 'healthy' | 'mild_concern' | 'moderate_concern' | 'high_risk'
export type PlanningAccuracy = 'balanced' | 'overplanned' | 'underplanned'

// ─── Completion Analysis ────────────────────────────────────────────────────────

export interface CompletionAnalysis {
  /** Overall completion rate (0–100). */
  completionRate: number
  /** Total tasks completed. */
  totalCompleted: number
  /** Total tasks planned. */
  totalPlanned: number
  /** Tasks still pending. */
  pendingCount: number
  /** Quality classification based on completion rate. */
  quality: CompletionQuality
  /** High-priority tasks completed. */
  highPriorityCompleted: number
  /** High-priority tasks still pending. */
  highPriorityPending: number
  /** Tasks that missed their scheduled day (carry-over). */
  carryOverCount: number
  /** Carry-over ratio (carryOver / totalPlanned). */
  carryOverRatio: number
  /** Whether carry-over is concerning. */
  carryOverConcern: 'none' | 'concerning' | 'critical'
}

// ─── Focus Analysis ─────────────────────────────────────────────────────────────

export interface FocusAnalysis {
  /** Total focus minutes logged. */
  totalMinutes: number
  /** Number of focus sessions. */
  sessionCount: number
  /** Average session duration (minutes). */
  averageSessionMinutes: number
  /** Pattern classification. */
  pattern: FocusPattern
  /** Whether focus patterns are consistent across the week. */
  isConsistent: boolean
}

// ─── Habit Analysis ─────────────────────────────────────────────────────────

export interface HabitAnalysis {
  /** Number of active habits. */
  activeCount: number
  /** Total habit completions. */
  totalCompletions: number
  /** Consistency score (0–100). */
  consistencyScore: number
  /** Consistency classification. */
  consistency: HabitConsistency
  /** Habits with strong consistency. */
  strongHabits: Array<{ name: string; consistency: number }>
  /** Habits with weak consistency. */
  weakHabits: Array<{ name: string; consistency: number }>
}

// ─── Behavior Analysis ────────────────────────────────────────────────────────

export interface BehaviorAnalysis {
  /** Peak day (most completions). */
  peakDay: DayOfWeek | null
  /** Peak day label. */
  peakDayLabel: string | null
  /** Completions on peak day. */
  peakDayCompletions: number
  /** Quietest day (fewest completions). */
  quietestDay: DayOfWeek | null
  /** Quietest day label. */
  quietestDayLabel: string | null
  /** Overall workload sustainability. */
  sustainability: SustainabilityLevel
  /** Whether planning was realistic. */
  planningAccuracy: PlanningAccuracy
  /** Ratio of completed to planned tasks. */
  executionRatio: number
}

// ─── Insights ───────────────────────────────────────────────────────────────────

export type InsightKind =
  | 'win'
  | 'struggle'
  | 'lesson'
  | 'improvement'
  | 'warning'
  | 'pattern'
  | 'burnout_signal'
  | 'planning_issue'

export interface ReflectionInsight {
  id: string
  kind: InsightKind
  title: string
  description: string
  /** Data points that support this insight. */
  evidence: string[]
  /** Suggested action based on this insight. */
  suggestedAction?: string
  /** Priority of this insight (for sorting). */
  priority: 'high' | 'medium' | 'low'
  /** Which analysis stage produced this insight. */
  source: 'completion' | 'focus' | 'habit' | 'behavior' | 'cross_domain'
}

// ─── Weekly Summary ───────────────────────────────────────────────────────────

export interface WeeklySummary {
  /** Wins and accomplishments. */
  wins: string[]
  /** Struggles and challenges. */
  struggles: string[]
  /** Lessons learned. */
  lessons: string[]
  /** Actionable improvement suggestions. */
  improvements: string[]
  /** Recommendations for next week. */
  nextWeekRecommendations: string[]
}

// ─── Overall Score ────────────────────────────────────────────────────────────

export interface ReflectionScore {
  /** Overall score (0–100). */
  overall: number
  /** Completion contribution (0–100). */
  completion: number
  /** Focus contribution (0–100). */
  focus: number
  /** Habit contribution (0–100). */
  habit: number
  /** Score trend compared to previous week (if available). */
  trend?: 'up' | 'down' | 'stable'
}

// ─── Full Reflection Result ────────────────────────────────────────────────────

/**
 * The structured output of the Reflection Engine.
 *
 * Like `BrainDumpExtraction` and `PlanningResult`, this is an intermediate
 * proposal layer. Nothing is written to the store until the user confirms.
 *
 * All insights are grounded in real productivity data, not generic advice.
 */
export interface ReflectionResult {
  /** When this reflection was generated. */
  generatedAt: string
  /** Week context. */
  context: {
    weekTitle: string
    weekId?: string
    dateRange: string
  }
  /** Completion analysis. */
  completion: CompletionAnalysis
  /** Focus analysis. */
  focus: FocusAnalysis
  /** Habit analysis. */
  habit: HabitAnalysis
  /** Behavior analysis. */
  behavior: BehaviorAnalysis
  /** All insights across all analysis stages. */
  insights: ReflectionInsight[]
  /** Structured weekly summary. */
  summary: WeeklySummary
  /** Overall score with breakdown. */
  score: ReflectionScore
  /** Reflection reasoning explaining key decisions. */
  reflectionReasoning: string[]
}

// ─── Pipeline Options ─────────────────────────────────────────────────────────

export interface ReflectionOptions {
  /** Whether to include user reflection notes in analysis. */
  includeUserReflections?: boolean
  /** Maximum number of insights to generate (default: 8). */
  maxInsights?: number
  /** Whether to generate next-week recommendations. */
  generateNextWeekRecommendations?: boolean
}
