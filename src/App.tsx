import { useEffect, lazy, Suspense, useRef } from 'react'
import { Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useWeekStore } from './store/useWeekStore'
import { useSettingsStore } from './store/useSettingsStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { usePWA } from './hooks/usePWA'

const SignIn = lazy(() => import('./pages/SignIn').then(m => ({ default: m.SignIn })))
const loadDashboard = () => import('./pages/Dashboard').then(m => ({ default: m.Dashboard }))
const Dashboard = lazy(loadDashboard)
const WeeklyDistribution = lazy(() => import('./pages/WeeklyDistribution').then(m => ({ default: m.WeeklyDistribution })))
const FocusedDay = lazy(() => import('./pages/FocusedDay').then(m => ({ default: m.FocusedDay })))
const BrainDump = lazy(() => import('./pages/BrainDump').then(m => ({ default: m.BrainDump })))
const WeeklyEvaluation = lazy(() => import('./pages/WeeklyEvaluation').then(m => ({ default: m.WeeklyEvaluation })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const HabitTracker = lazy(() => import('./pages/HabitTracker').then(m => ({ default: m.HabitTracker })))

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="flex flex-col items-center gap-5 animate-fade-up relative z-10">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-2xl obsidian-gradient animate-float-soft shadow-[0_18px_40px_-8px_rgb(124_58_237_/_0.65)] flex items-center justify-center">
            <Sparkles className="text-white text-2xl" strokeWidth={1.5} />
          </div>
          <div className="absolute -inset-2 rounded-2xl border-2 border-primary/35 border-t-transparent animate-spin" />
        </div>
        <p className="text-on-surface-variant text-[11px] uppercase tracking-[0.32em] font-bold">
          Loading WeeklyOS…
        </p>
      </div>
    </div>
  )
}

// ── PWA Update Banner ─────────────────────────────────────────────────────────
// Non-intrusive bottom banner that appears when a new SW version is waiting.
function PWAUpdateBanner() {
  const { needsRefresh, updateApp } = usePWA()

  return (
    <AnimatePresence>
      {needsRefresh && (
        <motion.div
          key="pwa-update-banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={
            'fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] ' +
            'flex items-center gap-3 px-4 py-3 rounded-2xl ' +
            'bg-surface-container border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl ' +
            'text-sm text-on-surface max-w-sm w-[calc(100%-2rem)]'
          }
          role="status"
          aria-live="polite"
        >
          <MonitorDown className="w-[20px] h-[20px] text-primary shrink-0" strokeWidth={1.5} />
          <p className="flex-1 text-[13px] font-medium leading-snug">
            New version available
          </p>
          <button
            onClick={updateApp}
            className={
              'shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold uppercase tracking-widest ' +
              'bg-primary text-on-primary hover:bg-primary/90 active:scale-95 transition-all'
            }
          >
            Update
          </button>
          <button
            onClick={() => window.location.reload()}
            aria-label="Dismiss"
            className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors p-1"
          >
            <X className="text-[18px]" strokeWidth={1.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function AppRouter() {
  const { user, isLoading } = useAuth()
  const { initialize, cleanup } = useWeekStore()
  const theme = useSettingsStore(s => s.theme)
  const dashboardPrefetchedRef = useRef(false)

  useEffect(() => {
    if (!user) return
    let isActive = true

    const boot = async () => {
      const settingsStore = useSettingsStore.getState()
      const prevWeekStartDay = settingsStore.weekStartDay
      const prevTimezone = settingsStore.timezone

      await initialize()

      void (async () => {
        try {
          await settingsStore.loadFromDb()
          const latest = useSettingsStore.getState()
          if (!isActive) return
          if (latest.weekStartDay !== prevWeekStartDay || latest.timezone !== prevTimezone) {
            await initialize()
          }
        } catch {
          // Ignore settings sync errors to keep startup fast
        }
      })()
    }

    void boot()
    return () => {
      isActive = false
      cleanup()
    }
  }, [user, initialize, cleanup])

  useEffect(() => {
    if (!user || dashboardPrefetchedRef.current) return
    dashboardPrefetchedRef.current = true
    void loadDashboard()
  }, [user])

  useEffect(() => {
    const isLight = theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.body.classList.toggle('light', isLight)
  }, [theme])

  if (isLoading) return <LoadingScreen />
  if (!user) return <SignIn />

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/weekly-distribution" element={<WeeklyDistribution />} />
      <Route path="/focused-day" element={<FocusedDay />} />
      <Route path="/brain-dump" element={<BrainDump />} />
      <Route path="/weekly-evaluation" element={<WeeklyEvaluation />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/habit-tracker" element={<HabitTracker />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ErrorBoundary>
      {/* PWA update banner — outside AuthProvider so it shows even on /signin */}
      <PWAUpdateBanner />
    </BrowserRouter>
  )
}
