import { forwardRef } from 'react'
import { useWeekStore } from '../store/useWeekStore'
import { DayCardDistribution } from './DayCardDistribution'

export const WeeklyReportPrintView = forwardRef<HTMLDivElement>((_, ref) => {
  const { currentWeek } = useWeekStore()

  if (!currentWeek) return null

  const [sat, sun, mon, tue, wed, thu, fri] = currentWeek.days

  const score = currentWeek.score
  const weekdays = currentWeek.days.slice(0, 5) // Mon-Fri
  const dailyStats = weekdays.map(d => {
    const total = (d.highTask ? 1 : 0) + d.mediumTasks.length + d.smallTasks.length
    const done = [d.highTask, ...d.mediumTasks, ...d.smallTasks]
      .filter(Boolean)
      .filter(t => t?.status === 'done').length
    return { day: d.shortName.toUpperCase(), completed: done, planned: total }
  })
  const maxPlanned = Math.max(...dailyStats.map(d => d.planned), 1)

  return (
    <div
      ref={ref}
      // Fixed width to ensure print layout is consistent regardless of viewport
      className="bg-[#131313] text-[#e5e2e1] w-[1200px] p-12 flex flex-col gap-12 font-['Inter']"
      style={{
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <div className="absolute top-8 right-8 flex items-center gap-2 opacity-50">
        <span className="material-symbols-outlined text-sm">dashboard</span>
        <span className="text-xs font-bold tracking-widest uppercase">WeeklyOS Report</span>
      </div>

      {/* Part 1: Weekly Distribution */}
      <div>
        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight leading-none mb-2">
            Week {currentWeek.weekNumber} — {currentWeek.dateRange.split('—')[1]?.trim() ?? String(currentWeek.year)}
          </h1>
          <p className="text-sm text-neutral-400">Weekly Plan Distribution</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <DayCardDistribution day={sat} />
          <DayCardDistribution day={sun} />
          <DayCardDistribution day={mon} />
          <DayCardDistribution day={tue} />
          <DayCardDistribution day={wed} isHighOutputZone={wed.isToday} />
          <DayCardDistribution day={thu} />
          <div className="col-span-2">
            <DayCardDistribution day={fri} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-8" />

      {/* Part 2: Weekly Evaluation */}
      <div>
        <header className="mb-8">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Weekly Evaluation</h2>
          <p className="text-neutral-400">Reviewing {currentWeek.dateRange}</p>
        </header>
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-4 bg-[#1C1B1B] p-6 rounded-xl flex flex-col justify-between">
            <span className="text-xs uppercase tracking-widest text-neutral-500">Weekly Score</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-[#2f5cff]">{score}%</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-[#353534] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#b8c3ff] to-[#2f5cff]" style={{ width: `${score}%` }} />
            </div>
            <div className="mt-3 text-[10px] text-neutral-500">
              {currentWeek.totalCompleted} / {currentWeek.totalPlanned} tasks completed
            </div>
          </div>
          <div className="col-span-8 bg-[#1C1B1B] p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Completed vs. Planned</span>
            </div>
            <div className="flex items-end justify-between h-24 gap-4">
              {dailyStats.map((d) => {
                const doneH = maxPlanned > 0 ? Math.round((d.completed / maxPlanned) * 80) : 0
                const plannedH = maxPlanned > 0 ? Math.round((d.planned / maxPlanned) * 80) : 0
                const gapH = Math.max(plannedH - doneH, 0)
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex flex-col-reverse h-20">
                      <div className="w-full bg-[#2f5cff] rounded-t-sm" style={{ height: doneH }} />
                      <div className="w-full bg-[#353534] rounded-t-sm" style={{ height: gapH }} />
                    </div>
                    <span className="text-[10px] text-neutral-500">{d.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
WeeklyReportPrintView.displayName = 'WeeklyReportPrintView'
