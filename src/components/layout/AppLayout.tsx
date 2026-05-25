import { type ReactNode, lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { MobileBottomNav } from './MobileBottomNav'
import { AnimatedBackground } from './AnimatedBackground'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useOfflineQueueStore } from '../../store/offlineQueueStore'
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

// ── Offline / Syncing indicator badge ─────────────────────────────────────────
function NetworkStatusBadge() {
  const isOnline = useOfflineQueueStore((state) => state.isOnline)
  const isSyncing = useOfflineQueueStore((state) => state.isSyncing)
  const queueLength = useOfflineQueueStore((state) => state.queue.length)
  const lastSyncError = useOfflineQueueStore((state) => state.lastSyncError)

  if (isOnline && !isSyncing && queueLength === 0 && !lastSyncError) return null

  const label = !isOnline
    ? `Offline${queueLength > 0 ? ` · ${queueLength} pending` : ''}`
    : isSyncing
      ? 'Syncing…'
      : lastSyncError
        ? 'Sync conflict'
        : null

  if (!label) return null

  const colorClass = !isOnline
    ? 'bg-red-500/90 text-white'
    : isSyncing
      ? 'bg-amber-500/90 text-white'
      : 'bg-yellow-400/90 text-black'

  return (
    <AnimatePresence>
      <motion.div
        key="network-badge"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'fixed top-2 left-1/2 -translate-x-1/2 z-[9999]',
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur',
          colorClass
        )}
        aria-live="polite"
        role="status"
      >
        {/* Pulsing dot */}
        <span
          className={cn(
            'inline-block w-1.5 h-1.5 rounded-full',
            !isOnline ? 'bg-white animate-pulse' : isSyncing ? 'bg-white animate-spin' : 'bg-black'
          )}
        />
        {label}
      </motion.div>
    </AnimatePresence>
  )
}

// ── App Layout ─────────────────────────────────────────────────────────────────
export function AppLayout({ children, aiVariant = 'default', disableTransition }: AppLayoutProps) {
  const {
    sidebarMode,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    isMobile,
    isFocusMode,
    focusLevel,
    setMobile,
    closeSidebarsOnMobile,
  } = useLayoutStore()
  const isDeepFocus = isFocusMode && focusLevel === 'deep'
  const assistantPrefetchedRef = useRef(false)
  const registerListeners = useOfflineQueueStore((state) => state.registerListeners)

  const warmAIAssistant = useCallback(() => {
    if (assistantPrefetchedRef.current) return
    assistantPrefetchedRef.current = true
    void loadAIAssistant()
  }, [])

  const shouldShowAssistant = isRightSidebarOpen && !isDeepFocus

  // Register the offline queue network listeners once on mount.
  // NOTE: Service worker registration is handled automatically by vite-plugin-pwa
  // (injectRegister: 'auto') — do NOT call navigator.serviceWorker.register here.
  useEffect(() => {
    const unregister = registerListeners()
    return unregister
  }, [registerListeners])

  // Track viewport breakpoint
  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [setMobile])

  // Prefetch AI assistant when idle
  useEffect(() => {
    if (assistantPrefetchedRef.current || isDeepFocus) return
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
  }, [warmAIAssistant, isDeepFocus])

  useEffect(() => {
    if (shouldShowAssistant) warmAIAssistant()
  }, [shouldShowAssistant, warmAIAssistant])

  // Left padding for <main> reflects the current sidebar mode (desktop/tablet)
  const leftPad =
    isMobile || sidebarMode === 'hidden' || isDeepFocus
      ? 'lg:pl-0'
      : sidebarMode === 'rail'
        ? 'lg:pl-20'
        : 'lg:pl-64'

  return (
    <div className="min-h-screen bg-background text-on-background font-body relative overflow-hidden">
      {/* ── Animated purple-wave background ── */}
      <AnimatedBackground />
      {/* Offline / syncing indicator */}
      <NetworkStatusBadge />

      {/* Mobile / drawer overlay */}
      <AnimatePresence>
        {isMobile && isLeftSidebarOpen && !isDeepFocus && (
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
          isDeepFocus
            ? 'pl-0 pr-0 pt-0'
            : cn(leftPad, !isMobile && isRightSidebarOpen ? 'lg:pr-80' : 'pr-0', 'pt-14', isMobile && !isFocusMode && 'pb-bottom-nav'),
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
