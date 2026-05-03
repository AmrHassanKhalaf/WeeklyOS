import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit } from '../../store/useHabitStore'
import { useHabitStore } from '../../store/useHabitStore'
import { HabitBubbleGrid } from './HabitBubbleGrid'

// ─── Color helpers ────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  health:        { label: 'Health',        icon: 'favorite',      color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  learning:      { label: 'Learning',      icon: 'school',        color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  productivity:  { label: 'Productivity',  icon: 'bolt',          color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  spiritual:     { label: 'Spiritual',     icon: 'self_improvement', color: '#f9a8d4', bg: 'rgba(249,168,212,0.12)' },
  breaking_bad:  { label: 'Breaking Bad',  icon: 'block',         color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HabitCard({ habit, totalDays, isWeeklyView, weekOffset, onEdit }: HabitCardProps) {
  const [isMotivationOpen, setIsMotivationOpen] = useState(false)
  const deleteHabit = useHabitStore(s => s.deleteHabit)
  const getCompletionCount = useHabitStore(s => s.getCompletionCount)
  const getCompletionRate = useHabitStore(s => s.getCompletionRate)
  const getStreak = useHabitStore(s => s.getStreak)

  const count = getCompletionCount(habit.id)
  const rate = getCompletionRate(habit.id, totalDays)
  const { current: currentStreak, longest: longestStreak } = getStreak(habit.id)

  const typeMeta = TYPE_META[habit.type] ?? TYPE_META.health
  const diffMeta = DIFFICULTY_META[habit.difficulty] ?? DIFFICULTY_META.medium
  const accentColor = habit.color || typeMeta.color

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
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Top row: name + badges + actions */}
      <div className="flex items-start gap-3 mb-3">
        {/* Type icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: typeMeta.bg }}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ color: typeMeta.color }}
          >
            {typeMeta.icon}
          </span>
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-on-surface text-sm truncate">{habit.name}</h3>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ color: typeMeta.color, background: typeMeta.bg }}
            >
              {typeMeta.label}
            </span>
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
        />
      </div>

      {/* Bottom stats row */}
      <div className="flex items-center gap-4">
        {/* Progress bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant font-medium">
              {count}/{totalDays} days
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: accentColor }}
            >
              {rate}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)` }}
              initial={{ width: 0 }}
              animate={{ width: `${rate}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Streaks */}
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
      </div>
    </motion.div>
  )
}
