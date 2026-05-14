import { AppLayout } from '../components/layout/AppLayout'
import { DayCardDistribution } from '../components/DayCardDistribution'
import { useWeekStore } from '../store/useWeekStore'
import type { DayOfWeek, Priority } from '../store/useWeekStore'
import { useState, useEffect, useMemo } from 'react'
import { useAiApi } from '../hooks/useApi'
import { useBrainDumpStore, type BrainDumpItem } from '../store/useBrainDumpStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { Button } from '../components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Tag, Sparkles, Loader2, X, ArrowRight, Zap, Target, Clock } from 'lucide-react'

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

type AssignDraft = {
  id: string
  title: string
  tags: string[]
  selected: boolean
  day: DayOfWeek
  priority: Priority
}

// Timeline position helper
function getDayPosition(index: number, total: number, isToday: boolean): { scale: number; yOffset: number; zIndex: number } {
  if (isToday) {
    return { scale: 1, yOffset: 0, zIndex: 50 }
  }
  // Create a wave pattern
  const normalizedPos = index / (total - 1)
  const wave = Math.sin(normalizedPos * Math.PI) * 0.05
  return { 
    scale: 0.92 + wave, 
    yOffset: Math.abs(index - 3) * 4,
    zIndex: 10 - Math.abs(index - 3)
  }
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
  const [activeDay, setActiveDay] = useState<DayOfWeek | null>(null)
  const { sendMessage } = useAiApi()

  // Find today's day
  const todayIndex = useMemo(() => {
    if (!currentWeek) return -1
    return currentWeek.days.findIndex(d => d.isToday)
  }, [currentWeek])

  // Calculate week stats
  const weekStats = useMemo(() => {
    if (!currentWeek) return { total: 0, completed: 0, highPriority: 0 }
    let total = 0, completed = 0, highPriority = 0
    currentWeek.days.forEach(day => {
      if (day.highTask) {
        total++
        highPriority++
        if (day.highTask.status === 'done') completed++
      }
      day.mediumTasks.forEach(t => {
        total++
        if (t.status === 'done') completed++
      })
      day.smallTasks.forEach(t => {
        total++
        if (t.status === 'done') completed++
      })
    })
    return { total, completed, highPriority }
  }, [currentWeek])

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

      for (const t of tasksToCreate) {
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-primary/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant font-bold">Loading Week</p>
              <div className="h-1 w-32 bg-surface-container-high rounded-full overflow-hidden mx-auto">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Oversized Week Number - Background Typography */}
        <div className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden">
          <motion.span 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 0.03, x: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="text-[28rem] font-black tracking-tighter leading-none text-on-surface"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {currentWeek.weekNumber}
          </motion.span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-8 lg:px-12 py-8">
          
          {/* Hero Header - Asymmetric Layout */}
          <header className="mb-16">
            <div className="grid grid-cols-12 gap-6 items-end">
              {/* Left - Week Identity */}
              <div className="col-span-7 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <p className="text-xs uppercase tracking-[0.4em] text-primary font-black mb-3 flex items-center gap-3">
                    <span className="w-12 h-px bg-gradient-to-r from-primary to-transparent" />
                    Distribution Phase
                  </p>
                  <h1 className="text-6xl lg:text-7xl font-black tracking-tight text-on-surface leading-[0.9]">
                    Week <span className="gradient-text">{currentWeek.weekNumber}</span>
                  </h1>
                  <p className="text-lg text-on-surface-variant mt-4 max-w-md">
                    {currentWeek.dateRange}
                  </p>
                </motion.div>
              </div>

              {/* Right - Stats & Actions */}
              <div className="col-span-5 flex flex-col items-end gap-6">
                {/* Floating Stats */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-center gap-8"
                >
                  <div className="text-right">
                    <p className="text-4xl font-mono font-black text-tertiary">
                      {weekStats.completed}
                      <span className="text-on-surface-variant/40">/{weekStats.total}</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Tasks Complete</p>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-transparent via-outline-variant to-transparent" />
                  <div className="text-right">
                    <p className="text-4xl font-mono font-black text-secondary">
                      {weekStats.highPriority}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">High Impact</p>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex gap-3"
                >
                  <Button
                    type="button"
                    onClick={() => setShowTags(s => !s)}
                    size="sm"
                    variant="ghost"
                    className="text-xs font-bold uppercase tracking-wider border border-white/10"
                  >
                    <Tag className="w-3.5 h-3.5" strokeWidth={2.5} />
                    {showTags ? 'Hide' : 'Show'} Tags
                  </Button>
                  <Button
                    type="button"
                    onClick={openAssignModal}
                    disabled={brainDumpItems.length === 0}
                    size="sm"
                    variant="secondary"
                    className="text-xs font-bold uppercase tracking-wider"
                  >
                    <Brain className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Assign
                    {brainDumpItems.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-primary/20 rounded text-[10px]">
                        {brainDumpItems.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAutoDistribute}
                    disabled={isDistributing || brainDumpItems.length === 0}
                    size="sm"
                    variant="primary"
                    className="text-xs font-bold uppercase tracking-wider"
                  >
                    {isDistributing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
                    )}
                    {isDistributing ? 'Processing' : 'Auto-Distribute'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </header>

          {/* Timeline Navigation - Horizontal Day Selector */}
          <motion.nav 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8 overflow-x-auto hide-scrollbar"
          >
            <div className="flex items-center gap-2 min-w-max pb-2">
              {currentWeek.days.map((dayData, i) => {
                const isToday = dayData.isToday
                const isRestDay = (restDays || []).includes(dayData.day)
                const isActive = activeDay === dayData.day
                const taskCount = (dayData.highTask ? 1 : 0) + dayData.mediumTasks.length + dayData.smallTasks.length
                const completedCount = (dayData.highTask?.status === 'done' ? 1 : 0) + 
                  dayData.mediumTasks.filter(t => t.status === 'done').length + 
                  dayData.smallTasks.filter(t => t.status === 'done').length

                return (
                  <motion.button
                    key={dayData.day}
                    onClick={() => setActiveDay(activeDay === dayData.day ? null : dayData.day)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.05 * i }}
                    className={`
                      relative group px-5 py-3 rounded-xl transition-all duration-300
                      ${isToday 
                        ? 'bg-gradient-to-br from-primary/20 to-secondary/10 border-2 border-primary/40' 
                        : isRestDay
                          ? 'bg-tertiary/5 border border-tertiary/20 hover:border-tertiary/40'
                          : isActive
                            ? 'bg-surface-container-high border border-primary/30'
                            : 'bg-surface-container-low/50 border border-white/5 hover:border-white/15'
                      }
                    `}
                  >
                    {/* Today Indicator */}
                    {isToday && (
                      <motion.div 
                        layoutId="today-indicator"
                        className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary rounded-full"
                      >
                        <span className="text-[8px] font-black uppercase tracking-wider text-on-primary">Today</span>
                      </motion.div>
                    )}
                    
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] uppercase tracking-widest font-bold ${isToday ? 'text-primary' : isRestDay ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                        {dayData.shortName}
                      </span>
                      <span className={`text-lg font-black ${isToday ? 'text-on-surface' : 'text-on-surface/80'}`}>
                        {dayData.date}
                      </span>
                      
                      {/* Progress indicator */}
                      {!isRestDay && taskCount > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: Math.min(taskCount, 5) }).map((_, j) => (
                            <div 
                              key={j} 
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                j < completedCount ? 'bg-tertiary' : 'bg-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      
                      {isRestDay && (
                        <span className="text-[9px] text-tertiary font-medium mt-0.5">Rest</span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.nav>

          {/* Day Cards - Staggered Masonry Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-auto">
            {currentWeek.days.map((dayData, i) => {
              const isToday = dayData.isToday
              const isRestDay = (restDays || []).includes(dayData.day)
              const { scale, yOffset, zIndex } = getDayPosition(i, currentWeek.days.length, isToday)
              const shouldShow = activeDay === null || activeDay === dayData.day

              return (
                <AnimatePresence key={dayData.day} mode="popLayout">
                  {shouldShow && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ 
                        opacity: 1, 
                        y: yOffset, 
                        scale: activeDay === dayData.day ? 1 : scale 
                      }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ 
                        type: 'spring', 
                        damping: 25, 
                        stiffness: 300,
                        delay: activeDay === null ? i * 0.05 : 0
                      }}
                      style={{ zIndex }}
                      className={`
                        ${isToday ? 'lg:col-span-2 xl:col-span-1' : ''}
                        ${activeDay === dayData.day ? 'lg:col-span-2' : ''}
                      `}
                    >
                      {/* Glow wrapper for today */}
                      <div className={`
                        relative rounded-2xl overflow-hidden
                        ${isToday ? 'ring-2 ring-primary/30 shadow-[0_0_60px_-15px_rgba(167,139,250,0.4)]' : ''}
                      `}>
                        {/* Today badge */}
                        {isToday && (
                          <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent z-10" />
                        )}
                        
                        <DayCardDistribution 
                          day={{
                            ...dayData,
                            isRestDay
                          }}
                          isHighOutputZone={false}
                          showTags={showTags}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )
            })}
          </section>

          {/* Bottom Status Bar */}
          <motion.footer 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 pb-8"
          >
            <div className="flex items-center justify-between py-4 border-t border-white/5">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <Target className="w-4 h-4 text-primary" strokeWidth={2} />
                  <span className="font-medium">{weekStats.highPriority} High Impact Tasks</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <Zap className="w-4 h-4 text-secondary" strokeWidth={2} />
                  <span className="font-medium">{Math.round((weekStats.completed / Math.max(weekStats.total, 1)) * 100)}% Complete</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <Clock className="w-4 h-4 text-tertiary" strokeWidth={2} />
                  <span className="font-medium">{restDays.length} Rest Days</span>
                </div>
              </div>
              
              <p className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant/60 font-bold">
                1-3-5 Productivity System
              </p>
            </div>
          </motion.footer>
        </div>

        {/* Assign Modal */}
        <AnimatePresence>
          {isAssignModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-surface-container shadow-2xl"
              >
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                  <div>
                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Assign Tasks</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Map braindump items to your weekly distribution</p>
                  </div>
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="p-3 rounded-xl hover:bg-white/10 text-on-surface-variant transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-auto max-h-[60vh] space-y-3">
                  {assignDrafts.map((draft, i) => (
                    <motion.div 
                      key={draft.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`
                        grid grid-cols-12 gap-4 items-center p-4 rounded-2xl border transition-all
                        ${draft.selected 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-surface-container-low border-white/5 opacity-60'
                        }
                      `}
                    >
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={draft.selected}
                          onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, selected: e.target.checked } : d))}
                          className="w-5 h-5 rounded-md border-2 border-primary/40 bg-transparent checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                        />
                      </div>
                      <div className="col-span-5 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{draft.title}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {draft.tags.length === 0 ? (
                            <span className="text-[10px] text-on-surface-variant/60">No tags</span>
                          ) : draft.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-surface-container-high text-[10px] text-on-surface-variant rounded-full uppercase tracking-wider font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <select
                          value={draft.day}
                          onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, day: e.target.value as DayOfWeek } : d))}
                          className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-sm font-medium outline-none border border-white/10 focus:border-primary/40 transition-colors"
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
                          className={`
                            w-full rounded-xl px-4 py-2.5 text-sm font-bold outline-none border transition-colors
                            ${draft.priority === 'high' 
                              ? 'bg-secondary/10 border-secondary/30 text-secondary' 
                              : draft.priority === 'medium'
                                ? 'bg-primary/10 border-primary/30 text-primary'
                                : 'bg-surface-container-high border-white/10 text-on-surface-variant'
                            }
                          `}
                        >
                          <option value="high">High Impact</option>
                          <option value="medium">Medium</option>
                          <option value="low">Small Task</option>
                        </select>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-5 border-t border-white/10 flex items-center justify-between bg-surface-container-low/50">
                  <span className="text-sm text-on-surface-variant font-medium">
                    {assignDrafts.filter(d => d.selected).length} of {assignDrafts.length} selected
                  </span>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      size="sm"
                      variant="ghost"
                      className="text-sm font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAssignBrainDump}
                      disabled={isAssigning || assignDrafts.every(d => !d.selected)}
                      size="sm"
                      variant="primary"
                      className="text-sm font-bold"
                    >
                      {isAssigning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          Assign Tasks
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}
