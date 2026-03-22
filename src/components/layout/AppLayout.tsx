import { createContext, useContext, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { AIAssistant } from './AIAssistant'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useEffect } from 'react'

// ── Focus mode context ────────────────────────────────────────────────────────
interface FocusModeContextType {
  focusMode: boolean
  setFocusMode: (v: boolean) => void
}

export const FocusModeContext = createContext<FocusModeContextType>({
  focusMode: false,
  setFocusMode: () => {},
})

export const useFocusMode = () => useContext(FocusModeContext)

// ── Layout ────────────────────────────────────────────────────────────────────
interface AppLayoutProps {
  children: ReactNode
  aiVariant?: 'default' | 'evaluation'
}

export function AppLayout({ children, aiVariant = 'default' }: AppLayoutProps) {
  const [focusMode, setFocusMode] = useState(false)
  const { isLeftSidebarOpen, isRightSidebarOpen, isMobile, setMobile, closeSidebarsOnMobile } = useLayoutStore()

  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [setMobile])

  return (
    <FocusModeContext.Provider value={{ focusMode, setFocusMode }}>
      <div className="min-h-screen bg-[#131313] text-[#E5E2E1] font-['Inter'] relative overflow-hidden">
        {/* Mobile Overlays */}
        {isMobile && (isLeftSidebarOpen || isRightSidebarOpen) && !focusMode && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={closeSidebarsOnMobile}
          />
        )}

        {!focusMode && <Sidebar />}
        {!focusMode && <TopNav />}

        <main
          className={`h-screen overflow-y-auto custom-scrollbar transition-all duration-300 w-full ${
            focusMode 
              ? 'ml-0 mr-0 pt-0' 
              : `${!isMobile && isLeftSidebarOpen ? 'lg:pl-64' : 'pl-0'} ${!isMobile && isRightSidebarOpen ? 'lg:pr-80' : 'pr-0'} pt-14`
          }`}
          style={{ scrollbarGutter: 'stable' }}
        >
          {children}
        </main>

        {!focusMode && <AIAssistant variant={aiVariant} />}
      </div>
    </FocusModeContext.Provider>
  )
}
