import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'done'
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
  challengeProgress?: number
  challengeEndsIn?: string
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface WeekStore {
  currentWeek: WeekData | null
  isLoadingWeek: boolean
  weekError: string | null

  brainDumpItems: BrainDumpItem[]
  isLoadingBrainDump: boolean

  pomodoroTime: number
  isPomodoroRunning: boolean

  // Init
  initialize: () => Promise<void>
  cleanup: () => void

  // Tasks CRUD
  toggleTaskComplete: (taskId: string) => Promise<void>
  createTask: (task: { title: string; priority: Priority; day?: DayOfWeek; description?: string; startTime?: string; estimatedTime?: string }) => Promise<void>
  updateTask: (taskId: string, updates: Partial<{ title: string; priority: Priority; day: DayOfWeek | null; status: TaskStatus; description: string; startTime: string; estimatedTime: string; tags: string[] }>) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  markDayComplete: (day: DayOfWeek) => Promise<void>

  // Brain dump CRUD
  addBrainDumpItem: (content: string) => Promise<void>
  removeBrainDumpItem: (id: string) => Promise<void>
  updateBrainDumpItem: (id: string, updates: Partial<{ title: string; tags: string[] }>) => Promise<void>
  toggleBrainDumpSelection: (id: string) => void
  deleteSelectedBrainDumpItems: () => Promise<void>

  // Pomodoro (local only)
  startPomodoro: () => void
  stopPomodoro: () => void
  tickPomodoro: () => void
  setFocusedDay: (_index: number) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = [
  'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
]
const DAY_SHORT = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

function getCurrentWeekInfo(): { weekNumber: number; year: number } {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
  )
  return { weekNumber, year: now.getFullYear() }
}

/** Get the Saturday of a given ISO week. */
function getWeekStartDate(year: number, weekNumber: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // 1 is Monday, 7 is Sunday
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - (dayOfWeek - 1) + (weekNumber - 1) * 7)
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() - 2) // Shift ISO Monday to Saturday
  return saturday
}

function mapDbTask(t: Record<string, unknown>): Task {
  return {
    id: t.id as string,
    title: t.title as string,
    description: (t.description as string | null) ?? undefined,
    priority: (t.priority as Priority) ?? 'low',
    status: (t.status as TaskStatus) ?? 'pending',
    day: (t.day as DayOfWeek | null) ?? undefined,
    weekId: (t.week_id as string | null) ?? undefined,
    startTime: (t.start_time as string | null) ?? undefined,
    estimatedTime: (t.estimated_duration as string | null) ?? undefined,
    tags: (t.tags as string[] | null) ?? undefined,
  }
}

function buildWeekData(dbWeek: Record<string, unknown>, tasks: Record<string, unknown>[]): WeekData {
  const weekNumber = dbWeek.week_number as number
  const year = dbWeek.year as number
  const startDate = getWeekStartDate(year, weekNumber)

  const today = new Date()
  const todayIdx = (today.getDay() + 1) % 7 // For Saturday-started week: Sat=0, Sun=1, Mon=2, etc.

  // Is the loaded week the current one?
  const { weekNumber: curWeek, year: curYear } = getCurrentWeekInfo()
  const isCurrentWeek = weekNumber === curWeek && year === curYear

  const dayPlans: DayPlan[] = DAYS.map((day, idx) => {
    const dayTasks = tasks.filter(t => t.day === day)
    const highTask = dayTasks.find(t => t.priority === 'high')
    const mediumTasks = dayTasks.filter(t => t.priority === 'medium')
    const smallTasks = dayTasks.filter(t => t.priority === 'low')

    const done = dayTasks.filter(t => t.status === 'done').length
    const total = dayTasks.length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0

    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + idx)
    const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    return {
      day,
      date: dateStr,
      shortName: DAY_SHORT[idx],
      isToday: isCurrentWeek && idx === todayIdx,
      progress,
      highTask: highTask ? mapDbTask(highTask) : undefined,
      mediumTasks: mediumTasks.map(mapDbTask),
      smallTasks: smallTasks.map(mapDbTask),
    }
  })

  const allScheduled = tasks.filter(t => t.day !== null)
  const totalCompleted = allScheduled.filter(t => t.status === 'done').length
  const totalPlanned = allScheduled.length
  const score = (dbWeek.score as number | null) ??
    (totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0)

  return {
    id: dbWeek.id as string,
    weekNumber,
    year,
    title: 'The Digital Obsidian',
    dateRange: `${dayPlans[0].date} — ${dayPlans[6].date}`,
    score,
    totalCompleted,
    totalPlanned,
    days: dayPlans,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

let _realtimeChannel: RealtimeChannel | null = null

export const useWeekStore = create<WeekStore>((set, get) => ({
  currentWeek: null,
  isLoadingWeek: true,
  weekError: null,
  brainDumpItems: [],
  isLoadingBrainDump: true,
  pomodoroTime: 25 * 60,
  isPomodoroRunning: false,

  // ── Initialize ─────────────────────────────────────────────────────────────

  initialize: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    set({ isLoadingWeek: true, weekError: null })

    try {
      // 1. Get or create current week
      const { weekNumber, year } = getCurrentWeekInfo()

      let { data: week, error: weekErr } = await supabase
        .from('weeks')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle()

      if (weekErr) throw weekErr

      if (!week) {
        const { data: newWeek, error: createErr } = await supabase
          .from('weeks')
          .insert({ user_id: user.id, week_number: weekNumber, year })
          .select()
          .single()
        if (createErr) throw createErr
        week = newWeek
      }

      // 2. Load tasks for this week
      const { data: tasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_id', week.id)

      if (tasksErr) throw tasksErr

      set({
        currentWeek: buildWeekData(week as Record<string, unknown>, (tasks ?? []) as Record<string, unknown>[]),
        isLoadingWeek: false,
      })

      // 3. Real-time subscription for tasks
      if (_realtimeChannel) {
        await supabase.removeChannel(_realtimeChannel)
      }

      _realtimeChannel = supabase
        .channel(`tasks-week-${week.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `week_id=eq.${week.id}` },
          async () => {
            // Re-fetch tasks on any change
            const { data: refreshed } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', user.id)
              .eq('week_id', week!.id)

            if (refreshed) {
              set(state => ({
                currentWeek: state.currentWeek
                  ? buildWeekData(week as Record<string, unknown>, refreshed as Record<string, unknown>[])
                  : null,
              }))
            }
          },
        )
        .subscribe()
    } catch (err) {
      set({ weekError: (err as Error).message, isLoadingWeek: false })
    }

    // 4. Brain dump
    const { data: bdItems, error: bdErr } = await supabase
      .from('brain_dump')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!bdErr && bdItems) {
      set({
        brainDumpItems: bdItems.map(b => ({ id: b.id, title: b.content ?? '' })),
        isLoadingBrainDump: false,
      })
    } else {
      set({ isLoadingBrainDump: false })
    }
  },

  cleanup: () => {
    if (_realtimeChannel) {
      supabase.removeChannel(_realtimeChannel)
      _realtimeChannel = null
    }
  },

  // ── Task CRUD ──────────────────────────────────────────────────────────────

  toggleTaskComplete: async (taskId) => {
    const week = get().currentWeek
    if (!week) return

    // Find existing status
    let currentStatus: TaskStatus = 'pending'
    for (const d of week.days) {
      const all = [d.highTask, ...d.mediumTasks, ...d.smallTasks].filter(Boolean)
      const found = all.find(t => t?.id === taskId)
      if (found) { currentStatus = found.status; break }
    }

    const newStatus: TaskStatus = currentStatus === 'done' ? 'pending' : 'done'

    // Optimistic update
    set(state => ({
      currentWeek: state.currentWeek ? {
        ...state.currentWeek,
        days: state.currentWeek.days.map(d => ({
          ...d,
          highTask: d.highTask?.id === taskId ? { ...d.highTask, status: newStatus } : d.highTask,
          mediumTasks: d.mediumTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
          smallTasks: d.smallTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
        })),
      } : null,
    }))

    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  },

  createTask: async (task) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !get().currentWeek) return

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      week_id: get().currentWeek!.id,
      title: task.title,
      priority: task.priority,
      day: task.day ?? null,
      description: task.description ?? null,
      status: 'pending',
      start_time: task.startTime ?? null,
      estimated_duration: task.estimatedTime ?? null,
    })

    if (error) console.error('[createTask]', error)
    // Real-time will refresh the week data
  },

  updateTask: async (taskId, updates) => {
    const payload: Record<string, any> = { ...updates }
    if (updates.startTime !== undefined) {
      payload.start_time = updates.startTime
      delete payload.startTime
    }
    if (updates.estimatedTime !== undefined) {
      payload.estimated_duration = updates.estimatedTime
      delete payload.estimatedTime
    }

    const { error } = await supabase.from('tasks').update(payload).eq('id', taskId)
    if (error) console.error('[updateTask]', error)
  },

  deleteTask: async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) console.error('[deleteTask]', error)

    // Optimistic: remove from local state
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

  // ── Brain dump CRUD ────────────────────────────────────────────────────────

  addBrainDumpItem: async (content: string) => {
    if (!content.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('brain_dump')
      .insert({ user_id: user.id, content: content.trim() })
      .select()
      .single()

    if (error) { console.error('[addBrainDumpItem]', error); return }
    if (data) {
      set(state => ({
        brainDumpItems: [{ id: data.id, title: data.content ?? content }, ...state.brainDumpItems],
      }))
    }
  },

  removeBrainDumpItem: async (id: string) => {
    await supabase.from('brain_dump').delete().eq('id', id)
    set(state => ({ brainDumpItems: state.brainDumpItems.filter(i => i.id !== id) }))
  },

  updateBrainDumpItem: async (id: string, updates: Partial<{ title: string; tags: string[] }>) => {
    const payload: Record<string, any> = {}
    if (updates.title !== undefined) payload.content = updates.title.trim()
    if (updates.tags !== undefined) payload.tags = updates.tags

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase.from('brain_dump').update(payload).eq('id', id)
      if (error) {
        console.error('[updateBrainDumpItem]', error)
        return
      }
    }
    set(state => ({
      brainDumpItems: state.brainDumpItems.map(i => i.id === id ? { ...i, ...updates } : i),
    }))
  },

  toggleBrainDumpSelection: (id: string) =>
    set(state => ({
      brainDumpItems: state.brainDumpItems.map(i =>
        i.id === id ? { ...i, selected: !i.selected } : i,
      ),
    })),

  deleteSelectedBrainDumpItems: async () => {
    const selected = get().brainDumpItems.filter(i => i.selected)
    if (!selected.length) return

    await supabase.from('brain_dump').delete().in('id', selected.map(i => i.id))
    set(state => ({ brainDumpItems: state.brainDumpItems.filter(i => !i.selected) }))
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
}))
