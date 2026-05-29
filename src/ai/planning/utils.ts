import type { DayOfWeek } from '../types'

export const ALL_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const DAY_SHORT_NAMES: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

/** Week order index — Monday = 0, Sunday = 6 */
export const WEEK_ORDER: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
}

/** Returns true when dayA comes before dayB in a Monday-anchored week. */
export function dayIsBefore(dayA: DayOfWeek, dayB: DayOfWeek): boolean {
  return WEEK_ORDER[dayA] < WEEK_ORDER[dayB]
}

/** Returns the day with the lowest pending count from a set of candidates. */
export function lightestDay(
  days: DayOfWeek[],
  pendingByDay: Partial<Record<DayOfWeek, number>>
): DayOfWeek | null {
  if (days.length === 0) return null
  return days.reduce(
    (lightest, day) =>
      (pendingByDay[day] ?? 0) < (pendingByDay[lightest] ?? 0) ? day : lightest,
    days[0]
  )
}
