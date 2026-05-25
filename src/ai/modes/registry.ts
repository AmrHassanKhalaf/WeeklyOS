import type { WorkspaceMode, WorkspaceModeDefinition } from '../types'

export const WORKSPACE_MODE_DEFINITIONS: Record<WorkspaceMode, WorkspaceModeDefinition> = {
  analyze: {
    id: 'analyze',
    label: 'Analyze',
    description: 'Read productivity patterns, workload risk, and weekly signals before changing the plan.',
    promptBuilderKey: 'analyze-mode',
    contextRequirements: ['tasks', 'focusSessions', 'activity', 'weeklyMetrics'],
    allowedToolIds: ['analyzeProductivity'],
    primaryAction: 'analyze-week',
    secondaryActions: ['diagnose-focus', 'find-patterns'],
    suggestedPrompts: ['Analyze my week', 'What caused low focus?', 'Find my strongest work pattern'],
    futureActions: ['rebalance-risk-day', 'protect-focus-block'],
  },
  plan: {
    id: 'plan',
    label: 'Plan',
    description: 'Generate calm weekly and daily plans from workload, priority, energy, and focus context.',
    promptBuilderKey: 'plan-mode',
    contextRequirements: ['tasks', 'focusSessions', 'weeklyMetrics', 'brainDump'],
    allowedToolIds: ['generateWeekPlan', 'organizeBrainDump', 'createFocusSession'],
    primaryAction: 'generate-plan',
    secondaryActions: ['rebalance-tasks', 'suggest-focus-blocks', 'organize-brain-dump'],
    suggestedPrompts: ['Plan tomorrow', 'Rebalance my tasks', 'Suggest focus blocks'],
    futureActions: ['plan-tomorrow', 'rebalance-risk-day', 'protect-focus-block'],
  },
  reflect: {
    id: 'reflect',
    label: 'Reflect',
    description: 'Turn completed work, focus sessions, and reflection notes into lessons and review summaries.',
    promptBuilderKey: 'reflect-mode',
    contextRequirements: ['tasks', 'focusSessions', 'reflections', 'activity', 'weeklyMetrics'],
    allowedToolIds: ['summarizeReflection', 'analyzeProductivity'],
    primaryAction: 'start-reflection',
    secondaryActions: ['generate-summary', 'compare-weeks', 'generate-lessons'],
    suggestedPrompts: ['Generate weekly reflection', 'Create lessons from this week', 'Compare this week'],
    futureActions: ['generate-summary', 'generate-lessons'],
  },
  chat: {
    id: 'chat',
    label: 'Chat',
    description: 'Open contextual conversation with the WeeklyOS workspace and future agent actions.',
    promptBuilderKey: 'chat-mode',
    contextRequirements: ['tasks', 'habits', 'focusSessions', 'reflections', 'activity', 'weeklyMetrics', 'brainDump'],
    allowedToolIds: ['createTask', 'updateTask', 'generateWeekPlan', 'organizeBrainDump', 'analyzeProductivity'],
    primaryAction: 'ask-workspace',
    secondaryActions: ['organize-brain-dump', 'plan-tomorrow', 'create-focus-session'],
    suggestedPrompts: ['Organize my brain dump', 'What should I do next?', 'Create a calmer plan'],
    futureActions: ['create-focus-session', 'protect-focus-block'],
  },
}

export const WORKSPACE_MODE_LIST = Object.values(WORKSPACE_MODE_DEFINITIONS)

export function getWorkspaceModeDefinition(mode: WorkspaceMode): WorkspaceModeDefinition {
  return WORKSPACE_MODE_DEFINITIONS[mode]
}
