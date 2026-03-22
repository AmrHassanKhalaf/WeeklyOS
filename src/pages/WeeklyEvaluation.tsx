import { AppLayout } from '../components/layout/AppLayout'
import { useWeekStore } from '../store/useWeekStore'

export function WeeklyEvaluation() {
  const { currentWeek, isLoadingWeek } = useWeekStore()

  if (isLoadingWeek || !currentWeek) {
    return (
      <AppLayout aiVariant="evaluation">
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4 h-40 bg-surface-container-low rounded-xl animate-pulse" />
            <div className="col-span-8 h-40 bg-surface-container-low rounded-xl animate-pulse" />
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate real stats from the week's tasks
  const score = currentWeek.score
  const weekdays = currentWeek.days.slice(0, 5) // Mon–Fri

  const dailyStats = weekdays.map(d => {
    const total = (d.highTask ? 1 : 0) + d.mediumTasks.length + d.smallTasks.length
    const done = [d.highTask, ...d.mediumTasks, ...d.smallTasks]
      .filter(Boolean)
      .filter(t => t?.status === 'done').length
    return { day: d.shortName.toUpperCase(), completed: done, planned: total }
  })

  const maxPlanned = Math.max(...dailyStats.map(d => d.planned), 1)

  return (
    <AppLayout aiVariant="evaluation">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <header className="mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Weekly Evaluation</h2>
          <p className="text-on-surface-variant">Reviewing {currentWeek.dateRange}. Clarity leads to mastery.</p>
        </header>

        {/* Bento Grid Metrics */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          {/* Score Card */}
          <div className="col-span-4 bg-surface-container-low p-6 rounded-xl flex flex-col justify-between">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant">Weekly Score</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-primary">{score}%</span>
              <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-container to-primary" style={{ width: `${score}%` }} />
            </div>
            <div className="mt-3 text-[10px] text-neutral-500">
              {currentWeek.totalCompleted} / {currentWeek.totalPlanned} tasks completed
            </div>
          </div>

          {/* Bar Chart */}
          <div className="col-span-8 bg-surface-container-low p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs uppercase tracking-widest text-on-surface-variant">Completed vs. Planned</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[10px] text-on-surface-variant uppercase">Done</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-surface-variant" /><span className="text-[10px] text-on-surface-variant uppercase">Plan</span></div>
              </div>
            </div>
            <div className="flex items-end justify-between h-24 gap-4">
              {dailyStats.map((d) => {
                const doneH = maxPlanned > 0 ? Math.round((d.completed / maxPlanned) * 80) : 0
                const plannedH = maxPlanned > 0 ? Math.round((d.planned / maxPlanned) * 80) : 0
                const gapH = Math.max(plannedH - doneH, 0)
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex flex-col-reverse h-20">
                      <div className="w-full bg-primary rounded-t-sm" style={{ height: doneH }} />
                      <div className="w-full bg-surface-variant rounded-t-sm" style={{ height: gapH }} />
                    </div>
                    <span className="text-[10px] text-on-surface-variant">{d.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Reflection Sections – editable placeholders */}
        <div className="space-y-12 pb-16">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
              </div>
              <h3 className="text-xl font-bold">What went well?</h3>
            </div>
            {currentWeek.totalCompleted > 0 ? (
              <div className="bg-surface-container-lowest border-l-2 border-tertiary p-4 rounded-r-lg">
                <p className="text-sm leading-relaxed">
                  You completed <strong>{currentWeek.totalCompleted}</strong> out of <strong>{currentWeek.totalPlanned}</strong> planned tasks this week ({score}%). Keep this momentum going.
                </p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border-l-2 border-surface-variant p-4 rounded-r-lg">
                <p className="text-sm text-neutral-500 italic">No tasks completed yet this week.</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_down</span>
              </div>
              <h3 className="text-xl font-bold">Where did I struggle?</h3>
            </div>
            {dailyStats.filter(d => d.planned > 0 && d.completed < d.planned).map(d => (
              <div key={d.day} className="bg-surface-container-lowest border-l-2 border-error p-4 rounded-r-lg mb-3 hover:bg-surface-container-low transition-colors">
                <p className="text-sm leading-relaxed">
                  <strong>{d.day}</strong>: {d.completed}/{d.planned} tasks completed.
                </p>
              </div>
            ))}
            {dailyStats.every(d => d.planned === 0 || d.completed >= d.planned) && (
              <div className="bg-surface-container-lowest border-l-2 border-surface-variant p-4 rounded-r-lg">
                <p className="text-sm text-neutral-500 italic">No incomplete days to report.</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              </div>
              <h3 className="text-xl font-bold">Lessons learned</h3>
            </div>
            <div className="bg-surface-container-high p-6 rounded-xl">
              <p className="text-sm text-neutral-500 italic">
                Reflect on the week in the AI Assistant chat →
              </p>
              <p className="text-xs text-neutral-600 mt-2">Ask the AI to help you extract lessons and patterns from your performance data.</p>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
