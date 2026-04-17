import type { WeekStartDay } from './useSettingsStore'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const DAY_TO_INDEX: Record<WeekStartDay, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const WEEKDAY_SHORT_TO_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function daySerialFromCivil(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY)
}

function civilFromDaySerial(daySerial: number): { year: number; month: number; day: number } {
  const date = new Date(daySerial * MS_PER_DAY)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

function weekdayFromDaySerial(daySerial: number): number {
  return mod(daySerial + 4, 7)
}

function getZonedDateParts(date: Date, timeZone: string): { year: number; month: number; day: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  const weekdayText = (parts.find((part) => part.type === 'weekday')?.value || '').toLowerCase().slice(0, 3)
  const weekday = WEEKDAY_SHORT_TO_INDEX[weekdayText]

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || weekday === undefined) {
    throw new Error('Could not parse zoned date parts')
  }

  return { year, month, day, weekday }
}

function firstWeekStartDaySerial(year: number, weekStartDay: WeekStartDay): number {
  const jan1Serial = daySerialFromCivil(year, 1, 1)
  const jan1Weekday = weekdayFromDaySerial(jan1Serial)
  const shift = mod(jan1Weekday - DAY_TO_INDEX[weekStartDay], 7)
  return jan1Serial - shift
}

export function resolveEffectiveTimeZone(timeZone: string): string {
  try {
    const resolved = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
    new Intl.DateTimeFormat('en-US', { timeZone: resolved })
    return resolved
  } catch {
    return 'Africa/Cairo'
  }
}

export function getWeekInfoForDate(date: Date, timeZone: string, weekStartDay: WeekStartDay): {
  weekNumber: number
  year: number
  weekStartDaySerial: number
  todayIndex: number
  effectiveTimeZone: string
} {
  const effectiveTimeZone = resolveEffectiveTimeZone(timeZone)
  const zoned = getZonedDateParts(date, effectiveTimeZone)
  const todayDaySerial = daySerialFromCivil(zoned.year, zoned.month, zoned.day)

  const todayIndex = mod(zoned.weekday - DAY_TO_INDEX[weekStartDay], 7)
  const weekStartDaySerial = todayDaySerial - todayIndex

  const weekStartCivil = civilFromDaySerial(weekStartDaySerial)
  const firstWeekStart = firstWeekStartDaySerial(weekStartCivil.year, weekStartDay)
  const weekNumber = Math.floor((weekStartDaySerial - firstWeekStart) / 7) + 1

  return {
    weekNumber,
    year: weekStartCivil.year,
    weekStartDaySerial,
    todayIndex,
    effectiveTimeZone,
  }
}

export function getWeekStartDaySerial(year: number, weekNumber: number, weekStartDay: WeekStartDay): number {
  const firstWeekStart = firstWeekStartDaySerial(year, weekStartDay)
  return firstWeekStart + (weekNumber - 1) * 7
}

export function formatDaySerial(daySerial: number, timeZone: string, locale = 'en-US'): string {
  const date = new Date(daySerial * MS_PER_DAY)
  return date.toLocaleDateString(locale, {
    timeZone: resolveEffectiveTimeZone(timeZone),
    month: 'short',
    day: 'numeric',
  })
}
