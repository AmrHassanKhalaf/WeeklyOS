import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/supabase'

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
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-[#1C1B1B] z-50 font-['Inter'] antialiased text-sm font-medium">
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

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'text-[#E5E2E1] bg-[#2A2A2A]'
                    : 'text-[#A1A1A1] hover:bg-[#2A2A2A]'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom CTA + User */}
        <div className="mt-auto pt-6 space-y-4">
          <button
            onClick={() => navigate('/brain-dump')}
            className="w-full obsidian-gradient text-on-primary-container py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Plan
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
  )
}
