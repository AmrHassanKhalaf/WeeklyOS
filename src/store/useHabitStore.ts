// ─── useHabitStore ────────────────────────────────────────────────────────────
// Habit state and optimistic mutations.

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  getHabits,
  getCompletions,
  createHabit,
  updateHabit,
  deactivateHabit,
  reorderHabit,
  createCompletion,
  deleteCompletion,
} from '../services/habitRepository'
import { createAsyncSlice, type AsyncSlice } from './utils/createAsyncSlice'

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

interface HabitStore extends AsyncSlice {
  habits: Habit[]
  completions: HabitCompletion[]
  currentMonth: number
  currentYear: number
  viewMode: ViewMode
  /** Tracks in-flight mutation IDs per habit to avoid applying stale responses */
  _pendingMutations: Map<string, string>

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
  getCompletionRate: (habitId: string, totalDays: number) => number
  getStreak: (habitId: string) => HabitStreakInfo
  getAverageCompletionRate: (totalDays: number) => number
  getBestHabit: (totalDays: number) => Habit | null
  getWorstHabit: (totalDays: number) => Habit | null

  // ── Break-habit derived helpers ──────────────────────────────────────────────
  getBreakHabitCleanRate: (habitId: string) => number
  getStrongestBreakHabit: () => Habit | null
  getNeedsAttentionBreakHabit: () => Habit | null

  // ── Cross-type helpers ───────────────────────────────────────────────────────
  getPerfectDays: (totalDays: number) => Set<number>
}

// ─── Store ────────────────────────────────────────────────────────────────────

const now = new Date()
let habitVisibilityHandler: (() => void) | null = null

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  completions: [],
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  viewMode: 'monthly',
  _pendingMutations: new Map(),
  ...createAsyncSlice<HabitStore>(set),

  // ── Month Navigation ────────────────────────────────────────────────────────

  setMonth: (month, year) => {
    set({ currentMonth: month, currentYear: year })
  },

  goToPrevMonth: () => {
    const { currentMonth, currentYear } = get()
    const d = new Date(currentYear, currentMonth - 2, 1)
    set({ currentMonth: d.getMonth() + 1, currentYear: d.getFullYear() })
  },

  goToNextMonth: () => {
    const { currentMonth, currentYear } = get()
    const d = new Date(currentYear, currentMonth, 1)
    set({ currentMonth: d.getMonth() + 1, currentYear: d.getFullYear() })
  },

  // ── View ────────────────────────────────────────────────────────────────────

  setViewMode: (mode) => set({ viewMode: mode }),

  // ── Load Data ───────────────────────────────────────────────────────────────

  loadData: async () => {
    await get().withAsync(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const { currentMonth, currentYear } = get()

      const [habits, completions] = await Promise.all([
        getHabits(user.id, currentMonth, currentYear),
        getCompletions(user.id, currentMonth, currentYear),
      ])

      set({ habits, completions })
    })

    if (!habitVisibilityHandler) {
      habitVisibilityHandler = () => {
        if (document.visibilityState !== 'visible') return
        if (get().habits.length === 0 && !get().isLoading) {
          console.info('[useHabitStore] Tab restored — re-loading habit data')
          void get().loadData()
        }
      }
      document.addEventListener('visibilitychange', habitVisibilityHandler)
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

    const newHabit = await createHabit({
      ...data,
      user_id: user.id,
      sort_order,
      is_bad_habit,
      color: is_bad_habit ? '#f87171' : '#4ade80',
    })
    set({ habits: [...get().habits, newHabit] })
  },

  editHabit: async (id, updates) => {
    const is_bad_habit = updates.type !== undefined ? updates.type === 'break_habit' : undefined
    const payload = is_bad_habit !== undefined ? { ...updates, is_bad_habit } : updates

    // Track this mutation so stale responses cannot overwrite newer edits.
    const mutationId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    set((state) => {
      const m = new Map(state._pendingMutations)
      m.set(id, mutationId)
      return { _pendingMutations: m }
    })

    const updated = await updateHabit(id, payload)

    // Only apply if this is still the latest mutation for this habit
    const currentMutationId = get()._pendingMutations.get(id)
    if (currentMutationId !== mutationId) return

    set((state) => {
      const m = new Map(state._pendingMutations)
      m.delete(id)
      return {
        habits: state.habits.map((h) => (h.id === id ? updated : h)),
        _pendingMutations: m,
      }
    })
  },

  deleteHabit: async (id) => {
    set({ habits: get().habits.filter((h) => h.id !== id) })
    try {
      await deactivateHabit(id)
    } catch (err) {
      void get().loadData()
      throw err
    }
  },

  reorderHabit: async (id, newOrder) => {
    set({
      habits: get().habits.map((h) => (h.id === id ? { ...h, sort_order: newOrder } : h)),
    })
    await reorderHabit(id, newOrder)
  },

  // ── Completions ─────────────────────────────────────────────────────────────

  toggleDay: async (habitId, day) => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    const { completions, currentMonth, currentYear } = get()
    const existing = completions.find(
      (c) => c.habit_id === habitId && c.day === day && c.month === currentMonth && c.year === currentYear
    )

    if (existing) {
      // Optimistic removal
      set({ completions: completions.filter((c) => c.id !== existing.id) })
      try {
        await deleteCompletion(existing.id)
      } catch {
        set({ completions: [...get().completions, existing] })
      }
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

      try {
        const inserted = await createCompletion(user.id, habitId, day, currentMonth, currentYear)
        set({
          completions: get().completions.map((c) =>
            c.id === optimistic.id ? inserted : c
          ),
        })
      } catch {
        set({ completions: get().completions.filter((c) => c.id !== optimistic.id) })
      }
    }
  },

  // ── Build-habit Derived Helpers ─────────────────────────────────────────────

  getCompletedDays: (habitId) => {
    const { completions, currentMonth, currentYear } = get()
    return new Set(
      completions
        .filter((c) => c.habit_id === habitId && c.month === currentMonth && c.year === currentYear)
        .map((c) => c.day)
    )
  },

  getCompletionCount: (habitId) => {
    const { completions, currentMonth, currentYear } = get()
    return completions.filter(
      (c) => c.habit_id === habitId && c.month === currentMonth && c.year === currentYear
    ).length
  },

  getCompletionRate: (habitId, totalDays) => {
    if (totalDays === 0) return 0
    return Math.round((get().getCompletionCount(habitId) / totalDays) * 100)
  },

  getStreak: (habitId) => {
    const { habits, completions, currentMonth, currentYear } = get()
    const habit = habits.find((h) => h.id === habitId)
    if (!habit) return { current: 0, longest: 0 }
    const today = new Date().getDate()
    return computeStreaks(completions, habit, currentMonth, currentYear, today)
  },

  getAverageCompletionRate: (totalDays) => {
    const { habits } = get()
    const buildHabits = habits.filter((h) => !isBadHabit(h))
    if (buildHabits.length === 0 || totalDays === 0) return 0
    const total = buildHabits.reduce((sum, h) => sum + get().getCompletionRate(h.id, totalDays), 0)
    return Math.round(total / buildHabits.length)
  },

  getBestHabit: (totalDays) => {
    const buildHabits = get().habits.filter((h) => !isBadHabit(h))
    if (buildHabits.length === 0) return null
    return buildHabits.reduce((best, h) =>
      get().getCompletionRate(h.id, totalDays) > get().getCompletionRate(best.id, totalDays) ? h : best
    )
  },

  getWorstHabit: (totalDays) => {
    const buildHabits = get().habits.filter((h) => !isBadHabit(h))
    if (buildHabits.length === 0) return null
    return buildHabits.reduce((worst, h) =>
      get().getCompletionRate(h.id, totalDays) < get().getCompletionRate(worst.id, totalDays) ? h : worst
    )
  },

  // ── Break-habit Derived Helpers ─────────────────────────────────────────────

  getBreakHabitCleanRate: (habitId) => {
    const { currentMonth, currentYear } = get()
    const todayDay = todayDayOf(currentMonth, currentYear)
    const pastDays = Math.max(0, todayDay - 1)
    if (pastDays === 0) return 100
    const slips = get().getCompletionCount(habitId)
    const cleanDays = Math.max(0, pastDays - slips)
    return Math.round((cleanDays / pastDays) * 100)
  },

  getStrongestBreakHabit: () => {
    const breakHabits = get().habits.filter((h) => isBadHabit(h))
    if (breakHabits.length === 0) return null
    return breakHabits.reduce((best, h) =>
      get().getBreakHabitCleanRate(h.id) > get().getBreakHabitCleanRate(best.id) ? h : best
    )
  },

  getNeedsAttentionBreakHabit: () => {
    const breakHabits = get().habits.filter((h) => isBadHabit(h))
    if (breakHabits.length === 0) return null
    return breakHabits.reduce((worst, h) =>
      get().getBreakHabitCleanRate(h.id) < get().getBreakHabitCleanRate(worst.id) ? h : worst
    )
  },

  // ── Cross-type: Perfect Days ─────────────────────────────────────────────────

  getPerfectDays: (totalDays) => {
    const { habits, completions, currentMonth, currentYear } = get()
    const buildHabits = habits.filter((h) => !isBadHabit(h))
    const breakHabits = habits.filter((h) => isBadHabit(h))

    if (buildHabits.length === 0) return new Set()

    const perfect = new Set<number>()
    for (let d = 1; d <= totalDays; d++) {
      const allBuildDone = buildHabits.every((h) =>
        completions.some(
          (c) => c.habit_id === h.id && c.day === d && c.month === currentMonth && c.year === currentYear
        )
      )
      const noBreakSlips = breakHabits.every(
        (h) =>
          !completions.some(
            (c) => c.habit_id === h.id && c.day === d && c.month === currentMonth && c.year === currentYear
          )
      )
      if (allBuildDone && noBreakSlips) perfect.add(d)
    }
    return perfect
  },
}))
