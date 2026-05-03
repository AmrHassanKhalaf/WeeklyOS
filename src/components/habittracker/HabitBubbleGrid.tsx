import { motion, AnimatePresence } from 'framer-motion'
import { useHabitStore } from '../../store/useHabitStore'

interface HabitBubbleGridProps {
  habitId: string
  totalDays: number
  isWeeklyView?: boolean
  weekOffset?: number
  isBadHabit?: boolean
  accentColor?: string
  /** When true, renders larger bubbles (used in the detail modal) */
  large?: boolean
}

const DAYS_PER_WEEK = 7

export function HabitBubbleGrid({
  habitId,
  totalDays,
  isWeeklyView = false,
  weekOffset = 0,
  isBadHabit = false,
  accentColor,
  large = false,
}: HabitBubbleGridProps) {
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

  const bubbleSize = large ? '2.25rem' : isWeeklyView ? '2rem' : '1.45rem'

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {days.map(day => {
        const didIt = completedDays.has(day)   // user tapped this day
        const isPast = day < todayDay
        const isToday = day === todayDay
        const isPerfect = perfectDays.has(day)

        /**
         * Good habit:
         *   - didIt + past  → ✅ green filled (success)
         *   - !didIt + past → ❌ red outline (missed/failed)
         *
         * Bad habit:
         *   - didIt + past  → ❌ red filled (relapse/bad)
         *   - !didIt + past → ✅ green outline (clean day / success)
         */
        const isSuccess = isBadHabit ? !didIt : didIt
        const isRelapse = isBadHabit && didIt

        // Streak glow: consecutive successful days
        let streakDays = 0
        for (let d = day; d >= 1; d--) {
          const daySuccess = isBadHabit ? !completedDays.has(d) : completedDays.has(d)
          if (daySuccess) streakDays++
          else break
        }
        const hasStreakGlow = isPast && isSuccess && streakDays >= 3

        // Color logic
        const successFill = accentColor
          ? `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`
          : 'linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-tertiary)))'

        return (
          <motion.button
            key={day}
            onClick={() => void toggleDay(habitId, day)}
            title={isBadHabit
              ? (didIt ? `Day ${day}: Relapsed 😞` : `Day ${day}: Clean day ✅`)
              : `Day ${day}${didIt ? ': Done ✅' : ''}`}
            whileTap={{ scale: 0.8 }}
            className="relative rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 shrink-0"
            style={{ width: bubbleSize, height: bubbleSize }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {/* ── FILLED STATE ── */}
              {didIt ? (
                <motion.span
                  key="filled"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: isRelapse
                      ? 'linear-gradient(135deg, #f87171, #ef4444)'      // bad habit relapse = RED
                      : isPerfect && !isBadHabit
                      ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'      // perfect all-habits day = GOLD
                      : successFill,                                      // good habit done = accent
                    boxShadow: hasStreakGlow && !isRelapse
                      ? '0 0 8px 2px rgba(184,195,255,0.55), 0 0 2px 1px rgba(78,222,163,0.4)'
                      : isRelapse
                      ? '0 0 6px 1px rgba(248,113,113,0.5)'
                      : undefined,
                  }}
                />
              ) : (
                /* ── EMPTY STATE ── */
                <motion.span
                  key="empty"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                  className="absolute inset-0 rounded-full border"
                  style={{
                    // Bad habit: past clean day = green tint (success)
                    // Good habit: past missed day = red tint (failure)
                    borderColor: isBadHabit && isPast
                      ? 'rgba(74,222,128,0.55)'       // clean day green
                      : !isBadHabit && isPast && !isToday
                      ? 'rgba(239,68,68,0.4)'          // missed red
                      : isToday
                      ? 'rgb(var(--color-primary))'
                      : 'rgba(255,255,255,0.15)',
                    background: isBadHabit && isPast
                      ? 'rgba(74,222,128,0.08)'
                      : !isBadHabit && isPast && !isToday
                      ? 'rgba(239,68,68,0.08)'
                      : isToday
                      ? 'rgba(184,195,255,0.08)'
                      : 'transparent',
                    boxShadow: isBadHabit && isPast && hasStreakGlow
                      ? '0 0 6px 1px rgba(74,222,128,0.4)'
                      : undefined,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Today indicator dot */}
            {isToday && !didIt && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-1 h-1 rounded-full bg-primary mt-0.5" />
            )}

            {/* Bad habit: small X on relapse bubble */}
            {isRelapse && large && (
              <span className="absolute inset-0 flex items-center justify-center text-white font-black text-[10px] pointer-events-none">✕</span>
            )}
            {/* Bad habit: small checkmark on clean day when large */}
            {isBadHabit && !didIt && isPast && large && (
              <span className="absolute inset-0 flex items-center justify-center text-emerald-400 font-black text-[10px] pointer-events-none">✓</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
