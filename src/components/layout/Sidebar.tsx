import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/supabase'
import { useLayoutStore } from '../../store/useLayoutStore'
import { Button } from '../ui/Button'
import { FeedbackModal } from '../FeedbackModal'

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/weekly-distribution', icon: 'calendar_view_week', label: 'Weekly Distribution' },
  { to: '/focused-day', icon: 'target', label: 'Focused Day' },
  { to: '/brain-dump', icon: 'psychology', label: 'Prep & Brain Dump' },
  { to: '/weekly-evaluation', icon: 'assessment', label: 'Weekly Evaluation' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { isLeftSidebarOpen, isFocusMode, toggleLeftSidebar, closeSidebarsOnMobile } = useLayoutStore()
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  const isActuallyOpen = isLeftSidebarOpen && !isFocusMode

  return (
    <>
      <aside className={`h-screen w-64 fixed left-0 top-0 flex flex-col bg-[#1C1B1B] z-50 antialiased text-sm font-medium transition-transform duration-300 shadow-xl border-r border-white/5 ${
        isActuallyOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      <div className="flex flex-col h-full p-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center obsidian-gradient shrink-0">
            <span className="material-symbols-outlined text-on-primary-container text-lg">dashboard</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#E5E2E1]">WeeklyOS</h1>
            <p className="text-[10px] text-[#A1A1A1] uppercase tracking-[0.2em]">Productivity Engine</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebarsOnMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'text-[#E5E2E1] bg-[#2A2A2A]'
                    : 'text-[#A1A1A1] hover:bg-[#2A2A2A]'
                }`
              }
            >
              <span className={`material-symbols-outlined text-[20px]`}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom CTA + User */}
        <div className="mt-auto pt-6 space-y-3">
          <Button
            type="button"
            onClick={() => { navigate('/brain-dump'); closeSidebarsOnMobile(); }}
            size="sm"
            className="w-full text-on-primary-container font-bold"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Plan
          </Button>

          {/* Feedback button */}
          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[#A1A1A1] hover:bg-[#2A2A2A] hover:text-[#E5E2E1] transition-colors duration-200 text-sm"
          >
            <span className="material-symbols-outlined text-[20px] text-amber-400">lightbulb</span>
            Feedback & Support
          </button>
          <div className="flex items-center gap-3 p-2 bg-surface-container-lowest rounded-lg">
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">account_circle</span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="truncate font-semibold text-[#E5E2E1] text-sm">My Account</p>
              <p className="text-[10px] text-[#A1A1A1] truncate">Pro Subscriber</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="text-neutral-600 hover:text-error transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>

      {/* Edge Toggle Button */}
      <button
        onClick={toggleLeftSidebar}
        className={`fixed top-1/2 -translate-y-1/2 z-50 w-6 h-6 bg-[#1C1B1B] border border-white/10 rounded-full flex items-center justify-center text-[#A1A1A1] hover:text-white hover:border-white/30 transition-all duration-300 hidden lg:flex shadow-md ${
          isActuallyOpen ? 'left-[calc(16rem-12px)]' : 'left-0 rounded-l-none border-l-0'
        } ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <span className="material-symbols-outlined text-[14px]">
          {isLeftSidebarOpen ? 'chevron_left' : 'chevron_right'}
        </span>
      </button>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  )
}
