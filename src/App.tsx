import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useWeekStore } from './store/useWeekStore'
import { useSettingsStore } from './store/useSettingsStore'
import { SignIn } from './pages/SignIn'
import { Dashboard } from './pages/Dashboard'
import { WeeklyDistribution } from './pages/WeeklyDistribution'
import { FocusedDay } from './pages/FocusedDay'

import { BrainDump } from './pages/BrainDump'
import { WeeklyEvaluation } from './pages/WeeklyEvaluation'
import { Settings } from './pages/Settings'

function RoadmapPlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-primary mb-4 block">map</span>
        <h1 className="text-2xl font-bold mb-2">Roadmap</h1>
        <p className="text-neutral-500">Coming soon based on your long-term goals.</p>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#131313] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-lg obsidian-gradient flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-white text-xl">dashboard</span>
        </div>
        <p className="text-[#A1A1A1] text-sm uppercase tracking-widest">Loading WeeklyOS…</p>
      </div>
    </div>
  )
}

function AppRouter() {
  const { user, isLoading } = useAuth()
  const { initialize, cleanup } = useWeekStore()
  const theme = useSettingsStore(s => s.theme)

  useEffect(() => {
    if (user) {
      initialize()
      useSettingsStore.getState().loadFromDb()
      return () => cleanup()
    }
  }, [user, initialize, cleanup])

  useEffect(() => {
    const isLight = theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.body.classList.toggle('light', isLight)
  }, [theme])

  if (isLoading) return <LoadingScreen />
  if (!user) return <SignIn />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/weekly-distribution" element={<WeeklyDistribution />} />
        <Route path="/focused-day" element={<FocusedDay />} />
        <Route path="/roadmap" element={<RoadmapPlaceholder />} />
        <Route path="/brain-dump" element={<BrainDump />} />
        <Route path="/weekly-evaluation" element={<WeeklyEvaluation />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
