import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  active?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
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
  className,
  type,
  ...props
}: ButtonProps) {
  const resolvedType = type ?? 'button'

  return (
    <button
      {...props}
      type={resolvedType}
      data-active={active ? 'true' : undefined}
      className={cn('btn', variantClasses[variant], sizeClasses[size], className)}
    />
  )
}
