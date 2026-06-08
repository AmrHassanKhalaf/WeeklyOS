import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { getLineDirection } from '../../utils/textDirection'

type BidiElement = 'div' | 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'li'

interface BidiTextProps extends HTMLAttributes<HTMLElement> {
  as?: BidiElement
  text: string
}

interface BidiLineProps extends HTMLAttributes<HTMLElement> {
  as?: BidiElement
  text: string
  children?: ReactNode
}

interface BidiLinesProps extends HTMLAttributes<HTMLDivElement> {
  text: string
  lineClassName?: string
  emptyClassName?: string
}

export function BidiText({ as: Component = 'span', text, className, ...props }: BidiTextProps) {
  return (
    <Component
      {...props}
      dir={getLineDirection(text)}
      className={cn('bidi-line', className)}
    >
      {text}
    </Component>
  )
}

export function BidiLine({ as: Component = 'div', text, children, className, ...props }: BidiLineProps) {
  return (
    <Component
      {...props}
      dir={getLineDirection(text)}
      className={cn('bidi-line', className)}
    >
      {children ?? text}
    </Component>
  )
}

export function BidiLines({
  text,
  className,
  lineClassName,
  emptyClassName = 'h-1',
  ...props
}: BidiLinesProps) {
  return (
    <div {...props} className={className}>
      {text.split('\n').map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={index} className={emptyClassName} />
        return (
          <BidiLine key={index} as="p" text={trimmed} className={lineClassName}>
            {trimmed}
          </BidiLine>
        )
      })}
    </div>
  )
}
