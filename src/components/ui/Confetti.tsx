import { useEffect, useState } from 'react'

interface Piece {
  id: number
  left: number
  tx: number
  tr: number
  delay: number
  color: string
  duration: number
}

const DEFAULT_COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa']

interface ConfettiBurstProps {
  /** Show / hide — when `show` flips true the burst plays once then hides automatically */
  show: boolean
  /** How many particles (default 14) */
  count?: number
  /** Custom colors */
  colors?: string[]
  /** Lifespan in ms (after which the burst hides itself). Default 1200. */
  duration?: number
  /** className for the absolutely-positioned container */
  className?: string
  /** Called when the animation finishes and pieces are removed */
  onDone?: () => void
}

/**
 * Lightweight confetti burst. Render inside a `position: relative` parent.
 * Zero extra deps — uses CSS @keyframes confetti-fall.
 */
export function ConfettiBurst({
  show,
  count = 14,
  colors = DEFAULT_COLORS,
  duration = 1200,
  className = '',
  onDone,
}: ConfettiBurstProps) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    if (!show) return
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      onDone?.()
      return
    }

    const list: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i + performance.now(),
      left: 50 + (Math.random() - 0.5) * 40, // percentage across container
      tx: (Math.random() - 0.5) * 120,
      tr: (Math.random() - 0.5) * 720,
      delay: Math.random() * 120,
      color: colors[i % colors.length],
      duration: 900 + Math.random() * 600,
    }))
    setPieces(list)
    const timeout = window.setTimeout(() => {
      setPieces([])
      onDone?.()
    }, duration)
    return () => window.clearTimeout(timeout)
  }, [show, count, colors, duration, onDone])

  if (pieces.length === 0) return null

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-visible ${className}`}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            // @ts-expect-error custom CSS props
            '--tx': `${p.tx}px`,
            '--tr': `${p.tr}deg`,
          }}
        />
      ))}
    </div>
  )
}
