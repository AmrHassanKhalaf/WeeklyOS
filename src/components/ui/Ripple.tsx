import { useCallback, useState, type PointerEvent } from 'react'

interface RippleInstance {
  id: number
  x: number
  y: number
  size: number
}

/**
 * useRipple — returns a set of ripple dots and a pointer handler to attach to any
 * element whose container has .ripple-surface (or overflow: hidden). Ripples are
 * rendered inside the target and clean themselves up after the animation.
 *
 * Usage:
 *   const { ripples, onPointerDown } = useRipple()
 *   <button className="ripple-surface" onPointerDown={onPointerDown}>
 *     {children}
 *     <RippleContainer ripples={ripples} />
 *   </button>
 */
export function useRipple() {
  const [ripples, setRipples] = useState<RippleInstance[]>([])

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget
    if (!target) return
    const rect = target.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 0.9
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const id = performance.now() + Math.random()

    setRipples((prev) => [...prev, { id, x, y, size }])
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
  }, [])

  return { ripples, onPointerDown }
}

export function RippleContainer({ ripples }: { ripples: RippleInstance[] }) {
  return (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-dot"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
    </>
  )
}
