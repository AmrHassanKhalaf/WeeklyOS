import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useWeekStore } from './store/useWeekStore'
import { SignIn } from './pages/SignIn'
import { Dashboard } from './pages/Dashboard'
import { WeeklyDistribution } from './pages/WeeklyDistribution'
import { FocusedDay } from './pages/FocusedDay'
import { BrainDump } from './pages/BrainDump'
import { WeeklyEvaluation } from './pages/WeeklyEvaluation'

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

  useEffect(() => {
    if (user) {
      initialize()
      return () => cleanup()
    }
  }, [user, initialize, cleanup])

  if (isLoading) return <LoadingScreen />
  if (!user) return <SignIn />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/weekly-distribution" element={<WeeklyDistribution />} />
        <Route path="/focused-day" element={<FocusedDay />} />
        <Route path="/brain-dump" element={<BrainDump />} />
        <Route path="/weekly-evaluation" element={<WeeklyEvaluation />} />
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
