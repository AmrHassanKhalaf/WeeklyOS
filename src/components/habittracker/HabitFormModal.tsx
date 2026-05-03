import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Habit, HabitDifficulty, HabitGroup, HabitType, NewHabitData } from '../../store/useHabitStore'
import { useHabitStore } from '../../store/useHabitStore'

// ─── Options ──────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: HabitType; label: string; icon: string }[] = [
  { value: 'health',       label: 'Health',       icon: 'favorite'          },
  { value: 'learning',     label: 'Learning',     icon: 'school'            },
  { value: 'productivity', label: 'Productivity', icon: 'bolt'              },
  { value: 'spiritual',    label: 'Spiritual',    icon: 'self_improvement'  },
  { value: 'breaking_bad', label: 'Breaking Bad', icon: 'block'             },
]

const DIFFICULTY_OPTIONS: { value: HabitDifficulty; label: string; emoji: string }[] = [
  { value: 'easy',   label: 'Easy',   emoji: '🟢' },
  { value: 'medium', label: 'Medium', emoji: '🟡' },
  { value: 'hard',   label: 'Hard',   emoji: '🔴' },
]

const GROUP_OPTIONS: { value: HabitGroup; label: string; icon: string }[] = [
  { value: 'morning', label: 'Morning', icon: 'wb_sunny'  },
  { value: 'evening', label: 'Evening', icon: 'nights_stay' },
  { value: 'anytime', label: 'Anytime', icon: 'schedule'  },
]

const PRESET_COLORS = [
  '#4ade80', '#60a5fa', '#a78bfa', '#f9a8d4', '#fb923c',
  '#34d399', '#38bdf8', '#c084fc', '#fbbf24', '#f87171',
]

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string
  type: HabitType
  difficulty: HabitDifficulty
  group_label: HabitGroup
  motivation: string
  color: string
  is_bad_habit: boolean
}

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'health',
  difficulty: 'medium',
  group_label: 'anytime',
  motivation: '',
  color: '#4ade80',
  is_bad_habit: false,
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

  // Populate form when editing
  useEffect(() => {
    if (editingHabit) {
      setForm({
        name: editingHabit.name,
        type: editingHabit.type,
        difficulty: editingHabit.difficulty,
        group_label: editingHabit.group_label,
        motivation: editingHabit.motivation ?? '',
        color: editingHabit.color ?? '#4ade80',
        is_bad_habit: editingHabit.is_bad_habit ?? false,
      })
    } else {
      setForm(DEFAULT_FORM)
    }
    setError(null)
  }, [editingHabit, isOpen])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Habit name is required.')
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
              className="pointer-events-auto w-full max-w-lg glass-panel rounded-2xl p-6 space-y-5"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">
                    {editingHabit ? 'edit' : 'add_circle'}
                  </span>
                  <h2 className="text-lg font-bold text-on-surface">
                    {editingHabit ? 'Edit Habit' : 'Add New Habit'}
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

              {/* Error */}
              {error && (
                <p className="text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              {/* Good / Bad habit toggle */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Habit Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => set('is_bad_habit', false)}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border-2 transition-all font-semibold text-sm ${
                      !form.is_bad_habit
                        ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                        : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">trending_up</span>
                    <div className="text-left">
                      <p className="text-[13px] font-bold">Good Habit</p>
                      <p className="text-[10px] font-normal opacity-70">Build it ✓</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => set('is_bad_habit', true)}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border-2 transition-all font-semibold text-sm ${
                      form.is_bad_habit
                        ? 'border-rose-400 bg-rose-400/10 text-rose-400'
                        : 'border-outline-variant/30 bg-surface-container-low/50 text-on-surface-variant hover:border-outline-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">trending_down</span>
                    <div className="text-left">
                      <p className="text-[13px] font-bold">Bad Habit</p>
                      <p className="text-[10px] font-normal opacity-70">Break it ✗</p>
                    </div>
                  </button>
                </div>
                {form.is_bad_habit && (
                  <p className="text-[11px] text-rose-300/70 mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">info</span>
                    Tap a day to mark it as a relapse. Clean days = success.
                  </p>
                )}
                {!form.is_bad_habit && (
                  <p className="text-[11px] text-emerald-300/70 mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">info</span>
                    Tap a day to mark it as done. More done days = success.
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder={form.is_bad_habit ? 'e.g., Smoking, Social media scrolling...' : 'e.g., Read 20 pages, Meditate 10 min...'}
                  className="input-base"
                  autoFocus
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('type', opt.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2 border transition-all text-[11px] font-semibold ${
                        form.type === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant/40 bg-surface-container-low/60 text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty + Group (2 col) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Difficulty
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {DIFFICULTY_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('difficulty', opt.value)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-all text-sm ${
                          form.difficulty === opt.value
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-outline-variant/40 bg-surface-container-low/60 text-on-surface-variant hover:border-outline'
                        }`}
                      >
                        <span>{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Group
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {GROUP_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('group_label', opt.value)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-all text-sm ${
                          form.group_label === opt.value
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-outline-variant/40 bg-surface-container-low/60 text-on-surface-variant hover:border-outline'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('color', c)}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        background: c,
                        borderColor: form.color === c ? 'white' : 'transparent',
                        transform: form.color === c ? 'scale(1.15)' : undefined,
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => set('color', e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Motivation */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Why am I doing this? <span className="normal-case text-outline font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.motivation}
                  onChange={e => set('motivation', e.target.value)}
                  placeholder="Your deeper reason — helps you stay committed..."
                  className="input-base resize-none"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !form.name.trim()}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : editingHabit ? 'Save Changes' : 'Add Habit'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
