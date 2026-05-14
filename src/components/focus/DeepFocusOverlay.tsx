/**
 * DeepFocusOverlay
 * ─────────────────
 * Full-screen immersive environment for Deep Focus mode.
 * Intentionally minimal — the only visible elements are:
 *   • Large animated timer ring
 *   • Current task / objective
 *   • Pause / Resume / End session controls
 *
 * All other content fades away. Controls auto-hide on inactivity.
 * A brief cinematic entry message fades automatically.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, X, Layers, CloudRain } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useLayoutStore } from '../../store/useLayoutStore'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DeepFocusOverlayProps {
  /** Timer remaining seconds */
  pomodoroTime: number
  /** Total seconds in current phase */
  totalPhaseSecs: number
  pomodoroPhase: 'focus' | 'break'
  isPomodoroRunning: boolean
  pomodoroFocusMin: number
  pomodoroBreakMin: number
  /** Currently focused task title */
  activeTaskTitle?: string | null
  /** Total focus time accumulated today in seconds */
  todayFocusSeconds: number
  /** Session count this page-load */
  sessionCount: number
  onToggle: () => void
  onReset: () => void
}

// ── Entry messages ─────────────────────────────────────────────────────────────
const ENTRY_MESSAGES = [
  'One thing. One session.',
  'Stay with the task.',
  'Deep work starts now.',
  'Your best work happens here.',
  'Distraction ends here.',
]

function pickEntryMessage() {
  return ENTRY_MESSAGES[Math.floor(Math.random() * ENTRY_MESSAGES.length)]
}

// ── Animated SVG ring ─────────────────────────────────────────────────────────
function FocusRing({
  progress,
  phase,
  size = 380,
  isPulsing,
}: {
  progress: number
  phase: 'focus' | 'break'
  size?: number
  isPulsing: boolean
}) {
  const strokeW = 8
  const r = (size - strokeW * 2) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)))
  const color = phase === 'focus' ? '#8b5cf6' : '#0ea5e9'
  const glowColor = phase === 'focus' ? 'rgba(139,92,246,0.5)' : 'rgba(14,165,233,0.5)'

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: 'rotate(-90deg)' }}
      aria-hidden="true"
    >
      {/* Outermost ambient ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r + 22}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={isPulsing ? 0.06 : 0.04}
        style={{ transition: 'stroke-opacity 1s' }}
      />
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={strokeW}
      />
      {/* Dashed secondary ring (depth) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeW - 2}
        strokeOpacity={0.07}
        strokeDasharray="3 12"
        strokeLinecap="round"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s ease',
          filter: `drop-shadow(0 0 18px ${glowColor})`,
        }}
      />
    </svg>
  )
}

// ── Session message helper ────────────────────────────────────────────────────
function getSessionMessage(todaySecs: number, sessionCount: number): string | null {
  const mins = Math.floor(todaySecs / 60)
  if (sessionCount >= 4) return 'Exceptional focus today 🔥'
  if (mins >= 90) return "You've been focused for 90 minutes"
  if (mins >= 50) return 'Break recommended soon'
  if (mins >= 25) return `${mins} minutes of deep work`
  return null
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DeepFocusOverlay({
  pomodoroTime,
  totalPhaseSecs,
  pomodoroPhase,
  isPomodoroRunning,
  pomodoroFocusMin,
  pomodoroBreakMin,
  activeTaskTitle,
  todayFocusSeconds,
  sessionCount,
  onToggle,
  onReset,
}: DeepFocusOverlayProps) {
  const { isFocusMode, focusLevel, setFocusMode, openFocusPicker } = useLayoutStore()
  const isDeep = isFocusMode && focusLevel === 'deep'

  // ── Idle tracking ──────────────────────────────────────────────────────────
  const [isIdle, setIsIdle] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetIdle = useCallback(() => {
    setIsIdle(false)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 4000)
  }, [])

  useEffect(() => {
    if (!isDeep) { setIsIdle(false); return }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }))
    resetIdle()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [isDeep, resetIdle])

  // ── Entry message ──────────────────────────────────────────────────────────
  const [entryMsg] = useState(pickEntryMessage)
  const [showEntry, setShowEntry] = useState(true)
  useEffect(() => {
    if (!isDeep) { setShowEntry(true); return }
    const t = setTimeout(() => setShowEntry(false), 4000)
    return () => clearTimeout(t)
  }, [isDeep])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDeep) return
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Escape') { setFocusMode(false); return }
      if (e.key === ' ') { e.preventDefault(); onToggle(); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDeep, setFocusMode, onToggle])

  // ── Derived display ────────────────────────────────────────────────────────
  const progress = totalPhaseSecs > 0 ? pomodoroTime / totalPhaseSecs : 0
  const mm = Math.floor(pomodoroTime / 60).toString().padStart(2, '0')
  const ss = (pomodoroTime % 60).toString().padStart(2, '0')
  const isFocus = pomodoroPhase === 'focus'
  const sessionMsg = getSessionMessage(todayFocusSeconds, sessionCount)
  const displayTask = activeTaskTitle || `${isFocus ? pomodoroFocusMin : pomodoroBreakMin} min ${isFocus ? 'focus session' : 'break'}`

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isDeep && (
        <motion.div
          key="deep-focus-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020204] overflow-hidden select-none ${
            isIdle ? 'cursor-none' : ''
          }`}
        >
          {/* ── Ambient breathing glow ──────────────────────────────────────── */}
          <motion.div
            animate={{
              scale: isPomodoroRunning ? [1, 1.08, 1] : [1, 1.03, 1],
              opacity: isPomodoroRunning ? [0.25, 0.45, 0.25] : [0.1, 0.2, 0.1],
            }}
            transition={{ duration: isFocus ? 7 : 5, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none ${
              isFocus ? 'bg-violet-600' : 'bg-sky-500'
            }`}
          />

          {/* ── Radial vignette ─────────────────────────────────────────────── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          {/* ── Top bar: mode label + exit ──────────────────────────────────── */}
          <motion.div
            animate={{
              opacity: isIdle ? 0 : 1,
              y: isIdle ? -16 : 0,
              pointerEvents: isIdle ? 'none' : 'auto',
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-10"
          >
            {/* Left: phase indicator */}
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ opacity: isPomodoroRunning ? [1, 0.4, 1] : 1 }}
                transition={{ duration: 1.4, repeat: isPomodoroRunning ? Infinity : 0, ease: 'easeInOut' }}
                className={`w-1.5 h-1.5 rounded-full ${isFocus ? 'bg-violet-400' : 'bg-sky-400'}`}
              />
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${isFocus ? 'text-violet-400/70' : 'text-sky-400/70'}`}>
                {isFocus ? 'Deep Focus' : 'Break'}
              </span>
              {sessionCount > 0 && (
                <span className="text-[10px] text-neutral-600 tracking-widest ml-3">
                  Session {sessionCount + 1}
                </span>
              )}
            </div>

            {/* Right: mode switcher + exit */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setFocusMode(false); openFocusPicker() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors border border-transparent hover:border-white/8 font-medium"
                title="Switch focus mode"
              >
                <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
                Switch Mode
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors border border-transparent hover:border-white/8 font-medium"
                title="Ambient sounds (coming soon)"
              >
                <CloudRain className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setFocusMode(false)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 hover:border-white/15 transition-all"
              >
                <X className="w-3 h-3" strokeWidth={2} />
                Exit
                <span className="opacity-40 text-[9px]">ESC</span>
              </button>
            </div>
          </motion.div>

          {/* ── Entry message ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {showEntry && (
              <motion.p
                key="entry-msg"
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 0.45, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-24 left-0 right-0 text-center text-sm font-medium tracking-[0.25em] uppercase text-violet-300/60 pointer-events-none z-10"
              >
                {entryMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Core: ring + timer ──────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Ring */}
            <div className="relative flex items-center justify-center">
              <FocusRing
                progress={progress}
                phase={pomodoroPhase}
                size={380}
                isPulsing={isPomodoroRunning}
              />

              {/* Timer inside ring */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-[11px] font-bold uppercase tracking-[0.35em] mb-4 ${
                  isFocus ? 'text-violet-400/70' : 'text-sky-400/70'
                }`}>
                  {isFocus ? 'Focus' : 'Break'}
                </span>
                <motion.span
                  key={`${mm}:${ss}`}
                  className="font-mono font-black text-white tabular-nums leading-none tracking-tighter"
                  style={{ fontSize: 'clamp(72px, 10vw, 108px)' }}
                >
                  {mm}:{ss}
                </motion.span>
                {sessionCount > 0 && (
                  <div className="flex items-center gap-1 mt-5">
                    {Array.from({ length: Math.min(sessionCount, 8) }).map((_, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${isFocus ? 'bg-violet-500/60' : 'bg-sky-500/60'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Task name ──────────────────────────────────────────────── */}
            <motion.div
              animate={{
                opacity: isIdle ? 0.2 : 1,
                y: isIdle ? 10 : 0,
              }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 text-center px-8 max-w-lg"
            >
              <h2 className={`text-xl md:text-2xl font-bold tracking-tight leading-snug ${
                activeTaskTitle ? 'text-white' : 'text-neutral-500'
              }`}>
                {displayTask}
              </h2>
              {/* Contextual session awareness message */}
              <AnimatePresence>
                {sessionMsg && !showEntry && (
                  <motion.p
                    key={sessionMsg}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="text-[11px] text-neutral-500 mt-3 tracking-wider"
                  >
                    {sessionMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Controls ───────────────────────────────────────────────── */}
            <motion.div
              animate={{
                opacity: isIdle ? 0 : 1,
                y: isIdle ? 14 : 0,
                pointerEvents: isIdle ? 'none' : 'auto',
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 flex items-center gap-5"
            >
              {/* Reset */}
              <motion.button
                onClick={onReset}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 hover:border-white/15 text-neutral-400 hover:text-neutral-200 transition-all"
                title="Reset timer"
              >
                <RotateCcw className="w-4.5 h-4.5" strokeWidth={1.5} style={{ width: 18, height: 18 }} />
              </motion.button>

              {/* Play / Pause — primary action */}
              <motion.button
                onClick={onToggle}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-2xl ${
                  isFocus
                    ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30 hover:shadow-violet-500/40'
                    : 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/30'
                }`}
                style={{ boxShadow: isFocus
                  ? `0 0 40px rgba(139,92,246,${isPomodoroRunning ? 0.35 : 0.2})`
                  : `0 0 30px rgba(14,165,233,${isPomodoroRunning ? 0.35 : 0.2})`
                }}
                title={isPomodoroRunning ? 'Pause (Space)' : 'Resume (Space)'}
              >
                {isPomodoroRunning
                  ? <Pause className="w-8 h-8" strokeWidth={1.5} />
                  : <Play className="w-8 h-8 ml-0.5" strokeWidth={1.5} />
                }
              </motion.button>

              {/* Exit deep focus */}
              <motion.button
                onClick={() => setFocusMode(false)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/8 hover:border-white/15 text-neutral-400 hover:text-neutral-200 transition-all"
                title="Exit focus mode (Esc)"
              >
                <X className="w-4.5 h-4.5" strokeWidth={1.5} style={{ width: 18, height: 18 }} />
              </motion.button>
            </motion.div>

            {/* ── Space hint ─────────────────────────────────────────────── */}
            <motion.p
              animate={{ opacity: isIdle ? 0 : isPomodoroRunning ? 0.18 : 0.28 }}
              transition={{ duration: 0.5 }}
              className="mt-7 text-[10px] text-neutral-400 tracking-[0.3em] uppercase font-medium"
            >
              {isPomodoroRunning ? 'Space to pause' : 'Space to start'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
