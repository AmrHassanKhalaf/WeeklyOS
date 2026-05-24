import { useState, useRef, useEffect } from 'react'
import type { DayPlan, Task, DayOfWeek, Priority } from '../data/mockData'
import { useWeekStore } from '../store/useWeekStore'
import { Button } from './ui/Button'
import { Trash2, Check, Pin, Clock, Hourglass, Leaf, Moon, GripVertical, Sparkles, ListTodo, Plus } from 'lucide-react'
import { getTagStyle } from '../lib/tagColors'

interface DayCardDistributionProps {
  day: DayPlan
  isHighOutputZone?: boolean
  showTags?: boolean
}

const DAYS_OPTIONS: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const normalizeInput = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function TaskItem({ task, emptyHeight = 'h-12', onEmptyClick, showTags = true }: { task?: Task; emptyHeight?: string, onEmptyClick?: () => void; showTags?: boolean }) {
  const { toggleTaskComplete, deleteTask, updateTask } = useWeekStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [editData, setEditData] = useState({
    title: '', start: '', duration: '', description: '', day: 'monday' as DayOfWeek, priority: 'low' as Priority
  })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task && isEditing) {
      setEditData({
        title: task.title,
        start: task.startTime || '',
        duration: task.estimatedTime || '',
        description: task.description || '',
        day: task.day || 'monday',
        priority: task.priority || 'low'
      })
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isEditing, task])

  const handleSave = async () => {
    const title = normalizeInput(editData.title)
    if (title) {
      try {
        await updateTask(task!.id, {
          title,
          startTime: normalizeInput(editData.start) || undefined,
          estimatedTime: normalizeInput(editData.duration) || undefined,
          description: normalizeInput(editData.description) || undefined,
          day: editData.day,
          priority: editData.priority
        })
        setIsEditing(false)
      } catch (error) {
        console.error('Failed to update task:', error)
        alert(error instanceof Error ? error.message : 'Failed to update task')
        setIsEditing(false)
      }
    }
  }

  const handleToggleComplete = async () => {
    if (isToggling) return
    setIsToggling(true)
    try {
      await toggleTaskComplete(task!.id)
    } catch (e) {
      console.error('Failed to toggle task:', e)
    } finally {
      setIsToggling(false)
    }
  }

  if (!task) {
    return (
      <div onClick={onEmptyClick} className={`${emptyHeight} rounded-xl border border-dashed border-white/10 flex items-center justify-center text-neutral-600 text-[11px] italic cursor-pointer hover:border-white/20 transition-colors`}>
        No tasks yet
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="bg-surface-container-high border border-primary/30 rounded-xl p-3 flex flex-col gap-3">
        <input
          ref={inputRef}
          value={editData.title}
          onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Task title..."
          className="w-full bg-transparent text-base sm:text-sm font-bold text-on-surface outline-none placeholder:text-neutral-500"
        />
        <textarea
          value={editData.description}
          onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
          placeholder="Notes (optional)..."
          rows={2}
          className="w-full bg-transparent text-base sm:text-xs text-on-surface-variant outline-none resize-none placeholder:text-neutral-600"
        />
        <div className="flex gap-2">
          <input
            type="time"
            title="Start Time"
            value={editData.start}
            onChange={e => setEditData(p => ({ ...p, start: e.target.value }))}
            className="bg-surface-container-low rounded px-2 py-1.5 text-base sm:text-xs outline-none focus:ring-1 focus:ring-primary/40 flex-1 text-on-surface-variant [color-scheme:dark]"
          />
          <input
            value={editData.duration}
            title="Estimated Duration"
            onChange={e => setEditData(p => ({ ...p, duration: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Duration (e.g. 2h)"
            className="bg-surface-container-low rounded px-2 py-1.5 text-base sm:text-xs outline-none focus:ring-1 focus:ring-primary/40 w-24 text-on-surface-variant placeholder:text-neutral-600"
          />
        </div>
        <div className="flex gap-2 items-center">
            <select
                value={editData.priority}
                onChange={e => setEditData(p => ({ ...p, priority: e.target.value as Priority }))}
                className="bg-surface-container-low text-base sm:text-xs text-on-surface-variant rounded outline-none p-1 flex-1"
            >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
            </select>
            <select
                value={editData.day}
                onChange={e => setEditData(p => ({ ...p, day: e.target.value as DayOfWeek }))}
                className="bg-surface-container-low text-base sm:text-xs text-on-surface-variant rounded outline-none p-1 flex-1"
            >
                {DAYS_OPTIONS.map(d => (
                    <option key={d} value={d}>{d[0].toUpperCase() + d.substring(1)}</option>
                ))}
            </select>
        </div>
        
        <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/5">
          <button onClick={() => deleteTask(task.id)} className="text-[10px] text-error hover:bg-error/10 px-2 py-1.5 rounded transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="text-[10px] text-neutral-400 hover:text-white px-3 py-1.5 rounded hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={() => handleSave()} className="text-[10px] bg-primary/20 text-primary font-bold px-4 py-1.5 rounded hover:bg-primary/30 transition-colors">Save</button>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className={`group bg-surface-container-highest p-3 rounded-xl border border-transparent hover:border-white/10 text-sm transition-all focus-within:ring-1 focus-within:ring-primary/50 relative overflow-hidden ${task.status === 'done' ? 'opacity-60 bg-surface-container-low' : ''}`}>
      <div className="flex items-start gap-3">
        <button
            onClick={handleToggleComplete}
            disabled={isToggling}
            className={`mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded border transition-colors disabled:opacity-50 ${
                task.status === 'done' ? 'bg-primary border-primary text-background' : 'border-outline-variant hover:border-primary text-transparent'
            }`}
        >
            <Check className="w-3 h-3" strokeWidth={3} />
        </button>
        <div className="flex-1 min-w-0" onClick={() => setIsEditing(true)}>
            <div className="flex items-center gap-2">
              <div className={`break-words leading-tight cursor-text font-medium text-on-surface ${task.status === 'done' ? 'line-through text-on-surface-variant' : ''}`}>{task.title}</div>
              {task.type === 'pinned' && (
                <Pin className="w-3.5 h-3.5 text-primary" strokeWidth={2} title="Pinned Task" />
              )}
            </div>
            {showTags && task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {task.tags.map(tag => {
                  const tagStyle = getTagStyle(tag);
                  return (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider"
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
            {task.description && <div className="text-xs text-on-surface-variant mt-1 line-clamp-2">{task.description}</div>}
            {(task.startTime || task.estimatedTime) && (
            <div className="flex gap-2 mt-2 text-[10px] text-primary/70 font-medium bg-primary/5 w-max px-2 py-0.5 rounded">
                {task.startTime && <div className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={2} />{task.startTime}</div>}
                {task.estimatedTime && <div className="flex items-center gap-1"><Hourglass className="w-3 h-3" strokeWidth={2} />{task.estimatedTime}</div>}
            </div>
            )}
        </div>
      </div>
    </div>
  )
}

function TaskInlineForm({ priority, day, onSave, onCancel }: { priority: Priority; day: DayOfWeek; onSave: (task: Partial<Task>) => Promise<void>; onCancel: () => void }) {
  const [editData, setEditData] = useState({
    title: '', start: '', duration: '', description: '', day: day, priority: priority
  })
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onCancel()
  }

  const handleSave = () => {
    const title = normalizeInput(editData.title)
    if (title) {
      onSave({
        title,
        startTime: normalizeInput(editData.start) || undefined,
        estimatedTime: normalizeInput(editData.duration) || undefined,
        description: normalizeInput(editData.description) || undefined,
        day: editData.day,
        priority: editData.priority
      })
    }
  }

  return (
    <div className="bg-surface-container-high border border-primary/30 rounded-xl p-3 flex flex-col gap-3">
      <input
        autoFocus
        value={editData.title}
        onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
        onKeyDown={handleKeyDown}
        placeholder={`${priority.charAt(0).toUpperCase() + priority.slice(1)} task title...`}
        className="w-full bg-transparent text-base sm:text-sm font-bold text-on-surface outline-none placeholder:text-neutral-500"
      />
      <textarea
        value={editData.description}
        onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
        placeholder="Notes (optional)..."
        rows={2}
        className="w-full bg-transparent text-base sm:text-xs text-on-surface-variant outline-none resize-none placeholder:text-neutral-600"
      />
      <div className="flex gap-2">
        <input
          type="time"
          value={editData.start}
          onChange={e => setEditData(p => ({ ...p, start: e.target.value }))}
          className="bg-surface-container-low rounded px-2 py-1.5 text-base sm:text-xs outline-none focus:ring-1 focus:ring-primary/40 flex-1 text-on-surface-variant [color-scheme:dark]"
        />
        <input
          value={editData.duration}
          onChange={e => setEditData(p => ({ ...p, duration: e.target.value }))}
          onKeyDown={handleKeyDown}
          placeholder="Duration (e.g. 2h)"
          className="bg-surface-container-low rounded px-2 py-1.5 text-base sm:text-xs outline-none focus:ring-1 focus:ring-primary/40 w-24 text-on-surface-variant placeholder:text-neutral-600"
        />
      </div>
      <div className="flex justify-end gap-2 mt-1">
        <button onClick={onCancel} className="text-[10px] text-neutral-400 hover:text-white px-3 py-1.5 rounded hover:bg-white/5 transition-colors">Cancel</button>
        <button onClick={handleSave} className="text-[10px] bg-primary/20 text-primary font-bold px-4 py-1.5 rounded hover:bg-primary/30 transition-colors">Create Task</button>
      </div>
    </div>
  )
}

type AddingFor = { priority: Priority; day: DayOfWeek } | null

export function DayCardDistribution({ day, isHighOutputZone, showTags = true }: DayCardDistributionProps) {
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
          day={day.day as DayOfWeek}
          onSave={async (taskUpdates) => {
            try {
              await createTask({ 
                title: taskUpdates.title!, 
                priority: taskUpdates.priority || priority, 
                day: taskUpdates.day || (day.day as DayOfWeek), 
                startTime: taskUpdates.startTime, 
                estimatedTime: taskUpdates.estimatedTime,
                description: taskUpdates.description
              })
              setAddingFor(null)
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Failed to create task'
              alert(message)
            }
          }}
          onCancel={() => setAddingFor(null)}
        />
      )
    }
    return null
  }

  if (day.isRestDay) {
    const isOverridingRest = addingFor?.day === day.day

    return (
      <div className="bg-surface-container-low rounded-2xl border border-tertiary/20 flex flex-col h-[500px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-tertiary/5 to-transparent pointer-events-none" />
        <div className="p-6 border-b border-tertiary/10 flex items-center justify-between bg-tertiary/5 rounded-t-2xl relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-tertiary font-black">Rest Day</span>
            <h2 className="text-2xl font-bold text-tertiary">{day.date}</h2>
          </div>
          <Leaf className="w-6 h-6 text-tertiary" strokeWidth={1.5} />
        </div>
        <div className={`flex-1 p-6 relative z-10 ${isOverridingRest ? 'overflow-y-auto' : 'flex flex-col items-center justify-center text-center'}`}>
          {!isOverridingRest ? (
            <>
              <div className="w-20 h-20 bg-tertiary/10 rounded-full flex items-center justify-center mb-6">
                <Moon className="w-10 h-10 text-tertiary" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-tertiary mb-2">Recharge Phase</h3>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mb-8">
                System-mandated downtime for cognitive recovery and preparation for next cycle.
              </p>
              <button
                onClick={() => startAdd('low')}
                className="px-6 py-2 border border-tertiary/30 text-tertiary text-[10px] uppercase font-bold tracking-widest rounded-full hover:bg-tertiary/10 transition-colors"
              >
                Override Rest
              </button>
            </>
          ) : (
            <div className="max-w-3xl mx-auto">
              <p className="text-[10px] uppercase tracking-widest text-tertiary font-bold mb-3">Override Rest Day</p>
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
            <Button
              type="button"
              onClick={() => markDayComplete(day.day as DayOfWeek)}
              size="sm"
              variant="secondary"
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              Day Complete
            </Button>
            <GripVertical className="w-5 h-5 text-on-surface-variant/40 hover:text-primary cursor-pointer" strokeWidth={1.5} />
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-primary-container/5 rounded-b-2xl">
          <Sparkles className="w-12 h-12 text-primary mb-4" strokeWidth={1.5} />
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

  // Calculate progress efficiently
  const totalTasks = (day.highTask ? 1 : 0) + day.mediumTasks.length + day.smallTasks.length
  const completedTasks = (day.highTask?.status === 'done' ? 1 : 0) + day.mediumTasks.filter(t => t.status === 'done').length + day.smallTasks.filter(t => t.status === 'done').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const progressColor = progress === 100 ? 'bg-tertiary' : 'bg-primary'

  return (
    <div className="bg-surface-container-low rounded-2xl border border-white/5 flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-6 border-b border-white/5 space-y-4 bg-surface-container-low/50 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
              {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
            </span>
            <h2 className="text-2xl font-bold">{day.date}</h2>
          </div>
          <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => markDayComplete(day.day as DayOfWeek)}
            size="sm"
            variant="secondary"
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            Day Complete
          </Button>
          <GripVertical className="w-5 h-5 text-on-surface-variant/40 hover:text-primary cursor-pointer" strokeWidth={1.5} />
        </div>
      </div>
        
        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="flex-1 max-w-xs space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span>Day Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className={`h-full ${progressColor} transition-all duration-300`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      {!hasAnyTasks && !addingFor ? (
        <div
          className="p-6 flex-1 flex flex-col items-center justify-center text-center opacity-20 cursor-pointer hover:opacity-40 transition-opacity"
          onClick={() => startAdd('medium')}
        >
          <ListTodo className="w-14 h-14 mb-4" strokeWidth={1} />
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
                <Plus
                  className={`w-4 h-4 cursor-pointer hover:text-white transition-colors ${highFilled >= highSlots ? 'opacity-20 pointer-events-none' : ''}`}
                  onClick={() => highFilled < highSlots && startAdd('high')}
                  title={highFilled >= highSlots ? "Limit reached (1 High task)" : "Add High Impact Task"}
                  strokeWidth={2}
                />
              </div>
            </div>
            <TaskItem task={day.highTask} emptyHeight="h-24" onEmptyClick={() => startAdd('high')} showTags={showTags} />
            {renderInlineForm('high')}
          </div>

          {/* Medium Priority */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#b8c3ff]">
              <span className="tracking-widest">Medium Priority</span>
              <div className="flex items-center gap-2">
                <span>{medFilled}/{medSlots}</span>
                <Plus
                  className={`w-4 h-4 cursor-pointer hover:text-white transition-colors ${medFilled >= medSlots ? 'opacity-20 pointer-events-none' : ''}`}
                  onClick={() => medFilled < medSlots && startAdd('medium')}
                  title={medFilled >= medSlots ? "Limit reached (3 Medium tasks)" : "Add Medium Priority Task"}
                  strokeWidth={2}
                />
              </div>
            </div>
            {Array.from({ length: medSlots }).map((_, i) => (
              <TaskItem key={i} task={day.mediumTasks[i]} onEmptyClick={() => startAdd('medium')} showTags={showTags} />
            ))}
            {renderInlineForm('medium')}
          </div>

          {/* Small Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#b8c3ff]">
              <span className="tracking-widest">Small Tasks</span>
              <div className="flex items-center gap-2">
                <span>{smallFilled}/{smallSlots}</span>
                <Plus
                  className={`w-4 h-4 cursor-pointer hover:text-white transition-colors ${smallFilled >= smallSlots ? 'opacity-20 pointer-events-none' : ''}`}
                  onClick={() => smallFilled < smallSlots && startAdd('low')}
                  title={smallFilled >= smallSlots ? "Limit reached (5 Small tasks)" : "Add Small Task"}
                  strokeWidth={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: smallSlots }).map((_, i) => (
                <TaskItem key={i} task={day.smallTasks[i]} onEmptyClick={() => startAdd('low')} showTags={showTags} />
              ))}
            </div>
            {renderInlineForm('low')}
          </div>
        </div>
      )}
    </div>
  )
}
