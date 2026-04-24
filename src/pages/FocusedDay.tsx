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
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s' }}
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
  const m = Math.floor(totalSeconds / 60)
  const formatSecs = totalSeconds > 0 ? `${m}m` : null

  return (
    <div
      className={`group flex items-start gap-4 rounded-2xl border transition-all duration-300 ${
        isActive 
          ? 'border-tertiary/50 bg-tertiary/10 shadow-[0_0_15px_rgba(20,184,166,0.15)] scale-[1.02] z-10 relative' 
          : isDimmed 
            ? 'border-white/5 bg-white/[0.01] opacity-40 grayscale hover:opacity-60'
            : done
              ? 'border-white/5 bg-white/[0.02] opacity-50'
              : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20'
      } ${size === 'lg' ? 'p-5' : size === 'md' ? 'p-4' : 'p-3'}`}
    >
      {/* Checkbox */}
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`cursor-pointer mt-0.5 shrink-0 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
        size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
      } ${done ? 'bg-primary border-primary' : 'border-white/20 hover:border-primary/70'}`}>
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
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/20 hover:border-tertiary/50 transition-all shadow-[0_0_15px_rgba(20,184,166,0.1)]"
              >
                 <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> Active Focus
              </button>
           ) : onMakeActive && !done ? (
              <button
                onClick={(e) => { e.stopPropagation(); onMakeActive(); }}
                className="opacity-0 group-hover:opacity-100 transition-all shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/10"
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
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider border ${
                 isActive ? 'bg-tertiary/20 text-tertiary border-tertiary/30' : 'bg-white/5 text-neutral-400 border-white/10'
              }`}>
                <span className="material-symbols-outlined text-[12px]">timer</span>
                Spent: {formatSecs}
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
    updateTaskActualDuration
  } = useWeekStore()
  const { isFocusMode, toggleFocusMode } = useLayoutStore()

  const workerRef = useRef<Worker | null>(null)
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
    }
    setSessionSeconds(0)
    setActiveTaskId(taskId)
  }, [updateTaskActualDuration])

  // ── Web Worker setup ──────────────────────────────────────────────────────
  useEffect(() => {
    workerRef.current = new Worker('/pomodoroWorker.js')
    workerRef.current.onmessage = () => {
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
    }
    return () => {
      if (activeTaskIdRef.current && sessionSecondsRef.current > 0) {
         void updateTaskActualDuration(activeTaskIdRef.current, sessionSecondsRef.current)
      }
      workerRef.current?.terminate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync worker with running state
  useEffect(() => {
    if (!workerRef.current) return
    workerRef.current.postMessage(isPomodoroRunning ? 'start' : 'stop')
  }, [isPomodoroRunning])

  // Count completed focus sessions (phase switches focus→break)
  const prevPhase = useRef(pomodoroPhase)
  useEffect(() => {
    if (prevPhase.current === 'focus' && pomodoroPhase === 'break') {
      setSessionCount(c => c + 1)
    }
    prevPhase.current = pomodoroPhase
  }, [pomodoroPhase])

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
    } else {
      if ('Notification' in window && Notification.permission !== 'granted') {
        void Notification.requestPermission()
      }
      startPomodoro()
    }
  }, [isPomodoroRunning, startPomodoro, stopPomodoro])

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

  return (
    <AppLayout>
      <div className="max-w-[820px] mx-auto px-4 md:px-8 py-10 pb-24 space-y-10">

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
                  <span className="text-5xl font-mono font-light text-on-surface tabular-nums tracking-tight">
                    {formatTime(pomodoroTime)}
                  </span>
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
        <div className="space-y-8" onClick={() => handleMakeActive(null)}>

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
                          {((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0) > 0) && (
                            <span className={`text-[10px] font-mono px-2 py-1 rounded-md uppercase tracking-wider border flex items-center gap-1 ${
                              activeTaskId === mainTask.id ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-neutral-400 border-white/10'
                            }`}>
                              <span className="material-symbols-outlined text-[12px]">timer</span>
                              Spent: {Math.floor(((mainTask.actualDuration || 0) + (activeTaskId === mainTask.id ? sessionSeconds : 0)) / 60)}m
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 pt-1">
                        {activeTaskId === mainTask.id ? (
                           <GlowButton
                             type="button"
                             onClick={(e) => { e.stopPropagation(); handleMakeActive(null); }}
                             compact
                             variant="tertiary"
                             className="px-4 py-2 rounded-xl font-bold text-xs"
                           >
                             <div className="flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Active Focus
                             </div>
                           </GlowButton>
                        ) : mainTask.status !== 'done' ? (
                          <div className="opacity-0 group-hover:opacity-100 transition-all">
                            <GlowButton
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMakeActive(mainTask.id); }}
                              compact
                              variant="secondary"
                              className="px-4 py-2 rounded-xl font-bold text-xs"
                            >
                              Focus Task
                            </GlowButton>
                          </div>
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
                  const formatSecs = totalSeconds > 0 ? `${m}m` : null

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
                           {isActive ? (
                             <button
                               onClick={(e) => { e.stopPropagation(); handleMakeActive(null); }}
                               className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-tertiary/30 bg-tertiary/10 text-tertiary hover:bg-tertiary/20 hover:border-tertiary/50 transition-all mt-1 w-fit"
                             >
                               <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" /> Active
                             </button>
                           ) : !done ? (
                             <button
                               onClick={(e) => { e.stopPropagation(); handleMakeActive(task.id); }}
                               className="opacity-0 group-hover:opacity-100 transition-all shrink-0 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/10 mt-1 w-fit"
                             >
                               Focus Task
                             </button>
                           ) : null}
                        </div>
                      </div>
                      
                      {formatSecs && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider ${
                           isActive ? 'bg-tertiary/20 text-tertiary' : 'bg-white/5 text-neutral-500'
                        }`}>
                          Spent: {formatSecs}
                        </span>
                      )}
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
        </div>

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
    </AppLayout>
  )
}
