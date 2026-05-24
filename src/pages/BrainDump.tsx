import { useState, useEffect } from 'react'
import { Brain, Sparkles, Send, PlusCircle, Tag, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { TaskCard } from '../components/TaskCard'
import { useBrainDumpStore } from '../store/useBrainDumpStore'
import { useWeekStore } from '../store/useWeekStore'
import { Button } from '../components/ui/Button'
import { cn } from '../lib/cn'

export function BrainDump() {
  const { brainDumpItems, isLoading, loadItems, addItem, updateItem, deleteSelected } = useBrainDumpStore()
  const currentWeek = useWeekStore(s => s.currentWeek)

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const [inputValue, setInputValue] = useState('')
  const [isStructuring, setIsStructuring] = useState(false)
  const [quickInput, setQuickInput] = useState('')
  const [showQuickInput, setShowQuickInput] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const navigate = useNavigate()
  const selectedCount = brainDumpItems.filter(i => i.selected).length

  const handleStructure = async () => {
    setIsStructuring(true)
    const lines = inputValue.split('\n').filter(l => l.trim())
    for (const line of lines) {
      await addItem(line.trim())
    }
    setInputValue('')
    setIsStructuring(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleStructure()
    }
  }

  const handleQuickAdd = async () => {
    if (quickInput.trim()) await addItem(quickInput.trim())
    setQuickInput('')
    setShowQuickInput(false)
  }

  const weekLabel = currentWeek ? `Week ${currentWeek.weekNumber}` : ''

  return (
    <AppLayout>
      {/* ── Gradient depth layers (wave bg is now global) ────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(79_70_229/0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgb(109_40_217/0.06),transparent)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10 pb-32 sm:pb-16">

        {/* ── Page header ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 animate-fade-up">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20">
              <Brain className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            </div>
            <span className="font-bold text-on-surface">Brain Dump</span>
            {weekLabel && (
              <>
                <span className="text-outline-variant">/</span>
                <span className="text-on-surface-variant">{weekLabel}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-background mb-2">
            Prep &amp; Brain Dump
          </h1>
          <p className="text-on-surface-variant text-base leading-relaxed max-w-md">
            Empty your mind. Don't worry about order or priority yet — just get it all out.
          </p>
        </div>

        {/* ── Input area ─────────────────────────────────────────────── */}
        <section
          className="flex flex-col gap-4 animate-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          <div
            className={cn(
              'relative rounded-2xl p-6 transition-all duration-300',
              'bg-surface-container-low/50 border backdrop-blur-md',
              isInputFocused
                ? 'border-primary/30 shadow-[0_0_0_1px_rgb(109_40_217/0.15),0_24px_60px_-22px_rgb(109_40_217/0.30)]'
                : 'border-outline-variant/20 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.3)]',
            )}
          >
            {/* Top-edge glass highlight */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 30%)',
              }}
            />

            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="What's on your mind? Start typing anything… (Ctrl+Enter to save)"
              className="relative w-full bg-transparent text-2xl sm:text-3xl font-serif text-on-surface placeholder:text-on-surface-variant/20 resize-none focus:outline-none min-h-[180px] leading-relaxed"
            />

            <AnimatePresence>
              {isInputFocused && (
                <motion.p
                  key="writing-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-5 left-6 text-[11px] font-mono text-on-surface-variant/35 pointer-events-none select-none"
                >
                  Writing mode active
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Structure button row */}
          <div className="flex justify-end pb-2 border-b border-outline-variant/15">
            <Button
              type="button"
              onClick={handleStructure}
              disabled={isStructuring || !inputValue.trim()}
              size="sm"
              variant="secondary"
              className="font-semibold text-sm"
              leftIcon={
                <Sparkles
                  className={cn('w-4 h-4 text-primary', isStructuring && 'animate-spin')}
                  strokeWidth={1.5}
                />
              }
            >
              {isStructuring ? 'Saving…' : 'Structure Tasks'}
            </Button>
          </div>
        </section>

        {/* ── Unprocessed tasks ──────────────────────────────────────── */}
        <section
          className="flex flex-col gap-6 animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-on-background tracking-tight">
                Unprocessed Tasks
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/20 text-[10px] font-bold text-on-surface-variant tracking-wider">
                {brainDumpItems.length} TOTAL
              </span>
            </div>

            <Button
              type="button"
              onClick={() => navigate('/weekly-distribution')}
              size="sm"
              className="w-full sm:w-auto font-bold"
              leftIcon={<Send className="w-4 h-4" strokeWidth={1.5} />}
            >
              Send to Distribution
            </Button>
          </div>

          {/* Task list */}
          <div className="flex flex-col gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-2xl" />
              ))
            ) : brainDumpItems.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-outline" strokeWidth={1} />
                </div>
                <div>
                  <p className="text-on-surface-variant font-semibold">Your brain dump is empty.</p>
                  <p className="text-outline text-sm mt-1">Start typing above and hit Structure Tasks.</p>
                </div>
              </div>
            ) : (
              brainDumpItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                >
                  <TaskCard item={item} />
                </motion.div>
              ))
            )}

            {/* Quick-add control */}
            {!isLoading && (
              showQuickInput ? (
                <div className="p-5 rounded-2xl border-2 border-dashed border-primary/30 bg-surface-container-low/30">
                  <input
                    autoFocus
                    value={quickInput}
                    onChange={e => setQuickInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleQuickAdd()
                      if (e.key === 'Escape') { setShowQuickInput(false); setQuickInput('') }
                    }}
                    onBlur={handleQuickAdd}
                    placeholder="Task title, press Enter to save…"
                    className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowQuickInput(true)}
                  className="group w-full py-5 mt-2 rounded-2xl border-2 border-dashed border-outline-variant/35 flex items-center justify-center gap-3 text-outline hover:text-on-surface-variant hover:border-outline-variant/60 hover:bg-surface-container-low/20 transition-all"
                >
                  <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span className="text-sm font-bold tracking-widest uppercase">Add a Quick Task</span>
                </button>
              )
            )}
          </div>
        </section>
      </div>

      {/* ── Floating bulk-action bar ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            key="bulk-bar"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-[calc(5rem+var(--safe-bottom,0px))] sm:bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-2 p-2 bg-surface-container-highest/85 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-outline-variant/20 w-[92vw] sm:w-auto"
          >
            <span className="text-[10px] text-on-surface-variant px-2 sm:px-4 shrink-0">
              {selectedCount} selected
            </span>
            <div className="w-px h-8 bg-outline-variant/30 shrink-0" />
            <button
              onClick={async () => {
                const tag = window.prompt('Enter tag name:')
                if (tag?.trim()) {
                  const selected = brainDumpItems.filter(i => i.selected)
                  await Promise.all(selected.map(item => {
                    const newTags = Array.from(new Set([...(item.tags || []), tag.trim()]))
                    return updateItem(item.id, { tags: newTags })
                  }))
                }
              }}
              className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 sm:px-6 py-2.5 bg-surface-bright text-on-surface rounded-xl text-[11px] sm:text-xs font-bold hover:bg-surface-variant transition-colors whitespace-nowrap"
            >
              <Tag className="w-4 h-4" strokeWidth={1.5} />
              Bulk Tag
            </button>
            <div className="w-px h-8 bg-outline-variant/30 shrink-0" />
            <button
              onClick={deleteSelected}
              className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 sm:px-6 py-2.5 bg-error-container text-on-error-container rounded-xl text-[11px] sm:text-xs font-bold hover:opacity-90 transition-colors whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
