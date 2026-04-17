import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { DayOfWeek, Priority } from './useWeekStore'

export interface PinnedTask {
  id: string
  title: string
  description?: string
  priority: Priority
  dayOfWeek: DayOfWeek
  startTime?: string
  endTime?: string
  tags?: string[]
  isActive: boolean
  untilDate?: string
}

interface PinnedTaskStore {
  items: PinnedTask[]
  isLoading: boolean
  error: string | null
  loadPinnedTasks: () => Promise<void>
  createPinnedTask: (payload: Omit<PinnedTask, 'id'>) => Promise<void>
  updatePinnedTask: (id: string, payload: Partial<Omit<PinnedTask, 'id'>>) => Promise<void>
  deletePinnedTask: (id: string) => Promise<void>
  togglePinnedTask: (id: string, isActive: boolean) => Promise<void>
}

function mapPinnedTask(row: Record<string, unknown>): PinnedTask {
  return {
    id: String(row.id),
    title: String(row.title),
    description: row.description ? String(row.description) : undefined,
    priority: (row.priority as Priority) || 'medium',
    dayOfWeek: row.day_of_week as DayOfWeek,
    startTime: row.start_time ? String(row.start_time) : undefined,
    endTime: row.end_time ? String(row.end_time) : undefined,
    tags: (row.tags as string[] | null) || undefined,
    isActive: !!row.is_active,
    untilDate: row.until_date ? String(row.until_date) : undefined,
  }
}

export const usePinnedTaskStore = create<PinnedTaskStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  loadPinnedTasks: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    set({ isLoading: true, error: null })

    const { data, error } = await supabase
      .from('pinned_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      set({ isLoading: false, error: error.message })
      return
    }

    set({
      items: (data || []).map((row) => mapPinnedTask(row as Record<string, unknown>)),
      isLoading: false,
      error: null,
    })
  },

  createPinnedTask: async (payload) => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    const { data, error } = await supabase
      .from('pinned_tasks')
      .insert({
        user_id: user.id,
        title: payload.title,
        description: payload.description || null,
        priority: payload.priority,
        day_of_week: payload.dayOfWeek,
        start_time: payload.startTime || null,
        end_time: payload.endTime || null,
        tags: payload.tags || null,
        is_active: payload.isActive,
        until_date: payload.untilDate || null,
      })
      .select('*')
      .single()

    if (error) {
      set({ error: error.message })
      throw new Error(error.message)
    }

    const item = mapPinnedTask(data as Record<string, unknown>)
    set((state) => ({ items: [item, ...state.items] }))
  },

  updatePinnedTask: async (id, payload) => {
    const { error } = await supabase
      .from('pinned_tasks')
      .update({
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description || null }),
        ...(payload.priority !== undefined && { priority: payload.priority }),
        ...(payload.dayOfWeek !== undefined && { day_of_week: payload.dayOfWeek }),
        ...(payload.startTime !== undefined && { start_time: payload.startTime || null }),
        ...(payload.endTime !== undefined && { end_time: payload.endTime || null }),
        ...(payload.tags !== undefined && { tags: payload.tags || null }),
        ...(payload.isActive !== undefined && { is_active: payload.isActive }),
        ...(payload.untilDate !== undefined && { until_date: payload.untilDate || null }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      set({ error: error.message })
      throw new Error(error.message)
    }

    set((state) => ({
      items: state.items.map((item) => item.id === id ? { ...item, ...payload } : item),
    }))
  },

  deletePinnedTask: async (id) => {
    const { error } = await supabase
      .from('pinned_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      set({ error: error.message })
      throw new Error(error.message)
    }

    set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
  },

  togglePinnedTask: async (id, isActive) => {
    await get().updatePinnedTask(id, { isActive })
  },
}))
