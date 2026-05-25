import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarRange,
  Focus,
  Brain,
  BarChart3,
  Flame,
  Settings,
  Sparkles,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lightbulb
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useWeekStore } from '../../store/useWeekStore'
import { FeedbackModal } from '../FeedbackModal'
import { Button } from '../ui/Button'
import { RippleContainer } from '../ui/Ripple'
import { useRipple } from '../ui/useRipple'
import { StatusDot } from '../ui/StatusDot'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '../../lib/cn'

/** Nav items — share structure with mobile bottom nav (primary first). */
export const NAV_ITEMS = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',    short: 'Home' },
  { to: '/weekly-distribution', icon: CalendarRange,   label: 'Plan Week',    short: 'Plan' },
  { to: '/focused-day',         icon: Focus,           label: 'Focused Day',  short: 'Focus' },
  { to: '/brain-dump',          icon: Brain,           label: 'Brain Dump',   short: 'Dump' },
  { to: '/weekly-evaluation',   icon: BarChart3,       label: 'Evaluation',   short: 'Stats' },
  { to: '/habit-tracker',       icon: Flame,           label: 'Habits',       short: 'Habits' },
  { to: '/settings',            icon: Settings,        label: 'Settings',     short: 'Settings' },
] as const

function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string
  icon: React.ElementType
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
          'ripple-surface group relative flex items-center rounded-xl transition-all duration-300 focus-ring',
          collapsed ? 'justify-center px-0 py-2.5 mx-auto w-11 h-11' : 'gap-3 px-3 py-2',
          isActive
            ? 'text-on-surface bg-surface-container-high/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_4px_12px_-4px_rgba(0,0,0,0.2)]'
            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/40',
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
                'absolute bg-primary/10 rounded-xl border border-primary/20',
                collapsed ? 'inset-0' : 'inset-0',
              )}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          )}
          {isActive && !collapsed && (
            <motion.span
              layoutId="sidebar-active-bar"
              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary/80 shadow-[0_0_10px_rgba(124,58,237,0.5)]"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          )}
          <Icon 
            className={cn(
              'w-[18px] h-[18px] relative z-10 transition-transform duration-300',
              isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]' : 'text-neutral-500 group-hover:text-neutral-300',
              'group-hover:scale-105',
            )}
            strokeWidth={isActive ? 2 : 1.5}
          />
          {!collapsed && (
            <motion.span
              initial={false}
              animate={{ opacity: 1 }}
              className={cn(
                "relative z-10 text-[13px] tracking-wide truncate transition-colors duration-300",
                isActive ? "font-semibold text-neutral-100" : "font-medium text-neutral-400 group-hover:text-neutral-200"
              )}
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
  const { sidebarMode, isMobile, isFocusMode, focusLevel, cycleSidebarMode, toggleLeftSidebar, closeSidebarsOnMobile } =
    useLayoutStore()
  const currentWeek = useWeekStore((s) => s.currentWeek)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  const isHidden = sidebarMode === 'hidden' || (isFocusMode && focusLevel === 'deep')
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
          'fixed left-0 top-0 h-screen z-50 flex flex-col border-r border-outline-variant/15',
          'bg-surface-container-lowest/85 backdrop-blur-2xl backdrop-saturate-150',
          'shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5),inset_-1px_0_0_rgb(255_255_255_/_0.04)]',
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center obsidian-gradient shrink-0 shadow-[0_8px_24px_-6px_rgb(124_58_237_/_0.4)] animate-float-soft">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={1.5} />
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
                  <h1 className="text-lg font-extrabold tracking-tight gradient-text leading-none">
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
                className="mt-4 mb-2 rounded-2xl border border-outline-variant/25 bg-surface-container-low/60 backdrop-blur-md px-3.5 py-3 relative overflow-hidden"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-50"
                  style={{ background: 'radial-gradient(circle, rgb(167 139 250 / 0.18), transparent 70%)' }}
                />
                <p className="text-[9px] uppercase tracking-[0.22em] text-on-surface-variant mb-2 font-bold relative">
                  This Week
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs relative">
                  <div>
                    <p className="text-on-surface-variant text-[10px]">Score</p>
                    <p className="font-mono font-extrabold text-tertiary text-base">{score}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-[10px]">Tasks</p>
                    <p className="font-mono font-extrabold text-primary text-base">
                      {completed}
                      <span className="text-on-surface-variant">/{planned}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 h-1 w-full rounded-full bg-surface-container-high overflow-hidden relative">
                  <motion.div
                    className="h-full obsidian-gradient"
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
                className="w-full font-bold tracking-wide"
                leftIcon={<Plus className="w-4 h-4" strokeWidth={2} />}
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
                className="ripple-surface w-11 h-11 mx-auto rounded-xl flex items-center justify-center obsidian-gradient text-white shadow-[0_8px_20px_-6px_rgb(124_58_237_/_0.4)] focus-ring transition-transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" strokeWidth={2} />
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
                  'text-amber-500 hover:text-amber-400 hover:bg-surface-container-low transition-colors focus-ring',
                  isRail ? 'w-10 h-10 flex items-center justify-center' : 'px-3 py-2 flex items-center gap-2',
                )}
              >
                <Lightbulb className="w-[16px] h-[16px]" strokeWidth={1.5} />
                {!isRail && <span className="text-xs font-semibold">Feedback</span>}
              </button>
            </div>

            {/* User card */}
            <div
              className={cn(
                'rounded-2xl bg-surface-container-low/60 border border-outline-variant/25 backdrop-blur-md transition-all',
                isRail ? 'p-1 flex flex-col items-center gap-2' : 'p-2.5 flex items-center gap-3',
              )}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full obsidian-gradient flex items-center justify-center text-white text-xs font-extrabold shadow-[0_8px_20px_-6px_rgb(124_58_237_/_0.5)]">
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
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
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
            <motion.div
              animate={{ rotate: sidebarMode === 'hidden' ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            </motion.div>
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
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  )
}
