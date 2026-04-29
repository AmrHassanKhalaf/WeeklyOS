import { type ReactNode, lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { useLayoutStore } from '../../store/useLayoutStore'

const loadAIAssistant = () => import('./AIAssistant').then(m => ({ default: m.AIAssistant }))
const AIAssistant = lazy(loadAIAssistant)

// ── Layout ────────────────────────────────────────────────────────────────────
interface AppLayoutProps {
  children: ReactNode
  aiVariant?: 'default' | 'evaluation'
}

export function AppLayout({ children, aiVariant = 'default' }: AppLayoutProps) {
  const { isLeftSidebarOpen, isRightSidebarOpen, isMobile, isFocusMode, setMobile, closeSidebarsOnMobile } = useLayoutStore()
  const assistantPrefetchedRef = useRef(false)

  const warmAIAssistant = useCallback(() => {
    if (assistantPrefetchedRef.current) return
    assistantPrefetchedRef.current = true
    void loadAIAssistant()
  }, [])

  const shouldShowAssistant = isRightSidebarOpen && !isFocusMode

  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [setMobile])

  useEffect(() => {
    if (assistantPrefetchedRef.current || isFocusMode) return
    let idleId: number | null = null
    if (window.requestIdleCallback) {
      idleId = window.requestIdleCallback(() => warmAIAssistant(), { timeout: 1500 }) as unknown as number
    } else {
      idleId = window.setTimeout(() => warmAIAssistant(), 1200)
    }
    return () => {
      if (idleId === null) return
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId)
      } else {
        window.clearTimeout(idleId)
      }
    }
  }, [warmAIAssistant, isFocusMode])

  useEffect(() => {
    if (shouldShowAssistant) {
      warmAIAssistant()
    }
  }, [shouldShowAssistant, warmAIAssistant])

  return (
    <div className="min-h-screen bg-[#131313] text-[#E5E2E1] font-['Inter'] relative overflow-hidden">
      {/* Mobile Overlays */}
      {isMobile && (isLeftSidebarOpen || isRightSidebarOpen) && !isFocusMode && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeSidebarsOnMobile}
        />
      )}

      <Sidebar />
      <TopNav />

      <main
        className={`h-screen overflow-y-auto custom-scrollbar transition-all duration-300 w-full ${
          isFocusMode 
            ? 'pl-0 pr-0 pt-0' 
            : `${!isMobile && isLeftSidebarOpen ? 'lg:pl-64' : 'pl-0'} ${!isMobile && isRightSidebarOpen ? 'lg:pr-80' : 'pr-0'} pt-14`
        }`}
        style={{ scrollbarGutter: 'stable' }}
      >
        {children}
      </main>

      {shouldShowAssistant && (
        <Suspense fallback={null}>
          <AIAssistant variant={aiVariant} />
        </Suspense>
      )}
    </div>
  )
}
