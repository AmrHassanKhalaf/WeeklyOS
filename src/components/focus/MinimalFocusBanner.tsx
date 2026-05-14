/**
 * MinimalFocusBanner
 * ──────────────────
 * A minimal, glass-morphic floating bar shown at the top when in
 * Minimal Focus mode. It shows the timer, active task, and quick
 * controls without consuming screen real estate.
 */

import { motion } from 'framer-motion'
import { Play, Pause, X, Layers } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useLayoutStore } from '../../store/useLayoutStore'

interface MinimalFocusBannerProps {
  pomodoroTime: number
  pomodoroPhase: 'focus' | 'break'
  isPomodoroRunning: boolean
  activeTaskTitle?: string | null
  onToggle: () => void
  onOpenPicker: () => void
}

export function MinimalFocusBanner({
  pomodoroTime,
  pomodoroPhase,
  isPomodoroRunning,
  activeTaskTitle,
  onToggle,
  onOpenPicker,
}: MinimalFocusBannerProps) {
  const { isFocusMode, focusLevel, setFocusMode } = useLayoutStore()
  const isMinimal = isFocusMode && focusLevel === 'minimal'

  const mm = Math.floor(pomodoroTime / 60).toString().padStart(2, '0')
  const ss = (pomodoroTime % 60).toString().padStart(2, '0')
  const isFocus = pomodoroPhase === 'focus'

  if (typeof document === 'undefined') return null

  return createPortal(
    <motion.div
      initial={false}
      animate={{
        y: isMinimal ? 0 : -64,
        opacity: isMinimal ? 1 : 0,
        pointerEvents: isMinimal ? 'auto' : 'none',
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/10 bg-[#0e0e12]/90 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)_inset]"
      role="status"
      aria-label="Focus mode timer bar"
    >
      {/* Phase dot */}
      <motion.div
        animate={{ opacity: isPomodoroRunning ? [1, 0.3, 1] : 0.7 }}
        transition={{ duration: 1.4, repeat: isPomodoroRunning ? Infinity : 0, ease: 'easeInOut' }}
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${isFocus ? 'bg-violet-400' : 'bg-sky-400'}`}
      />

      {/* Timer */}
      <span className={`font-mono text-base font-black tabular-nums tracking-tight ${
        isFocus ? 'text-violet-300' : 'text-sky-300'
      }`}>
        {mm}:{ss}
      </span>

      {/* Separator */}
      <span className="text-white/10 text-sm">·</span>

      {/* Task name */}
      <span className="text-sm font-medium text-neutral-300 max-w-[200px] truncate">
        {activeTaskTitle ?? (isFocus ? 'Focus session' : 'Break')}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={onToggle}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            isFocus
              ? 'text-violet-300 hover:bg-violet-500/15'
              : 'text-sky-300 hover:bg-sky-500/15'
          }`}
          title={isPomodoroRunning ? 'Pause' : 'Resume'}
        >
          {isPomodoroRunning
            ? <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
            : <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
          }
        </button>

        <button
          onClick={onOpenPicker}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
          title="Switch focus mode"
        >
          <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => setFocusMode(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-300 hover:bg-white/5 transition-colors"
          title="Exit focus mode"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>,
    document.body
  )
}
