// ─── useInstallPrompt.ts ──────────────────────────────────────────────────────
// Captures the browser's `beforeinstallprompt` event so you can trigger
// the PWA install dialog from a custom UI element (e.g. a Settings button).
//
// Usage:
//   const { canInstall, install } = useInstallPrompt()
//   {canInstall && <Button onClick={install}>Install App</Button>}

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

export interface UseInstallPromptReturn {
  /** True when the browser supports PWA install and the app is not already installed. */
  canInstall: boolean
  /** Trigger the native install dialog. Resolves once the user responds. */
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
  /** True if the user has already installed or accepted the prompt this session. */
  isInstalled: boolean
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Already running in standalone mode — already installed.
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = () => setIsInstalled(true)

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!prompt) return 'unavailable'

    await prompt.prompt()
    const { outcome } = await prompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
      setPrompt(null)
    }

    return outcome
  }, [prompt])

  return {
    canInstall: !!prompt && !isInstalled,
    install,
    isInstalled,
  }
}
