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
  | 'organizeBrainDump'
  | 'analyzeProductivity'
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

export interface AITool<Input extends Record<string, unknown> = Record<string, unknown>, Output = unknown> {
  id: AIToolId
  name: string
  description: string
  category: AIToolCategory
  inputSchema: AIToolSchema
  outputSchema: AIToolSchema
  requiresConfirmation: boolean
  execute?: (input: Input, context: AIContext) => Promise<AIToolResult<Output>>
}

export interface AIProviderRequest {
  messages: AIMessage[]
  context: AIContext
  mode: WorkspaceMode
  tools: AITool[]
  metadata?: Record<string, unknown>
}

export interface AIProviderResponse {
  message: AIMessage
  providerId: string
  toolResults?: AIToolResult[]
  raw?: unknown
}

export interface AIProvider {
  id: string
  label: string
  supportsTools: boolean
  send: (request: AIProviderRequest) => Promise<AIProviderResponse>
}

export interface AIResponse {
  message: AIMessage
  providerId?: string
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
