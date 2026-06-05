import { cn } from '../../lib/cn'

interface WeeklyOSLogoProps {
  alt?: string
  className?: string
  imageClassName?: string
}

export function WeeklyOSLogo({
  alt = 'WeeklyOS',
  className,
  imageClassName,
}: WeeklyOSLogoProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-xl bg-[#03040b] shadow-[0_12px_36px_-12px_rgb(34_211_238_/_0.5)]',
        className,
      )}
    >
      <img
        src="/brand/weeklyos-logo.png"
        alt={alt}
        className={cn('h-full w-full object-cover', imageClassName)}
        decoding="async"
      />
    </div>
  )
}
