import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Zap, X, Eye, BrainCircuit } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useLayoutStore } from '../../store/useLayoutStore'
import type { FocusModeLevel } from '../../store/useLayoutStore'

interface FocusModeMenuProps {
  isOpen: boolean
  onClose: () => void
}

interface ModeOption {
  level: FocusModeLevel
  icon: React.ElementType
  label: string
  sublabel: string
  gradient: string
  borderColor: string
  textColor: string
  glowColor: string
  iconGradient: string
  shortcut: string
  features: string[]
}

const MODES: ModeOption[] = [
  {
    level: 'minimal',
    icon: Eye,
    label: 'Minimal Focus',
    sublabel: 'Clean workspace, less noise',
    gradient: 'from-teal-500/15 via-teal-900/10 to-black/80',
    borderColor: 'border-teal-500/25',
    textColor: 'text-teal-300',
    glowColor: 'rgba(20,184,166,0.3)',
    iconGradient: 'from-teal-500/30 to-teal-700/20',
    shortcut: '1',
    features: ['Timer stays visible', 'Sidebar hidden', 'Analytics removed'],
  },
  {
    level: 'deep',
    icon: BrainCircuit,
    label: 'Deep Focus',
    sublabel: 'Immersive deep work ritual',
    gradient: 'from-violet-500/15 via-violet-900/10 to-black/80',
    borderColor: 'border-violet-500/25',
    textColor: 'text-violet-300',
    glowColor: 'rgba(139,92,246,0.3)',
    iconGradient: 'from-violet-500/30 to-violet-700/20',
    shortcut: '2',
    features: ['Full immersion', 'Cinematic UI', 'Auto-hide controls'],
  },
]

export function FocusModeMenu({ isOpen, onClose }: FocusModeMenuProps) {
  const { isFocusMode, focusLevel, setFocusMode } = useLayoutStore()
  const menuRef = useRef<HTMLDivElement>(null)
  const [hoveredLevel, setHoveredLevel] = useState<FocusModeLevel | null>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  // Keyboard shortcuts within the menu
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === '1') { setFocusMode(true, 'minimal'); return }
      if (e.key === '2') { setFocusMode(true, 'deep'); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, setFocusMode])

  // Reset hover on close
  useEffect(() => {
    if (!isOpen) setHoveredLevel(null)
  }, [isOpen])

  const handleSelect = (level: FocusModeLevel) => {
    if (isFocusMode && focusLevel === level) {
      setFocusMode(false)
    } else {
      setFocusMode(true, level)
    }
    onClose()
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="focus-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-2xl"
            onClick={onClose}
          />

          {/* Menu panel */}
          <div className="fixed inset-0 z-[201] overflow-y-auto overflow-x-hidden pointer-events-none">
            <div className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
              <motion.div
                ref={menuRef}
                key="focus-menu-panel"
                initial={{ opacity: 0, scale: 0.92, y: 12, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(8px)' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto pointer-events-auto"
                role="dialog"
                aria-modal="true"
                aria-label="Focus mode selector"
              >
                {/* Glass panel with animated border */}
                <div className="relative rounded-3xl overflow-hidden">
                  {/* Conic gradient border */}
                  <div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                      background: 'conic-gradient(from 0deg, rgba(139,92,246,0.3), rgba(20,184,166,0.2), rgba(139,92,246,0.05), rgba(20,184,166,0.3), rgba(139,92,246,0.3))',
                    }}
                  />

                  {/* Glass panel — translucent with backdrop blur */}
                  <div className="relative m-px rounded-[23px] bg-black/[0.65] backdrop-blur-2xl shadow-[0_50px_120px_rgba(0,0,0,0.9),0_0_80px_rgba(139,92,246,0.06)] overflow-hidden border border-white/[0.06]">

                    {/* Floating ambient orbs */}
                    <motion.div
                      className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-violet-600/10 blur-[80px] pointer-events-none"
                      animate={{ x: [0, 15, 0], y: [0, 10, 0], opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-teal-500/8 blur-[70px] pointer-events-none"
                      animate={{ x: [0, -10, 0], y: [0, -8, 0], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    />

                    {/* Top edge light reflection */}
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between px-6 pt-6 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-violet-700/10 border border-violet-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]">
                          <Layers className="w-4 h-4 text-violet-400" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight">Focus Mode</p>
                          <p className="text-[10px] text-neutral-500 tracking-wider uppercase mt-0.5">Choose your environment</p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-600 hover:text-neutral-300 hover:bg-white/5 transition-all duration-200"
                        aria-label="Close"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Gradient divider */}
                    <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

                    {/* Mode options */}
                    <div className="relative p-4 space-y-3">
                      {MODES.map((mode) => {
                        const Icon = mode.icon
                        const isActive = isFocusMode && focusLevel === mode.level
                        const isBlurred = hoveredLevel !== null && hoveredLevel !== mode.level

                        return (
                          <motion.button
                            key={mode.level}
                            onClick={() => handleSelect(mode.level)}
                            onMouseEnter={() => setHoveredLevel(mode.level)}
                            onMouseLeave={() => setHoveredLevel(null)}
                            whileTap={{ scale: 0.98 }}
                            animate={{
                              opacity: isBlurred ? 0.45 : 1,
                              filter: isBlurred ? 'blur(1px)' : 'blur(0px)',
                            }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={`w-full text-left rounded-2xl border bg-gradient-to-br p-4 relative overflow-hidden group cursor-pointer
                              ${mode.gradient} ${mode.borderColor}
                              ${isActive
                                ? 'ring-1 ring-white/15'
                                : 'hover:border-white/20'
                              }`}
                            style={{
                              ...(isActive ? { boxShadow: `0 0 35px ${mode.glowColor}, 0 4px 20px rgba(0,0,0,0.4)` } : { boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }),
                              '--mode-glow': mode.glowColor
                            } as React.CSSProperties}
                          >
                            {/* Hover glow overlay */}
                            <div
                              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                              style={{ background: `radial-gradient(ellipse at 30% 50%, ${mode.glowColor}, transparent 70%)` }}
                            />

                            {/* Active shimmer */}
                            {isActive && (
                              <motion.div
                                className="absolute inset-0 rounded-2xl pointer-events-none"
                                style={{ background: `radial-gradient(ellipse at 20% 50%, ${mode.glowColor}, transparent 60%)` }}
                                animate={{ opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                              />
                            )}

                            {/* Inner top-edge highlight */}
                            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative flex items-start gap-4">
                              {/* Icon */}
                              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${mode.iconGradient} border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:border-white/20 group-hover:shadow-[0_0_16px_var(--mode-glow)] transition-all duration-300`}>
                                <Icon className="w-5 h-5" strokeWidth={1.5} style={{ width: 20, height: 20 }} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[13px] font-bold text-white tracking-tight">{mode.label}</span>
                                  {isActive && (
                                    <motion.span
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${mode.textColor} bg-white/[0.08] border border-white/10`}
                                    >
                                      Active
                                    </motion.span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-500 leading-snug mb-3">{mode.sublabel}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {mode.features.map(f => (
                                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-500 font-medium group-hover:text-neutral-400 group-hover:border-white/10 transition-colors duration-300">
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Shortcut key */}
                              <kbd className="shrink-0 text-[10px] font-bold text-neutral-600 border border-white/[0.08] rounded-md px-1.5 py-0.5 bg-white/[0.03] font-mono group-hover:text-neutral-400 group-hover:border-white/15 transition-colors duration-300">
                                {mode.shortcut}
                              </kbd>
                            </div>
                          </motion.button>
                        )
                      })}

                      {/* Exit button if in focus mode */}
                      {isFocusMode && (
                        <motion.button
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: hoveredLevel !== null ? 0.45 : 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => { setFocusMode(false); onClose() }}
                          className="w-full text-left rounded-xl border border-white/[0.06] p-3 flex items-center gap-3 text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                        >
                          <Zap className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                          <span className="text-[12px] font-medium">Exit Focus Mode</span>
                          <kbd className="ml-auto text-[10px] font-bold text-neutral-700 border border-white/[0.06] rounded-md px-1.5 py-0.5 bg-white/[0.02] font-mono">F</kbd>
                        </motion.button>
                      )}
                    </div>

                    {/* Gradient divider */}
                    <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                    {/* Keyboard hint footer */}
                    <div className="relative px-6 py-4 flex items-center gap-3">
                      <p className="text-[10px] tracking-wider uppercase text-neutral-700">Shortcuts:</p>
                      <div className="flex items-center gap-2.5">
                        {[{ key: 'F', label: 'Toggle' }, { key: 'ESC', label: 'Exit deep' }, { key: '␣', label: 'Pause' }].map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-1">
                            <kbd className="text-[9px] font-mono border border-white/[0.07] rounded px-1 py-0.5 bg-white/[0.03] text-neutral-600">{key}</kbd>
                            <span className="text-[9px] text-neutral-700">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
