import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, CalendarRange, Flame, BarChart3, Menu } from 'lucide-react'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useWeekStore } from '../../store/useWeekStore'
import { RippleContainer } from '../ui/Ripple'
import { useRipple } from '../ui/useRipple'
import { cn } from '../../lib/cn'

/**
 * Five primary tabs for the mobile viewport. The "Menu" tab opens the drawer
 * containing the full sidebar nav for secondary destinations.
 */
const TABS = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Home'    },
  { to: '/weekly-distribution', icon: CalendarRange,   label: 'Plan'    },
  { to: '/habit-tracker',       icon: Flame,           label: 'Habits'  },
  { to: '/weekly-evaluation',   icon: BarChart3,       label: 'Stats'   },
] as const

function Tab({
  to,
  icon: Icon,
  label,
  pendingBadge,
}: {
  to: string
  icon: React.ElementType
  label: string
  pendingBadge?: number
}) {
  const { ripples, onPointerDown } = useRipple()
  return (
    <NavLink
      to={to}
      onPointerDown={onPointerDown}
      className="ripple-surface relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 focus-ring"
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="bottom-nav-indicator"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full obsidian-gradient shadow-[0_0_12px_rgb(167_139_250_/_0.7)]"
              transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            />
          )}
          <span className="relative">
            <motion.div
              animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 340 }}
              className={cn(
                'flex items-center justify-center transition-colors',
                isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]' : 'text-neutral-400',
              )}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2 : 1.5} />
            </motion.div>
            {typeof pendingBadge === 'number' && pendingBadge > 0 && (
              <motion.span
                key={pendingBadge}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 320 }}
                className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 text-[10px] font-black rounded-full bg-error text-on-error flex items-center justify-center"
              >
                {pendingBadge > 9 ? '9+' : pendingBadge}
              </motion.span>
            )}
          </span>
          <span
            className={cn(
              'text-[10px] font-bold tracking-wide transition-colors',
              isActive ? 'text-primary' : 'text-neutral-400',
            )}
          >
            {label}
          </span>
          <RippleContainer ripples={ripples} />
        </>
      )}
    </NavLink>
  )
}

export function MobileBottomNav() {
  const { isMobile, isFocusMode, toggleLeftSidebar, isLeftSidebarOpen } = useLayoutStore()
  const currentWeek = useWeekStore((s) => s.currentWeek)
  const location = useLocation()
  const { ripples, onPointerDown } = useRipple()

  if (!isMobile || isFocusMode) return null

  // Badge: count of still-pending tasks for today (if any)
  const today = currentWeek?.days.find((d) => d.isToday)
  let pending = 0
  if (today) {
    if (today.highTask?.status === 'pending') pending += 1
    pending += today.mediumTasks.filter((t) => t.status === 'pending').length
    pending += today.smallTasks.filter((t) => t.status === 'pending').length
  }

  // If the user is on a page that isn't in TABS, don't highlight anything
  const activePath = TABS.find((t) => location.pathname.startsWith(t.to))?.to

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 240 }}
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden"
      aria-label="Primary"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="mx-3 mb-3 rounded-2xl border border-outline-variant/25 bg-surface-container/85 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_28px_60px_-18px_rgba(0,0,0,0.55),inset_0_1px_0_rgb(255_255_255_/_0.08)] relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-px h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgb(167 139 250 / 0.4), transparent)' }}
        />
        <div className="flex items-center relative">
          {TABS.map((t) => (
            <Tab
              key={t.to}
              to={t.to}
              icon={t.icon}
              label={t.label}
              pendingBadge={t.to === '/dashboard' ? pending : undefined}
            />
          ))}
          <button
            type="button"
            onPointerDown={onPointerDown}
            onClick={toggleLeftSidebar}
            className="ripple-surface relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 focus-ring"
            aria-expanded={isLeftSidebarOpen}
            aria-label="Open menu"
          >
            <motion.div
              animate={{ rotate: isLeftSidebarOpen ? 90 : 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 280 }}
              className={cn(
                'flex items-center justify-center transition-colors',
                !activePath ? 'text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]' : 'text-neutral-400',
              )}
            >
              <Menu className="w-[22px] h-[22px]" strokeWidth={!activePath ? 2 : 1.5} />
            </motion.div>
            <span className="text-[10px] font-bold tracking-wide text-neutral-400">
              More
            </span>
            <RippleContainer ripples={ripples} />
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
