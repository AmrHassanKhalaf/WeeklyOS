import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { offlineDelete, offlineInsert, offlineUpdate } from '../lib/supabaseWithOffline'
import type { Json } from '../lib/database.types'
import { useSettingsStore } from './useSettingsStore'
import type { WeekStartDay } from './useSettingsStore'
import { formatDaySerial, getAdjacentWeek, getWeekInfoForDate, getWeekStartDaySerial, getWeeksInYear } from '../utils/weekDateUtils'
import { debounce } from '../utils/debounce'

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
  type?: 'main' | 'medium' | 'small' | 'pinned'
  status: TaskStatus
  day?: DayOfWeek
  weekId?: string
  startTime?: string
  estimatedTime?: string
  actualDuration?: number   // seconds spent via focus timer
  tags?: string[]
  pinnedTaskId?: string
}

export interface FocusSession {
  id: string
  user_id: string
  task_id?: string
  start_time: string
  end_time?: string
  duration_seconds: number
  session_type: 'focus' | 'break'
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
  overviewNote?: string
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

export interface WeekSummary {
  id: string
  weekNumber: number
  year: number
  title: string
  overviewNote?: string
  dateRange: string
  score: number
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

export interface WeekTasks {
  days: DayPlan[]
  totalCompleted: number
  totalPlanned: number
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface WeekStore {
  currentWeek: WeekData | null
  weekSummary: WeekSummary | null
  weekTasks: WeekTasks | null
  selectedWeek: WeekKey | null
  currentWeekKey: WeekKey | null
  canGoPreviousWeek: boolean
  canGoNextWeek: boolean
  isLoadingWeek: boolean
  isLoadingSummary: boolean
  isLoadingTasks: boolean
  weekError: string | null
  isSyncing: boolean

  pomodoroTime: number
  isPomodoroRunning: boolean
  pomodoroPhase: 'focus' | 'break'
  pomodoroFocusMin: number
  pomodoroBreakMin: number

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
  resetPomodoro: () => void
  setPomodoroPreset: (focusMin: number, breakMin: number) => void
  updateTaskActualDuration: (taskId: string, secondsToAdd: number) => Promise<void>

  // Focus Sessions
  focusSessions: FocusSession[]
  yesterdayFocusSeconds: number
  fetchTodayFocusSessions: () => Promise<void>
  saveFocusSession: (taskId: string | undefined, durationSeconds: number, sessionType: 'focus' | 'break') => Promise<void>

  // Reset
  startNewPlan: () => Promise<void>

  // Challenge & Evaluation
  updateWeekOverview: (updates: { title: string; overviewNote?: string }) => Promise<void>
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
    type: t.type ? (t.type as Task['type']) : undefined,
    status: (t.status as TaskStatus) ?? 'pending',
    day: (t.day as DayOfWeek | null) ?? undefined,
    weekId: t.week_id ? String(t.week_id) : undefined,
    startTime: t.start_time ? String(t.start_time) : undefined,
    estimatedTime: t.estimated_duration ? String(t.estimated_duration) : undefined,
    actualDuration: typeof t.actual_duration === 'number' ? t.actual_duration : undefined,
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

function buildBaseDayPlans(dbWeek: Record<string, unknown>): DayPlan[] {
  const weekNumber = dbWeek.week_number as number
  const year = dbWeek.year as number
  const { timeZone, weekStartDay } = getWeekSettings()
  const orderedDays = getOrderedDays(weekStartDay)
  const weekStartDaySerial = getWeekStartDaySerial(year, weekNumber, weekStartDay)
  const nowWeekInfo = getWeekInfoForDate(new Date(), timeZone, weekStartDay)
  const todayIdx = nowWeekInfo.todayIndex
  const isCurrentWeek = weekNumber === nowWeekInfo.weekNumber && year === nowWeekInfo.year
  const dailyNotes = (dbWeek.daily_notes as Record<string, string>) || {}

  return orderedDays.map((day, idx) => {
    const dateStr = formatDaySerial(weekStartDaySerial + idx, timeZone)
    return {
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
  })
}

function parseActivities(dbWeek: Record<string, unknown>): ActivityItem[] {
  let activities: ActivityItem[] = []
  try {
    activities = dbWeek.activities
      ? (typeof dbWeek.activities === 'string' ? JSON.parse(dbWeek.activities) : dbWeek.activities)
      : []
  } catch (e) {
    console.error('Failed to parse activities:', e)
  }
  return activities
}

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getDefaultWeekTitle(weekNumber: number): string {
  return `Week ${weekNumber}`
}

function buildChallengeDays(dbWeek: Record<string, unknown>, dayPlans: DayPlan[]): ChallengeDay[] {
  const challengeOrder: DayOfWeek[] = ['friday', 'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  const defaultChallengeDays = challengeOrder.map((day) => ({
    dayOfWeek: day,
    date: dayPlans.find((dp) => dp.day === day)?.date || '',
    status: 'pending' as ChallengeDayStatus,
  }))

  let challengeDays: ChallengeDay[] = []
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
    console.error('Failed to parse challenge_days:', e)
    challengeDays = defaultChallengeDays
  }

  return challengeDays
}

function buildWeekSummary(dbWeek: Record<string, unknown>): WeekSummary {
  const weekNumber = dbWeek.week_number as number
  const year = dbWeek.year as number
  const dayPlans = buildBaseDayPlans(dbWeek)
  const activities = parseActivities(dbWeek)
  const challengeDays = buildChallengeDays(dbWeek, dayPlans)
  const title = normalizeOptionalText(dbWeek.title) ?? getDefaultWeekTitle(weekNumber)
  const overviewNote = normalizeOptionalText(dbWeek.overview_note)
  const dateRange = dayPlans.length > 0
    ? `${dayPlans[0].date} — ${dayPlans[dayPlans.length - 1].date}`
    : ''

  return {
    id: dbWeek.id as string,
    weekNumber,
    year,
    title,
    overviewNote,
    dateRange,
    score: (dbWeek.score as number | null) ?? 0,
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

function buildWeekData(dbWeek: Record<string, unknown>, tasks: Record<string, unknown>[]): WeekData {
  const weekNumber = dbWeek.week_number as number
  const year = dbWeek.year as number
  const baseDayPlans = buildBaseDayPlans(dbWeek)
  const mappedTasks = tasks.map(mapDbTask)
  const dayPlans = baseDayPlans.map(dayPlan => processTasksForDay(dayPlan, mappedTasks))

  const allScheduled = mappedTasks.filter(t => t.day !== undefined)
  const totalCompleted = allScheduled.filter(t => t.status === 'done').length
  const totalPlanned = allScheduled.length
  const score = (dbWeek.score as number | null) ??
    (totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0)

  const activities = parseActivities(dbWeek)
  const challengeDays = buildChallengeDays(dbWeek, dayPlans)
  const title = normalizeOptionalText(dbWeek.title) ?? getDefaultWeekTitle(weekNumber)
  const overviewNote = normalizeOptionalText(dbWeek.overview_note)
  const dateRange = dayPlans.length > 0
    ? `${dayPlans[0].date} — ${dayPlans[dayPlans.length - 1].date}`
    : ''

  return {
    id: dbWeek.id as string,
    weekNumber,
    year,
    title,
    overviewNote,
    dateRange,
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
let _visibilityHandler: (() => void) | null = null

// Key = taskId, Value = latest mutation ID string.
const _pendingTaskMutations = new Map<string, string>()

// Debounced daily-note DB sync to absorb rapid keystroke updates.
const _debouncedNoteSync = debounce(
  async (weekId: string, notes: Record<string, string>) => {
    const { error } = await supabase
      .from('weeks')
      .update({ daily_notes: notes })
      .eq('id', weekId)
    if (error) console.error('[updateDailyNote] Debounced sync failed:', error)
  },
  300
)

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
    const weekStartIso = daySerialToIso(bounds.startSerial)
    const weekId = String(week.id)

    const { data: pinnedTasks, error: pinnedErr } = await supabase
      .from('pinned_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`until_date.is.null,until_date.gte.${weekStartIso}`)

    if (pinnedErr) {
      // Migration may not be applied yet in some environments; avoid retry spam and hard failures.
      if ((pinnedErr as { code?: string }).code === 'PGRST205' || (pinnedErr as { code?: string }).code === '42P01') {
        _pinnedFeatureAvailable = false
      }
      return
    }

    _pinnedFeatureAvailable = true

    const activePinnedIds = new Set((pinnedTasks ?? []).map((item) => String(item.id)))

    // Remove pinned-derived tasks that no longer have an active source pinned task.
    const { data: existingPinnedWeekTasks, error: existingPinnedErr } = await supabase
      .from('tasks')
      .select('id,pinned_task_id')
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .not('pinned_task_id', 'is', null)

    if (!existingPinnedErr && existingPinnedWeekTasks && existingPinnedWeekTasks.length > 0) {
      const staleIds = existingPinnedWeekTasks
        .filter((task) => !activePinnedIds.has(String(task.pinned_task_id)))
        .map((task) => String(task.id))

      if (staleIds.length > 0) {
        await supabase
          .from('tasks')
          .delete()
          .in('id', staleIds)
      }
    }

    if (!pinnedTasks || pinnedTasks.length === 0) return

    const existingPinnedIds = new Set((existingPinnedWeekTasks ?? []).map(t => String(t.pinned_task_id)))
    const missingPinnedTasks = pinnedTasks.filter(p => !existingPinnedIds.has(String(p.id)))

    if (missingPinnedTasks.length === 0) return

    const rows = missingPinnedTasks.map((item) => ({
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

    const { error: insertErr } = await supabase.from('tasks').insert(rows)

    if (insertErr) {
      const errCode = (insertErr as { code?: string }).code
      const errMsg = (insertErr as { message?: string }).message || ''

      // Backward-compatible fallback for deployments that still have the old tasks_type_check.
      if (errCode === '23514' && errMsg.includes('tasks_type_check')) {
        const fallbackRows = rows.map((row) => {
          const { type: omittedType, ...fallbackRow } = row
          void omittedType
          return fallbackRow
        })
        const { error: retryErr } = await supabase.from('tasks').insert(fallbackRows)
        if (!retryErr) return
        console.error('[materializePinnedTasksForWeek] Retry insert without type failed:', retryErr)
      } else {
        console.error('[materializePinnedTasksForWeek] Failed to insert missing pinned tasks:', insertErr)
      }

      // If schema is still old, stop trying to materialize until migration is present.
      if (errCode === 'PGRST204' || errCode === '42703') {
        _pinnedFeatureAvailable = false
      }
    }
  }

  const loadWeekSummaryByKey = async (weekNumber: number, year: number, options?: { createIfMissing?: boolean }): Promise<{ week: Record<string, unknown>; summary: WeekSummary } | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return null

    const { data: existingWeek, error: weekErr } = await supabase
      .from('weeks')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .maybeSingle()

    if (weekErr) throw weekErr
    let week = existingWeek

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

    return { week: week as Record<string, unknown>, summary: buildWeekSummary(week as Record<string, unknown>) }
  }

  const loadWeekTasksByWeek = async (userId: string, week: Record<string, unknown>): Promise<WeekData> => {
    await materializePinnedTasksForWeek(userId, week)

    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('week_id', week.id as string)

    if (tasksErr) throw tasksErr
    return buildWeekData(week as Record<string, unknown>, (tasks ?? []) as Record<string, unknown>[])
  }

  const loadWeekByKey = async (weekNumber: number, year: number, options?: { createIfMissing?: boolean }): Promise<WeekData | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return null

    const { data: existingWeek, error: weekErr } = await supabase
      .from('weeks')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .maybeSingle()

    if (weekErr) throw weekErr
    let week = existingWeek

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
      .eq('week_id', week.id as string)

    if (tasksErr) throw tasksErr
    return buildWeekData(week as Record<string, unknown>, (tasks ?? []) as Record<string, unknown>[])
  }

  return {
    currentWeek: null,
    weekSummary: null,
    weekTasks: null,
    selectedWeek: null,
    currentWeekKey: null,
    canGoPreviousWeek: false,
    canGoNextWeek: false,
    isLoadingWeek: true,
    isLoadingSummary: true,
    isLoadingTasks: true,
    weekError: null,
    isSyncing: false,
    pomodoroTime: 25 * 60,
    isPomodoroRunning: false,
    pomodoroPhase: 'focus' as const,
    pomodoroFocusMin: 25,
    pomodoroBreakMin: 5,
    focusSessions: [],
    yesterdayFocusSeconds: 0,

    // ── Initialize ─────────────────────────────────────────────────────────────

    initialize: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      try {
        const currentKey = getCurrentWeekInfo()
        const selected = get().selectedWeek || currentKey
        set({
          currentWeek: null,
          weekSummary: null,
          weekTasks: null,
          isLoadingWeek: true,
          isLoadingSummary: true,
          isLoadingTasks: true,
          weekError: null,
        })

        const summaryResult = await loadWeekSummaryByKey(selected.weekNumber, selected.year, { createIfMissing: true })
        if (!summaryResult) throw new Error('Failed to load selected week')

        const { week, summary } = summaryResult

        set({
          weekSummary: summary,
          isLoadingSummary: false,
        })

        updateNavigationState({ weekNumber: summary.weekNumber, year: summary.year }, currentKey)
        get().fetchTodayFocusSessions()

        void (async () => {
          try {
            const fullWeek = await loadWeekTasksByWeek(user.id, week)
            set({
              currentWeek: fullWeek,
              weekTasks: {
                days: fullWeek.days,
                totalCompleted: fullWeek.totalCompleted,
                totalPlanned: fullWeek.totalPlanned,
              },
              isLoadingTasks: false,
              isLoadingWeek: false,
            })
          } catch (taskErr) {
            set({ weekError: (taskErr as Error).message, isLoadingTasks: false, isLoadingWeek: false })
          }
        })()

      } catch (err) {
        set({
          weekError: (err as Error).message,
          isLoadingSummary: false,
          isLoadingTasks: false,
          isLoadingWeek: false,
        })
      }

      // Restore pomodoro preset from DB
      void supabase.from('user_settings')
        .select('pomodoro_focus_min, pomodoro_break_min')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return
          const focusMin = data.pomodoro_focus_min
          const breakMin = data.pomodoro_break_min
          if (focusMin && breakMin) {
            set({
              pomodoroFocusMin: focusMin,
              pomodoroBreakMin: breakMin,
              pomodoroTime: focusMin * 60,
            })
          }
        })

      // If a restored tab has lost week data, re-fetch once it becomes visible.
      const handleVisibility = () => {
        if (document.visibilityState !== 'visible') return
        // Re-initialize data if the week data is missing (stale or discarded)
        const { currentWeek, isLoadingWeek } = get()
        if (!currentWeek && !isLoadingWeek) {
          console.info('[useWeekStore] Tab restored — re-initializing week data')
          void get().initialize()
        }
      }

      // Remove any previously registered listener before re-attaching
      if (_visibilityHandler) {
        document.removeEventListener('visibilitychange', _visibilityHandler)
      }
      _visibilityHandler = handleVisibility
      document.addEventListener('visibilitychange', handleVisibility)
    },

    goToWeek: async (weekNumber, year) => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) return

        set({
          currentWeek: null,
          weekSummary: null,
          weekTasks: null,
          isLoadingWeek: true,
          isLoadingSummary: true,
          isLoadingTasks: true,
          weekError: null,
        })

        const summaryResult = await loadWeekSummaryByKey(weekNumber, year, { createIfMissing: true })
        const currentKey = getCurrentWeekInfo()
        if (!summaryResult) {
          set({ isLoadingSummary: false, isLoadingTasks: false, isLoadingWeek: false })
          return
        }

        const { week, summary } = summaryResult

        set({
          weekSummary: summary,
          isLoadingSummary: false,
        })

        updateNavigationState({ weekNumber: summary.weekNumber, year: summary.year }, currentKey)

        void (async () => {
          try {
            const fullWeek = await loadWeekTasksByWeek(user.id, week)
            set({
              currentWeek: fullWeek,
              weekTasks: {
                days: fullWeek.days,
                totalCompleted: fullWeek.totalCompleted,
                totalPlanned: fullWeek.totalPlanned,
              },
              isLoadingTasks: false,
              isLoadingWeek: false,
            })
          } catch (taskErr) {
            set({ weekError: (taskErr as Error).message, isLoadingTasks: false, isLoadingWeek: false })
          }
        })()
      } catch (err) {
        set({
          weekError: (err as Error).message,
          isLoadingSummary: false,
          isLoadingTasks: false,
          isLoadingWeek: false,
        })
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
      if (_visibilityHandler) {
        document.removeEventListener('visibilitychange', _visibilityHandler)
        _visibilityHandler = null
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
      try {
        await offlineUpdate('tasks', taskId, { status: newStatus })
      } catch (err) {
        console.error('[toggleTaskComplete] DB write failed, reverting:', err)
        set({ currentWeek: snapshot })
      }
    },

    createTask: async (task) => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const currentWeek = get().currentWeek
      if (!currentWeek) return
      
      const day = task.day
      const tasksForDay = day ? currentWeek.days.find(d => d.day === day) : undefined
      
      if (day && task.priority === 'high' && tasksForDay?.highTask) {
        throw new Error('Limit reached: Only 1 High priority task allowed per day.')
      }
      if (day && task.priority === 'medium' && (tasksForDay?.mediumTasks?.length || 0) >= 3) {
        throw new Error('Limit reached: Only 3 Medium priority tasks allowed per day.')
      }
      if (day && task.priority === 'low' && (tasksForDay?.smallTasks?.length || 0) >= 5) {
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

      try {
        const { data: dbTask, wasQueued } = await offlineInsert('tasks', {
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
        })

        if (!wasQueued && dbTask) {
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
      } catch (err) {
        console.error('[createTask] DB write failed, reverting:', err)
        set({ currentWeek: snapshot })
        const message = err instanceof Error ? err.message : 'Failed to create task'
        throw new Error(message)
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

      // Discard stale responses when rapid edits target the same task.
      const mutationId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      _pendingTaskMutations.set(taskId, mutationId)

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

      let updateError: unknown = null
      try {
        await offlineUpdate('tasks', taskId, payload)
      } catch (err) {
        updateError = err
      }

      // Discard result if a newer mutation has already taken over.
      if (_pendingTaskMutations.get(taskId) !== mutationId) return
      _pendingTaskMutations.delete(taskId)

      if (updateError) {
        const errObj = updateError as { code?: string; message?: string }
        console.error('[updateTask] DB write failed, reverting. Code:', errObj?.code, '| Message:', errObj?.message)
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

      try {
        await offlineDelete('tasks', taskId)
      } catch (err) {
        console.error('[deleteTask] DB write failed, reverting:', err)
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

      // Optimistic update first
      const snapshot = get().currentWeek
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
      await syncToDb()

      // Persist to DB, revert on failure
      if (pendingTasks.length > 0) {
        const { error: dbErr } = await supabase.from('tasks').update({ status: 'done' }).in('id', pendingTasks)
        if (dbErr) {
          console.error('[markDayComplete] DB write failed, reverting:', dbErr)
          set({ currentWeek: snapshot })
          throw new Error('Failed to mark day complete. Please try again.')
        }
      }
    },

    deleteDayData: async (day) => {
      const week = get().currentWeek
      if (!week) return
      
      const { error } = await supabase.from('tasks').delete().eq('week_id', week.id as string).eq('day', day)
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
      
      const { error } = await supabase.from('tasks').delete().eq('week_id', week.id as string)
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
      
      // Optimistic UI update is immediate
      set(state => ({
        currentWeek: state.currentWeek ? {
          ...state.currentWeek,
          dailyNotes: nextNotes,
          days: state.currentWeek.days.map(d => d.day === day ? { ...d, dailyNote: note } : d)
        } : null
      }))

      // DB write is debounced to absorb rapid keystrokes.
      _debouncedNoteSync(week.id, nextNotes)
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

    updateWeekOverview: async ({ title, overviewNote }) => {
      const targetWeek = get().currentWeek ?? get().weekSummary
      if (!targetWeek) return

      const cleanTitle = title.trim()
      const cleanOverview = overviewNote?.trim() || ''
      const displayTitle = cleanTitle || getDefaultWeekTitle(targetWeek.weekNumber)
      const nextOverview = cleanOverview || undefined
      const snapshot = {
        currentWeek: get().currentWeek,
        weekSummary: get().weekSummary,
      }

      set(state => ({
        currentWeek: state.currentWeek?.id === targetWeek.id
          ? { ...state.currentWeek, title: displayTitle, overviewNote: nextOverview }
          : state.currentWeek,
        weekSummary: state.weekSummary?.id === targetWeek.id
          ? { ...state.weekSummary, title: displayTitle, overviewNote: nextOverview }
          : state.weekSummary,
      }))

      const { error } = await supabase.from('weeks').update({
        title: cleanTitle || null,
        overview_note: cleanOverview || null,
      }).eq('id', targetWeek.id)

      if (error) {
        console.error('updateWeekOverview error', error)
        set(snapshot)
        throw error
      }
    },

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
        [dbKey]: text,
      } as never).eq('id', currentWeek.id)

      if (error) console.error('updateEvaluation error', error)
    },

    // ── Pomodoro (local) ───────────────────────────────────────────────────────

    startPomodoro: () => set({ isPomodoroRunning: true }),
    stopPomodoro: () => set({ isPomodoroRunning: false }),
    tickPomodoro: () =>
      set(state => {
        if (state.pomodoroTime > 1) {
          return { pomodoroTime: state.pomodoroTime - 1 }
        }
        // Phase switch on zero
        const nextPhase = state.pomodoroPhase === 'focus' ? 'break' : 'focus'
        const nextTime = nextPhase === 'focus'
          ? state.pomodoroFocusMin * 60
          : state.pomodoroBreakMin * 60
        return { pomodoroTime: nextTime, pomodoroPhase: nextPhase, isPomodoroRunning: false }
      }),
    resetPomodoro: () =>
      set(state => ({
        pomodoroTime: state.pomodoroFocusMin * 60,
        pomodoroPhase: 'focus',
        isPomodoroRunning: false,
      })),
    setPomodoroPreset: (focusMin: number, breakMin: number) => {
      set({
        pomodoroFocusMin: focusMin,
        pomodoroBreakMin: breakMin,
        pomodoroTime: focusMin * 60,
        pomodoroPhase: 'focus',
        isPomodoroRunning: false,
      })
      // Persist to DB so the preset survives page refresh
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user) return
        void supabase.from('user_settings').upsert({
          user_id: session.user.id,
          pomodoro_focus_min: focusMin,
          pomodoro_break_min: breakMin,
        })
      })
    },
    updateTaskActualDuration: async (taskId: string, secondsToAdd: number) => {
      const snapshot = get().currentWeek
      if (!snapshot) return

      let currentDuration = 0
      
      // Optimistic update
      set(state => ({
        currentWeek: state.currentWeek ? {
          ...state.currentWeek,
          days: state.currentWeek.days.map(d => {
            const updateIfMatch = (t: Task) => {
              if (t.id === taskId) {
                currentDuration = t.actualDuration || 0
                return { ...t, actualDuration: currentDuration + secondsToAdd }
              }
              return t
            }
            return {
              ...d,
              highTask: d.highTask ? updateIfMatch(d.highTask) : undefined,
              mediumTasks: d.mediumTasks.map(updateIfMatch),
              smallTasks: d.smallTasks.map(updateIfMatch),
            }
          })
        } : null
      }))

      // Sync to DB
      try {
        await offlineUpdate('tasks', taskId, { actual_duration: currentDuration + secondsToAdd })
      } catch (err) {
        console.error('[updateTaskActualDuration] Failed', err)
        set({ currentWeek: snapshot })
      }
    },
    fetchTodayFocusSessions: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)
      const tomorrowStart = new Date(todayStart)
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('start_time', yesterdayStart.toISOString())
        .lt('start_time', tomorrowStart.toISOString())
        .order('start_time', { ascending: true })
        
      if (!error && data) {
        const sessions = data as FocusSession[]
        const todaySessions = sessions.filter((item) => {
          const start = new Date(item.start_time)
          return start >= todayStart && start < tomorrowStart
        })
        const yesterdayFocusSeconds = sessions.reduce((total, item) => {
          const start = new Date(item.start_time)
          if (item.session_type !== 'focus' || start < yesterdayStart || start >= todayStart) return total
          return total + item.duration_seconds
        }, 0)

        set({ focusSessions: todaySessions, yesterdayFocusSeconds })
      }
    },

    saveFocusSession: async (taskId, durationSeconds, sessionType) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      
      const now = new Date()
      const startTime = new Date(now.getTime() - durationSeconds * 1000)
      
      const payload = {
        user_id: session.user.id,
        task_id: taskId || null,
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        duration_seconds: durationSeconds,
        session_type: sessionType
      }
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert(payload)
        .select()
        .single()
        
      if (!error && data) {
        const savedSession = data as FocusSession
        const savedStart = new Date(savedSession.start_time)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const tomorrowStart = new Date(todayStart)
        tomorrowStart.setDate(tomorrowStart.getDate() + 1)
        const yesterdayStart = new Date(todayStart)
        yesterdayStart.setDate(yesterdayStart.getDate() - 1)

        if (savedStart >= todayStart && savedStart < tomorrowStart) {
          const currentSessions = get().focusSessions
          set({ focusSessions: [...currentSessions, savedSession] })
        } else if (savedSession.session_type === 'focus' && savedStart >= yesterdayStart && savedStart < todayStart) {
          set(state => ({ yesterdayFocusSeconds: state.yesterdayFocusSeconds + savedSession.duration_seconds }))
        }
      }
    },

  }
})
