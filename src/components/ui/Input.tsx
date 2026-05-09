import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

type WithInvalid = { invalid?: boolean }

export type InputProps = InputHTMLAttributes<HTMLInputElement> & WithInvalid
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & WithInvalid
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & WithInvalid

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      aria-invalid={invalid || props['aria-invalid']}
      className={cn('input-base', invalid && 'animate-shake', className)}
    />
  ),
)

Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      {...props}
      aria-invalid={invalid || props['aria-invalid']}
      className={cn('input-base', invalid && 'animate-shake', className)}
    />
  ),
)

Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, ...props }, ref) => (
    <select
      ref={ref}
      {...props}
      aria-invalid={invalid || props['aria-invalid']}
      className={cn('input-base appearance-none pr-10', invalid && 'animate-shake', className)}
    />
  ),
)

Select.displayName = 'Select'
