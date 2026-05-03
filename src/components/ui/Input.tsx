import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('input-base', className)} {...props} />
))

Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('input-base', className)} {...props} />
))

Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn('input-base appearance-none pr-10', className)} {...props} />
))

Select.displayName = 'Select'
