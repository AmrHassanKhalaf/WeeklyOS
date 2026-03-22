import { useState } from 'react'
import type { DayPlan, Task, DayOfWeek, Priority } from '../data/mockData'
import { useWeekStore } from '../store/useWeekStore'

interface DayCardDistributionProps {
  day: DayPlan
  isHighOutputZone?: boolean
}

function TaskSlot({ task, emptyHeight = 'h-12' }: { task?: Task; emptyHeight?: string }) {
  if (task) {
    return (
      <div className={`bg-surface-container-highest p-3 rounded-xl border border-white/5 text-sm cursor-pointer hover:bg-surface-bright transition-colors ${task.status === 'done' ? 'opacity-50 line-through' : ''}`}>
        <div className="break-words leading-relaxed">{task.title}</div>
        {(task.startTime || task.estimatedTime) && (
           <div className="flex gap-3 mt-2 text-[10px] text-primary/70 font-medium bg-primary/5 w-max px-2 py-0.5 rounded">
             {task.startTime && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">schedule</span>{task.startTime}</div>}
             {task.estimatedTime && <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">hourglass_bottom</span>{task.estimatedTime}</div>}
           </div>
        )}
      </div>
    )
  }
  return (
    <div className={`${emptyHeight} rounded-xl border border-dashed border-white/10 flex items-center justify-center text-neutral-600 text-[11px] italic`}>
      No tasks yet
    </div>
  )
}

function TaskInlineForm({ priority, onSave, onCancel }: { priority: Priority; onSave: (title: string, start?: string, duration?: string) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [duration, setDuration] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onCancel()
  }

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim(), start.trim() || undefined, duration.trim() || undefined)
    }
  }

  return (
    <div className="bg-surface-container-high border border-primary/30 rounded-xl p-3 flex flex-col gap-3">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`${priority.charAt(0).toUpperCase() + priority.slice(1)} task title...`}
        className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
      />
      <div className="flex gap-2">
        <input
          type="time"
          value={start}
          onChange={e => setStart(e.target.value)}
          className="bg-surface-container-low rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/40 flex-1 text-on-surface-variant [color-scheme:dark]"
        />
        <input
          value={duration}
          onChange={e => setDuration(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Duration (e.g. 2h)"
          className="bg-surface-container-low rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/40 w-24 text-on-surface-variant placeholder:text-neutral-600"
        />
      </div>
      <div className="flex justify-end gap-2 mt-1">
        <button onClick={onCancel} className="text-[10px] text-neutral-400 hover:text-white px-3 py-1.5 rounded hover:bg-white/5 transition-colors">Cancel</button>
        <button onClick={handleSave} className="text-[10px] bg-primary/20 text-primary font-bold px-4 py-1.5 rounded hover:bg-primary/30 transition-colors">Save Task</button>
      </div>
    </div>
  )
}

type AddingFor = { priority: Priority; day: DayOfWeek } | null

export function DayCardDistribution({ day, isHighOutputZone }: DayCardDistributionProps) {
  const { createTask, markDayComplete } = useWeekStore()
  const [addingFor, setAddingFor] = useState<AddingFor>(null)

  const startAdd = (priority: Priority) => {
    setAddingFor({ priority, day: day.day as DayOfWeek })
  }

  const renderInlineForm = (priority: Priority) => {
    if (addingFor?.priority === priority && addingFor.day === day.day) {
      return (
        <TaskInlineForm
          priority={priority}
          onSave={async (title, start, duration) => {
            await createTask({ title, priority, day: day.day as DayOfWeek, startTime: start, estimatedTime: duration })
            setAddingFor(null)
          }}
          onCancel={() => setAddingFor(null)}
        />
      )
    }
    return null
  }

  if (day.isRestDay) {
    return (
      <div className="bg-surface-container-low rounded-2xl border border-tertiary/20 flex flex-col h-[500px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-tertiary/5 to-transparent pointer-events-none" />
        <div className="p-6 border-b border-tertiary/10 flex items-center justify-between bg-tertiary/5 rounded-t-2xl relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-tertiary font-black">Rest Day</span>
            <h2 className="text-2xl font-bold text-tertiary">{day.date}</h2>
          </div>
          <span className="material-symbols-outlined text-tertiary">eco</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
          <div className="w-20 h-20 bg-tertiary/10 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-tertiary">bedtime</span>
          </div>
          <h3 className="text-lg font-bold text-tertiary mb-2">Recharge Phase</h3>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mb-8">
            System-mandated downtime for cognitive recovery and preparation for next cycle.
          </p>
          {!addingFor && (
            <button
              onClick={() => startAdd('low')}
              className="px-6 py-2 border border-tertiary/30 text-tertiary text-[10px] uppercase font-bold tracking-widest rounded-full hover:bg-tertiary/10 transition-colors"
            >
              Override Rest
            </button>
          )}
          {addingFor?.day === day.day && (
            <div className="mt-4 w-full text-left">
              {renderInlineForm('low')}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isHighOutputZone) {
    return (
      <div className="bg-surface-container-low rounded-2xl border border-white/5 flex flex-col h-[500px]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-container-low/50 rounded-t-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
              {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
            </span>
            <h2 className="text-2xl font-bold">{day.date}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => markDayComplete(day.day as DayOfWeek)}
              className="px-3 py-1.5 bg-surface-container-highest rounded text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              Day Complete
            </button>
            <span className="material-symbols-outlined text-on-surface-variant/40 hover:text-primary cursor-pointer">drag_indicator</span>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-primary-container/5 rounded-b-2xl">
          <span className="material-symbols-outlined text-5xl text-primary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <h3 className="text-primary font-bold uppercase tracking-widest text-xs mb-1">High Output Zone</h3>
          <p className="text-[10px] text-primary/60">Peak cognitive window identified</p>
        </div>
      </div>
    )
  }

  const highSlots = 1
  const medSlots = 3
  const smallSlots = 5
  const highFilled = day.highTask ? 1 : 0
  const medFilled = day.mediumTasks.length
  const smallFilled = day.smallTasks.length
  const hasAnyTasks = highFilled > 0 || medFilled > 0 || smallFilled > 0

  return (
    <div className="bg-surface-container-low rounded-2xl border border-white/5 flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface-container-low/50 rounded-t-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
            {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
          </span>
          <h2 className="text-2xl font-bold">{day.date}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => markDayComplete(day.day as DayOfWeek)}
            className="px-3 py-1.5 bg-surface-container-highest rounded text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
          >
            Day Complete
          </button>
          <span className="material-symbols-outlined text-on-surface-variant/40 hover:text-primary cursor-pointer">drag_indicator</span>
        </div>
      </div>

      {/* Body */}
      {!hasAnyTasks && !addingFor ? (
        <div
          className="p-6 flex-1 flex flex-col items-center justify-center text-center opacity-20 cursor-pointer hover:opacity-40 transition-opacity"
          onClick={() => startAdd('medium')}
        >
          <span className="material-symbols-outlined text-6xl mb-4">format_list_bulleted</span>
          <p className="text-sm">Click to plan this day</p>
        </div>
      ) : (
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* High Impact */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#b8c3ff]">
              <span className="tracking-widest">High Impact</span>
              <div className="flex items-center gap-2">
                <span>{highFilled}/{highSlots}</span>
                <span
                  className="material-symbols-outlined text-sm cursor-pointer hover:text-white transition-colors"
                  onClick={() => startAdd('high')}
                >add</span>
              </div>
            </div>
            <TaskSlot task={day.highTask} emptyHeight="h-24" />
            {renderInlineForm('high')}
          </div>

          {/* Medium Priority */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#b8c3ff]">
              <span className="tracking-widest">Medium Priority</span>
              <div className="flex items-center gap-2">
                <span>{medFilled}/{medSlots}</span>
                <span
                  className="material-symbols-outlined text-sm cursor-pointer hover:text-white transition-colors"
                  onClick={() => startAdd('medium')}
                >add</span>
              </div>
            </div>
            {Array.from({ length: medSlots }).map((_, i) => (
              <TaskSlot key={i} task={day.mediumTasks[i]} />
            ))}
            {renderInlineForm('medium')}
          </div>

          {/* Small Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#b8c3ff]">
              <span className="tracking-widest">Small Tasks</span>
              <div className="flex items-center gap-2">
                <span>{smallFilled}/{smallSlots}</span>
                <span
                  className="material-symbols-outlined text-sm cursor-pointer hover:text-white transition-colors"
                  onClick={() => startAdd('low')}
                >add</span>
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: smallSlots }).map((_, i) => (
                <TaskSlot key={i} task={day.smallTasks[i]} />
              ))}
            </div>
            {renderInlineForm('low')}
          </div>
        </div>
      )}
    </div>
  )
}
