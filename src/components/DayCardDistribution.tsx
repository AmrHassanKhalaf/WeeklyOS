import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DayPlan, Task, DayOfWeek, Priority } from '../data/mockData'
import { useWeekStore } from '../store/useWeekStore'
import { Button } from './ui/Button'
import { Trash2, Check, Pin, Clock, Hourglass, Leaf, Moon, Sparkles, Plus, ChevronDown, ChevronUp } from 'lucide-react'

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

const priorityConfig = {
  high: {
    label: 'High Impact',
    sublabel: 'Your main focus',
    color: 'secondary',
    bgClass: 'bg-secondary/10',
    borderClass: 'border-secondary/30',
    textClass: 'text-secondary',
    dotClass: 'bg-secondary',
    slots: 1,
  },
  medium: {
    label: 'Medium',
    sublabel: 'Supporting tasks',
    color: 'primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/30',
    textClass: 'text-primary',
    dotClass: 'bg-primary',
    slots: 3,
  },
  low: {
    label: 'Quick Wins',
    sublabel: 'Small victories',
    color: 'on-surface-variant',
    bgClass: 'bg-white/5',
    borderClass: 'border-white/10',
    textClass: 'text-on-surface-variant',
    dotClass: 'bg-on-surface-variant/50',
    slots: 5,
  },
}

function TaskItem({ task, priority, emptyHeight = 'h-14', onEmptyClick, showTags = true }: { 
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
      <motion.div 
        onClick={onEmptyClick} 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`
          ${emptyHeight} rounded-xl border-2 border-dashed border-white/10 
          flex items-center justify-center gap-2
          text-on-surface-variant/40 text-xs font-medium
          cursor-pointer hover:border-white/20 hover:bg-white/[0.02] 
          transition-all duration-200
        `}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        Add task
      </motion.div>
    )
  }

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${config.bgClass} border ${config.borderClass} rounded-xl p-4 space-y-3`}
      >
        <input
          ref={inputRef}
          value={editData.title}
          onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Task title..."
          className="w-full bg-transparent text-base font-bold text-on-surface outline-none placeholder:text-on-surface-variant/40"
        />
        <textarea
          value={editData.description}
          onChange={e => setEditData(p => ({ ...p, description: e.target.value }))}
          placeholder="Notes (optional)..."
          rows={2}
          className="w-full bg-transparent text-sm text-on-surface-variant outline-none resize-none placeholder:text-on-surface-variant/30"
        />
        <div className="flex gap-2">
          <input
            type="time"
            title="Start Time"
            value={editData.start}
            onChange={e => setEditData(p => ({ ...p, start: e.target.value }))}
            className="bg-surface-container-low rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40 flex-1 text-on-surface-variant [color-scheme:dark]"
          />
          <input
            value={editData.duration}
            title="Estimated Duration"
            onChange={e => setEditData(p => ({ ...p, duration: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="e.g. 2h"
            className="bg-surface-container-low rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40 w-24 text-on-surface-variant placeholder:text-on-surface-variant/30"
          />
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={editData.priority}
            onChange={e => setEditData(p => ({ ...p, priority: e.target.value as Priority }))}
            className="bg-surface-container-low text-sm text-on-surface-variant rounded-lg outline-none px-3 py-2 flex-1 border border-white/10"
          >
            <option value="high">High Impact</option>
            <option value="medium">Medium</option>
            <option value="low">Quick Win</option>
          </select>
          <select
            value={editData.day}
            onChange={e => setEditData(p => ({ ...p, day: e.target.value as DayOfWeek }))}
            className="bg-surface-container-low text-sm text-on-surface-variant rounded-lg outline-none px-3 py-2 flex-1 border border-white/10"
          >
            {DAYS_OPTIONS.map(d => (
              <option key={d} value={d}>{d[0].toUpperCase() + d.substring(1)}</option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t border-white/5">
          <button 
            onClick={() => deleteTask(task.id)} 
            className="text-xs text-error hover:bg-error/10 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)} 
              className="text-xs text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleSave()} 
              className={`text-xs ${config.bgClass} ${config.textClass} font-bold px-5 py-2 rounded-lg hover:opacity-80 transition-colors`}
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
      whileHover={{ scale: 1.01 }}
      className={`
        group relative p-4 rounded-xl border transition-all duration-200
        ${task.status === 'done' 
          ? 'bg-surface-container-low/50 border-white/5 opacity-70' 
          : `bg-surface-container-highest/80 border-white/10 hover:${config.borderClass}`
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={isToggling}
          className={`
            mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all
            ${task.status === 'done' 
              ? `${config.bgClass} ${config.borderClass} ${config.textClass}` 
              : `border-white/20 hover:${config.borderClass} text-transparent hover:text-white/30`
            }
            disabled:opacity-50
          `}
        >
          <Check className="w-3 h-3" strokeWidth={3} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsEditing(true)}>
          <div className="flex items-center gap-2">
            <span className={`
              text-sm font-semibold leading-tight
              ${task.status === 'done' ? 'line-through text-on-surface-variant' : 'text-on-surface'}
            `}>
              {task.title}
            </span>
            {task.type === 'pinned' && (
              <Pin className={`w-3 h-3 ${config.textClass}`} strokeWidth={2.5} />
            )}
          </div>
          
          {showTags && task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {task.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 bg-white/5 text-[10px] text-on-surface-variant rounded-full uppercase tracking-wider font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {task.description && (
            <p className="text-xs text-on-surface-variant/70 mt-1.5 line-clamp-2">{task.description}</p>
          )}
          
          {(task.startTime || task.estimatedTime) && (
            <div className={`flex gap-3 mt-2 text-[11px] ${config.textClass} font-medium`}>
              {task.startTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" strokeWidth={2} />
                  {task.startTime}
                </div>
              )}
              {task.estimatedTime && (
                <div className="flex items-center gap-1">
                  <Hourglass className="w-3 h-3" strokeWidth={2} />
                  {task.estimatedTime}
                </div>
              )}
            </div>
          )}
        </div>
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
      className={`${config.bgClass} border ${config.borderClass} rounded-xl p-4 space-y-3`}
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
      <div className="flex gap-2">
        <input
          type="time"
          value={editData.start}
          onChange={e => setEditData(p => ({ ...p, start: e.target.value }))}
          className="bg-surface-container-low rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40 flex-1 text-on-surface-variant [color-scheme:dark]"
        />
        <input
          value={editData.duration}
          onChange={e => setEditData(p => ({ ...p, duration: e.target.value }))}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 2h"
          className="bg-surface-container-low rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40 w-24 text-on-surface-variant placeholder:text-on-surface-variant/30"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button 
          onClick={onCancel} 
          className="text-xs text-on-surface-variant hover:text-on-surface px-4 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          className={`text-xs ${config.bgClass} ${config.textClass} font-bold px-5 py-2 rounded-lg hover:opacity-80 transition-colors border ${config.borderClass}`}
        >
          Create
        </button>
      </div>
    </motion.div>
  )
}

type AddingFor = { priority: Priority; day: DayOfWeek } | null

export function DayCardDistribution({ day, isHighOutputZone, showTags = true }: DayCardDistributionProps) {
  const { createTask, markDayComplete } = useWeekStore()
  const [addingFor, setAddingFor] = useState<AddingFor>(null)
  const [expandedSections, setExpandedSections] = useState<Record<Priority, boolean>>({
    high: true,
    medium: true,
    low: true,
  })

  const startAdd = (priority: Priority) => {
    setAddingFor({ priority, day: day.day as DayOfWeek })
    setExpandedSections(prev => ({ ...prev, [priority]: true }))
  }

  const toggleSection = (priority: Priority) => {
    setExpandedSections(prev => ({ ...prev, [priority]: !prev[priority] }))
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

  // Rest Day State
  if (day.isRestDay) {
    const isOverridingRest = addingFor?.day === day.day

    return (
      <div className="bg-gradient-to-br from-tertiary/5 to-surface-container-low rounded-2xl border border-tertiary/20 min-h-[420px] flex flex-col relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-tertiary/10 to-transparent rounded-full blur-3xl" />
        
        {/* Header */}
        <div className="p-6 border-b border-tertiary/10 flex items-center justify-between relative z-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-tertiary font-black">Rest Day</span>
            <h2 className="text-2xl font-black text-on-surface mt-1">{day.shortName} {day.date}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-tertiary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Body */}
        <div className={`flex-1 p-6 relative z-10 ${isOverridingRest ? 'overflow-y-auto' : 'flex flex-col items-center justify-center text-center'}`}>
          {!isOverridingRest ? (
            <>
              <div className="w-24 h-24 bg-tertiary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Moon className="w-12 h-12 text-tertiary" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-bold text-tertiary mb-2">Recovery Phase</h3>
              <p className="text-sm text-on-surface-variant/70 max-w-xs mb-8 leading-relaxed">
                Strategic downtime for cognitive restoration and preparation for the next cycle.
              </p>
              <button
                onClick={() => startAdd('low')}
                className="px-6 py-2.5 border border-tertiary/30 text-tertiary text-xs uppercase font-bold tracking-widest rounded-full hover:bg-tertiary/10 transition-all duration-200 hover:scale-105"
              >
                Override Rest
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-tertiary font-bold">Override Rest Day</p>
              <AnimatePresence mode="wait">
                {renderInlineForm('low')}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    )
  }

  // High Output Zone (if ever needed)
  if (isHighOutputZone) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-surface-container-low rounded-2xl border border-primary/20 min-h-[420px] flex flex-col">
        <div className="p-6 border-b border-primary/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-black">
              {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
            </span>
            <h2 className="text-2xl font-black text-on-surface mt-1">{day.date}</h2>
          </div>
          <Button
            type="button"
            onClick={() => markDayComplete(day.day as DayOfWeek)}
            size="sm"
            variant="secondary"
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            Complete Day
          </Button>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <Sparkles className="w-16 h-16 text-primary mb-4" strokeWidth={1} />
          <h3 className="text-primary font-bold uppercase tracking-widest text-sm mb-1">High Output Zone</h3>
          <p className="text-xs text-primary/60">Peak cognitive window</p>
        </div>
      </div>
    )
  }

  // Regular Day
  const highFilled = day.highTask ? 1 : 0
  const medFilled = day.mediumTasks.length
  const smallFilled = day.smallTasks.length
  const hasAnyTasks = highFilled > 0 || medFilled > 0 || smallFilled > 0

  // Calculate progress
  const totalTasks = (day.highTask ? 1 : 0) + day.mediumTasks.length + day.smallTasks.length
  const completedTasks = (day.highTask?.status === 'done' ? 1 : 0) + 
    day.mediumTasks.filter(t => t.status === 'done').length + 
    day.smallTasks.filter(t => t.status === 'done').length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const TaskSection = ({ priority, tasks, filled, slots }: { 
    priority: Priority
    tasks: Task[]
    filled: number
    slots: number 
  }) => {
    const config = priorityConfig[priority]
    const isExpanded = expandedSections[priority]
    const completedInSection = tasks.filter(t => t.status === 'done').length
    const singleTask = priority === 'high'

    return (
      <div className="space-y-3">
        {/* Section Header */}
        <button 
          onClick={() => toggleSection(priority)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${config.dotClass}`} />
            <div className="text-left">
              <span className={`text-xs font-bold uppercase tracking-widest ${config.textClass}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-on-surface-variant/50 ml-2">
                {config.sublabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-variant font-mono">
              {completedInSection}/{filled}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors" />
            )}
          </div>
        </button>

        {/* Section Content */}
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 overflow-hidden"
            >
              {singleTask ? (
                <>
                  <TaskItem 
                    task={day.highTask} 
                    priority={priority}
                    emptyHeight="h-20" 
                    onEmptyClick={() => startAdd(priority)} 
                    showTags={showTags} 
                  />
                  {renderInlineForm(priority)}
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
                  {/* Empty slots */}
                  {filled < slots && !addingFor && (
                    <TaskItem 
                      priority={priority}
                      onEmptyClick={() => startAdd(priority)} 
                      showTags={showTags} 
                    />
                  )}
                  {renderInlineForm(priority)}
                </>
              )}
              
              {/* Add more button if at capacity but section allows it */}
              {filled > 0 && filled < slots && !addingFor && (
                <button
                  onClick={() => startAdd(priority)}
                  className={`
                    w-full py-2 rounded-lg border-2 border-dashed ${config.borderClass} 
                    text-xs font-medium ${config.textClass} opacity-50 hover:opacity-100
                    flex items-center justify-center gap-1.5 transition-opacity
                  `}
                >
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                  Add another ({filled}/{slots})
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-low rounded-2xl border border-white/5 min-h-[420px] flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-on-surface-variant font-bold">
              {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
            </span>
            <h2 className="text-2xl font-black text-on-surface">{day.date}</h2>
          </div>
          <Button
            type="button"
            onClick={() => markDayComplete(day.day as DayOfWeek)}
            size="sm"
            variant="ghost"
            disabled={!hasAnyTasks}
            className="text-[10px] font-bold uppercase tracking-wider border border-white/10"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Done
          </Button>
        </div>
        
        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium text-on-surface-variant">
              <span>{completedTasks} of {totalTasks} complete</span>
              <span className={progress === 100 ? 'text-tertiary' : 'text-primary'}>{progress}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full ${progress === 100 ? 'bg-tertiary' : 'bg-gradient-to-r from-primary to-secondary'}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      {!hasAnyTasks && !addingFor ? (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => startAdd('high')}
          className="flex-1 p-6 flex flex-col items-center justify-center text-center cursor-pointer opacity-40 hover:opacity-70 transition-opacity"
        >
          <Plus className="w-10 h-10 mb-3 text-on-surface-variant" strokeWidth={1} />
          <p className="text-sm font-medium text-on-surface-variant">Start planning</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">Click to add your first task</p>
        </motion.div>
      ) : (
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-6">
          <TaskSection 
            priority="high" 
            tasks={day.highTask ? [day.highTask] : []} 
            filled={highFilled} 
            slots={1} 
          />
          <TaskSection 
            priority="medium" 
            tasks={day.mediumTasks} 
            filled={medFilled} 
            slots={3} 
          />
          <TaskSection 
            priority="low" 
            tasks={day.smallTasks} 
            filled={smallFilled} 
            slots={5} 
          />
        </div>
      )}
    </div>
  )
}
