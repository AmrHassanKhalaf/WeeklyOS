import type { AITool, AIToolId } from '../types'
import { analyzeProductivityContract } from './contracts/analyzeProductivity'
import { createFocusSessionContract } from './contracts/createFocusSession'
import { createTaskContract } from './contracts/createTask'
import { generateDayPlanContract } from './contracts/generateDayPlan'
import { generateWeekPlanContract } from './contracts/generateWeekPlan'
import { organizeBrainDumpContract } from './contracts/organizeBrainDump'
import { rescheduleTasksContract } from './contracts/rescheduleTasks'
import { summarizeReflectionContract } from './contracts/summarizeReflection'
import { summarizeWeekContract } from './contracts/summarizeWeek'
import { updateTaskContract } from './contracts/updateTask'

// ─── Canonical Tool Map ───────────────────────────────────────────────────────

/**
 * The single source of truth for all registered AI tools.
 * Each entry is a fully-typed contract with schema, metadata, and execute function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AI_TOOLS: Record<AIToolId, AITool<any, any>> = {
  createTask: createTaskContract,
  updateTask: updateTaskContract,
  generateWeekPlan: generateWeekPlanContract,
  generateDayPlan: generateDayPlanContract,
  organizeBrainDump: organizeBrainDumpContract,
  summarizeWeek: summarizeWeekContract,
  analyzeProductivity: analyzeProductivityContract,
  rescheduleTasks: rescheduleTasksContract,
  createFocusSession: createFocusSessionContract,
  summarizeReflection: summarizeReflectionContract,
}

// ─── Registry Interface ───────────────────────────────────────────────────────

export interface AIToolRegistry {
  /** Add or overwrite a tool by ID. */
  register: (tool: AITool) => void
  /** Retrieve a single tool by ID. */
  get: (toolId: AIToolId) => AITool | undefined
  /** List all registered tools. */
  list: () => AITool[]
  /** Resolve a subset of tools by ID list (unknown IDs are silently skipped). */
  resolve: (toolIds: AIToolId[]) => AITool[]
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAIToolRegistry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialTools: AITool<any, any>[] = Object.values(AI_TOOLS)
): AIToolRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools = new Map<AIToolId, AITool<any, any>>(
    initialTools.map((tool) => [tool.id, tool])
  )

  return {
    register: (tool) => tools.set(tool.id, tool),
    get: (toolId) => tools.get(toolId),
    list: () => Array.from(tools.values()),
    resolve: (toolIds) =>
      toolIds
        .map((toolId) => tools.get(toolId))
        .filter((tool): tool is AITool => Boolean(tool)),
  }
}

/** The default registry pre-loaded with all built-in tool contracts. */
export const defaultAIToolRegistry = createAIToolRegistry()
