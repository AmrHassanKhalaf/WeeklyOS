import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Json } from '../lib/database.types'
import { useSettingsStore } from './useSettingsStore'
import type { WeekStartDay } from './useSettingsStore'
import { formatDaySerial, getAdjacentWeek, getWeekInfoForDate, getWeekStartDaySerial, getWeeksInYear } from './weekDateUtils'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'done'
export type ChallengeDayStatus = 'pending' | 'success' | 'fail'
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  status: TaskStatus
  day?: DayOfWeek
  weekId?: string
  startTime?: string
  estimatedTime?: string
  tags?: string[]
  pinnedTaskId?: string
}

export interface WeekKey {
  weekNumber: number
  year: number
}

export interface ChallengeDay {
  dayOfWeek: DayOfWeek
  date: string
  status: ChallengeDayStatus
}

export interface BrainDumpItem {
  id: string
  title: string
  selected?: boolean
  tags?: string[]
}

export interface DayPlan {
  day: DayOfWeek
  date: string
  shortName: string
  isToday?: boolean
  isRestDay?: boolean
  progress: number
  highTask?: Task
  mediumTasks: Task[]
  smallTasks: Task[]
  dailyNote?: string
}

export interface ActivityItem {
  id: string
  text: string
  time: number
  done: boolean
}

export interface WeekData {
  id: string
  weekNumber: number
  year: number
  title: string
  dateRange: string
  score: number
  totalCompleted: number
  totalPlanned: number
  days: DayPlan[]
  challengeTitle?: string
  challengeDescription?: string
  challengeProgress?: number
  challengeEndsIn?: string
  challengeDays?: ChallengeDay[]
  evalWentWell?: string
  evalStruggle?: string
  evalLessons?: string
  activities?: ActivityItem[]
  dailyNotes?: Record<string, string>
  challengeCompleted?: boolean
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface WeekStore {
  currentWeek: WeekData | null
  selectedWeek: WeekKey | null
  currentWeekKey: WeekKey | null
  canGoPreviousWeek: boolean
  canGoNextWeek: boolean
  isLoadingWeek: boolean
  weekError: string | null
  isSyncing: boolean

  pomodoroTime: number
  isPomodoroRunning: boolean

  // Init
  initialize: () => Promise<void>
  goToPreviousWeek: () => Promise<void>
  goToNextWeek: () => Promise<void>
  goToCurrentWeek: () => Promise<void>
  goToWeek: (weekNumber: number, year: number) => Promise<void>
  getPreviousWeekForReport: () => Promise<WeekData | null>
  cleanup: () => void

  // Tasks CRUD
  toggleTaskComplete: (taskId: string) => Promise<void>
  createTask: (task: { title: string; priority: Priority; day?: DayOfWeek; description?: string; startTime?: string; estimatedTime?: string; tags?: string[] }) => Promise<void>
  updateTask: (taskId: string, updates: Partial<{ title: string; priority: Priority; day: DayOfWeek | null; status: TaskStatus; description: string; estimatedTime: string; startTime: string; tags: string[] }>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  markDayComplete: (day: DayOfWeek) => Promise<void>
  deleteDayData: (day: DayOfWeek) => Promise<void>
  deleteWeekData: () => Promise<void>
  updateDailyNote: (day: DayOfWeek, note: string) => Promise<void>
  toggleChallengeComplete: () => Promise<void>

  // Pomodoro (local only)
  startPomodoro: () => void
  stopPomodoro: () => void
  tickPomodoro: () => void
  setFocusedDay: (_index: number) => void

  // Reset
  startNewPlan: () => Promise<void>

  // Challenge & Evaluation
  updateChallenge: (title: string, desc?: string) => Promise<void>
  updateChallengeProgress: (progress: number) => Promise<void>
  toggleChallengeDayStatus: (dayOfWeek: DayOfWeek) => Promise<void>
  autoFailPendingDays: () => Promise<void>
  updateEvaluation: (type: 'wentWell' | 'struggle' | 'lessons', text: string) => Promise<void>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
]
const DAY_SHORT: Record<DayOfWeek, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
}

function getOrderedDays(weekStartDay: WeekStartDay): DayOfWeek[] {
  const startIdx = DAYS.indexOf(weekStartDay as DayOfWeek)
  if (startIdx < 0) return [...DAYS]
  return [...DAYS.slice(startIdx), ...DAYS.slice(0, startIdx)]
}

function getWeekSettings(): { timeZone: string; weekStartDay: WeekStartDay } {
  const { timezone, weekStartDay } = useSettingsStore.getState()
  return {
    timeZone: timezone || 'Africa/Cairo',
    weekStartDay: (weekStartDay || 'saturday') as WeekStartDay,
  }
}

function getCurrentWeekInfo(): { weekNumber: number; year: number } {
  const { timeZone, weekStartDay } = getWeekSettings()
  const info = getWeekInfoForDate(new Date(), timeZone, weekStartDay)
  return { weekNumber: info.weekNumber, year: info.year }
}

function getWeekBounds(weekNumber: number, year: number, weekStartDay: WeekStartDay): { startSerial: number; endSerial: number } {
  const startSerial = getWeekStartDaySerial(year, weekNumber, weekStartDay)
  return { startSerial, endSerial: startSerial + 6 }
}

function daySerialToIso(daySerial: number): string {
  return new Date(daySerial * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function mapDbTask(t: Record<string, unknown>): Task {
  return {
    id: String(t.id),
    title: String(t.title),
    description: t.description ? String(t.description) : undefined,
    priority: (t.priority as Priority) ?? 'low',
    status: (t.status as TaskStatus) ?? 'pending',
    day: (t.day as DayOfWeek | null) ?? undefined,
    weekId: t.week_id ? String(t.week_id) : undefined,
    startTime: t.start_time ? String(t.start_time) : undefined,
    estimatedTime: t.estimated_duration ? String(t.estimated_duration) : undefined,
    tags: (t.tags as string[] | null) ?? undefined,
    pinnedTaskId: t.pinned_task_id ? String(t.pinned_task_id) : undefined,
  }
}

function processTasksForDay(dayPlan: DayPlan, allTasks: Task[]): DayPlan {
  const dayTasks = allTasks.filter(t => t.day === dayPlan.day)
  const highTask = dayTasks.find(t => t.priority === 'high')
  const mediumTasks = dayTasks.filter(t => t.priority === 'medium')
  const smallTasks = dayTasks.filter(t => t.priority === 'low')

  const done = dayTasks.filter(t => t.status === 'done').length
  const total = dayTasks.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return {
    ...dayPlan,
    progress,
    highTask: highTask,
    mediumTasks: mediumTasks,
    smallTasks: smallTasks,
  }
}

function buildWeekData(dbWeek: Record<string, unknown>, tasks: Record<string, unknown>[]): WeekData {
  const weekNumber = dbWeek.week_number as number
  const year = dbWeek.year as number
  const { timeZone, weekStartDay } = getWeekSettings()
  const orderedDays = getOrderedDays(weekStartDay)
  const weekStartDaySerial = getWeekStartDaySerial(year, weekNumber, weekStartDay)

  const nowWeekInfo = getWeekInfoForDate(new Date(), timeZone, weekStartDay)
  const todayIdx = nowWeekInfo.todayIndex

  // Is the loaded week the current one?
  const isCurrentWeek = weekNumber === nowWeekInfo.weekNumber && year === nowWeekInfo.year

  const mappedTasks = tasks.map(mapDbTask)

    const dayPlans: DayPlan[] = orderedDays.map((day, idx) => {
    const dateStr = formatDaySerial(weekStartDaySerial + idx, timeZone)
    const dailyNotes = (dbWeek.daily_notes as Record<string, string>) || {}

    const baseDayPlan = {
      day,
      date: dateStr,
      shortName: DAY_SHORT[day],
      isToday: isCurrentWeek && idx === todayIdx,
      isRestDay: false,
      progress: 0, 
      highTask: undefined,
      mediumTasks: [],
      smallTasks: [],
      dailyNote: dailyNotes[day] || '',
    }
    return processTasksForDay(baseDayPlan, mappedTasks)
  })

  const allScheduled = mappedTasks.filter(t => t.day !== undefined)
  const totalCompleted = allScheduled.filter(t => t.status === 'done').length
  const totalPlanned = allScheduled.length
  const score = (dbWeek.score as number | null) ??
    (totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0)

  let activities: ActivityItem[] = []
  try {
    activities = dbWeek.activities ? (typeof dbWeek.activities === 'string' ? JSON.parse(dbWeek.activities) : dbWeek.activities) : []
  } catch (e) {
    console.error("Failed to parse activities:", e)
  }

  // Initialize challengeDays from DB or create default pending days (Fri -> Thu)
  let challengeDays: ChallengeDay[] = []
  const challengeOrder: DayOfWeek[] = ['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  const defaultChallengeDays = challengeOrder.map((day) => ({
    dayOfWeek: day,
    date: dayPlans.find((dp) => dp.day === day)?.date || '',
    status: 'pending' as ChallengeDayStatus,
  }))
  try {
    if (dbWeek.challenge_days) {
      const parsedDays = typeof dbWeek.challenge_days === 'string'
        ? JSON.parse(dbWeek.challenge_days)
        : (dbWeek.challenge_days as ChallengeDay[])

      challengeDays = challengeOrder.map((day) => {
        const existing = parsedDays.find((cd: ChallengeDay) => cd.dayOfWeek === day)
        return {
          dayOfWeek: day,
          date: existing?.date || dayPlans.find((dp) => dp.day === day)?.date || '',
          status: existing?.status || 'pending',
        }
      })
    } else {
      challengeDays = defaultChallengeDays
    }
  } catch (e) {
    console.error("Failed to parse challenge_days:", e)
    challengeDays = defaultChallengeDays
  }

  return {
    id: dbWeek.id as string,
    weekNumber,
    year,
    title: (dbWeek.title as string) ?? 'The Digital Obsidian',
    dateRange: `${dayPlans[0].date} — ${dayPlans[6].date}`,
    score,
    totalCompleted,
    totalPlanned,
    days: dayPlans,
    challengeTitle: (dbWeek.challenge_title as string | null) ?? undefined,
    challengeDescription: (dbWeek.challenge_description as string | null) ?? undefined,
    challengeProgress: (dbWeek.challenge_progress as number | null) ?? undefined,
    challengeEndsIn: (dbWeek.challenge_ends_in as string | null) ?? undefined,
    challengeDays,
    evalWentWell: (dbWeek.eval_went_well as string | null) ?? undefined,
    evalStruggle: (dbWeek.eval_struggle as string | null) ?? undefined,
    evalLessons: (dbWeek.eval_lessons as string | null) ?? undefined,
    activities,
    dailyNotes: (dbWeek.daily_notes as Record<string, string>) || {},
    challengeCompleted: !!dbWeek.challenge_completed,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

let _realtimeChannel: RealtimeChannel | null = null
let _pinnedFeatureAvailable: boolean | null = null

export const useWeekStore = create<WeekStore>((set, get) => {
  const syncToDb = async () => {
    const { currentWeek } = get()
    if (!currentWeek) return

    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    const { error } = await supabase
      .from('weeks')
      .update({
        activities: JSON.stringify(currentWeek.activities),
      })
      .eq('id', currentWeek.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to sync activities to DB:', error)
    }
    set({ isSyncing: false })
  }

  const updateNavigationState = (selectedWeek: WeekKey, currentWeekKey: WeekKey) => {
    const { weekStartDay } = getWeekSettings()
    const maxWeeks = getWeeksInYear(selectedWeek.year, weekStartDay)
    set({
      selectedWeek,
      currentWeekKey,
      canGoPreviousWeek: selectedWeek.weekNumber > 1,
      canGoNextWeek: selectedWeek.year < currentWeekKey.year || (selectedWeek.year === currentWeekKey.year && selectedWeek.weekNumber < maxWeeks),
    })
  }

  const materializePinnedTasksForWeek = async (userId: string, week: Record<string, unknown>) => {
    if (_pinnedFeatureAvailable === false) return

    const { weekStartDay } = getWeekSettings()
    const weekNumber = week.week_number as number
    const year = week.year as number
    const bounds = getWeekBounds(weekNumber, year, weekStartDay)
    const weekEndIso = daySerialToIso(bounds.endSerial)

    const { data: pinnedTasks, error: pinnedErr } = await supabase
      .from('pinned_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`until_date.is.null,until_date.gte.${weekEndIso}`)

    if (pinnedErr) {
      // Migration may not be applied yet in some environments; avoid retry spam and hard failures.
      if ((pinnedErr as { code?: string }).code === 'PGRST205' || (pinnedErr as { code?: string }).code === '42P01') {
        _pinnedFeatureAvailable = false
      }
      return
    }

    _pinnedFeatureAvailable = true

    if (!pinnedTasks || pinnedTasks.length === 0) return

    const weekId = String(week.id)

    const rows = pinnedTasks.map((item) => ({
      user_id: userId,
      week_id: weekId,
      title: item.title,
      description: item.description,
      priority: item.priority,
      day: item.day_of_week,
      start_time: item.start_time,
      estimated_duration: item.end_time ? `${item.start_time || ''}-${item.end_time}` : null,
      tags: item.tags,
      status: 'pending',
      type: 'pinned',
      pinned_task_id: item.id,
    }))

    const { error: upsertErr } = await supabase.from('tasks').upsert(rows, {
      onConflict: 'week_id,pinned_task_id',
      ignoreDuplicates: true,
    })

    if (upsertErr) {
      // If schema is still old, stop trying to materialize until migration is present.
      if ((upsertErr as { code?: string }).code === 'PGRST204' || (upsertErr as { code?: string }).code === '42703') {
        _pinnedFeatureAvailable = false
      }
    }
  }

  const loadWeekByKey = async (weekNumber: number, year: number, options?: { createIfMissing?: boolean }): Promise<WeekData | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return null

    let { data: week, error: weekErr } = await supabase
      .from('weeks')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .maybeSingle()

    if (weekErr) throw weekErr

    if (!week && options?.createIfMissing) {
      const { data: newWeek, error: createErr } = await supabase
        .from('weeks')
        .insert({ user_id: user.id, week_number: weekNumber, year })
        .select()
        .single()
      if (createErr) throw createErr
      week = newWeek
    }

    if (!week) return null

    await materializePinnedTasksForWeek(user.id, week as Record<string, unknown>)

    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_id', week.id)

    if (tasksErr) throw tasksErr
    return buildWeekData(week as Record<string, unknown>, (tasks ?? []) as Record<string, unknown>[])
  }

  return {
    currentWeek: null,
    selectedWeek: null,
    currentWeekKey: null,
    canGoPreviousWeek: false,
    canGoNextWeek: false,
    isLoadingWeek: true,
    weekError: null,
    isSyncing: false,
    pomodoroTime: 25 * 60,
    isPomodoroRunning: false,

    // ── Initialize ─────────────────────────────────────────────────────────────

    initialize: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      set({ isLoadingWeek: true, weekError: null })

      try {
        const currentKey = getCurrentWeekInfo()
        const selected = get().selectedWeek || currentKey
        const loaded = await loadWeekByKey(selected.weekNumber, selected.year, { createIfMissing: true })

        if (!loaded) throw new Error('Failed to load selected week')

        set({
          currentWeek: loaded,
          isLoadingWeek: false,
        })

        updateNavigationState({ weekNumber: loaded.weekNumber, year: loaded.year }, currentKey)

        // 3. Real-time subscription for tasks (DISABLED - causing WebSocket connection issues)
        // TODO: Re-enable when network connectivity is stable
        /*
        try {
          if (_realtimeChannel) {
            await supabase.removeChannel(_realtimeChannel)
          }

          _realtimeChannel = supabase
            .channel(`tasks-week-${week.id}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'tasks', filter: `week_id=eq.${week.id}` },
              async () => {
                try {
                  // Re-fetch tasks on any change
                  const { data: refreshedTasks } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('week_id', week!.id)

                  const { data: refreshedWeek } = await supabase
                    .from('weeks')
                    .select('*')
                    .eq('id', week!.id)
                    .single()

                  if (refreshedTasks && refreshedWeek) {
                    set(_state => ({
                      currentWeek: buildWeekData(refreshedWeek as Record<string, unknown>, refreshedTasks as Record<string, unknown>[]),
                    }))
                  }
                } catch (realtimeErr) {
                  console.warn('Realtime update failed:', realtimeErr)
                  // Don't throw - realtime failures shouldn't break the app
                }
              },
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                console.log('Realtime subscription active')
              } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                console.warn('Realtime subscription failed:', status)
              }
            })
        } catch (realtimeSetupErr) {
          console.warn('Failed to setup realtime subscription:', realtimeSetupErr)
          // Continue without realtime - app still works
        }
        */
      } catch (err) {
        set({ weekError: (err as Error).message, isLoadingWeek: false })
      }

      // 4. Brain dump (MIGRATED to useBrainDumpStore)
    },

    goToWeek: async (weekNumber, year) => {
      set({ isLoadingWeek: true, weekError: null })
      try {
        const loaded = await loadWeekByKey(weekNumber, year, { createIfMissing: true })
        const currentKey = getCurrentWeekInfo()
        if (!loaded) {
          set({ isLoadingWeek: false })
          return
        }
        set({
          currentWeek: loaded,
          isLoadingWeek: false,
        })
        updateNavigationState({ weekNumber: loaded.weekNumber, year: loaded.year }, currentKey)
      } catch (err) {
        set({ weekError: (err as Error).message, isLoadingWeek: false })
      }
    },

    goToCurrentWeek: async () => {
      const current = getCurrentWeekInfo()
      await get().goToWeek(current.weekNumber, current.year)
    },

    goToPreviousWeek: async () => {
      const selected = get().selectedWeek || getCurrentWeekInfo()
      if (selected.weekNumber <= 1) return
      const { weekStartDay } = getWeekSettings()
      const prev = getAdjacentWeek(selected.weekNumber, selected.year, -1, weekStartDay)
      if (prev.year !== selected.year) return
      await get().goToWeek(prev.weekNumber, prev.year)
    },

    goToNextWeek: async () => {
      const selected = get().selectedWeek || getCurrentWeekInfo()
      const current = getCurrentWeekInfo()
      const { weekStartDay } = getWeekSettings()
      const maxWeeks = getWeeksInYear(selected.year, weekStartDay)
      if (selected.year > current.year || selected.weekNumber >= maxWeeks) return
      const next = getAdjacentWeek(selected.weekNumber, selected.year, 1, weekStartDay)
      if (next.year !== selected.year) return
      await get().goToWeek(next.weekNumber, next.year)
    },

    getPreviousWeekForReport: async () => {
      const selected = get().selectedWeek || getCurrentWeekInfo()
      if (selected.weekNumber <= 1) return null
      const { weekStartDay } = getWeekSettings()
      const prev = getAdjacentWeek(selected.weekNumber, selected.year, -1, weekStartDay)
      if (prev.year !== selected.year) return null
      return await loadWeekByKey(prev.weekNumber, prev.year)
    },

    cleanup: () => {
      if (_realtimeChannel) {
        try {
          supabase.removeChannel(_realtimeChannel)
        } catch (err) {
          console.warn('Error cleaning up realtime channel:', err)
        }
        _realtimeChannel = null
      }
    },

    startNewPlan: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      set({ isLoadingWeek: true })
      try {
        const state = get()
        if (state.currentWeek) {
          // Wipe all tasks for the current week
          await supabase.from('tasks').delete().eq('week_id', state.currentWeek.id)
          // Wipe brain dump
          await supabase.from('brain_dump').delete().eq('user_id', user.id)
        }

        // Re-initialize to fetch clean state
        await get().initialize()
      } catch (e) {
        console.error('Failed to reset plan:', e)
      } finally {
        set({ isLoadingWeek: false })
      }
    },

    // ─── Task CRUD ────────────────────────────────────────────────────────────

    toggleTaskComplete: async (taskId: string) => {
      const { currentWeek } = get()
      if (!currentWeek) return
      const snapshot = get().currentWeek // rollback snapshot
      let foundTask: Task | null = null
      const nextDays = currentWeek.days.map(d => {
        const high = d.highTask?.id === taskId ? { ...d.highTask, status: d.highTask.status === 'done' ? 'pending' : 'done' } as Task : d.highTask
        if (high && high.id === taskId) foundTask = high
        const med = d.mediumTasks.map(t => {
          if (t.id === taskId) {
            const target = { ...t, status: t.status === 'done' ? 'pending' : 'done' } as Task
            foundTask = target
            return target
          }
          return t
        })
        const sm = d.smallTasks.map(t => {
          if (t.id === taskId) {
            const target = { ...t, status: t.status === 'done' ? 'pending' : 'done' } as Task
            foundTask = target
            return target
          }
          return t
        })
        return { ...d, highTask: high, mediumTasks: med, smallTasks: sm }
      })

      let activities = currentWeek.activities || []
      if (foundTask) {
        activities = [{
          id: Date.now().toString(),
          text: `"${(foundTask as Task).title}" marked ${(foundTask as Task).status === 'done' ? 'done' : 'pending'}`,
          time: Date.now(),
          done: (foundTask as Task).status === 'done'
        }, ...activities].slice(0, 50)
      }

      set({ currentWeek: { ...currentWeek, days: nextDays, activities }, isSyncing: true })
      await syncToDb()

      // Find existing status for the actual DB update
      let currentStatus: TaskStatus = 'pending'
      for (const d of currentWeek.days) {
        const all = [d.highTask, ...d.mediumTasks, ...d.smallTasks].filter(Boolean)
        const found = all.find(t => t?.id === taskId)
        if (found) { currentStatus = found.status; break }
      }

      const newStatus: TaskStatus = currentStatus === 'done' ? 'pending' : 'done'
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
      if (error) {
        console.error('[toggleTaskComplete] DB write failed, reverting:', error)
        set({ currentWeek: snapshot })
      }
    },

    createTask: async (task) => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const currentWeek = get().currentWeek
      if (!currentWeek) return
      
      const day = task.day || 'monday'
      const tasksForDay = currentWeek.days.find(d => d.day === day)
      
      if (task.priority === 'high' && tasksForDay?.highTask) {
        throw new Error('Limit reached: Only 1 High priority task allowed per day.')
      }
      if (task.priority === 'medium' && (tasksForDay?.mediumTasks?.length || 0) >= 3) {
        throw new Error('Limit reached: Only 3 Medium priority tasks allowed per day.')
      }
      if (task.priority === 'low' && (tasksForDay?.smallTasks?.length || 0) >= 5) {
        throw new Error('Limit reached: Only 5 Small priority tasks allowed per day.')
      }

      // Optimistic update
      const newTask: Task = {
        id: `temp-${Date.now()}`,
        title: task.title,
        priority: task.priority,
        status: 'pending',
        day: task.day,
        description: task.description,
        startTime: task.startTime,
        estimatedTime: task.estimatedTime,
        tags: task.tags,
        weekId: currentWeek.id,
      }

      const allTasks = currentWeek.days.flatMap(d => [d.highTask, ...d.mediumTasks, ...d.smallTasks].filter(Boolean) as Task[])
      const updatedTasks = [...allTasks, newTask]
      const nextDays = currentWeek.days.map(d => processTasksForDay(d, updatedTasks))
      
      const activities = [{
        id: Date.now().toString() + '_add',
        text: `Added new task: "${task.title}"`,
        time: Date.now(),
        done: false
      }, ...(currentWeek.activities || [])].slice(0, 50)

      const snapshot = get().currentWeek // rollback snapshot
      set({ currentWeek: { ...currentWeek, days: nextDays, activities }, isSyncing: true })
      await syncToDb()

      const { data: dbTask, error } = await supabase.from('tasks').insert({
        user_id: user.id,
        week_id: currentWeek.id,
        title: task.title,
        priority: task.priority,
        day: task.day ?? null,
        description: task.description ?? null,
        status: 'pending',
        start_time: task.startTime ?? null,
        estimated_duration: task.estimatedTime ?? null,
        tags: task.tags ?? null,
      }).select().single()

      if (error) {
        console.error('[createTask] DB write failed, reverting:', error)
        set({ currentWeek: snapshot })
        throw new Error(error.message || 'Failed to create task')
      } else if (dbTask) {
        // Update the temp ID with the real ID from DB
        set(state => {
          if (!state.currentWeek) return state
          const realTask = mapDbTask(dbTask)
          const allTasksForUpdate = state.currentWeek.days.flatMap(d => 
            [d.highTask, ...d.mediumTasks, ...d.smallTasks].filter(Boolean) as Task[]
          ).map(t => t.id === newTask.id ? realTask : t)
          
          return {
            currentWeek: {
              ...state.currentWeek,
              days: state.currentWeek.days.map(d => processTasksForDay(
                { ...d, highTask: undefined, mediumTasks: [], smallTasks: [] },
                allTasksForUpdate
              ))
            }
          }
        })
      }
    },

    updateTask: async (taskId, updates) => {
      // Build payload safely to avoid pushing undefined fake columns to Supabase
      const payload: Record<string, unknown> = {}
      if ('title' in updates) payload.title = updates.title
      if ('description' in updates) payload.description = updates.description === undefined ? null : updates.description
      if ('day' in updates) payload.day = updates.day === undefined ? null : updates.day
      if ('priority' in updates) payload.priority = updates.priority
      if ('status' in updates) payload.status = updates.status
      if ('startTime' in updates) payload.start_time = updates.startTime === undefined ? null : updates.startTime
      if ('estimatedTime' in updates) payload.estimated_duration = updates.estimatedTime === undefined ? null : updates.estimatedTime
      if ('tags' in updates) payload.tags = updates.tags === undefined ? null : updates.tags

      // Optimistic update with rollback
      const snapshot = get().currentWeek
      const localUpdates = { ...updates }
      if (localUpdates.day === null) localUpdates.day = undefined

      set(state => {
        if (!state.currentWeek) return state
        const allTasks = state.currentWeek.days.flatMap(d => 
          [d.highTask, ...d.mediumTasks, ...d.smallTasks].filter(Boolean) as Task[]
        )
        const updatedTasks = allTasks.map(t => t.id === taskId ? { ...t, ...localUpdates } as Task : t)

        return {
          currentWeek: {
            ...state.currentWeek,
            days: state.currentWeek.days.map(d => processTasksForDay(
              { ...d, highTask: undefined, mediumTasks: [], smallTasks: [] },
              updatedTasks
            ))
          }
        }
      })

      console.log('[updateTask] Sending payload to Supabase:', JSON.stringify(payload))
      const { data, error } = await supabase.from('tasks').update(payload).eq('id', taskId).select()
      console.log('[updateTask] Supabase response → data:', data, '| error:', error)
      if (error) {
        console.error('[updateTask] DB write failed, reverting. Code:', error.code, '| Message:', error.message, '| Details:', error.details)
        set({ currentWeek: snapshot })
      }
    },

    deleteTask: async (taskId) => {
      const snapshot = get().currentWeek // rollback snapshot
      // Optimistic: remove from local state first
      set(state => ({
        currentWeek: state.currentWeek ? {
          ...state.currentWeek,
          days: state.currentWeek.days.map(d => ({
            ...d,
            highTask: d.highTask?.id === taskId ? undefined : d.highTask,
            mediumTasks: d.mediumTasks.filter(t => t.id !== taskId),
            smallTasks: d.smallTasks.filter(t => t.id !== taskId),
          })),
        } : null,
      }))

      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      if (error) {
        console.error('[deleteTask] DB write failed, reverting:', error)
        set({ currentWeek: snapshot })
      }
    },

    markDayComplete: async (day) => {
      const week = get().currentWeek
      if (!week) return
      const dayPlan = week.days.find(d => d.day === day)
      if (!dayPlan) return

      const pendingTasks = [
        dayPlan.highTask,
        ...dayPlan.mediumTasks,
        ...dayPlan.smallTasks,
      ].filter(t => t && t.status === 'pending').map(t => t!.id)

      if (pendingTasks.length > 0) {
        await supabase.from('tasks').update({ status: 'done' }).in('id', pendingTasks)
      }

      // Optimistic update
      set(state => ({
        currentWeek: state.currentWeek ? {
          ...state.currentWeek,
          days: state.currentWeek.days.map(d =>
            d.day === day ? {
              ...d,
              progress: 100,
              highTask: d.highTask ? { ...d.highTask, status: 'done' } : undefined,
              mediumTasks: d.mediumTasks.map(t => ({ ...t, status: 'done' })),
              smallTasks: d.smallTasks.map(t => ({ ...t, status: 'done' })),
            } : d
          ),
        } : null,
      }))
    },

    deleteDayData: async (day) => {
      const week = get().currentWeek
      if (!week) return
      
      const { error } = await supabase.from('tasks').delete().eq('week_id', week.id).eq('day', day)
      if (error) console.error('[deleteDayData]', error)
      
      set(state => ({
        currentWeek: state.currentWeek ? {
          ...state.currentWeek,
          days: state.currentWeek.days.map(d =>
            d.day === day ? {
              ...d,
              progress: 0,
              highTask: undefined,
              mediumTasks: [],
              smallTasks: [],
            } : d
          ),
        } : null,
      }))
    },

    deleteWeekData: async () => {
      const week = get().currentWeek
      if (!week) return
      
      const { error } = await supabase.from('tasks').delete().eq('week_id', week.id)
      if (error) console.error('[deleteWeekData]', error)
      
      await supabase.from('weeks').update({ score: 0, activities: '[]', daily_notes: '{}', challenge_completed: false }).eq('id', week.id)
      
      set(state => ({
        currentWeek: state.currentWeek ? {
          ...state.currentWeek,
          score: 0,
          activities: [],
          dailyNotes: {},
          challengeCompleted: false,
          days: state.currentWeek.days.map(d => ({
            ...d,
            progress: 0,
            highTask: undefined,
            mediumTasks: [],
            smallTasks: [],
            dailyNote: '',
          })),
        } : null,
      }))
    },

    updateDailyNote: async (day, note) => {
      const week = get().currentWeek
      if (!week) return
      
      const nextNotes = { ...(week.dailyNotes || {}), [day]: note }
      
      set(state => ({
        currentWeek: state.currentWeek ? {
          ...state.currentWeek,
          dailyNotes: nextNotes,
          days: state.currentWeek.days.map(d => d.day === day ? { ...d, dailyNote: note } : d)
        } : null
      }))
      
      const { error } = await supabase.from('weeks').update({ daily_notes: nextNotes }).eq('id', week.id)
      if (error) console.error('[updateDailyNote]', error)
    },

    toggleChallengeComplete: async () => {
      const week = get().currentWeek
      if (!week) return
      
      const newValue = !week.challengeCompleted
      
      set(state => ({
        currentWeek: state.currentWeek ? { ...state.currentWeek, challengeCompleted: newValue } : null
      }))
      
      const { error } = await supabase.from('weeks').update({ challenge_completed: newValue }).eq('id', week.id)
      if (error) console.error('[toggleChallengeComplete]', error)
    },

    // ── Challenge & Evaluation ──────────────────────────────────────────────────

    updateChallenge: async (title: string, desc?: string) => {
      const { currentWeek } = get()
      if (!currentWeek) return
      
      set(state => ({
        currentWeek: state.currentWeek ? { 
          ...state.currentWeek, 
          challengeTitle: title, 
          challengeDescription: desc,
          challengeProgress: state.currentWeek.challengeProgress || 0, 
          challengeEndsIn: state.currentWeek.challengeEndsIn || '3 Days' 
        } : null
      }))

      const { error } = await supabase.from('weeks').update({
        challenge_title: title,
        challenge_description: desc || null,
        challenge_progress: currentWeek.challengeProgress || 0,
        challenge_ends_in: currentWeek.challengeEndsIn || '3 Days'
      }).eq('id', currentWeek.id)

      if (error) console.error('updateChallenge error', error)
    },
    updateChallengeProgress: async (progress: number) => {
      const { currentWeek } = get()
      if (!currentWeek) return
      
      const newProgress = Math.min(100, Math.max(0, progress))

      set(state => ({
        currentWeek: state.currentWeek ? { ...state.currentWeek, challengeProgress: newProgress } : null
      }))

      const { error } = await supabase.from('weeks').update({
        challenge_progress: newProgress
      }).eq('id', currentWeek.id)

      if (error) console.error('updateChallengeProgress error', error)
    },

    toggleChallengeDayStatus: async (dayOfWeek: DayOfWeek) => {
      const { currentWeek } = get()
      if (!currentWeek || !currentWeek.challengeDays) return

      // Cycle through: pending → success → fail → pending
      const nextDays = currentWeek.challengeDays.map(cd => {
        if (cd.dayOfWeek === dayOfWeek) {
          const nextStatus: ChallengeDayStatus = 
            cd.status === 'pending' ? 'success' : 
            cd.status === 'success' ? 'fail' : 
            'pending'
          return { ...cd, status: nextStatus }
        }
        return cd
      })

      set(state => ({
        currentWeek: state.currentWeek ? { ...state.currentWeek, challengeDays: nextDays } : null
      }))

      const { error } = await supabase.from('weeks').update({
        challenge_days: nextDays as unknown as Json
      }).eq('id', currentWeek.id)

      if (error) console.error('toggleChallengeDayStatus error', error)
    },

    autoFailPendingDays: async () => {
      const { currentWeek } = get()
      if (!currentWeek || !currentWeek.challengeDays) return

      const nextDays = currentWeek.challengeDays.map(cd => ({
        ...cd,
        status: cd.status === 'pending' ? 'fail' : cd.status
      }))

      set(state => ({
        currentWeek: state.currentWeek ? { ...state.currentWeek, challengeDays: nextDays } : null
      }))

      const { error } = await supabase.from('weeks').update({
        challenge_days: nextDays as unknown as Json
      }).eq('id', currentWeek.id)

      if (error) console.error('autoFailPendingDays error', error)
    },

    updateEvaluation: async (type: 'wentWell' | 'struggle' | 'lessons', text: string) => {
      const { currentWeek } = get()
      if (!currentWeek) return
      
      const localKey = type === 'wentWell' ? 'evalWentWell' : type === 'struggle' ? 'evalStruggle' : 'evalLessons'
      const dbKey = type === 'wentWell' ? 'eval_went_well' : type === 'struggle' ? 'eval_struggle' : 'eval_lessons'

      set(state => ({
        currentWeek: state.currentWeek ? { ...state.currentWeek, [localKey]: text } : null
      }))

      const { error } = await supabase.from('weeks').update({
        [dbKey]: text
      }).eq('id', currentWeek.id)

      if (error) console.error('updateEvaluation error', error)
    },

    // ── Pomodoro (local) ───────────────────────────────────────────────────────

    startPomodoro: () => set({ isPomodoroRunning: true }),
    stopPomodoro: () => set({ isPomodoroRunning: false }),
    tickPomodoro: () =>
      set(state => ({
        pomodoroTime: state.pomodoroTime > 0 ? state.pomodoroTime - 1 : 0,
        isPomodoroRunning: state.pomodoroTime > 0 ? state.isPomodoroRunning : false,
      })),
    setFocusedDay: (_index: number) => {
      // Kept for API compat, day selection is now automatic (isToday)
    },
  }
})
