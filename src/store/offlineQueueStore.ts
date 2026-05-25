// ─── offlineQueueStore ────────────────────────────────────────────────────────
// Implements a persistent offline mutation queue.
//
// Design:
//  - Every failed Supabase write (due to network errors) is pushed here.
//  - A `navigator.onLine` listener drains the queue when connectivity returns.
//  - Conflict resolution: server record wins if its `updated_at` is newer.
//  - Status exposed to UI via `isOnline` and `isSyncing` flags.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MutationOperation = 'INSERT' | 'UPDATE' | 'DELETE'

export interface QueuedMutation {
  /** Unique client-generated ID for deduplication. */
  id: string
  /** Supabase table name (e.g. 'tasks', 'brain_dump'). */
  table: string
  operation: MutationOperation
  /**
   * The full payload to replay.
   * - INSERT: the row to insert.
   * - UPDATE: { id: string, ...fields }
   * - DELETE: { id: string }
   */
  payload: Record<string, unknown>
  /** ISO timestamp of when this mutation was queued (for conflict resolution). */
  queuedAt: string
  /** Number of replay attempts so far. */
  attempts: number
}

interface OfflineQueueStore {
  queue: QueuedMutation[]
  isOnline: boolean
  isSyncing: boolean
  /** Last sync error message, if any. */
  lastSyncError: string | null

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Push a failed mutation into the queue. */
  enqueue: (mutation: Omit<QueuedMutation, 'id' | 'queuedAt' | 'attempts'>) => void
  /** Remove a mutation from the queue by its id. */
  dequeue: (id: string) => void
  /** Update online status. Called by the window listener in AppLayout. */
  setOnline: (online: boolean) => void
  /** Replay all queued mutations against Supabase. */
  drainQueue: () => Promise<void>
  /** Register global online/offline event listeners. Call once on app init. */
  registerListeners: () => () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true when the error is definitively a network failure
 * (not a Supabase/Postgres business logic error).
 */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false
  if (err instanceof TypeError) return true // fetch failed / no connection
  const msg = (err as { message?: string })?.message ?? ''
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network') ||
    msg.includes('ERR_INTERNET_DISCONNECTED') ||
    msg.includes('ERR_NETWORK_CHANGED')
  )
}

async function replayMutation(mutation: QueuedMutation): Promise<{ success: boolean; conflicted: boolean }> {
  const { table, operation, payload } = mutation

  if (operation === 'INSERT') {
    const { error } = await supabase.from(table as 'tasks').insert(payload as never)
    if (error) {
      // Duplicate key = already synced via another path; treat as success.
      if (error.code === '23505') return { success: true, conflicted: false }
      return { success: false, conflicted: false }
    }
    return { success: true, conflicted: false }
  }

  if (operation === 'UPDATE') {
    const { id, updated_at: localUpdatedAt, ...fields } = payload as { id: string; updated_at?: string; [k: string]: unknown }

    // Conflict check — only relevant when record has an updated_at.
    if (localUpdatedAt) {
      const { data: serverRow } = await supabase
        .from(table as 'weeks')  // cast for type inference
        .select('*')
        .eq('id', id)
        .maybeSingle()

      const serverRowData = serverRow as { updated_at?: string } | null
      if (serverRowData && serverRowData.updated_at) {
        const serverTs = new Date(serverRowData.updated_at).getTime()
        const localTs = new Date(localUpdatedAt as string).getTime()
        if (serverTs > localTs) {
          // Server is newer — skip update, prefer server version.
          console.warn(`[offlineQueue] Conflict on ${table}#${id}: server wins.`)
          return { success: true, conflicted: true }
        }
      }
    }

    const { error } = await supabase.from(table as 'tasks').update(fields as never).eq('id', id)
    if (error) return { success: false, conflicted: false }
    return { success: true, conflicted: false }
  }

  if (operation === 'DELETE') {
    const { id } = payload as { id: string }
    const { error } = await supabase.from(table as 'tasks').delete().eq('id', id)
    // 404 = already deleted; treat as success.
    if (error && error.code !== 'PGRST116') return { success: false, conflicted: false }
    return { success: true, conflicted: false }
  }

  return { success: false, conflicted: false }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOfflineQueueStore = create<OfflineQueueStore>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      lastSyncError: null,

      enqueue: (mutation) => {
        const item: QueuedMutation = {
          ...mutation,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          queuedAt: new Date().toISOString(),
          attempts: 0,
        }
        set((state) => ({ queue: [...state.queue, item] }))
        console.info(`[offlineQueue] Queued ${mutation.operation} on ${mutation.table}`)
      },

      dequeue: (id) =>
        set((state) => ({ queue: state.queue.filter((m) => m.id !== id) })),

      setOnline: (online) => {
        set({ isOnline: online })
        if (online && get().queue.length > 0) {
          void get().drainQueue()
        }
      },

      drainQueue: async () => {
        const { queue, isSyncing } = get()
        if (isSyncing || queue.length === 0) return

        set({ isSyncing: true, lastSyncError: null })

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          set({ isSyncing: false })
          return
        }

        let conflictCount = 0

        for (const mutation of [...queue]) {
          // Increment attempt counter
          set((state) => ({
            queue: state.queue.map((m) =>
              m.id === mutation.id ? { ...m, attempts: m.attempts + 1 } : m
            ),
          }))

          try {
            const { success, conflicted } = await replayMutation(mutation)
            if (conflicted) conflictCount++
            if (success) {
              get().dequeue(mutation.id)
            } else if (mutation.attempts >= 4) {
              // Give up after 5 total attempts to avoid blocking the queue forever.
              console.error(`[offlineQueue] Dropping mutation ${mutation.id} after max retries.`)
              get().dequeue(mutation.id)
            }
          } catch (err) {
            if (isNetworkError(err)) {
              // Network went away mid-drain — stop, try again later.
              console.warn('[offlineQueue] Network lost during drain — pausing.')
              break
            }
            console.error('[offlineQueue] Unexpected error replaying mutation:', err)
          }
        }

        set({ isSyncing: false })

        if (conflictCount > 0) {
          set({ lastSyncError: `${conflictCount} update(s) were overridden by newer server data.` })
        }
      },

      registerListeners: () => {
        const onOnline = () => get().setOnline(true)
        const onOffline = () => set({ isOnline: false })

        window.addEventListener('online', onOnline)
        window.addEventListener('offline', onOffline)

        // Drain immediately if we're already online and the queue has items.
        if (navigator.onLine && get().queue.length > 0) {
          void get().drainQueue()
        }

        return () => {
          window.removeEventListener('online', onOnline)
          window.removeEventListener('offline', onOffline)
        }
      },
    }),
    {
      name: 'weeklyos-offline-queue',
      // Only persist the mutation queue — runtime flags are reset on page load.
      partialize: (state) => ({ queue: state.queue }),
    }
  )
)
