import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { TaskCard } from '../components/TaskCard'
import { useWeekStore } from '../store/useWeekStore'

export function BrainDump() {
  const { brainDumpItems, isLoadingBrainDump, deleteSelectedBrainDumpItems, addBrainDumpItem } = useWeekStore()
  const [inputValue, setInputValue] = useState('')
  const [isStructuring, setIsStructuring] = useState(false)
  const selectedCount = brainDumpItems.filter(i => i.selected).length

  const handleStructure = async () => {
    if (!inputValue.trim() || isStructuring) return
    setIsStructuring(true)
    const lines = inputValue.split('\n').filter(l => l.trim())
    for (const line of lines) {
      await addBrainDumpItem(line.trim())
    }
    setInputValue('')
    setIsStructuring(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleStructure()
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-12 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Prep & Brain Dump</h1>
          <p className="text-on-surface-variant max-w-lg leading-relaxed">
            Empty your mind. Don't worry about order or priority yet. Just get it all out of your system.
          </p>
        </div>

        {/* Brain Dump Input */}
        <div className="relative group mb-16">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? Start typing anything... (Ctrl+Enter to save)"
            className="w-full h-48 bg-transparent border-b-2 border-surface-variant focus:border-primary focus:ring-0 text-xl font-light py-6 px-0 resize-none transition-all outline-none placeholder:text-surface-variant text-on-surface"
          />
          <div className="absolute bottom-4 right-0 flex gap-4">
            <button
              onClick={handleStructure}
              disabled={isStructuring || !inputValue.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest/60 backdrop-blur-md text-on-surface text-sm font-semibold rounded-full hover:bg-surface-container-highest transition-colors border border-white/5 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-lg ${isStructuring ? 'animate-spin' : ''}`}>
                {isStructuring ? 'progress_activity' : 'auto_awesome'}
              </span>
              {isStructuring ? 'Saving...' : 'Structure Tasks'}
            </button>
          </div>
        </div>

        {/* Task List Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">Unprocessed Tasks</h2>
            <span className="px-2.5 py-0.5 bg-surface-container-high rounded-full text-[10px] font-bold text-outline">
              {brainDumpItems.length} TOTAL
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg text-sm font-bold shadow-xl shadow-primary-container/10 hover:scale-[1.02] active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">send</span>
              Send to Distribution
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {isLoadingBrainDump ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse border border-white/5" />
            ))
          ) : brainDumpItems.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-neutral-700 block mb-4">inbox</span>
              <p className="text-neutral-500">Your brain dump is empty.</p>
              <p className="text-neutral-600 text-sm mt-1">Start typing above and hit Structure Tasks.</p>
            </div>
          ) : (
            brainDumpItems.map(item => <TaskCard key={item.id} item={item} />)
          )}

          {/* Add Quick Task slot */}
          {!isLoadingBrainDump && (
            <div
              onClick={() => {
                const content = prompt('Quick add task:')
                if (content?.trim()) addBrainDumpItem(content.trim())
              }}
              className="p-5 border-2 border-dashed border-surface-variant rounded-xl flex items-center justify-center text-outline hover:border-outline hover:text-on-surface transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
                <span className="text-sm font-semibold tracking-wide uppercase">Add a quick task</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-surface-container-highest/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/5 z-50">
          <span className="text-[10px] text-neutral-500 px-4">{selectedCount} selected</span>
          <div className="w-[1px] h-8 bg-surface-variant" />
          <button className="flex items-center gap-2 px-6 py-3 bg-surface-bright text-on-surface rounded-xl text-xs font-bold hover:bg-surface-variant transition-colors">
            <span className="material-symbols-outlined text-lg">tag</span>
            Bulk Tag
          </button>
          <div className="w-[1px] h-8 bg-surface-variant mx-1" />
          <button
            onClick={deleteSelectedBrainDumpItems}
            className="flex items-center gap-2 px-6 py-3 bg-error-container text-on-error-container rounded-xl text-xs font-bold hover:opacity-90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">delete_sweep</span>
            Delete Selected
          </button>
        </div>
      )}
    </AppLayout>
  )
}
