import type { AITool, AIToolId, AIToolSchema } from '../types'

const emptyObjectSchema: AIToolSchema = {
  type: 'object',
  properties: {},
}

function createToolMetadata(id: AIToolId, name: string, description: string, category: AITool['category']): AITool {
  return {
    id,
    name,
    description,
    category,
    inputSchema: emptyObjectSchema,
    outputSchema: emptyObjectSchema,
    requiresConfirmation: true,
  }
}

export const AI_TOOLS: Record<AIToolId, AITool> = {
  createTask: createToolMetadata('createTask', 'Create Task', 'Prepare a future task creation action.', 'task'),
  updateTask: createToolMetadata('updateTask', 'Update Task', 'Prepare a future task update action.', 'task'),
  generateWeekPlan: createToolMetadata(
    'generateWeekPlan',
    'Generate Week Plan',
    'Prepare a future weekly planning action.',
    'planning'
  ),
  organizeBrainDump: createToolMetadata(
    'organizeBrainDump',
    'Organize Brain Dump',
    'Prepare a future brain dump organization action.',
    'planning'
  ),
  analyzeProductivity: createToolMetadata(
    'analyzeProductivity',
    'Analyze Productivity',
    'Prepare a future productivity analysis action.',
    'analysis'
  ),
  createFocusSession: createToolMetadata(
    'createFocusSession',
    'Create Focus Session',
    'Prepare a future focus session action.',
    'focus'
  ),
  summarizeReflection: createToolMetadata(
    'summarizeReflection',
    'Summarize Reflection',
    'Prepare a future reflection summary action.',
    'reflection'
  ),
}

export interface AIToolRegistry {
  register: (tool: AITool) => void
  get: (toolId: AIToolId) => AITool | undefined
  list: () => AITool[]
  resolve: (toolIds: AIToolId[]) => AITool[]
}

export function createAIToolRegistry(initialTools: AITool[] = Object.values(AI_TOOLS)): AIToolRegistry {
  const tools = new Map<AIToolId, AITool>(initialTools.map((tool) => [tool.id, tool]))

  return {
    register: (tool) => {
      tools.set(tool.id, tool)
    },
    get: (toolId) => tools.get(toolId),
    list: () => Array.from(tools.values()),
    resolve: (toolIds) => toolIds.map((toolId) => tools.get(toolId)).filter((tool): tool is AITool => Boolean(tool)),
  }
}

export const defaultAIToolRegistry = createAIToolRegistry()
