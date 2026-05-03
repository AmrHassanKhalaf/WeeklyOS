import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit } from '../../store/useHabitStore'
import { useHabitStore, isBadHabit } from '../../store/useHabitStore'
import { HabitBubbleGrid } from './HabitBubbleGrid'

// ─── Category metadata ────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  health:       { label: 'Health',       icon: 'favorite',         color: '#4ade80', bg: 'rgba(74,222,128,0.12)'  },
  learning:     { label: 'Learning',     icon: 'school',           color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  productivity: { label: 'Productivity', icon: 'bolt',             color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  spiritual:    { label: 'Spiritual',    icon: 'self_improvement', color: '#f9a8d4', bg: 'rgba(249,168,212,0.12)' },
  break_habit:  { label: 'Break Habit', icon: 'block',            color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  // legacy alias
  breaking_bad: { label: 'Break Habit', icon: 'block',            color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
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
  const getStreak = useHabitStore(s => s.getStreak)

  const isBad = isBadHabit(habit)
  const loggedCount = getCompletionCount(habit.id)
  const { current: currentStreak, longest: longestStreak } = getStreak(habit.id)

  // Compute display stats
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === (today.getMonth() + 1) && today.getFullYear() === today.getFullYear()
  const todayDay = isCurrentMonth ? today.getDate() : totalDays
  const pastDays = Math.max(0, todayDay - 1)

  let displayRate: number
  let displayLabel: string

  if (isBad) {
    const cleanDays = Math.max(0, pastDays - loggedCount)
    displayRate = pastDays > 0 ? Math.round((cleanDays / pastDays) * 100) : 100
    displayLabel = `${loggedCount} slip${loggedCount !== 1 ? 's' : ''} · ${cleanDays} clean`
  } else {
    displayRate = totalDays > 0 ? Math.round((loggedCount / totalDays) * 100) : 0
    displayLabel = `${loggedCount} / ${totalDays} days`
  }

  const cat = CAT_META[habit.type] ?? CAT_META.health
  const accentColor = isBad ? '#f87171' : (habit.color && habit.color !== '#f87171' ? habit.color : cat.color)

  const handleDelete = () => {
    if (window.confirm(`Delete "${habit.name}"? This cannot be undone.`)) {
      void deleteHabit(habit.id)
    }
  }

  // Streak / clean streak label
  const streakIcon = isBad ? '🧊' : '🔥'
  const streakLabel = isBad ? 'Clean streak' : 'Streak'
  const streakValue = currentStreak

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className="ui-card ui-card--glass relative overflow-hidden group"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Subtle tint for break habits */}
      {isBad && <div className="absolute inset-0 bg-rose-500/[0.04] pointer-events-none" />}

      {/* ── Top row ── */}
      <div className="flex items-start gap-3 mb-3">
        {/* Category icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: isBad ? 'rgba(248,113,113,0.14)' : cat.bg }}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ color: accentColor }}
          >
            {cat.icon}
          </span>
        </div>

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-on-surface text-sm truncate">{habit.name}</h3>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
              style={{ color: accentColor, background: isBad ? 'rgba(248,113,113,0.12)' : cat.bg }}
            >
              {isBad ? '🚫 Break it' : cat.label}
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
              {isMotivationOpen ? 'Hide reason' : 'Why?'}
            </button>
          )}
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onViewDetail(habit)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            title="View full month"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
          </button>
          <button
            onClick={() => onEdit(habit)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            title="Edit"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>

      {/* Motivation */}
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

      {/* ── Bubble Grid ── */}
      <div className="mb-3 overflow-x-auto pb-1">
        <HabitBubbleGrid
          habitId={habit.id}
          totalDays={totalDays}
          isWeeklyView={isWeeklyView}
          weekOffset={weekOffset}
          accentColor={accentColor}
        />
      </div>

      {/* ── Bottom stats ── */}
      <div className="flex items-center gap-4">
        {/* Progress bar + label */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant font-medium">{displayLabel}</span>
            <span
              className="text-[11px] font-bold"
              style={{
                color: isBad
                  ? (displayRate >= 70 ? '#4ade80' : '#f87171')
                  : accentColor,
              }}
            >
              {displayRate}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isBad
                  ? displayRate >= 70
                    ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                    : 'linear-gradient(90deg, #f87171, #ef4444)'
                  : `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${displayRate}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center">
            <p className="text-[10px] text-on-surface-variant">{streakLabel}</p>
            <p className="text-sm font-black flex items-center gap-0.5"
              style={{ color: streakValue >= 3 ? (isBad ? '#60a5fa' : '#fb923c') : undefined }}>
              {streakValue >= 3 && <span className="text-[14px]">{streakIcon}</span>}
              {streakValue}
            </p>
          </div>
          {!isBad && (
            <>
              <div className="w-px h-6 bg-outline-variant" />
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant">Best</p>
                <p className="text-sm font-black text-on-surface">{longestStreak}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
