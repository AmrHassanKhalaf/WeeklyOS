import { type CSSProperties, type ReactNode, useMemo, useState } from 'react'
import './BorderGlow.css'

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
  className = '',
}: BorderGlowProps) {
  const [x, setX] = useState('50%')
  const [y, setY] = useState('50%')
  const [opacity, setOpacity] = useState(animated ? Math.min(0.55, 0.2 + glowIntensity * 0.2) : 0)

  const overlayOpacity = useMemo(() => {
    if (animated) return Math.max(opacity, 0.24)
    return opacity
  }, [animated, opacity])

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const localX = event.clientX - rect.left
    const localY = event.clientY - rect.top

    const nearestEdge = Math.min(localX, localY, rect.width - localX, rect.height - localY)
    const edgeRatio = Math.max(0, 1 - nearestEdge / Math.max(edgeSensitivity, 1))

    setX(`${(localX / rect.width) * 100}%`)
    setY(`${(localY / rect.height) * 100}%`)
    setOpacity(Math.min(1, edgeRatio * glowIntensity))
  }

  const handleLeave = () => {
    setOpacity(animated ? Math.min(0.55, 0.2 + glowIntensity * 0.2) : 0)
    setX('50%')
    setY('50%')
  }

  const style = {
    '--glow-x': x,
    '--glow-y': y,
    '--glow-opacity': overlayOpacity,
    '--glow-radius': `${glowRadius}px`,
    '--glow-intensity': glowIntensity,
    '--glow-color': glowColor,
    '--bg-color': backgroundColor,
    '--bg-border-radius': `${borderRadius}px`,
    '--glow-grad-1': colors[0] || '#c084fc',
    '--glow-grad-2': colors[1] || colors[0] || '#f472b6',
    '--glow-grad-3': colors[2] || colors[1] || '#38bdf8',
    '--cone-spread': `${coneSpread}deg`,
  } as CSSProperties

  return (
    <div
      className={`border-glow ${animated ? 'border-glow--animated' : ''} ${className}`.trim()}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="border-glow__content">{children}</div>
      <div className="border-glow__overlay" />
    </div>
  )
}
