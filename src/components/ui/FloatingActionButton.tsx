import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { RippleContainer } from './Ripple'
import { useRipple } from './useRipple'

export type FloatingActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
> & {
  /** Accessible label; also rendered as tooltip */
  label: string
  /** Icon node (material symbols span or lucide icon) */
  icon: ReactNode
  /** Show/hide with smooth transition (used to hide FAB on scroll or certain pages) */
  show?: boolean
  /** Positional preset. Default: bottom-right with safe-area for mobile bottom nav. */
  placement?: 'bottom-right' | 'bottom-center'
}

/**
 * Floating Action Button — desktop + mobile. Animated entrance, ripple on press.
 * Renders above the mobile bottom nav using safe-area math.
 */
export function FloatingActionButton({
  label,
  icon,
  show = true,
  placement = 'bottom-right',
  className,
  type,
  ...props
}: FloatingActionButtonProps) {
  const { ripples, onPointerDown } = useRipple()
  const positional =
    placement === 'bottom-center'
      ? 'left-1/2 -translate-x-1/2'
      : 'right-5 sm:right-8'

  return (
    <motion.button
      {...props}
      type={type ?? 'button'}
      onPointerDown={(e) => {
        onPointerDown(e)
        props.onPointerDown?.(e)
      }}
      aria-label={label}
      title={label}
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={show ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', damping: 18, stiffness: 320 }}
      style={{ bottom: 'calc(5.25rem + var(--safe-bottom))' }}
      className={cn(
        'ripple-surface fixed z-40 lg:bottom-8 h-14 w-14 rounded-full flex items-center justify-center',
        'text-white obsidian-gradient shadow-[0_14px_36px_-8px_rgba(124,58,237,0.6)]',
        'ring-1 ring-white/15 focus-ring',
        positional,
        className,
      )}
    >
      <span className="flex items-center justify-center text-2xl">{icon}</span>
      <RippleContainer ripples={ripples} />
    </motion.button>
  )
}
