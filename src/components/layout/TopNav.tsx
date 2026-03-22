import { NavLink } from 'react-router-dom'
import { useLayoutStore } from '../../store/useLayoutStore'

export function TopNav() {
  const { isMobile, isLeftSidebarOpen, isFocusMode, toggleLeftSidebar, toggleRightSidebar } = useLayoutStore()

  if (isFocusMode) return null

  return (
    <header className={`fixed top-0 right-0 h-14 z-40 bg-[#131313]/80 backdrop-blur-xl flex items-center justify-between px-8 border-none transition-all duration-300 ${
      isLeftSidebarOpen && !isMobile ? 'w-[calc(100%-16rem)]' : 'w-full'
    }`}>
      {/* Left tabs */}
      <div className="flex items-center gap-6 h-full">
        <button onClick={toggleLeftSidebar} className="text-on-surface-variant hover:text-white transition-colors mr-2">
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `font-['Inter'] text-xs uppercase tracking-widest pb-1 cursor-pointer transition-opacity h-full flex items-center ${
              isActive
                ? 'text-[#B8C3FF] border-b-2 border-[#2F5CFF]'
                : 'text-[#E5E2E1]/60 hover:text-white'
            }`
          }
        >
          Current Week
        </NavLink>
      </div>

      {/* Right: Search + Icons */}
      <div className="flex items-center gap-6">
        <div className="relative w-56">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input
            type="text"
            placeholder="Quick find..."
            className="bg-surface-container-low border-none rounded-lg py-1.5 pl-9 pr-4 text-xs w-full focus:ring-1 focus:ring-primary/40 text-on-surface placeholder:text-neutral-600 outline-none"
          />
        </div>
        <div className="flex items-center gap-4 text-[#B8C3FF]">
          <button className="hover:text-white transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button onClick={toggleRightSidebar} className="hover:text-white transition-colors">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </button>
          <button className="hover:text-white transition-colors">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  )
}
