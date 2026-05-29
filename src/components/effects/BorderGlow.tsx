import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef } from 'react'
import './BorderGlow.css'

function parseHSL(hslStr: string) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) return { h: 40, s: 80, l: 80 }
  return { h: Number.parseFloat(match[1]), s: Number.parseFloat(match[2]), l: Number.parseFloat(match[3]) }
}

function buildGlowVars(glowColor: string, intensity: number) {
  const { h, s, l } = parseHSL(glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']
  const vars: Record<string, string> = {}
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`
  }
  return vars
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven']
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1]

type CachedRect = {
  left: number
  top: number
  width: number
  height: number
}

function buildGradientVars(colors: string[]) {
  const vars: Record<string, string> = {}
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)]
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`
  return vars
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3)
}

function easeInCubic(x: number) {
  return x * x * x
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: {
  start?: number
  end?: number
  duration?: number
  delay?: number
  ease?: (x: number) => number
  onUpdate: (value: number) => void
  onEnd?: () => void
}) {
  let frameId: number | null = null
  let timeoutId: number | null = null
  let cancelled = false
  const t0 = performance.now() + delay

  function tick() {
    if (cancelled) return
    const elapsed = performance.now() - t0
    const t = Math.min(elapsed / duration, 1)
    onUpdate(start + (end - start) * ease(t))
    if (t < 1) frameId = requestAnimationFrame(tick)
    else if (onEnd) onEnd()
  }

  timeoutId = window.setTimeout(() => {
    frameId = requestAnimationFrame(tick)
  }, delay)

  return () => {
    cancelled = true
    if (timeoutId !== null) window.clearTimeout(timeoutId)
    if (frameId !== null) cancelAnimationFrame(frameId)
  }
}

type BorderGlowProps = {
  children: ReactNode
  edgeSensitivity?: number
  glowColor?: string
  backgroundColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  coneSpread?: number
  animated?: boolean
  colors?: string[]
  fillOpacity?: number
  className?: string
  trackPointer?: boolean
}

export default function BorderGlow({
  children,
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = 'transparent',
  borderRadius = 20,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5,
  className = '',
  trackPointer = false,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const rectRef = useRef<CachedRect | null>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const pointerFrameRef = useRef<number | null>(null)
  const shouldTrackPointer =
    (trackPointer || animated) &&
    (typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches)

  useEffect(() => {
    if (!shouldTrackPointer) return
    const card = cardRef.current
    if (!card) return

    const measureCard = () => {
      const rect = card.getBoundingClientRect()
      rectRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
      return rectRef.current
    }

    const flushPointerPosition = () => {
      pointerFrameRef.current = null

      const rect = rectRef.current
      if (!rect) return

      const { x, y } = pointerRef.current
      const cx = rect.width / 2
      const cy = rect.height / 2
      const dx = x - cx
      const dy = y - cy

      let kx = Number.POSITIVE_INFINITY
      let ky = Number.POSITIVE_INFINITY
      if (dx !== 0) kx = cx / Math.abs(dx)
      if (dy !== 0) ky = cy / Math.abs(dy)
      const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)

      let angle = 0
      if (dx !== 0 || dy !== 0) {
        angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
        if (angle < 0) angle += 360
      }

      // Direct DOM writes avoid React work during pointer movement.
      const minVisibleWhileInside = 0.35
      const blendedEdge = minVisibleWhileInside + edge * (1 - minVisibleWhileInside)
      card.style.setProperty('--edge-proximity', `${(blendedEdge * 100).toFixed(3)}`)
      card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
    }

    const schedulePointerUpdate = () => {
      if (pointerFrameRef.current !== null) return
      pointerFrameRef.current = requestAnimationFrame(flushPointerPosition)
    }

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const rect = rectRef.current ?? measureCard()
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      schedulePointerUpdate()
    }

    const handlePointerEnter = (event: globalThis.PointerEvent) => {
      measureCard()
      card.style.setProperty('--edge-proximity', '35')
      handlePointerMove(event)
    }

    const handlePointerLeave = () => {
      rectRef.current = null
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current)
        pointerFrameRef.current = null
      }
      if (!animated) card.style.setProperty('--edge-proximity', '0')
      card.style.setProperty('--cursor-angle', '45deg')
    }

    const clearCachedRect = () => {
      rectRef.current = null
    }

    card.addEventListener('pointerenter', handlePointerEnter, { passive: true })
    card.addEventListener('pointermove', handlePointerMove, { passive: true })
    card.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    window.addEventListener('scroll', clearCachedRect, { passive: true, capture: true })
    window.addEventListener('resize', clearCachedRect)

    return () => {
      card.removeEventListener('pointerenter', handlePointerEnter)
      card.removeEventListener('pointermove', handlePointerMove)
      card.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('scroll', clearCachedRect, { capture: true })
      window.removeEventListener('resize', clearCachedRect)
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current)
        pointerFrameRef.current = null
      }
    }
  }, [animated, shouldTrackPointer])

  useEffect(() => {
    if (!animated || !cardRef.current) return

    const card = cardRef.current
    const angleStart = 110
    const angleEnd = 465
    card.classList.add('sweep-active')
    card.style.setProperty('--cursor-angle', `${angleStart}deg`)

    const cleanups = [
      animateValue({ duration: 500, onUpdate: v => card.style.setProperty('--edge-proximity', `${v}`) }),
      animateValue({
        ease: easeInCubic,
        duration: 1500,
        end: 50,
        onUpdate: v => {
          card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`)
        },
      }),
      animateValue({
        ease: easeOutCubic,
        delay: 1500,
        duration: 2250,
        start: 50,
        end: 100,
        onUpdate: v => {
          card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`)
        },
      }),
      animateValue({
        ease: easeInCubic,
        delay: 2500,
        duration: 1500,
        start: 100,
        end: 0,
        onUpdate: v => card.style.setProperty('--edge-proximity', `${v}`),
        onEnd: () => card.classList.remove('sweep-active'),
      }),
    ]

    return () => {
      cleanups.forEach((cleanup) => cleanup())
      card.classList.remove('sweep-active')
    }
  }, [animated])

  const style = useMemo(() => ({
    '--card-bg': backgroundColor,
    '--edge-sensitivity': edgeSensitivity,
    '--border-radius': `${borderRadius}px`,
    '--glow-padding': `${glowRadius}px`,
    '--cone-spread': `${coneSpread}`,
    '--fill-opacity': `${fillOpacity}`,
    ...buildGlowVars(glowColor, glowIntensity),
    ...buildGradientVars(colors),
  } as CSSProperties), [
    backgroundColor,
    borderRadius,
    colors,
    coneSpread,
    edgeSensitivity,
    fillOpacity,
    glowColor,
    glowIntensity,
    glowRadius,
  ])

  return (
    <div
      ref={cardRef}
      className={`border-glow-card ${shouldTrackPointer ? 'border-glow-card--track' : ''} ${className}`.trim()}
      style={style}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  )
}
