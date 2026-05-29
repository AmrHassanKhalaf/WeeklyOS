import type {
  ActivityItem,
  DayOfWeek,
  FocusSession,
  Priority,
  Task,
  TaskStatus,
  WeekData,
} from '../../store/useWeekStore'
import type { BrainDumpItem } from '../../store/useBrainDumpStore'
import type { Habit, HabitCompletion } from '../../store/useHabitStore'

export type { ActivityItem, DayOfWeek, FocusSession, Priority, Task, TaskStatus, WeekData }
export type { BrainDumpItem, Habit, HabitCompletion }

export type WorkspaceMode = 'analyze' | 'plan' | 'reflect' | 'chat'

export type AIMessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface AIMessage {
  id?: string
  role: AIMessageRole
  content: string
  createdAt?: string
  metadata?: Record<string, unknown>
}

export type AIActionKind = 'prompt' | 'tool' | 'navigation' | 'composer'

export type AIActionId =
  | 'analyze-week'
  | 'diagnose-focus'
  | 'find-patterns'
  | 'generate-plan'
  | 'rebalance-tasks'
  | 'suggest-focus-blocks'
  | 'organize-brain-dump'
  | 'plan-tomorrow'
  | 'start-reflection'
  | 'generate-summary'
  | 'compare-weeks'
  | 'generate-lessons'
  | 'ask-workspace'
  | 'create-focus-session'
  | 'rebalance-risk-day'
  | 'protect-focus-block'

export type AIToolId =
  | 'createTask'
  | 'updateTask'
  | 'generateWeekPlan'
  | 'generateDayPlan'
  | 'organizeBrainDump'
  | 'summarizeWeek'
  | 'analyzeProductivity'
  | 'rescheduleTasks'
  | 'createFocusSession'
  | 'summarizeReflection'

export type AIToolCategory = 'task' | 'planning' | 'analysis' | 'reflection' | 'focus' | 'system'

export type AIContextRequirement =
  | 'tasks'
  | 'habits'
  | 'focusSessions'
  | 'reflections'
  | 'activity'
  | 'weeklyMetrics'
  | 'brainDump'

export type PromptBuilderKey =
  | 'workspace-system'
  | 'analyze-mode'
  | 'plan-mode'
  | 'reflect-mode'
  | 'chat-mode'
  | 'context-summary'

export interface AIAction {
  id: AIActionId
  label: string
  mode: WorkspaceMode
  kind: AIActionKind
  promptIntent: string
  toolId?: AIToolId
  navigationTarget?: string
  requiresConfirmation: boolean
}

export interface WorkspaceModeDefinition {
  id: WorkspaceMode
  label: string
  description: string
  promptBuilderKey: PromptBuilderKey
  contextRequirements: AIContextRequirement[]
  allowedToolIds: AIToolId[]
  primaryAction: AIActionId
  secondaryActions: AIActionId[]
  suggestedPrompts: string[]
  futureActions: AIActionId[]
}

export interface AIToolSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'unknown'
  description?: string
  items?: AIToolSchemaProperty
  properties?: Record<string, AIToolSchemaProperty>
}

export interface AIToolSchema {
  type: 'object'
  description?: string
  properties: Record<string, AIToolSchemaProperty>
  required?: string[]
}

export interface AIToolResult<Output = unknown> {
  ok: boolean
  output?: Output
  error?: string
  metadata?: Record<string, unknown>
}

export interface AITool<Input extends object = Record<string, unknown>, Output = unknown> {
  id: AIToolId
  name: string
  description: string
  category: AIToolCategory
  inputSchema: AIToolSchema
  outputSchema: AIToolSchema
  requiresConfirmation: boolean
  execute?: (input: Input, context: AIContext) => Promise<AIToolResult<Output>>
}

/** A single tool call returned from the LLM provider. */
export interface AIProviderToolCall {
  toolId: string
  toolName: string
  input: Record<string, unknown>
}

export interface AIProviderRequest {
  /** Fully-assembled message array (system + history + user). */
  messages: AIMessage[]
  /** Active workspace mode — used for provider-side context. */
  mode: WorkspaceMode
  /** Tool contracts available for this request. */
  tools?: AITool[]
  /** Model override — falls back to provider default. */
  model?: string
  metadata?: Record<string, unknown>
}

export interface AIProviderResponse {
  message: AIMessage
  /** Tool calls the LLM requested to execute. */
  toolCalls?: AIProviderToolCall[]
  /** Internal reasoning chain (if supported by the provider). */
  reasoning?: string
  /** Provider identifier for display / debugging. */
  provider: string
  model?: string
  raw?: unknown
}

export interface AIProvider {
  id: string
  label: string
  supportsTools: boolean
  supportsStreaming: boolean
  generate: (request: AIProviderRequest) => Promise<AIProviderResponse>
  stream?: (request: AIProviderRequest) => AsyncGenerator<string>
}

export interface AIResponse {
  message: AIMessage
  provider?: string
  actions?: AIAction[]
  toolResults?: AIToolResult[]
  metadata?: Record<string, unknown>
}

export interface AIContextInput {
  week: WeekData | null
  focusSessions: FocusSession[]
  habits?: Habit[]
  habitCompletions?: HabitCompletion[]
  brainDumpItems?: BrainDumpItem[]
  createdAt?: string
}

export interface AIContextTask {
  id: string
  title: string
  description?: string
  priority: Priority
  status: TaskStatus
  day?: DayOfWeek
  type?: Task['type']
  estimatedTime?: string
  actualDurationSeconds?: number
  tags?: string[]
}

export interface AIContextDayTaskMetrics {
  total: number
  pending: number
  completed: number
}

export interface AIContext {
  createdAt: string
  source: 'weeklyos'
  week: {
    id?: string
    title: string
    weekNumber?: number
    year?: number
    dateRange: string
    score: number
  }
  tasks: {
    items: AIContextTask[]
    pending: number
    completed: number
    byDay: Partial<Record<DayOfWeek, AIContextDayTaskMetrics>>
  }
  habits: {
    items: Array<Pick<Habit, 'id' | 'name' | 'type' | 'group_label' | 'is_active'>>
    completionCount: number
  }
  focus: {
    sessions: FocusSession[]
    totalMinutes: number
    sessionCount: number
  }
  reflections: {
    wentWell?: string
    struggle?: string
    lessons?: string
  }
  activity: ActivityItem[]
  brainDump: {
    items: BrainDumpItem[]
    selectedCount: number
  }
  metrics: {
    totalPlanned: number
    totalCompleted: number
    completionRate: number
    pendingCount: number
  }
  /** The current calendar day within the displayed week, if determinable. */
  today?: {
    day: DayOfWeek
    label: string
  }
}

// ─── Context Engine Layer Types ────────────────────────────────────────────────

export interface BaseContextLayer {
  weekTitle: string
  weekNumber?: number
  year?: number
  dateRange: string
  score: number
  completionRate: number
  createdAt: string
}

export interface OverloadedDayInfo {
  day: DayOfWeek
  shortName: string
  pendingCount: number
  highPriorityCount: number
  topTaskTitles: string[]
}

export interface WorkspaceContextLayer {
  // Week
  weekTitle: string
  weekNumber?: number
  dateRange: string
  score: number

  // Task metrics
  totalPlanned: number
  totalCompleted: number
  pendingCount: number
  completedCount: number
  completionRate: number

  // Today
  todayLabel: string
  todayTaskCount: number

  // Focus
  focusMinutes: number
  focusSessionCount: number

  // Risk / Analysis signals
  peakDay: string
  riskDay: string
  riskCount: number
  riskHighEffortCount: number
  riskTaskTitles: string[]
  overloadedDay: OverloadedDayInfo | null

  // Derived AI signals
  signalTitle: string
  signalBody: string
  continuity: {
    lastPlanLabel: string
    focusQualityLabel: string
    rolloverLabel: string
  }

  // Activity & reflections
  recentActivities: ActivityItem[]
  reflections: {
    wentWell?: string
    struggle?: string
    lessons?: string
  }

  // Compact aggregates (no raw rows)
  habitCount: number
  habitCompletionCount: number
  brainDumpCount: number
  brainDumpSelectedCount: number
  topPendingTasks: Array<{ title: string; priority: Priority; day?: DayOfWeek }>
}

export interface ModeContextLayer {
  mode: WorkspaceMode
  label: string
  focus: string[]
  relevantSignals: string[]
}

export interface ConversationContextLayer {
  messageCount: number
  hasHistory: boolean
  recentTurns: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface AssembledAIContext {
  base: BaseContextLayer
  workspace: WorkspaceContextLayer
  mode: ModeContextLayer
  conversation: ConversationContextLayer
}

export interface BrainDumpParseResult {
  rawInput: string
  tasks: Array<{ title: string; priority?: Priority; day?: DayOfWeek }>
  goals: string[]
  reminders: string[]
  habits: string[]
  deadlines: Array<{ title: string; date?: string }>
  notes: string[]
}

export interface ReflectionSummary {
  wins: string[]
  struggles: string[]
  lessons: string[]
  nextActions: string[]
  sourceWeekId?: string
}

export interface PlanGenerationResult {
  weekTitle?: string
  dailyPlan: Array<{
    day: DayOfWeek
    objective?: string
    tasks: Array<{ title: string; priority: Priority }>
    focusBlocks: Array<{ label: string; durationMinutes?: number }>
  }>
  recommendations: string[]
  risks: string[]
}
