import { lazy, Suspense, useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSettingsStore } from '../store/useSettingsStore'
import { useWeekStore } from '../store/useWeekStore'
import { LoadingScreen } from './LoadingScreen'

const loadDashboard = () => import('../pages/Dashboard').then((m) => ({ default: m.Dashboard }))
const Dashboard = lazy(loadDashboard)
const WeeklyDistribution = lazy(() => import('../pages/WeeklyDistribution').then((m) => ({ default: m.WeeklyDistribution })))
const FocusedDay = lazy(() => import('../pages/FocusedDay').then((m) => ({ default: m.FocusedDay })))
const BrainDump = lazy(() => import('../pages/BrainDump').then((m) => ({ default: m.BrainDump })))
const WeeklyEvaluation = lazy(() => import('../pages/WeeklyEvaluation').then((m) => ({ default: m.WeeklyEvaluation })))
const Settings = lazy(() => import('../pages/Settings').then((m) => ({ default: m.Settings })))
const HabitTracker = lazy(() => import('../pages/HabitTracker').then((m) => ({ default: m.HabitTracker })))

export function AuthenticatedApp() {
  const initialize = useWeekStore((state) => state.initialize)
  const cleanup = useWeekStore((state) => state.cleanup)
  const theme = useSettingsStore((state) => state.theme)
  const dashboardPrefetchedRef = useRef(false)

  useEffect(() => {
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
          // Settings sync should not block the authenticated shell.
        }
      })()
    }

    void boot()
    return () => {
      isActive = false
      cleanup()
    }
  }, [initialize, cleanup])

  useEffect(() => {
    if (dashboardPrefetchedRef.current) return
    dashboardPrefetchedRef.current = true
    void loadDashboard()
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const isLight = theme === 'light' || (theme === 'system' && !media.matches)
      document.body.classList.toggle('light', isLight)
    }

    applyTheme()
    if (theme !== 'system') return

    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

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
