import { AppLayout } from '../components/layout/AppLayout'
import { DayCardDistribution } from '../components/DayCardDistribution'
import { useWeekStore } from '../store/useWeekStore'
import { useState } from 'react'
import { useAiApi } from '../hooks/useApi'

export function WeeklyDistribution() {
  const { currentWeek, isLoadingWeek, brainDumpItems, createTask, toggleBrainDumpSelection, deleteSelectedBrainDumpItems } = useWeekStore()
  const [isDistributing, setIsDistributing] = useState(false)
  const { sendMessage } = useAiApi()

  const handleAutoDistribute = async () => {
    if (!currentWeek || isDistributing || brainDumpItems.length === 0) return
    setIsDistributing(true)
    
    const prompt = `Your job is to convert a brain dump into a structured weekly plan using the 1-3-5 productivity system.
    
Rules:
- 1 main task per day (High priority)
- 3 medium tasks (Medium priority)
- 5 small tasks (Low priority)

Input:
Brain dump items: ${brainDumpItems.map(i => i.title).join(', ')}

Output requirements:
Return exactly one JSON object with a "tasks" array.
Each object in the array MUST have:
- title: string
- priority: "high" | "medium" | "low"
- day: "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday"
- estimatedTime: optional string (e.g. "1h", "30m")

Make sure:
- Avoid overloading any day
- Balance workload logically
- DO NOT assign tasks to "friday" (REST DAY)`

    try {
      const res = await sendMessage('schedule', prompt, { dateRange: currentWeek.dateRange })
      
      let parsed
      try {
        parsed = JSON.parse(res.response)
      } catch {
         const matched = res.response.match(/```json\n([\s\S]*)\n```/);
         parsed = JSON.parse(matched ? matched[1] : res.response.replace(/```json|```/g, ''))
      }

      const tasksToCreate = parsed.tasks || (Array.isArray(parsed) ? parsed : [])
      for (const t of tasksToCreate) {
        if (!t.title || !t.priority || !t.day) continue
        await createTask({
          title: t.title,
          priority: t.priority,
          day: t.day,
          estimatedTime: t.estimatedTime
        })
      }
      
      // Auto-clear brain dump after successful distribution
      brainDumpItems.forEach(item => {
        if (!item.selected) toggleBrainDumpSelection(item.id)
      })
      await deleteSelectedBrainDumpItems()

    } catch (e: any) {
      alert("Failed to auto-distribute: " + e.message)
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
            <button 
              onClick={handleAutoDistribute}
              disabled={isDistributing || brainDumpItems.length === 0}
              className={`px-4 py-2 bg-gradient-to-br from-tertiary-container to-tertiary text-on-tertiary rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg shadow-tertiary/10 transition-all ${
                isDistributing || brainDumpItems.length === 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:brightness-110'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${isDistributing ? 'animate-spin' : ''}`}>
                {isDistributing ? 'sync' : 'auto_mode'}
              </span>
              {isDistributing ? 'Distributing...' : 'Auto-distribute'}
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
