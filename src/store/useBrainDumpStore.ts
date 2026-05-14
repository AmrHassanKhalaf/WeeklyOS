// ─── useBrainDumpStore ────────────────────────────────────────────────────────
// Refactored to:
//  - Use brainDumpRepository instead of raw supabase.from() calls (Issue 2)
//  - Use createAsyncSlice factory for isLoading/error lifecycle (Issue 4)

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  getBrainDumpItems,
  createBrainDumpItem,
  updateBrainDumpItem,
  deleteBrainDumpItem,
  deleteBrainDumpItems,
} from '../lib/repository/brainDumpRepository'
import { createAsyncSlice, type AsyncSlice } from './utils/createAsyncSlice'

export interface BrainDumpItem {
  id: string
  content: string
  tags: string[]
  createdAt: string
  selected?: boolean
}

interface BrainDumpState extends AsyncSlice {
  brainDumpItems: BrainDumpItem[]

  loadItems: () => Promise<void>
  addItem: (content: string, tags?: string[]) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateItem: (id: string, updates: Partial<{ content: string; tags: string[] }>) => Promise<void>
  toggleSelection: (id: string) => void
  deleteSelected: () => Promise<void>
}

export const useBrainDumpStore = create<BrainDumpState>((set, get) => ({
  brainDumpItems: [],
  ...createAsyncSlice<BrainDumpState>(set),

  loadItems: async () => {
    await get().withAsync(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const rows = await getBrainDumpItems(user.id)
      set({
        brainDumpItems: rows.map((r) => ({
          id: r.id,
          content: r.content ?? '',
          tags: r.tags ?? [],
          createdAt: r.created_at,
          selected: false,
        })),
      })
    })
  },

  addItem: async (content: string, tags: string[] = []) => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    try {
      const row = await createBrainDumpItem({ user_id: user.id, content, tags })
      set((state) => ({
        brainDumpItems: [
          {
            id: row.id,
            content: row.content ?? '',
            tags: row.tags ?? [],
            createdAt: row.created_at,
            selected: false,
          },
          ...state.brainDumpItems,
        ],
      }))
    } catch (err) {
      console.error('[useBrainDumpStore] addItem failed:', err)
    }
  },

  removeItem: async (id: string) => {
    // Optimistic removal
    const snapshot = get().brainDumpItems
    set((state) => ({ brainDumpItems: state.brainDumpItems.filter((i) => i.id !== id) }))
    try {
      await deleteBrainDumpItem(id)
    } catch (err) {
      console.error('[useBrainDumpStore] removeItem failed, reverting:', err)
      set({ brainDumpItems: snapshot })
    }
  },

  updateItem: async (id: string, updates: Partial<{ content: string; tags: string[] }>) => {
    // Optimistic update
    const snapshot = get().brainDumpItems
    set((state) => ({
      brainDumpItems: state.brainDumpItems.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }))
    try {
      await updateBrainDumpItem(id, updates)
    } catch (err) {
      console.error('[useBrainDumpStore] updateItem failed, reverting:', err)
      set({ brainDumpItems: snapshot })
    }
  },

  toggleSelection: (id) =>
    set((state) => ({
      brainDumpItems: state.brainDumpItems.map((i) =>
        i.id === id ? { ...i, selected: !i.selected } : i
      ),
    })),

  deleteSelected: async () => {
    const selected = get().brainDumpItems.filter((i) => i.selected)
    if (!selected.length) return

    // Optimistic removal
    const snapshot = get().brainDumpItems
    set((state) => ({ brainDumpItems: state.brainDumpItems.filter((i) => !i.selected) }))

    try {
      await deleteBrainDumpItems(selected.map((i) => i.id))
    } catch (err) {
      console.error('[useBrainDumpStore] deleteSelected failed, reverting:', err)
      set({ brainDumpItems: snapshot })
    }
  },
}))
