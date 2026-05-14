import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DayPlan, Task, DayOfWeek, Priority } from '../data/mockData'
import { useWeekStore } from '../store/useWeekStore'
import { Button } from './ui/Button'
import { Trash2, Check, Pin, Clock, Hourglass, Leaf, Moon, Plus, GripVertical } from 'lucide-react'

interface DayCardDistributionProps {
  day: DayPlan
  isHighOutputZone?: boolean
  showTags?: boolean
  isExpanded?: boolean
}

const DAYS_OPTIONS: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const normalizeInput = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const priorityConfig = {
  high: {
    label: 'High Impact',
    sublabel: 'Your main focus for the day',
    color: 'secondary',
    bgClass: 'bg-secondary/10',
    borderClass: 'border-secondary/30',
    textClass: 'text-secondary',
    dotClass: 'bg-secondary',
    slots: 1,
    icon: '01',
  },
  medium: {
    label: 'Medium',
    sublabel: 'Supporting tasks that matter',
    color: 'primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/30',
    textClass: 'text-primary',
    dotClass: 'bg-primary',
    slots: 3,
    icon: '03',
  },
  low: {
    label: 'Quick Wins',
    sublabel: 'Small victories add up',
    color: 'on-surface-variant',
    bgClass: 'bg-white/5',
    borderClass: 'border-white/10',
    textClass: 'text-on-surface-variant',
    dotClass: 'bg-on-surface-variant/50',
    slots: 5,
    icon: '05',
  },
}

function TaskItem({ task, priority, emptyHeight = 'h-16', onEmptyClick, showTags = true }: { 
  task?: Task
  priority: Priority
  emptyHeight?: string
  onEmptyClick?: () => void
  showTags?: boolean 
}) {
  const { toggleTaskComplete, deleteTask, updateTask } = useWeekStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [editData, setEditData] = useState({
    title: '', start: '', duration: '', description: '', day: 'monday' as DayOfWeek, priority: 'low' as Priority
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const config = priorityConfig[priority]

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
      <motion.button 
        onClick={onEmptyClick} 
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={`
          ${emptyHeight} w-full rounded-2xl border-2 border-dashed border-white/10 
          flex items-center justify-center gap-3
          text-on-surface-variant/40 text-sm font-medium
          hover:border-white/20 hover:bg-white/[0.02] hover:text-on-surface-variant/60
          transition-all duration-300
        `}
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        Add task
      </motion.button>
    )
  }

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-surface-container-high rounded-2xl p-6 space-y-4 border border-white/10"
      >
        <input
          ref={inputRef}
          value={editData.title}
          onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Task title..."
          className="w-full bg-transparent text-lg font-bold text-on-surface outline-none placeholder:text-on-surface-variant/40"
        />
        <textarea
          value={editData.description}
          onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
          placeholder="Notes (optional)..."
          rows={2}
          className="w-full bg-transparent text-sm text-on-surface-variant outline-none resize-none placeholder:text-on-surface-variant/30"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="time"
            title="Start Time"
            value={editData.start}
            onChange={e => setEditData(p => ({ ...p, start: e.target.value }))}
            className="bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-on-surface-variant [color-scheme:dark]"
          />
          <input
            value={editData.duration}
            title="Estimated Duration"
            onChange={e => setEditData(p => ({ ...p, duration: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Duration (e.g. 2h)"
            className="bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-on-surface-variant placeholder:text-on-surface-variant/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={editData.priority}
            onChange={e => setEditData(p => ({ ...p, priority: e.target.value as Priority }))}
            className="bg-surface-container-low text-sm text-on-surface-variant rounded-xl outline-none px-4 py-3 border border-white/10"
          >
            <option value="high">High Impact</option>
            <option value="medium">Medium</option>
            <option value="low">Quick Win</option>
          </select>
          <select
            value={editData.day}
            onChange={e => setEditData(p => ({ ...p, day: e.target.value as DayOfWeek }))}
            className="bg-surface-container-low text-sm text-on-surface-variant rounded-xl outline-none px-4 py-3 border border-white/10"
          >
            {DAYS_OPTIONS.map(d => (
              <option key={d} value={d}>{d[0].toUpperCase() + d.substring(1)}</option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-white/5">
          <button 
            onClick={() => deleteTask(task.id)} 
            className="text-sm text-error hover:bg-error/10 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 font-medium"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)} 
              className="text-sm text-on-surface-variant hover:text-on-surface px-5 py-2.5 rounded-xl hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSave()} 
              className="text-sm bg-primary text-on-primary font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300
        ${task.status === 'done' 
          ? 'bg-surface-container-low/30 border-white/5 opacity-60' 
          : 'bg-surface-container-highest/60 border-white/10 hover:border-white/20'
        }
      `}
    >
      {/* Drag Handle */}
      <div className="opacity-0 group-hover:opacity-30 transition-opacity cursor-grab mt-1">
        <GripVertical className="w-4 h-4 text-on-surface-variant" />
      </div>

      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        disabled={isToggling}
        className={`
          mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all duration-200
          ${task.status === 'done' 
            ? `bg-tertiary/20 border-tertiary/40 text-tertiary` 
            : `border-white/20 hover:border-${config.color}/40 text-transparent hover:text-white/20`
          }
          disabled:opacity-50
        `}
      >
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsEditing(true)}>
        <div className="flex items-center gap-2">
          <span className={`
            text-base font-semibold leading-tight
            ${task.status === 'done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}
          `}>
            {task.title}
          </span>
          {task.type === 'pinned' && (
            <Pin className={`w-3.5 h-3.5 ${config.textClass}`} strokeWidth={2.5} />
          )}
        </div>
        
        {showTags && task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            {task.tags.map(tag => (
              <span 
                key={tag} 
                className="px-2.5 py-1 bg-white/5 text-[10px] text-on-surface-variant rounded-full uppercase tracking-wider font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {task.description && (
          <p className="text-sm text-on-surface-variant/60 mt-2 line-clamp-2">{task.description}</p>
        )}
        
        {(task.startTime || task.estimatedTime) && (
          <div className={`flex gap-4 mt-3 text-xs ${config.textClass} font-medium`}>
            {task.startTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                {task.startTime}
              </div>
            )}
            {task.estimatedTime && (
              <div className="flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5" strokeWidth={2} />
                {task.estimatedTime}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TaskInlineForm({ priority, day, onSave, onCancel }: { 
  priority: Priority
  day: DayOfWeek
  onSave: (task: Partial<Task>) => Promise<void>
  onCancel: () => void 
}) {
  const [editData, setEditData] = useState({
    title: '', start: '', duration: '', description: '', day: day, priority: priority
  })
  const config = priorityConfig[priority]
  
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
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`${config.bgClass} border ${config.borderClass} rounded-2xl p-5 space-y-4`}
    >
      <input
        autoFocus
        value={editData.title}
        onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
        onKeyDown={handleKeyDown}
        placeholder={`Add ${config.label.toLowerCase()} task...`}
        className="w-full bg-transparent text-base font-bold text-on-surface outline-none placeholder:text-on-surface-variant/40"
      />
      <textarea
        value={editData.description}
        onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
        placeholder="Notes (optional)..."
        rows={2}
        className="w-full bg-transparent text-sm text-on-surface-variant outline-none resize-none placeholder:text-on-surface-variant/30"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="time"
          value={editData.start}
          onChange={e => setEditData(p => ({ ...p, start: e.target.value }))}
          className="bg-surface-container-low rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-on-surface-variant [color-scheme:dark]"
        />
        <input
          value={editData.duration}
          onChange={e => setEditData(p => ({ ...p, duration: e.target.value }))}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 2h"
          className="bg-surface-container-low rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-on-surface-variant placeholder:text-on-surface-variant/30"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button 
          onClick={onCancel} 
          className="text-sm text-on-surface-variant hover:text-on-surface px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors font-medium"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          className={`text-sm ${config.bgClass} ${config.textClass} font-bold px-6 py-2.5 rounded-xl hover:opacity-80 transition-colors border ${config.borderClass}`}
        >
          Create
        </button>
      </div>
    </motion.div>
  )
}

type AddingFor = { priority: Priority; day: DayOfWeek } | null

export function DayCardDistribution({ day, showTags = true, isExpanded = false }: DayCardDistributionProps) {
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

  // Calculate progress
  const totalTasks = (day.highTask ? 1 : 0) + day.mediumTasks.length + day.smallTasks.length
  const completedTasks = (day.highTask?.status === 'done' ? 1 : 0) + 
    day.mediumTasks.filter(t => t.status === 'done').length + 
    day.smallTasks.filter(t => t.status === 'done').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Rest Day State
  if (day.isRestDay) {
    return (
      <div className="relative min-h-[50vh] flex items-center justify-center">
        {/* Background Decoration */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <Leaf className="w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] text-tertiary" strokeWidth={0.5} />
        </div>

        <div className="text-center relative z-10 max-w-md mx-auto px-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-tertiary/10 flex items-center justify-center">
              <Moon className="w-10 h-10 text-tertiary" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-black text-on-surface mb-3">
              {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
            </h2>
            <p className="text-lg text-tertiary font-medium mb-4">Rest Day</p>
            <p className="text-sm text-on-surface-variant/60 leading-relaxed mb-8">
              Strategic downtime is essential for peak performance. 
              Recharge and prepare for the next productive cycle.
            </p>
            
            {!addingFor && (
              <button
                onClick={() => startAdd('low')}
                className="px-6 py-3 border border-tertiary/30 text-tertiary text-sm uppercase tracking-[0.15em] font-bold rounded-full hover:bg-tertiary/10 transition-all duration-300"
              >
                Override Rest
              </button>
            )}

            <AnimatePresence mode="wait">
              {addingFor && renderInlineForm('low')}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    )
  }

  // Expanded Day View
  if (isExpanded) {
    const highFilled = day.highTask ? 1 : 0
    const medFilled = day.mediumTasks.length
    const smallFilled = day.smallTasks.length
    const hasAnyTasks = highFilled > 0 || medFilled > 0 || smallFilled > 0

    const PrioritySection = ({ 
      priority, 
      tasks, 
      filled 
    }: { 
      priority: Priority
      tasks: Task[]
      filled: number
    }) => {
      const config = priorityConfig[priority]
      const singleTask = priority === 'high'
      const completedInSection = tasks.filter(t => t.status === 'done').length

      return (
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`text-5xl font-black ${config.textClass} opacity-20`}>
                {config.icon}
              </span>
              <div>
                <h3 className={`text-lg font-bold ${config.textClass}`}>{config.label}</h3>
                <p className="text-xs text-on-surface-variant/60">{config.sublabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-on-surface-variant">
                {completedInSection}/{filled}
              </span>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {singleTask ? (
              <>
                <TaskItem 
                  task={day.highTask} 
                  priority={priority}
                  emptyHeight="h-24" 
                  onEmptyClick={() => startAdd(priority)} 
                  showTags={showTags} 
                />
                <AnimatePresence>{renderInlineForm(priority)}</AnimatePresence>
              </>
            ) : (
              <>
                {tasks.map((task, i) => (
                  <TaskItem 
                    key={task?.id || i} 
                    task={task} 
                    priority={priority}
                    onEmptyClick={() => startAdd(priority)} 
                    showTags={showTags} 
                  />
                ))}
                {filled < config.slots && !addingFor && (
                  <TaskItem 
                    priority={priority}
                    onEmptyClick={() => startAdd(priority)} 
                    showTags={showTags} 
                  />
                )}
                <AnimatePresence>{renderInlineForm(priority)}</AnimatePresence>
              </>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-8">
        {/* Day Header */}
        <div className="flex items-end justify-between pb-8 border-b border-white/5">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-on-surface-variant mb-2">
              {day.isToday ? 'Today' : day.day.charAt(0).toUpperCase() + day.day.slice(1)}
            </p>
            <h2 className="text-5xl lg:text-6xl font-black text-on-surface tracking-tight">
              {day.shortName} <span className="text-on-surface-variant/30">{day.date}</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Progress */}
            {totalTasks > 0 && (
              <div className="text-right">
                <p className={`text-3xl font-black tabular-nums ${progress === 100 ? 'text-tertiary' : 'text-on-surface'}`}>
                  {progress}%
                </p>
                <p className="text-xs text-on-surface-variant mt-1">{completedTasks}/{totalTasks} complete</p>
              </div>
            )}

            {/* Complete Day Button */}
            <Button
              type="button"
              onClick={() => markDayComplete(day.day as DayOfWeek)}
              size="sm"
              variant="ghost"
              disabled={!hasAnyTasks}
              className="text-[11px] tracking-[0.15em] uppercase font-bold rounded-full border border-white/10"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
              Complete Day
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {!hasAnyTasks && !addingFor ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center"
          >
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-white/5 flex items-center justify-center">
              <Plus className="w-10 h-10 text-on-surface-variant/40" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">No tasks yet</h3>
            <p className="text-sm text-on-surface-variant/60 mb-8 max-w-sm mx-auto">
              Start planning your day by adding tasks to each priority level.
            </p>
            <button
              onClick={() => startAdd('high')}
              className="px-6 py-3 bg-primary/10 border border-primary/30 text-primary text-sm uppercase tracking-[0.15em] font-bold rounded-full hover:bg-primary/20 transition-all duration-300"
            >
              Add First Task
            </button>
          </motion.div>
        ) : (
          /* Task Sections */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <PrioritySection priority="high" tasks={day.highTask ? [day.highTask] : []} filled={highFilled} />
            <PrioritySection priority="medium" tasks={day.mediumTasks} filled={medFilled} />
            <PrioritySection priority="low" tasks={day.smallTasks} filled={smallFilled} />
          </div>
        )}
      </div>
    )
  }

  // Compact Card View (for overview section)
  return (
    <div className="bg-surface-container-low rounded-2xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
            {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
          </span>
          <h2 className="text-xl font-black text-on-surface">{day.date}</h2>
        </div>
        {totalTasks > 0 && (
          <span className={`text-lg font-mono font-bold ${progress === 100 ? 'text-tertiary' : 'text-on-surface-variant'}`}>
            {progress}%
          </span>
        )}
      </div>
      
      {totalTasks > 0 ? (
        <div className="space-y-2">
          {day.highTask && (
            <div className={`p-3 rounded-xl ${day.highTask.status === 'done' ? 'bg-tertiary/10' : 'bg-secondary/10'} border ${day.highTask.status === 'done' ? 'border-tertiary/20' : 'border-secondary/20'}`}>
              <p className={`text-sm font-medium ${day.highTask.status === 'done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                {day.highTask.title}
              </p>
            </div>
          )}
          {day.mediumTasks.length > 0 && (
            <p className="text-xs text-on-surface-variant">
              +{day.mediumTasks.length} medium tasks
            </p>
          )}
          {day.smallTasks.length > 0 && (
            <p className="text-xs text-on-surface-variant/60">
              +{day.smallTasks.length} quick wins
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant/40">No tasks planned</p>
      )}
    </div>
  )
}
