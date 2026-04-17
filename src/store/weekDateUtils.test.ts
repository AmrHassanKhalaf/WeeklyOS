import { describe, expect, it } from 'vitest'
import { getWeekInfoForDate, getWeekStartDaySerial } from './weekDateUtils'

describe('weekDateUtils', () => {
  it('keeps same custom week key across days inside one Saturday-start week', () => {
    const tz = 'Africa/Cairo'
    const weekStartDay = 'saturday'

    const apr18 = getWeekInfoForDate(new Date('2026-04-18T10:00:00Z'), tz, weekStartDay)
    const apr19 = getWeekInfoForDate(new Date('2026-04-19T10:00:00Z'), tz, weekStartDay)
    const apr24 = getWeekInfoForDate(new Date('2026-04-24T10:00:00Z'), tz, weekStartDay)

    expect(apr18.weekNumber).toBe(apr19.weekNumber)
    expect(apr18.year).toBe(apr19.year)
    expect(apr18.weekNumber).toBe(apr24.weekNumber)
  })

  it('changes week key at Saturday midnight in Cairo for Saturday-start weeks', () => {
    const tz = 'Africa/Cairo'
    const weekStartDay = 'saturday'

    const before = getWeekInfoForDate(new Date('2026-04-17T21:59:00Z'), tz, weekStartDay) // 23:59 Cairo
    const after = getWeekInfoForDate(new Date('2026-04-17T22:01:00Z'), tz, weekStartDay) // 00:01 Cairo

    expect(after.weekNumber).toBe(before.weekNumber + 1)
  })

  it('reconstructs week start from stored week key', () => {
    const tz = 'Africa/Cairo'
    const weekStartDay = 'monday'
    const info = getWeekInfoForDate(new Date('2026-01-08T12:00:00Z'), tz, weekStartDay)

    const serial = getWeekStartDaySerial(info.year, info.weekNumber, weekStartDay)
    expect(serial).toBe(info.weekStartDaySerial)
  })
})
