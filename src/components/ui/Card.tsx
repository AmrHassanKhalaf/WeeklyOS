import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type CardVariant = 'solid' | 'glass'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
  /** Adds hover lift + violet edge glow + cursor pointer */
  interactive?: boolean
  /** Visually mark the card as selected / toggled-on */
  active?: boolean
  /** Visually mark the card as disabled (locked, no pointer events) */
  disabled?: boolean
}

export function Card({
  variant = 'glass',
  interactive,
  active,
  disabled,
  className,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      data-active={active ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        'ui-card',
        variant === 'glass' ? 'ui-card--glass' : 'ui-card--solid',
        interactive && 'ui-card--interactive',
        className,
      )}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex items-start justify-between gap-4', className)} />
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('space-y-4', className)} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex items-center justify-between gap-4 mt-4', className)} />
}
