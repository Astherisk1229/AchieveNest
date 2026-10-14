import { describe, expect, it } from 'vitest'
import {
  calculateDuration,
  combineDateAndTime,
  format12HourTime,
  formatDateHeading,
  formatDisplaySchedule,
  formatScheduleDuration,
  getDefaultEventSchedule,
  getNextDayDate,
  getSmartDefaultEndTime,
  isDateTimeInPastOrNow,
  parseTo24Hour,
  validateSchedule
} from '../eventSchedule'

describe('eventSchedule utilities', () => {
  it('1. calculates same-day valid schedule and 2-hour duration', () => {
    const dur = calculateDuration('2026-06-24', '09:00', '2026-06-24', '11:00')
    expect(dur.isValid).toBe(true)
    expect(dur.totalHours).toBe(2)
    expect(dur.days).toBe(0)
    expect(dur.hours).toBe(2)
    expect(dur.isOvernight).toBe(false)
    expect(formatScheduleDuration('2026-06-24', '09:00', '2026-06-24', '11:00')).toBe('2 hours')
  })

  it('2. calculates overnight valid schedule with next day label', () => {
    const dur = calculateDuration('2026-06-24', '21:00', '2026-06-25', '03:00')
    expect(dur.isValid).toBe(true)
    expect(dur.totalHours).toBe(6)
    expect(dur.isOvernight).toBe(true)
    expect(formatScheduleDuration('2026-06-24', '21:00', '2026-06-25', '03:00')).toBe('6 hours · Ends the following day')
  })

  it('3. calculates multi-day valid schedule duration', () => {
    const dur = calculateDuration('2026-06-24', '09:00', '2026-06-26', '13:00')
    expect(dur.isValid).toBe(true)
    expect(dur.days).toBe(2)
    expect(dur.hours).toBe(4)
    expect(dur.isMultiDay).toBe(true)
    expect(formatScheduleDuration('2026-06-24', '09:00', '2026-06-26', '13:00')).toBe('2 days, 4 hours')
  })

  it('4. rejects same date + earlier End and flags next day availability', () => {
    const val = validateSchedule('2026-06-24', '09:00', '2026-06-24', '03:00')
    expect(val.isValid).toBe(false)
    expect(val.error).toBe('End time is earlier than the start time.')
    expect(val.canSetNextDay).toBe(true)
  })

  it('5. rejects same date + equal End time', () => {
    const val = validateSchedule('2026-06-24', '09:00', '2026-06-24', '09:00')
    expect(val.isValid).toBe(false)
    expect(val.error).toBe('End time must be later than the start time.')
    expect(val.canSetNextDay).toBe(false)
  })

  it('6. rejects End Date earlier than Start Date', () => {
    const val = validateSchedule('2026-06-25', '09:00', '2026-06-24', '15:00')
    expect(val.isValid).toBe(false)
    expect(val.error).toBe('End date cannot be before the start date.')
    expect(val.canSetNextDay).toBe(false)
  })

  it('7. generates smart default End Time = Start + 1 hour', () => {
    const def = getSmartDefaultEndTime('2026-06-24', '09:00')
    expect(def).toEqual({
      endDate: '2026-06-24',
      endTime: '10:00'
    })
  })

  it('8. generates smart default rollover to next day for 23:30 Start', () => {
    const def = getSmartDefaultEndTime('2026-06-24', '23:30')
    expect(def).toEqual({
      endDate: '2026-06-25',
      endTime: '00:30'
    })
  })

  it('9. defaults a new event to the next available local time slot', () => {
    const now = new Date(2026, 9, 5, 10, 7, 15)
    expect(getDefaultEventSchedule(now)).toEqual({
      startDate: '2026-10-05',
      startTime: '10:30',
      endDate: '2026-10-05',
      endTime: '11:30'
    })
    expect(isDateTimeInPastOrNow('2026-10-05', '10:00', now)).toBe(true)
    expect(isDateTimeInPastOrNow('2026-10-05', '10:30', now)).toBe(false)
  })

  it('10. simulates untouched vs touched state for automatic End shifting', () => {
    let endScheduleTouched = false
    let schedule = {
      startDate: '2026-06-24',
      startTime: '09:00',
      endDate: '2026-06-24',
      endTime: '10:00'
    }

    // When untouched, changing Start shifts End
    const onStartChange = (newStart) => {
      schedule.startTime = newStart
      if (!endScheduleTouched) {
        const def = getSmartDefaultEndTime(schedule.startDate, newStart)
        schedule.endDate = def.endDate
        schedule.endTime = def.endTime
      }
    }

    onStartChange('10:00')
    expect(schedule.endTime).toBe('11:00')

    // When touched, changing Start preserves manually chosen End
    endScheduleTouched = true
    schedule.endTime = '14:00'

    onStartChange('11:00')
    expect(schedule.endTime).toBe('14:00') // Preserved!
  })

  it('11. next-day date helper advances date accurately', () => {
    expect(getNextDayDate('2026-06-24')).toBe('2026-06-25')
    expect(getNextDayDate('2026-12-31')).toBe('2027-01-01')
  })

  it('12. formats human-friendly schedule display strings', () => {
    expect(formatDisplaySchedule('2026-06-24', '09:00', '2026-06-24', '11:00'))
      .toBe('Wed, Jun 24, 2026 · 9:00 AM - 11:00 AM')

    expect(formatDisplaySchedule('2026-06-24', '21:00', '2026-06-25', '03:00'))
      .toBe('Wed, Jun 24, 2026, 9:00 PM – Thu, Jun 25, 2026, 3:00 AM')
  })

  it('13. serializes local datetime without UTC shift', () => {
    const startSerialized = combineDateAndTime('2026-06-24', '09:00')
    const endSerialized = combineDateAndTime('2026-06-25', '03:00')

    expect(startSerialized).toBe('2026-06-24 09:00:00')
    expect(endSerialized).toBe('2026-06-25 03:00:00')
  })
})
