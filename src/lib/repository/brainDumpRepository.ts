// ─── brainDumpRepository.ts ───────────────────────────────────────────────────
// Typed data-access layer for the `brain_dump` table.
//
// Real DB schema (verified via MCP 2026-05-13):
//   brain_dump: id, user_id, content, created_at, tags
//   NOTE: No `updated_at` column.

import { supabase } from '../supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrainDumpRow {
  id: string
  user_id: string
  content: string | null
  created_at: string
  tags: string[] | null
}

export interface CreateBrainDumpInput {
  user_id: string
  content: string
  tags?: string[]
}

export interface UpdateBrainDumpInput {
  content?: string
  tags?: string[]
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Fetch all brain dump items for the user, newest first. */
export async function getBrainDumpItems(userId: string): Promise<BrainDumpRow[]> {
  const { data, error } = await supabase
    .from('brain_dump')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as BrainDumpRow[]
}

/** Insert a new brain dump entry and return the persisted row. */
export async function createBrainDumpItem(input: CreateBrainDumpInput): Promise<BrainDumpRow> {
  const { data, error } = await supabase
    .from('brain_dump')
    .insert({
      user_id: input.user_id,
      content: input.content,
      tags: input.tags ?? [],
    })
    .select()
    .single()

  if (error) throw error
  return data as BrainDumpRow
}

/** Update content and/or tags for an existing brain dump item. */
export async function updateBrainDumpItem(id: string, input: UpdateBrainDumpInput): Promise<void> {
  const payload: Record<string, unknown> = {}
  if ('content' in input && input.content !== undefined) payload.content = input.content.trim()
  if ('tags' in input && input.tags !== undefined) payload.tags = input.tags

  if (Object.keys(payload).length === 0) return

  const { error } = await supabase.from('brain_dump').update(payload as never).eq('id', id)
  if (error) throw error
}

/** Delete a single brain dump item. */
export async function deleteBrainDumpItem(id: string): Promise<void> {
  const { error } = await supabase.from('brain_dump').delete().eq('id', id)
  if (error) throw error
}

/** Delete multiple brain dump items by their IDs. */
export async function deleteBrainDumpItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('brain_dump').delete().in('id', ids)
  if (error) throw error
}

/** Delete all brain dump items for a user (e.g. on "Start New Plan"). */
export async function deleteAllBrainDumpItems(userId: string): Promise<void> {
  const { error } = await supabase.from('brain_dump').delete().eq('user_id', userId)
  if (error) throw error
}
