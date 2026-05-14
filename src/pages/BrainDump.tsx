import { useState } from 'react'
import { Inbox, Sparkles, Send, PlusCircle, Tag, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { TaskCard } from '../components/TaskCard'
import { useBrainDumpStore } from '../store/useBrainDumpStore'
import { useEffect } from 'react'
import { Button } from '../components/ui/Button'

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
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
              Send to Distribution
            </Button>
          </div>
        </div>

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
