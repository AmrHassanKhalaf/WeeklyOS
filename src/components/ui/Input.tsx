import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { forwardRef, useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import { getLineDirection } from '../../utils/textDirection'

type WithInvalid = { invalid?: boolean }

export type InputProps = InputHTMLAttributes<HTMLInputElement> & WithInvalid
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & WithInvalid
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & WithInvalid

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'date',
  'datetime-local',
  'file',
  'hidden',
  'image',
  'month',
  'number',
  'radio',
  'range',
  'reset',
  'submit',
  'time',
  'week',
])

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function shouldUseLiveBidi(type: InputHTMLAttributes<HTMLInputElement>['type']): boolean {
  if (!type) return true
  return !NON_TEXT_INPUT_TYPES.has(String(type).toLowerCase())
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, dir, type, value, defaultValue, onChange, ...props }, ref) => {
    const liveBidi = shouldUseLiveBidi(type)
    const [liveText, setLiveText] = useState(() => stringValue(value ?? defaultValue))

    useEffect(() => {
      setLiveText(stringValue(value ?? defaultValue))
    }, [defaultValue, value])

    return (
      <input
        ref={ref}
        {...props}
        type={type}
        value={value}
        defaultValue={defaultValue}
        dir={liveBidi ? (dir && dir !== 'auto' ? dir : getLineDirection(liveText)) : dir}
        aria-invalid={invalid || props['aria-invalid']}
        onChange={(event) => {
          if (liveBidi) setLiveText(event.currentTarget.value)
          onChange?.(event)
        }}
        className={cn('input-base', liveBidi && 'bidi-plaintext', invalid && 'animate-shake', className)}
      />
    )
  },
)

Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, dir, value, defaultValue, onChange, ...props }, ref) => {
    const [liveText, setLiveText] = useState(() => stringValue(value ?? defaultValue))

    useEffect(() => {
      setLiveText(stringValue(value ?? defaultValue))
    }, [defaultValue, value])

    return (
      <textarea
        ref={ref}
        {...props}
        value={value}
        defaultValue={defaultValue}
        dir={dir && dir !== 'auto' ? dir : getLineDirection(liveText)}
        aria-invalid={invalid || props['aria-invalid']}
        onChange={(event) => {
          setLiveText(event.currentTarget.value)
          onChange?.(event)
        }}
        className={cn('input-base bidi-plaintext', invalid && 'animate-shake', className)}
      />
    )
  },
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
