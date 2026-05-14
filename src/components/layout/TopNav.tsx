import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Bell, Sparkles } from 'lucide-react'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useWeekStore } from '../../store/useWeekStore'
import { RippleContainer } from '../ui/Ripple'
import { useRipple } from '../ui/useRipple'
import { cn } from '../../lib/cn'
import { NAV_ITEMS } from './Sidebar'

/**
 * Animated hamburger (3 bars ↔ X) — purely CSS/transform, no extra deps.
 */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="relative w-5 h-5 flex flex-col items-center justify-center">
      <motion.span
        animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -5 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className="absolute block w-5 h-[2px] rounded-full bg-current"
      />
      <motion.span
        animate={open ? { opacity: 0, scale: 0.6 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="absolute block w-5 h-[2px] rounded-full bg-current"
      />
      <motion.span
        animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 5 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className="absolute block w-5 h-[2px] rounded-full bg-current"
      />
    </div>
  )
}

export function TopNav() {
  const {
    isMobile,
    sidebarMode,
    isLeftSidebarOpen,
    isFocusMode,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useLayoutStore()
  const {
    currentWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    canGoPreviousWeek,
    canGoNextWeek,
  } = useWeekStore()
  const location = useLocation()
  const { ripples: menuRipples, onPointerDown: onMenuDown } = useRipple()
  const { ripples: aiRipples, onPointerDown: onAiDown } = useRipple()

  if (isFocusMode) return null

  const offsetLeft = isMobile ? 0 : sidebarMode === 'rail' ? 80 : sidebarMode === 'hidden' ? 0 : 256

  // Try to read current page label from NAV_ITEMS
  const activeItem = NAV_ITEMS.find((i) => location.pathname.startsWith(i.to))
  const pageTitle = activeItem?.label ?? 'WeeklyOS'

  return (
    <motion.header
      initial={false}
      animate={{ left: offsetLeft }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="fixed top-0 right-0 h-14 z-40 bg-background/60 backdrop-blur-2xl backdrop-saturate-150 flex items-center justify-between px-4 sm:px-6 border-b border-outline-variant/12 shadow-[0_1px_0_0_rgb(255_255_255_/_0.04)_inset]"
    >
      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onPointerDown={onMenuDown}
          onClick={toggleLeftSidebar}
          className="ripple-surface w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors focus-ring"
          aria-label="Toggle menu"
          aria-expanded={isLeftSidebarOpen}
        >
          <HamburgerIcon open={isMobile ? isLeftSidebarOpen : sidebarMode !== 'hidden'} />
          <RippleContainer ripples={menuRipples} />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <motion.h1
            key={pageTitle}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-base font-semibold text-neutral-100 truncate tracking-tight"
          >
            {pageTitle}
          </motion.h1>
          {currentWeek && (
            <span className="hidden sm:inline text-[11px] font-medium text-neutral-500">
              / Week {currentWeek.weekNumber}
            </span>
          )}
        </div>

        {/* Week navigator — condensed on mobile */}
        <div className="hidden sm:flex items-center gap-1.5 ml-4">
          <button
            onClick={() => void goToPreviousWeek()}
            disabled={!canGoPreviousWeek}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed focus-ring transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => void goToCurrentWeek()}
            className="text-[11px] font-medium px-3 h-7 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-white/10 focus-ring transition-colors"
            title="Go to Current Week"
          >
            Today
          </button>
          <button
            onClick={() => void goToNextWeek()}
            disabled={!canGoNextWeek}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed focus-ring transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
          {currentWeek && (
            <span className="hidden lg:inline text-[11px] font-medium text-neutral-500 ml-3">
              {currentWeek.dateRange}
            </span>
          )}
        </div>
      </div>

      {/* Right: quick actions */}
      <div className="flex items-center gap-2">
        <button
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-white/5 focus-ring transition-colors',
          )}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <button
          onPointerDown={onAiDown}
          onClick={toggleRightSidebar}
          className="ripple-surface relative w-9 h-9 rounded-xl flex items-center justify-center text-primary hover:bg-primary/10 hover:shadow-[0_0_18px_-2px_rgb(167_139_250_/_0.3)] focus-ring transition-all"
          title="AI Assistant"
          aria-label="Toggle AI Assistant"
        >
          <Sparkles className="w-[18px] h-[18px]" strokeWidth={1.5} />
          <span className="absolute inset-0 rounded-xl animate-pulse-glow pointer-events-none opacity-40" />
          <RippleContainer ripples={aiRipples} />
        </button>
      </div>
    </motion.header>
  )
}
