// ─── taskRepository.ts ────────────────────────────────────────────────────────
// Typed data-access layer for the `tasks` table.
// All stores must go through this module — never call supabase.from('tasks')
// directly in a component or page.
//
// Real DB schema (verified via MCP 2026-05-13):
//   tasks: id, user_id, week_id, title, description, day, priority, type,
//          status, created_at, start_time, estimated_duration, tags,
//          actual_duration, pinned_task_id
//   NOTE: No `updated_at` column — conflict detection is not possible for tasks.

import { supabase } from '../supabase'
import type { DayOfWeek, Priority, TaskStatus } from '../../store/useWeekStore'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskRow {
  id: string
  user_id: string
  week_id: string | null
  title: string
  description: string | null
  day: DayOfWeek | null
  priority: Priority
  type: 'main' | 'medium' | 'small' | 'pinned' | null
  status: TaskStatus
  created_at: string
  start_time: string | null
  estimated_duration: string | null
  tags: string[] | null
  actual_duration: number | null
  pinned_task_id: string | null
}

export interface CreateTaskInput {
  user_id: string
  week_id: string
  title: string
  priority: Priority
  day?: DayOfWeek | null
  description?: string | null
  status?: TaskStatus
  start_time?: string | null
  estimated_duration?: string | null
  tags?: string[] | null
  type?: TaskRow['type']
  pinned_task_id?: string | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  day?: DayOfWeek | null
  priority?: Priority
  status?: TaskStatus
  start_time?: string | null
  estimated_duration?: string | null
  tags?: string[] | null
  actual_duration?: number
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Fetch all tasks for a given week. */
export async function getTasksByWeek(userId: string, weekId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)

  if (error) throw error
  return (data ?? []) as TaskRow[]
}

/** Insert a new task and return the persisted row. */
export async function createTask(input: CreateTaskInput): Promise<TaskRow> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: input.user_id,
      week_id: input.week_id,
      title: input.title,
      priority: input.priority,
      day: input.day ?? null,
      description: input.description ?? null,
      status: input.status ?? 'pending',
      start_time: input.start_time ?? null,
      estimated_duration: input.estimated_duration ?? null,
      tags: input.tags ?? null,
      type: input.type ?? null,
      pinned_task_id: input.pinned_task_id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as TaskRow
}

/** Update specific fields of an existing task. */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<void> {
  // Build payload without undefined keys so Supabase doesn't attempt to clear columns
  const payload: Record<string, unknown> = {}
  if ('title' in input) payload.title = input.title
  if ('description' in input) payload.description = input.description ?? null
  if ('day' in input) payload.day = input.day ?? null
  if ('priority' in input) payload.priority = input.priority
  if ('status' in input) payload.status = input.status
  if ('start_time' in input) payload.start_time = input.start_time ?? null
  if ('estimated_duration' in input) payload.estimated_duration = input.estimated_duration ?? null
  if ('tags' in input) payload.tags = input.tags ?? null
  if ('actual_duration' in input) payload.actual_duration = input.actual_duration

  const { error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)

  if (error) throw error
}

/** Hard-delete a single task. */
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)
  if (error) throw error
}

/** Mark all pending tasks in a day as done. */
export async function markTasksDone(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) return
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .in('id', taskIds)
  if (error) throw error
}

/** Delete all tasks belonging to a week+day combination. */
export async function deleteTasksByDay(weekId: string, day: DayOfWeek): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('week_id', weekId)
    .eq('day', day)
  if (error) throw error
}

/** Delete all tasks belonging to a week. */
export async function deleteTasksByWeek(weekId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('week_id', weekId)
  if (error) throw error
}

/** Increment actual_duration for a task (focus timer). */
export async function addActualDuration(taskId: string, currentDuration: number, secondsToAdd: number): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ actual_duration: currentDuration + secondsToAdd })
    .eq('id', taskId)
  if (error) throw error
}
