// ─── usePWA.ts ────────────────────────────────────────────────────────────────
// Detects when a new Service Worker version is available and exposes state
// for showing a non-intrusive update banner in the UI.
//
// Usage:
//   const { needsRefresh, updateApp } = usePWA()
//
// Powered by vite-plugin-pwa's `useRegisterSW` hook.

import { useCallback } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export interface UsePWAReturn {
  /** True when a new SW version is waiting to activate. */
  needsRefresh: boolean
  /** Call this to skip waiting and reload to the new version. */
  updateApp: () => void
  /** True while the SW is being installed for the first time. */
  isOfflineReady: boolean
}

export function usePWA(): UsePWAReturn {
  const {
    needRefresh: [needsRefresh],
    offlineReady: [isOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Poll for updates every 60 minutes while the tab is open.
      // This ensures long-lived sessions pick up new deploys.
      if (r) {
        setInterval(async () => {
          if (!r.installing && navigator.onLine) {
            try {
              const resp = await fetch(swUrl, {
                cache: 'no-store',
                headers: { 'cache-control': 'no-cache' },
              })
              if (resp.status === 200) await r.update()
            } catch {
              // Network offline — skip update check silently
            }
          }
        }, 60 * 60 * 1000) // 60 minutes
      }
    },
    onRegisterError(error) {
      console.warn('[usePWA] SW registration failed:', error)
    },
  })

  const updateApp = useCallback(() => {
    void updateServiceWorker(true)
  }, [updateServiceWorker])

  return { needsRefresh, updateApp, isOfflineReady }
}
