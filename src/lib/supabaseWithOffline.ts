// ─── supabaseWithOffline ──────────────────────────────────────────────────────
// A thin, typed wrapper around Supabase query methods that intercepts network
// failures and routes them to the offlineQueueStore instead of dropping them.
//
// Usage (drop-in replacement for raw supabase calls in stores):
//
//   import { offlineInsert, offlineUpdate, offlineDelete } from '@/lib/supabaseWithOffline'
//
//   // Instead of: supabase.from('tasks').insert(row)
//   const { data, error } = await offlineInsert('tasks', row, userId)
//
// Notes:
// - Only network errors trigger offline queuing.
// - Server-side business logic errors (RLS violations, constraint errors) are
//   returned to the caller as normal — they should NOT be queued.
// - The caller is responsible for the optimistic UI update and rollback.

import { supabase } from './supabase'
import { useOfflineQueueStore, isNetworkError } from '../store/offlineQueueStore'
import type { MutationOperation } from '../store/offlineQueueStore'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function enqueueIfOffline(
  table: string,
  operation: MutationOperation,
  payload: Record<string, unknown>
): void {
  useOfflineQueueStore.getState().enqueue({ table, operation, payload })
}

// ─── INSERT ───────────────────────────────────────────────────────────────────

/**
 * Attempts a Supabase INSERT. On network failure, queues the mutation for
 * later replay and returns a synthetic success-like result so callers can
 * continue with their optimistic update.
 */
export async function offlineInsert<T extends Record<string, unknown>>(
  table: string,
  row: T
): Promise<{ data: T | null; error: null; wasQueued: boolean }> {
  try {
    const { data, error } = await supabase
      .from(table as 'tasks')
      .insert(row as never)
      .select()
      .single()

    if (error) throw error
    return { data: data as T | null, error: null, wasQueued: false }
  } catch (err) {
    if (isNetworkError(err)) {
      enqueueIfOffline(table, 'INSERT', row as Record<string, unknown>)
      return { data: row as T, error: null, wasQueued: true }
    }
    throw err
  }
}

/**
 * Attempts a Supabase UPDATE. On network failure, queues the mutation.
 * @param id       The record primary key.
 * @param fields   The fields to update (will be merged with `{ id }` for replay).
 */
export async function offlineUpdate<T extends Record<string, unknown>>(
  table: string,
  id: string,
  fields: Partial<T>
): Promise<{ error: null; wasQueued: boolean }> {
  try {
    const { error } = await supabase
      .from(table as 'tasks')
      .update(fields as never)
      .eq('id', id)

    if (error) throw error
    return { error: null, wasQueued: false }
  } catch (err) {
    if (isNetworkError(err)) {
      enqueueIfOffline(table, 'UPDATE', {
        id,
        ...fields,
        updated_at: new Date().toISOString(),
      })
      return { error: null, wasQueued: true }
    }
    throw err
  }
}

/**
 * Attempts a Supabase DELETE. On network failure, queues the mutation.
 */
export async function offlineDelete(
  table: string,
  id: string
): Promise<{ error: null; wasQueued: boolean }> {
  try {
    const { error } = await supabase.from(table as 'tasks').delete().eq('id', id)
    if (error) throw error
    return { error: null, wasQueued: false }
  } catch (err) {
    if (isNetworkError(err)) {
      enqueueIfOffline(table, 'DELETE', { id })
      return { error: null, wasQueued: true }
    }
    throw err
  }
}
