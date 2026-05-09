import { useEffect, lazy, Suspense, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useWeekStore } from './store/useWeekStore'
import { useSettingsStore } from './store/useSettingsStore'
import { ErrorBoundary } from './components/ErrorBoundary'

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
            <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
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
    </BrowserRouter>
  )
}
