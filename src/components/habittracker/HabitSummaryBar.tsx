import { motion } from 'framer-motion'
import { useHabitStore, isBadHabit } from '../../store/useHabitStore'

interface HabitSummaryBarProps {
  totalDays: number
  activeTab: 'build' | 'break'
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, bg, delay = 0 }: {
  icon: string; label: string; value: string; sub?: string
  color: string; bg: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="ui-card ui-card--glass flex flex-col gap-1 min-w-0"
      style={{ borderTop: `2px solid ${color}`, background: bg }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="material-symbols-outlined text-[15px]" style={{ color }}>{icon}</span>
        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold truncate">{label}</p>
      </div>
      <p className="text-lg font-black truncate" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-on-surface-variant font-medium">{sub}</p>}
    </motion.div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HabitSummaryBar({ totalDays, activeTab }: HabitSummaryBarProps) {
  const habits                      = useHabitStore(s => s.habits)
  const getAverageCompletionRate    = useHabitStore(s => s.getAverageCompletionRate)
  const getBestHabit                = useHabitStore(s => s.getBestHabit)
  const getWorstHabit               = useHabitStore(s => s.getWorstHabit)
  const getPerfectDays              = useHabitStore(s => s.getPerfectDays)
  const getCompletionRate           = useHabitStore(s => s.getCompletionRate)
  const getStrongestBreakHabit      = useHabitStore(s => s.getStrongestBreakHabit)
  const getNeedsAttentionBreakHabit = useHabitStore(s => s.getNeedsAttentionBreakHabit)
  const getBreakHabitCleanRate      = useHabitStore(s => s.getBreakHabitCleanRate)

  const buildHabits = habits.filter(h => !isBadHabit(h))
  const breakHabits = habits.filter(h => isBadHabit(h))

  // ── Build metrics ──────────────────────────────────────────────────────────
  const avgRate     = getAverageCompletionRate(totalDays)
  const bestBuild   = getBestHabit(totalDays)
  const worstBuild  = getWorstHabit(totalDays)
  const perfectDays = getPerfectDays(totalDays)
  const bestRate    = bestBuild  ? getCompletionRate(bestBuild.id, totalDays)  : 0
  const worstRate   = worstBuild ? getCompletionRate(worstBuild.id, totalDays) : 0

  // ── Break metrics ──────────────────────────────────────────────────────────
  const strongest     = getStrongestBreakHabit()
  const hardest       = getNeedsAttentionBreakHabit()
  const strongestRate = strongest ? getBreakHabitCleanRate(strongest.id) : 0
  const hardestRate   = hardest   ? getBreakHabitCleanRate(hardest.id)   : 0

  // Total clean days across all break habits (sum of clean days per habit)
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === (today.getMonth() + 1) && today.getFullYear() === today.getFullYear()
  const todayDay = isCurrentMonth ? today.getDate() : totalDays
  const pastDays = Math.max(0, todayDay - 1)
  const totalSlips = breakHabits.reduce((sum, h) => {
    const { getCompletionCount } = useHabitStore.getState()
    return sum + getCompletionCount(h.id)
  }, 0)
  const totalBreakCleanDays = breakHabits.length > 0
    ? Math.max(0, pastDays * breakHabits.length - totalSlips)
    : 0

  // ── BUILD TAB render ───────────────────────────────────────────────────────
  if (activeTab === 'build') {
    if (buildHabits.length === 0) return null

    return (
      <div className="space-y-4">
        {/* Section label */}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-lg">insights</span>
          <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
            Build Habits · Monthly Summary
          </h2>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon="percent"       label="Avg Completion"  value={`${avgRate}%`}                        color="#60a5fa" bg="rgba(96,165,250,0.07)"  delay={0}    />
          <StatCard icon="emoji_events"  label="Best Habit"      value={bestBuild  ? bestBuild.name  : '—'}   sub={bestBuild  ? `${bestRate}% done`  : undefined} color="#4ade80" bg="rgba(74,222,128,0.07)"   delay={0.04} />
          <StatCard icon="trending_down" label="Needs Work"      value={worstBuild ? worstBuild.name : '—'}   sub={worstBuild ? `${worstRate}% done` : undefined} color="#fb923c" bg="rgba(251,146,60,0.07)"  delay={0.08} />
          <StatCard icon="star"          label="Perfect Days"    value={perfectDays.size.toString()}           color="#fbbf24" bg="rgba(251,191,36,0.07)"  delay={0.12} />
        </div>

        {/* Progress ring */}
        <div className="ui-card ui-card--glass flex items-center gap-5 p-4">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
              <motion.circle cx="28" cy="28" r="22" fill="none" stroke="rgb(var(--color-primary))" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - avgRate / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[12px] font-black text-on-surface">{avgRate}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-on-surface mb-0.5">Month Progress</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {perfectDays.size > 0
                ? `🌟 ${perfectDays.size} perfect day${perfectDays.size > 1 ? 's' : ''} this month!`
                : avgRate >= 70 ? '💪 Great consistency! Keep pushing.'
                : avgRate >= 40 ? '📈 Good momentum. Stay consistent.'
                : '🚀 Every completed circle counts. Start small!'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── BREAK TAB render ───────────────────────────────────────────────────────
  if (breakHabits.length === 0) return null

  const overallCleanRate = pastDays > 0 && breakHabits.length > 0
    ? Math.round((totalBreakCleanDays / (pastDays * breakHabits.length)) * 100)
    : 100

  return (
    <div className="space-y-4">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-rose-400 text-lg">insights</span>
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-on-surface-variant">
          Break Habits · Monthly Summary
        </h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon="self_improvement" label="Overall Clean Rate" value={`${overallCleanRate}%`}
          sub={`${totalBreakCleanDays} clean day${totalBreakCleanDays !== 1 ? 's' : ''} total`}
          color={overallCleanRate >= 70 ? '#4ade80' : '#f87171'} bg={overallCleanRate >= 70 ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)'} delay={0} />
        <StatCard icon="shield" label="Strongest Control" value={strongest ? strongest.name : '—'}
          sub={strongest ? `${strongestRate}% clean` : undefined}
          color="#4ade80" bg="rgba(74,222,128,0.07)" delay={0.04} />
        <StatCard icon="warning" label="Hardest to Break" value={hardest ? hardest.name : '—'}
          sub={hardest ? `${hardestRate}% clean` : undefined}
          color="#f87171" bg="rgba(248,113,113,0.07)" delay={0.08} />
      </div>

      {/* Clean rate ring */}
      <div className="ui-card ui-card--glass flex items-center gap-5 p-4">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
            <motion.circle cx="28" cy="28" r="22" fill="none"
              stroke={overallCleanRate >= 70 ? '#4ade80' : '#f87171'}
              strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - overallCleanRate / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[12px] font-black text-on-surface">{overallCleanRate}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-on-surface mb-0.5">Overall Clean Rate</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {totalSlips === 0
              ? '🎉 Zero slips this month. Stay strong!'
              : overallCleanRate >= 70
              ? `💪 ${totalSlips} slip${totalSlips > 1 ? 's' : ''} total. Solid control!`
              : `Keep going — every clean day builds the streak.`}
          </p>
        </div>
      </div>
    </div>
  )
}
