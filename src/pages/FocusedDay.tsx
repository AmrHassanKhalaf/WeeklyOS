import { useEffect } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { useWeekStore } from '../store/useWeekStore'
import type { Task } from '../store/useWeekStore'

export function FocusedDay() {
  const { currentWeek, isLoadingWeek, pomodoroTime, isPomodoroRunning, startPomodoro, stopPomodoro, tickPomodoro, toggleTaskComplete } = useWeekStore()


  useEffect(() => {
    if (!isPomodoroRunning) return
    const interval = setInterval(() => tickPomodoro(), 1000)
    return () => clearInterval(interval)
  }, [isPomodoroRunning, tickPomodoro])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (isLoadingWeek || !currentWeek) {
    return (
      <AppLayout>
        <div className="max-w-[720px] mx-auto px-8 py-12 space-y-8">
          <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
          <div className="h-48 bg-surface-container-low rounded-2xl animate-pulse" />
          <div className="h-32 bg-surface-container-low rounded-xl animate-pulse" />
        </div>
      </AppLayout>
    )
  }

  // Find today's day plan, fallback to first day with tasks
  const todayPlan = currentWeek.days.find(d => d.isToday)
    ?? currentWeek.days.find(d => d.highTask || d.mediumTasks.length > 0)
    ?? currentWeek.days[0]

  const mainTask = todayPlan.highTask
  const mediumTasks = todayPlan.mediumTasks
  const quickWins = todayPlan.smallTasks

  const toggleLocal = (task: Task) => toggleTaskComplete(task.id)

  return (
    <AppLayout>
      <div className="max-w-[720px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-16">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface mb-2">Focused Day</h1>
            <p className="text-on-surface-variant font-medium">
              {todayPlan.date} —{' '}
              <span className="text-primary italic">
                {todayPlan.isToday ? 'Today' : todayPlan.shortName}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-4xl font-mono font-light tracking-widest text-on-surface">{formatTime(pomodoroTime)}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mt-1">Pomodoro Timer</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => isPomodoroRunning ? stopPomodoro() : startPomodoro()}
            className="primary-gradient px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-transform text-on-primary-container"
          >
            <span className="material-symbols-outlined">{isPomodoroRunning ? 'pause' : 'play_arrow'}</span>
            {isPomodoroRunning ? 'Pause Focus' : 'Start Focus'}
          </button>
          <button className="bg-surface-container-high px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined">visibility_off</span>
            Hide Interface
          </button>
        </div>

        <div className="space-y-16">
          {/* Main Objective */}
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">Main Objective</h2>
              <span className="text-[10px] text-neutral-500">The One Thing</span>
            </div>
            {mainTask ? (
              <div
                className="bg-surface-container-low p-8 rounded-2xl border-l-4 border-primary shadow-xl cursor-pointer hover:bg-surface-container-high transition-colors"
                onClick={() => toggleLocal(mainTask)}
              >
                <div className="flex items-start gap-6">
                  <div className={`mt-1.5 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    mainTask.status === 'done' ? 'bg-primary border-primary' : 'border-primary-container hover:bg-primary-container/20'
                  }`}>
                    {mainTask.status === 'done' && (
                      <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold mb-2 ${mainTask.status === 'done' ? 'line-through opacity-50' : ''}`}>{mainTask.title}</h3>
                    {mainTask.description && (
                      <p className="text-on-surface-variant leading-relaxed max-w-md">{mainTask.description}</p>
                    )}
                    <div className="mt-6">
                      <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-1 rounded uppercase">Priority: Critical</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
                <p className="text-neutral-500 italic text-sm">No high-priority task for this day yet.</p>
                <p className="text-neutral-600 text-xs mt-2">Add one in Weekly Distribution.</p>
              </div>
            )}
          </section>

          {/* Medium Tasks */}
          {mediumTasks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Medium Tasks</h2>
                <span className="text-[10px] text-neutral-500">Supporting Growth</span>
              </div>
              <div className="space-y-3">
                {mediumTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-surface-container-low p-5 rounded-xl flex items-center justify-between hover:bg-surface-container-high transition-colors group cursor-pointer"
                    onClick={() => toggleLocal(task)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        task.status === 'done' ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-primary'
                      }`}>
                        {task.status === 'done' && (
                          <span className="material-symbols-outlined text-on-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        )}
                      </div>
                      <span className={`font-medium text-on-surface ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                    </div>
                    {task.estimatedTime && <span className="text-[10px] font-mono text-neutral-500 uppercase">{task.estimatedTime}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Wins */}
          {quickWins.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Quick Wins</h2>
                <span className="text-[10px] text-neutral-500">Administrative Maintenance</span>
              </div>
              <div className="grid grid-cols-1 gap-0">
                {quickWins.map(task => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => toggleLocal(task)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-lg ${task.status === 'done' ? 'text-tertiary' : 'text-neutral-600'}`}
                        style={task.status === 'done' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        {task.status === 'done' ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className={`text-sm text-on-surface-variant group-hover:text-on-surface ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!mainTask && mediumTasks.length === 0 && quickWins.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-neutral-700 mb-4 block">inbox</span>
              <p className="text-neutral-500">No tasks scheduled for today.</p>
              <p className="text-neutral-600 text-sm mt-1">Go to Weekly Distribution to assign tasks to this day.</p>
            </div>
          )}

          {/* Day Complete */}
          <section className="pt-12 pb-24 text-center">
            <button className="bg-tertiary-container/20 text-tertiary border border-tertiary/20 px-10 py-4 rounded-xl font-bold group hover:bg-tertiary-container/40 transition-all">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl mb-1 group-hover:scale-125 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span>Day Complete</span>
                <span className="text-[10px] font-normal uppercase tracking-widest text-tertiary/60">Finalize All Progress</span>
              </div>
            </button>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
