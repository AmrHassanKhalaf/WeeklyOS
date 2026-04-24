import { useEffect, useRef, useState, useCallback } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { useLayoutStore } from '../store/useLayoutStore'
import { useWeekStore } from '../store/useWeekStore'
import type { Task } from '../store/useWeekStore'
import { GlowButton } from '../components/effects/GlowButton'

// ── Preset definitions ────────────────────────────────────────────────────────
const PRESETS = [
  { label: '25 / 5', focus: 25, brk: 5 },
  { label: '50 / 10', focus: 50, brk: 10 },
  { label: '90 / 20', focus: 90, brk: 20 },
]

// ── Circular SVG progress ─────────────────────────────────────────────────────
function CircularProgress({
  progress, // 0..1
  phase,
  size = 280,
}: {
  progress: number
  phase: 'focus' | 'break'
  size?: number
}) {
  const stroke = 8
  const r = (size - stroke * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - progress)

  const focusColor = '#7c3aed'   // violet
  const breakColor = '#0ea5e9'   // sky

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={phase === 'focus' ? focusColor : breakColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={phase === 'focus' ? `6 12` : circumference}
        strokeDashoffset={phase === 'focus' ? undefined : offset}
        style={{
          transition: phase === 'focus' ? 'stroke-dashoffset 0.9s linear, stroke 0.4s' : 'stroke-dashoffset 0.9s linear, stroke 0.4s',
          clipPath: phase === 'focus' ? `polygon(0 0, 100% 0, 100% ${100 * progress}%, 0 ${100 * progress}%)` : undefined
        }}
        filter={`drop-shadow(0 0 10px ${phase === 'focus' ? focusColor : breakColor}aa)`}
      />
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
  size = 'md' 
}: { 
  task: Task; 
  onToggle: () => void; 
  isActive?: boolean;
  onMakeActive?: () => void;
  unsavedSeconds?: number;
  isDimmed?: boolean;
  size?: 'lg' | 'md' | 'sm' 
}) {
  const done = task.status === 'done'
  const totalSeconds = (task.actualDuration || 0) + unsavedSeconds
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const formatSecs = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`

  return (
    <div
      className={`group relative flex items-start gap-4 rounded-2xl border transition-all duration-300 ${
        isActive 
          ? 'border-tertiary/60 bg-gradient-to-r from-tertiary/20 via-tertiary/10 to-transparent shadow-[0_0_24px_rgba(20,184,166,0.25)] scale-[1.02] z-10 ring-1 ring-tertiary/40' 
          : isDimmed 
            ? 'border-white/5 bg-white/[0.01] opacity-40 grayscale hover:opacity-60'
            : done
              ? 'border-white/5 bg-white/[0.02] opacity-50'
              : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-0.5'
      } ${size === 'lg' ? 'p-5' : size === 'md' ? 'p-4' : 'p-3'}`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-tertiary to-primary shadow-[0_0_16px_rgba(20,184,166,0.5)]" />
      )}
      {/* Checkbox */}
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`cursor-pointer mt-0.5 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
        size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
      } ${done ? 'bg-primary border-primary' : isActive ? 'border-tertiary/80 shadow-[0_0_10px_rgba(20,184,166,0.35)]' : 'border-white/20 hover:border-primary/70'}`}>
        {done && (
          <span className="material-symbols-outlined text-white text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
           <p className={`font-semibold leading-snug ${done ? 'line-through' : ''} ${size === 'lg' ? 'text-base' : 'text-sm'}`}>
             {task.title}
           </p>
           {isActive ? (
              <button
                onClick={(e) => { e.stopPropagation(); onMakeActive && onMakeActive(); }}
               className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.16em] border border-tertiary/50 bg-gradient-to-r from-tertiary/20 to-primary/10 text-tertiary hover:from-tertiary/30 hover:to-primary/15 transition-all shadow-[0_0_18px_rgba(20,184,166,0.22)] min-w-[110px]"
              >
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.9)]" /> Active
              </button>
           ) : onMakeActive && !done ? (
              <button
                onClick={(e) => { e.stopPropagation(); onMakeActive(); }}
                className="shrink-0 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/10 min-w-[110px]"
              >
                Focus Task
              </button>
           ) : null}
        </div>
        
        {task.description && size === 'lg' && (
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{task.description}</p>
        )}
        
        <div className="mt-2.5 flex flex-wrap gap-2 items-center">
            {task.estimatedTime && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-white/5 text-neutral-400 px-2 py-0.5 rounded uppercase tracking-wider">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                Est: {task.estimatedTime}
              </span>
            )}
            {formatSecs && (
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-md uppercase tracking-[0.14em] border ${
                 isActive ? 'bg-gradient-to-r from-tertiary/25 to-primary/15 text-tertiary border-tertiary/45 shadow-[0_0_14px_rgba(20,184,166,0.18)]' : 'bg-white/5 text-neutral-300 border-white/10'
              }`}>
                <span className="material-symbols-outlined text-[12px]">data_usage</span>
                Spent Time: {formatSecs}
              </span>
            )}
        </div>
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
  const { isFocusMode, toggleFocusMode } = useLayoutStore()

  const workerRef = useRef<Worker | null>(null)
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customFocus, setCustomFocus] = useState(String(pomodoroFocusMin))
  const [customBreak, setCustomBreak] = useState(String(pomodoroBreakMin))
  const [showPresets, setShowPresets] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)

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
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 pb-24 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-10 items-start">
        
        {/* ── Left Column (Main Content) ─────────────────────────────────── */}
        <div className="space-y-10">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
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
                <CircularProgress progress={progress} phase={pomodoroPhase} size={220} />
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
                    <span className="text-6xl md:text-7xl font-mono font-black text-on-surface tabular-nums tracking-tight leading-none">
                      {formatTime(pomodoroTime)}
                    </span>
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
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                  <span>{pomodoroFocusMin}min focus · {pomodoroBreakMin}min break</span>
                </div>

                {/* Main buttons */}
                <div className="flex flex-wrap gap-3">
                  <GlowButton
                    type="button"
                    onClick={handleToggle}
                    compact
                    variant="secondary"
                    className="px-6 py-2.5 rounded-xl font-bold text-sm min-w-[140px]"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPomodoroRunning ? 'pause' : 'play_arrow'}
                    </span>
                    {isPomodoroRunning ? 'Pause Focus' : 'Start Focus'}
                  </GlowButton>

                  <GlowButton
                    type="button"
                    onClick={resetPomodoro}
                    compact
                    variant="tertiary"
                    className="px-4 py-2.5 rounded-xl font-bold text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    Reset
                  </GlowButton>

                  <GlowButton
                    type="button"
                    onClick={toggleFocusMode}
                    compact
                    variant="tertiary"
                    className="px-4 py-2.5 rounded-xl font-bold text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isFocusMode ? 'visibility' : 'visibility_off'}
                    </span>
                    {isFocusMode ? 'Show' : 'Hide'} UI
                  </GlowButton>
                </div>

                {/* Presets */}
                <div>
                  <button
                    onClick={() => setShowPresets(p => !p)}
                    className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-neutral-500 hover:text-neutral-300 transition-colors font-bold"
                  >
                    <span className="material-symbols-outlined text-[14px]">tune</span>
                    Customize Timer
                    <span className="material-symbols-outlined text-[14px]">
                      {showPresets ? 'expand_less' : 'expand_more'}
                    </span>
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
                            <input
                              type="number"
                              min={1} max={120}
                              value={customFocus}
                              onChange={e => setCustomFocus(e.target.value)}
                              className="w-14 bg-surface-container-lowest border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-primary/50"
                            />
                          </div>
                          <span className="text-neutral-600">/</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Break</span>
                            <input
                              type="number"
                              min={1} max={60}
                              value={customBreak}
                              onChange={e => setCustomBreak(e.target.value)}
                              className="w-14 bg-surface-container-lowest border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-primary/50"
                            />
                          </div>
                          <button
                            onClick={applyCustomPreset}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors uppercase tracking-wider"
                          >
                            Apply
                          </button>
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
                <span className="w-1 h-5 rounded-full bg-primary inline-block" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/90">Main Objective</h2>
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
                        <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-start gap-4">
                      <div>
                        <h3 className={`text-xl font-bold mb-1.5 leading-snug flex items-center gap-2 ${mainTask.status === 'done' ? 'line-through opacity-50' : ''}`}>
                          {mainTask.title}
                          {mainTask.type === 'pinned' && (
                            <span className="material-symbols-outlined text-[16px] text-primary" title="Pinned Task">push_pin</span>
                          )}
                        </h3>
                        {mainTask.description && (
                          <p className="text-sm text-neutral-400 leading-relaxed">{mainTask.description}</p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-1 rounded-md uppercase tracking-wider border border-primary/20 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">star</span>
                            Priority: Critical
                          </span>
                          {mainTask.estimatedTime && (
                            <span className="text-[10px] font-mono bg-white/5 text-neutral-400 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              Est: {mainTask.estimatedTime}
                            </span>
                          )}
                          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md uppercase tracking-[0.14em] border flex items-center gap-1.5 ${
                            activeTaskId === mainTask.id ? 'bg-gradient-to-r from-primary/30 to-tertiary/20 text-primary border-primary/35 shadow-[0_0_14px_rgba(124,58,237,0.18)]' : 'bg-white/5 text-neutral-300 border-white/10'
                          }`}>
                            <span className="material-symbols-outlined text-[12px]">data_usage</span>
                            Spent Time: {Math.floor(((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0)) / 3600) > 0 ? `${Math.floor(((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0)) / 3600)}h ${Math.floor((((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0)) % 3600) / 60)}m` : `${Math.floor((((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0)) % 3600) / 60)}m ${((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0)) % 60}s`}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 pt-1 flex items-center justify-end">
                        {activeTaskId === mainTask.id ? (
                           <GlowButton
                             type="button"
                             onClick={(e) => { e.stopPropagation(); handleMakeActive(null); }}
                             compact
                             variant="tertiary"
                             className="px-5 py-2.5 rounded-xl font-bold text-sm min-w-[120px]"
                           >
                             <div className="flex items-center justify-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(124,58,237,0.8)]" /> Active
                             </div>
                           </GlowButton>
                        ) : mainTask.status !== 'done' ? (
                            <GlowButton
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMakeActive(mainTask.id); }}
                              compact
                              variant="secondary"
                              className="px-5 py-2.5 rounded-xl font-bold text-sm min-w-[120px]"
                            >
                              Focus Task
                            </GlowButton>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-neutral-700 block mb-3">target</span>
                <p className="text-neutral-500 italic text-sm">No high-priority task for this day yet.</p>
                <p className="text-neutral-600 text-xs mt-2">Add one in Weekly Distribution.</p>
              </div>
            )}
          </section>

          {/* Medium Tasks */}
          {mediumTasks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-tertiary inline-block" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-tertiary/80">Supporting Work</h2>
                <span className="ml-auto text-[10px] text-neutral-600 uppercase tracking-widest">
                  {mediumTasks.filter(t => t.status === 'done').length}/{mediumTasks.length} done
                </span>
              </div>
              <div className="space-y-2.5">
                {mediumTasks.map(task => (
                  <TaskRow 
                    key={task.id} 
                    task={task} 
                    onToggle={() => toggleTaskComplete(task.id)} 
                    isActive={activeTaskId === task.id}
                    isDimmed={activeTaskId !== null && activeTaskId !== task.id}
                    onMakeActive={(e) => { e?.stopPropagation(); handleMakeActive(activeTaskId === task.id ? null : task.id) }}
                    unsavedSeconds={activeTaskId === task.id ? sessionSeconds : 0}
                    size="md" 
                  />
                ))}
              </div>
            </section>
          )}

          {/* Quick Wins */}
          {quickWins.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-neutral-500 inline-block" />
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Quick Wins</h2>
                <span className="ml-auto text-[10px] text-neutral-600 uppercase tracking-widest">
                  {quickWins.filter(t => t.status === 'done').length}/{quickWins.length} done
                </span>
              </div>
              <div className={`rounded-2xl border bg-surface-container-low/30 overflow-hidden divide-y divide-white/5 transition-all duration-300 ${
                activeTaskId ? 'border-white/5 opacity-40 grayscale' : 'border-white/8'
              }`}>
                {quickWins.map(task => {
                  const done = task.status === 'done'
                  const isActive = activeTaskId === task.id
                  const isDimmed = activeTaskId !== null && !isActive
                  
                  const totalSeconds = (task.actualDuration || 0) + (isActive ? sessionSeconds : 0)
                  const m = Math.floor(totalSeconds / 60)
                  const formatSecs = `${m}m`

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.04] transition-colors group ${
                        isActive ? 'bg-tertiary/10 border-l-2 border-l-tertiary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id) }}
                          className={`cursor-pointer material-symbols-outlined text-xl shrink-0 transition-colors ${
                            done ? 'text-tertiary' : 'text-neutral-600 group-hover:text-neutral-400 hover:text-tertiary/70'
                          }`}
                          style={done ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                          {done ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <div className="flex flex-col">
                           <span className={`text-sm ${done ? 'line-through opacity-40' : isActive ? 'text-tertiary font-bold' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                             {task.title}
                           </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md uppercase tracking-[0.14em] border ${
                           isActive ? 'bg-gradient-to-r from-tertiary/25 to-primary/10 text-tertiary border-tertiary/40 shadow-[0_0_12px_rgba(20,184,166,0.16)]' : 'bg-white/5 text-neutral-300 border-white/10'
                        }`}>
                          Spent Time: {formatSecs}
                        </span>
                        {isActive ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMakeActive(null); }}
                            className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/20 hover:border-tertiary/50 transition-all min-w-[90px]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> Active
                          </button>
                        ) : !done ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMakeActive(task.id); }}
                            className="shrink-0 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/10 min-w-[90px]"
                          >
                            Focus Task
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!mainTask && mediumTasks.length === 0 && quickWins.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-neutral-700 mb-4 block">inbox</span>
              <p className="text-neutral-500">No tasks scheduled for today.</p>
              <p className="text-neutral-600 text-sm mt-1">Go to Weekly Distribution to assign tasks.</p>
            </div>
          )}

          {/* ── Day Complete ───────────────────────────────────────────────────── */}
          <div className="pt-6 pb-10 flex justify-center">
            <GlowButton
              type="button"
              onClick={() => todayPlan && markDayComplete(todayPlan.day)}
              compact
              variant="secondary"
              className="px-12 py-4 rounded-2xl font-bold group"
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className="material-symbols-outlined text-3xl mb-0.5 group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified
                </span>
                <span className="text-base">Mark Day Complete</span>
                <span className="text-[10px] font-normal uppercase tracking-widest text-tertiary/60">
                  Finalize All Progress
                </span>
              </div>
            </GlowButton>
          </div>
        </div>

        {/* ── Right Column (Sidebar) ─────────────────────────────────────── */}
        <div className="space-y-6 xl:sticky xl:top-8 self-start">
          {/* 1. FOCUS TIME TODAY */}
          <div className="p-6 rounded-3xl border border-white/10 bg-surface-container-lowest/50 backdrop-blur-xl">
             <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-4">Focus Time Today</h3>
             <div className="flex items-end justify-between">
               <div>
                 <span className="text-3xl font-black text-on-surface">{Math.floor(todayFocusSeconds / 3600)}h {Math.floor((todayFocusSeconds % 3600) / 60)}m</span>
                 <p className="text-xs text-tertiary mt-1.5 flex items-center gap-1">
                   <span className="material-symbols-outlined text-[14px]">trending_up</span>
                   +15m from yesterday
                 </p>
               </div>
               {/* Sparkline mock */}
               <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
                 <path d="M0 25 Q 10 15, 20 20 T 40 10 T 60 5" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
             </div>
          </div>

          {/* 2. TODAY'S TASKS */}
          <div className="p-6 rounded-3xl border border-white/10 bg-surface-container-lowest/50 backdrop-blur-xl">
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
          </div>

          {/* 3. FOCUS TIME RECORDS */}
          <div className="p-6 rounded-3xl border border-white/10 bg-surface-container-lowest/50 backdrop-blur-xl">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Focus Time Records</h3>
                <span className="material-symbols-outlined text-neutral-500 text-[18px]">history</span>
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
          </div>

        </div>

      </div>
    </AppLayout>
  )
}
