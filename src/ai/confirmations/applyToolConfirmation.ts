import { useWeekStore } from '../../store/useWeekStore'
import type { DayOfWeek, Priority, TaskStatus } from '../types'
import type { PendingToolConfirmation } from '../orchestrator/types'
import type { PlanningResult } from '../planning/types'

export interface ApplyToolConfirmationResult {
  appliedCount: number
  message: string
}

type TaskUpdatePayload = Partial<{
  title: string
  priority: Priority
  day: DayOfWeek | null
  status: TaskStatus
  description: string
  estimatedTime: string
  startTime: string
  tags: string[]
}>

const DAYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function isDayOfWeek(value: unknown): value is DayOfWeek {
  return typeof value === 'string' && DAYS.includes(value as DayOfWeek)
}

function isPriority(value: unknown): value is Priority {
  return value === 'high' || value === 'medium' || value === 'low'
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'pending' || value === 'done'
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return strings.length > 0 ? strings : undefined
}

async function applyCreateTask(confirmation: PendingToolConfirmation): Promise<ApplyToolConfirmationResult> {
  const output = asRecord(confirmation.proposedOutput)
  const proposedTask = asRecord(output.proposedTask)
  const title = optionalString(proposedTask.title)
  const priority = proposedTask.priority

  if (!title || !isPriority(priority)) {
    throw new Error('Create task proposal is missing a valid title or priority.')
  }

  await useWeekStore.getState().createTask({
    title,
    priority,
    day: isDayOfWeek(proposedTask.day) ? proposedTask.day : undefined,
    description: optionalString(proposedTask.description),
    estimatedTime: optionalString(proposedTask.estimatedTime),
    tags: optionalStringArray(proposedTask.tags),
  })

  return {
    appliedCount: 1,
    message: `Created task "${title}".`,
  }
}

async function applyUpdateTask(confirmation: PendingToolConfirmation): Promise<ApplyToolConfirmationResult> {
  const output = asRecord(confirmation.proposedOutput)
  const taskId = optionalString(output.taskId) ?? optionalString(confirmation.input.taskId)
  const proposedUpdates = asRecord(output.proposedUpdates)

  if (!taskId) throw new Error('Update task proposal is missing a task ID.')

  const updates: TaskUpdatePayload = {}

  if (typeof proposedUpdates.title === 'string') updates.title = proposedUpdates.title.trim()
  if (isPriority(proposedUpdates.priority)) updates.priority = proposedUpdates.priority
  if (isTaskStatus(proposedUpdates.status)) updates.status = proposedUpdates.status
  if (isDayOfWeek(proposedUpdates.day)) updates.day = proposedUpdates.day
  if (typeof proposedUpdates.estimatedTime === 'string') updates.estimatedTime = proposedUpdates.estimatedTime.trim()

  if (Object.keys(updates).length === 0) {
    throw new Error('Update task proposal does not contain any supported fields.')
  }

  await useWeekStore.getState().updateTask(taskId, updates)

  return {
    appliedCount: 1,
    message: 'Updated the proposed task.',
  }
}

async function applyRescheduleTasks(confirmation: PendingToolConfirmation): Promise<ApplyToolConfirmationResult> {
  const output = confirmation.proposedOutput as Partial<PlanningResult>
  const suggestions = Array.isArray(output.rebalanceSuggestions)
    ? output.rebalanceSuggestions.filter(
        (proposal) => optionalString(proposal.taskId) && isDayOfWeek(proposal.toDay)
      )
    : []

  if (suggestions.length === 0) {
    throw new Error('Reschedule proposal does not include any valid task moves.')
  }

  const store = useWeekStore.getState()
  for (const proposal of suggestions) {
    await store.updateTask(proposal.taskId, { day: proposal.toDay })
  }

  return {
    appliedCount: suggestions.length,
    message: `Moved ${suggestions.length} task${suggestions.length > 1 ? 's' : ''}.`,
  }
}

export async function applyToolConfirmation(
  confirmation: PendingToolConfirmation
): Promise<ApplyToolConfirmationResult> {
  switch (confirmation.toolId) {
    case 'createTask':
      return applyCreateTask(confirmation)
    case 'updateTask':
      return applyUpdateTask(confirmation)
    case 'rescheduleTasks':
      return applyRescheduleTasks(confirmation)
    default:
      throw new Error(`No apply handler exists for "${confirmation.toolName}".`)
  }
}
