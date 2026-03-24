import type { DayPlan, DayOfWeek } from '../data/mockData'
import { useWeekStore } from '../store/useWeekStore'
import { useState, useEffect } from 'react'

interface DayCardProps {
  day: DayPlan
  isCompact?: boolean
}

export function DayCard({ day, isCompact = false }: DayCardProps) {
  const { updateDailyNote, deleteDayData } = useWeekStore()
  const [note, setNote] = useState(day.dailyNote || '')
  
  useEffect(() => {
    setNote(day.dailyNote || '')
  }, [day.dailyNote])

  const handleNoteBlur = () => {
    if (note !== (day.dailyNote || '')) {
      updateDailyNote(day.day as DayOfWeek, note)
    }
  }

  const handleDeleteDay = async () => {
    if (confirm(`Are you sure you want to clear all data for ${day.day}?`)) {
      await deleteDayData(day.day as DayOfWeek)
    }
  }

  const progressColor = day.progress === 100 ? 'bg-tertiary' : day.isToday ? 'obsidian-gradient' : 'bg-primary'

  if (isCompact) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 opacity-80 hover:opacity-100 transition-opacity flex gap-6">
        <div className="text-center shrink-0">
          <h3 className="font-bold text-xl">{day.shortName}</h3>
          <p className="text-[10px] text-on-surface-variant">{day.date}</p>
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className={`h-full ${progressColor}`} style={{ width: `${day.progress}%` }} />
          </div>
          {day.highTask && (
            <div>
              <p className="text-[9px] uppercase tracking-widest text-primary font-black mb-1">Strategic</p>
              <p className="text-xs text-on-surface-variant italic">{day.highTask.title}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const isToday = day.isToday

  return (
    <div
      className={`rounded-xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 ${
        isToday
          ? 'bg-surface-container-high ring-1 ring-primary/30 shadow-2xl shadow-primary/5'
          : 'bg-surface-container-low border border-white/5 hover:border-white/10'
      }`}
    >
      {/* Day column */}
      <div
        className={`w-full md:w-32 p-6 flex md:flex-col justify-between items-center border-b md:border-b-0 md:border-r border-white/5 shrink-0 relative ${
          isToday ? 'bg-primary/5' : 'bg-surface-container'
        }`}
      >
        {isToday && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-primary/20 text-[8px] font-bold text-primary uppercase">
            Current
          </div>
        )}
        <div className="flex flex-col items-center">
          <h3 className={`font-bold text-2xl ${isToday ? 'text-primary' : ''}`}>{day.shortName}</h3>
          <p className="text-xs text-on-surface-variant">{day.date}</p>
        </div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          day.progress === 100 ? 'bg-tertiary/10' : 'bg-primary/10'
        }`}>
          <span
            className={`material-symbols-outlined text-sm ${day.progress === 100 ? 'text-tertiary' : 'text-primary'}`}
            style={day.progress === 100 ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {day.progress === 100 ? 'check_circle' : 'pending'}
          </span>
        </div>

        <button 
          onClick={handleDeleteDay}
          className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-error/5 group"
          title="Clear Day Data"
        >
          <span className="material-symbols-outlined text-sm">delete_sweep</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Progress bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-xs space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span>Day Progress</span>
              <span>{day.progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className={`h-full ${progressColor}`} style={{ width: `${day.progress}%` }} />
            </div>
          </div>
        </div>

        {/* 3-col task grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {/* Strategic */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary mb-3 font-black">Strategic</p>
            {day.highTask ? (
              <p className={`text-sm leading-relaxed text-on-surface ${isToday ? 'font-semibold' : ''}`}>
                {day.highTask.title}
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No strategic task</p>
            )}
          </div>

          {/* Medium */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 font-black">Medium</p>
            {day.mediumTasks.length > 0 ? (
              <ul className="text-xs space-y-2 text-on-surface/80">
                {day.mediumTasks.map(t => (
                  <li key={t.id} className={`flex items-center gap-2 ${t.status === 'done' ? 'line-through opacity-40' : ''}`}>
                    <div className="w-1 h-1 rounded-full bg-secondary shrink-0" />
                    {t.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No medium priority tasks</p>
            )}
          </div>

          {/* Small Tasks */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 font-black">
              Tasks {day.smallTasks.length > 0 ? `(${day.smallTasks.length})` : ''}
            </p>
            {day.smallTasks.length > 0 ? (
              <ul className="text-xs space-y-2.5 text-on-surface">
                {day.smallTasks.map(t => (
                  <li key={t.id} className={`flex items-center gap-2 font-medium ${t.status === 'done' ? '' : 'opacity-60'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.status === 'done' ? 'bg-tertiary' : 'bg-surface-variant'}`} />
                    {t.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No minor tasks listed</p>
            )}
          </div>
        </div>

        {/* Daily Note Area */}
        <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">edit_note</span>
              Daily Reflections / Constraints
            </span>
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="What did you learn today? Any blockers?"
            className="w-full bg-surface-container-highest/30 border border-white/5 rounded-xl p-4 text-xs text-on-surface-variant outline-none focus:border-primary/30 transition-all resize-none min-h-[80px]"
          />
        </div>
      </div>
    </div>
  )
}
