import { motion } from 'framer-motion'
import { BarChart2, LayoutGrid } from 'lucide-react'
import { useHabitStore } from '../../store/useHabitStore'

interface HabitAnalyticsPanelProps {
  totalDays: number
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HabitAnalyticsPanel({ totalDays }: HabitAnalyticsPanelProps) {
  const habits = useHabitStore(s => s.habits)
  const completions = useHabitStore(s => s.completions)
  const currentMonth = useHabitStore(s => s.currentMonth)
  const currentYear = useHabitStore(s => s.currentYear)

  // Build weekly bar data (last 7 days)
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear
  const refDay = isCurrentMonth ? today.getDate() : totalDays

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = refDay - 6 + i
    return day > 0 && day <= totalDays ? day : null
  })

  const weeklyData = weekDays.map(day => {
    if (day === null || habits.length === 0) return { day: null, rate: 0, label: '' }
    const done = habits.filter(h =>
      completions.some(
        c => c.habit_id === h.id && c.day === day && c.month === currentMonth && c.year === currentYear
      )
    ).length
    const rate = Math.round((done / habits.length) * 100)

    // Compute weekday name
    const date = new Date(currentYear, currentMonth - 1, day)
    const label = DAY_NAMES[date.getDay()]
    return { day, rate, label }
  })

  const maxRate = Math.max(...weeklyData.map(d => d.rate), 1)

  // Heatmap for full month (30 days)
  const heatmapData = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1
    if (habits.length === 0) return { day, rate: 0 }
    const done = habits.filter(h =>
      completions.some(
        c => c.habit_id === h.id && c.day === day && c.month === currentMonth && c.year === currentYear
      )
    ).length
    return { day, rate: Math.round((done / habits.length) * 100) }
  })

  return (
    <div className="space-y-5">
      {/* Weekly bar chart */}
      <div className="ui-card ui-card--glass space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="text-primary text-lg" strokeWidth={1.5} />
          <h3 className="text-sm font-bold text-on-surface">Last 7 Days</h3>
        </div>

        <div className="flex items-end gap-2 h-32 px-1">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-on-surface-variant">{d.rate > 0 ? `${d.rate}%` : ''}</span>
              <div className="w-full rounded-t-md relative overflow-hidden" style={{ height: '5.5rem' }}>
                <div className="absolute inset-0 rounded-t-md bg-surface-container-high" />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md"
                  style={{
                    background:
                      d.rate >= 80
                        ? 'linear-gradient(180deg, #4ade80, #22c55e)'
                        : d.rate >= 50
                        ? 'linear-gradient(180deg, rgb(var(--color-primary)), rgb(var(--color-primary))/60)'
                        : d.rate > 0
                        ? 'linear-gradient(180deg, #60a5fa, #3b82f6)'
                        : 'transparent',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.rate / maxRate) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: 'easeOut' }}
                />
                {d.day !== null && d.day === refDay && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
                )}
              </div>
              <span className={`text-[10px] font-semibold ${d.day === refDay ? 'text-primary' : 'text-on-surface-variant'}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly heatmap */}
      <div className="ui-card ui-card--glass space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="text-primary text-lg" strokeWidth={1.5} />
          <h3 className="text-sm font-bold text-on-surface">Month Heatmap</h3>
          <span className="ml-auto flex items-center gap-2 text-[10px] text-on-surface-variant">
            <span className="w-3 h-3 rounded-sm bg-surface-container-high inline-block" /> 0%
            <span className="w-3 h-3 rounded-sm bg-primary/50 inline-block" /> 50%
            <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> 100%
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {heatmapData.map(({ day, rate }) => (
            <motion.div
              key={day}
              title={`Day ${day}: ${rate}%`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: day * 0.012 }}
              className="relative rounded-md flex items-center justify-center"
              style={{
                width: '2rem',
                height: '2rem',
                background:
                  rate >= 100
                    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                    : rate >= 70
                    ? `rgba(var(--color-primary), ${0.4 + rate / 200})`
                    : rate >= 40
                    ? `rgba(var(--color-primary), ${0.15 + rate / 300})`
                    : rate > 0
                    ? 'rgba(var(--color-primary), 0.1)'
                    : 'rgba(255,255,255,0.05)',
                border: day === refDay ? '1.5px solid rgb(var(--color-primary))' : '1.5px solid transparent',
              }}
            >
              <span className="text-[9px] font-bold text-on-surface-variant/80">{day}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
