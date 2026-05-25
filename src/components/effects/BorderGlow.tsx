import { type CSSProperties, type PointerEvent, type ReactNode, useCallback, useEffect, useRef } from 'react'
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
  const t0 = performance.now() + delay

  function tick() {
    const elapsed = performance.now() - t0
    const t = Math.min(elapsed / duration, 1)
    onUpdate(start + (end - start) * ease(t))
    if (t < 1) requestAnimationFrame(tick)
    else if (onEnd) onEnd()
  }

  setTimeout(() => requestAnimationFrame(tick), delay)
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
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const rectRef = useRef<CachedRect | null>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const pointerFrameRef = useRef<number | null>(null)

  const measureCard = useCallback(() => {
    const card = cardRef.current
    if (!card) return null
    const rect = card.getBoundingClientRect()
    rectRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
    return rectRef.current
  }, [])

  const flushPointerPosition = useCallback(() => {
    pointerFrameRef.current = null

    const card = cardRef.current
    const rect = rectRef.current
    if (!card || !rect) return

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

    // Keep glow visible while pointer is inside, and intensify near the edges.
    const minVisibleWhileInside = 0.35
    const blendedEdge = minVisibleWhileInside + edge * (1 - minVisibleWhileInside)

    card.style.setProperty('--edge-proximity', `${(blendedEdge * 100).toFixed(3)}`)
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`)
  }, [])

  const schedulePointerUpdate = useCallback(() => {
    if (pointerFrameRef.current !== null) return
    pointerFrameRef.current = requestAnimationFrame(flushPointerPosition)
  }, [flushPointerPosition])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const rect = rectRef.current ?? measureCard()
    if (!rect) return

    pointerRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    schedulePointerUpdate()
  }, [measureCard, schedulePointerUpdate])

  const handlePointerEnter = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    measureCard()
    card.style.setProperty('--edge-proximity', '35')
    handlePointerMove(event)
  }, [handlePointerMove, measureCard])

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    rectRef.current = null
    if (pointerFrameRef.current !== null) {
      cancelAnimationFrame(pointerFrameRef.current)
      pointerFrameRef.current = null
    }
    if (!animated) {
      card.style.setProperty('--edge-proximity', '0')
    }
    card.style.setProperty('--cursor-angle', '45deg')
  }, [animated])

  useEffect(() => {
    const clearCachedRect = () => {
      rectRef.current = null
    }

    window.addEventListener('scroll', clearCachedRect, { passive: true, capture: true })
    window.addEventListener('resize', clearCachedRect)

    return () => {
      window.removeEventListener('scroll', clearCachedRect, { capture: true })
      window.removeEventListener('resize', clearCachedRect)
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current)
        pointerFrameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!animated || !cardRef.current) return

    const card = cardRef.current
    const angleStart = 110
    const angleEnd = 465
    card.classList.add('sweep-active')
    card.style.setProperty('--cursor-angle', `${angleStart}deg`)

    animateValue({ duration: 500, onUpdate: v => card.style.setProperty('--edge-proximity', `${v}`) })
    animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: v => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`)
      },
    })
    animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: v => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`)
      },
    })
    animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: v => card.style.setProperty('--edge-proximity', `${v}`),
      onEnd: () => card.classList.remove('sweep-active'),
    })
  }, [animated])

  const glowVars = buildGlowVars(glowColor, glowIntensity)

  const style = {
    '--card-bg': backgroundColor,
    '--edge-sensitivity': edgeSensitivity,
    '--border-radius': `${borderRadius}px`,
    '--glow-padding': `${glowRadius}px`,
    '--cone-spread': `${coneSpread}`,
    '--fill-opacity': `${fillOpacity}`,
    ...glowVars,
    ...buildGradientVars(colors),
  } as CSSProperties

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`border-glow-card ${className}`.trim()}
      style={style}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  )
}
