import { motion, AnimatePresence } from 'framer-motion'
import { useHabitStore, isBadHabit } from '../../store/useHabitStore'

interface HabitBubbleGridProps {
  habitId: string
  totalDays: number
  isWeeklyView?: boolean
  weekOffset?: number
  accentColor?: string
  /** Renders larger bubbles with checkmark/X icons (used in detail modal) */
  large?: boolean
  /** Fired when the user's tap results in a positive outcome (build done / slip cleared).
   *  Useful for celebration animations. */
  onCelebrate?: () => void
  /** Fired when the user's tap results in a negative outcome (build undone / slip added).
   *  Useful for shake / error feedback. */
  onNegative?: () => void
}

const DAYS_PER_WEEK = 7

export function HabitBubbleGrid({
  habitId,
  totalDays,
  isWeeklyView = false,
  weekOffset = 0,
  accentColor,
  large = false,
  onCelebrate,
  onNegative,
}: HabitBubbleGridProps) {
  const toggleDay = useHabitStore(s => s.toggleDay)
  const getCompletedDays = useHabitStore(s => s.getCompletedDays)
  const getPerfectDays = useHabitStore(s => s.getPerfectDays)
  const habits = useHabitStore(s => s.habits)
  const currentMonth = useHabitStore(s => s.currentMonth)
  const currentYear = useHabitStore(s => s.currentYear)

  const habit = habits.find(h => h.id === habitId)
  const isBad = habit ? isBadHabit(habit) : false

  const completedDays = getCompletedDays(habitId)
  const perfectDays = getPerfectDays(totalDays)

  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear
  const todayDay = isCurrentMonth ? today.getDate() : totalDays + 1

  // Slice days for weekly / monthly view
  const startDay = isWeeklyView ? weekOffset * DAYS_PER_WEEK + 1 : 1
  const endDay = isWeeklyView ? Math.min(startDay + DAYS_PER_WEEK - 1, totalDays) : totalDays
  const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)

  const bubbleSize = large ? '2.25rem' : isWeeklyView ? '2rem' : '1.45rem'

  // Accent colour from prop or habit colour
  const buildColor = accentColor ?? (habit?.color && habit.color !== '#f87171' ? habit.color : '#4ade80')
  const successFill = `linear-gradient(135deg, ${buildColor}, ${buildColor}cc)`

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {days.map(day => {
        const isFuture = day > todayDay
        const isPast = day < todayDay
        const isToday = day === todayDay
        const didIt = completedDays.has(day)
        const isPerfect = perfectDays.has(day)

        // Success = good habit done OR bad habit NOT done
        const isSuccessDay = isBad ? !didIt : didIt
        const isRelapse = isBad && didIt

        // Streak glow: 3+ consecutive success days
        let streakLen = 0
        if (!isFuture) {
          for (let d = day; d >= 1; d--) {
            const s = isBad ? !completedDays.has(d) : completedDays.has(d)
            if (s) streakLen++
            else break
          }
        }
        const hasGlow = !isFuture && isSuccessDay && streakLen >= 3

        // Tooltip
        const tooltip = isFuture
          ? `Day ${day} — not here yet`
          : isBad
            ? didIt ? `Day ${day}: I slipped 😬` : `Day ${day}: Clean day ✓`
            : didIt ? `Day ${day}: Done ✅` : `Day ${day}`

        // Decide the outcome of a hypothetical click (what state will the day be in after toggle?)
        // Build habit:  !didIt -> celebrate (marking done) | didIt -> negative (un-checking)
        // Break habit:   didIt -> celebrate (slip cleared) | !didIt -> negative (recording slip)
        const nextWouldCelebrate = isBad ? didIt : !didIt
        const handleClick = () => {
          if (isFuture) return
          if (nextWouldCelebrate) onCelebrate?.()
          else onNegative?.()
          void toggleDay(habitId, day)
        }

        return (
          <motion.button
            key={day}
            onClick={handleClick}
            title={tooltip}
            whileTap={isFuture ? {} : { scale: 0.8 }}
            disabled={isFuture}
            className={`relative rounded-full transition-[opacity,transform] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 shrink-0 ${
              isFuture ? 'cursor-not-allowed opacity-25' : 'cursor-pointer'
            }`}
            style={{ width: bubbleSize, height: bubbleSize }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {didIt ? (
                /* ── LOGGED (filled) ── */
                <motion.span
                  key="filled"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: isRelapse
                      ? 'linear-gradient(135deg, #f87171, #ef4444)'  // slip = red
                      : isPerfect && !isBad
                      ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'  // all-habit perfect day = gold
                      : successFill,
                    boxShadow: hasGlow && !isRelapse
                      ? `0 0 8px 2px ${buildColor}66, 0 0 2px 1px ${buildColor}44`
                      : isRelapse
                      ? '0 0 6px 1px rgba(248,113,113,0.5)'
                      : undefined,
                  }}
                />
              ) : (
                /* ── EMPTY ── */
                <motion.span
                  key="empty"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                  className="absolute inset-0 rounded-full border"
                  style={{
                    borderColor: isFuture
                      ? 'rgba(255,255,255,0.06)'
                      : isBad && isPast
                      ? 'rgba(74,222,128,0.55)'      // clean day = green border
                      : !isBad && isPast
                      ? 'rgba(239,68,68,0.4)'         // missed = red border
                      : isToday
                      ? 'rgb(var(--color-primary))'
                      : 'rgba(255,255,255,0.15)',
                    background: isFuture
                      ? 'transparent'
                      : isBad && isPast
                      ? 'rgba(74,222,128,0.07)'
                      : !isBad && isPast
                      ? 'rgba(239,68,68,0.07)'
                      : isToday
                      ? 'rgba(184,195,255,0.07)'
                      : 'transparent',
                    boxShadow: isBad && isPast && hasGlow
                      ? '0 0 6px 1px rgba(74,222,128,0.4)'
                      : undefined,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Today pulse dot */}
            {isToday && !didIt && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-1 h-1 rounded-full bg-primary mt-0.5" />
            )}

            {/* Large mode icons */}
            {large && !isFuture && isRelapse && (
              <span className="absolute inset-0 flex items-center justify-center text-white/90 font-black text-[11px] pointer-events-none">✕</span>
            )}
            {large && !isFuture && isBad && !didIt && isPast && (
              <span className="absolute inset-0 flex items-center justify-center text-emerald-400 font-black text-[11px] pointer-events-none">✓</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
