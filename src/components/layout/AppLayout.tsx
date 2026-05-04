import { type ReactNode, lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { MobileBottomNav } from './MobileBottomNav'
import { useLayoutStore } from '../../store/useLayoutStore'
import { PageTransition } from '../ui/PageTransition'
import { cn } from '../../lib/cn'

const loadAIAssistant = () => import('./AIAssistant').then((m) => ({ default: m.AIAssistant }))
const AIAssistant = lazy(loadAIAssistant)

// ── Layout ────────────────────────────────────────────────────────────────────
interface AppLayoutProps {
  children: ReactNode
  aiVariant?: 'default' | 'evaluation'
  /** Disable the default page transition (useful for pages with their own custom transitions) */
  disableTransition?: boolean
}

export function AppLayout({ children, aiVariant = 'default', disableTransition }: AppLayoutProps) {
  const {
    sidebarMode,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    isMobile,
    isFocusMode,
    setMobile,
    closeSidebarsOnMobile,
  } = useLayoutStore()
  const assistantPrefetchedRef = useRef(false)

  const warmAIAssistant = useCallback(() => {
    if (assistantPrefetchedRef.current) return
    assistantPrefetchedRef.current = true
    void loadAIAssistant()
  }, [])

  const shouldShowAssistant = isRightSidebarOpen && !isFocusMode

  // Track viewport breakpoint
  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [setMobile])

  // Prefetch AI assistant when idle
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
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      else window.clearTimeout(idleId)
    }
  }, [warmAIAssistant, isFocusMode])

  useEffect(() => {
    if (shouldShowAssistant) warmAIAssistant()
  }, [shouldShowAssistant, warmAIAssistant])

  // Left padding for <main> reflects the current sidebar mode (desktop/tablet)
  const leftPad =
    isMobile || sidebarMode === 'hidden' || isFocusMode
      ? 'lg:pl-0'
      : sidebarMode === 'rail'
        ? 'lg:pl-20'
        : 'lg:pl-64'

  return (
    <div className="min-h-screen bg-background text-on-background font-body relative overflow-hidden">
      {/* Mobile / drawer overlay */}
      <AnimatePresence>
        {isMobile && isLeftSidebarOpen && !isFocusMode && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeSidebarsOnMobile}
          />
        )}
      </AnimatePresence>

      <Sidebar />
      <TopNav />

      <main
        className={cn(
          'h-screen overflow-y-auto custom-scrollbar transition-[padding] duration-300 w-full',
          isFocusMode
            ? 'pl-0 pr-0 pt-0'
            : cn(leftPad, !isMobile && isRightSidebarOpen ? 'lg:pr-80' : 'pr-0', 'pt-14', isMobile && 'pb-bottom-nav'),
        )}
        style={{ scrollbarGutter: 'stable' }}
      >
        {disableTransition ? children : <PageTransition>{children}</PageTransition>}
      </main>

      <MobileBottomNav />

      {shouldShowAssistant && (
        <Suspense fallback={null}>
          <AIAssistant variant={aiVariant} />
        </Suspense>
      )}
    </div>
  )
}
