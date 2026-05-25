import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Check, Clock, Timer, Zap, RotateCcw, SlidersHorizontal, Target, Inbox, BadgeCheck, TrendingUp, History, Play, Pause, Focus, ChevronUp, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { useLayoutStore } from '../store/useLayoutStore'
import { useWeekStore } from '../store/useWeekStore'
import type { Task } from '../store/useWeekStore'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { DeepFocusOverlay } from '../components/focus/DeepFocusOverlay'

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
  const tickProgress = totalSecs > 0 ? pomodoroTime / totalSecs : 0

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

  // Interpolate only while the timer is active; idle timers update once.
  useEffect(() => {
    const updateArc = (now = performance.now()) => {
      if (!arcRef.current) return

      const safeTotalSecs = Math.max(totalSecsRef.current, 1)
      const subSec = isRunningRef.current
        ? Math.min((now - lastTickTimeRef.current) / 1000, 1)
        : 0
      const continuousTime = pomodoroTimeRef.current - subSec
      const p = Math.max(0, continuousTime) / safeTotalSecs
      arcRef.current.style.strokeDashoffset = String(circumference * (1 - p))
    }

    if (!isRunning) {
      updateArc()
      return
    }

    const loop = (now: number) => {
      updateArc(now)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [circumference, isRunning, pomodoroTime, totalSecs])

  // Clock tick marks — drawn inside the ring, update once/second (discrete is fine)
  const TICK_COUNT = 60
  const tickOuter = r - stroke / 2 - 2
  const tickInnerMajor = tickOuter - 9
  const tickInnerMinor = tickOuter - 5
  const ticks = useMemo(() => Array.from({ length: TICK_COUNT }, (_, i) => {
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
  }), [cx, cy, tickInnerMajor, tickInnerMinor, tickOuter, tickProgress])

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
            filter={tick.isMajor ? 'url(#tick-glow-major)' : undefined}
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
  isRunning,
}: {
  task: Task
  onToggle: () => void
  isActive?: boolean
  onMakeActive?: () => void
  unsavedSeconds?: number
  isDimmed?: boolean
  accentColor?: 'purple' | 'teal' | 'yellow'
  isRunning?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const done = task.status === 'done'
  const totalSecs = (task.actualDuration || 0) + unsavedSeconds
  const taskDuration = `${Math.floor(totalSecs / 60)}m ${(totalSecs % 60).toString().padStart(2, '0')}s`

  // ── Per-section color palette (full class strings for Tailwind JIT) ──────────
  const C = accentColor === 'purple'
    ? {
      containerActive: 'border-violet-300/55 bg-gradient-to-br from-violet-500/[0.18] via-violet-500/[0.075] to-transparent shadow-[0_0_34px_rgba(139,92,246,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]',
      containerHover: 'border-violet-500/40 bg-gradient-to-br from-violet-500/[0.08] to-transparent shadow-[0_0_16px_rgba(139,92,246,0.16)]',
      containerIdle: 'border-violet-500/10 bg-transparent',
      stripe: 'bg-violet-300 shadow-[0_0_16px_rgba(167,139,250,0.95)]',
      titleActive: 'text-violet-100 font-black drop-shadow-[0_0_10px_rgba(167,139,250,0.35)]',
      titleHover: 'text-neutral-100 font-semibold',
      pill: 'border-violet-300/30 bg-violet-500/14 text-violet-200',
      btnActive: 'border-violet-300/42 bg-violet-500/14 text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.18)]',
      btnHover: 'border-violet-500/60 bg-violet-500/20 text-violet-200',
      btnIdle: 'border-violet-500/30 bg-transparent text-violet-400 hover:bg-violet-500/10',
      dot: 'bg-violet-400',
      activeGlow: 'shadow-[0_0_42px_rgba(139,92,246,0.36)] ring-1 ring-violet-200/24',
      runningGlow: 'shadow-[0_0_54px_rgba(139,92,246,0.46)] ring-1 ring-violet-100/35',
      wash: 'bg-[radial-gradient(circle_at_18%_8%,rgba(196,181,253,0.16),transparent_34%),linear-gradient(90deg,rgba(139,92,246,0.10),transparent_58%)]',
    }
    : accentColor === 'yellow'
      ? {
        containerActive: 'border-amber-200/48 bg-gradient-to-br from-amber-400/[0.16] via-amber-400/[0.06] to-transparent shadow-[0_0_32px_rgba(251,191,36,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]',
        containerHover: 'border-amber-400/35 bg-gradient-to-br from-amber-400/[0.07] to-transparent shadow-[0_0_14px_rgba(251,191,36,0.15)]',
        containerIdle: 'border-amber-400/10 bg-transparent',
        stripe: 'bg-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.9)]',
        titleActive: 'text-amber-100 font-black drop-shadow-[0_0_10px_rgba(251,191,36,0.32)]',
        titleHover: 'text-neutral-100 font-semibold',
        pill: 'border-amber-200/28 bg-amber-400/12 text-amber-200',
        btnActive: 'border-amber-200/40 bg-amber-400/12 text-amber-200 shadow-[0_0_18px_rgba(251,191,36,0.16)]',
        btnHover: 'border-amber-400/60 bg-amber-400/20 text-amber-200',
        btnIdle: 'border-amber-400/35 bg-transparent text-amber-300 hover:bg-amber-400/10',
        dot: 'bg-amber-300',
        activeGlow: 'shadow-[0_0_40px_rgba(251,191,36,0.28)] ring-1 ring-amber-100/22',
        runningGlow: 'shadow-[0_0_52px_rgba(251,191,36,0.38)] ring-1 ring-amber-100/32',
        wash: 'bg-[radial-gradient(circle_at_18%_8%,rgba(253,230,138,0.14),transparent_34%),linear-gradient(90deg,rgba(251,191,36,0.08),transparent_58%)]',
      }
      : {
        containerActive: 'border-teal-200/52 bg-gradient-to-br from-teal-500/[0.16] via-teal-500/[0.065] to-transparent shadow-[0_0_34px_rgba(45,212,191,0.26),inset_0_1px_0_rgba(255,255,255,0.08)]',
        containerHover: 'border-teal-500/35 bg-gradient-to-br from-teal-500/[0.07] to-transparent shadow-[0_0_14px_rgba(20,184,166,0.14)]',
        containerIdle: 'border-teal-500/10 bg-transparent',
        stripe: 'bg-teal-200 shadow-[0_0_16px_rgba(45,212,191,0.95)]',
        titleActive: 'text-teal-100 font-black drop-shadow-[0_0_10px_rgba(45,212,191,0.35)]',
        titleHover: 'text-neutral-100 font-semibold',
        pill: 'border-teal-200/28 bg-teal-500/12 text-teal-200',
        btnActive: 'border-teal-200/42 bg-teal-500/12 text-teal-200 shadow-[0_0_20px_rgba(45,212,191,0.18)]',
        btnHover: 'border-teal-500/60 bg-teal-500/20 text-teal-200',
        btnIdle: 'border-teal-500/35 bg-transparent text-teal-400 hover:bg-teal-500/10',
        dot: 'bg-teal-400',
        activeGlow: 'shadow-[0_0_42px_rgba(45,212,191,0.32)] ring-1 ring-teal-100/24',
        runningGlow: 'shadow-[0_0_54px_rgba(45,212,191,0.44)] ring-1 ring-teal-100/34',
        wash: 'bg-[radial-gradient(circle_at_18%_8%,rgba(153,246,228,0.15),transparent_34%),linear-gradient(90deg,rgba(45,212,191,0.09),transparent_58%)]',
      }

  // ── Derived display state ─────────────────────────────────────────────────────
  const showExpanded = (isActive || (isHovered && !done)) && !isDimmed
  const showStripe = showExpanded

  const containerCls = isDimmed
    ? 'border-white/5 bg-transparent opacity-25 grayscale'
    : done
      ? 'border-white/[0.06] bg-transparent opacity-45 grayscale'
      : isActive
        ? `${C.containerActive} ${isRunning ? C.runningGlow : C.activeGlow}`
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
      {isActive && (
        <div className={`pointer-events-none absolute inset-0 ${C.wash} ${isRunning ? 'opacity-100' : 'opacity-75'}`} />
      )}
      {/* Left accent stripe — visible when hovered or active */}
      {showStripe && (
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-all duration-300 ${C.stripe}`} />
      )}

      <div className="px-4 py-3 transition-all duration-300">

        {/* ── Main row (always visible) ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className="group/check -ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-ring"
            aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
          >
            <span
              className={`flex items-center justify-center rounded-full border transition-all duration-200 ${
                done
                  ? 'border-neutral-500 bg-neutral-700 text-neutral-300'
                  : 'border-neutral-500 text-transparent group-hover/check:border-neutral-300 group-hover/check:bg-white/[0.03]'
              }`}
              style={{ width: 22, height: 22 }}
            >
              {done && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
            </span>
          </button>

          {/* Title + metadata */}
          <div className="min-w-0 flex-1">
            <span className={`block truncate text-base font-bold transition-all duration-200 ${titleCls}`}>
              {task.title}
            </span>
            <div
              className={`mt-1 flex flex-wrap items-center gap-2 overflow-hidden text-[10px] font-mono uppercase tracking-wider transition-all duration-300 ${
                isDimmed || done ? 'max-h-0 opacity-0' : 'max-h-7 opacity-100'
              } ${isActive || isHovered ? 'text-neutral-400' : 'text-neutral-600'}`}
            >
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-300 ${isActive || isHovered ? C.pill + ' border' : ''}`}>
                <Timer className="w-3 h-3" strokeWidth={1.5} />
                {taskDuration}
              </span>
              {task.estimatedTime && (
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-300 ${isActive || isHovered ? C.pill + ' border' : ''}`}>
                  <Clock className="w-3 h-3" strokeWidth={1.5} />
                  Est: {task.estimatedTime}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          {isActive ? (
            <button
              onClick={(e) => { e.stopPropagation(); onMakeActive?.() }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 touch-target rounded-lg text-[11px] font-bold uppercase tracking-wider border transition-all ${C.btnActive}`}
            >
              <span className={`w-3 h-3 rounded-full ${C.dot} ${isRunning ? 'animate-pulse' : ''}`} />
              {isRunning ? 'Running' : 'Active'}
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
      </div>
    </div>
  )
}



// ── Main page ─────────────────────────────────────────────────────────────────
type TaskGateSection = {
  label: string
  tone: 'purple' | 'teal' | 'yellow'
  tasks: Task[]
}

function TaskPickerGate({
  sections,
  onChooseTask,
  onStartWithoutTask,
  onCancel,
}: {
  sections: TaskGateSection[]
  onChooseTask: (taskId: string) => void
  onStartWithoutTask: () => void
  onCancel: () => void
}) {
  const toneClass = {
    purple: {
      dot: 'bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.85)]',
      label: 'text-violet-300',
      border: 'border-violet-400/20 hover:border-violet-300/45 hover:bg-violet-500/[0.08]',
      chip: 'border-violet-400/20 bg-violet-500/10 text-violet-300',
    },
    teal: {
      dot: 'bg-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.8)]',
      label: 'text-teal-300',
      border: 'border-teal-400/18 hover:border-teal-300/42 hover:bg-teal-500/[0.07]',
      chip: 'border-teal-400/20 bg-teal-500/10 text-teal-300',
    },
    yellow: {
      dot: 'bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]',
      label: 'text-amber-300',
      border: 'border-amber-300/18 hover:border-amber-300/42 hover:bg-amber-400/[0.07]',
      chip: 'border-amber-300/20 bg-amber-400/10 text-amber-300',
    },
  } as const

  const visibleSections = sections.filter((section) => section.tasks.length > 0)
  const taskCount = visibleSections.reduce((total, section) => total + section.tasks.length, 0)

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close task picker"
        onClick={onCancel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[120] cursor-default bg-black/45 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-3 top-[calc(var(--safe-top,0px)+4.75rem)] z-[130] mx-auto flex max-h-[calc(100dvh-6rem)] max-w-[960px] flex-col overflow-hidden rounded-[1.65rem] border border-primary/30 bg-surface-container-lowest/95 shadow-[0_28px_90px_-28px_rgba(0,0,0,0.95),0_0_46px_rgba(124,58,237,0.18),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-lg sm:top-[calc(var(--safe-top,0px)+5.75rem)] sm:max-h-[min(70dvh,620px)] sm:rounded-[1.75rem]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-target-title"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/45 to-transparent" />
        <div className="flex items-start gap-3 border-b border-primary/10 bg-primary/[0.035] px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary shadow-[0_0_24px_rgba(139,92,246,0.16)]">
            <Target className="w-5 h-5" strokeWidth={1.65} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p id="focus-target-title" className="text-sm font-black text-on-surface sm:text-base">Choose focus target</p>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary/80">
                {taskCount} tasks
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant/70">
              Attach this session to today's work, or run a loose session.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/25 bg-surface-container-low/60 text-on-surface-variant transition-all hover:border-primary/35 hover:text-primary"
            aria-label="Close task picker"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3.5 sm:px-5 sm:py-4">
          {visibleSections.length > 0 ? (
            <div className="space-y-4">
              {visibleSections.map((section) => {
                const tone = toneClass[section.tone]
                return (
                  <section key={section.label} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
                      <h3 className={`text-[10px] font-black uppercase tracking-[0.22em] ${tone.label}`}>
                        {section.label}
                      </h3>
                      <span className="ml-auto text-[10px] font-mono text-neutral-600">{section.tasks.length}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {section.tasks.map((task) => {
                        const secs = task.actualDuration || 0
                        const duration = `${Math.floor(secs / 60)}m`
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => onChooseTask(task.id)}
                            className={`group/task rounded-2xl border bg-black/18 px-3 py-3 text-left transition-all duration-200 ${tone.border}`}
                          >
                            <span className="block truncate text-sm font-black text-neutral-200 group-hover/task:text-white">{task.title}</span>
                            <span className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[10px] font-mono uppercase ${tone.chip}`}>
                                <Timer className="h-3 w-3" strokeWidth={1.5} />
                                {duration}
                              </span>
                              {task.estimatedTime && (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-mono uppercase text-neutral-500">
                                  <Clock className="h-3 w-3" strokeWidth={1.5} />
                                  Est: {task.estimatedTime}
                                </span>
                              )}
                            </span>
                            <span className="mt-2 block text-[9px] font-black uppercase tracking-[0.18em] text-neutral-600 transition-colors group-hover/task:text-neutral-400">
                              Make active and start
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-6 text-center text-sm text-neutral-500">
              No pending tasks for today.
            </div>
          )}
        </div>

        <div className="shrink-0 grid grid-cols-[1fr_auto] gap-2 border-t border-primary/10 bg-surface-container-lowest/98 px-4 py-3 shadow-[0_-16px_32px_-26px_rgba(0,0,0,0.95)] sm:flex sm:items-center sm:px-5">
          <button
            type="button"
            onClick={onStartWithoutTask}
            className="group/no-task relative overflow-hidden rounded-2xl border border-violet-300/42 bg-violet-500/18 px-4 py-3 text-left text-violet-100 shadow-[0_0_28px_rgba(139,92,246,0.22)] transition-all hover:border-violet-200/60 hover:bg-violet-500/24 sm:min-w-[240px]"
          >
            <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/16 to-transparent transition-transform duration-700 group-hover/no-task:translate-x-[120%]" />
            <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-violet-100/55 to-transparent" />
            <span className="relative block text-sm font-black">Start without task</span>
            <span className="relative mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/62">Loose focus session</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl px-3 py-3 text-xs font-bold text-neutral-600 transition-colors hover:text-neutral-300 sm:ml-auto"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </>
  )
}

export function FocusedDay() {
  const currentWeek = useWeekStore(state => state.currentWeek)
  const isLoadingWeek = useWeekStore(state => state.isLoadingWeek)
  const pomodoroTime = useWeekStore(state => state.pomodoroTime)
  const isPomodoroRunning = useWeekStore(state => state.isPomodoroRunning)
  const pomodoroPhase = useWeekStore(state => state.pomodoroPhase)
  const pomodoroFocusMin = useWeekStore(state => state.pomodoroFocusMin)
  const pomodoroBreakMin = useWeekStore(state => state.pomodoroBreakMin)
  const startPomodoro = useWeekStore(state => state.startPomodoro)
  const stopPomodoro = useWeekStore(state => state.stopPomodoro)
  const tickPomodoro = useWeekStore(state => state.tickPomodoro)
  const resetPomodoro = useWeekStore(state => state.resetPomodoro)
  const setPomodoroPreset = useWeekStore(state => state.setPomodoroPreset)
  const toggleTaskComplete = useWeekStore(state => state.toggleTaskComplete)
  const markDayComplete = useWeekStore(state => state.markDayComplete)
  const updateTaskActualDuration = useWeekStore(state => state.updateTaskActualDuration)
  const focusSessions = useWeekStore(state => state.focusSessions)
  const saveFocusSession = useWeekStore(state => state.saveFocusSession)
  const isFocusMode = useLayoutStore(state => state.isFocusMode)
  const focusLevel = useLayoutStore(state => state.focusLevel)
  const setFocusMode = useLayoutStore(state => state.setFocusMode)
  const autoEnterFocusOnStart = useLayoutStore(state => state.autoEnterFocusOnStart)
  const setTaskPickerOpen = useLayoutStore(state => state.setTaskPickerOpen)

  const workerRef = useRef<Worker | null>(null)
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customFocus, setCustomFocus] = useState(String(pomodoroFocusMin))
  const [customBreak, setCustomBreak] = useState(String(pomodoroBreakMin))
  const [showPresets, setShowPresets] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [timerSelection, setTimerSelection] = useState<'preset' | 'custom'>('preset')
  const [showTaskPrompt, setShowTaskPrompt] = useState(false)
  const [isLooseSession, setIsLooseSession] = useState(false)
  const [showTodayTasksList, setShowTodayTasksList] = useState(true)
  const [showFocusRecordsList, setShowFocusRecordsList] = useState(true)

  useEffect(() => {
    setTaskPickerOpen(showTaskPrompt)
    return () => setTaskPickerOpen(false)
  }, [setTaskPickerOpen, showTaskPrompt])

  useEffect(() => {
    const matchesPreset = PRESETS.some((p) => p.focus === pomodoroFocusMin && p.brk === pomodoroBreakMin)
    if (!matchesPreset) setTimerSelection('custom')
  }, [pomodoroFocusMin, pomodoroBreakMin])

  useEffect(() => {
    if (isFocusMode && focusLevel !== 'deep') {
      setFocusMode(false)
    }
  }, [focusLevel, isFocusMode, setFocusMode])

  // ── Global keyboard shortcut: F toggles focus picker ─────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key.toLowerCase() === 'f') {
        if (isFocusMode) {
          setFocusMode(false)
        } else {
          setFocusMode(true, 'deep')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode, setFocusMode])

  // ── Auto-enter focus on session start ─────────────────────────────────────
  const prevRunning = useRef(isPomodoroRunning)
  useEffect(() => {
    if (!prevRunning.current && isPomodoroRunning && autoEnterFocusOnStart && !isFocusMode) {
      setFocusMode(true, 'deep')
    }
    prevRunning.current = isPomodoroRunning
  }, [isPomodoroRunning, autoEnterFocusOnStart, isFocusMode, setFocusMode])

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
    setIsLooseSession(false)
    setShowTaskPrompt(false)
    if (taskId && !isPomodoroRunningRef.current) {
      startPomodoro()
    }
  }, [updateTaskActualDuration, saveFocusSession, startPomodoro])

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
    } catch {
      // The interval fallback below keeps the timer running if workers are unavailable.
    }

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

  const startTimerNow = useCallback(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      void Notification.requestPermission()
    }
    startPomodoro()
    if (workerRef.current) workerRef.current.postMessage('start')
    else if (!fallbackIntervalRef.current) fallbackIntervalRef.current = setInterval(handlePomodoroTick, 1000)
  }, [handlePomodoroTick, startPomodoro])

  const handleReset = useCallback(() => {
    resetPomodoro()
    setShowTaskPrompt(false)
    setIsLooseSession(false)
  }, [resetPomodoro])

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
      if (pomodoroPhaseRef.current === 'focus' && !activeTaskIdRef.current && !isLooseSession) {
        setShowTaskPrompt(true)
        return
      }
      setShowTaskPrompt(false)
      startTimerNow()
    }
  }, [isLooseSession, isPomodoroRunning, stopPomodoro, saveFocusSession, startTimerNow, updateTaskActualDuration])

  const applyCustomPreset = () => {
    const f = Math.max(1, Math.min(120, Number(customFocus) || 25))
    const b = Math.max(1, Math.min(60, Number(customBreak) || 5))
    setPomodoroPreset(f, b)
    setTimerSelection('custom')
    setShowCustom(false)
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
  const isDeepFocus = isFocusMode && focusLevel === 'deep'
  const pageGridClass = 'xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] xl:gap-10'
  const sideColumnClass = 'xl:sticky xl:top-8'

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
            : undefined
        }
        todayFocusSeconds={todayFocusSeconds}
        sessionCount={sessionCount}
        onToggle={handleToggle}
        onReset={handleReset}
      />

      <AnimatePresence>
        {showTaskPrompt && (
          <TaskPickerGate
            sections={[
              { label: 'Main Objective', tone: 'purple', tasks: mainTask && mainTask.status !== 'done' ? [mainTask] : [] },
              { label: 'Supporting Tasks', tone: 'teal', tasks: mediumTasks.filter(task => task.status !== 'done') },
              { label: 'Quick Wins', tone: 'yellow', tasks: quickWins.filter(task => task.status !== 'done') },
            ]}
            onChooseTask={handleMakeActive}
            onStartWithoutTask={() => {
              setIsLooseSession(true)
              setShowTaskPrompt(false)
              startTimerNow()
            }}
            onCancel={() => setShowTaskPrompt(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        className={`container-responsive py-responsive mx-auto max-w-full overflow-x-hidden items-start transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isDeepFocus
          ? 'opacity-0 blur-xl scale-[0.98] pointer-events-none absolute'
          : `grid grid-cols-1 gap-6 sm:gap-8 opacity-100 max-w-[1200px] pb-24 ${pageGridClass}`
          }`}
      >

        {/* ── Left Column (Main Content) ─────────────────────────────────── */}
        <motion.div className="min-w-0 space-y-10">

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
                      <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-black text-on-surface tabular-nums tracking-tight leading-none">
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
                <div className="flex-1 w-full min-w-0 space-y-4">
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
                  <div className="rounded-[1.65rem] border border-white/[0.08] bg-black/[0.14] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                    <Button
                      type="button"
                      onClick={handleToggle}
                      variant="secondary"
                      size="sm"
                      className="group relative h-14 px-4 sm:px-6 rounded-2xl font-bold text-sm min-w-0 touch-target justify-center overflow-hidden shadow-[0_18px_42px_-18px_rgba(139,92,246,0.95)] hover:shadow-[0_22px_48px_-18px_rgba(139,92,246,1)]"
                    >
                      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/18 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                      {isPomodoroRunning
                        ? <Pause className="relative w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                        : <Play className="relative w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110" strokeWidth={1.5} />
                      }
                      <span className="relative">{isPomodoroRunning ? 'Pause' : 'Start'}</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={handleReset}
                      variant="ghost"
                      size="sm"
                      className="group relative h-14 px-4 rounded-2xl font-bold text-sm border border-white/10 hover:border-violet-300/25 touch-target justify-center overflow-hidden bg-white/[0.015] hover:bg-violet-500/[0.045] hover:text-violet-100"
                    >
                      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                      <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <RotateCcw className="relative text-[18px] transition-transform duration-500 group-hover:-rotate-180" strokeWidth={1.7} />
                      <span className="relative">Reset</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={isDeepFocus ? () => setFocusMode(false) : () => setFocusMode(true, 'deep')}
                      variant="ghost"
                      size="sm"
                      className={`group relative h-14 px-4 rounded-2xl font-bold text-sm border transition-all touch-target justify-center overflow-hidden sm:col-span-2 ${isFocusMode
                        ? 'border-violet-500/40 text-violet-300 bg-violet-500/10 hover:bg-violet-500/15 shadow-[0_0_28px_rgba(139,92,246,0.16)]'
                        : 'border-white/10 bg-white/[0.015] hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                        }`}
                    >
                      <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,0.16),transparent_48%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                      <Focus className="relative w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110" strokeWidth={1.7} />
                      <span className="relative text-left leading-tight">
                        {isDeepFocus ? 'Exit Defocus' : 'Defocus'}
                      </span>
                      {!isFocusMode && <kbd className="relative hidden sm:inline-block ml-1 text-[9px] opacity-40 font-mono border border-current/30 rounded px-1">F</kbd>}
                    </Button>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="rounded-3xl border border-white/[0.07] bg-black/[0.12] p-3.5 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <button
                      onClick={() => setShowPresets(p => !p)}
                      className="group flex w-full items-center justify-between gap-3 text-left transition-colors"
                      aria-expanded={showPresets}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-neutral-400 transition-all duration-300 group-hover:border-primary/30 group-hover:text-primary group-hover:bg-primary/5">
                          <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] uppercase tracking-[0.22em] text-neutral-400 group-hover:text-neutral-200 font-black">Customize Timer</span>
                          <span className="mt-1 block text-[11px] text-neutral-600 group-hover:text-neutral-500">
                            Presets or your own rhythm
                          </span>
                        </span>
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-neutral-500 transition-all duration-300 group-hover:text-neutral-300">
                        {showPresets ? <ChevronUp className="w-[14px] h-[14px]" strokeWidth={1.8} /> : <ChevronDown className="w-[14px] h-[14px]" strokeWidth={1.8} />}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                    {showPresets && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                        className="mt-4 space-y-3 overflow-hidden will-change-[height,opacity]"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {PRESETS.map(p => (
                            <button
                              key={p.label}
                              onClick={() => {
                                setTimerSelection('preset')
                                setShowCustom(false)
                                setPomodoroPreset(p.focus, p.brk)
                              }}
                              className={`group/preset relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all ${timerSelection === 'preset' && pomodoroFocusMin === p.focus && pomodoroBreakMin === p.brk
                                ? 'border-primary/60 bg-primary/15 text-primary shadow-[0_0_24px_rgba(139,92,246,0.16)]'
                                : 'border-white/10 bg-white/[0.018] text-neutral-400 hover:border-white/25 hover:text-white hover:bg-white/[0.04]'
                                }`}
                            >
                              <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />
                              <span className="block text-sm font-black tabular-nums">{p.focus} / {p.brk}</span>
                              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] opacity-45">minutes</span>
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setTimerSelection('custom')
                              setShowCustom(c => !c)
                            }}
                            className={`relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all ${timerSelection === 'custom'
                              ? 'border-teal-300/45 bg-teal-500/10 text-teal-200 shadow-[0_0_22px_rgba(45,212,191,0.12)]'
                              : 'border-white/10 bg-white/[0.018] text-neutral-400 hover:border-teal-300/30 hover:text-teal-200 hover:bg-teal-500/[0.05]'
                              }`}
                          >
                            <span className="block text-sm font-black">Custom</span>
                            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] opacity-45">manual</span>
                          </button>
                        </div>

                        <AnimatePresence initial={false}>
                        {showCustom && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.985, height: 0 }}
                            animate={{ opacity: 1, y: 0, scale: 1, height: 'auto' }}
                            exit={{ opacity: 0, y: -6, scale: 0.985, height: 0 }}
                            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                            className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] items-end gap-3 rounded-2xl border border-teal-300/10 bg-teal-500/[0.035] p-3"
                          >
                            <label className="space-y-1.5">
                              <span className="text-[10px] text-neutral-500 uppercase tracking-[0.22em] font-bold">Focus</span>
                              <div className="relative">
                              <Input
                                type="number"
                                min={1} max={120}
                                value={customFocus}
                                onChange={e => setCustomFocus(e.target.value)}
                                  className="w-full h-11 rounded-2xl border-teal-300/15 bg-black/20 pr-10 text-center text-base font-black tabular-nums"
                              />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-neutral-600">min</span>
                              </div>
                            </label>
                            <span className="hidden sm:flex h-11 items-center text-neutral-700 font-black">/</span>
                            <label className="space-y-1.5">
                              <span className="text-[10px] text-neutral-500 uppercase tracking-[0.22em] font-bold">Break</span>
                              <div className="relative">
                              <Input
                                type="number"
                                min={1} max={60}
                                value={customBreak}
                                onChange={e => setCustomBreak(e.target.value)}
                                  className="w-full h-11 rounded-2xl border-teal-300/15 bg-black/20 pr-10 text-center text-base font-black tabular-nums"
                              />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-neutral-600">min</span>
                              </div>
                            </label>
                            <Button
                              onClick={applyCustomPreset}
                              variant="secondary"
                              size="sm"
                              className="h-11 rounded-2xl px-5 text-xs uppercase tracking-wider justify-center"
                            >
                              Apply
                            </Button>
                          </motion.div>
                        )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tasks ──────────────────────────────────────────────────────────── */}
          <div className="space-y-8">

            {/* Main Objective */}
            <section className="rounded-3xl border border-violet-500/15 bg-violet-500/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
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
                  isRunning={isPomodoroRunning}
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
              <section className="rounded-3xl border border-teal-500/15 bg-teal-500/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-4 rounded-full bg-teal-500 inline-block" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400">Supporting Tasks</h2>
                  <span className="ml-auto text-[10px] text-neutral-600 uppercase tracking-widest">
                    {mediumTasks.filter(t => t.status === 'done').length}/{mediumTasks.length} Done
                  </span>
                </div>
                <div className={`grid gap-2 ${mediumTasks.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
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
                      isRunning={isPomodoroRunning}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Quick Wins */}
            {quickWins.length > 0 && (
              <section className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-4 rounded-full bg-amber-400 inline-block" />
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Quick Wins</h2>
                  <span className="ml-auto text-[10px] text-neutral-600 uppercase tracking-widest">
                    {quickWins.filter(t => t.status === 'done').length}/{quickWins.length} Done
                  </span>
                </div>
                <div className={`grid gap-2 ${quickWins.length > 1 ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {quickWins.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={() => toggleTaskComplete(task.id)}
                      isActive={activeTaskId === task.id}
                      isDimmed={activeTaskId !== null && activeTaskId !== task.id}
                      onMakeActive={() => handleMakeActive(activeTaskId === task.id ? null : task.id)}
                      unsavedSeconds={activeTaskId === task.id ? sessionSeconds : 0}
                      accentColor="yellow"
                      isRunning={isPomodoroRunning}
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
          {!isFocusMode && (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
              exit={{ opacity: 0, filter: 'blur(10px)', x: 20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`min-w-0 space-y-6 self-start ${sideColumnClass}`}
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
              <Card variant="glass" className="overflow-hidden rounded-3xl border border-white/10 bg-surface-container-lowest/50">
                <button
                  type="button"
                  onClick={() => setShowTodayTasksList(v => !v)}
                  className="group flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition-colors hover:bg-white/[0.025]"
                  aria-expanded={showTodayTasksList}
                >
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-neutral-300">Today's Tasks</span>
                    <span className="mt-1 block text-[10px] font-mono text-neutral-600">
                      {[todayPlan.highTask, ...todayPlan.mediumTasks, ...todayPlan.smallTasks].filter(Boolean).length} items
                    </span>
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-neutral-500 transition-all group-hover:border-primary/30 group-hover:text-primary">
                    {showTodayTasksList ? <ChevronUp className="w-4 h-4" strokeWidth={1.8} /> : <ChevronDown className="w-4 h-4" strokeWidth={1.8} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {showTodayTasksList && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-white/[0.06]"
                    >
                      <div className="custom-scrollbar max-h-64 space-y-4 overflow-y-auto overscroll-contain px-6 py-5">
                  {[todayPlan.highTask, ...todayPlan.mediumTasks, ...todayPlan.smallTasks].filter(Boolean).map(task => (
                    <div key={task!.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 w-2 h-2 rounded-full ${task!.priority === 'high' ? 'bg-primary shadow-[0_0_8px_#7c3aed]' : task!.priority === 'medium' ? 'bg-tertiary shadow-[0_0_8px_#14b8a6]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]'}`} />
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* 3. FOCUS TIME RECORDS */}
              <Card variant="glass" className="overflow-hidden rounded-3xl border border-white/10 bg-surface-container-lowest/50">
                <button
                  type="button"
                  onClick={() => setShowFocusRecordsList(v => !v)}
                  className="group flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition-colors hover:bg-white/[0.025]"
                  aria-expanded={showFocusRecordsList}
                >
                  <span className="flex items-center gap-3">
                    <History className="text-neutral-500 text-[18px] group-hover:text-primary" strokeWidth={1.5} />
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-500 group-hover:text-neutral-300">Focus Time Records</span>
                      <span className="mt-1 block text-[10px] font-mono text-neutral-600">
                        {focusSessions.length} records
                      </span>
                    </span>
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-neutral-500 transition-all group-hover:border-primary/30 group-hover:text-primary">
                    {showFocusRecordsList ? <ChevronUp className="w-4 h-4" strokeWidth={1.8} /> : <ChevronDown className="w-4 h-4" strokeWidth={1.8} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {showFocusRecordsList && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-white/[0.06]"
                    >
                      <div className="custom-scrollbar max-h-72 overflow-y-auto overscroll-contain px-6 py-5">
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AppLayout>
  )
}
