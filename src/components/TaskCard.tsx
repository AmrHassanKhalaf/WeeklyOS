import type { BrainDumpItem } from '../store/useWeekStore'
import { useWeekStore } from '../store/useWeekStore'
import { useState, useRef, useEffect } from 'react'

interface TaskCardProps {
  item: BrainDumpItem
}

export function TaskCard({ item }: TaskCardProps) {
  const { toggleBrainDumpSelection, removeBrainDumpItem, updateBrainDumpItem } = useWeekStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const commitEdit = async () => {
    setIsEditing(false)
    if (editValue.trim() && editValue.trim() !== item.title) {
      await updateBrainDumpItem(item.id, { title: editValue.trim() })
    } else {
      setEditValue(item.title) // reset if unchanged or empty
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setIsEditing(false); setEditValue(item.title) }
  }

  return (
    <div
      className={`group flex items-center gap-6 p-5 rounded-xl transition-colors border-l-2 ${
        item.selected
          ? 'bg-surface-container-high border-primary-container shadow-xl shadow-black/20 cursor-pointer'
          : 'bg-surface-container-low border-transparent hover:bg-surface-container-high hover:border-primary-container cursor-pointer'
      }`}
      onClick={() => !isEditing && toggleBrainDumpSelection(item.id)}
    >
      {/* Checkbox */}
      <div className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors flex-shrink-0 ${
        item.selected
          ? 'bg-primary text-on-primary'
          : 'border-2 border-outline-variant group-hover:border-primary'
      }`}>
        {item.selected && (
          <span className="material-symbols-outlined text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
        )}
        {!item.selected && (
          <span className="material-symbols-outlined text-primary text-lg opacity-0 group-hover:opacity-100">check</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col items-start gap-1.5" onClick={e => e.stopPropagation()}>
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={commitEdit}
            className="w-full bg-transparent border-b border-primary text-sm font-medium text-on-surface outline-none py-0.5"
          />
        ) : (
          <p className="text-sm font-medium text-on-surface truncate w-full">{item.title}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {item.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded text-[10px] font-bold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className={`flex items-center gap-3 transition-opacity flex-shrink-0 ${item.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => { setIsEditing(true); setEditValue(item.title) }}
          className="material-symbols-outlined text-outline hover:text-white transition-colors text-xl"
          title="Edit"
        >
          edit
        </button>
        <button
          onClick={() => removeBrainDumpItem(item.id)}
          className="material-symbols-outlined text-outline hover:text-error transition-colors text-xl"
          title="Delete"
        >
          delete
        </button>
      </div>
    </div>
  )
}
