import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './app/AuthProvider'
import { useAuth } from './app/useAuth'
import { LoadingScreen } from './app/LoadingScreen'
import { PWAUpdateBanner } from './app/PWAUpdateBanner'
import { ErrorBoundary } from './components/ErrorBoundary'

const SignIn = lazy(() => import('./pages/SignIn').then((m) => ({ default: m.SignIn })))
const AuthenticatedApp = lazy(() => import('./app/AuthenticatedApp').then((m) => ({ default: m.AuthenticatedApp })))

type StoredTheme = 'dark' | 'light' | 'system'

function readStoredTheme(): StoredTheme {
  try {
    const raw = localStorage.getItem('weeklyos-settings')
    const theme = raw ? JSON.parse(raw)?.state?.theme : null
    return theme === 'light' || theme === 'system' || theme === 'dark' ? theme : 'dark'
  } catch {
    return 'dark'
  }
}

function applyStoredTheme() {
  const theme = readStoredTheme()
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isLight = theme === 'light' || (theme === 'system' && !prefersDark)
  document.body.classList.toggle('light', isLight)
}

function AppGate() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <SignIn />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthenticatedApp />
    </Suspense>
  )
}

export default function App() {
  useEffect(() => {
    applyStoredTheme()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', applyStoredTheme)
    return () => media.removeEventListener('change', applyStoredTheme)
  }, [])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </ErrorBoundary>
      <PWAUpdateBanner />
    </BrowserRouter>
  )
}
