import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type StatusDotProps = HTMLAttributes<HTMLSpanElement> & {
  /** Visual status */
  status?: 'online' | 'away' | 'offline' | 'busy'
  /** px size. Default 10 */
  size?: number
  /** Whether to pulse */
  pulse?: boolean
}

const STATUS_BG: Record<NonNullable<StatusDotProps['status']>, string> = {
  online:  '#22c55e',
  away:    '#fbbf24',
  offline: '#6b7280',
  busy:    '#ef4444',
}

/**
 * Animated status indicator (online / away / offline / busy).
 * Used on avatars and in stat chips to signal "alive" state.
 */
export function StatusDot({
  status = 'online',
  size = 10,
  pulse = true,
  className,
  style,
  ...props
}: StatusDotProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-block rounded-full ring-2 ring-black/50',
        pulse && status === 'online' && 'animate-status-pulse',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: STATUS_BG[status],
        ...style,
      }}
    />
  )
}
