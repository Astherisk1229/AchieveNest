/**
 * eventSchedule.js
 * Pure, deterministic Event schedule utilities for AchieveNest.
 * Preserves institutional local wall-clock time without UTC shift.
 */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function parseDateString(dateStr) {
  if (!dateStr) return null
  const match = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function formatDateToYMD(d) {
  if (!d) return ''
  if (typeof d === 'string') {
    const match = d.trim().match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
  }
  if (!(d instanceof Date) || isNaN(d)) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateHeading(dateStr) {
  const d = parseDateString(dateStr)
  if (!d) return dateStr || ''
  const dayName = DAY_NAMES[d.getDay()]
  const monthName = MONTH_SHORT[d.getMonth()]
  const dayNum = d.getDate()
  const year = d.getFullYear()
  return `${dayName}, ${monthName} ${dayNum}, ${year}`
}

export function format12HourTime(hhmm) {
  if (!hhmm) return ''
  const s = String(hhmm).trim()
  const match = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/)
  if (!match) return s

  let hour = Number(match[1])
  const minute = match[2]
  const suffix = hour >= 12 ? 'PM' : 'AM'

  hour = hour % 12
  if (hour === 0) hour = 12

  return `${hour}:${minute} ${suffix}`
}

export function parseTo24Hour(timeStr, defaultVal = '09:00') {
  if (!timeStr) return defaultVal
  const s = String(timeStr).trim()

  // 12-hour format e.g. "9:00 AM" or "09:30 PM"
  const twelveHour = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (twelveHour) {
    let hour = Number(twelveHour[1])
    const minute = twelveHour[2]
    const suffix = twelveHour[3].toUpperCase()

    if (suffix === 'AM') {
      if (hour === 12) hour = 0
    } else if (hour !== 12) {
      hour += 12
    }
    return `${String(hour).padStart(2, '0')}:${minute}`
  }

  // 24-hour format e.g. "09:00" or "2026-10-15 09:00:00"
  const twentyFourHour = s.match(/[ T]?(\d{1,2}):(\d{2})/)
  if (twentyFourHour) {
    const h = String(Number(twentyFourHour[1])).padStart(2, '0')
    const m = twentyFourHour[2]
    return `${h}:${m}`
  }

  return defaultVal
}

export function combineDateAndTime(dateStr, timeStr) {
  const date = String(dateStr ?? '').trim()
  const time = parseTo24Hour(timeStr)
  return `${date} ${time}:00`
}

export function getNextDayDate(dateStr) {
  const d = parseDateString(dateStr)
  if (!d) return ''
  d.setDate(d.getDate() + 1)
  return formatDateToYMD(d)
}

export function getSmartDefaultEndTime(startDate, startTime) {
  const sDate = String(startDate ?? '').trim()
  const sTime = parseTo24Hour(startTime, '09:00')

  const [hStr, mStr] = sTime.split(':')
  let hour = Number(hStr)
  let minute = Number(mStr)

  // Add 1 hour
  hour += 1

  if (hour >= 24) {
    hour = hour % 24
    const nextDate = getNextDayDate(sDate)
    return {
      endDate: nextDate,
      endTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }
  }

  return {
    endDate: sDate,
    endTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
}

/** Returns the next half-hour slot and its one-hour default duration in local wall-clock time. */
export function getDefaultEventSchedule(now = new Date()) {
  const start = new Date(now)
  start.setSeconds(0, 0)
  start.setMinutes(Math.floor(start.getMinutes() / 30) * 30 + 30)

  const startDate = formatDateToYMD(start)
  const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
  const end = getSmartDefaultEndTime(startDate, startTime)

  return { startDate, startTime, ...end }
}

/** True when a local date/time is not a future event start. */
export function isDateTimeInPastOrNow(dateStr, timeStr, now = new Date()) {
  const date = parseDateString(dateStr)
  const time = parseTo24Hour(timeStr, '')
  if (!date || !time) return false

  const [hours, minutes] = time.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date.getTime() <= now.getTime()
}

export function calculateDuration(startDate, startTime, endDate, endTime) {
  if (!startDate || !startTime || !endDate || !endTime) {
    return {
      isValid: false,
      totalMinutes: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      isOvernight: false,
      isMultiDay: false,
      error: 'Incomplete schedule details.'
    }
  }

  const sTime = parseTo24Hour(startTime)
  const eTime = parseTo24Hour(endTime)

  const startCombined = `${startDate} ${sTime}:00`
  const endCombined = `${endDate} ${eTime}:00`

  const startMs = new Date(startDate.replace(/-/g, '/') + ' ' + sTime).getTime()
  const endMs = new Date(endDate.replace(/-/g, '/') + ' ' + eTime).getTime()

  if (isNaN(startMs) || isNaN(endMs)) {
    return {
      isValid: false,
      totalMinutes: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      isOvernight: false,
      isMultiDay: false,
      error: 'Invalid date or time format.'
    }
  }

  if (endMs <= startMs) {
    const isSameDate = startDate === endDate
    const canSetNextDay = isSameDate && eTime < sTime

    return {
      isValid: false,
      totalMinutes: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      isOvernight: false,
      isMultiDay: false,
      canSetNextDay,
      error: isSameDate
        ? (eTime === sTime ? 'End time must be later than the start time.' : 'End time is earlier than the start time.')
        : 'End date cannot be before the start date.'
    }
  }

  const diffMinutes = Math.round((endMs - startMs) / 60000)
  const days = Math.floor(diffMinutes / 1440)
  const hours = Math.floor((diffMinutes % 1440) / 60)
  const minutes = diffMinutes % 60
  const totalHours = Number((diffMinutes / 60).toFixed(1))

  const isOvernight = (days === 0 && startDate !== endDate) || (days === 1 && hours < 24 && startDate !== endDate)
  const isMultiDay = days >= 1

  return {
    isValid: true,
    totalMinutes: diffMinutes,
    totalHours,
    days,
    hours,
    minutes,
    isOvernight,
    isMultiDay,
    canSetNextDay: false,
    error: null
  }
}

export function formatScheduleDuration(startDate, startTime, endDate, endTime) {
  const dur = calculateDuration(startDate, startTime, endDate, endTime)
  if (!dur.isValid) return ''

  const { days, hours, minutes, isOvernight, totalHours } = dur

  const parts = []
  if (days === 1) parts.push('1 day')
  else if (days > 1) parts.push(`${days} days`)

  if (hours === 1) parts.push('1 hour')
  else if (hours > 1) parts.push(`${hours} hours`)

  if (minutes > 0) parts.push(`${minutes} mins`)

  let durationText = parts.length > 0 ? parts.join(', ') : `${totalHours} hours`

  if (isOvernight && days <= 1) {
    if (days === 0 && hours > 0) {
      durationText = `${hours} ${hours === 1 ? 'hour' : 'hours'} · Ends the following day`
    } else if (days === 1 && hours === 0 && minutes === 0) {
      durationText = '24 hours'
    } else if (days === 1) {
      durationText = `${parts.join(', ')} · Ends the following day`
    }
  }

  return durationText
}

export function formatDisplaySchedule(startDate, startTime, endDate, endTime) {
  if (!startDate || !startTime) return ''

  const sTime12 = format12HourTime(startTime)
  const eTime12 = format12HourTime(endTime)

  if (!endDate || startDate === endDate) {
    const heading = formatDateHeading(startDate)
    return `${heading} · ${sTime12} - ${eTime12}`
  }

  // Overnight or multi-day
  const startHeading = formatDateHeading(startDate)
  const endHeading = formatDateHeading(endDate)
  return `${startHeading}, ${sTime12} – ${endHeading}, ${eTime12}`
}

export function validateSchedule(startDate, startTime, endDate, endTime) {
  if (!startDate) {
    return { isValid: false, error: 'Select an event start date.', canSetNextDay: false }
  }
  if (!startTime) {
    return { isValid: false, error: 'Select a start time.', canSetNextDay: false }
  }
  if (!endDate) {
    return { isValid: false, error: 'Select an event end date.', canSetNextDay: false }
  }
  if (!endTime) {
    return { isValid: false, error: 'Select an end time.', canSetNextDay: false }
  }

  const dur = calculateDuration(startDate, startTime, endDate, endTime)
  return {
    isValid: dur.isValid,
    error: dur.error,
    canSetNextDay: dur.canSetNextDay
  }
}
