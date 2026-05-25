// ─── habitRepository.ts ───────────────────────────────────────────────────────
// Typed data-access layer for the `habits` and `habit_completions` tables.
//
// Real DB schema (verified via MCP 2026-05-13):
//   habits: id, user_id, name, type, difficulty, group_label, motivation,
//           color, is_active, month, year, sort_order, created_at, is_bad_habit
//   habit_completions: id, user_id, habit_id, day, month, year, completed_at
//
// IMPORTANT: The `habits` table has a `difficulty` column that the TypeScript
// store type `Habit` was missing. It is included here for completeness.

import { supabase } from '../supabase'
import type { HabitCategory, HabitGroup, Habit, HabitCompletion } from '../../store/useHabitStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateHabitInput {
  user_id: string
  name: string
  type: HabitCategory
  group_label: HabitGroup
  motivation: string
  month: number
  year: number
  sort_order: number
  is_bad_habit: boolean
  color: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface UpdateHabitInput {
  name?: string
  type?: HabitCategory
  group_label?: HabitGroup
  motivation?: string
  is_bad_habit?: boolean
  sort_order?: number
  color?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

// ─── Habit Queries ────────────────────────────────────────────────────────────

/** Fetch all active habits for the given month/year. */
export async function getHabits(userId: string, month: number, year: number): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as Habit[]
}

/** Insert a new habit and return the persisted row. */
export async function createHabit(input: CreateHabitInput): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert(input as never)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Habit
}

/** Update specific fields of an existing habit. */
export async function updateHabit(habitId: string, input: UpdateHabitInput): Promise<Habit> {
  const payload: Record<string, unknown> = {}
  if ('name' in input) payload.name = input.name
  if ('type' in input) payload.type = input.type
  if ('group_label' in input) payload.group_label = input.group_label
  if ('motivation' in input) payload.motivation = input.motivation
  if ('is_bad_habit' in input) payload.is_bad_habit = input.is_bad_habit
  if ('sort_order' in input) payload.sort_order = input.sort_order
  if ('color' in input) payload.color = input.color
  if ('difficulty' in input) payload.difficulty = input.difficulty

  const { data, error } = await supabase
    .from('habits')
    .update(payload as never)
    .eq('id', habitId)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Habit
}

/** Soft-delete: sets is_active = false so history is preserved. */
export async function deactivateHabit(habitId: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ is_active: false })
    .eq('id', habitId)
  if (error) throw error
}

/** Update the sort order for a single habit. */
export async function reorderHabit(habitId: string, newOrder: number): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({ sort_order: newOrder })
    .eq('id', habitId)
  if (error) throw error
}

// ─── Completion Queries ───────────────────────────────────────────────────────

/** Fetch all completions for the given user, month, and year. */
export async function getCompletions(
  userId: string,
  month: number,
  year: number
): Promise<HabitCompletion[]> {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)

  if (error) throw error
  return (data ?? []) as HabitCompletion[]
}

/** Insert a single completion. Returns the persisted row. */
export async function createCompletion(
  userId: string,
  habitId: string,
  day: number,
  month: number,
  year: number
): Promise<HabitCompletion> {
  const { data, error } = await supabase
    .from('habit_completions')
    .insert({ user_id: userId, habit_id: habitId, day, month, year })
    .select()
    .single()

  if (error) throw error
  return data as HabitCompletion
}

/** Delete a completion by its primary key id. */
export async function deleteCompletion(completionId: string): Promise<void> {
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('id', completionId)
  if (error) throw error
}
