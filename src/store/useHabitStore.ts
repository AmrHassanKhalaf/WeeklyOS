import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type HabitCategory = 'health' | 'learning' | 'productivity' | 'spiritual' | 'break_habit'
/** @deprecated alias kept for any imports that still use HabitType */
export type HabitType = HabitCategory

export type HabitGroup = 'morning' | 'evening' | 'anytime'

/** Returns true when the habit is a "break it" (bad) habit */
export const isBadHabit = (h: Pick<Habit, 'type'>): boolean => h.type === 'break_habit'

export interface Habit {
  id: string
  user_id: string
  name: string
  type: HabitCategory
  group_label: HabitGroup
  motivation: string
  color: string
  is_active: boolean
  is_bad_habit: boolean   // kept for DB compat — always equals (type === 'break_habit')
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
  type: HabitCategory
  group_label: HabitGroup
  motivation: string
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
  habit: Habit,
  month: number,
  year: number,
  today: number
): HabitStreakInfo {
  const days = new Set(
    completions
      .filter(c => c.habit_id === habit.id && c.month === month && c.year === year)
      .map(c => c.day)
  )

  const bad = isBadHabit(habit)

  // For break habits: streak = consecutive clean days (not in completions)
  // For build habits: streak = consecutive done days (in completions)
  const isSuccess = (d: number) => bad ? !days.has(d) : days.has(d)

  let current = 0
  for (let d = today; d >= 1; d--) {
    if (isSuccess(d)) current++
    else break
  }

  let longest = 0
  let streak = 0
  for (let d = 1; d <= 31; d++) {
    if (isSuccess(d)) {
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
    const is_bad_habit = data.type === 'break_habit'

    const { data: newHabit, error } = await supabase
      .from('habits')
      .insert({
        ...data,
        user_id: user.id,
        sort_order,
        is_bad_habit,
        // difficulty has a DB default of 'medium', no need to send
        color: is_bad_habit ? '#f87171' : '#4ade80',
      })
      .select()
      .single()

    if (error) throw error
    set({ habits: [...get().habits, newHabit as Habit] })
  },

  editHabit: async (id, updates) => {
    const is_bad_habit = updates.type !== undefined ? updates.type === 'break_habit' : undefined
    const payload = is_bad_habit !== undefined ? { ...updates, is_bad_habit } : updates

    const { data: updated, error } = await supabase
      .from('habits')
      .update(payload)
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
        set({ completions: get().completions.filter(c => c.id !== optimistic.id) })
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
    const { habits, completions, currentMonth, currentYear } = get()
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return { current: 0, longest: 0 }
    const today = new Date().getDate()
    return computeStreaks(completions, habit, currentMonth, currentYear, today)
  },

  getPerfectDays: (totalDays) => {
    const { habits, completions, currentMonth, currentYear } = get()
    if (habits.length === 0) return new Set()
    const buildHabits = habits.filter(h => !isBadHabit(h))
    if (buildHabits.length === 0) return new Set()
    const perfect = new Set<number>()
    for (let d = 1; d <= totalDays; d++) {
      const allDone = buildHabits.every(h =>
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
