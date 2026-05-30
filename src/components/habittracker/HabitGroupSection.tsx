import { DynamicIcon } from '../ui/DynamicIcon';
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Habit } from '../../store/useHabitStore'
import { HabitCard } from './HabitCard'

interface HabitGroupSectionProps {
  groupLabel: 'morning' | 'evening' | 'anytime'
  habits: Habit[]
  totalDays: number
  isWeeklyView?: boolean
  weekOffset?: number
  onEdit: (habit: Habit) => void
  onViewDetail: (habit: Habit) => void
}

const GROUP_META = {
  morning: { label: 'Morning Habits',  icon: 'wb_sunny',     color: '#fbbf24' },
  evening: { label: 'Evening Habits',  icon: 'nights_stay',  color: '#818cf8' },
  anytime: { label: 'Daily Habits',    icon: 'schedule',     color: 'rgb(var(--color-primary))' },
}

export function HabitGroupSection({
  groupLabel,
  habits,
  totalDays,
  isWeeklyView,
  weekOffset,
  onEdit,
  onViewDetail,
}: HabitGroupSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const meta = GROUP_META[groupLabel]

  if (habits.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-2 w-full group"
      >
        <DynamicIcon name={meta.icon} className="w-[18px] h-[18px]" color={meta.color} strokeWidth={1.5} />
        <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="ml-1 text-[10px] text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
          {habits.length}
        </span>
        <div className="flex-1 h-px bg-outline-variant/30 ml-2" />
        <ChevronDown className="text-[16px] text-on-surface-variant transition-transform duration-200 group-hover:text-on-surface" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} strokeWidth={1.5} />
      </button>

      {/* Cards */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="space-y-3 pt-1">
              <AnimatePresence initial={false}>
                {habits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    totalDays={totalDays}
                    isWeeklyView={isWeeklyView}
                    weekOffset={weekOffset}
                    onEdit={onEdit}
                    onViewDetail={onViewDetail}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
