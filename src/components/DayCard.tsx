import type { DayPlan, DayOfWeek } from '../store/useWeekStore'
import { useWeekStore } from '../store/useWeekStore'
import { useState, useEffect } from 'react'
import { CheckCircle2, CircleDashed, Trash2, Edit3 } from 'lucide-react'
import { cn } from '../lib/cn'
import { BidiLine, BidiText } from './ui/BidiText'

interface DayCardProps {
  day: DayPlan
  isCompact?: boolean
}

export function DayCard({ day, isCompact = false }: DayCardProps) {
  const updateDailyNote = useWeekStore(state => state.updateDailyNote)
  const deleteDayData = useWeekStore(state => state.deleteDayData)
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

  const progressColor =
    day.progress === 100
      ? 'bg-tertiary shadow-[0_0_12px_rgb(34_211_238_/_0.5)]'
      : day.isToday
        ? 'obsidian-gradient'
        : 'bg-primary/80'

  if (isCompact) {
    return (
      <div className="bg-surface-container-low/85 rounded-xl border border-outline-variant/20 p-6 opacity-80 hover:opacity-100 transition-opacity flex gap-6">
        <div className="text-center shrink-0">
          <h3 className="font-bold text-xl">{day.shortName}</h3>
          <p className="text-[10px] text-on-surface-variant">{day.date}</p>
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
          <div className={`h-full w-full origin-left ${progressColor}`} style={{ transform: `scaleX(${day.progress / 100})` }} />
          </div>
          {day.highTask && (
            <div>
              <p className="text-[9px] uppercase tracking-widest text-primary font-black mb-1">Strategic</p>
              <BidiText as="p" text={day.highTask.title} className="text-xs text-on-surface-variant italic" />
            </div>
          )}
        </div>
      </div>
    )
  }

  const isToday = day.isToday

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden flex flex-col md:flex-row transition-[background-color,border-color,transform] duration-300',
        isToday
          ? 'bg-surface-container/90 ring-1 ring-primary/35 shadow-[0_24px_60px_-22px_rgb(124_58_237_/_0.55)]'
          : 'bg-surface-container-low/85 border border-outline-variant/20 hover:border-primary/25 hover:shadow-[0_24px_50px_-22px_rgb(124_58_237_/_0.32)]',
      )}
    >
      {/* Today shimmer accent at the top edge */}
      {isToday && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgb(167 139 250 / 0.65), rgb(34 211 238 / 0.55), transparent)',
          }}
        />
      )}

      {/* Day column */}
      <div
        className={cn(
          'w-full md:w-32 p-6 flex md:flex-col justify-between items-center md:border-r border-b md:border-b-0 border-outline-variant/15 shrink-0 relative',
          isToday ? 'bg-primary/8' : 'bg-surface-container/40',
        )}
      >
        {isToday && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-primary/20 border border-primary/35 text-[8px] font-extrabold text-primary uppercase tracking-widest">
            Current
          </div>
        )}
        <div className="flex flex-col items-center">
          <h3 className={cn('font-extrabold text-2xl tracking-tight', isToday && 'gradient-text')}>
            {day.shortName}
          </h3>
          <p className="text-xs text-on-surface-variant">{day.date}</p>
        </div>

        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
            day.progress === 100
              ? 'bg-tertiary/15 ring-1 ring-tertiary/40 shadow-[0_0_18px_-2px_rgb(34_211_238_/_0.5)]'
              : 'bg-primary/10 ring-1 ring-primary/25',
          )}
        >
          {day.progress === 100 ? (
            <CheckCircle2 className="w-4 h-4 text-tertiary" strokeWidth={2} />
          ) : (
            <CircleDashed className="w-4 h-4 text-primary" strokeWidth={2} />
          )}
        </div>

        <button
          onClick={handleDeleteDay}
          className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-error/10 group focus-ring"
          title="Clear Day Data"
          aria-label={`Clear ${day.day} data`}
        >
          <Trash2 className="w-4 h-4 group-active:scale-90 transition-transform" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Progress bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-xs space-y-2">
            <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
              <span>Day Progress</span>
              <span className={cn(day.progress === 100 ? 'text-tertiary' : 'text-on-surface')}>
                {day.progress}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={cn('h-full w-full origin-left rounded-full transition-transform duration-500 ease-out', progressColor)}
                style={{ transform: `scaleX(${day.progress / 100})` }}
              />
            </div>
          </div>
        </div>

        {/* 3-col task grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {/* Strategic */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary mb-3 font-black flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgb(167_139_250_/_0.8)]" />
              Strategic
            </p>
            {day.highTask ? (
              <BidiText
                as="p"
                text={day.highTask.title}
                className={cn('text-sm leading-relaxed text-on-surface', isToday && 'font-semibold')}
              />
            ) : (
              <p className="text-xs text-on-surface-variant italic">No strategic task</p>
            )}
          </div>

          {/* Medium */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-secondary mb-3 font-black flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Medium
            </p>
            {day.mediumTasks.length > 0 ? (
              <ul className="text-xs space-y-2 text-on-surface/85">
                {day.mediumTasks.map(t => (
                  <BidiLine
                    key={t.id}
                    as="li"
                    text={t.title}
                    className={cn(
                      'flex items-center gap-2',
                      t.status === 'done' && 'line-through opacity-40',
                    )}
                  >
                    <div className="w-1 h-1 rounded-full bg-secondary/70 shrink-0" />
                    <span className="min-w-0 flex-1">{t.title}</span>
                  </BidiLine>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No medium priority tasks</p>
            )}
          </div>

          {/* Small Tasks */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-tertiary mb-3 font-black flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Tasks {day.smallTasks.length > 0 ? `(${day.smallTasks.length})` : ''}
            </p>
            {day.smallTasks.length > 0 ? (
              <ul className="text-xs space-y-2.5 text-on-surface">
                {day.smallTasks.map(t => (
                  <BidiLine
                    key={t.id}
                    as="li"
                    text={t.title}
                    className={cn('flex items-center gap-2 font-medium', t.status === 'pending' && 'opacity-60')}
                  >
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        t.status === 'done' ? 'bg-tertiary shadow-[0_0_6px_rgb(34_211_238_/_0.6)]' : 'bg-surface-variant',
                      )}
                    />
                    <span className="min-w-0 flex-1">{t.title}</span>
                  </BidiLine>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-on-surface-variant italic">No minor tasks listed</p>
            )}
          </div>
        </div>

        {/* Daily Note */}
        <div className="mt-8 pt-6 border-t border-outline-variant/15 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant/70">
            <span className="flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5" strokeWidth={2} />
              Daily Reflections / Constraints
            </span>
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            dir="auto"
            placeholder="What did you learn today? Any blockers?"
            className="input-base bidi-plaintext resize-none min-h-[80px] text-base sm:text-xs"
          />
        </div>
      </div>
    </div>
  )
}
