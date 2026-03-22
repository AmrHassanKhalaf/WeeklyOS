import { AppLayout } from '../components/layout/AppLayout'
import { DayCard } from '../components/DayCard'
import { useWeekStore } from '../store/useWeekStore'
import { useAiApi } from '../hooks/useApi'
import { useState } from 'react'

function LoadingCard() {
  return (
    <div className="rounded-xl bg-surface-container-low border border-white/5 h-32 animate-pulse" />
  )
}

export function Dashboard() {
  const { currentWeek, isLoadingWeek } = useWeekStore()
  const { sendMessage } = useAiApi()
  const [insight, setInsight] = useState<string>('')
  const [isInsightLoading, setIsInsightLoading] = useState(false)

  const fetchInsight = async () => {
    if (!currentWeek || isInsightLoading) return
    setIsInsightLoading(true)
    const context = { title: currentWeek.title, score: currentWeek.score, completed: currentWeek.totalCompleted, planned: currentWeek.totalPlanned }
    try {
      const res = await sendMessage('insight', 'Give me a very short 2-sentence encouraging insight about my productivity this week based on the context data. Do not use quotes.', context)
      setInsight(res.response)
    } catch {
      setInsight("You're on track. Batch your remaining tasks to clear your schedule.")
    } finally {
      setIsInsightLoading(false)
    }
  }

  const deepWorkData = currentWeek ? currentWeek.days.map(d => {
    let completedCount = 0
    if (d.highTask?.status === 'done') completedCount++
    completedCount += d.mediumTasks.filter(t => t.status === 'done').length
    completedCount += d.smallTasks.filter(t => t.status === 'done').length

    return {
      day: d.shortName.charAt(0),
      height: Math.min(160, 24 + (completedCount * 32)),
      isToday: !!d.isToday
    }
  }) : []

  if (isLoadingWeek || !currentWeek) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </AppLayout>
    )
  }

  const [sat, sun, mon, tue, wed, thu, fri] = currentWeek.days

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-8 space-y-12">
        {/* Hero Stats */}
        <section className="flex justify-between items-end gap-8">
          <div className="flex-1">
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">{currentWeek.title}</h2>
            <p className="text-on-surface-variant max-w-lg">
              {currentWeek.dateRange}. Week {currentWeek.weekNumber} status: Optimal. Strategic objectives are pacing 12% ahead of quarterly projections.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Week Score</p>
              <p className="text-3xl font-mono font-bold text-tertiary">{currentWeek.score}/100</p>
            </div>
            <div className="w-px h-10 bg-surface-variant" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Completed</p>
              <p className="text-3xl font-mono font-bold text-primary">{currentWeek.totalCompleted}/{currentWeek.totalPlanned}</p>
            </div>
          </div>
        </section>

        {/* Weekly Challenge */}
        {currentWeek.challengeTitle && (
          <section>
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">emoji_events</span>
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Weekly Challenge</span>
                    <span className="w-1 h-1 rounded-full bg-primary/40" />
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                      Ends in {currentWeek.challengeEndsIn}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">{currentWeek.challengeTitle}</h3>
                </div>
                <div className="w-full md:w-64 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                    <span>Progress</span>
                    <span>{currentWeek.challengeProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${currentWeek.challengeProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Day Cards */}
        <section className="space-y-6">
          <DayCard day={sat} />
          <DayCard day={sun} />
          <div className="grid grid-cols-2 gap-6">
            <DayCard day={mon} isCompact />
            <DayCard day={tue} isCompact />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <DayCard day={wed} isCompact />
            <DayCard day={thu} isCompact />
          </div>
          <DayCard day={{...fri, isRestDay: true}} isCompact />
        </section>

        {/* Bottom Stats */}
        <section className="grid grid-cols-3 gap-8 pb-12">
          <div className="col-span-2 bg-surface-container-low rounded-xl p-8 border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">Deep Work Distribution</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-xs text-on-surface-variant">Focus</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-tertiary" /><span className="text-xs text-on-surface-variant">Admin</span></div>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-4 px-4">
              {deepWorkData.map((d, i) => (
                <div key={i} className="flex-1 space-y-2 group">
                  <div className="w-full bg-primary/30 rounded-sm" style={{ height: d.height }} />
                  <p className={`text-center text-[10px] font-bold ${d.isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{d.day}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-tertiary-container text-on-tertiary-container rounded-xl p-8 relative overflow-hidden flex flex-col">
            <span className="material-symbols-outlined absolute top-[-20px] right-[-20px] text-9xl opacity-10 rotate-12">bolt</span>
            <h3 className="text-xl font-bold mb-4">Focus Mode</h3>
            <p className="text-sm opacity-90 mb-8 leading-relaxed">
              {isInsightLoading ? 'Analyzing week data...' : (insight || "You're on track. Batch your remaining tasks to clear your schedule.")}
            </p>
            <div className="mt-auto">
              <button 
                onClick={fetchInsight}
                disabled={isInsightLoading}
                className="w-full bg-on-tertiary-container text-tertiary-container py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {isInsightLoading ? 'Generating...' : 'Analyze My Week'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
