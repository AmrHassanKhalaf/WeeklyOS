import { motion, AnimatePresence } from 'framer-motion'
import type { Habit } from '../../store/useHabitStore'
import { useHabitStore } from '../../store/useHabitStore'
import { HabitBubbleGrid } from './HabitBubbleGrid'

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  health:        { label: 'Health',        icon: 'favorite',        color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  learning:      { label: 'Learning',      icon: 'school',          color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  productivity:  { label: 'Productivity',  icon: 'bolt',            color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  spiritual:     { label: 'Spiritual',     icon: 'self_improvement', color: '#f9a8d4', bg: 'rgba(249,168,212,0.12)'},
  breaking_bad:  { label: 'Breaking Bad',  icon: 'block',           color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HabitDetailModalProps {
  habit: Habit | null
  totalDays: number
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HabitDetailModal({ habit, totalDays, onClose }: HabitDetailModalProps) {
  const getCompletedDays = useHabitStore(s => s.getCompletedDays)
  const getStreak = useHabitStore(s => s.getStreak)
  const currentMonth = useHabitStore(s => s.currentMonth)
  const currentYear = useHabitStore(s => s.currentYear)

  if (!habit) return null

  const completedDays = getCompletedDays(habit.id)
  const { current: currentStreak, longest: longestStreak } = getStreak(habit.id)

  const typeMeta = TYPE_META[habit.type] ?? TYPE_META.health
  const accentColor = habit.color || typeMeta.color
  const isBad = habit.is_bad_habit

  // For bad habits: success = days NOT completed (clean days)
  // For good habits: success = days completed
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear
  const todayDay = isCurrentMonth ? today.getDate() : totalDays
  const pastDays = todayDay - 1  // days that have fully passed

  const completedCount = completedDays.size
  const relapseCount = completedCount   // for bad habits, completions = relapses

  // Success rate
  let successRate = 0
  if (pastDays > 0) {
    if (isBad) {
      // success = clean days out of past days
      const cleanDays = pastDays - relapseCount
      successRate = Math.round((cleanDays / pastDays) * 100)
    } else {
      successRate = Math.round((completedCount / pastDays) * 100)
    }
  }

  // Build day labels for the grid header
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  return (
    <AnimatePresence>
      {habit && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-2xl glass-panel rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div
                className="p-5 pb-4"
                style={{
                  background: isBad
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(251,146,60,0.06))'
                    : `linear-gradient(135deg, ${accentColor}18, ${accentColor}06)`,
                  borderBottom: `1px solid ${accentColor}22`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: isBad ? 'rgba(239,68,68,0.15)' : `${accentColor}20` }}
                    >
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={{ color: isBad ? '#f87171' : accentColor }}
                      >
                        {isBad ? 'trending_down' : typeMeta.icon}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-extrabold text-on-surface truncate">{habit.name}</h2>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                          style={{
                            color: isBad ? '#f87171' : accentColor,
                            background: isBad ? 'rgba(239,68,68,0.12)' : `${accentColor}18`,
                          }}
                        >
                          {isBad ? '🚫 Bad Habit' : `✨ ${typeMeta.label}`}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {MONTH_NAMES[currentMonth - 1]} {currentYear} · {totalDays} days
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors shrink-0 ml-3"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {/* Success rate */}
                  <div className="bg-surface-container-low/50 rounded-xl p-3 text-center">
                    <p
                      className="text-2xl font-black"
                      style={{ color: isBad ? (successRate >= 70 ? '#4ade80' : '#f87171') : accentColor }}
                    >
                      {successRate}%
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold uppercase tracking-wider">
                      {isBad ? 'Clean Rate' : 'Success Rate'}
                    </p>
                  </div>

                  {/* Current streak */}
                  <div className="bg-surface-container-low/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-on-surface flex items-center justify-center gap-1">
                      {currentStreak >= 3 && <span className="text-xl">{isBad ? '🧊' : '🔥'}</span>}
                      {isBad ? pastDays - relapseCount : currentStreak}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold uppercase tracking-wider">
                      {isBad ? 'Clean Days' : 'Current Streak'}
                    </p>
                  </div>

                  {/* Relapses / Best streak */}
                  <div className="bg-surface-container-low/50 rounded-xl p-3 text-center">
                    {isBad ? (
                      <>
                        <p className="text-2xl font-black" style={{ color: relapseCount > 0 ? '#f87171' : '#4ade80' }}>
                          {relapseCount}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold uppercase tracking-wider">
                          Relapses
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-black text-on-surface">{longestStreak}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold uppercase tracking-wider">
                          Best Streak
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Motivation */}
                {habit.motivation && (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-surface-container-low/40 border border-outline-variant/20">
                    <p className="text-[12px] text-on-surface-variant italic leading-relaxed">
                      "{habit.motivation}"
                    </p>
                  </div>
                )}
              </div>

              {/* ── Calendar Grid ── */}
              <div className="p-5">
                {/* Legend */}
                <div className="flex items-center gap-4 mb-4 text-[11px] text-on-surface-variant">
                  {isBad ? (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400/60 inline-block" />
                        Clean day
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500/60 inline-block" />
                        Relapse
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ background: accentColor }} />
                        Done
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-400/40 inline-block" />
                        Missed
                      </span>
                    </>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-primary/60 inline-block" />
                    Today
                  </span>
                </div>

                {/* Day number header */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {days.map(d => (
                    <div
                      key={d}
                      className="flex items-center justify-center shrink-0"
                      style={{ width: '2.25rem' }}
                    >
                      <span className="text-[9px] text-on-surface-variant/50 font-semibold">{d}</span>
                    </div>
                  ))}
                </div>

                {/* Bubble grid */}
                <HabitBubbleGrid
                  habitId={habit.id}
                  totalDays={totalDays}
                  isBadHabit={isBad}
                  accentColor={isBad ? undefined : accentColor}
                  large={true}
                />

                {/* Summary sentence */}
                <div className="mt-4 text-center">
                  {isBad ? (
                    <p className="text-sm text-on-surface-variant">
                      {relapseCount === 0
                        ? '🎉 Perfect month! Zero relapses so far.'
                        : relapseCount === 1
                        ? `1 relapse this month. Stay strong — ${pastDays - 1} clean days!`
                        : `${relapseCount} relapses this month. ${pastDays - relapseCount} clean days. Keep going!`}
                    </p>
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      {completedCount === 0
                        ? 'No days logged yet. Start today!'
                        : `${completedCount} of ${pastDays} past days completed. ${pastDays - completedCount} missed.`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
