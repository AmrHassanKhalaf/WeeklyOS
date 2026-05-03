import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type HabitType = 'health' | 'learning' | 'productivity' | 'spiritual' | 'breaking_bad'
export type HabitDifficulty = 'easy' | 'medium' | 'hard'
export type HabitGroup = 'morning' | 'evening' | 'anytime'

export interface Habit {
  id: string
  user_id: string
  name: string
  type: HabitType
  difficulty: HabitDifficulty
  group_label: HabitGroup
  motivation: string
  color: string
  is_active: boolean
  month: number
  year: number
  sort_order: number
  created_at: string
}

export interface HabitCompletion {
  id: string
  user_id: string
  habit_id: string
  day: number
  month: number
  year: number
  completed_at: string
}

export interface NewHabitData {
  name: string
  type: HabitType
  difficulty: HabitDifficulty
  group_label: HabitGroup
  motivation: string
  color: string
  month: number
  year: number
}

export interface HabitStreakInfo {
  current: number
  longest: number
}

export type ViewMode = 'monthly' | 'weekly'

// ─── Streak Computation ───────────────────────────────────────────────────────

function computeStreaks(
  completions: HabitCompletion[],
  habitId: string,
  month: number,
  year: number,
  today: number
): HabitStreakInfo {
  const days = new Set(
    completions
      .filter(c => c.habit_id === habitId && c.month === month && c.year === year)
      .map(c => c.day)
  )

  let current = 0
  let longest = 0
  let streak = 0

  // Walk backwards from today
  for (let d = today; d >= 1; d--) {
    if (days.has(d)) {
      streak++
      if (d === today || d === today - current) current = streak
    } else {
      break
    }
  }
  current = streak

  // Find longest streak
  streak = 0
  for (let d = 1; d <= 31; d++) {
    if (days.has(d)) {
      streak++
      longest = Math.max(longest, streak)
    } else {
      streak = 0
    }
  }

  return { current, longest }
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface HabitStore {
  habits: Habit[]
  completions: HabitCompletion[]
  currentMonth: number
  currentYear: number
  viewMode: ViewMode
  isLoading: boolean
  error: string | null

  // Month navigation
  setMonth: (month: number, year: number) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void

  // View
  setViewMode: (mode: ViewMode) => void

  // Data
  loadData: () => Promise<void>

  // CRUD
  addHabit: (data: NewHabitData) => Promise<void>
  editHabit: (id: string, updates: Partial<NewHabitData>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  reorderHabit: (id: string, newOrder: number) => Promise<void>

  // Completions
  toggleDay: (habitId: string, day: number) => Promise<void>

  // Derived helpers
  getCompletedDays: (habitId: string) => Set<number>
  getCompletionCount: (habitId: string) => number
  getCompletionRate: (habitId: string, totalDays: number) => number
  getStreak: (habitId: string) => HabitStreakInfo
  getPerfectDays: (totalDays: number) => Set<number>
  getAverageCompletionRate: (totalDays: number) => number
  getBestHabit: (totalDays: number) => Habit | null
  getWorstHabit: (totalDays: number) => Habit | null
}

// ─── Store ────────────────────────────────────────────────────────────────────

const now = new Date()

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  completions: [],
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  viewMode: 'monthly',
  isLoading: false,
  error: null,

  // ── Month Navigation ────────────────────────────────────────────────────────

  setMonth: (month, year) => {
    set({ currentMonth: month, currentYear: year })
    void get().loadData()
  },

  goToPrevMonth: () => {
    const { currentMonth, currentYear } = get()
    const d = new Date(currentYear, currentMonth - 2, 1)
    set({ currentMonth: d.getMonth() + 1, currentYear: d.getFullYear() })
    void get().loadData()
  },

  goToNextMonth: () => {
    const { currentMonth, currentYear } = get()
    const d = new Date(currentYear, currentMonth, 1)
    set({ currentMonth: d.getMonth() + 1, currentYear: d.getFullYear() })
    void get().loadData()
  },

  // ── View ────────────────────────────────────────────────────────────────────

  setViewMode: (mode) => set({ viewMode: mode }),

  // ── Load Data ───────────────────────────────────────────────────────────────

  loadData: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const { currentMonth, currentYear } = get()

      const [{ data: habits, error: hErr }, { data: completions, error: cErr }] =
        await Promise.all([
          supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .eq('month', currentMonth)
            .eq('year', currentYear)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true }),
          supabase
            .from('habit_completions')
            .select('*')
            .eq('user_id', user.id)
            .eq('month', currentMonth)
            .eq('year', currentYear),
        ])

      if (hErr) throw hErr
      if (cErr) throw cErr

      set({
        habits: (habits ?? []) as Habit[],
        completions: (completions ?? []) as HabitCompletion[],
        isLoading: false,
      })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  // ── CRUD ────────────────────────────────────────────────────────────────────

  addHabit: async (data) => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    const { habits } = get()
    const sort_order = habits.length

    const { data: newHabit, error } = await supabase
      .from('habits')
      .insert({ ...data, user_id: user.id, sort_order })
      .select()
      .single()

    if (error) throw error
    set({ habits: [...get().habits, newHabit as Habit] })
  },

  editHabit: async (id, updates) => {
    const { data: updated, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    set({
      habits: get().habits.map(h => (h.id === id ? (updated as Habit) : h)),
    })
  },

  deleteHabit: async (id) => {
    // Optimistic
    set({ habits: get().habits.filter(h => h.id !== id) })
    const { error } = await supabase.from('habits').update({ is_active: false }).eq('id', id)
    if (error) {
      // Rollback
      void get().loadData()
      throw error
    }
  },

  reorderHabit: async (id, newOrder) => {
    set({
      habits: get().habits.map(h => (h.id === id ? { ...h, sort_order: newOrder } : h)),
    })
    await supabase.from('habits').update({ sort_order: newOrder }).eq('id', id)
  },

  // ── Completions ─────────────────────────────────────────────────────────────

  toggleDay: async (habitId, day) => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    const { completions, currentMonth, currentYear } = get()
    const existing = completions.find(
      c => c.habit_id === habitId && c.day === day && c.month === currentMonth && c.year === currentYear
    )

    if (existing) {
      // Optimistic remove
      set({ completions: completions.filter(c => c.id !== existing.id) })
      const { error } = await supabase.from('habit_completions').delete().eq('id', existing.id)
      if (error) {
        set({ completions: [...get().completions, existing] }) // rollback
      }
    } else {
      // Optimistic add
      const optimistic: HabitCompletion = {
        id: `tmp-${Date.now()}`,
        user_id: user.id,
        habit_id: habitId,
        day,
        month: currentMonth,
        year: currentYear,
        completed_at: new Date().toISOString(),
      }
      set({ completions: [...completions, optimistic] })

      const { data: inserted, error } = await supabase
        .from('habit_completions')
        .insert({
          user_id: user.id,
          habit_id: habitId,
          day,
          month: currentMonth,
          year: currentYear,
        })
        .select()
        .single()

      if (error) {
        set({ completions: get().completions.filter(c => c.id !== optimistic.id) }) // rollback
      } else {
        set({
          completions: get().completions.map(c =>
            c.id === optimistic.id ? (inserted as HabitCompletion) : c
          ),
        })
      }
    }
  },

  // ── Derived Helpers ─────────────────────────────────────────────────────────

  getCompletedDays: (habitId) => {
    const { completions, currentMonth, currentYear } = get()
    return new Set(
      completions
        .filter(c => c.habit_id === habitId && c.month === currentMonth && c.year === currentYear)
        .map(c => c.day)
    )
  },

  getCompletionCount: (habitId) => {
    const { completions, currentMonth, currentYear } = get()
    return completions.filter(
      c => c.habit_id === habitId && c.month === currentMonth && c.year === currentYear
    ).length
  },

  getCompletionRate: (habitId, totalDays) => {
    if (totalDays === 0) return 0
    return Math.round((get().getCompletionCount(habitId) / totalDays) * 100)
  },

  getStreak: (habitId) => {
    const { completions, currentMonth, currentYear } = get()
    const today = new Date().getDate()
    return computeStreaks(completions, habitId, currentMonth, currentYear, today)
  },

  getPerfectDays: (totalDays) => {
    const { habits, completions, currentMonth, currentYear } = get()
    if (habits.length === 0) return new Set()
    const perfect = new Set<number>()
    for (let d = 1; d <= totalDays; d++) {
      const allDone = habits.every(h =>
        completions.some(
          c => c.habit_id === h.id && c.day === d && c.month === currentMonth && c.year === currentYear
        )
      )
      if (allDone) perfect.add(d)
    }
    return perfect
  },

  getAverageCompletionRate: (totalDays) => {
    const { habits } = get()
    if (habits.length === 0 || totalDays === 0) return 0
    const total = habits.reduce((sum, h) => sum + get().getCompletionRate(h.id, totalDays), 0)
    return Math.round(total / habits.length)
  },

  getBestHabit: (totalDays) => {
    const { habits } = get()
    if (habits.length === 0) return null
    return habits.reduce((best, h) =>
      get().getCompletionRate(h.id, totalDays) > get().getCompletionRate(best.id, totalDays) ? h : best
    )
  },

  getWorstHabit: (totalDays) => {
    const { habits } = get()
    if (habits.length === 0) return null
    return habits.reduce((worst, h) =>
      get().getCompletionRate(h.id, totalDays) < get().getCompletionRate(worst.id, totalDays) ? h : worst
    )
  },
}))
