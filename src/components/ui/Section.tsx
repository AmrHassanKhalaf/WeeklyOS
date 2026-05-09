import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type SectionVariant = 'solid' | 'glass'

export type SectionProps = HTMLAttributes<HTMLElement> & {
  variant?: SectionVariant
  /** Adds hover lift + violet edge glow + cursor pointer */
  interactive?: boolean
  /** Visually mark the section as selected / toggled-on */
  active?: boolean
  /** Visually mark the section as disabled */
  disabled?: boolean
}

export function Section({
  variant = 'glass',
  interactive,
  active,
  disabled,
  className,
  ...props
}: SectionProps) {
  return (
    <section
      {...props}
      data-active={active ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        'ui-section',
        variant === 'glass' ? 'ui-section--glass' : 'ui-section--solid',
        interactive && 'ui-section--interactive',
        className,
      )}
    />
  )
}
