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
  is_bad_habit: boolean   // DB compat — always equals (type === 'break_habit')
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Today's day-of-month (or totalDays + 1 when viewing a past month) */
function todayDayOf(currentMonth: number, currentYear: number): number {
  const now = new Date()
  const isCurrentMonth = now.getMonth() + 1 === currentMonth && now.getFullYear() === currentYear
  return isCurrentMonth ? now.getDate() : 32   // 32 = "month already passed, all days are past"
}

// ─── Streak Computation ───────────────────────────────────────────────────────

function computeStreaks(
  completions: HabitCompletion[],
  habit: Habit,
  month: number,
  year: number,
  today: number
): HabitStreakInfo {
  const logged = new Set(
    completions
      .filter(c => c.habit_id === habit.id && c.month === month && c.year === year)
      .map(c => c.day)
  )

  const bad = isBadHabit(habit)
  // Build: success = logged; Break: success = NOT logged (clean day)
  const isSuccess = (d: number) => bad ? !logged.has(d) : logged.has(d)

  // Current streak — walk backwards from today
  let current = 0
  for (let d = today; d >= 1; d--) {
    if (isSuccess(d)) current++
    else break
  }

  // Longest streak in month
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

  // ── Build-habit derived helpers ──────────────────────────────────────────────
  getCompletedDays: (habitId: string) => Set<number>
  getCompletionCount: (habitId: string) => number
  /** completion_rate = completed_days / totalDays  (build habits only) */
  getCompletionRate: (habitId: string, totalDays: number) => number
  getStreak: (habitId: string) => HabitStreakInfo
  /** Avg completion rate across BUILD habits only */
  getAverageCompletionRate: (totalDays: number) => number
  /** Build habit with highest completion_rate */
  getBestHabit: (totalDays: number) => Habit | null
  /** Build habit with lowest completion_rate */
  getWorstHabit: (totalDays: number) => Habit | null

  // ── Break-habit derived helpers ──────────────────────────────────────────────
  /** clean_rate = (pastDays - slips) / pastDays — ONLY for break habits */
  getBreakHabitCleanRate: (habitId: string) => number
  /** Break habit with highest clean_rate */
  getStrongestBreakHabit: () => Habit | null
  /** Break habit with lowest clean_rate (most slips) */
  getNeedsAttentionBreakHabit: () => Habit | null

  // ── Cross-type helpers ───────────────────────────────────────────────────────
  /**
   * A perfect day = ALL build habits completed + ZERO break habit slips.
   * Days where no build habits exist are never counted as perfect.
   */
  getPerfectDays: (totalDays: number) => Set<number>
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
      set({ completions: completions.filter(c => c.id !== existing.id) })
      const { error } = await supabase.from('habit_completions').delete().eq('id', existing.id)
      if (error) set({ completions: [...get().completions, existing] })
    } else {
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
        .insert({ user_id: user.id, habit_id: habitId, day, month: currentMonth, year: currentYear })
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

  // ── Build-habit Derived Helpers ─────────────────────────────────────────────

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

  /** Only considers BUILD habits */
  getAverageCompletionRate: (totalDays) => {
    const { habits } = get()
    const buildHabits = habits.filter(h => !isBadHabit(h))
    if (buildHabits.length === 0 || totalDays === 0) return 0
    const total = buildHabits.reduce((sum, h) => sum + get().getCompletionRate(h.id, totalDays), 0)
    return Math.round(total / buildHabits.length)
  },

  /** Build habit with the highest completion_rate */
  getBestHabit: (totalDays) => {
    const buildHabits = get().habits.filter(h => !isBadHabit(h))
    if (buildHabits.length === 0) return null
    return buildHabits.reduce((best, h) =>
      get().getCompletionRate(h.id, totalDays) > get().getCompletionRate(best.id, totalDays) ? h : best
    )
  },

  /** Build habit with the lowest completion_rate */
  getWorstHabit: (totalDays) => {
    const buildHabits = get().habits.filter(h => !isBadHabit(h))
    if (buildHabits.length === 0) return null
    return buildHabits.reduce((worst, h) =>
      get().getCompletionRate(h.id, totalDays) < get().getCompletionRate(worst.id, totalDays) ? h : worst
    )
  },

  // ── Break-habit Derived Helpers ─────────────────────────────────────────────

  /** clean_rate = (pastDays - slips) / pastDays — 100% if no past days yet */
  getBreakHabitCleanRate: (habitId) => {
    const { currentMonth, currentYear } = get()
    const todayDay = todayDayOf(currentMonth, currentYear)
    const pastDays = Math.max(0, todayDay - 1)
    if (pastDays === 0) return 100
    const slips = get().getCompletionCount(habitId)
    const cleanDays = Math.max(0, pastDays - slips)
    return Math.round((cleanDays / pastDays) * 100)
  },

  /** Break habit with the highest clean_rate */
  getStrongestBreakHabit: () => {
    const breakHabits = get().habits.filter(h => isBadHabit(h))
    if (breakHabits.length === 0) return null
    return breakHabits.reduce((best, h) =>
      get().getBreakHabitCleanRate(h.id) > get().getBreakHabitCleanRate(best.id) ? h : best
    )
  },

  /** Break habit with the lowest clean_rate (most problematic) */
  getNeedsAttentionBreakHabit: () => {
    const breakHabits = get().habits.filter(h => isBadHabit(h))
    if (breakHabits.length === 0) return null
    return breakHabits.reduce((worst, h) =>
      get().getBreakHabitCleanRate(h.id) < get().getBreakHabitCleanRate(worst.id) ? h : worst
    )
  },

  // ── Cross-type: Perfect Days ─────────────────────────────────────────────────

  getPerfectDays: (totalDays) => {
    const { habits, completions, currentMonth, currentYear } = get()
    const buildHabits = habits.filter(h => !isBadHabit(h))
    const breakHabits = habits.filter(h => isBadHabit(h))

    // Need at least one build habit to define a "perfect day"
    if (buildHabits.length === 0) return new Set()

    const perfect = new Set<number>()
    for (let d = 1; d <= totalDays; d++) {
      // All build habits completed on this day
      const allBuildDone = buildHabits.every(h =>
        completions.some(c => c.habit_id === h.id && c.day === d && c.month === currentMonth && c.year === currentYear)
      )
      // Zero break habit slips on this day
      const noBreakSlips = breakHabits.every(h =>
        !completions.some(c => c.habit_id === h.id && c.day === d && c.month === currentMonth && c.year === currentYear)
      )
      if (allBuildDone && noBreakSlips) perfect.add(d)
    }
    return perfect
  },
}))
