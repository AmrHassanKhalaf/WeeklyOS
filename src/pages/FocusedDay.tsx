import { useEffect, useRef, useState, useCallback } from 'react'
import { Check, Clock, Timer, Zap, CloudRain, X, RotateCcw, SlidersHorizontal, Pin, Star, Target, Inbox, BadgeCheck, TrendingUp, History, Play, Pause, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { useLayoutStore } from '../store/useLayoutStore'
import { useWeekStore } from '../store/useWeekStore'
import type { Task } from '../store/useWeekStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

// ── Preset definitions ────────────────────────────────────────────────────────
const PRESETS = [
  { label: '25 / 5', focus: 25, brk: 5 },
  { label: '50 / 10', focus: 50, brk: 10 },
  { label: '90 / 20', focus: 90, brk: 20 },
]

// ── Circular SVG progress ─────────────────────────────────────────────────────
function CircularProgress({ progress, phase, size = 240 }: { progress: number; phase: 'focus' | 'break'; size?: number }) {
  const stroke = 10
  const r = (size - stroke * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - progress)
  const color = phase === 'focus' ? '#8b5cf6' : '#0ea5e9'
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if (isFocusMode) setFocusMode(false)
        else setFocusMode(true, 'deep')
      } else if (e.key === 'Escape') {
        if (isFocusMode && focusLevel === 'deep') {
          e.preventDefault()
          setFocusMode(false)
        }
      } else if (e.key === ' ') {
        if (isFocusMode && focusLevel === 'deep') {
          e.preventDefault()
          handleToggle()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode, focusLevel, setFocusMode, handleToggle])

  const [showEndConfirm, setShowEndConfirm] = useState(false)
  
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r+10} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.1} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth={stroke} strokeDasharray="3 9" strokeLinecap="round" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.4s' }}
        filter={`drop-shadow(0 0 12px ${color}bb)`} />
    </svg>
  )
}


// ── Task row ──────────────────────────────────────────────────────────────────
function TaskRow({
  task,
  onToggle,
  isActive,
  onMakeActive,
  unsavedSeconds = 0,
  isDimmed,
  accentColor = 'teal',
}: {
  task: Task
  onToggle: () => void
  isActive?: boolean
  onMakeActive?: () => void
  unsavedSeconds?: number
  isDimmed?: boolean
  accentColor?: 'purple' | 'teal' | 'orange'
}) {
  const done = task.status === 'done'
  const totalSecs = (task.actualDuration || 0) + unsavedSeconds
  const mm = Math.floor(totalSecs / 60)
  const ss = (totalSecs % 60).toString().padStart(2, '0')
  const taskDuration = `${mm}m ${ss}s`

  const ringCls = isActive
    ? accentColor === 'purple'
      ? 'border-violet-500/50 bg-violet-500/[0.07] shadow-[0_0_18px_rgba(139,92,246,0.2)]'
      : accentColor === 'orange'
      ? 'border-orange-500/40 bg-orange-500/[0.06] shadow-[0_0_14px_rgba(249,115,22,0.18)]'
      : 'border-teal-500/40 bg-teal-500/[0.06] shadow-[0_0_14px_rgba(20,184,166,0.16)]'
    : done
    ? 'border-white/5 opacity-40'
    : isDimmed
    ? 'border-white/5 opacity-30 grayscale'
    : 'border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.025]'

  const durationPillCls = isActive
    ? accentColor === 'purple'
      ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
      : accentColor === 'orange'
      ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
      : 'border-teal-500/30 bg-teal-500/10 text-teal-300'
    : 'border-white/10 bg-white/5 text-neutral-500'

  const activeBtnCls =
    accentColor === 'purple'
      ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
      : accentColor === 'orange'
      ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
      : 'border-teal-500/40 bg-teal-500/10 text-teal-300'

  const dotCls =
    accentColor === 'purple' ? 'bg-violet-400' : accentColor === 'orange' ? 'bg-orange-400' : 'bg-teal-400'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${ringCls}`}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
          ${done ? 'border-neutral-600 bg-neutral-700' : 'border-neutral-600 hover:border-neutral-400'}`}
      >
        {done && <Check className="text-[11px] text-neutral-300" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />}
      </button>

      <span className={`flex-1 min-w-0 text-sm font-medium truncate ${done ? 'line-through text-neutral-600' : 'text-neutral-200'}`}>
        {task.title}
      </span>

      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {task.estimatedTime && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-white/5 text-neutral-500 uppercase tracking-wider whitespace-nowrap">
            <Clock className="text-[10px]" strokeWidth={1.5} />
            Duration: {task.estimatedTime}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap ${durationPillCls}`}>
          <Timer className="text-[10px]" strokeWidth={1.5} />
          Task Duration: {taskDuration}
        </span>
      </div>

      {isActive ? (
        <button
          onClick={(e) => { e.stopPropagation(); onMakeActive && onMakeActive() }}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${activeBtnCls}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dotCls} animate-pulse`} />
          Active
        </button>
      ) : !done ? (
        <button
          onClick={(e) => { e.stopPropagation(); onMakeActive && onMakeActive() }}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all
            ${accentColor === 'orange' ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10' : 'border-white/15 text-neutral-400 hover:border-white/30 hover:text-white'}`}
        >
          Focus Task
        </button>
      ) : null}
    </div>
  )
}



// ── Main page ─────────────────────────────────────────────────────────────────
export function FocusedDay() {
  const {
    currentWeek,
    isLoadingWeek,
    pomodoroTime,
    isPomodoroRunning,
    pomodoroPhase,
    pomodoroFocusMin,
    pomodoroBreakMin,
    startPomodoro,
    stopPomodoro,
    tickPomodoro,
    resetPomodoro,
    setPomodoroPreset,
    toggleTaskComplete,
    markDayComplete,
    updateTaskActualDuration,
    focusSessions,
    saveFocusSession
  } = useWeekStore()
  const { isFocusMode, focusLevel, setFocusMode, toggleFocusMode } = useLayoutStore()
  const [showFocusMenu, setShowFocusMenu] = useState(false)

  const workerRef = useRef<Worker | null>(null)
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customFocus, setCustomFocus] = useState(String(pomodoroFocusMin))
  const [customBreak, setCustomBreak] = useState(String(pomodoroBreakMin))
  const [showPresets, setShowPresets] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [isIdle, setIsIdle] = useState(false)

  // ── Smart UI Behavior: Idle Timer & Shortcut ───────────────────────────────────
  useEffect(() => {
    if (!isFocusMode) {
      setIsIdle(false)
      return
    }
    
    let timeout: ReturnType<typeof setTimeout>
    const handleActivity = () => {
      setIsIdle(false)
      clearTimeout(timeout)
      timeout = setTimeout(() => setIsIdle(true), 3500)
    }
    
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('click', handleActivity)
    
    timeout = setTimeout(() => setIsIdle(true), 3500)
    
    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('click', handleActivity)
      clearTimeout(timeout)
    }
  }, [isFocusMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key.toLowerCase() === 'f') {
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFocusMode])

  // ── Active Task Logic ───────────────────────────────────────────────────────
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  
  const activeTaskIdRef = useRef(activeTaskId)
  const isPomodoroRunningRef = useRef(isPomodoroRunning)
  const pomodoroPhaseRef = useRef(pomodoroPhase)
  const sessionSecondsRef = useRef(sessionSeconds)

  // Sync refs for worker closure
  useEffect(() => { activeTaskIdRef.current = activeTaskId }, [activeTaskId])
  useEffect(() => { isPomodoroRunningRef.current = isPomodoroRunning }, [isPomodoroRunning])
  useEffect(() => { pomodoroPhaseRef.current = pomodoroPhase }, [pomodoroPhase])
  useEffect(() => { sessionSecondsRef.current = sessionSeconds }, [sessionSeconds])

  // Change active task, save previous accumulated time if needed
  const handleMakeActive = useCallback((taskId: string | null) => {
    if (activeTaskIdRef.current && sessionSecondsRef.current > 0) {
      void updateTaskActualDuration(activeTaskIdRef.current, sessionSecondsRef.current)
      void saveFocusSession(activeTaskIdRef.current, sessionSecondsRef.current, pomodoroPhaseRef.current)
    }
    setSessionSeconds(0)
    setActiveTaskId(taskId)
  }, [updateTaskActualDuration, saveFocusSession])

  const handlePomodoroTick = useCallback(() => {
    tickPomodoro()

    // Accumulate time for active task during focus phase
    if (isPomodoroRunningRef.current && pomodoroPhaseRef.current === 'focus' && activeTaskIdRef.current) {
      setSessionSeconds(s => {
        const next = s + 1
        // Sync to DB every 60 seconds to avoid spam
        if (next >= 60) {
          void updateTaskActualDuration(activeTaskIdRef.current!, next)
          return 0
        }
        return next
      })
    }
  }, [tickPomodoro, updateTaskActualDuration])

  // ── Web Worker setup ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('../workers/pomodoroWorker.ts', import.meta.url), { type: 'module' })
      workerRef.current.onmessage = handlePomodoroTick
      workerRef.current.onerror = () => {
        workerRef.current?.terminate()
        workerRef.current = null
      }
    } catch {}

    return () => {
      if (activeTaskIdRef.current && sessionSecondsRef.current > 0) {
         void updateTaskActualDuration(activeTaskIdRef.current, sessionSecondsRef.current)
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current)
        fallbackIntervalRef.current = null
      }
      workerRef.current?.terminate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePomodoroTick])

  // Sync worker with running state
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage(isPomodoroRunning ? 'start' : 'stop')
      return
    }

    if (isPomodoroRunning && !fallbackIntervalRef.current) {
      fallbackIntervalRef.current = setInterval(() => {
        handlePomodoroTick()
      }, 1000)
      return
    }

    if (!isPomodoroRunning && fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current)
      fallbackIntervalRef.current = null
    }
  }, [handlePomodoroTick, isPomodoroRunning])

  // Count completed focus sessions (phase switches focus→break)
  const prevPhase = useRef(pomodoroPhase)
  useEffect(() => {
    if (prevPhase.current !== pomodoroPhase) {
      if (prevPhase.current === 'focus' && pomodoroPhase === 'break') {
        setSessionCount(c => c + 1)
      }
      if (activeTaskIdRef.current && sessionSecondsRef.current > 0) {
        void updateTaskActualDuration(activeTaskIdRef.current, sessionSecondsRef.current)
        void saveFocusSession(activeTaskIdRef.current, sessionSecondsRef.current, prevPhase.current)
        setSessionSeconds(0)
      }
    }
    prevPhase.current = pomodoroPhase
  }, [pomodoroPhase, updateTaskActualDuration, saveFocusSession])

  // Browser notification on phase switch
  useEffect(() => {
    if (pomodoroPhase === 'break') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🍅 Break Time!', { body: `Great focus session! Take a ${pomodoroBreakMin}min break.` })
      }
    }
  }, [pomodoroPhase, pomodoroBreakMin])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const totalSecs = pomodoroPhase === 'focus' ? pomodoroFocusMin * 60 : pomodoroBreakMin * 60
  const progress = pomodoroTime / totalSecs

  const handleToggle = useCallback(() => {
    if (isPomodoroRunning) {
      stopPomodoro()
      if (workerRef.current) workerRef.current.postMessage('stop')
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current)
      
      if (activeTaskIdRef.current && sessionSecondsRef.current > 0) {
        void updateTaskActualDuration(activeTaskIdRef.current, sessionSecondsRef.current)
        void saveFocusSession(activeTaskIdRef.current, sessionSecondsRef.current, pomodoroPhaseRef.current)
        setSessionSeconds(0)
      }
    } else {
      if ('Notification' in window && Notification.permission !== 'granted') {
        void Notification.requestPermission()
      }
      startPomodoro()
      if (workerRef.current) workerRef.current.postMessage('start')
      else fallbackIntervalRef.current = setInterval(handlePomodoroTick, 1000)
    }
  }, [isPomodoroRunning, startPomodoro, stopPomodoro, handlePomodoroTick, saveFocusSession, updateTaskActualDuration])

  const applyCustomPreset = () => {
    const f = Math.max(1, Math.min(120, Number(customFocus) || 25))
    const b = Math.max(1, Math.min(60, Number(customBreak) || 5))
    setPomodoroPreset(f, b)
    setShowCustom(false)
    setShowPresets(false)
  }

  if (isLoadingWeek || !currentWeek) {
    return (
      <AppLayout>
        <div className="max-w-[780px] mx-auto px-8 py-12 space-y-8">
          <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
          <div className="h-72 bg-surface-container-low rounded-2xl animate-pulse" />
        </div>
      </AppLayout>
    )
  }

  const todayPlan =
    currentWeek.days.find(d => d.isToday) ??
    currentWeek.days.find(d => d.highTask || d.mediumTasks.length > 0) ??
    currentWeek.days[0]

  const mainTask = todayPlan.highTask
  const mediumTasks = todayPlan.mediumTasks
  const quickWins = todayPlan.smallTasks
  const completedCount = [mainTask, ...mediumTasks, ...quickWins].filter(t => t && t.status === 'done').length
  const totalCount = [mainTask, ...mediumTasks, ...quickWins].filter(Boolean).length
  const dayProgress = totalCount > 0 ? completedCount / totalCount : 0

  const todayFocusSeconds = focusSessions.reduce((acc, curr) => acc + curr.duration_seconds, 0)

  return (
    <AppLayout>
      {/* ── Focus Mode Immersive Overlay ───────────────────────────────────────── */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(30px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030303] overflow-hidden font-body ${isIdle ? 'cursor-none' : ''}`}
          >
            {/* Ambient breathing glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute w-[800px] h-[800px] rounded-full blur-[140px] pointer-events-none ${
                pomodoroPhase === 'focus' ? 'bg-violet-600/40' : 'bg-sky-500/40'
              }`}
            />

            {/* Top controls - fade out on idle */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: isIdle ? 0 : 1, y: isIdle ? -20 : 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-8 left-8 right-8 flex justify-between items-center z-10"
            >
              <div className="flex items-center gap-3">
                <Zap className="text-violet-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
                <span className="text-neutral-400 font-bold tracking-[0.2em] uppercase text-[11px]">Deep Focus</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                  <CloudRain className="text-[20px]" strokeWidth={1.5} />
                </button>
                <button 
                  onClick={toggleFocusMode}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider border border-white/10"
                >
                  <X className="text-[16px]" strokeWidth={1.5} />
                  Exit <span className="opacity-50 ml-1">(F)</span>
                </button>
              </div>
            </motion.div>

            {/* Center content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl">
              {/* Motivational microcopy during entry */}
              <motion.p
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10], filter: ['blur(4px)', 'blur(0px)', 'blur(0px)', 'blur(4px)'] }}
                transition={{ duration: 5, times: [0, 0.2, 0.8, 1] }}
                className="absolute -top-20 text-violet-300/60 font-medium tracking-[0.3em] uppercase text-xs"
              >
                {pomodoroPhase === 'focus' ? 'One thing. One session.' : 'Rest and recharge.'}
              </motion.p>

              {/* Main Timer */}
              <motion.div 
                className="relative flex items-center justify-center mb-16"
              >
                <CircularProgress progress={progress} phase={pomodoroPhase} size={480} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-[11px] uppercase tracking-[0.4em] font-bold mb-6 ${
                    pomodoroPhase === 'focus' ? 'text-violet-400' : 'text-sky-400'
                  }`}>
                    {pomodoroPhase === 'focus' ? 'Focus Session' : 'Break Time'}
                  </span>
                  <motion.div layoutId="pomodoro-time-box" className="bg-transparent border-transparent">
                    <motion.span layoutId="pomodoro-time-text" className="text-8xl md:text-[140px] font-mono font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                      {formatTime(pomodoroTime)}
                    </motion.span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Current Task */}
              <motion.div 
                animate={{ 
                  opacity: isIdle ? 0.3 : 1, 
                  scale: isIdle ? 0.98 : 1,
                  y: isIdle ? 20 : 0
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-center space-y-6 w-full px-8"
              >
                <h2 className={`text-4xl md:text-5xl font-black tracking-tight leading-tight ${activeTaskId || mainTask ? 'text-white' : 'text-neutral-500'}`}>
                  {activeTaskId 
                    ? [mainTask, ...mediumTasks, ...quickWins].find(t => t?.id === activeTaskId)?.title 
                    : mainTask 
                      ? mainTask.title 
                      : 'No task selected'}
                </h2>
                
                {/* Controls - fade out on idle */}
                <motion.div
                  animate={{ opacity: isIdle ? 0 : 1, y: isIdle ? 10 : 0, pointerEvents: isIdle ? 'none' : 'auto' }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center items-center gap-5 pt-8"
                >
                  <button
                    onClick={handleToggle}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${
                      pomodoroPhase === 'focus' 
                        ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30' 
                        : 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/30'
                    }`}
                  >
                    {isPomodoroRunning ? <Pause className="w-9 h-9" strokeWidth={1.5} /> : <Play className="w-9 h-9" strokeWidth={1.5} />}
                  </button>
                  
                  <button
                    onClick={resetPomodoro}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all duration-300 border border-white/10 hover:scale-105 active:scale-95"
                    title="Reset Timer"
                  >
                    <RotateCcw className="text-2xl" strokeWidth={1.5} />
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Background Darkener for Minimal Focus */}
      <AnimatePresence>
        {isFocusMode && focusLevel === 'minimal' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed inset-0 bg-[#050505]/60 pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      <motion.div layout className={`max-w-[1200px] mx-auto px-4 md:px-8 py-10 pb-24 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-10 items-start transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFocusMode ? 'opacity-0 blur-2xl scale-[0.98] pointer-events-none absolute' : 'opacity-100 blur-0 scale-100'
      }`}>
        
        {/* ── Left Column (Main Content) ─────────────────────────────────── */}
        <motion.div layout className="space-y-10">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Zap className="text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface">
                Focused Day
              </h1>
            </div>
            <p className="text-on-surface-variant font-medium pl-9">
              {todayPlan.date} —{' '}
              <span className="text-primary italic">
                {todayPlan.isToday ? 'Today' : todayPlan.shortName}
              </span>
            </p>
          </div>

          {/* Day progress pill */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex flex-col items-end">
              <p className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">Day Progress</p>
              <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-700"
                  style={{ width: `${dayProgress * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">{completedCount}/{totalCount} tasks</p>
            </div>
          </div>
        </div>

        {/* ── Pomodoro Timer Card ─────────────────────────────────────────── */}
        <div className={`relative rounded-3xl border overflow-hidden transition-all duration-500 ${
          pomodoroPhase === 'focus'
            ? 'border-primary/30 bg-gradient-to-br from-primary/10 via-surface-container-low/60 to-surface-container-lowest/80'
            : 'border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-surface-container-low/60 to-surface-container-lowest/80'
        }`}>
          {/* Ambient glow blob */}
          <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${
            pomodoroPhase === 'focus' ? 'bg-violet-600' : 'bg-sky-500'
          }`} />

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">

              {/* Circular timer */}
              <div className="relative shrink-0">
                <CircularProgress progress={progress} phase={pomodoroPhase} size={240} />
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-[11px] uppercase tracking-[0.25em] font-bold mb-2 ${
                    pomodoroPhase === 'focus' ? 'text-violet-400' : 'text-sky-400'
                  }`}>
                    {pomodoroPhase === 'focus' ? '● Focus' : '◎ Break'}
                  </span>
                  <div className={`px-4 py-2 rounded-2xl border backdrop-blur-sm shadow-[0_0_25px_rgba(124,58,237,0.2)] ${
                    pomodoroPhase === 'focus' ? 'bg-violet-500/10 border-violet-300/30' : 'bg-sky-500/10 border-sky-300/30'
                  }`}>
                    <motion.span layoutId="pomodoro-time-text" className="text-6xl md:text-7xl font-mono font-black text-on-surface tabular-nums tracking-tight leading-none">
                      {formatTime(pomodoroTime)}
                    </motion.span>
                  </div>
                  {sessionCount > 0 && (
                    <span className="mt-2 text-[10px] text-neutral-500 tracking-widest uppercase">
                      {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls panel */}
              <div className="flex-1 space-y-5 w-full">
                {/* Phase label + session dots */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(sessionCount, 8) }).map((_, i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                  ))}
                  {sessionCount === 0 && (
                    <span className="text-xs text-neutral-600 italic">No sessions yet</span>
                  )}
                </div>

                {/* Current preset display */}
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Timer className="text-[18px]" strokeWidth={1.5} />
                  <span>{pomodoroFocusMin}min focus · {pomodoroBreakMin}min break</span>
                </div>

                {/* Main buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={handleToggle}
                    variant="secondary"
                    size="sm"
                    className="px-6 py-2.5 rounded-xl font-bold text-sm min-w-[140px]"
                  >
                    {isPomodoroRunning ? <Pause className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Play className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                    {isPomodoroRunning ? 'Pause Focus' : 'Start Focus'}
                  </Button>

                  <Button
                    type="button"
                    onClick={resetPomodoro}
                    variant="ghost"
                    size="sm"
                    className="px-4 py-2.5 rounded-xl font-bold text-sm border border-white/10 hover:border-white/20"
                  >
                    <RotateCcw className="text-[18px]" strokeWidth={1.5} />
                    Reset
                  </Button>

                  <Button
                    type="button"
                    onClick={toggleFocusMode}
                    variant="ghost"
                    size="sm"
                    className="px-4 py-2.5 rounded-xl font-bold text-sm border border-white/10 hover:border-white/20"
                  >
                    {isFocusMode ? <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                    {isFocusMode ? 'Show' : 'Hide'} UI
                  </Button>
                </div>

                {/* Presets */}
                <div>
                  <button
                    onClick={() => setShowPresets(p => !p)}
                    className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-neutral-500 hover:text-neutral-300 transition-colors font-bold"
                  >
                    <SlidersHorizontal className="text-[14px]" strokeWidth={1.5} />
                    Customize Timer
                    {showPresets ? <ChevronUp className="w-[14px] h-[14px]" strokeWidth={1.5} /> : <ChevronDown className="w-[14px] h-[14px]" strokeWidth={1.5} />}
                  </button>

                  {showPresets && (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {PRESETS.map(p => (
                          <button
                            key={p.label}
                            onClick={() => { setPomodoroPreset(p.focus, p.brk); setShowPresets(false) }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                              pomodoroFocusMin === p.focus && pomodoroBreakMin === p.brk
                                ? 'border-primary bg-primary/15 text-primary'
                                : 'border-white/10 text-neutral-400 hover:border-white/25 hover:text-white'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setShowCustom(c => !c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/10 text-neutral-400 hover:border-white/25 hover:text-white transition-all"
                        >
                          Custom
                        </button>
                      </div>

                      {showCustom && (
                        <div className="flex items-center gap-3 pt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Focus</span>
                            <Input
                              type="number"
                              min={1} max={120}
                              value={customFocus}
                              onChange={e => setCustomFocus(e.target.value)}
                              className="w-14 px-2 py-1.5 text-sm text-center"
                            />
                          </div>
                          <span className="text-neutral-600">/</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Break</span>
                            <Input
                              type="number"
                              min={1} max={60}
                              value={customBreak}
                              onChange={e => setCustomBreak(e.target.value)}
                              className="w-14 px-2 py-1.5 text-sm text-center"
                            />
                          </div>
                          <Button
                            onClick={applyCustomPreset}
                            variant="secondary"
                            size="sm"
                            className="text-xs uppercase tracking-wider"
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tasks ──────────────────────────────────────────────────────────── */}
        <div className="space-y-8">

          {/* Main Objective */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-violet-500 inline-block" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">Main Objective</h2>
              </div>
              <span className="text-[10px] text-neutral-600 uppercase tracking-widest">The One Thing</span>
            </div>

            {mainTask ? (
              <div 
                className={`relative rounded-2xl border transition-all duration-300 overflow-hidden group
                  ${activeTaskId === mainTask.id
                    ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(124,58,237,0.2)] scale-[1.01] z-10 relative'
                    : activeTaskId 
                      ? 'border-primary/10 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-40 grayscale hover:opacity-60'
                      : 'border-primary/20 bg-gradient-to-br from-primary/[0.08] to-transparent hover:border-primary/40'
                  }
                `}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${activeTaskId === mainTask.id ? 'bg-primary shadow-[0_0_10px_#7c3aed]' : 'bg-primary/70'}`} />
                <div className="p-6 pl-7">
                  <div className="flex items-start gap-5">
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleTaskComplete(mainTask.id); }}
                      className={`cursor-pointer mt-0.5 shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                      mainTask.status === 'done' ? 'bg-primary border-primary' : 'border-primary/40 group-hover:border-primary'
                    }`}>
                      {mainTask.status === 'done' && (
                        <Check className="text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-start gap-4">
                      <div>
                        <h3 className={`text-xl font-bold mb-1.5 leading-snug flex items-center gap-2 ${mainTask.status === 'done' ? 'line-through opacity-50' : ''}`}>
                          {mainTask.title}
                          {mainTask.type === 'pinned' && (
                            <Pin className="text-[16px] text-primary" title="Pinned Task" strokeWidth={1.5} />
                          )}
                        </h3>
                        {mainTask.description && (
                          <p className="text-sm text-neutral-400 leading-relaxed">{mainTask.description}</p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] font-mono bg-violet-500/10 text-violet-300 px-2 py-1 rounded-md uppercase tracking-wider border border-violet-500/20 flex items-center gap-1">
                            <Star className="text-[12px]" strokeWidth={1.5} />
                            Priority: Critical
                          </span>
                          {mainTask.estimatedTime && (
                            <span className="text-[10px] font-mono bg-white/5 text-neutral-400 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 border border-white/10">
                              <Clock className="text-[12px]" strokeWidth={1.5} />
                              Duration: {mainTask.estimatedTime}
                            </span>
                          )}
                          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md uppercase tracking-[0.14em] border flex items-center gap-1.5 ${
                            activeTaskId === mainTask.id ? 'bg-violet-500/15 text-violet-300 border-violet-500/30 shadow-[0_0_14px_rgba(139,92,246,0.2)]' : 'bg-white/5 text-neutral-400 border-white/10'
                          }`}>
                            <Timer className="text-[12px]" strokeWidth={1.5} />
                            Task Duration: {`${Math.floor(((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0)) / 60)}m ${((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0)) % 60}s`}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 pt-1 flex items-center justify-end">
                        {activeTaskId === mainTask.id ? (
                           <Button
                             type="button"
                             onClick={(e) => { e.stopPropagation(); handleMakeActive(null); }}
                             variant="ghost"
                             size="sm"
                             className="px-5 py-2.5 rounded-xl font-bold text-sm min-w-[120px] border border-primary/30 text-primary"
                             active
                           >
                             <div className="flex items-center justify-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(124,58,237,0.8)]" /> Active
                             </div>
                           </Button>
                        ) : mainTask.status !== 'done' ? (
                            <Button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMakeActive(mainTask.id); }}
                              variant="secondary"
                              size="sm"
                              className="px-5 py-2.5 rounded-xl font-bold text-sm min-w-[120px]"
                            >
                              Focus Task
                            </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center">
                <Target className="text-4xl text-neutral-700 block mb-3" strokeWidth={1.5} />
                <p className="text-neutral-500 italic text-sm">No high-priority task for this day yet.</p>
                <p className="text-neutral-600 text-xs mt-2">Add one in Weekly Distribution.</p>
              </div>
            )}
          </section>

          {/* Medium Tasks */}
          {mediumTasks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-4 rounded-full bg-teal-500 inline-block" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400">Supporting Tasks</h2>
                <span className="ml-auto text-[10px] text-neutral-600 uppercase tracking-widest">
                  {mediumTasks.filter(t => t.status === 'done').length}/{mediumTasks.length} Done
                </span>
              </div>
              <div className="space-y-1.5">
                {mediumTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskComplete(task.id)}
                    isActive={activeTaskId === task.id}
                    isDimmed={activeTaskId !== null && activeTaskId !== task.id}
                    onMakeActive={() => handleMakeActive(activeTaskId === task.id ? null : task.id)}
                    unsavedSeconds={activeTaskId === task.id ? sessionSeconds : 0}
                    accentColor="teal"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Quick Wins */}
          {quickWins.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1 h-4 rounded-full bg-orange-500 inline-block" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400">Quick Wins</h2>
                <span className="ml-auto text-[10px] text-neutral-600 uppercase tracking-widest">
                  {quickWins.filter(t => t.status === 'done').length}/{quickWins.length} Done
                </span>
              </div>
              <div className="space-y-1.5">
                {quickWins.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskComplete(task.id)}
                    isActive={activeTaskId === task.id}
                    isDimmed={activeTaskId !== null && activeTaskId !== task.id}
                    onMakeActive={() => handleMakeActive(activeTaskId === task.id ? null : task.id)}
                    unsavedSeconds={activeTaskId === task.id ? sessionSeconds : 0}
                    accentColor="orange"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!mainTask && mediumTasks.length === 0 && quickWins.length === 0 && (
            <div className="text-center py-20">
              <Inbox className="text-6xl text-neutral-700 mb-4 block" strokeWidth={1.5} />
              <p className="text-neutral-500">No tasks scheduled for today.</p>
              <p className="text-neutral-600 text-sm mt-1">Go to Weekly Distribution to assign tasks.</p>
            </div>
          )}
        </div>

        {/* ── Day Complete ───────────────────────────────────────────────────── */}
          <div className="pt-6 pb-10 flex justify-center">
            <Button
              type="button"
              onClick={() => todayPlan && markDayComplete(todayPlan.day)}
              variant="secondary"
              size="lg"
              className="px-12 py-4 rounded-2xl font-bold group"
            >
              <div className="flex flex-col items-center gap-1.5">
                <BadgeCheck className="text-3xl mb-0.5 group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
                <span className="text-base">Mark Day Complete</span>
                <span className="text-[10px] font-normal uppercase tracking-widest text-tertiary/60">
                  Finalize All Progress
                </span>
              </div>
            </Button>
          </div>
        </motion.div>

        {/* ── Right Column (Sidebar) ─────────────────────────────────────── */}
        <AnimatePresence>
          {!(isFocusMode && focusLevel === 'minimal') && (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
              exit={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 xl:sticky xl:top-8 self-start"
            >
          {/* 1. FOCUS TIME TODAY */}
          <Card variant="glass" className="p-6 rounded-3xl border border-white/10 bg-surface-container-lowest/50">
             <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-4">Focus Time Today</h3>
             <div className="flex items-end justify-between">
               <div>
                 <span className="text-3xl font-black text-on-surface">{Math.floor(todayFocusSeconds / 3600)}h {Math.floor((todayFocusSeconds % 3600) / 60)}m</span>
                 <p className="text-xs text-tertiary mt-1.5 flex items-center gap-1">
                   <TrendingUp className="text-[14px]" strokeWidth={1.5} />
                   +15m from yesterday
                 </p>
               </div>
               {/* Sparkline mock */}
               <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
                 <path d="M0 25 Q 10 15, 20 20 T 40 10 T 60 5" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
             </div>
          </Card>

          {/* 2. TODAY'S TASKS */}
          <Card variant="glass" className="p-6 rounded-3xl border border-white/10 bg-surface-container-lowest/50">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-5">Today's Tasks</h3>
            <div className="space-y-4">
              {[todayPlan.highTask, ...todayPlan.mediumTasks, ...todayPlan.smallTasks].filter(Boolean).map(task => (
                <div key={task!.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 w-2 h-2 rounded-full ${task!.priority === 'high' ? 'bg-primary shadow-[0_0_8px_#7c3aed]' : task!.priority === 'medium' ? 'bg-tertiary shadow-[0_0_8px_#14b8a6]' : 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]'}`} />
                    <span className={`text-sm font-medium truncate ${task!.status === 'done' ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                      {task!.title}
                    </span>
                  </div>
                  <span className="shrink-0 pl-3 text-xs font-mono text-neutral-500">
                    {Math.floor((task!.actualDuration || 0) / 3600)}h {Math.floor(((task!.actualDuration || 0) % 3600) / 60)}m
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* 3. FOCUS TIME RECORDS */}
           <Card variant="glass" className="p-6 rounded-3xl border border-white/10 bg-surface-container-lowest/50">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Focus Time Records</h3>
                <History className="text-neutral-500 text-[18px]" strokeWidth={1.5} />
             </div>
             <div className="space-y-5 relative">
               <div className="absolute left-2 top-2 bottom-2 w-px bg-white/10" />
               {focusSessions.map((session, i) => {
                 const task = [todayPlan.highTask, ...todayPlan.mediumTasks, ...todayPlan.smallTasks].filter(Boolean).find(t => t!.id === session.task_id)
                 const date = new Date(session.start_time)
                 const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                 return (
                   <div key={session.id || i} className="flex gap-4 relative">
                     <div className="shrink-0 w-4 h-4 rounded-full border-4 border-[#121212] bg-neutral-600 z-10" />
                     <div className="-mt-1">
                       <p className="text-[11px] font-mono tracking-wider text-neutral-500 mb-1">{timeStr} — {session.duration_seconds >= 60 ? `${Math.floor(session.duration_seconds/60)}m` : `${session.duration_seconds}s`} {session.session_type}</p>
                       <p className="text-sm font-medium text-neutral-200">{task ? task.title : (session.session_type === 'break' ? 'Break Session' : 'Focus Session')}</p>
                     </div>
                   </div>
                 )
               })}
               {focusSessions.length === 0 && (
                 <p className="text-sm text-neutral-500 italic pl-8">No records yet today.</p>
               )}
             </div>
          </Card>

          </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AppLayout>
  )
}
