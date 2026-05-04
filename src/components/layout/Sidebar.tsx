import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useWeekStore } from '../../store/useWeekStore'
import { FeedbackModal } from '../FeedbackModal'
import { Button } from '../ui/Button'
import { RippleContainer, useRipple } from '../ui/Ripple'
import { StatusDot } from '../ui/StatusDot'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../../lib/cn'

/** Nav items — share structure with mobile bottom nav (primary first). */
export const NAV_ITEMS = [
  { to: '/dashboard',           icon: 'dashboard',             label: 'Dashboard',    short: 'Home' },
  { to: '/weekly-distribution', icon: 'calendar_view_week',    label: 'Plan Week',    short: 'Plan' },
  { to: '/focused-day',         icon: 'target',                label: 'Focused Day',  short: 'Focus' },
  { to: '/brain-dump',          icon: 'psychology',            label: 'Brain Dump',   short: 'Dump' },
  { to: '/weekly-evaluation',   icon: 'assessment',            label: 'Evaluation',   short: 'Stats' },
  { to: '/habit-tracker',       icon: 'local_fire_department', label: 'Habits',       short: 'Habits' },
  { to: '/settings',            icon: 'settings',              label: 'Settings',     short: 'Settings' },
] as const

function NavItem({
  to,
  icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string
  icon: string
  label: string
  collapsed: boolean
  onNavigate: () => void
}) {
  const { ripples, onPointerDown } = useRipple()

  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      onPointerDown={onPointerDown}
      className={({ isActive }) =>
        cn(
          'ripple-surface group relative flex items-center rounded-xl transition-all duration-200 focus-ring',
          collapsed ? 'justify-center px-0 py-3 mx-auto w-12 h-12' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'text-on-surface bg-primary/12 shadow-[inset_0_0_0_1px_rgb(var(--color-primary)/0.18)]'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/70',
        )
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-pill"
              className={cn(
                'absolute bg-primary/10 rounded-xl',
                collapsed ? 'inset-0' : 'inset-0',
              )}
              transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            />
          )}
          {isActive && !collapsed && (
            <motion.span
              layoutId="sidebar-active-bar"
              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary"
              transition={{ type: 'spring', damping: 30, stiffness: 380 }}
            />
          )}
          <span
            className={cn(
              'material-symbols-outlined text-[20px] relative z-10 transition-transform duration-200',
              isActive && 'text-primary',
              'group-hover:scale-110',
            )}
            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {icon}
          </span>
          {!collapsed && (
            <motion.span
              initial={false}
              animate={{ opacity: 1 }}
              className="relative z-10 text-sm font-semibold truncate"
            >
              {label}
            </motion.span>
          )}
          <RippleContainer ripples={ripples} />
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { sidebarMode, isMobile, isFocusMode, cycleSidebarMode, toggleLeftSidebar, closeSidebarsOnMobile } =
    useLayoutStore()
  const currentWeek = useWeekStore((s) => s.currentWeek)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  const isHidden = sidebarMode === 'hidden' || isFocusMode
  const isRail = sidebarMode === 'rail' && !isMobile
  const width = isRail ? 'w-20' : 'w-64'

  // Derived user display fields (safe on null)
  const name =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'My Account'
  const initial = name.charAt(0).toUpperCase()

  // Stats snapshot for the footer chip
  const completed = currentWeek?.totalCompleted ?? 0
  const planned = currentWeek?.totalPlanned ?? 0
  const score = currentWeek?.score ?? 0

  return (
    <>
      <motion.aside
        initial={false}
        animate={{
          width: isRail ? 80 : 256,
          x: isHidden ? (isMobile ? -288 : -256) : 0,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className={cn(
          'fixed left-0 top-0 h-screen z-50 flex flex-col border-r border-outline-variant/20',
          'bg-surface-container-lowest/95 backdrop-blur-xl shadow-xl shadow-black/30',
          width,
        )}
        aria-hidden={isHidden}
      >
        <div className="flex flex-col h-full p-3">
          {/* Brand */}
          <div
            className={cn(
              'flex items-center mb-6 transition-all',
              isRail ? 'justify-center' : 'gap-3 px-2',
            )}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center obsidian-gradient shrink-0 glow-primary animate-float-soft">
              <span className="material-symbols-outlined text-white text-lg">
                auto_awesome
              </span>
            </div>
            <AnimatePresence>
              {!isRail && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0"
                >
                  <h1 className="text-lg font-extrabold tracking-tight text-on-surface leading-none">
                    WeeklyOS
                  </h1>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-[0.22em] mt-0.5">
                    Productivity Engine
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                collapsed={isRail}
                onNavigate={closeSidebarsOnMobile}
              />
            ))}
          </nav>

          {/* Stats strip (expanded only) */}
          <AnimatePresence>
            {!isRail && currentWeek && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="mt-4 mb-2 rounded-xl border border-outline-variant/30 bg-surface-container-low/70 px-3 py-3"
              >
                <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant mb-2 font-bold">
                  This Week
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-on-surface-variant">Score</p>
                    <p className="font-mono font-bold text-tertiary text-base">{score}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant">Tasks</p>
                    <p className="font-mono font-bold text-primary text-base">
                      {completed}
                      <span className="text-on-surface-variant">/{planned}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-surface-container-high overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, score)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom actions */}
          <div className="mt-auto pt-4 space-y-2">
            {!isRail ? (
              <Button
                type="button"
                onClick={() => {
                  navigate('/brain-dump')
                  closeSidebarsOnMobile()
                }}
                size="sm"
                className="w-full font-bold"
                leftIcon={<span className="material-symbols-outlined text-sm">add</span>}
              >
                New Plan
              </Button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  navigate('/brain-dump')
                  closeSidebarsOnMobile()
                }}
                title="New Plan"
                className="ripple-surface w-12 h-12 mx-auto rounded-xl flex items-center justify-center obsidian-gradient text-white shadow-md focus-ring"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            )}

            {/* Theme toggle + feedback */}
            <div className={cn('flex gap-2', isRail ? 'flex-col items-center' : 'items-center')}>
              <ThemeToggle compact={isRail} className={isRail ? '' : 'flex-1'} />
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                title="Feedback & Support"
                className={cn(
                  'ripple-surface rounded-xl border border-outline-variant/30 bg-surface-container-low/60',
                  'text-amber-400 hover:bg-surface-container-low transition-colors focus-ring',
                  isRail ? 'w-10 h-10 flex items-center justify-center' : 'px-3 py-2 flex items-center gap-2',
                )}
              >
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                {!isRail && <span className="text-xs font-semibold">Feedback</span>}
              </button>
            </div>

            {/* User card */}
            <div
              className={cn(
                'rounded-xl bg-surface-container-low/70 border border-outline-variant/30 transition-all',
                isRail ? 'p-1 flex flex-col items-center gap-2' : 'p-2.5 flex items-center gap-3',
              )}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full obsidian-gradient flex items-center justify-center text-white text-xs font-extrabold">
                  {initial}
                </div>
                <StatusDot className="absolute -bottom-0.5 -right-0.5" size={10} />
              </div>
              {!isRail && (
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-on-surface text-sm">{name}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">
                    {user?.email ?? 'Signed in'}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  void signOut()
                }}
                title="Sign out"
                className={cn(
                  'text-on-surface-variant hover:text-error transition-colors shrink-0 rounded-lg',
                  isRail ? 'w-8 h-8 flex items-center justify-center' : 'p-1',
                )}
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mode cycle button on the edge (desktop only) */}
        {!isMobile && (
          <button
            onClick={cycleSidebarMode}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -right-3 z-50 w-6 h-6 rounded-full',
              'bg-surface-container border border-outline-variant/40 text-on-surface-variant',
              'hover:text-on-surface hover:border-outline-variant transition-all flex items-center justify-center',
              'shadow-md',
            )}
            title={
              sidebarMode === 'expanded'
                ? 'Collapse to rail'
                : sidebarMode === 'rail'
                  ? 'Hide sidebar'
                  : 'Show sidebar'
            }
          >
            <motion.span
              animate={{ rotate: sidebarMode === 'hidden' ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="material-symbols-outlined text-[14px]"
            >
              chevron_left
            </motion.span>
          </button>
        )}
      </motion.aside>

      {/* Hidden-mode edge toggle (desktop only, when fully hidden) */}
      {!isMobile && !isFocusMode && sidebarMode === 'hidden' && (
        <button
          onClick={toggleLeftSidebar}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 w-6 h-8 rounded-r-xl border border-l-0 border-outline-variant/40 bg-surface-container/90 text-on-surface-variant hover:text-on-surface hover:bg-surface-container shadow-md transition-all flex items-center justify-center"
          title="Show sidebar"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  )
}
