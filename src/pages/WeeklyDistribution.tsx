import { AppLayout } from '../components/layout/AppLayout'
import { DayCardDistribution } from '../components/DayCardDistribution'
import { useWeekStore } from '../store/useWeekStore'
import type { DayOfWeek, Priority } from '../store/useWeekStore'
import { useState, useEffect } from 'react'
import { useAiApi } from '../hooks/useApi'
import { useBrainDumpStore } from '../store/useBrainDumpStore'
import { useSettingsStore } from '../store/useSettingsStore'
import BorderGlow from '../components/effects/BorderGlow'

function extractJsonFromText(raw: string) {
  const trimmed = raw.trim()
  const direct = JSON.parse(trimmed)
  if (direct) return direct
  return null
}

function parseScheduleResponse(raw: string) {
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

function inferPriorityFromTags(tags: string[] = []): Priority {
  const normalized = tags.map(t => t.toLowerCase())
  const highSignals = ['hard', 'deep', 'complex', 'strategic', 'focus', 'high', 'project']
  const lowSignals = ['easy', 'quick', 'simple', 'admin', 'routine', 'minor', 'low']

  if (normalized.some(t => highSignals.some(sig => t.includes(sig)))) return 'high'
  if (normalized.some(t => lowSignals.some(sig => t.includes(sig)))) return 'low'
  return 'medium'
}

type AssignDraft = {
  id: string
  title: string
  tags: string[]
  selected: boolean
  day: DayOfWeek
  priority: Priority
}

export function WeeklyDistribution() {
  const { currentWeek, isLoadingWeek, createTask } = useWeekStore()
  const { brainDumpItems, loadItems, removeItem } = useBrainDumpStore()
  const { restDays } = useSettingsStore()
  
  useEffect(() => {
    loadItems()
  }, [loadItems])

  const [isDistributing, setIsDistributing] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignDrafts, setAssignDrafts] = useState<AssignDraft[]>([])
  const [showTags, setShowTags] = useState(true)
  const { sendMessage } = useAiApi()

  const openAssignModal = () => {
    if (!currentWeek || brainDumpItems.length === 0) return
    const selected = brainDumpItems.filter((item: any) => item.selected)
    const sourceItems = selected.length > 0 ? selected : brainDumpItems
    const defaultDay = (currentWeek.days.find(d => !(restDays || []).includes(d.day))?.day || currentWeek.days[0]?.day || 'monday') as DayOfWeek

    setAssignDrafts(
      sourceItems.map((item: any) => ({
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
      for (const draft of toAssign) {
        await createTask({
          title: draft.title.trim(),
          priority: draft.priority,
          day: draft.day,
          tags: draft.tags,
        })
      }

      for (const draft of toAssign) {
        await removeItem(draft.id)
      }

      setIsAssignModalOpen(false)
      setAssignDrafts([])
    } catch (e: any) {
      alert('Failed to assign braindump items: ' + e.message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleAutoDistribute = async () => {
    if (!currentWeek || isDistributing || brainDumpItems.length === 0) return
    setIsDistributing(true)

    const brainDumpForPrompt = brainDumpItems
      .map((i: any) => `- ${i.content} | tags: ${(i.tags || []).join(', ') || 'none'} | suggestedPriority: ${inferPriorityFromTags(i.tags || [])}`)
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

      const tasksToCreate = parsed.tasks || (Array.isArray(parsed) ? parsed : [])

      for (const t of tasksToCreate) {
        if (!t.title || !t.priority || !t.day) continue
        await createTask({
          title: t.title,
          priority: t.priority,
          day: t.day,
          estimatedTime: t.estimatedTime,
          tags: Array.isArray(t.tags) ? t.tags : undefined,
        })
      }
      
      // Auto-clear brain dump after successful distribution
      for (const item of brainDumpItems) {
        await removeItem(item.id)
      }

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
            <button
              onClick={openAssignModal}
              disabled={brainDumpItems.length === 0}
              className={`px-4 py-2 bg-surface-container-high hover:bg-surface-variant transition-colors rounded-lg flex items-center gap-2 text-xs font-semibold ${
                brainDumpItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="material-symbols-outlined text-lg">psychology</span>
              Assign Braindump
            </button>
            <button
              onClick={() => setShowTags(s => !s)}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant transition-colors rounded-lg flex items-center gap-2 text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-lg">sell</span>
              {showTags ? 'Hide Tags' : 'Show Tags'}
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

        {/* Day grid */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-6 pb-12">
            {currentWeek.days.map((dayData) => (
              <BorderGlow
                key={dayData.day}
                edgeSensitivity={30}
                glowColor="40 80 80"
                backgroundColor="#0d0d0d"
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
                />
              </BorderGlow>
            ))}
          </div>
        </div>

        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-surface-container shadow-2xl">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Assign Braindump Tasks</h3>
                  <p className="text-xs text-on-surface-variant">Choose day + priority for each task, then add selected tasks to weekly distribution.</p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-on-surface-variant"
                  title="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 overflow-auto max-h-[62vh] space-y-3">
                {assignDrafts.map((draft) => (
                  <div key={draft.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl border border-white/10 bg-surface-container-low">
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={draft.selected}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, selected: e.target.checked } : d))}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="col-span-5 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{draft.title}</p>
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
                    <div className="col-span-3">
                      <select
                        value={draft.day}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, day: e.target.value as DayOfWeek } : d))}
                        className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-xs outline-none"
                      >
                        {currentWeek.days.map(day => (
                          <option key={day.day} value={day.day}>
                            {day.shortName} {day.date}{(restDays || []).includes(day.day) ? ' (Rest)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <select
                        value={draft.priority}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, priority: e.target.value as Priority } : d))}
                        className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-xs outline-none"
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">
                  {assignDrafts.filter(d => d.selected).length} selected
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-surface-container-high text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignBrainDump}
                    disabled={isAssigning || assignDrafts.every(d => !d.selected)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold bg-primary text-on-primary ${isAssigning || assignDrafts.every(d => !d.selected) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Selected'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
