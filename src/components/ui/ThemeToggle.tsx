import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { cn } from '../../lib/cn'
import { RippleContainer } from './Ripple'
import { useRipple } from './useRipple'

interface ThemeToggleProps {
  /** Compact icon-only mode for collapsed sidebars / tight headers */
  compact?: boolean
  className?: string
}

/**
 * Theme toggle — cycles dark → light → system with a rotating icon and subtle glow.
 * Reads and writes to `useSettingsStore` so it stays in sync everywhere.
 */
export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const { ripples, onPointerDown } = useRipple()

  const next: Record<typeof theme, typeof theme> = {
    dark: 'light',
    light: 'system',
    system: 'dark',
  }
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'

  return (
    <button
      type="button"
      onClick={() => setTheme(next[theme])}
      onPointerDown={onPointerDown}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label} — click to change`}
      className={cn(
        'ripple-surface relative flex items-center gap-2 rounded-xl transition-all',
        'border border-outline-variant/30 bg-surface-container-low/60 hover:bg-surface-container-low',
        'text-on-surface-variant hover:text-on-surface focus-ring',
        compact ? 'w-10 h-10 justify-center' : 'px-3 py-2',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center justify-center"
        >
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </motion.div>
      </AnimatePresence>
      {!compact && <span className="text-xs font-semibold">{label}</span>}
      <RippleContainer ripples={ripples} />
    </button>
  )
}
