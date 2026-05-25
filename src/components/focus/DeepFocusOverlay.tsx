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
import { Play, Pause, RotateCcw, X, CloudRain } from 'lucide-react'
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

// ── Neon typewriter effect ────────────────────────────────────────────────────
function NeonTypewriter({
  text,
  phase,
  isExiting = false,
  onComplete,
}: {
  text: string
  phase: 'focus' | 'break'
  isExiting?: boolean
  onComplete?: () => void
}) {
  const [charCount, setCharCount] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [exitedCount, setExitedCount] = useState(0)
  const isFocus = phase === 'focus'

  // Type one character every 65ms
  useEffect(() => {
    if (isExiting) return
    setCharCount(0)
    const interval = setInterval(() => {
      setCharCount(prev => {
        if (prev >= text.length) {
          clearInterval(interval)
          onComplete?.()
          return prev
        }
        return prev + 1
      })
    }, 65)
    return () => clearInterval(interval)
  }, [text, onComplete, isExiting])

  // Exit: fade letters away from end to start
  useEffect(() => {
    if (!isExiting) { setExitedCount(0); return }
    setExitedCount(0)
    const interval = setInterval(() => {
      setExitedCount(prev => {
        if (prev >= text.length) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 30)
    return () => clearInterval(interval)
  }, [isExiting, text.length])

  // Blinking cursor
  useEffect(() => {
    const blink = setInterval(() => setShowCursor(c => !c), 530)
    return () => clearInterval(blink)
  }, [])

  // Hide cursor 1s after typing completes
  const [cursorVisible, setCursorVisible] = useState(true)
  useEffect(() => {
    if (isExiting) { setCursorVisible(false); return }
    if (charCount >= text.length) {
      const t = setTimeout(() => setCursorVisible(false), 1200)
      return () => clearTimeout(t)
    }
  }, [charCount, text.length, isExiting])

  const neonColor = isFocus ? '#a78bfa' : '#38bdf8'
  const glowShadow = isFocus
    ? '0 0 7px rgba(167,139,250,0.8), 0 0 20px rgba(139,92,246,0.4), 0 0 40px rgba(139,92,246,0.15)'
    : '0 0 7px rgba(56,189,248,0.8), 0 0 20px rgba(14,165,233,0.4), 0 0 40px rgba(14,165,233,0.15)'
  const dimGlow = isFocus
    ? '0 0 4px rgba(167,139,250,0.3), 0 0 12px rgba(139,92,246,0.15)'
    : '0 0 4px rgba(56,189,248,0.3), 0 0 12px rgba(14,165,233,0.15)'

  // During exit: letters fade from end to start
  const getLetterStyle = (i: number) => {
    if (isExiting) {
      const reverseIdx = text.length - 1 - i
      const isGone = reverseIdx < exitedCount
      return {
        opacity: isGone ? 0 : 1,
        color: neonColor,
        textShadow: isGone ? 'none' : dimGlow,
        transition: 'opacity 0.25s ease-out, text-shadow 0.25s ease-out',
      }
    }
    return {
      opacity: i < charCount ? 1 : 0,
      color: neonColor,
      textShadow: i === charCount - 1 ? glowShadow : dimGlow,
      transition: 'opacity 0.08s ease-out, text-shadow 0.5s ease-out',
    }
  }

  return (
    <span
      className="mt-[2.5em] mb-8 text-center text-sm font-medium tracking-[0.25em] uppercase pointer-events-none inline-flex items-center"
      style={{ whiteSpace: 'pre' }}
      aria-label={text}
    >
      {text.split('').map((char, i) => (
        <span key={i} style={getLetterStyle(i)}>
          {char}
        </span>
      ))}
      {cursorVisible && (
        <span
          style={{
            opacity: showCursor ? 0.7 : 0,
            color: neonColor,
            textShadow: glowShadow,
            transition: 'opacity 0.15s',
            marginLeft: '1px',
            fontWeight: 300,
          }}
        >
          |
        </span>
      )}
    </span>
  )
}

// ── Animated SVG ring (matching main page clock design) ───────────────────────
function FocusRing({
  pomodoroTime,
  totalSecs,
  isRunning,
  phase,
  size = 380,
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
  const arcRef = useRef<SVGCircleElement>(null)
  const rafRef = useRef<number>(0)
  const lastTickTimeRef = useRef<number>(performance.now())
  const pomodoroTimeRef = useRef<number>(pomodoroTime)
  const totalSecsRef = useRef<number>(totalSecs)
  const isRunningRef = useRef<boolean>(isRunning)

  useEffect(() => { isRunningRef.current = isRunning }, [isRunning])
  useEffect(() => { totalSecsRef.current = totalSecs }, [totalSecs])

  useEffect(() => {
    lastTickTimeRef.current = performance.now()
    pomodoroTimeRef.current = pomodoroTime
  }, [pomodoroTime])

  useEffect(() => {
    const loop = (now: number) => {
      if (arcRef.current) {
        let p: number
        if (isRunningRef.current) {
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
  }, [circumference])

  // Clock tick marks
  const TICK_COUNT = 60
  const tickOuter = r - stroke / 2 - 3
  const tickInnerMajor = tickOuter - 12
  const tickInnerMinor = tickOuter - 6
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
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
      <defs>
        <filter id="deep-tick-glow" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="deep-tick-glow-major" x="-100%" y="-100%" width="300%" height="300%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer ambient ring */}
      <circle cx={cx} cy={cy} r={r + 22} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.06} />

      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />

      {/* Progress arc — driven by RAF */}
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
        filter={`drop-shadow(0 0 18px ${color}cc)`}
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
            filter={tick.isMajor ? 'url(#deep-tick-glow-major)' : 'url(#deep-tick-glow)'}
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
  const { isFocusMode, focusLevel, setFocusMode } = useLayoutStore()
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
  const [showEntry, setShowEntry] = useState(true)        // controls isExiting
  const [showEntryMounted, setShowEntryMounted] = useState(true) // controls mount/unmount
  useEffect(() => {
    if (!isDeep) { setShowEntry(true); setShowEntryMounted(true); return }
    const t = setTimeout(() => setShowEntry(false), 4000)
    return () => clearTimeout(t)
  }, [isDeep])
  // Delayed unmount: keep mounted long enough for per-letter exit to finish
  useEffect(() => {
    if (showEntry) { setShowEntryMounted(true); return }
    const exitDuration = entryMsg.length * 30 + 400 // 30ms/letter + buffer
    const t = setTimeout(() => setShowEntryMounted(false), exitDuration)
    return () => clearTimeout(t)
  }, [showEntry, entryMsg.length])

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
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020204] overflow-hidden select-none ${isIdle ? 'cursor-none' : ''
            }`}
        >
          {/* ── Ambient breathing glow ──────────────────────────────────────── */}
          <motion.div
            animate={{
              scale: isPomodoroRunning ? [1, 1.08, 1] : [1, 1.03, 1],
              opacity: isPomodoroRunning ? [0.25, 0.45, 0.25] : [0.1, 0.2, 0.1],
            }}
            transition={{ duration: isFocus ? 7 : 5, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none ${isFocus ? 'bg-violet-600' : 'bg-sky-500'
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

            {/* Right: ambient controls */}
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors border border-transparent hover:border-white/8 font-medium"
                title="Ambient sounds (coming soon)"
              >
                <CloudRain className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>


          {/* ── Core: ring + timer ──────────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Entry message — neon typewriter above the ring */}
            {showEntryMounted && (
              <motion.div
                key="entry-msg"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex justify-center"
              >
                <NeonTypewriter text={entryMsg} phase={pomodoroPhase} isExiting={!showEntry} />
              </motion.div>
            )}
            {/* Ring */}
            <div className="relative flex items-center justify-center">
              <FocusRing
                pomodoroTime={pomodoroTime}
                totalSecs={totalPhaseSecs}
                isRunning={isPomodoroRunning}
                phase={pomodoroPhase}
                size={380}
              />

              {/* Timer inside ring */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-[11px] font-bold uppercase tracking-[0.35em] mb-4 ${isFocus ? 'text-violet-400/70' : 'text-sky-400/70'
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
              <h2 className={`text-xl md:text-2xl font-bold tracking-tight leading-snug ${activeTaskTitle ? 'text-white' : 'text-neutral-500'
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
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-2xl ${isFocus
                  ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-600/30 hover:shadow-violet-500/40'
                  : 'bg-sky-500 hover:bg-sky-400 shadow-sky-500/30'
                  }`}
                style={{
                  boxShadow: isFocus
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
