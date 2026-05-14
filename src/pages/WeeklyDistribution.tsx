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
import { Brain, Tag, Sparkles, Loader2, X, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null)
  const { sendMessage } = useAiApi()

  // Find today's index
  const todayIndex = useMemo(() => {
    if (!currentWeek) return 0
    const idx = currentWeek.days.findIndex(d => d.isToday)
    return idx >= 0 ? idx : 0
  }, [currentWeek])

  // Set initial focus to today
  useEffect(() => {
    if (focusedDayIndex === null && currentWeek) {
      setFocusedDayIndex(todayIndex)
    }
  }, [todayIndex, currentWeek, focusedDayIndex])

  // Calculate week stats
  const weekStats = useMemo(() => {
    if (!currentWeek) return { total: 0, completed: 0, highPriority: 0, percentage: 0 }
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
    return { 
      total, 
      completed, 
      highPriority,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
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

  // Navigation
  const navigateDay = (direction: 'prev' | 'next') => {
    if (!currentWeek) return
    const current = focusedDayIndex ?? todayIndex
    if (direction === 'prev' && current > 0) {
      setFocusedDayIndex(current - 1)
    } else if (direction === 'next' && current < currentWeek.days.length - 1) {
      setFocusedDayIndex(current + 1)
    }
  }

  if (isLoadingWeek || !currentWeek) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-2 border-on-surface/10 border-t-primary rounded-full"
              />
            </div>
            <p className="mt-8 text-sm tracking-[0.3em] uppercase text-on-surface-variant">Loading</p>
          </motion.div>
        </div>
      </AppLayout>
    )
  }

  const focusedDay = currentWeek.days[focusedDayIndex ?? todayIndex]
  const isRestDay = (restDays || []).includes(focusedDay?.day)

  return (
    <AppLayout>
      <div className="min-h-screen relative">
        
        {/* === HERO SECTION === */}
        <section className="relative pt-8 pb-16 px-6 lg:px-12 border-b border-white/5">
          
          {/* Background Typography - Oversized Week Number */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute -right-[5%] top-1/2 -translate-y-1/2"
            >
              <span 
                className="text-[35vw] font-black leading-none text-on-surface/[0.02]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {currentWeek.weekNumber}
              </span>
            </motion.div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto">
            
            {/* Top Bar - Week Info */}
            <div className="flex items-start justify-between mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-[11px] tracking-[0.4em] uppercase text-on-surface-variant mb-2">
                  Week {currentWeek.weekNumber}
                </p>
                <p className="text-sm text-on-surface-variant/60">{currentWeek.dateRange}</p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={() => setShowTags(s => !s)}
                  className={`
                    px-4 py-2 text-[11px] tracking-[0.15em] uppercase font-medium
                    border rounded-full transition-all duration-300
                    ${showTags 
                      ? 'border-primary/40 text-primary bg-primary/5' 
                      : 'border-white/10 text-on-surface-variant hover:border-white/20'
                    }
                  `}
                >
                  <Tag className="w-3.5 h-3.5 inline-block mr-2" />
                  Tags
                </button>
                <button
                  onClick={openAssignModal}
                  disabled={brainDumpItems.length === 0}
                  className="px-4 py-2 text-[11px] tracking-[0.15em] uppercase font-medium border border-white/10 rounded-full text-on-surface-variant hover:border-white/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Brain className="w-3.5 h-3.5" />
                  Assign
                  {brainDumpItems.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary text-[10px] flex items-center justify-center font-bold">
                      {brainDumpItems.length}
                    </span>
                  )}
                </button>
                <Button
                  type="button"
                  onClick={handleAutoDistribute}
                  disabled={isDistributing || brainDumpItems.length === 0}
                  size="sm"
                  variant="primary"
                  className="text-[11px] tracking-[0.15em] uppercase font-medium rounded-full"
                >
                  {isDistributing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isDistributing ? 'Working...' : 'Auto-Distribute'}
                </Button>
              </motion.div>
            </div>

            {/* Main Hero - Split Layout */}
            <div className="grid grid-cols-12 gap-8 items-end">
              
              {/* Left - Big Typography */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="col-span-12 lg:col-span-7"
              >
                <h1 className="text-[clamp(3rem,8vw,6rem)] font-black leading-[0.9] tracking-tight text-on-surface">
                  Your Week,
                  <br />
                  <span className="gradient-text">Orchestrated.</span>
                </h1>
                <p className="mt-6 text-lg text-on-surface-variant/70 max-w-md leading-relaxed">
                  Seven days. Intentional focus. The 1-3-5 system keeps you moving without the overwhelm.
                </p>
              </motion.div>

              {/* Right - Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="col-span-12 lg:col-span-5"
              >
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center lg:text-right">
                    <p className="text-4xl lg:text-5xl font-black text-on-surface tabular-nums">
                      {weekStats.completed}
                    </p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-on-surface-variant mt-2">Done</p>
                  </div>
                  <div className="text-center lg:text-right">
                    <p className="text-4xl lg:text-5xl font-black text-primary tabular-nums">
                      {weekStats.total - weekStats.completed}
                    </p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-on-surface-variant mt-2">Remaining</p>
                  </div>
                  <div className="text-center lg:text-right">
                    <p className="text-4xl lg:text-5xl font-black text-secondary tabular-nums">
                      {weekStats.percentage}%
                    </p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-on-surface-variant mt-2">Complete</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8">
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weekStats.percentage}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                      className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === DAY NAVIGATION === */}
        <section className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between py-4">
              
              {/* Navigation Arrows */}
              <button
                onClick={() => navigateDay('prev')}
                disabled={focusedDayIndex === 0}
                className="p-2 rounded-full border border-white/10 text-on-surface-variant hover:border-white/20 hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Day Pills */}
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-4">
                {currentWeek.days.map((day, i) => {
                  const isFocused = i === (focusedDayIndex ?? todayIndex)
                  const isToday = day.isToday
                  const isDayRest = (restDays || []).includes(day.day)
                  const taskCount = (day.highTask ? 1 : 0) + day.mediumTasks.length + day.smallTasks.length
                  const completedCount = (day.highTask?.status === 'done' ? 1 : 0) + 
                    day.mediumTasks.filter(t => t.status === 'done').length + 
                    day.smallTasks.filter(t => t.status === 'done').length

                  return (
                    <motion.button
                      key={day.day}
                      onClick={() => setFocusedDayIndex(i)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative px-6 py-3 rounded-full transition-all duration-300 flex-shrink-0
                        ${isFocused 
                          ? 'bg-on-surface text-background' 
                          : isDayRest 
                            ? 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                        }
                      `}
                    >
                      {/* Today indicator */}
                      {isToday && !isFocused && (
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                      
                      <span className="text-[11px] tracking-[0.15em] uppercase font-bold">
                        {day.shortName}
                      </span>
                      <span className={`ml-2 text-sm font-medium ${isFocused ? 'text-background/70' : 'text-on-surface-variant/50'}`}>
                        {day.date}
                      </span>

                      {/* Task progress dots */}
                      {!isDayRest && taskCount > 0 && (
                        <div className={`ml-3 flex items-center gap-0.5 ${isFocused ? 'opacity-70' : ''}`}>
                          {Array.from({ length: Math.min(taskCount, 4) }).map((_, j) => (
                            <span 
                              key={j}
                              className={`w-1 h-1 rounded-full ${
                                j < completedCount 
                                  ? isFocused ? 'bg-tertiary' : 'bg-tertiary' 
                                  : isFocused ? 'bg-background/30' : 'bg-white/20'
                              }`}
                            />
                          ))}
                          {taskCount > 4 && (
                            <span className={`text-[9px] ml-1 ${isFocused ? 'text-background/50' : 'text-on-surface-variant/40'}`}>
                              +{taskCount - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => navigateDay('next')}
                disabled={focusedDayIndex === currentWeek.days.length - 1}
                className="p-2 rounded-full border border-white/10 text-on-surface-variant hover:border-white/20 hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* === FOCUSED DAY CONTENT === */}
        <section className="py-12 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={focusedDay?.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <DayCardDistribution 
                  day={{
                    ...focusedDay,
                    isRestDay
                  }}
                  showTags={showTags}
                  isExpanded
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* === WEEK OVERVIEW (Mini Cards) === */}
        <section className="py-12 px-6 lg:px-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm tracking-[0.2em] uppercase text-on-surface-variant">Week Overview</h2>
              <p className="text-xs text-on-surface-variant/50">1-3-5 System</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {currentWeek.days.map((day, i) => {
                const isDayRest = (restDays || []).includes(day.day)
                const taskCount = (day.highTask ? 1 : 0) + day.mediumTasks.length + day.smallTasks.length
                const completedCount = (day.highTask?.status === 'done' ? 1 : 0) + 
                  day.mediumTasks.filter(t => t.status === 'done').length + 
                  day.smallTasks.filter(t => t.status === 'done').length
                const isFocused = i === (focusedDayIndex ?? todayIndex)

                return (
                  <motion.button
                    key={day.day}
                    onClick={() => setFocusedDayIndex(i)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative p-4 rounded-2xl border transition-all duration-300 text-left
                      ${isFocused 
                        ? 'bg-primary/10 border-primary/30' 
                        : isDayRest 
                          ? 'bg-tertiary/5 border-tertiary/20'
                          : 'bg-surface-container-low border-white/5 hover:border-white/10'
                      }
                    `}
                  >
                    {/* Today indicator */}
                    {day.isToday && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}

                    <p className={`text-[10px] tracking-[0.2em] uppercase font-bold ${
                      isFocused ? 'text-primary' : isDayRest ? 'text-tertiary' : 'text-on-surface-variant'
                    }`}>
                      {day.shortName}
                    </p>
                    <p className="text-2xl font-black text-on-surface mt-1">{day.date}</p>
                    
                    {isDayRest ? (
                      <p className="text-[10px] text-tertiary mt-3">Rest Day</p>
                    ) : (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                            style={{ width: taskCount > 0 ? `${(completedCount / taskCount) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-[10px] text-on-surface-variant tabular-nums">
                          {completedCount}/{taskCount}
                        </span>
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </section>

        {/* === ASSIGN MODAL === */}
        <AnimatePresence>
          {isAssignModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setIsAssignModalOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-surface-container"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-on-surface">Assign Tasks</h3>
                    <p className="text-sm text-on-surface-variant/60 mt-1">Map your brain dump to the week</p>
                  </div>
                  <button
                    onClick={() => setIsAssignModalOpen(false)}
                    className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-auto max-h-[55vh] space-y-3">
                  {assignDrafts.map((draft, i) => (
                    <motion.div 
                      key={draft.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`
                        flex items-center gap-4 p-4 rounded-2xl border transition-all
                        ${draft.selected 
                          ? 'bg-white/[0.02] border-white/10' 
                          : 'bg-transparent border-white/5 opacity-50'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={draft.selected}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, selected: e.target.checked } : d))}
                        className="w-5 h-5 rounded-md border-2 border-white/20 bg-transparent checked:bg-primary checked:border-primary transition-colors cursor-pointer flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{draft.title}</p>
                        {draft.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {draft.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-white/5 text-[9px] text-on-surface-variant rounded-full uppercase tracking-wider">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <select
                        value={draft.day}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, day: e.target.value as DayOfWeek } : d))}
                        className="bg-surface-container-low rounded-xl px-3 py-2 text-sm outline-none border border-white/10 focus:border-primary/40 transition-colors"
                      >
                        {currentWeek.days.map(day => (
                          <option key={day.day} value={day.day}>
                            {day.shortName} {day.date}
                          </option>
                        ))}
                      </select>

                      <select
                        value={draft.priority}
                        onChange={(e) => setAssignDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, priority: e.target.value as Priority } : d))}
                        className={`
                          rounded-xl px-3 py-2 text-sm font-medium outline-none border transition-colors
                          ${draft.priority === 'high' 
                            ? 'bg-secondary/10 border-secondary/30 text-secondary' 
                            : draft.priority === 'medium'
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'bg-white/5 border-white/10 text-on-surface-variant'
                          }
                        `}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Small</option>
                      </select>
                    </motion.div>
                  ))}
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">
                    {assignDrafts.filter(d => d.selected).length} selected
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsAssignModalOpen(false)}
                      className="px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Cancel
                    </button>
                    <Button
                      type="button"
                      onClick={handleAssignBrainDump}
                      disabled={isAssigning || assignDrafts.every(d => !d.selected)}
                      size="sm"
                      variant="primary"
                      className="rounded-full"
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
