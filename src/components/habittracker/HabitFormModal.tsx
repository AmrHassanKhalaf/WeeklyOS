import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HabitCategory, HabitGroup, NewHabitData } from '../../store/useHabitStore'
import { useHabitStore } from '../../store/useHabitStore'
import type { Habit } from '../../store/useHabitStore'

// ─── Category options ─────────────────────────────────────────────────────────

interface CategoryOption {
  value: HabitCategory
  label: string
  icon: string
  emoji: string
  color: string
  bg: string
  description: string
  isBad: boolean
}

const CATEGORIES: CategoryOption[] = [
  {
    value: 'health',
    label: 'Health',
    icon: 'favorite',
    emoji: '🫀',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.12)',
    description: 'Exercise, sleep, nutrition…',
    isBad: false,
  },
  {
    value: 'learning',
    label: 'Learning',
    icon: 'school',
    emoji: '📚',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    description: 'Read, study, practice…',
    isBad: false,
  },
  {
    value: 'productivity',
    label: 'Productivity',
    icon: 'bolt',
    emoji: '⚡',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    description: 'Work, focus, planning…',
    isBad: false,
  },
  {
    value: 'spiritual',
    label: 'Spiritual',
    icon: 'self_improvement',
    emoji: '🧘',
    color: '#f9a8d4',
    bg: 'rgba(249,168,212,0.12)',
    description: 'Pray, meditate, reflect…',
    isBad: false,
  },
  {
    value: 'break_habit',
    label: 'Break Habit',
    icon: 'block',
    emoji: '🚫',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
    description: 'Quit something harmful',
    isBad: true,
  },
]

// ─── Group options ────────────────────────────────────────────────────────────

const GROUPS: { value: HabitGroup; label: string; icon: string }[] = [
  { value: 'morning', label: 'Morning', icon: 'wb_sunny'    },
  { value: 'anytime', label: 'Anytime', icon: 'schedule'    },
  { value: 'evening', label: 'Evening', icon: 'nights_stay' },
]

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  type: HabitCategory
  group_label: HabitGroup
  motivation: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'health',
  group_label: 'anytime',
  motivation: '',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HabitFormModalProps {
  isOpen: boolean
  editingHabit?: Habit | null
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HabitFormModal({ isOpen, editingHabit, onClose }: HabitFormModalProps) {
  const addHabit = useHabitStore(s => s.addHabit)
  const editHabit = useHabitStore(s => s.editHabit)
  const currentMonth = useHabitStore(s => s.currentMonth)
  const currentYear = useHabitStore(s => s.currentYear)

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingHabit) {
      setForm({
        name: editingHabit.name,
        type: editingHabit.type,
        group_label: editingHabit.group_label,
        motivation: editingHabit.motivation ?? '',
      })
    } else {
      setForm(DEFAULT_FORM)
    }
    setError(null)
  }, [editingHabit, isOpen])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const selectedCategory = CATEGORIES.find(c => c.value === form.type) ?? CATEGORIES[0]
  const isBreakHabit = form.type === 'break_habit'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Please enter a habit name.')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      if (editingHabit) {
        await editHabit(editingHabit.id, form)
      } else {
        const data: NewHabitData = { ...form, month: currentMonth, year: currentYear }
        await addHabit(data)
      }
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <form
              onSubmit={handleSubmit}
              className="pointer-events-auto w-full max-w-md glass-panel rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* ── Colour accent header ── */}
              <div
                className="px-6 pt-6 pb-4 transition-colors duration-300"
                style={{
                  background: isBreakHabit
                    ? 'linear-gradient(135deg, rgba(248,113,113,0.12), transparent)'
                    : `linear-gradient(135deg, ${selectedCategory.bg}, transparent)`,
                }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-xl transition-colors duration-300"
                      style={{ color: selectedCategory.color }}
                    >
                      {editingHabit ? 'edit' : 'add_circle'}
                    </span>
                    <h2 className="text-base font-bold text-on-surface">
                      {editingHabit ? 'Edit Habit' : 'New Habit'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
                {isBreakHabit && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[11px] text-rose-300/80 mt-1 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">info</span>
                    Every day you don't do it counts as a clean day ✓ — tapping marks a slip.
                  </motion.p>
                )}
              </div>

              <div className="px-6 pb-6 space-y-5">

                {/* ── Error ── */}
                {error && (
                  <p className="text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-2">
                    {error}
                  </p>
                )}

                {/* ── Category ── */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => set('type', cat.value)}
                        title={cat.description}
                        className={`flex flex-col items-center gap-1 rounded-xl p-2 border-2 transition-all text-[10px] font-bold ${
                          form.type === cat.value
                            ? 'scale-[1.05]'
                            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant'
                        }`}
                        style={
                          form.type === cat.value
                            ? { borderColor: cat.color, background: cat.bg, color: cat.color }
                            : {}
                        }
                      >
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="leading-tight text-center">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Name ── */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder={
                      isBreakHabit
                        ? 'e.g., Smoking, Doom scrolling, Late-night snacks…'
                        : 'e.g., Read 20 pages, Meditate 10 min…'
                    }
                    className="input-base"
                    autoFocus
                  />
                </div>

                {/* ── Time ── */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    When
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {GROUPS.map(g => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => set('group_label', g.value)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 border-2 transition-all text-sm font-semibold ${
                          form.group_label === g.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{g.icon}</span>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Reason ── */}
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    {isBreakHabit ? 'Why do you want to stop?' : 'Why are you building this?'}
                    {' '}<span className="normal-case text-outline font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.motivation}
                    onChange={e => set('motivation', e.target.value)}
                    placeholder={
                      isBreakHabit
                        ? 'Your reason to quit — keeps you accountable…'
                        : 'Your deeper reason — helps you stay committed…'
                    }
                    className="input-base resize-none"
                    rows={2}
                  />
                </div>

                {/* ── Actions ── */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !form.name.trim()}
                    className="btn flex-1 disabled:opacity-50 font-bold"
                    style={{
                      background: isBreakHabit
                        ? 'linear-gradient(135deg, #f87171, #ef4444)'
                        : `linear-gradient(135deg, ${selectedCategory.color}, ${selectedCategory.color}bb)`,
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </span>
                    ) : editingHabit ? 'Save Changes' : isBreakHabit ? 'Add to Break 🚫' : 'Add Habit ✓'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
