import { useEffect, useState } from 'react'
import { MonitorDown, X } from 'lucide-react'
import { usePWA } from '../hooks/usePWA'

export function PWAUpdateBanner() {
  const { needsRefresh, updateApp } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (needsRefresh) setDismissed(false)
  }, [needsRefresh])

  if (!needsRefresh || dismissed) return null

  return (
    <div
      className={
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] animate-fade-up ' +
        'flex items-center gap-3 px-4 py-3 rounded-2xl ' +
        'bg-surface-container border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] ' +
        'text-sm text-on-surface max-w-sm w-[calc(100%-2rem)]'
      }
      role="status"
      aria-live="polite"
    >
      <MonitorDown className="w-[20px] h-[20px] text-primary shrink-0" strokeWidth={1.5} />
      <p className="flex-1 text-[13px] font-medium leading-snug">New version available</p>
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
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors p-1"
      >
        <X className="text-[18px]" strokeWidth={1.5} />
      </button>
    </div>
  )
}
