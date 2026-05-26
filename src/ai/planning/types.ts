import type { DayOfWeek, Priority } from '../types'

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type PlanningMode = 'week' | 'day' | 'focus' | 'rebalance'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'balanced'
export type FocusType = 'deep' | 'shallow' | 'quick_win'
export type RecommendationKind =
  | 'focus'
  | 'rebalance'
  | 'defer'
  | 'protect'
  | 'batch'
  | 'address_carryover'
  | 'reduce_scope'
export type WarningKind =
  | 'overload'
  | 'unrealistic_scope'
  | 'no_focus_time'
  | 'carryover_buildup'
  | 'high_priority_stacked'

// ─── Workload Analysis ────────────────────────────────────────────────────────

export interface DayPressureScore {
  day: DayOfWeek
  shortName: string
  totalPending: number
  highPriorityPending: number
  /** Weighted pressure score 0–100. */
  pressureScore: number
  isOverloaded: boolean
  completedCount: number
}

export interface WorkloadAnalysis {
  dayPressures: DayPressureScore[]
  overloadedDays: DayPressureScore[]
  /** Historically strongest output day (most completions). */
  peakDay: DayOfWeek | null
  peakDayLabel: string | null
  /** Days with low pending load — good candidates for rescheduled tasks. */
  quietDays: DayOfWeek[]
  pendingTotal: number
  highPriorityPending: number
  /** Tasks scheduled for past days in the week that are still pending. */
  carryOverCount: number
  completionRate: number
  riskLevel: RiskLevel
  /** Overall workload pressure score 0–100. */
  overallPressure: number
  pressureReasons: string[]
}

// ─── Task Prioritization ──────────────────────────────────────────────────────

export interface PrioritizedTask {
  taskId: string
  title: string
  priority: Priority
  day?: DayOfWeek
  /** Composite priority score 0–100. */
  score: number
  /** Primary reason this task was prioritized this way. */
  reason: string
  /** All urgency signals that contributed to the score. */
  urgencySignals: string[]
  focusType: FocusType
  estimatedTime?: string
  isCarryOver?: boolean
}

// ─── Focus Allocation ─────────────────────────────────────────────────────────

export interface FocusArea {
  theme: string
  taskCount: number
  taskTitles: string[]
  reason: string
}

export interface SuggestedFocusBlock {
  label: string
  theme: string
  recommendedDay?: DayOfWeek
  recommendedDayLabel?: string
  durationMinutes?: number
  reason: string
  taskTitles: string[]
}

// ─── Rebalancing ──────────────────────────────────────────────────────────────

export interface RebalanceProposal {
  taskId: string
  taskTitle: string
  taskPriority: Priority
  fromDay: DayOfWeek
  fromDayLabel: string
  toDay: DayOfWeek
  toDayLabel: string
  reason: string
  impactLevel: 'minimal' | 'moderate'
}

// ─── Recommendations & Warnings ───────────────────────────────────────────────

export interface PlanningRecommendation {
  kind: RecommendationKind
  message: string
  reasoning: string
  relatedTaskTitles?: string[]
  relatedDay?: DayOfWeek
  urgency: 'high' | 'medium' | 'low'
}

export interface PlanningWarning {
  kind: WarningKind
  message: string
  affectedDay?: DayOfWeek
  severity: 'critical' | 'high' | 'medium'
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface PlanningSummary {
  mode: PlanningMode
  riskLevel: RiskLevel
  /** One-line headline describing the planning state. */
  headline: string
  overallPressure: number
  totalPending: number
  highPriorityCount: number
  overloadedDayCount: number
  focusMinutesLogged: number
  completionRate: number
  topPriorityTitle?: string
}

// ─── Full Planning Result ─────────────────────────────────────────────────────

/**
 * The structured output of the Planning Engine.
 *
 * Like `BrainDumpExtraction`, this is an intermediate proposal layer.
 * Nothing is written to the store until the user confirms rebalance moves
 * or applies focus block suggestions.
 */
export interface PlanningResult {
  mode: PlanningMode
  generatedAt: string
  context: {
    weekTitle: string
    today?: string
    completionRate: number
    focusMinutes: number
  }
  summary: PlanningSummary
  workloadAnalysis: WorkloadAnalysis
  focusAreas: FocusArea[]
  prioritizedTasks: PrioritizedTask[]
  suggestedFocusBlocks: SuggestedFocusBlock[]
  rebalanceSuggestions: RebalanceProposal[]
  planningReasoning: string[]
  warnings: PlanningWarning[]
  recommendations: PlanningRecommendation[]
}

// ─── Pipeline Options ─────────────────────────────────────────────────────────

export interface PlanningOptions {
  mode: PlanningMode
  /** For day/focus mode: the specific day to plan. */
  targetDay?: DayOfWeek
  /** User-stated primary objective for the period. */
  focusObjective?: string
  /** Known constraints (e.g. "no meetings Wednesday"). */
  constraints?: string[]
  /** Max rebalance proposals to generate (default: 3). */
  maxRebalanceProposals?: number
  /** Max recommendations to include (default: 5). */
  maxRecommendations?: number
}
