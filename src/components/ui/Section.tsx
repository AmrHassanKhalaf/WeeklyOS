import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type SectionVariant = 'solid' | 'glass'

export type SectionProps = HTMLAttributes<HTMLElement> & {
  variant?: SectionVariant
}

export function Section({ variant = 'glass', className, ...props }: SectionProps) {
  return (
    <section
      {...props}
      className={cn('ui-section', variant === 'glass' ? 'ui-section--glass' : 'ui-section--solid', className)}
    />
  )
}
