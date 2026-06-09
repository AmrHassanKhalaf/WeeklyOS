import { useMemo, useState } from 'react'
import { ArrowRight, Brain, CheckCircle2, X } from 'lucide-react'
import { Button } from './ui/Button'
import { BidiText } from './ui/BidiText'
import { cn } from '../lib/cn'
import { useWeekStore } from '../store/useWeekStore'
import type { DayOfWeek, Priority, Task, WeekData } from '../store/useWeekStore'

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

function getPendingTasks(dayTasks: Array<Task | undefined>): Task[] {
  return dayTasks.filter((task): task is Task => !!task && task.status === 'pending')
}

export function EndDayReviewModal({ day, onClose }: { day: DayOfWeek; onClose: () => void }) {
  const currentWeek = useWeekStore(state => state.currentWeek)
  const moveTask = useWeekStore(state => state.moveTask)
  const returnTaskToBrainDump = useWeekStore(state => state.returnTaskToBrainDump)
  const markDayComplete = useWeekStore(state => state.markDayComplete)
  const [targets, setTargets] = useState<Record<string, { day: DayOfWeek; priority: Priority }>>({})
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dayPlan = currentWeek?.days.find(item => item.day === day)
  const pendingTasks = dayPlan
    ? getPendingTasks([dayPlan.highTask, ...dayPlan.mediumTasks, ...dayPlan.smallTasks])
    : []

  const nextDay = useMemo(() => {
    if (!currentWeek) return null
    const index = currentWeek.days.findIndex(item => item.day === day)
    return index >= 0 && index < currentWeek.days.length - 1 ? currentWeek.days[index + 1].day : null
  }, [currentWeek, day])

  if (!currentWeek || !dayPlan) return null

  const resolveTarget = (task: Task) => targets[task.id] ?? {
    day: nextDay ?? task.day ?? day,
    priority: task.priority,
  }

  const updateTarget = (taskId: string, updates: Partial<{ day: DayOfWeek; priority: Priority }>) => {
    setTargets(prev => {
      const task = pendingTasks.find(item => item.id === taskId)
      const current = task ? resolveTarget(task) : { day, priority: 'medium' as Priority }
      return { ...prev, [taskId]: { ...current, ...updates } }
    })
    setError(null)
  }

  const movePendingTask = async (task: Task, target: { day: DayOfWeek; priority: Priority }) => {
    setBusyTaskId(task.id)
    setError(null)
    try {
      await moveTask(task.id, target)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task')
    } finally {
      setBusyTaskId(null)
    }
  }

  const returnPendingTask = async (task: Task) => {
    setBusyTaskId(task.id)
    setError(null)
    try {
      await returnTaskToBrainDump(task.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return task to Brain Dump')
    } finally {
      setBusyTaskId(null)
    }
  }

  const completeReviewedDay = async () => {
    if (pendingTasks.length > 0 || isCompleting) return
    setIsCompleting(true)
    setError(null)
    try {
      await markDayComplete(day)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete day')
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-surface-container shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">End Day Review</p>
            <h3 className="mt-1 text-lg font-black text-on-surface">
              {dayPlan.shortName} {dayPlan.date}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Resolve pending tasks before closing the day.
            </p>
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

        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {pendingTasks.length === 0 ? (
            <div className="rounded-2xl border border-tertiary/20 bg-tertiary/5 px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-tertiary" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-bold text-on-surface">No pending tasks left.</p>
              <p className="mt-1 text-xs text-on-surface-variant">You can complete the day now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(task => {
                const target = resolveTarget(task)
                const selectedPriority = PRIORITY_OPTIONS.find(option => option.value === target.priority) ?? PRIORITY_OPTIONS[1]
                const count = getSlotCount(currentWeek, target.day, target.priority, task.id)
                const isFull = count >= selectedPriority.limit
                const busy = busyTaskId === task.id

                return (
                  <div key={task.id} className="rounded-2xl border border-white/10 bg-surface-container-low p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <BidiText as="p" text={task.title} className="text-sm font-black text-on-surface" />
                        {task.description && (
                          <BidiText as="p" text={task.description} className="mt-1 text-xs text-on-surface-variant line-clamp-2" />
                        )}
                      </div>
                      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[24rem]">
                        <select
                          value={target.day}
                          onChange={(event) => updateTarget(task.id, { day: event.target.value as DayOfWeek })}
                          className="input-base min-w-0 appearance-none text-xs"
                          disabled={busy}
                        >
                          {currentWeek.days.map(item => (
                            <option key={item.day} value={item.day}>
                              {item.shortName} {item.date}
                            </option>
                          ))}
                        </select>
                        <select
                          value={target.priority}
                          onChange={(event) => updateTarget(task.id, { priority: event.target.value as Priority })}
                          className="input-base min-w-0 appearance-none text-xs"
                          disabled={busy}
                        >
                          {PRIORITY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className={cn('text-[11px]', isFull ? 'text-error' : 'text-on-surface-variant')}>
                        {selectedPriority.label}: {count}/{selectedPriority.limit} used{isFull ? ' — full.' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={!nextDay || busy}
                          onClick={() => nextDay && void movePendingTask(task, { day: nextDay, priority: task.priority })}
                          leftIcon={<ArrowRight className="h-4 w-4" strokeWidth={1.6} />}
                        >
                          Tomorrow
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busy || isFull}
                          loading={busy}
                          onClick={() => void movePendingTask(task, target)}
                        >
                          Move
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void returnPendingTask(task)}
                          leftIcon={<Brain className="h-4 w-4" strokeWidth={1.6} />}
                        >
                          Brain Dump
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {error && <p className="mt-4 text-sm text-error">{error}</p>}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="text-xs text-on-surface-variant">
            {pendingTasks.length} pending task{pendingTasks.length === 1 ? '' : 's'} left
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isCompleting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={pendingTasks.length > 0 || isCompleting}
              loading={isCompleting}
              onClick={() => void completeReviewedDay()}
            >
              Complete Day
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
