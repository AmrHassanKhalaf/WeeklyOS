import { useEffect, useState } from 'react'
import { MonitorDown, X } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'
import { useLayoutStore } from '../store/useLayoutStore'
import { useWeekStore } from '../store/useWeekStore'

const MOBILE_QUERY = '(max-width: 1023px)'

function readIsMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
}

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(readIsMobileViewport)

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY)
    const handleChange = () => setIsMobile(media.matches)
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}

export function PWAUpdateBanner() {
  const { needsRefresh, updateApp } = usePWA()
  const isMobile = useIsMobileViewport()
  const isFocusMode = useLayoutStore((state) => state.isFocusMode)
  const isPomodoroRunning = useWeekStore((state) => state.isPomodoroRunning)
  const [dismissed, setDismissed] = useState(false)
  const isFocusSessionActive = isFocusMode || isPomodoroRunning

  useEffect(() => {
    if (needsRefresh) setDismissed(false)
  }, [needsRefresh])

  if (!needsRefresh || dismissed || isFocusSessionActive) return null

  return (
    <div
      className={
        `fixed inset-x-3 ${isMobile ? 'bottom-[calc(5.75rem+var(--safe-bottom,0px))]' : 'bottom-5'} z-[9998] animate-fade-up ` +
        'mx-auto flex max-w-md items-center gap-2.5 rounded-2xl px-3 py-2.5 ' +
        'border border-white/15 bg-surface-container/95 text-sm text-on-surface ' +
        'shadow-[0_18px_50px_-22px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md'
      }
      role="status"
      aria-live="polite"
    >
      <MonitorDown className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.6} />
      <p className="min-w-0 flex-1 text-[12px] font-semibold leading-snug">New version available</p>
      <button
        onClick={updateApp}
        className={
          'flex h-9 shrink-0 items-center rounded-xl bg-primary px-3 text-[11px] font-black uppercase tracking-[0.12em] ' +
          'text-on-primary transition-[background-color,transform] hover:bg-primary/90 active:scale-95 focus-ring'
        }
      >
        Update
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface focus-ring"
      >
        <X className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </button>
    </div>
  )
}
