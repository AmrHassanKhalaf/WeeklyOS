import { useEffect, useRef } from 'react'
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
  color: string
  glowColor: string
  shortcut: string
  features: string[]
}

const MODES: ModeOption[] = [
  {
    level: 'minimal',
    icon: Eye,
    label: 'Minimal Focus',
    sublabel: 'Clean workspace, less noise',
    color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-300',
    glowColor: 'rgba(20,184,166,0.25)',
    shortcut: '1',
    features: ['Timer stays visible', 'Sidebar hidden', 'Analytics removed'],
  },
  {
    level: 'deep',
    icon: BrainCircuit,
    label: 'Deep Focus',
    sublabel: 'Immersive deep work ritual',
    color: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-300',
    glowColor: 'rgba(139,92,246,0.3)',
    shortcut: '2',
    features: ['Full immersion', 'Cinematic UI', 'Auto-hide controls'],
  },
]

export function FocusModeMenu({ isOpen, onClose }: FocusModeMenuProps) {
  const { isFocusMode, focusLevel, setFocusMode, autoEnterFocusOnStart, setAutoEnterFocus } = useLayoutStore()
  const menuRef = useRef<HTMLDivElement>(null)

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

  const handleSelect = (level: FocusModeLevel) => {
    if (isFocusMode && focusLevel === level) {
      // Toggle off if already in this mode
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
          {/* Backdrop blur overlay (subtle) */}
          <motion.div
            key="focus-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Menu panel container for scrolling and centering */}
          <div className="fixed inset-0 z-[201] overflow-y-auto overflow-x-hidden pointer-events-none">
            <div className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-6">
              <motion.div
                ref={menuRef}
                key="focus-menu-panel"
                initial={{ opacity: 0, scale: 0.92, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, y: 8, filter: 'blur(6px)' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm mx-auto pointer-events-auto"
                role="dialog"
                aria-modal="true"
                aria-label="Focus mode selector"
              >
            <div className="rounded-3xl border border-white/10 bg-[#0e0e12]/95 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)_inset] overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-neutral-100 tracking-tight">Enter Focus Mode</p>
                    <p className="text-[10px] text-neutral-500 tracking-wider uppercase">Choose your environment</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Mode options */}
              <div className="p-3 space-y-2">
                {MODES.map((mode) => {
                  const Icon = mode.icon
                  const isActive = isFocusMode && focusLevel === mode.level

                  return (
                    <motion.button
                      key={mode.level}
                      onClick={() => handleSelect(mode.level)}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      className={`w-full text-left rounded-2xl border bg-gradient-to-br p-4 transition-all duration-200 group relative overflow-hidden ${mode.color} ${
                        isActive
                          ? 'ring-1 ring-white/20 shadow-lg'
                          : 'hover:border-opacity-60 hover:bg-opacity-80'
                      }`}
                      style={isActive ? { boxShadow: `0 0 30px ${mode.glowColor}` } : undefined}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="focus-mode-active"
                          className="absolute inset-0 rounded-2xl"
                          style={{ background: `radial-gradient(ellipse at 20% 50%, ${mode.glowColor}, transparent 70%)` }}
                        />
                      )}

                      <div className="relative flex items-start gap-3.5">
                        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                          mode.level === 'deep' ? 'from-violet-500/30 to-violet-600/20' : 'from-teal-500/30 to-teal-600/20'
                        } border border-white/10`}>
                          <Icon className="w-4.5 h-4.5" strokeWidth={1.5} style={{ width: 18, height: 18 }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-bold text-white tracking-tight">{mode.label}</span>
                            {isActive && (
                              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-snug mb-2.5">{mode.sublabel}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {mode.features.map(f => (
                              <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-neutral-400 font-medium">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Shortcut key */}
                        <kbd className="shrink-0 text-[10px] font-bold text-neutral-500 border border-white/10 rounded-md px-1.5 py-0.5 bg-white/3 font-mono">
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
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => { setFocusMode(false); onClose() }}
                    className="w-full text-left rounded-xl border border-white/[0.06] p-3 flex items-center gap-3 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03] transition-colors"
                  >
                    <Zap className="w-4 h-4 text-neutral-500" strokeWidth={1.5} />
                    <span className="text-[12px] font-medium">Exit Focus Mode</span>
                    <kbd className="ml-auto text-[10px] font-bold text-neutral-600 border border-white/8 rounded-md px-1.5 py-0.5 bg-white/3 font-mono">F</kbd>
                  </motion.button>
                )}
              </div>

              {/* Auto-enter setting */}
              <div className="px-5 py-4 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-neutral-300">Auto-enter on session start</p>
                  <p className="text-[10px] text-neutral-600 mt-0.5">Activate when Pomodoro starts</p>
                </div>
                <button
                  role="switch"
                  aria-checked={autoEnterFocusOnStart}
                  onClick={() => setAutoEnterFocus(!autoEnterFocusOnStart)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-primary ${
                    autoEnterFocusOnStart ? 'bg-primary' : 'bg-white/10'
                  }`}
                >
                  <motion.span
                    animate={{ x: autoEnterFocusOnStart ? 16 : 2 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              {/* Keyboard hint footer */}
              <div className="px-5 pb-4 flex items-center gap-3 text-neutral-600">
                <p className="text-[10px] tracking-wider uppercase">Shortcuts:</p>
                <div className="flex items-center gap-2">
                  {[{ key: 'F', label: 'Toggle' }, { key: 'ESC', label: 'Exit deep' }, { key: '␣', label: 'Pause' }].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1">
                      <kbd className="text-[9px] font-mono border border-white/8 rounded px-1 py-0.5 bg-white/3 text-neutral-500">{key}</kbd>
                      <span className="text-[9px] text-neutral-700">{label}</span>
                    </div>
                  ))}
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
