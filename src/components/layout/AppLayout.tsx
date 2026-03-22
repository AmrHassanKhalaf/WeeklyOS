import { createContext, useContext, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { AIAssistant } from './AIAssistant'

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

  return (
    <FocusModeContext.Provider value={{ focusMode, setFocusMode }}>
      <div className="min-h-screen bg-[#131313] text-[#E5E2E1] font-['Inter']">
        {!focusMode && <Sidebar />}
        {!focusMode && <TopNav />}

        <main
          className={`h-screen overflow-y-auto custom-scrollbar transition-all duration-300 ${
            focusMode ? 'ml-0 mr-0 pt-0' : 'ml-64 mr-80 pt-14'
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
