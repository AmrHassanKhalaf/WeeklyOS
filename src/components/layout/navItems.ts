import {
  LayoutDashboard,
  CalendarRange,
  Focus,
  Brain,
  BarChart3,
  Flame,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  icon: LucideIcon
  label: string
  short: string
}

/**
 * Primary navigation items. Kept in a separate module so both the desktop
 * Sidebar and the mobile bottom nav can import it without breaking React Fast
 * Refresh (a file may only export React components OR non-component values,
 * not both, to keep HMR boundaries clean).
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',    short: 'Home' },
  { to: '/weekly-distribution', icon: CalendarRange,   label: 'Plan Week',    short: 'Plan' },
  { to: '/focused-day',         icon: Focus,           label: 'Focused Day',  short: 'Focus' },
  { to: '/brain-dump',          icon: Brain,           label: 'Brain Dump',   short: 'Dump' },
  { to: '/weekly-evaluation',   icon: BarChart3,       label: 'Evaluation',   short: 'Stats' },
  { to: '/habit-tracker',       icon: Flame,           label: 'Habits',       short: 'Habits' },
  { to: '/settings',            icon: Settings,        label: 'Settings',     short: 'Settings' },
]
