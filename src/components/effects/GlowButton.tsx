import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './GlowButton.css'

type GlowButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  compact?: boolean
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export function GlowButton({ children, className = '', compact = false, variant = 'primary', ...props }: GlowButtonProps) {
  const variantClass = variant === 'secondary'
    ? 'glow-button--secondary'
    : variant === 'tertiary'
      ? 'glow-button--tertiary'
      : ''

  return (
    <button
      {...props}
      className={`glow-button ${variantClass} ${compact ? 'glow-button--compact' : ''} ${className}`.trim()}
    >
      <span className="glow-button__content">{children}</span>
    </button>
  )
}
