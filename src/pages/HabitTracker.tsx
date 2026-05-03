import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { useHabitStore } from '../store/useHabitStore'
import type { Habit } from '../store/useHabitStore'
import { HabitGroupSection } from '../components/habittracker/HabitGroupSection'
import { HabitFormModal } from '../components/habittracker/HabitFormModal'
import { HabitSummaryBar } from '../components/habittracker/HabitSummaryBar'
import { HabitAnalyticsPanel } from '../components/habittracker/HabitAnalyticsPanel'

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center gap-5"
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl">local_fire_department</span>
      </div>
      <div>
        <h3 className="text-xl font-bold text-on-surface mb-2">No habits yet this month</h3>
        <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
          Build momentum by adding your first habit. Start small — consistency beats intensity.
        </p>
      </div>
      <button onClick={onAdd} className="btn btn-primary btn-lg">
        <span className="material-symbols-outlined text-lg">add</span>
        Add Your First Habit
      </button>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function HabitTracker() {
  const {
    habits,
    currentMonth,
    currentYear,
    viewMode,
    isLoading,
    error,
    loadData,
    goToPrevMonth,
    goToNextMonth,
    setViewMode,
  } = useHabitStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  // Load on mount and when month changes
  useEffect(() => {
    void loadData()
  }, [loadData, currentMonth, currentYear])

  const totalDays = getDaysInMonth(currentMonth, currentYear)
  const maxWeekOffset = Math.floor((totalDays - 1) / 7)

  // Group habits
  const morningHabits = habits.filter(h => h.group_label === 'morning')
  const eveningHabits = habits.filter(h => h.group_label === 'evening')
  const anytimeHabits = habits.filter(h => h.group_label === 'anytime')

  const handleOpenAdd = () => {
    setEditingHabit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingHabit(null)
  }

  const todayMonth = new Date().getMonth() + 1
  const todayYear = new Date().getFullYear()
  const isCurrentMonth = currentMonth === todayMonth && currentYear === todayYear
  const isNextMonth = new Date(currentYear, currentMonth, 1) > new Date(todayYear, todayMonth, 1)

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 pb-16 space-y-8">

        {/* ── Page Header ── */}
        <section className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-2xl">local_fire_department</span>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Habit Tracker</h1>
            </div>
            <p className="text-sm text-on-surface-variant">
              Build consistency, break patterns, and track your month.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Habit
          </button>
        </section>

        {/* ── Month Navigator + Controls ── */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          {/* Month nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevMonth}
              className="w-9 h-9 rounded-xl btn btn-ghost flex items-center justify-center"
              title="Previous month"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>

            <div className="text-center min-w-[9rem]">
              <p className="text-lg font-extrabold text-on-surface">
                {MONTH_NAMES[currentMonth - 1]}
              </p>
              <p className="text-[11px] text-on-surface-variant font-semibold">{currentYear}</p>
            </div>

            <button
              onClick={goToNextMonth}
              disabled={isNextMonth}
              className="w-9 h-9 rounded-xl btn btn-ghost flex items-center justify-center disabled:opacity-30"
              title="Next month"
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>

            {!isCurrentMonth && (
              <button
                onClick={() => useHabitStore.getState().setMonth(todayMonth, todayYear)}
                className="btn btn-sm btn-secondary text-xs"
              >
                Today
              </button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-surface-container-low/60 border border-outline-variant/30 rounded-xl p-0.5 gap-0.5">
              {(['monthly', 'weekly'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    viewMode === mode
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Analytics toggle */}
            <button
              onClick={() => setShowAnalytics(v => !v)}
              className={`btn btn-sm ${showAnalytics ? 'btn-primary' : 'btn-ghost'}`}
              title="Toggle analytics"
            >
              <span className="material-symbols-outlined text-[18px]">insights</span>
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </section>

        {/* ── Week Navigation (weekly view) ── */}
        <AnimatePresence>
          {viewMode === 'weekly' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => setWeekOffset(v => Math.max(0, v - 1))}
                disabled={weekOffset === 0}
                className="btn btn-ghost btn-sm disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
                Prev Week
              </button>
              <span className="text-sm font-semibold text-on-surface-variant flex-1 text-center">
                Days {weekOffset * 7 + 1}–{Math.min((weekOffset + 1) * 7, totalDays)}
              </span>
              <button
                onClick={() => setWeekOffset(v => Math.min(maxWeekOffset, v + 1))}
                disabled={weekOffset >= maxWeekOffset}
                className="btn btn-ghost btn-sm disabled:opacity-30"
              >
                Next Week
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Day Numbers Row (monthly view) ── */}
        {viewMode === 'monthly' && habits.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 px-0.5">
            <div className="w-0 shrink-0" />
            {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
              const date = new Date(currentYear, currentMonth - 1, day)
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const isToday = isCurrentMonth && day === new Date().getDate()
              return (
                <div
                  key={day}
                  className="flex flex-col items-center shrink-0"
                  style={{ width: '1.45rem' }}
                >
                  <span
                    className={`text-[9px] font-semibold ${
                      isToday
                        ? 'text-primary font-black'
                        : isWeekend
                        ? 'text-on-surface-variant/70'
                        : 'text-on-surface-variant/50'
                    }`}
                  >
                    {day}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-error/10 border border-error/20 rounded-xl px-5 py-3">
            <span className="material-symbols-outlined text-error text-xl shrink-0">error</span>
            <p className="text-sm text-error flex-1">{error}</p>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-surface-container-low animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {!isLoading && (
          <>
            {habits.length === 0 ? (
              <EmptyState onAdd={handleOpenAdd} />
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  <HabitGroupSection
                    key="morning"
                    groupLabel="morning"
                    habits={morningHabits}
                    totalDays={totalDays}
                    isWeeklyView={viewMode === 'weekly'}
                    weekOffset={weekOffset}
                    onEdit={handleEdit}
                  />
                  <HabitGroupSection
                    key="anytime"
                    groupLabel="anytime"
                    habits={anytimeHabits}
                    totalDays={totalDays}
                    isWeeklyView={viewMode === 'weekly'}
                    weekOffset={weekOffset}
                    onEdit={handleEdit}
                  />
                  <HabitGroupSection
                    key="evening"
                    groupLabel="evening"
                    habits={eveningHabits}
                    totalDays={totalDays}
                    isWeeklyView={viewMode === 'weekly'}
                    weekOffset={weekOffset}
                    onEdit={handleEdit}
                  />
                </AnimatePresence>
              </div>
            )}

            {/* Analytics Panel */}
            <AnimatePresence>
              {showAnalytics && habits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                >
                  <HabitAnalyticsPanel totalDays={totalDays} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Monthly Summary */}
            {habits.length > 0 && (
              <div className="border-t border-outline-variant/20 pt-6">
                <HabitSummaryBar totalDays={totalDays} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal ── */}
      <HabitFormModal
        isOpen={isModalOpen}
        editingHabit={editingHabit}
        onClose={handleCloseModal}
      />
    </AppLayout>
  )
}
