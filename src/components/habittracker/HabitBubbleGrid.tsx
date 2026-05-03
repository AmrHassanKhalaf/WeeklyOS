import { motion, AnimatePresence } from 'framer-motion'
import { useHabitStore } from '../../store/useHabitStore'

interface HabitBubbleGridProps {
  habitId: string
  totalDays: number
  isWeeklyView?: boolean
  weekOffset?: number
}

const DAYS_PER_WEEK = 7

export function HabitBubbleGrid({ habitId, totalDays, isWeeklyView = false, weekOffset = 0 }: HabitBubbleGridProps) {
  const toggleDay = useHabitStore(s => s.toggleDay)
  const getCompletedDays = useHabitStore(s => s.getCompletedDays)
  const getPerfectDays = useHabitStore(s => s.getPerfectDays)
  const currentMonth = useHabitStore(s => s.currentMonth)
  const currentYear = useHabitStore(s => s.currentYear)

  const completedDays = getCompletedDays(habitId)
  const perfectDays = getPerfectDays(totalDays)

  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear
  const todayDay = isCurrentMonth ? today.getDate() : totalDays + 1

  // If weekly view, slice to 7 days starting from weekOffset
  const startDay = isWeeklyView ? weekOffset * DAYS_PER_WEEK + 1 : 1
  const endDay = isWeeklyView ? Math.min(startDay + DAYS_PER_WEEK - 1, totalDays) : totalDays
  const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {days.map(day => {
        const isCompleted = completedDays.has(day)
        const isPast = day < todayDay
        const isMissed = isPast && !isCompleted
        const isPerfect = perfectDays.has(day)
        const isToday = day === todayDay

        // Build streak info for glow
        let streakDays = 0
        for (let d = day; d >= 1; d--) {
          if (completedDays.has(d)) streakDays++
          else break
        }
        const hasStreakGlow = isCompleted && streakDays >= 3

        return (
          <motion.button
            key={day}
            onClick={() => void toggleDay(habitId, day)}
            title={`Day ${day}`}
            whileTap={{ scale: 0.85 }}
            className="relative rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            style={{
              width: isWeeklyView ? '2rem' : '1.45rem',
              height: isWeeklyView ? '2rem' : '1.45rem',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isCompleted ? (
                <motion.span
                  key="filled"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: isPerfect
                      ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                      : 'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-tertiary)))',
                    boxShadow: hasStreakGlow
                      ? '0 0 8px 2px rgba(184,195,255,0.55), 0 0 2px 1px rgba(78,222,163,0.4)'
                      : undefined,
                  }}
                />
              ) : (
                <motion.span
                  key="empty"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                  className="absolute inset-0 rounded-full border"
                  style={{
                    borderColor: isMissed
                      ? 'rgba(239,68,68,0.4)'
                      : isToday
                      ? 'rgb(var(--color-primary))'
                      : 'rgba(255,255,255,0.15)',
                    background: isMissed
                      ? 'rgba(239,68,68,0.08)'
                      : isToday
                      ? 'rgba(184,195,255,0.08)'
                      : 'transparent',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Today indicator dot */}
            {isToday && !isCompleted && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-1 h-1 rounded-full bg-primary mt-0.5"
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
