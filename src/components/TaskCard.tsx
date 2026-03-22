import type { BrainDumpItem } from '../store/useWeekStore'
import { useWeekStore } from '../store/useWeekStore'

interface TaskCardProps {
  item: BrainDumpItem
}

export function TaskCard({ item }: TaskCardProps) {
  const { toggleBrainDumpSelection, removeBrainDumpItem } = useWeekStore()

  return (
    <div
      className={`group flex items-center gap-6 p-5 rounded-xl transition-colors cursor-pointer border-l-2 ${
        item.selected
          ? 'bg-surface-container-high border-primary-container shadow-xl shadow-black/20'
          : 'bg-surface-container-low border-transparent hover:bg-surface-container-high hover:border-primary-container'
      }`}
      onClick={() => toggleBrainDumpSelection(item.id)}
    >
      {/* Checkbox */}
      <div className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
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
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface">{item.title}</p>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-3 transition-opacity ${item.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          onClick={e => { e.stopPropagation() }}
          className="material-symbols-outlined text-outline hover:text-white transition-colors text-xl"
        >
          edit
        </button>
        <button
          onClick={e => { e.stopPropagation(); removeBrainDumpItem(item.id) }}
          className="material-symbols-outlined text-outline hover:text-error transition-colors text-xl"
        >
          delete
        </button>
      </div>
    </div>
  )
}
