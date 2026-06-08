import { useBrainDumpStore } from '../store/useBrainDumpStore'
import type { BrainDumpItem } from '../store/useBrainDumpStore'
import { Check, X, Plus, Edit3, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { getTagStyle } from '../lib/tagColors'
import { BidiText } from './ui/BidiText'

interface TaskCardProps {
  item: BrainDumpItem
}

export function TaskCard({ item }: TaskCardProps) {
  const toggleSelection = useBrainDumpStore(state => state.toggleSelection)
  const removeItem = useBrainDumpStore(state => state.removeItem)
  const updateItem = useBrainDumpStore(state => state.updateItem)
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
          <Check className="text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
        )}
        {!item.selected && (
          <Check className="text-primary text-lg opacity-0 group-hover:opacity-100" strokeWidth={1.5} />
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
              dir="auto"
              className="bidi-plaintext w-full bg-transparent border-b border-primary text-sm font-medium text-on-surface outline-none py-0.5"
            />
            <div className="flex flex-wrap gap-2 items-center">
              {editTags.map(tag => {
                const tagStyle = getTagStyle(tag);
                return (
                  <span
                    key={tag}
                    className="px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 group/tag"
                    style={{
                      backgroundColor: tagStyle.backgroundColor,
                      borderColor: tagStyle.borderColor,
                      color: tagStyle.color,
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      style={{ color: tagStyle.color }}
                    >
                      <X className="text-[10px] w-3 h-3" strokeWidth={2} />
                    </button>
                  </span>
                )
              })}
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
                  <Plus className="text-[12px]" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={commitEdit} className="text-[10px] bg-primary/20 text-primary font-bold px-3 py-1 rounded hover:bg-primary/30 transition-colors">Done</button>
            </div>
          </div>
        ) : (
          <BidiText as="p" text={item.content} className="text-sm font-medium text-on-surface w-full" />
        )}
        {!isEditing && item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {item.tags.map(tag => {
              const tagStyle = getTagStyle(tag);
              return (
                <span
                  key={tag}
                  className="px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: tagStyle.backgroundColor,
                    borderColor: tagStyle.borderColor,
                    color: tagStyle.color,
                  }}
                >
                  {tag}
                </span>
              )
            })}
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
          className="text-outline hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          title="Edit"
        >
          <Edit3 className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button
          onClick={() => removeItem(item.id)}
          className="text-outline hover:text-error transition-colors p-1 rounded hover:bg-error/10"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
