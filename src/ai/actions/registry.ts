import type { AIAction, AIActionId } from '../types'

export const AI_ACTIONS: Record<AIActionId, AIAction> = {
  'analyze-week': {
    id: 'analyze-week',
    label: 'Analyze Week',
    mode: 'analyze',
    kind: 'prompt',
    promptIntent:
      'Analyze this week using my WeeklyOS context. Focus on workload, completion rate, focus sessions, energy patterns, and the clearest risk.',
    toolId: 'analyzeProductivity',
    requiresConfirmation: false,
  },
  'diagnose-focus': {
    id: 'diagnose-focus',
    label: 'Diagnose Focus Drop',
    mode: 'analyze',
    kind: 'prompt',
    promptIntent:
      'Diagnose what may be causing low focus in my current week. Use tasks, focus sessions, workload distribution, and recent activity.',
    toolId: 'analyzeProductivity',
    requiresConfirmation: false,
  },
  'find-patterns': {
    id: 'find-patterns',
    label: 'Find Patterns',
    mode: 'analyze',
    kind: 'prompt',
    promptIntent:
      'Find the most useful productivity patterns in this week and explain what I should repeat or avoid next week.',
    toolId: 'analyzeProductivity',
    requiresConfirmation: false,
  },
  'generate-plan': {
    id: 'generate-plan',
    label: 'Generate Plan',
    mode: 'plan',
    kind: 'prompt',
    promptIntent:
      'Generate a calm WeeklyOS plan. Prioritize pending tasks, rebalance workload, protect focus blocks, and summarize the plan by day.',
    toolId: 'generateWeekPlan',
    requiresConfirmation: false,
  },
  'rebalance-tasks': {
    id: 'rebalance-tasks',
    label: 'Rebalance Tasks',
    mode: 'plan',
    kind: 'prompt',
    promptIntent:
      'Review my pending tasks and suggest a lighter reschedule plan. Explain what should move, merge, or become a focus block.',
    toolId: 'generateWeekPlan',
    requiresConfirmation: false,
  },
  'suggest-focus-blocks': {
    id: 'suggest-focus-blocks',
    label: 'Suggest Focus Blocks',
    mode: 'plan',
    kind: 'prompt',
    promptIntent:
      'Suggest focus blocks for the next work period using task priority, energy pattern, and current pending workload.',
    toolId: 'createFocusSession',
    requiresConfirmation: false,
  },
  'organize-brain-dump': {
    id: 'organize-brain-dump',
    label: 'Organize Brain Dump',
    mode: 'plan',
    kind: 'prompt',
    promptIntent:
      'Organize my brain dump into tasks, reminders, goals, habits, deadlines, and suggested WeeklyOS placement.',
    toolId: 'organizeBrainDump',
    requiresConfirmation: false,
  },
  'plan-tomorrow': {
    id: 'plan-tomorrow',
    label: 'Plan Tomorrow',
    mode: 'plan',
    kind: 'prompt',
    promptIntent:
      'Plan tomorrow from my current WeeklyOS context. Choose the top priority, support tasks, quick wins, and suggested focus blocks.',
    toolId: 'generateWeekPlan',
    requiresConfirmation: false,
  },
  'start-reflection': {
    id: 'start-reflection',
    label: 'Start Reflection',
    mode: 'reflect',
    kind: 'navigation',
    promptIntent: 'Open the weekly reflection flow.',
    navigationTarget: '/weekly-evaluation',
    requiresConfirmation: false,
  },
  'generate-summary': {
    id: 'generate-summary',
    label: 'Generate Summary',
    mode: 'reflect',
    kind: 'prompt',
    promptIntent:
      'Generate a concise weekly review summary from my score, tasks, focus sessions, activity, and reflection notes.',
    toolId: 'summarizeReflection',
    requiresConfirmation: false,
  },
  'compare-weeks': {
    id: 'compare-weeks',
    label: 'Compare Weeks',
    mode: 'reflect',
    kind: 'prompt',
    promptIntent:
      'Compare this week against my recent pattern. Highlight the main change in output, focus, and task completion.',
    toolId: 'analyzeProductivity',
    requiresConfirmation: false,
  },
  'generate-lessons': {
    id: 'generate-lessons',
    label: 'Generate Lessons',
    mode: 'reflect',
    kind: 'prompt',
    promptIntent:
      'Generate three practical lessons from this week and turn each lesson into a small behavior for next week.',
    toolId: 'summarizeReflection',
    requiresConfirmation: false,
  },
  'ask-workspace': {
    id: 'ask-workspace',
    label: 'Ask Workspace',
    mode: 'chat',
    kind: 'composer',
    promptIntent: '',
    requiresConfirmation: false,
  },
  'create-focus-session': {
    id: 'create-focus-session',
    label: 'Create Focus Session',
    mode: 'plan',
    kind: 'navigation',
    promptIntent: 'Open Focused Day to start a focus session.',
    toolId: 'createFocusSession',
    navigationTarget: '/focused-day',
    requiresConfirmation: false,
  },
  'rebalance-risk-day': {
    id: 'rebalance-risk-day',
    label: 'Rebalance Risk Day',
    mode: 'plan',
    kind: 'prompt',
    promptIntent:
      'Rebalance the overloaded day in my current week. Move lower-priority work away from the risk day and protect the main objective.',
    toolId: 'generateWeekPlan',
    requiresConfirmation: false,
  },
  'protect-focus-block': {
    id: 'protect-focus-block',
    label: 'Protect Focus Block',
    mode: 'plan',
    kind: 'prompt',
    promptIntent:
      'Protect one focus block around the highest-priority pending task. Explain what should not be scheduled around it.',
    toolId: 'createFocusSession',
    requiresConfirmation: false,
  },
}

export const AI_ACTION_LIST = Object.values(AI_ACTIONS)

export function getAIAction(actionId: AIActionId): AIAction {
  return AI_ACTIONS[actionId]
}
