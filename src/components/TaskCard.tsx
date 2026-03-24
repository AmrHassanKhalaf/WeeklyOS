import { useBrainDumpStore, BrainDumpItem } from '../store/useBrainDumpStore'
import { useState, useRef, useEffect } from 'react'

interface TaskCardProps {
  item: BrainDumpItem
}

export function TaskCard({ item }: TaskCardProps) {
  const { toggleSelection, removeItem, updateItem } = useBrainDumpStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(item.content)
  const [editTags, setEditTags] = useState<string[]>(item.tags || [])
  const [newTag, setNewTag] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  const commitEdit = async () => {
    setIsEditing(false)
    const titleChanged = editValue.trim() && editValue.trim() !== item.content
    const tagsChanged = JSON.stringify(editTags) !== JSON.stringify(item.tags || [])

    if (titleChanged || tagsChanged) {
      await updateItem(item.id, { 
        content: editValue.trim() || item.content, 
        tags: editTags 
      })
    } else {
      setEditValue(item.content)
      setEditTags(item.tags || [])
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim().toLowerCase())) {
      setEditTags([...editTags, newTag.trim().toLowerCase()])
    }
    setNewTag('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove))
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { 
      setIsEditing(false)
      setEditValue(item.content)
      setEditTags(item.tags || [])
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }

  return (
    <div
      className={`group flex items-center gap-6 p-5 rounded-xl transition-colors border-l-2 ${
        item.selected
          ? 'bg-surface-container-high border-primary-container shadow-xl shadow-black/20 cursor-pointer'
          : 'bg-surface-container-low border-transparent hover:bg-surface-container-high hover:border-primary-container cursor-pointer'
      }`}
      onClick={() => !isEditing && toggleSelection(item.id)}
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
          <div className="w-full space-y-2">
            <input
              ref={inputRef}
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-transparent border-b border-primary text-sm font-medium text-on-surface outline-none py-0.5"
            />
            <div className="flex flex-wrap gap-2 items-center">
               {editTags.map(tag => (
                 <span key={tag} className="px-2 py-0.5 bg-surface-variant text-on-surface-variant rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 group/tag">
                   {tag}
                   <button onClick={() => handleRemoveTag(tag)} className="text-on-surface-variant/50 hover:text-error">
                     <span className="material-symbols-outlined text-[10px]">close</span>
                   </button>
                 </span>
               ))}
               <div className="flex items-center gap-1">
                 <input
                   ref={tagInputRef}
                   value={newTag}
                   onChange={e => setNewTag(e.target.value)}
                   onKeyDown={handleTagKeyDown}
                   placeholder="Add tag..."
                   className="bg-surface-container-low text-[10px] px-2 py-0.5 rounded outline-none w-24 text-on-surface placeholder:text-neutral-500"
                 />
                 <button onClick={handleAddTag} className="text-[10px] bg-primary/20 text-primary p-0.5 rounded hover:bg-primary/30">
                   <span className="material-symbols-outlined text-[12px]">add</span>
                 </button>
               </div>
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={commitEdit} className="text-[10px] bg-primary/20 text-primary font-bold px-3 py-1 rounded hover:bg-primary/30 transition-colors">Done</button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium text-on-surface w-full">{item.content}</p>
        )}
        {!isEditing && item.tags && item.tags.length > 0 && (
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
          onClick={() => { setIsEditing(true); setEditValue(item.content); setEditTags(item.tags || []) }}
          className="material-symbols-outlined text-outline hover:text-white transition-colors text-xl"
          title="Edit"
        >
          edit
        </button>
        <button
          onClick={() => removeItem(item.id)}
          className="material-symbols-outlined text-outline hover:text-error transition-colors text-xl"
          title="Delete"
        >
          delete
        </button>
      </div>
    </div>
  )
}
