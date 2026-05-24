<<<<<<< Updated upstream
import { useState } from 'react'
=======
import { useState, useEffect } from 'react'
>>>>>>> Stashed changes
import { Brain, Sparkles, Send, PlusCircle, Tag, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { TaskCard } from '../components/TaskCard'
import { useBrainDumpStore } from '../store/useBrainDumpStore'
<<<<<<< Updated upstream
import { useEffect } from 'react'
import { Button } from '../components/ui/Button'
=======
import { useWeekStore } from '../store/useWeekStore'
import { cn } from '../lib/cn'
>>>>>>> Stashed changes

export function BrainDump() {
  const { brainDumpItems, isLoading, loadItems, addItem, updateItem, deleteSelected } = useBrainDumpStore()
  
  useEffect(() => {
    loadItems()
  }, [loadItems])

  const [inputValue, setInputValue] = useState('')
  const [isStructuring, setIsStructuring] = useState(false)
  const [quickInput, setQuickInput] = useState('')
  const [showQuickInput, setShowQuickInput] = useState(false)
  const navigate = useNavigate()
  const selectedCount = brainDumpItems.filter(i => i.selected).length

  const weekLabel = currentWeek ? `Week ${currentWeek.weekNumber}` : ''

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

  return (
    <AppLayout>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      <div className="max-w-4xl mx-auto container-responsive py-responsive pb-32 sm:pb-16">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-responsive-h1 font-extrabold tracking-tight mb-2 sm:mb-3">Prep & Brain Dump</h1>
          <p className="text-on-surface-variant max-w-lg leading-relaxed text-sm sm:text-base">
            Empty your mind. Don't worry about order or priority yet. Just get it all out of your system.
          </p>
        </div>

        {/* Brain Dump Input */}
        <div className="relative group mb-12 sm:mb-16">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? Start typing anything... (Ctrl+Enter to save)"
            className="w-full h-40 sm:h-48 bg-transparent border-b-2 border-surface-variant focus:border-primary focus:ring-0 text-base sm:text-xl font-light py-4 sm:py-6 px-0 resize-none transition-all outline-none placeholder:text-surface-variant text-on-surface"
          />
          <div className="absolute bottom-4 right-0 flex gap-4">
            <Button
              type="button"
              onClick={handleStructure}
              disabled={isStructuring || !inputValue.trim()}
              size="sm"
              variant="secondary"
              className="text-on-surface text-sm font-semibold disabled:opacity-50"
            >
              <Sparkles className={`w-5 h-5 ${isStructuring ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              {isStructuring ? 'Saving...' : 'Structure Tasks'}
            </Button>
          </div>
        </div>

        {/* Task List Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <h2 className="text-lg font-bold">Unprocessed Tasks</h2>
            <span className="px-2.5 py-0.5 bg-surface-container-high rounded-full text-[10px] font-bold text-outline">
              {brainDumpItems.length} TOTAL
            </span>
          </div>
          <div className="flex items-center w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => navigate('/weekly-distribution')}
              size="sm"
              variant="secondary"
              className="text-sm font-bold w-full sm:w-auto touch-target"
=======
      {/* ── Cinematic background (mirrors Stitch design) ──────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Dreamy abstract image with mix-blend-screen */}
        <img
          alt=""
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNpOcJi0wqLOCjUCEeROqt2t4lGxGaOnV-88qHEVEqLj3nh0u2FHZ4q_ueqJ6LUlacgu5L2m_sKna6PAvEiodGv6sgJMSIrK-q-DlXHjUpYmoOYP8xpei8n5QaHXJywjvIj_AWdJV3YDxz4118mCSFOgu8Grgg9oYdP5xIsT2xyfoSl6O11-zs1z2eRApTY2d8ddLnpmFYCa2jRArnGkmNLbyuaOLirTOK1A5-hKfUcDFeMvSAWM0Zye0m8hWzXcVyjRRcc2n7lio"
          className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen blur-[2px] opacity-50"
          style={{ mixBlendMode: 'screen' }}
        />
        {/* Multi-layer gradient veil */}
=======
      {/* ── Cinematic background (Stitch design) ─────────────────────────── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          alt=""
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNpOcJi0wqLOCjUCEeROqt2t4lGxGaOnV-88qHEVEqLj3nh0u2FHZ4q_ueqJ6LUlacgu5L2m_sKna6PAvEiodGv6sgJMSIrK-q-DlXHjUpYmoOYP8xpei8n5QaHXJywjvIj_AWdJV3YDxz4118mCSFOgu8Grgg9oYdP5xIsT2xyfoSl6O11-zs1z2eRApTY2d8ddLnpmFYCa2jRArnGkmNLbyuaOLirTOK1A5-hKfUcDFeMvSAWM0Zye0m8hWzXcVyjRRcc2n7lio"
          className="absolute inset-0 w-full h-full object-cover object-center blur-[2px] opacity-50"
          style={{ mixBlendMode: 'screen' }}
        />
>>>>>>> Stashed changes
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(79_70_229/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgb(109_40_217/0.08),transparent)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10 pb-32 sm:pb-16">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <motion.div
          className="flex flex-col gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
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

<<<<<<< Updated upstream
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-background mb-2">
                Prep &amp; Brain Dump
              </h1>
              <p className="text-on-surface-variant text-base leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Empty your mind. Don't worry about order or priority yet — just get it all out.
              </p>
            </div>


          </div>
        </motion.div>

=======
          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-background mb-2">
              Prep &amp; Brain Dump
            </h1>
            <p className="text-base leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Empty your mind. Don't worry about order or priority yet — just get it all out.
            </p>
          </div>
        </motion.div>

>>>>>>> Stashed changes
        {/* ── Input area ──────────────────────────────────────────────────── */}
        <motion.section
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
        >
          {/* Glass textarea panel */}
          <div
            className={cn(
<<<<<<< Updated upstream
              'relative rounded-2xl p-6 transition-all duration-300',
              'backdrop-blur-xl border shadow-2xl',
=======
              'relative rounded-2xl p-6 transition-all duration-300 backdrop-blur-xl border shadow-2xl',
>>>>>>> Stashed changes
              isInputFocused
                ? 'border-primary/30 shadow-[0_0_0_1px_rgb(109_40_217/0.15),0_24px_60px_-22px_rgb(109_40_217/0.35)]'
                : 'border-white/5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)]',
            )}
            style={{ background: 'rgba(30,30,36,0.45)' }}
          >
            {/* Top glass highlight */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0) 30%)' }}
            />

            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="What's on your mind? Start typing anything… (Ctrl+Enter to save)"
              className="relative w-full bg-transparent text-2xl sm:text-3xl font-serif text-on-surface placeholder:text-white/20 resize-none focus:outline-none min-h-[180px] leading-relaxed"
            />

            <AnimatePresence>
              {isInputFocused && (
                <motion.p
                  key="writing-mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-5 left-6 text-[11px] font-mono pointer-events-none select-none"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  Writing mode active
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Structure button row */}
          <div className="flex justify-end pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={handleStructure}
              disabled={isStructuring || !inputValue.trim()}
              className={cn(
<<<<<<< Updated upstream
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm',
                'backdrop-blur-md border border-white/10',
                isStructuring || !inputValue.trim()
                  ? 'opacity-40 cursor-not-allowed text-on-surface-variant bg-white/5'
                  : 'text-on-surface-variant hover:text-white hover:border-white/20 bg-white/5 hover:bg-white/10',
=======
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border border-white/10',
                isStructuring || !inputValue.trim()
                  ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
                  : 'text-on-surface-variant hover:text-white hover:border-white/20',
>>>>>>> Stashed changes
              )}
              style={{ backdropFilter: 'blur(12px)', background: 'rgba(30,30,36,0.4)' }}
            >
              <Sparkles
                className={cn('w-4 h-4 text-primary', isStructuring && 'animate-spin')}
                strokeWidth={1.5}
              />
              {isStructuring ? 'Saving…' : 'Structure Tasks'}
            </button>
          </div>
        </motion.section>

        {/* ── Unprocessed tasks ───────────────────────────────────────────── */}
        <motion.section
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-on-background tracking-tight">
                Unprocessed Tasks
              </h2>
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                {brainDumpItems.length} TOTAL
              </span>
            </div>

<<<<<<< Updated upstream
            {/* Send to Distribution — gradient button (matches Stitch) */}
            <button
              type="button"
              onClick={() => navigate('/weekly-distribution')}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg"
=======
            {/* Send to Distribution */}
            <button
              type="button"
              onClick={() => navigate('/weekly-distribution')}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
>>>>>>> Stashed changes
              style={{
                background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                boxShadow: '0 8px 24px -6px rgba(99,102,241,0.4)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg,#6366f1,#818cf8)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg,#4f46e5,#6366f1)'
              }}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
              Send to Distribution
            </button>
          </div>
        </div>

<<<<<<< Updated upstream
        {/* Task List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse border border-white/5" />
            ))
          ) : brainDumpItems.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="text-6xl text-neutral-700 block mb-4" strokeWidth={1.5} />
              <p className="text-neutral-500">Your brain dump is empty.</p>
              <p className="text-neutral-600 text-sm mt-1">Start typing above and hit Structure Tasks.</p>
            </div>
          ) : (
            brainDumpItems.map(item => <TaskCard key={item.id} item={item} />)
          )}

          {/* Quick add inline input */}
          {!isLoading && (
            showQuickInput ? (
              <div className="p-5 border-2 border-primary/30 border-dashed rounded-xl">
                <input
                  autoFocus
                  value={quickInput}
                  onChange={e => setQuickInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); if (e.key === 'Escape') { setShowQuickInput(false); setQuickInput('') } }}
                  onBlur={handleQuickAdd}
                  placeholder="Task title, press Enter to save…"
                  className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-neutral-600"
                />
              </div>
            ) : (
              <div
                onClick={() => setShowQuickInput(true)}
                className="p-5 border-2 border-dashed border-surface-variant rounded-xl flex items-center justify-center text-outline hover:border-outline hover:text-on-surface transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span className="text-sm font-semibold tracking-wide uppercase">Add a quick task</span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-[calc(5rem+var(--safe-bottom,0px))] sm:bottom-12 left-1/2 -translate-x-1/2 flex items-center justify-between sm:justify-start gap-1 sm:gap-2 p-2 bg-surface-container-highest/80 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/5 z-50 w-[92vw] sm:w-auto">
          <span className="text-[10px] text-neutral-500 px-2 sm:px-4 shrink-0">{selectedCount} selected</span>
          <div className="w-[1px] h-8 bg-surface-variant shrink-0" />
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
            className="flex flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 touch-target bg-surface-bright text-on-surface rounded-xl text-[11px] sm:text-xs font-bold hover:bg-surface-variant transition-colors whitespace-nowrap"
=======
          {/* Task list */}
          <div className="flex flex-col gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-2xl" />
              ))
            ) : brainDumpItems.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div
                  className="w-16 h-16 rounded-2xl border flex items-center justify-center"
                  style={{ background: 'rgba(30,30,36,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
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
                <div
                  className="p-5 rounded-2xl border-2 border-dashed"
                  style={{ borderColor: 'rgba(99,102,241,0.35)', background: 'rgba(30,30,36,0.3)' }}
                >
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
                  className="group w-full py-5 mt-2 rounded-2xl flex items-center justify-center gap-3 transition-all"
                  style={{
                    backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='rgba(161,161,170,0.35)' stroke-width='1.5' stroke-dasharray='7%2c7' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")",
                    color: 'rgba(255,255,255,0.35)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = ''
                  }}
                >
                  <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span className="text-sm font-bold tracking-widest uppercase">Add a Quick Task</span>
                </button>
              )
            )}
          </div>
        </motion.section>
      </div>

      {/* ── Floating bulk-action bar ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            key="bulk-bar"
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-[calc(5rem+var(--safe-bottom,0px))] sm:bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-2 p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border w-[92vw] sm:w-auto"
            style={{
              background: 'rgba(20,20,26,0.88)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
          >
            <Tag className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
            Bulk Tag
          </button>
          <div className="w-[1px] h-8 bg-surface-variant mx-0 sm:mx-1 shrink-0" />
          <button
            onClick={deleteSelected}
            className="flex flex-1 sm:flex-none items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-3 touch-target bg-error-container text-on-error-container rounded-xl text-[11px] sm:text-xs font-bold hover:opacity-90 transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
            Delete
          </button>
        </div>
      )}
    </AppLayout>
  )
}
