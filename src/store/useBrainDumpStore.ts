import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface BrainDumpItem {
  id: string
  content: string
  tags: string[]
  createdAt: string
  selected?: boolean
}

interface BrainDumpState {
  brainDumpItems: BrainDumpItem[]
  isLoading: boolean
  
  loadItems: () => Promise<void>
  addItem: (content: string, tags?: string[]) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateItem: (id: string, updates: Partial<{ content: string; tags: string[] }>) => Promise<void>
  toggleSelection: (id: string) => void
  deleteSelected: () => Promise<void>
}

export const useBrainDumpStore = create<BrainDumpState>((set, get) => ({
  brainDumpItems: [],
  isLoading: false,

  loadItems: async () => {
    set({ isLoading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('brain_dump')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ 
        brainDumpItems: data.map(item => ({
          id: item.id,
          content: item.content || '',
          tags: item.tags || [],
          createdAt: item.created_at,
          selected: false
        }))
      })
    } catch (e) {
      console.error('[useBrainDumpStore] loadItems failed:', e)
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (content: string, tags: string[] = []) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('brain_dump')
      .insert({ user_id: user.id, content, tags })
      .select()
      .single()

    if (error) {
      console.error('[useBrainDumpStore] addItem failed:', error)
      return
    }

    set(state => ({
      brainDumpItems: [{
        id: data.id,
        content: data.content || '',
        tags: data.tags || [],
        createdAt: data.created_at,
        selected: false
      }, ...state.brainDumpItems]
    }))
  },

  removeItem: async (id: string) => {
    const { error } = await supabase.from('brain_dump').delete().eq('id', id)
    if (error) {
      console.error('[useBrainDumpStore] removeItem failed:', error)
      return
    }
    set(state => ({ 
      brainDumpItems: state.brainDumpItems.filter(i => i.id !== id) 
    }))
  },

  updateItem: async (id: string, updates: Partial<{ content: string; tags: string[] }>) => {
    const payload: Record<string, any> = {}
    if (updates.content !== undefined) payload.content = updates.content.trim()
    if (updates.tags !== undefined) payload.tags = updates.tags

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase.from('brain_dump').update(payload).eq('id', id)
      if (error) {
        console.error('[useBrainDumpStore] updateItem failed:', error)
        return
      }
    }

    set(state => ({
      brainDumpItems: state.brainDumpItems.map(i => i.id === id ? { ...i, ...updates } : i),
    }))
  },

  toggleSelection: (id) =>
    set(state => ({
      brainDumpItems: state.brainDumpItems.map(i =>
        i.id === id ? { ...i, selected: !i.selected } : i
      ),
    })),

  deleteSelected: async () => {
    const selected = get().brainDumpItems.filter(i => i.selected)
    if (!selected.length) return

    const { error } = await supabase
      .from('brain_dump')
      .delete()
      .in('id', selected.map(i => i.id))

    if (error) {
      console.error('[useBrainDumpStore] deleteSelected failed:', error)
      return
    }

    set(state => ({ 
      brainDumpItems: state.brainDumpItems.filter(i => !i.selected) 
    }))
  }
}))
