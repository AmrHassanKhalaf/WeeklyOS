import { DynamicIcon } from '../ui/DynamicIcon';
import { useCallback, useState } from 'react'
import { Calendar, Edit3, Trash2, Ban, ChevronUp, Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit } from '../../store/useHabitStore'
import { useHabitStore, isBadHabit } from '../../store/useHabitStore'
import { HabitBubbleGrid } from './HabitBubbleGrid'
import { ConfettiBurst } from '../ui/Confetti'

// ─── Category metadata ────────────────────────────────────────────────────────

const CAT_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  health:       { label: 'Health',       icon: 'favorite',         color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  },
  learning:     { label: 'Learning',     icon: 'school',           color: '#60a5fa', bg: 'rgba(96,165,250,0.10)'  },
  productivity: { label: 'Productivity', icon: 'bolt',             color: '#a78bfa', bg: 'rgba(167,139,250,0.10)' },
  spiritual:    { label: 'Spiritual',    icon: 'self_improvement', color: '#f9a8d4', bg: 'rgba(249,168,212,0.10)' },
  break_habit:  { label: 'Break',        icon: 'block',            color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
  breaking_bad: { label: 'Break',        icon: 'block',            color: '#f87171', bg: 'rgba(248,113,113,0.10)' },
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

// ─── Shared action buttons (top-right hover) ──────────────────────────────────

function CardActions({ habit, onEdit, onViewDetail, onDelete }: {
  habit: Habit
  onEdit: (h: Habit) => void
  onViewDetail: (h: Habit) => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
      <button onClick={() => onViewDetail(habit)} className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" title="Full month view">
        <Calendar className="text-[16px]" strokeWidth={1.5} />
      </button>
      <button onClick={() => onEdit(habit)} className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" title="Edit">
        <Edit3 className="text-[16px]" strokeWidth={1.5} />
      </button>
      <button onClick={onDelete} className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors" title="Delete">
        <Trash2 className="text-[16px]" strokeWidth={1.5} />
      </button>
    </div>
  )
}

// ─── BUILD Habit Card ─────────────────────────────────────────────────────────

function BuildHabitCard({ habit, totalDays, isWeeklyView, weekOffset, onEdit, onViewDetail, onDelete }: {
  habit: Habit; totalDays: number; isWeeklyView?: boolean; weekOffset?: number
  onEdit: (h: Habit) => void; onViewDetail: (h: Habit) => void; onDelete: () => void
}) {
  const [showReason, setShowReason] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [shaking, setShaking] = useState(false)
  const getCompletionCount = useHabitStore(s => s.getCompletionCount)
  const getStreak          = useHabitStore(s => s.getStreak)

  const cat     = CAT_META[habit.type] ?? CAT_META.health
  const color   = habit.color && habit.color !== '#f87171' ? habit.color : cat.color
  const done    = getCompletionCount(habit.id)
  const rate    = totalDays > 0 ? Math.round((done / totalDays) * 100) : 0
  const { current: streak, longest } = getStreak(habit.id)

  const handleCelebrate = useCallback(() => {
    setCelebrate(true)
    window.setTimeout(() => setCelebrate(false), 1200)
  }, [])
  const handleNegative = useCallback(() => {
    setShaking(true)
    window.setTimeout(() => setShaking(false), 420)
  }, [])

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      className={`ui-card ui-card--glass glass-hover relative overflow-hidden group ${shaking ? 'animate-shake' : ''}`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cat.bg }}>
          <DynamicIcon name={cat.icon} className="w-[18px] h-[18px]" color={color} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-on-surface text-sm truncate">{habit.name}</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
              style={{ color, background: cat.bg }}>
              {cat.label}
            </span>
          </div>
          {habit.motivation && (
            <button onClick={() => setShowReason(v => !v)}
              className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors mt-1 sm:mt-0.5 py-1.5 sm:py-0 flex items-center gap-1 touch-target sm:min-h-0 sm:min-w-0">
              {showReason ? <ChevronUp className="w-[12px] h-[12px]" strokeWidth={1.5} /> : <Brain className="w-[12px] h-[12px]" strokeWidth={1.5} />}
              {showReason ? 'Hide' : 'Why?'}
            </button>
          )}
        </div>
        <CardActions habit={habit} onEdit={onEdit} onViewDetail={onViewDetail} onDelete={onDelete} />
      </div>

      {/* Reason */}
      <AnimatePresence>
        {showReason && habit.motivation && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="text-[12px] text-on-surface-variant italic leading-relaxed mb-3 pl-11 overflow-hidden">
            "{habit.motivation}"
          </motion.p>
        )}
      </AnimatePresence>

      {/* Bubble grid */}
      <div className="mb-3 overflow-x-auto pb-1">
        <HabitBubbleGrid
          habitId={habit.id}
          totalDays={totalDays}
          isWeeklyView={isWeeklyView}
          weekOffset={weekOffset}
          accentColor={color}
          onCelebrate={handleCelebrate}
          onNegative={handleNegative}
        />
      </div>

      {/* Stats — BUILD ONLY: completion rate + streak */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant">{done} / {totalDays} days completed</span>
            <span className="text-[11px] font-bold" style={{ color }}>{rate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}99)`, boxShadow: `0 0 8px ${color}55` }}
              initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-center">
          <div>
            <p className="text-[10px] text-on-surface-variant">Streak</p>
            <motion.p
              key={streak}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 320 }}
              className="text-sm font-black flex items-center gap-0.5"
              style={{ color: streak >= 3 ? '#fb923c' : undefined }}
            >
              {streak >= 3 && <span className="text-[14px]">🔥</span>}{streak}
            </motion.p>
          </div>
          <div className="w-px h-6 bg-outline-variant" />
          <div>
            <p className="text-[10px] text-on-surface-variant">Best</p>
            <p className="text-sm font-black text-on-surface">{longest}</p>
          </div>
        </div>
      </div>

      {/* Celebration confetti burst */}
      <ConfettiBurst show={celebrate} count={16} colors={[color, '#fbbf24', '#60a5fa', '#f472b6']} />
    </motion.div>
  )
}

// ─── BREAK Habit Card ─────────────────────────────────────────────────────────

function BreakHabitCard({ habit, totalDays, isWeeklyView, weekOffset, onEdit, onViewDetail, onDelete }: {
  habit: Habit; totalDays: number; isWeeklyView?: boolean; weekOffset?: number
  onEdit: (h: Habit) => void; onViewDetail: (h: Habit) => void; onDelete: () => void
}) {
  const [showReason, setShowReason] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [shaking, setShaking] = useState(false)
  const getCompletionCount = useHabitStore(s => s.getCompletionCount)
  const getStreak          = useHabitStore(s => s.getStreak)
  const getBreakHabitCleanRate = useHabitStore(s => s.getBreakHabitCleanRate)

  const handleCelebrate = useCallback(() => {
    setCelebrate(true)
    window.setTimeout(() => setCelebrate(false), 1200)
  }, [])
  const handleNegative = useCallback(() => {
    setShaking(true)
    window.setTimeout(() => setShaking(false), 420)
  }, [])

  const slips     = getCompletionCount(habit.id)
  const cleanRate = getBreakHabitCleanRate(habit.id)
  const { current: cleanStreak } = getStreak(habit.id)

  // pastDays for clean count
  const today = new Date()
  const isCurrentMonth = today.getMonth() + 1 === (new Date().getMonth() + 1) && today.getFullYear() === today.getFullYear()
  const todayDay  = isCurrentMonth ? today.getDate() : totalDays
  const pastDays  = Math.max(0, todayDay - 1)
  const cleanDays = Math.max(0, pastDays - slips)

  const isStrong = cleanRate >= 70
  const color = '#f87171'
  const progressColor = isStrong ? '#4ade80' : '#f87171'

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      className={`ui-card ui-card--glass glass-hover relative overflow-hidden group ${shaking ? 'animate-shake' : ''}`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="absolute inset-0 bg-rose-500/[0.03] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(248,113,113,0.12)' }}>
          <Ban className="text-[18px]" style={{ color }} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-on-surface text-sm truncate">{habit.name}</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
              style={{ color, background: 'rgba(248,113,113,0.12)' }}>
              Break it
            </span>
          </div>
          {habit.motivation && (
            <button onClick={() => setShowReason(v => !v)}
              className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors mt-1 sm:mt-0.5 py-1.5 sm:py-0 flex items-center gap-1 touch-target sm:min-h-0 sm:min-w-0">
              {showReason ? <ChevronUp className="w-[12px] h-[12px]" strokeWidth={1.5} /> : <Brain className="w-[12px] h-[12px]" strokeWidth={1.5} />}
              {showReason ? 'Hide' : 'Why quit?'}
            </button>
          )}
        </div>
        <CardActions habit={habit} onEdit={onEdit} onViewDetail={onViewDetail} onDelete={onDelete} />
      </div>

      {/* Reason */}
      <AnimatePresence>
        {showReason && habit.motivation && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="text-[12px] text-on-surface-variant italic leading-relaxed mb-3 pl-11 overflow-hidden">
            "{habit.motivation}"
          </motion.p>
        )}
      </AnimatePresence>

      {/* Bubble grid */}
      <div className="mb-3 overflow-x-auto pb-1">
        <HabitBubbleGrid
          habitId={habit.id}
          totalDays={totalDays}
          isWeeklyView={isWeeklyView}
          weekOffset={weekOffset}
          accentColor={color}
          onCelebrate={handleCelebrate}
          onNegative={handleNegative}
        />
      </div>

      {/* Stats — BREAK ONLY: slips + clean days + clean streak */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-on-surface-variant">
              {slips} slip{slips !== 1 ? 's' : ''} · {cleanDays} clean day{cleanDays !== 1 ? 's' : ''}
            </span>
            <span className="text-[11px] font-bold" style={{ color: progressColor }}>{cleanRate}% clean</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: isStrong ? 'linear-gradient(90deg,#4ade80,#22c55e)' : 'linear-gradient(90deg,#f87171,#ef4444)' }}
              initial={{ width: 0 }} animate={{ width: `${cleanRate}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
          </div>
        </div>
        <div className="text-center shrink-0">
          <p className="text-[10px] text-on-surface-variant">Clean streak</p>
          <motion.p
            key={cleanStreak}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 16, stiffness: 320 }}
            className="text-sm font-black flex items-center gap-0.5"
            style={{ color: cleanStreak >= 3 ? '#60a5fa' : undefined }}
          >
            {cleanStreak >= 3 && <span className="text-[14px]">🧊</span>}{cleanStreak}
          </motion.p>
        </div>
      </div>

      {/* Clean-day celebration (slip cleared) */}
      <ConfettiBurst show={celebrate} count={14} colors={['#4ade80', '#60a5fa', '#fbbf24']} />
    </motion.div>
  )
}

// ─── Exported HabitCard router ────────────────────────────────────────────────

export function HabitCard({ habit, totalDays, isWeeklyView, weekOffset, onEdit, onViewDetail }: HabitCardProps) {
  const deleteHabit = useHabitStore(s => s.deleteHabit)
  const handleDelete = () => {
    if (window.confirm(`Delete "${habit.name}"? This cannot be undone.`)) void deleteHabit(habit.id)
  }
  const shared = { habit, totalDays, isWeeklyView, weekOffset, onEdit, onViewDetail, onDelete: handleDelete }
  return isBadHabit(habit) ? <BreakHabitCard {...shared} /> : <BuildHabitCard {...shared} />
}
