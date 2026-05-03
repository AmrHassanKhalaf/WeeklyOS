import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit } from '../../store/useHabitStore'
import { useHabitStore } from '../../store/useHabitStore'
import { HabitBubbleGrid } from './HabitBubbleGrid'

// ─── Color helpers ────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  health:        { label: 'Health',        icon: 'favorite',         color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  learning:      { label: 'Learning',      icon: 'school',           color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  productivity:  { label: 'Productivity',  icon: 'bolt',             color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  spiritual:     { label: 'Spiritual',     icon: 'self_improvement', color: '#f9a8d4', bg: 'rgba(249,168,212,0.12)' },
  breaking_bad:  { label: 'Breaking Bad',  icon: 'block',            color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
}

const DIFFICULTY_META: Record<string, { label: string; dots: number; color: string }> = {
  easy:   { label: 'Easy',   dots: 1, color: '#4ade80' },
  medium: { label: 'Medium', dots: 2, color: '#fbbf24' },
  hard:   { label: 'Hard',   dots: 3, color: '#f87171' },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HabitCardProps {
  habit: Habit
  totalDays: number
  isWeeklyView?: boolean
  weekOffset?: number
  onEdit: (habit: Habit) => void
  onViewDetail: (habit: Habit) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HabitCard({
  habit,
  totalDays,
  isWeeklyView,
  weekOffset,
  onEdit,
  onViewDetail,
}: HabitCardProps) {
  const [isMotivationOpen, setIsMotivationOpen] = useState(false)
  const deleteHabit = useHabitStore(s => s.deleteHabit)
  const getCompletionCount = useHabitStore(s => s.getCompletionCount)
  const getCompletedDays = useHabitStore(s => s.getCompletedDays)
  const getStreak = useHabitStore(s => s.getStreak)

  const isBad = habit.is_bad_habit ?? false

  // Raw "logged" count — for bad habits this = relapses
  const loggedCount = getCompletionCount(habit.id)
  const completedDays = getCompletedDays(habit.id)
  const { current: currentStreak, longest: longestStreak } = getStreak(habit.id)

  // For display: work out success-oriented numbers
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === (new Date().getMonth() + 1) && today.getFullYear() === new Date().getFullYear()
  const todayDay = isCurrentMonth ? today.getDate() : totalDays
  const pastDays = Math.max(0, todayDay - 1)

  let displayCount: number
  let displayTotal: number
  let displayRate: number

  if (isBad) {
    const relapseCount = loggedCount
    const cleanDays = pastDays - relapseCount
    displayCount = cleanDays >= 0 ? cleanDays : 0
    displayTotal = pastDays
    displayRate = pastDays > 0 ? Math.round((displayCount / pastDays) * 100) : 0
  } else {
    displayCount = loggedCount
    displayTotal = totalDays
    displayRate = totalDays > 0 ? Math.round((loggedCount / totalDays) * 100) : 0
  }

  const typeMeta = TYPE_META[habit.type] ?? TYPE_META.health
  const diffMeta = DIFFICULTY_META[habit.difficulty] ?? DIFFICULTY_META.medium
  const accentColor = isBad ? '#f87171' : (habit.color || typeMeta.color)
  const borderColor = isBad ? '#f87171' : accentColor

  const handleDelete = () => {
    if (window.confirm(`Delete habit "${habit.name}"? This cannot be undone.`)) {
      void deleteHabit(habit.id)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className="ui-card ui-card--glass relative overflow-hidden group"
      style={{
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      {/* Bad habit background tint */}
      {isBad && (
        <div className="absolute inset-0 bg-rose-500/[0.04] pointer-events-none" />
      )}

      {/* Top row: name + badges + actions */}
      <div className="flex items-start gap-3 mb-3">
        {/* Type icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: isBad ? 'rgba(239,68,68,0.12)' : typeMeta.bg }}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ color: isBad ? '#f87171' : typeMeta.color }}
          >
            {isBad ? 'trending_down' : typeMeta.icon}
          </span>
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-on-surface text-sm truncate">{habit.name}</h3>

            {/* Bad / Good badge */}
            {isBad ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-500/15 text-rose-400">
                🚫 Break it
              </span>
            ) : (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ color: typeMeta.color, background: typeMeta.bg }}
              >
                {typeMeta.label}
              </span>
            )}

            {/* Difficulty dots */}
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i < diffMeta.dots ? diffMeta.color : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </span>
          </div>

          {/* Motivation toggle */}
          {habit.motivation && (
            <button
              onClick={() => setIsMotivationOpen(v => !v)}
              className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors mt-0.5 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">
                {isMotivationOpen ? 'expand_less' : 'psychology'}
              </span>
              {isMotivationOpen ? 'Hide motivation' : 'Why?'}
            </button>
          )}
        </div>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* View detail */}
          <button
            onClick={() => onViewDetail(habit)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            title="View monthly calendar"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
          </button>
          <button
            onClick={() => onEdit(habit)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            title="Edit habit"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
            title="Delete habit"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>

      {/* Motivation text */}
      <AnimatePresence>
        {isMotivationOpen && habit.motivation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-[12px] text-on-surface-variant italic leading-relaxed mb-3 pl-11">
              "{habit.motivation}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble Grid */}
      <div className="mb-3 overflow-x-auto pb-1">
        <HabitBubbleGrid
          habitId={habit.id}
          totalDays={totalDays}
          isWeeklyView={isWeeklyView}
          weekOffset={weekOffset}
          isBadHabit={isBad}
          accentColor={isBad ? undefined : (habit.color || typeMeta.color)}
        />
      </div>

      {/* Bottom stats row */}
      <div className="flex items-center gap-4">
        {/* Progress bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant font-medium">
              {isBad
                ? `${loggedCount} relapse${loggedCount !== 1 ? 's' : ''} · ${displayCount} clean`
                : `${displayCount}/${displayTotal} days`}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: isBad
                ? (displayRate >= 70 ? '#4ade80' : '#f87171')
                : accentColor }}
            >
              {displayRate}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isBad
                  ? (displayRate >= 70
                    ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                    : 'linear-gradient(90deg, #f87171, #ef4444)')
                  : `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${displayRate}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Streaks */}
        {!isBad && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center">
              <p className="text-[11px] text-on-surface-variant">Current</p>
              <p className="text-sm font-black flex items-center gap-0.5" style={{ color: currentStreak >= 3 ? '#fb923c' : undefined }}>
                {currentStreak >= 3 && <span className="text-[14px]">🔥</span>}
                {currentStreak}
              </p>
            </div>
            <div className="w-px h-6 bg-outline-variant" />
            <div className="text-center">
              <p className="text-[11px] text-on-surface-variant">Best</p>
              <p className="text-sm font-black text-on-surface">{longestStreak}</p>
            </div>
          </div>
        )}

        {/* Bad habit: view detail button */}
        {isBad && (
          <button
            onClick={() => onViewDetail(habit)}
            className="text-[11px] flex items-center gap-1 text-on-surface-variant hover:text-rose-400 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            View
          </button>
        )}
      </div>
    </motion.div>
  )
}
