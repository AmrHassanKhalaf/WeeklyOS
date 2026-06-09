import { AppLayout } from '../components/layout/AppLayout'
import { DayCardDistribution } from '../components/DayCardDistribution'
import { EndDayReviewModal } from '../components/EndDayReviewModal'
import { useWeekStore } from '../store/useWeekStore'
import type { DayOfWeek, Priority, Task, WeekData } from '../store/useWeekStore'
import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useAiApi } from '../hooks/useApi'
import { useBrainDumpStore, type BrainDumpItem } from '../store/useBrainDumpStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useScrollLock } from '../hooks/useScrollLock'
import BorderGlow from '../components/effects/BorderGlow'
import { Button } from '../components/ui/Button'
import { Calendar, Brain, Tag, Sparkles, Loader2, X, Move } from 'lucide-react'
import { cn } from '../lib/cn'
import { BidiText } from '../components/ui/BidiText'

function extractJsonFromText(raw: string): unknown {
  const trimmed = raw.trim()
  const direct = JSON.parse(trimmed)
  if (direct) return direct
  return null
}

function parseScheduleResponse(raw: string): unknown {
  try {
    return extractJsonFromText(raw)
  } catch {
    try {
      const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i)
      if (fenced?.[1]) return JSON.parse(fenced[1])
    } catch {
      // Continue to object extraction
    }

    const objectMatch = raw.match(/\{[\s\S]*\}/)
    if (objectMatch?.[0]) {
      return JSON.parse(objectMatch[0])
    }

    throw new Error('AI did not return valid JSON for distribution')
  }
}

type ScheduleTask = {
  title: string
  priority: Priority
  day: DayOfWeek
  estimatedTime?: string
  tags?: string[]
}

const ALL_DAYS: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function isScheduleTask(value: unknown): value is ScheduleTask {
  if (!value || typeof value !== 'object') return false
  const task = value as Record<string, unknown>
  const title = task.title
  const priority = task.priority
  const day = task.day
  const estimatedTime = task.estimatedTime
  const tags = task.tags

  const priorityOk = priority === 'high' || priority === 'medium' || priority === 'low'
  const dayOk = typeof day === 'string' && ALL_DAYS.includes(day as DayOfWeek)
  const tagsOk = tags === undefined || (Array.isArray(tags) && tags.every((t) => typeof t === 'string'))
  const estimatedOk = estimatedTime === undefined || typeof estimatedTime === 'string'

  return typeof title === 'string' && priorityOk && dayOk && tagsOk && estimatedOk
}

function normalizeScheduleTasks(parsed: unknown): ScheduleTask[] {
  if (Array.isArray(parsed)) {
    return parsed.filter(isScheduleTask)
  }
  if (parsed && typeof parsed === 'object' && 'tasks' in parsed) {
    const tasks = (parsed as { tasks?: unknown }).tasks
    if (Array.isArray(tasks)) return tasks.filter(isScheduleTask)
  }
  return []
}

function inferPriorityFromTags(tags: string[] = []): Priority {
  const normalized = tags.map(t => t.toLowerCase())
  const highSignals = ['hard', 'deep', 'complex', 'strategic', 'focus', 'high', 'project']
  const lowSignals = ['easy', 'quick', 'simple', 'admin', 'routine', 'minor', 'low']

  if (normalized.some(t => highSignals.some(sig => t.includes(sig)))) return 'high'
  if (normalized.some(t => lowSignals.some(sig => t.includes(sig)))) return 'low'
  return 'medium'
}

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; limit: number }> = [
  { value: 'high', label: 'High Impact', limit: 1 },
  { value: 'medium', label: 'Medium Priority', limit: 3 },
  { value: 'low', label: 'Small Tasks', limit: 5 },
]

function getAllTasks(week: WeekData): Task[] {
  return week.days.flatMap(day => [day.highTask, ...day.mediumTasks, ...day.smallTasks].filter(Boolean) as Task[])
}

function getSlotCount(week: WeekData, day: DayOfWeek, priority: Priority, excludeTaskId?: string): number {
  return getAllTasks(week).filter(task => task.day === day && task.priority === priority && task.id !== excludeTaskId).length
}

function findTask(week: WeekData | null, taskId: string | null): Task | undefined {
  if (!week || !taskId) return undefined
  return getAllTasks(week).find(task => task.id === taskId)
}

function parseDropTarget(id: unknown): { day: DayOfWeek; priority: Priority } | null {
  if (typeof id !== 'string') return null
  const [, day, priority] = id.split(':')
  if (!ALL_DAYS.includes(day as DayOfWeek)) return null
  if (!['high', 'medium', 'low'].includes(priority)) return null
  return { day: day as DayOfWeek, priority: priority as Priority }
}

type AssignDraft = {
  id: string
  title: string
  tags: string[]
  selected: boolean
  day: DayOfWeek
  priority: Priority
}

function MoveTaskModal({
  task,
  currentWeek,
  target,
  restDays,
  error,
  isMoving,
  onTargetChange,
  onClose,
  onMove,
}: {
  task: Task
  currentWeek: WeekData
  target: { day: DayOfWeek; priority: Priority }
  restDays: DayOfWeek[]
  error: string | null
  isMoving: boolean
  onTargetChange: (target: { day: DayOfWeek; priority: Priority }) => void
  onClose: () => void
  onMove: () => void
}) {
  const selectedPriority = PRIORITY_OPTIONS.find(option => option.value === target.priority) ?? PRIORITY_OPTIONS[1]
  const count = getSlotCount(currentWeek, target.day, target.priority, task.id)
  const isFull = count >= selectedPriority.limit

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg rounded-t-2xl border border-white/10 bg-surface-container p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Move Task</p>
            <BidiText as="h3" text={task.title} className="mt-2 text-lg font-black text-on-surface" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-white/10 hover:text-on-surface focus-ring"
            title="Close"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Day</span>
            <select
              value={target.day}
              onChange={(event) => onTargetChange({ ...target, day: event.target.value as DayOfWeek })}
              className="input-base w-full appearance-none"
            >
              {currentWeek.days.map(day => (
                <option key={day.day} value={day.day}>
                  {day.shortName} {day.date}{restDays.includes(day.day) ? ' (Rest)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Priority Slot</span>
            <select
              value={target.priority}
              onChange={(event) => onTargetChange({ ...target, priority: event.target.value as Priority })}
              className="input-base w-full appearance-none"
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className={cn('mt-4 text-xs', isFull ? 'text-error' : 'text-on-surface-variant')}>
          {selectedPriority.label}: {count}/{selectedPriority.limit} used
          {isFull ? ' — this slot is full.' : ' — space available.'}
        </p>
        {error && <p className="mt-2 text-sm text-error">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isMoving}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={onMove} disabled={isMoving || isFull} loading={isMoving}>
            Move Task
          </Button>
        </div>
      </div>
    </div>
  )
}

export function WeeklyDistribution() {
  const currentWeek = useWeekStore(state => state.currentWeek)
  const isLoadingWeek = useWeekStore(state => state.isLoadingWeek)
  const createTask = useWeekStore(state => state.createTask)
  const moveTask = useWeekStore(state => state.moveTask)
  const markDayComplete = useWeekStore(state => state.markDayComplete)
  const brainDumpItems = useBrainDumpStore(state => state.brainDumpItems)
  const loadItems = useBrainDumpStore(state => state.loadItems)
  const removeItem = useBrainDumpStore(state => state.removeItem)
  const restDays = useSettingsStore(state => state.restDays)
  
  useEffect(() => {
    loadItems()
  }, [loadItems])

  const [isDistributing, setIsDistributing] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignDrafts, setAssignDrafts] = useState<AssignDraft[]>([])
  const [showTags, setShowTags] = useState(true)
  const [moveMode, setMoveMode] = useState(false)
  const [activeDragTaskId, setActiveDragTaskId] = useState<string | null>(null)
  const [moveModalTask, setMoveModalTask] = useState<Task | null>(null)
  const [moveTarget, setMoveTarget] = useState<{ day: DayOfWeek; priority: Priority }>({ day: 'monday', priority: 'medium' })
  const [moveError, setMoveError] = useState<string | null>(null)
  const [isMovingTask, setIsMovingTask] = useState(false)
  const [reviewDay, setReviewDay] = useState<DayOfWeek | null>(null)
  useScrollLock(isAssignModalOpen || !!moveModalTask || !!reviewDay)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  )
  const { sendMessage } = useAiApi()
  const activeDragTask = findTask(currentWeek, activeDragTaskId)

  const openMoveModal = (task: Task) => {
    setMoveModalTask(task)
    setMoveTarget({
      day: task.day || (currentWeek?.days[0]?.day as DayOfWeek) || 'monday',
      priority: task.priority || 'medium',
    })
    setMoveError(null)
  }

  const handleMoveTask = async (task: Task, target = moveTarget) => {
    if (isMovingTask) return
    setIsMovingTask(true)
    setMoveError(null)
    try {
      await moveTask(task.id, target)
      setMoveModalTask(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move task'
      setMoveError(message)
    } finally {
      setIsMovingTask(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragTaskId(String(event.active.id))
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const task = findTask(currentWeek, String(event.active.id))
    const target = parseDropTarget(event.over?.id)
    setActiveDragTaskId(null)
    if (!task || !target) return

    try {
      await moveTask(task.id, target)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to move task')
    }
  }

  const handleDragCancel = () => {
    setActiveDragTaskId(null)
  }

  const requestDayComplete = async (day: DayOfWeek) => {
    const dayPlan = currentWeek?.days.find(d => d.day === day)
    const pending = dayPlan
      ? [dayPlan.highTask, ...dayPlan.mediumTasks, ...dayPlan.smallTasks].filter(task => task && task.status === 'pending')
      : []
    if (pending.length > 0) {
      setReviewDay(day)
      return
    }
    await markDayComplete(day)
  }

  const openAssignModal = () => {
    if (!currentWeek || brainDumpItems.length === 0) return
    const selected = brainDumpItems.filter((item) => item.selected)
    const sourceItems = selected.length > 0 ? selected : brainDumpItems
    const defaultDay = (currentWeek.days.find(d => !(restDays || []).includes(d.day))?.day || currentWeek.days[0]?.day || 'monday') as DayOfWeek

    setAssignDrafts(
      sourceItems.map((item: BrainDumpItem) => ({
        id: item.id,
        title: item.content,
        tags: item.tags || [],
        selected: true,
        day: defaultDay,
        priority: inferPriorityFromTags(item.tags || []),
      }))
    )
    setIsAssignModalOpen(true)
  }

  const handleAssignBrainDump = async () => {
    if (!currentWeek || isAssigning || assignDrafts.length === 0) return
    const toAssign = assignDrafts.filter(d => d.selected && d.title.trim())
    if (toAssign.length === 0) {
      alert('Please select at least one task to assign.')
      return
    }

    setIsAssigning(true)
    try {
      let skipped = 0
      for (const draft of toAssign) {
        try {
          await createTask({
            title: draft.title.trim(),
            priority: draft.priority,
            day: draft.day,
            tags: draft.tags,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : ''
          if (msg.startsWith('Limit reached')) {
            skipped++
          } else {
            throw err
          }
        }
      }

      for (const draft of toAssign) {
        await removeItem(draft.id)
      }

      setIsAssignModalOpen(false)
      setAssignDrafts([])
      if (skipped > 0) {
        alert(`${skipped} task(s) were skipped — the selected day is already at the 1-3-5 limit for that priority.`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert('Failed to assign braindump items: ' + message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleAutoDistribute = async () => {
    if (!currentWeek || isDistributing || brainDumpItems.length === 0) return
    setIsDistributing(true)

    const brainDumpForPrompt = brainDumpItems
      .map((i) => `- ${i.content} | tags: ${(i.tags || []).join(', ') || 'none'} | suggestedPriority: ${inferPriorityFromTags(i.tags || [])}`)
      .join('\n')
    
    const prompt = `Your job is to convert a brain dump into a structured weekly plan using the 1-3-5 productivity system.
    
Rules:
- 1 main task per day (High priority)
- 3 medium tasks (Medium priority)
- 5 small tasks (Low priority)

Input:
${brainDumpForPrompt}

Output requirements:
Return exactly one JSON object with a "tasks" array.
Each object in the array MUST have:
- title: string
- priority: "high" | "medium" | "low"
- day: "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday"
- estimatedTime: optional string (e.g. "1h", "30m")
- tags: optional string[]

Make sure:
- Avoid overloading any day
- Balance workload logically
- Use tags to infer task difficulty and suitable day intensity
- DO NOT assign tasks to rest days: ${restDays.join(', ')}`

    try {
      const res = await sendMessage('schedule', prompt, { dateRange: currentWeek.dateRange })

      const parsed = parseScheduleResponse(res.response)
      const tasksToCreate = normalizeScheduleTasks(parsed)

      // Track running per-day counts to enforce 1-3-5 limits across AI-generated tasks
      const dayCounts: Record<string, { high: number; medium: number; low: number }> = {}
      const getCount = (day: string) => {
        if (!dayCounts[day]) {
          const dayData = currentWeek.days.find(d => d.day === day)
          dayCounts[day] = {
            high: dayData?.highTask ? 1 : 0,
            medium: dayData?.mediumTasks?.length ?? 0,
            low: dayData?.smallTasks?.length ?? 0,
          }
        }
        return dayCounts[day]
      }

      let skipped = 0
      for (const t of tasksToCreate) {
        if (!t.day) continue
        const counts = getCount(t.day)
        if (t.priority === 'high' && counts.high >= 1) { skipped++; continue }
        if (t.priority === 'medium' && counts.medium >= 3) { skipped++; continue }
        if (t.priority === 'low' && counts.low >= 5) { skipped++; continue }

        try {
          await createTask({
            title: t.title,
            priority: t.priority,
            day: t.day,
            estimatedTime: t.estimatedTime,
            tags: Array.isArray(t.tags) ? t.tags : undefined,
          })
          if (t.priority === 'high') counts.high++
          else if (t.priority === 'medium') counts.medium++
          else counts.low++
        } catch {
          skipped++
        }
      }

      // Auto-clear brain dump after successful distribution
      for (const item of brainDumpItems) {
        await removeItem(item.id)
      }

      if (skipped > 0) {
        alert(`${skipped} task(s) were skipped because their day was already at the 1-3-5 capacity limit.`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert('Failed to auto-distribute: ' + message)
    } finally {
      setIsDistributing(false)
    }
  }

  if (isLoadingWeek || !currentWeek) {
    return (
      <AppLayout>
        <div className="p-8 grid grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[500px] bg-surface-container-low rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      </AppLayout>
    )
  }


  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="container-responsive py-responsive flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 shrink-0">
          <div className="space-y-1 w-full sm:w-auto">
            <h1 className="text-responsive-h1 font-bold tracking-tight text-on-surface leading-none">
              Week {currentWeek.weekNumber} — {currentWeek.dateRange.split('—')[1]?.trim() ?? String(currentWeek.year)}
            </h1>
            <p className="text-sm text-on-surface-variant flex items-center gap-2">
              <Calendar className="w-4 h-4 text-on-surface-variant/80 shrink-0" strokeWidth={1.5} />
              Distribution Phase: Aligning energy with impact.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
            <Button
              type="button"
              onClick={() => setMoveMode(value => !value)}
              size="sm"
              variant={moveMode ? 'secondary' : 'ghost'}
              active={moveMode}
              className="text-xs font-semibold border border-white/10 hover:border-white/20"
            >
              <Move className="w-4 h-4" strokeWidth={2} />
              {moveMode ? 'Move Mode On' : 'Move Mode'}
            </Button>
            <Button
              type="button"
              onClick={openAssignModal}
              disabled={brainDumpItems.length === 0}
              size="sm"
              variant="secondary"
              className={brainDumpItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <Brain className="w-4 h-4" strokeWidth={2} />
              Assign Braindump
            </Button>
            <Button
              type="button"
              onClick={() => setShowTags(s => !s)}
              size="sm"
              variant="ghost"
              className="text-xs font-semibold border border-white/10 hover:border-white/20"
            >
              <Tag className="w-4 h-4" strokeWidth={2} />
              {showTags ? 'Hide Tags' : 'Show Tags'}
            </Button>
            <Button
              type="button"
              onClick={handleAutoDistribute}
              disabled={isDistributing || brainDumpItems.length === 0}
              size="sm"
              variant="primary"
              className={isDistributing || brainDumpItems.length === 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}
            >
              {isDistributing ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
              ) : (
                <Sparkles className="w-4 h-4" strokeWidth={2} />
              )}
              {isDistributing ? 'Distributing...' : 'Auto-distribute'}
            </Button>
          </div>
        </div>

        {/* Day grid */}
        <div className="flex-1 container-responsive pb-8 overflow-y-auto custom-scrollbar">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
              {currentWeek.days.map((dayData) => (
                <BorderGlow
                  key={dayData.day}
                  edgeSensitivity={30}
                  glowColor="40 80 80"
                  backgroundColor="transparent"
                  borderRadius={18}
                  glowRadius={40}
                  glowIntensity={1}
                  coneSpread={25}
                  animated={false}
                  colors={['#c084fc', '#f472b6', '#38bdf8']}
                >
                  <DayCardDistribution
                    day={{
                      ...dayData,
                      isRestDay: (restDays || []).includes(dayData.day)
                    }}
                    isHighOutputZone={false}
                    showTags={showTags}
                    moveMode={moveMode}
                    onOpenMoveModal={openMoveModal}
                    onRequestDayComplete={requestDayComplete}
                  />
                </BorderGlow>
              ))}
            </div>
            <DragOverlay>
              {activeDragTask ? (
                <div className="max-w-xs rounded-xl border border-primary/40 bg-surface-container-highest px-4 py-3 shadow-2xl">
                  <BidiText as="p" text={activeDragTask.title} className="text-sm font-bold text-on-surface" />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center sm:p-6">
            <div className="w-full max-w-5xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[85vh] flex flex-col overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border border-white/10 bg-surface-container shadow-2xl">
              <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 mt-[var(--safe-top,0px)]">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Assign Braindump Tasks</h3>
                  <p className="text-xs text-on-surface-variant hidden sm:block">Choose day + priority for each task, then add selected tasks to weekly distribution.</p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-3 sm:p-2 touch-target rounded-lg hover:bg-white/10 text-on-surface-variant"
                  title="Close"
                >
                  <X className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
                {assignDrafts.map((draft) => (
                  <div key={draft.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-3 items-start sm:items-center p-4 sm:p-3 rounded-xl border border-white/10 bg-surface-container-low">
                    <div className="sm:col-span-1 flex items-center gap-3 sm:justify-center">
                      <input
                        type="checkbox"
                        checked={draft.selected}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, selected: e.target.checked } : d))}
                        className="w-5 h-5 sm:w-4 sm:h-4 shrink-0 rounded touch-target sm:min-h-0 sm:min-w-0"
                      />
                      <BidiText as="p" text={draft.title} className="text-base sm:text-sm font-medium text-on-surface sm:hidden truncate" />
                    </div>
                    <div className="sm:col-span-5 min-w-0 hidden sm:block">
                      <BidiText as="p" text={draft.title} className="text-sm font-medium text-on-surface truncate" />
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {draft.tags.length === 0 ? (
                          <span className="text-[10px] text-on-surface-variant">No tags</span>
                        ) : draft.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-surface-container-high text-[9px] text-on-surface-variant rounded uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="sm:hidden w-full flex items-center gap-1.5 flex-wrap pl-8">
                       {draft.tags.length === 0 ? (
                          <span className="text-[10px] text-on-surface-variant">No tags</span>
                        ) : draft.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-surface-container-high text-[9px] text-on-surface-variant rounded uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                    </div>
                    <div className="sm:col-span-3 flex sm:block gap-3 pl-8 sm:pl-0 mt-1 sm:mt-0">
                      <select
                        value={draft.day}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, day: e.target.value as DayOfWeek } : d))}
                        className="w-full bg-surface-container-high rounded-lg px-3 py-3 sm:py-2 text-sm sm:text-xs outline-none touch-target sm:min-h-0"
                      >
                        {currentWeek.days.map(day => (
                          <option key={day.day} value={day.day}>
                            {day.shortName} {day.date}{(restDays || []).includes(day.day) ? ' (Rest)' : ''}
                          </option>
                        ))}
                      </select>
                      <select
                        value={draft.priority}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, priority: e.target.value as Priority } : d))}
                        className="w-full sm:hidden bg-surface-container-high rounded-lg px-3 py-3 text-sm outline-none touch-target"
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                      </select>
                    </div>
                    <div className="hidden sm:block sm:col-span-3">
                      <select
                        value={draft.priority}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, priority: e.target.value as Priority } : d))}
                        className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-xs outline-none touch-target sm:min-h-0"
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 sm:px-6 py-4 sm:py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 pb-[calc(1rem+var(--safe-bottom))] sm:pb-4">
                <span className="text-sm sm:text-xs text-on-surface-variant w-full sm:w-auto text-center sm:text-left">
                  {assignDrafts.filter(d => d.selected).length} selected
                </span>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    size="sm"
                    variant="ghost"
                    className="flex-1 sm:flex-none text-sm sm:text-xs font-semibold border border-white/10 hover:border-white/20 touch-target"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAssignBrainDump}
                    disabled={isAssigning || assignDrafts.every(d => !d.selected)}
                    size="sm"
                    variant="primary"
                    className={cn(
                      'flex-1 sm:flex-none touch-target text-sm sm:text-xs',
                      (isAssigning || assignDrafts.every(d => !d.selected)) ? 'opacity-50 cursor-not-allowed' : ''
                    )}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Selected'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {moveModalTask && currentWeek && (
          <MoveTaskModal
            task={moveModalTask}
            currentWeek={currentWeek}
            target={moveTarget}
            restDays={(restDays || []) as DayOfWeek[]}
            error={moveError}
            isMoving={isMovingTask}
            onTargetChange={(target) => {
              setMoveTarget(target)
              setMoveError(null)
            }}
            onClose={() => {
              setMoveModalTask(null)
              setMoveError(null)
            }}
            onMove={() => void handleMoveTask(moveModalTask)}
          />
        )}

        {reviewDay && (
          <EndDayReviewModal
            day={reviewDay}
            onClose={() => setReviewDay(null)}
          />
        )}
      </div>
    </AppLayout>
  )
}
