import { AppLayout } from '../components/layout/AppLayout'
import { DayCardDistribution } from '../components/DayCardDistribution'
import { useWeekStore } from '../store/useWeekStore'

export function WeeklyDistribution() {
  const { currentWeek, isLoadingWeek } = useWeekStore()

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

  const [mon, tue, wed, thu, fri, sat, sun] = currentWeek.days

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-8 flex items-end justify-between shrink-0">
          <div className="space-y-1">
            <h1 className="text-[2.75rem] font-bold tracking-tight text-on-surface leading-none">
              Week {currentWeek.weekNumber} — {currentWeek.dateRange.split('—')[1]?.trim() ?? String(currentWeek.year)}
            </h1>
            <p className="text-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              Distribution Phase: Aligning energy with impact.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant transition-colors rounded-lg flex items-center gap-2 text-xs font-semibold">
              <span className="material-symbols-outlined text-lg">psychology</span>
              Assign Braindump
            </button>
            <button className="px-4 py-2 bg-gradient-to-br from-tertiary-container to-tertiary text-on-tertiary rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg shadow-tertiary/10 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-lg">auto_mode</span>
              Auto-distribute
            </button>
          </div>
        </div>

        {/* 2-col day grid */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-6 pb-12">
            <DayCardDistribution day={mon} />
            <DayCardDistribution day={tue} />
            <DayCardDistribution day={wed} isHighOutputZone={wed.isToday} />
            <DayCardDistribution day={thu} />
            <DayCardDistribution day={{ ...fri, isRestDay: !fri.highTask && fri.mediumTasks.length === 0 && fri.smallTasks.length === 0 }} />
            <div className="grid grid-cols-2 gap-4 h-[500px]">
              {/* Saturday */}
              <div className="bg-surface-container-low rounded-2xl border border-white/5 flex flex-col h-full">
                <div className="p-4 border-b border-white/5 flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Saturday</span>
                  <h2 className="text-lg font-bold">{sat.date}</h2>
                </div>
                <div className="p-4 space-y-2 flex-1">
                  {sat.mediumTasks.map(t => (
                    <div key={t.id} className="bg-surface-container-highest p-3 rounded-lg text-xs">{t.title}</div>
                  ))}
                  {sat.smallTasks.map(t => (
                    <div key={t.id} className="bg-surface-container-highest p-3 rounded-lg text-xs italic text-neutral-500">{t.title}</div>
                  ))}
                  {!sat.highTask && sat.mediumTasks.length === 0 && sat.smallTasks.length === 0 && (
                    <div className="flex-1 border border-dashed border-white/5 rounded-xl" />
                  )}
                </div>
              </div>
              {/* Sunday */}
              <div className="bg-surface-container-low rounded-2xl border border-white/5 flex flex-col h-full">
                <div className="p-4 border-b border-white/5 flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Sunday</span>
                  <h2 className="text-lg font-bold">{sun.date}</h2>
                </div>
                <div className="p-4 space-y-2 flex-1">
                  {sun.mediumTasks.map(t => (
                    <div key={t.id} className="bg-surface-container-highest p-3 rounded-lg text-xs">{t.title}</div>
                  ))}
                  {sun.smallTasks.map(t => (
                    <div key={t.id} className="bg-surface-container-highest p-3 rounded-lg text-xs italic text-neutral-500">{t.title}</div>
                  ))}
                  {!sun.highTask && sun.mediumTasks.length === 0 && sun.smallTasks.length === 0 && (
                    <div className="flex-1 border border-dashed border-white/5 rounded-xl" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
