import { motion } from 'framer-motion'
import { useHabitStore } from '../../store/useHabitStore'

interface HabitSummaryBarProps {
  totalDays: number
}

export function HabitSummaryBar({ totalDays }: HabitSummaryBarProps) {
  const habits = useHabitStore(s => s.habits)
  const getAverageCompletionRate = useHabitStore(s => s.getAverageCompletionRate)
  const getBestHabit = useHabitStore(s => s.getBestHabit)
  const getWorstHabit = useHabitStore(s => s.getWorstHabit)
  const getPerfectDays = useHabitStore(s => s.getPerfectDays)
  const getCompletionRate = useHabitStore(s => s.getCompletionRate)

  const avgRate = getAverageCompletionRate(totalDays)
  const bestHabit = getBestHabit(totalDays)
  const worstHabit = getWorstHabit(totalDays)
  const perfectDays = getPerfectDays(totalDays)
  const bestRate = bestHabit ? getCompletionRate(bestHabit.id, totalDays) : 0
  const worstRate = worstHabit ? getCompletionRate(worstHabit.id, totalDays) : 0

  const stats = [
    {
      icon: 'format_list_numbered',
      label: 'Total Habits',
      value: habits.length.toString(),
      color: 'rgb(var(--color-primary))',
      bg: 'rgba(184,195,255,0.08)',
    },
    {
      icon: 'percent',
      label: 'Avg Completion',
      value: `${avgRate}%`,
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.08)',
    },
    {
      icon: 'emoji_events',
      label: 'Best Habit',
      value: bestHabit ? `${bestHabit.name}` : '—',
      subValue: bestHabit ? `${bestRate}%` : undefined,
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.08)',
    },
    {
      icon: 'trending_down',
      label: 'Needs Attention',
      value: worstHabit ? `${worstHabit.name}` : '—',
      subValue: worstHabit ? `${worstRate}%` : undefined,
      color: '#f87171',
      bg: 'rgba(248,113,113,0.08)',
    },
    {
      icon: 'star',
      label: 'Perfect Days',
      value: perfectDays.size.toString(),
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.08)',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-xl">analytics</span>
        <h2 className="text-base font-bold text-on-surface uppercase tracking-wider text-[12px]">
          Monthly Summary
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="ui-card ui-card--glass flex flex-col gap-1 min-w-0"
            style={{ borderTop: `2px solid ${stat.color}`, background: stat.bg }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ color: stat.color }}
              >
                {stat.icon}
              </span>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold truncate">
                {stat.label}
              </p>
            </div>
            <p
              className="text-lg font-black truncate"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            {stat.subValue && (
              <p className="text-[11px] text-on-surface-variant font-semibold">{stat.subValue}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Overall progress ring */}
      {habits.length > 0 && (
        <div className="ui-card ui-card--glass flex items-center gap-6 p-4">
          {/* SVG Ring */}
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              <motion.circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke="rgb(var(--color-primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 26}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - avgRate / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[13px] font-black text-on-surface">{avgRate}%</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm font-bold text-on-surface mb-1">Overall Month Progress</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {perfectDays.size > 0
                ? `🌟 You had ${perfectDays.size} perfect day${perfectDays.size > 1 ? 's' : ''} this month!`
                : avgRate >= 70
                ? '💪 Great consistency! Keep pushing to hit more perfect days.'
                : avgRate >= 40
                ? '📈 Building momentum. Consistency is the key — keep going!'
                : '🚀 Early days. Every completed circle counts. Start small!'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
