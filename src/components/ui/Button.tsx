import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { RippleContainer } from './Ripple'
import { useRipple } from './useRipple'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  active?: boolean
  /** Disable the ripple micro-interaction (opt-out) */
  noRipple?: boolean
  /** Show an inline loading spinner and disable the button. Keeps content width-stable. */
  loading?: boolean
  /** Optional icon rendered before the label. When `loading` is true it is replaced by a spinner. */
  leftIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  tertiary: 'btn-tertiary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  active,
  noRipple,
  loading,
  leftIcon,
  className,
  type,
  children,
  disabled,
  onPointerDown,
  ...props
}: ButtonProps) {
  const resolvedType = type ?? 'button'
  const { ripples, onPointerDown: ripplePointer } = useRipple()
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      type={resolvedType}
      disabled={isDisabled}
      data-active={active ? 'true' : undefined}
      aria-busy={loading ? true : undefined}
      onPointerDown={(e) => {
        if (!noRipple && !isDisabled) ripplePointer(e)
        onPointerDown?.(e)
      }}
      className={cn(
        'btn ripple-surface focus-ring',
        variantClasses[variant],
        sizeClasses[size],
        'transition-transform',
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      ) : (
        leftIcon
      )}
      {children}
      {!noRipple && !isDisabled && <RippleContainer ripples={ripples} />}
    </button>
  )
}
