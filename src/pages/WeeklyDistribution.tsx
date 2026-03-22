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

  const [sat, sun, mon, tue, wed, thu, fri] = currentWeek.days

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
      </div>
    </AppLayout>
  )
}
