import { useEffect, useRef, useState, useCallback } from 'react'
import { Check, Clock, Timer, Zap, RotateCcw, SlidersHorizontal, Target, Inbox, BadgeCheck, TrendingUp, History, Play, Pause, Layers, ChevronUp, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { useLayoutStore } from '../store/useLayoutStore'
import { useWeekStore } from '../store/useWeekStore'
import type { Task } from '../store/useWeekStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { DeepFocusOverlay } from '../components/focus/DeepFocusOverlay'
import { MinimalFocusBanner } from '../components/focus/MinimalFocusBanner'
import { FocusModeMenu } from '../components/focus/FocusModeMenu'

// ── Preset definitions ────────────────────────────────────────────────────────
const PRESETS = [
  { label: '25 / 5', focus: 25, brk: 5 },
  { label: '50 / 10', focus: 50, brk: 10 },
  { label: '90 / 20', focus: 90, brk: 20 },
]

// ── Circular SVG progress ─────────────────────────────────────────────────────
// Receives raw pomodoroTime + totalSecs so it can do its own sub-second RAF
// interpolation — giving a truly continuous sweep at 60 fps.
function CircularProgress({
  pomodoroTime,
  totalSecs,
  isRunning,
  phase,
  size = 240,
}: {
  pomodoroTime: number
  totalSecs: number
  isRunning: boolean
  phase: 'focus' | 'break'
  size?: number
}) {
  const stroke = 5
  const r = (size - stroke * 2) / 2
  const circumference = 2 * Math.PI * r
  const color = phase === 'focus' ? '#8b5cf6' : '#0ea5e9'
  const glowColor = phase === 'focus' ? '#a78bfa' : '#38bdf8'
  const cx = size / 2
  const cy = size / 2

  // Discrete progress (used for ticks — whole seconds only)
  const tickProgress = pomodoroTime / totalSecs

  // ── Continuous RAF loop ──────────────────────────────────────────────────────
  // lastTickTimeRef: wall-clock time when pomodoroTime last changed (each store tick)
  // Each RAF frame computes: continuousProgress = (pomodoroTime - subSecElapsed) / totalSecs
  const arcRef = useRef<SVGCircleElement>(null)
  const rafRef = useRef<number>(0)
  const lastTickTimeRef = useRef<number>(performance.now())
  const pomodoroTimeRef = useRef<number>(pomodoroTime)
  const totalSecsRef = useRef<number>(totalSecs)
  const isRunningRef = useRef<boolean>(isRunning)

  // Sync mutable refs so the RAF closure always reads fresh values
  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])
  useEffect(() => { totalSecsRef.current = totalSecs }, [totalSecs])

  // Each store tick: record wall-clock time and new pomodoroTime
  useEffect(() => {
    lastTickTimeRef.current = performance.now()
    pomodoroTimeRef.current = pomodoroTime
  }, [pomodoroTime])

  // Single persistent RAF loop — runs the entire time the component is mounted
  useEffect(() => {
    const loop = (now: number) => {
      if (arcRef.current) {
        let p: number
        if (isRunningRef.current) {
          // Sub-second interpolation: how many real seconds have passed since last tick?
          const subSec = Math.min((now - lastTickTimeRef.current) / 1000, 1)
          const continuousTime = pomodoroTimeRef.current - subSec
          p = Math.max(0, continuousTime) / totalSecsRef.current
        } else {
          p = pomodoroTimeRef.current / totalSecsRef.current
        }
        arcRef.current.style.strokeDashoffset = String(circumference * (1 - p))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
    // Only needs circumference; everything else reads from refs
  }, [circumference])

  // Clock tick marks — drawn inside the ring, update once/second (discrete is fine)
  const TICK_COUNT = 60
  const tickOuter = r - stroke / 2 - 2
  const tickInnerMajor = tickOuter - 9
  const tickInnerMinor = tickOuter - 5
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * 2 * Math.PI
    const isMajor = i % 5 === 0
    const tickInner = isMajor ? tickInnerMajor : tickInnerMinor
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      x1: cx + tickOuter * cos,
      y1: cy + tickOuter * sin,
      x2: cx + tickInner * cos,
      y2: cy + tickInner * sin,
      isMajor,
      isLit: (i / TICK_COUNT) < tickProgress,
    }
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <filter id="tick-glow" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="tick-glow-major" x="-100%" y="-100%" width="300%" height="300%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer ambient ring */}
      <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.08} />

      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />

      {/* Progress arc — driven purely by RAF, no React re-render needed */}
      <circle
        ref={arcRef}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - tickProgress)}
        style={{ transition: 'stroke 0.4s' }}
        filter={`drop-shadow(0 0 14px ${color}cc)`}
      />

      {/* Clock tick marks */}
      {ticks.map((tick, i) =>
        tick.isLit ? (
          <line
            key={i}
            x1={tick.x1} y1={tick.y1}
            x2={tick.x2} y2={tick.y2}
            stroke={glowColor}
            strokeWidth={tick.isMajor ? 2.5 : 1.5}
            strokeLinecap="round"
            filter={tick.isMajor ? 'url(#tick-glow-major)' : 'url(#tick-glow)'}
            opacity={tick.isMajor ? 1 : 0.85}
          />
        ) : (
          <line
            key={i}
            x1={tick.x1} y1={tick.y1}
            x2={tick.x2} y2={tick.y2}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={tick.isMajor ? 2 : 1}
            strokeLinecap="round"
            opacity={tick.isMajor ? 0.5 : 0.25}
          />
        )
      )}
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
  const [isHovered, setIsHovered] = useState(false)
  const done = task.status === 'done'
  const totalSecs = (task.actualDuration || 0) + unsavedSeconds
  const taskDuration = `${Math.floor(totalSecs / 60)}m ${(totalSecs % 60).toString().padStart(2, '0')}s`

  // ── Per-section color palette (full class strings for Tailwind JIT) ──────────
  const C = accentColor === 'purple'
    ? {
      containerActive: 'border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-transparent shadow-[0_0_20px_rgba(139,92,246,0.22)]',
      containerHover: 'border-violet-500/40 bg-gradient-to-br from-violet-500/[0.08] to-transparent shadow-[0_0_16px_rgba(139,92,246,0.16)]',
      containerIdle: 'border-violet-500/10 bg-transparent',
      stripe: 'bg-violet-500 shadow-[0_0_10px_#7c3aed]',
      titleActive: 'text-violet-200 font-semibold',
      titleHover: 'text-neutral-100 font-semibold',
      pill: 'border-violet-500/25 bg-violet-500/10 text-violet-300',
      btnActive: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
      btnHover: 'border-violet-500/60 bg-violet-500/20 text-violet-200',
      btnIdle: 'border-violet-500/30 bg-transparent text-violet-400 hover:bg-violet-500/10',
      dot: 'bg-violet-400',
    }
    : accentColor === 'orange'
      ? {
        containerActive: 'border-orange-500/45 bg-gradient-to-br from-orange-500/[0.08] to-transparent shadow-[0_0_18px_rgba(249,115,22,0.2)]',
        containerHover: 'border-orange-500/35 bg-gradient-to-br from-orange-500/[0.07] to-transparent shadow-[0_0_14px_rgba(249,115,22,0.15)]',
        containerIdle: 'border-orange-500/10 bg-transparent',
        stripe: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
        titleActive: 'text-orange-200 font-semibold',
        titleHover: 'text-neutral-100 font-semibold',
        pill: 'border-orange-500/25 bg-orange-500/10 text-orange-300',
        btnActive: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
        btnHover: 'border-orange-500/60 bg-orange-500/20 text-orange-200',
        btnIdle: 'border-orange-500/35 bg-transparent text-orange-400 hover:bg-orange-500/10',
        dot: 'bg-orange-400',
      }
      : {
        containerActive: 'border-teal-500/45 bg-gradient-to-br from-teal-500/[0.08] to-transparent shadow-[0_0_18px_rgba(20,184,166,0.18)]',
        containerHover: 'border-teal-500/35 bg-gradient-to-br from-teal-500/[0.07] to-transparent shadow-[0_0_14px_rgba(20,184,166,0.14)]',
        containerIdle: 'border-teal-500/10 bg-transparent',
        stripe: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]',
        titleActive: 'text-teal-200 font-semibold',
        titleHover: 'text-neutral-100 font-semibold',
        pill: 'border-teal-500/25 bg-teal-500/10 text-teal-300',
        btnActive: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
        btnHover: 'border-teal-500/60 bg-teal-500/20 text-teal-200',
        btnIdle: 'border-teal-500/35 bg-transparent text-teal-400 hover:bg-teal-500/10',
        dot: 'bg-teal-400',
      }

  // ── Derived display state ─────────────────────────────────────────────────────
  const showExpanded = (isActive || (isHovered && !done)) && !isDimmed
  const showStripe = showExpanded

  const containerCls = isDimmed
    ? 'border-white/5 bg-transparent opacity-25 grayscale'
    : done
      ? 'border-white/[0.06] bg-transparent opacity-45 grayscale'
      : isActive
        ? C.containerActive
        : isHovered
          ? `${C.containerHover} scale-[1.007]`
          : C.containerIdle

  const titleCls = done
    ? 'line-through text-neutral-600'
    : isActive ? C.titleActive
      : isHovered ? C.titleHover
        : 'text-neutral-400'

  return (
    <div
      onMouseEnter={() => { if (!done && !isDimmed) setIsHovered(true) }}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${containerCls}`}
    >
      {/* Left accent stripe — visible when hovered or active */}
      {showStripe && (
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-all duration-300 ${C.stripe}`} />
      )}

      <div className={`transition-all duration-300 ${showExpanded ? 'px-4 pt-3.5 pb-3 pl-5' : 'px-4 py-2.5'}`}>

        {/* ── Main row (always visible) ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className={`shrink-0 w-2.5 h-2.5 touch-target rounded-full border flex items-center justify-center transition-all duration-200
              ${done ? 'border-neutral-600 bg-neutral-700' : 'border-neutral-500 hover:border-neutral-300'}`}
          >
            {done && <Check className="text-[11px] text-neutral-400" strokeWidth={2} />}
          </button>

          {/* Title + tracked duration inline */}
          <span className={`flex-1 min-w-0 text-base font-bold truncate transition-all duration-200 ${titleCls}`}>
            {task.title}
          </span>
          {!done && (
            <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 transition-all duration-200
              ${isActive || isHovered ? C.pill + ' border' : 'text-neutral-600'}`}>
              <Timer className="w-3 h-3" strokeWidth={1.5} />
              {taskDuration}
            </span>
          )}

          {/* Action button */}
          {isActive ? (
            <button
              onClick={(e) => { e.stopPropagation(); onMakeActive?.() }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 touch-target rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${C.btnActive}`}
            >
              <span className={`w-3 h-3 rounded-full ${C.dot} animate-pulse`} />
              Active
            </button>
          ) : !done ? (
            <button
              onClick={(e) => { e.stopPropagation(); onMakeActive?.() }}
              className={`shrink-0 px-3 py-1.5 touch-target rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all duration-200
                ${isHovered ? C.btnHover : C.btnIdle}`}
            >
              Focus Task
            </button>
          ) : null}
        </div>

        {/* ── Expanded details row (hover / active only) ────────────────────── */}
        {showExpanded && task.estimatedTime && (
          <div className="mt-2 flex flex-wrap gap-2 pl-7">
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap ${C.pill}`}>
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              Est: {task.estimatedTime}
            </span>
          </div>
        )}
      </div>
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
  const {
    isFocusMode,
    focusLevel,
    setFocusMode,
    isFocusPickerOpen,
    openFocusPicker,
    closeFocusPicker,
    autoEnterFocusOnStart,
  } = useLayoutStore()

  const workerRef = useRef<Worker | null>(null)
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customFocus, setCustomFocus] = useState(String(pomodoroFocusMin))
  const [customBreak, setCustomBreak] = useState(String(pomodoroBreakMin))
  const [showPresets, setShowPresets] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)

  // ── Global keyboard shortcut: F toggles focus picker ─────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key.toLowerCase() === 'f' && !isFocusPickerOpen) {
        if (isFocusMode) {
          setFocusMode(false)
        } else {
          openFocusPicker()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode, isFocusPickerOpen, setFocusMode, openFocusPicker])

  // ── Auto-enter focus on session start ─────────────────────────────────────
  const prevRunning = useRef(isPomodoroRunning)
  useEffect(() => {
    if (!prevRunning.current && isPomodoroRunning && autoEnterFocusOnStart && !isFocusMode) {
      setFocusMode(true, focusLevel)
    }
    prevRunning.current = isPomodoroRunning
  }, [isPomodoroRunning, autoEnterFocusOnStart, isFocusMode, focusLevel, setFocusMode])

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
    } catch { }

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
        <div className="container-responsive py-responsive mx-auto space-y-8 max-w-[780px]">
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
      {/* ── Deep Focus Overlay (full immersion) ─────────────────────────────── */}
      <DeepFocusOverlay
        pomodoroTime={pomodoroTime}
        totalPhaseSecs={totalSecs}
        pomodoroPhase={pomodoroPhase}
        isPomodoroRunning={isPomodoroRunning}
        pomodoroFocusMin={pomodoroFocusMin}
        pomodoroBreakMin={pomodoroBreakMin}
        activeTaskTitle={
          activeTaskId
            ? [mainTask, ...mediumTasks, ...quickWins].find(t => t?.id === activeTaskId)?.title
            : mainTask?.title
        }
        todayFocusSeconds={todayFocusSeconds}
        sessionCount={sessionCount}
        onToggle={handleToggle}
        onReset={resetPomodoro}
      />

      {/* ── Minimal Focus Banner (floating timer pill) ──────────────────── */}
      <MinimalFocusBanner
        pomodoroTime={pomodoroTime}
        pomodoroPhase={pomodoroPhase}
        isPomodoroRunning={isPomodoroRunning}
        activeTaskTitle={
          activeTaskId
            ? [mainTask, ...mediumTasks, ...quickWins].find(t => t?.id === activeTaskId)?.title
            : mainTask?.title
        }
        onToggle={handleToggle}
        onOpenPicker={openFocusPicker}
      />

      {/* ── Focus Mode Picker Menu ────────────────────────────────────── */}
      <FocusModeMenu
        isOpen={isFocusPickerOpen}
        onClose={closeFocusPicker}
      />

      {/* ── Minimal Focus: subtle darkening overlay ───────────────────── */}
      <AnimatePresence>
        {isFocusMode && focusLevel === 'minimal' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#050505]/50 pointer-events-none z-[1]"
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        className={`container-responsive py-responsive mx-auto pb-24 items-start transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] max-w-[1200px] ${isFocusMode && focusLevel === 'deep'
          ? 'opacity-0 blur-xl scale-[0.98] pointer-events-none absolute'
          : isFocusMode && focusLevel === 'minimal'
            ? 'pt-[var(--safe-top,0px)] sm:pt-16 grid grid-cols-1 gap-10 opacity-100'
            : 'grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 sm:gap-10 opacity-100'
          }`}
      >

        {/* ── Left Column (Main Content) ─────────────────────────────────── */}
        <motion.div layout className="space-y-10">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <Zap className="text-primary text-xl sm:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
                <h1 className="text-responsive-h1 font-extrabold tracking-tighter text-on-surface">
                  Focused Day
                </h1>
              </div>
              <p className="text-on-surface-variant font-medium pl-8 sm:pl-9 text-sm sm:text-base">
                {todayPlan.date} —{' '}
                <span className="text-primary italic">
                  {todayPlan.isToday ? 'Today' : todayPlan.shortName}
                </span>
              </p>
            </div>

            {/* Day progress pill */}
            <div className="flex items-center gap-3 self-start md:self-auto pl-8 sm:pl-0 mt-2 sm:mt-0">
              <div className="flex flex-col items-start sm:items-end">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-neutral-500 mb-1">Day Progress</p>
                <div className="w-32 sm:w-48 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-700"
                    style={{ width: `${dayProgress * 100}%` }}
                  />
                </div>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-1">{completedCount}/{totalCount} tasks</p>
              </div>
            </div>
          </div>

          {/* ── Pomodoro Timer Card ─────────────────────────────────────────── */}
          <div className={`relative rounded-3xl border overflow-hidden transition-all duration-500 ${pomodoroPhase === 'focus'
            ? 'border-primary/30 bg-gradient-to-br from-primary/10 via-surface-container-low/60 to-surface-container-lowest/80'
            : 'border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-surface-container-low/60 to-surface-container-lowest/80'
            }`}>
            {/* Ambient glow blob */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${pomodoroPhase === 'focus' ? 'bg-violet-600' : 'bg-sky-500'
              }`} />

            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col lg:flex-row items-center gap-8">

                {/* Circular timer */}
                <div className="relative shrink-0 mx-auto lg:mx-0 w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60">
                  <CircularProgress pomodoroTime={pomodoroTime} totalSecs={totalSecs} isRunning={isPomodoroRunning} phase={pomodoroPhase} size={240} />
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className={`text-[9px] sm:text-[11px] uppercase tracking-[0.25em] font-bold mb-1 sm:mb-2 ${pomodoroPhase === 'focus' ? 'text-violet-400' : 'text-sky-400'
                      }`}>
                      {pomodoroPhase === 'focus' ? '● Focus' : '◎ Break'}
                    </span>
                    <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border backdrop-blur-sm shadow-[0_0_25px_rgba(124,58,237,0.2)] ${pomodoroPhase === 'focus' ? 'bg-violet-500/10 border-violet-300/30' : 'bg-sky-500/10 border-sky-300/30'
                      }`}>
                      <motion.span layoutId="pomodoro-time-text" className="text-2xl sm:text-3xl md:text-4xl font-mono font-black text-on-surface tabular-nums tracking-tight leading-none">
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
                  {pomodoroPhase === 'focus' && (
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(sessionCount, 8) }).map((_, i) => (
                        <span key={i} className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                      ))}
                      {sessionCount === 0 && (
                        <span className="text-xs text-neutral-600 italic">No sessions yet</span>
                      )}
                    </div>
                  )}

                  {/* Current preset display */}
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <Timer className="text-[18px]" strokeWidth={1.5} />
                    <span>{pomodoroFocusMin}min focus · {pomodoroBreakMin}min break</span>
                  </div>

                  {/* Main buttons */}
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button
                      type="button"
                      onClick={handleToggle}
                      variant="secondary"
                      size="sm"
                      className="px-4 sm:px-6 py-3 sm:py-2.5 rounded-xl font-bold text-sm min-w-0 sm:min-w-[140px] flex-1 sm:flex-none touch-target"
                    >
                      {isPomodoroRunning ? <Pause className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Play className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                      {isPomodoroRunning ? 'Pause' : 'Start'}
                    </Button>

                    <Button
                      type="button"
                      onClick={resetPomodoro}
                      variant="ghost"
                      size="sm"
                      className="px-4 py-3 sm:py-2.5 rounded-xl font-bold text-sm border border-white/10 hover:border-white/20 flex-1 sm:flex-none touch-target"
                    >
                      <RotateCcw className="text-[18px]" strokeWidth={1.5} />
                      Reset
                    </Button>

                    <Button
                      type="button"
                      onClick={isFocusMode ? () => setFocusMode(false) : openFocusPicker}
                      variant="ghost"
                      size="sm"
                      className={`px-4 py-3 sm:py-2.5 rounded-xl font-bold text-sm border transition-all w-full sm:w-auto touch-target ${isFocusMode
                        ? 'border-violet-500/40 text-violet-300 bg-violet-500/10 hover:bg-violet-500/15'
                        : 'border-white/10 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                        }`}
                    >
                      <Layers className="w-[18px] h-[18px]" strokeWidth={1.5} />
                      {isFocusMode
                        ? `Exit ${focusLevel === 'deep' ? 'Deep' : 'Minimal'} Focus`
                        : 'Focus Mode'
                      }
                      {!isFocusMode && <kbd className="hidden sm:inline-block ml-1 text-[9px] opacity-40 font-mono border border-current/30 rounded px-1">F</kbd>}
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${pomodoroFocusMin === p.focus && pomodoroBreakMin === p.brk
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
                <TaskRow
                  task={mainTask}
                  onToggle={() => toggleTaskComplete(mainTask.id)}
                  isActive={activeTaskId === mainTask.id}
                  isDimmed={activeTaskId !== null && activeTaskId !== mainTask.id}
                  onMakeActive={() => handleMakeActive(activeTaskId === mainTask.id ? null : mainTask.id)}
                  unsavedSeconds={activeTaskId === mainTask.id ? sessionSeconds : 0}
                  accentColor="purple"
                />
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
                          <p className="text-[11px] font-mono tracking-wider text-neutral-500 mb-1">{timeStr} — {session.duration_seconds >= 60 ? `${Math.floor(session.duration_seconds / 60)}m` : `${session.duration_seconds}s`} {session.session_type}</p>
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
