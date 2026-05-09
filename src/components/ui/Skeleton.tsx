import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Optional rounded preset for common shapes */
  shape?: 'rect' | 'circle' | 'pill'
}

/**
 * Shimmer skeleton placeholder. Prefer this over raw `animate-pulse` blocks:
 *
 *   <Skeleton className="h-6 w-24" />
 *   <Skeleton shape="circle" className="w-10 h-10" />
 */
export function Skeleton({ className, shape = 'rect', ...props }: SkeletonProps) {
  const shapeClass =
    shape === 'circle' ? 'rounded-full' : shape === 'pill' ? 'rounded-full' : 'rounded-xl'
  return <div {...props} className={cn('skeleton', shapeClass, className)} />
}
