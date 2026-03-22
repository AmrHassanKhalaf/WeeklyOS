import { useState, useRef } from 'react'
import { useWeekStore } from '../store/useWeekStore'
import type { BrainDumpItem } from '../data/mockData'

export function BrainDumpInput() {
  const [value, setValue] = useState('')
  const { addBrainDumpItem } = useWeekStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleStructure = () => {
    if (!value.trim()) return
    const lines = value.split('\n').filter(l => l.trim())
    lines.forEach((line, i) => {
      const newItem: BrainDumpItem = {
        id: `bd-new-${Date.now()}-${i}`,
        title: line.trim(),
      }
      addBrainDumpItem(newItem)
    })
    setValue('')
  }

  return (
    <div className="relative group mb-16">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="What's on your mind? Start typing anything..."
        className="w-full h-48 bg-transparent border-b-2 border-surface-variant focus:border-primary focus:ring-0 text-xl font-light py-6 px-0 resize-none transition-all outline-none placeholder:text-surface-variant text-on-surface"
      />
      <div className="absolute bottom-4 right-0 flex gap-4">
        <button
          onClick={handleStructure}
          className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest/60 backdrop-blur-md text-on-surface text-sm font-semibold rounded-full hover:bg-surface-container-highest transition-colors border border-white/5"
        >
          <span className="material-symbols-outlined text-lg">auto_awesome</span>
          Structure Tasks
        </button>
      </div>
    </div>
  )
}
