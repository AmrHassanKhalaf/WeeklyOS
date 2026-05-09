import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type CardVariant = 'solid' | 'glass'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant
}

export function Card({ variant = 'glass', className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn('ui-card', variant === 'glass' ? 'ui-card--glass' : 'ui-card--solid', className)}
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
