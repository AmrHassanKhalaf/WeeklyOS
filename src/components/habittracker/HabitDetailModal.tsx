import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { DynamicIcon } from '../ui/DynamicIcon'
import type { Habit } from '../../store/useHabitStore'
import { useHabitStore, isBadHabit } from '../../store/useHabitStore'
import { HabitBubbleGrid } from './HabitBubbleGrid'
import { BidiText } from '../ui/BidiText'

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CAT_META: Record<string, { label: string; icon: string; color: string }> = {
  health:       { label: 'Health',       icon: 'favorite',         color: '#4ade80' },
  learning:     { label: 'Learning',     icon: 'school',           color: '#60a5fa' },
  productivity: { label: 'Productivity', icon: 'bolt',             color: '#a78bfa' },
  spiritual:    { label: 'Spiritual',    icon: 'self_improvement', color: '#f9a8d4' },
  break_habit:  { label: 'Break Habit', icon: 'block',            color: '#f87171' },
  breaking_bad: { label: 'Break Habit', icon: 'block',            color: '#f87171' },
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

  const cat = CAT_META[habit.type] ?? CAT_META.health
  const isBad = isBadHabit(habit)
  const accentColor = isBad ? '#f87171' : (habit.color && habit.color !== '#f87171' ? habit.color : cat.color)

  // Stats
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear
  const todayDay = isCurrentMonth ? today.getDate() : totalDays
  const pastDays = Math.max(0, todayDay - 1)

  const slipCount = completedDays.size       // for break habits: logged = slipped
  const cleanDays = Math.max(0, pastDays - slipCount)
  const doneCount = completedDays.size       // for build habits: logged = done

  let successRate = 0
  if (pastDays > 0) {
    successRate = isBad
      ? Math.round((cleanDays / pastDays) * 100)
      : Math.round((doneCount / pastDays) * 100)
  }

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
              className="pointer-events-auto w-full max-w-2xl glass-panel rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div
                className="p-5 pb-4 shrink-0"
                style={{
                  background: isBad
                    ? 'linear-gradient(135deg, rgba(248,113,113,0.12), rgba(239,68,68,0.04))'
                    : `linear-gradient(135deg, ${accentColor}18, ${accentColor}04)`,
                  borderBottom: `1px solid ${accentColor}22`,
                }}
              >
                {/* Title row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${accentColor}20` }}
                    >
                      <DynamicIcon name={cat.icon} className="w-[22px] h-[22px]" color={accentColor} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BidiText as="h2" text={habit.name} className="text-lg font-extrabold text-on-surface truncate" />
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                          style={{ color: accentColor, background: `${accentColor}18` }}
                        >
                          {isBad ? '🚫 Break it' : cat.label}
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
                    <X className="text-xl" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-surface-container-low/50 rounded-xl p-3 text-center">
                    <p
                      className="text-2xl font-black"
                      style={{ color: isBad ? (successRate >= 70 ? '#4ade80' : '#f87171') : accentColor }}
                    >
                      {successRate}%
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold uppercase tracking-wider">
                      {isBad ? 'Clean Rate' : 'Done Rate'}
                    </p>
                  </div>

                  <div className="bg-surface-container-low/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-on-surface flex items-center justify-center gap-1">
                      {currentStreak >= 3 && <span className="text-xl">{isBad ? '🧊' : '🔥'}</span>}
                      {isBad ? cleanDays : currentStreak}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold uppercase tracking-wider">
                      {isBad ? 'Clean Days' : 'Current Streak'}
                    </p>
                  </div>

                  <div className="bg-surface-container-low/50 rounded-xl p-3 text-center">
                    <p
                      className="text-2xl font-black"
                      style={{ color: isBad ? (slipCount > 0 ? '#f87171' : '#4ade80') : undefined }}
                    >
                      {isBad ? slipCount : longestStreak}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-semibold uppercase tracking-wider">
                      {isBad ? 'Slips' : 'Best Streak'}
                    </p>
                  </div>
                </div>

                {/* Motivation */}
                {habit.motivation && (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-surface-container-low/40 border border-outline-variant/20">
                    <BidiText
                      as="p"
                      text={`"${habit.motivation}"`}
                      className="text-[12px] text-on-surface-variant italic leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* ── Calendar ── */}
              <div className="p-5 overflow-y-auto">
                {/* Legend */}
                <div className="flex items-center gap-4 mb-4 text-[11px] text-on-surface-variant">
                  {isBad ? (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400/60 inline-block" />
                        Clean day
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500/70 inline-block" />
                        I slipped
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
                    <span className="w-3 h-3 rounded-full border border-white/20 opacity-25 inline-block" />
                    Future
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

                {/* Bubbles */}
                <HabitBubbleGrid
                  habitId={habit.id}
                  totalDays={totalDays}
                  accentColor={accentColor}
                  large={true}
                />

                {/* Summary */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-on-surface-variant">
                    {isBad
                      ? slipCount === 0
                        ? '🎉 Zero slips so far this month. Incredible!'
                        : `${slipCount} slip${slipCount > 1 ? 's' : ''} this month · ${cleanDays} clean days. Stay strong!`
                      : doneCount === 0
                        ? 'No days logged yet — start today!'
                        : `${doneCount} of ${pastDays} past days done. ${pastDays - doneCount} missed.`}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
