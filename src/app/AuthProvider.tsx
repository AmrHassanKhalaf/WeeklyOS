import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useLayoutStore } from '../store/useLayoutStore'
import { AuthContext } from './AuthContext'

const AUTH_REFRESH_INTERVAL_MS = 5 * 60 * 1000
const AUTH_REFRESH_THRESHOLD_MS = 10 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      const session = data.session
      if (!session) return null

      const expiresAt = session.expires_at ? session.expires_at * 1000 : null
      if (expiresAt && expiresAt - Date.now() < AUTH_REFRESH_THRESHOLD_MS) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) return session
        return refreshed.session ?? session
      }

      return session
    }

    supabase.auth
      .startAutoRefresh()
      .catch(() => undefined)

    syncSession()
      .then((session) => {
        if (!isMounted) return
        setUser(session?.user ?? null)
        setIsLoading(false)
      })
      .catch(() => {
        if (isMounted) setIsLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        useLayoutStore.getState().resetTransientLayout()
      }
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const keepSessionFresh = () => {
      void syncSession()
        .then((session) => {
          if (!isMounted || !session) return
          setUser(session.user)
        })
        .catch(() => undefined)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') keepSessionFresh()
    }

    const intervalId = window.setInterval(keepSessionFresh, AUTH_REFRESH_INTERVAL_MS)
    window.addEventListener('focus', keepSessionFresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', keepSessionFresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ user, isLoading }), [user, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
