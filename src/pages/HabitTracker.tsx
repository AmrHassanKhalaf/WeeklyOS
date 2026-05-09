import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { useHabitStore, isBadHabit } from '../store/useHabitStore'
import type { Habit } from '../store/useHabitStore'
import { HabitGroupSection } from '../components/habittracker/HabitGroupSection'
import { HabitFormModal } from '../components/habittracker/HabitFormModal'
import { HabitDetailModal } from '../components/habittracker/HabitDetailModal'
import { HabitSummaryBar } from '../components/habittracker/HabitSummaryBar'
import { Skeleton } from '../components/ui/Skeleton'
import { FloatingActionButton } from '../components/ui/FloatingActionButton'
import { useLayoutStore } from '../store/useLayoutStore'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const getDaysInMonth = (m: number, y: number) => new Date(y, m, 0).getDate()

function EmptyHabits({ tab, onAdd }: { tab: 'build' | 'break'; onAdd: () => void }) {
  const isBuild = tab === 'build'
  const color = isBuild ? '#4ade80' : '#f87171'
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <span className="material-symbols-outlined text-4xl" style={{ color }}>{isBuild ? 'add_task' : 'do_not_disturb_on'}</span>
      </div>
      <div>
        <h3 className="text-lg font-bold text-on-surface mb-1">{isBuild ? 'No build habits yet' : 'No break habits yet'}</h3>
        <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
          {isBuild ? 'Add a positive habit. Consistency beats intensity.' : 'Track a habit you want to quit. Every clean day is a win.'}
        </p>
      </div>
      <button onClick={onAdd} className="btn btn-sm font-semibold" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
        <span className="material-symbols-outlined text-base">add</span>
        {isBuild ? 'Add Build Habit' : 'Add Break Habit'}
      </button>
    </motion.div>
  )
}

export function HabitTracker() {
  const { habits, currentMonth, currentYear, viewMode, isLoading, error, loadData, goToPrevMonth, goToNextMonth, setViewMode } = useHabitStore()
  const { isMobile } = useLayoutStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeTab, setActiveTab] = useState<'build' | 'break'>('build')

  useEffect(() => { void loadData() }, [loadData, currentMonth, currentYear])

  const totalDays = getDaysInMonth(currentMonth, currentYear)
  const maxWeekOffset = Math.floor((totalDays - 1) / 7)

  const buildHabits = habits.filter(h => !isBadHabit(h))
  const breakHabits = habits.filter(h => isBadHabit(h))
  const activeHabits = activeTab === 'build' ? buildHabits : breakHabits
  const morningHabits = activeHabits.filter(h => h.group_label === 'morning')
  const eveningHabits = activeHabits.filter(h => h.group_label === 'evening')
  const anytimeHabits = activeHabits.filter(h => h.group_label === 'anytime')

  const handleOpenAdd = () => { setEditingHabit(null); setIsModalOpen(true) }
  const handleEdit = (h: Habit) => { setEditingHabit(h); setIsModalOpen(true) }
  const handleCloseModal = () => { setIsModalOpen(false); setEditingHabit(null) }

  const todayMonth = new Date().getMonth() + 1
  const todayYear = new Date().getFullYear()
  const isCurrentMonth = currentMonth === todayMonth && currentYear === todayYear
  const isNextMonth = new Date(currentYear, currentMonth, 1) > new Date(todayYear, todayMonth, 1)

  const tabBtn = (tab: 'build' | 'break') => {
    const active = activeTab === tab
    const isBuild = tab === 'build'
    const color = isBuild ? '#4ade80' : '#f87171'
    const count = isBuild ? buildHabits.length : breakHabits.length
    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
        style={{
          background: active ? `${color}18` : 'transparent',
          color: active ? color : 'rgb(var(--color-on-surface-variant))',
          border: active ? `1.5px solid ${color}30` : '1.5px solid transparent',
        }}
      >
        <span className="material-symbols-outlined text-[18px]">{isBuild ? 'check_circle' : 'block'}</span>
        {isBuild ? 'Build Habits' : 'Break Habits'}
        {count > 0 && (
          <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center"
            style={{ background: active ? color : 'rgba(255,255,255,0.08)', color: active ? '#0a0a0a' : 'rgba(255,255,255,0.5)' }}>
            {count}
          </span>
        )}
        {active && <motion.span layoutId="tab-line" className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: color }} />}
      </button>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 pb-16 space-y-6">

        {/* Header */}
        <section className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-2xl">local_fire_department</span>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Habit Tracker</h1>
            </div>
            <p className="text-sm text-on-surface-variant">Build consistency, break patterns, and track your month.</p>
          </div>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <span className="material-symbols-outlined text-lg">add</span>Add Habit
          </button>
        </section>

        {/* Month nav + controls */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={goToPrevMonth} className="w-9 h-9 rounded-xl btn btn-ghost flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <div className="text-center min-w-[9rem]">
              <p className="text-lg font-extrabold text-on-surface">{MONTH_NAMES[currentMonth - 1]}</p>
              <p className="text-[11px] text-on-surface-variant font-semibold">{currentYear}</p>
            </div>
            <button onClick={goToNextMonth} disabled={isNextMonth} className="w-9 h-9 rounded-xl btn btn-ghost flex items-center justify-center disabled:opacity-30">
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
            {!isCurrentMonth && (
              <button onClick={() => useHabitStore.getState().setMonth(todayMonth, todayYear)} className="btn btn-sm btn-secondary text-xs">Today</button>
            )}
          </div>
          <div className="flex items-center bg-surface-container-low/60 border border-outline-variant/30 rounded-xl p-0.5 gap-0.5">
            {(['monthly', 'weekly'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${viewMode === mode ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {mode}
              </button>
            ))}
          </div>
        </section>

        {/* Tabs */}
        {habits.length > 0 && (
          <div className="flex items-center gap-1 border-b border-outline-variant/20">
            {tabBtn('build')}
            {tabBtn('break')}
          </div>
        )}

        {/* Week nav */}
        <AnimatePresence>
          {viewMode === 'weekly' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3">
              <button onClick={() => setWeekOffset(v => Math.max(0, v - 1))} disabled={weekOffset === 0} className="btn btn-ghost btn-sm disabled:opacity-30">
                <span className="material-symbols-outlined text-lg">chevron_left</span>Prev Week
              </button>
              <span className="text-sm font-semibold text-on-surface-variant flex-1 text-center">
                Days {weekOffset * 7 + 1}–{Math.min((weekOffset + 1) * 7, totalDays)}
              </span>
              <button onClick={() => setWeekOffset(v => Math.min(maxWeekOffset, v + 1))} disabled={weekOffset >= maxWeekOffset} className="btn btn-ghost btn-sm disabled:opacity-30">
                Next Week<span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day numbers */}
        {viewMode === 'monthly' && habits.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 px-0.5">
            <div className="w-0 shrink-0" />
            {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
              const date = new Date(currentYear, currentMonth - 1, day)
              const isWeekend = date.getDay() === 0 || date.getDay() === 6
              const isToday = isCurrentMonth && day === new Date().getDate()
              return (
                <div key={day} className="flex flex-col items-center shrink-0" style={{ width: '1.45rem' }}>
                  <span className={`text-[9px] font-semibold ${isToday ? 'text-primary font-black' : isWeekend ? 'text-on-surface-variant/70' : 'text-on-surface-variant/50'}`}>{day}</span>
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-error/10 border border-error/20 rounded-xl px-5 py-3">
            <span className="material-symbols-outlined text-error text-xl shrink-0">error</span>
            <p className="text-sm text-error flex-1">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            {habits.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl">local_fire_department</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface mb-2">No habits yet this month</h3>
                  <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">Start small — consistency beats intensity.</p>
                </div>
                <button onClick={handleOpenAdd} className="btn btn-primary btn-lg">
                  <span className="material-symbols-outlined text-lg">add</span>Add Your First Habit
                </button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  {activeHabits.length === 0 ? (
                    <EmptyHabits tab={activeTab} onAdd={handleOpenAdd} />
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <HabitGroupSection key="morning" groupLabel="morning" habits={morningHabits} totalDays={totalDays} isWeeklyView={viewMode === 'weekly'} weekOffset={weekOffset} onEdit={handleEdit} onViewDetail={h => setDetailHabit(h)} />
                      <HabitGroupSection key="anytime" groupLabel="anytime" habits={anytimeHabits} totalDays={totalDays} isWeeklyView={viewMode === 'weekly'} weekOffset={weekOffset} onEdit={handleEdit} onViewDetail={h => setDetailHabit(h)} />
                      <HabitGroupSection key="evening" groupLabel="evening" habits={eveningHabits} totalDays={totalDays} isWeeklyView={viewMode === 'weekly'} weekOffset={weekOffset} onEdit={handleEdit} onViewDetail={h => setDetailHabit(h)} />
                    </AnimatePresence>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {habits.length > 0 && (
              <div className="border-t border-outline-variant/20 pt-6">
                <HabitSummaryBar totalDays={totalDays} activeTab={activeTab} />
              </div>
            )}
          </>
        )}
      </div>

      <HabitFormModal isOpen={isModalOpen} editingHabit={editingHabit} onClose={handleCloseModal} />
      <HabitDetailModal habit={detailHabit} totalDays={totalDays} onClose={() => setDetailHabit(null)} />

      {/* Mobile FAB for quick habit add */}
      {isMobile && (
        <FloatingActionButton
          label="Add habit"
          icon={<span className="material-symbols-outlined">add</span>}
          onClick={handleOpenAdd}
          show={!isModalOpen && !detailHabit}
        />
      )}
    </AppLayout>
  )
}
