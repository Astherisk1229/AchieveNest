/**
 * Client-side helpers for the HR service-history editor. The server is authoritative and re-validates
 * every rule (PersonnelServiceHistoryService, policy LOS-2026-10-v1); these checks only give early feedback.
 */
import { localToday } from './employmentDate'

export const CLASSIFICATION_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
]

export const BASIS_LABELS = {
  service_history: 'From HR service history',
  legacy_start_date: 'From employment start date — not yet verified by HR',
  part_time_no_history: 'Currently part-time — no full-time service recorded',
  unavailable: 'Not yet recorded',
}

export function classificationLabel(value) {
  return CLASSIFICATION_OPTIONS.find(option => option.value === value)?.label || 'Unknown'
}

export function emptyPeriod() {
  return { start_date: '', end_date: '', is_ongoing: false, classification: 'full_time', excluded: false, hr_reason: '', source_remarks: '' }
}

/** Server segment → editable row. */
export function toEditablePeriod(segment) {
  return {
    start_date: segment.start_date || '',
    end_date: segment.end_date || '',
    is_ongoing: Boolean(segment.is_ongoing),
    classification: segment.classification || 'full_time',
    excluded: segment.classification === 'full_time' && segment.countability === 'excluded',
    hr_reason: segment.hr_reason || '',
    source_remarks: segment.source_remarks || '',
  }
}

/** Editable rows → API payload segments. Part-time is always excluded server-side. */
export function toPayloadSegments(periods) {
  return periods.map(period => ({
    start_date: period.start_date,
    end_date: period.is_ongoing ? null : period.end_date || null,
    is_ongoing: Boolean(period.is_ongoing),
    classification: period.classification,
    countability: period.classification === 'part_time' ? 'excluded' : period.excluded ? 'excluded' : 'countable',
    hr_reason: period.hr_reason?.trim() || null,
    source_remarks: period.source_remarks?.trim() || null,
  }))
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
}

/**
 * Mirrors the server rules. Returns { rows: { [index]: message }, form: message|'' , changeReason: message|'' }.
 */
export function validateServiceHistory(periods, changeReason, today = localToday()) {
  const rows = {}
  let form = ''
  if (!periods.length) form = 'Add at least one employment period.'

  periods.forEach((period, index) => {
    let message = ''
    if (!isValidDate(period.start_date)) message = 'Enter a valid start date.'
    else if (period.start_date > today) message = 'Start date cannot be in the future.'
    else if (!period.is_ongoing && !period.end_date) message = 'Enter an end date or mark the period ongoing.'
    else if (!period.is_ongoing && !isValidDate(period.end_date)) message = 'Enter a valid end date.'
    else if (!period.is_ongoing && period.end_date < period.start_date) message = 'End date is before the start date.'
    else if (!period.is_ongoing && period.end_date > today) message = 'End date is in the future; mark the period ongoing instead.'
    else if (!['full_time', 'part_time'].includes(period.classification)) message = 'Choose Full-time or Part-time.'
    else if (period.classification === 'full_time' && period.excluded && !period.hr_reason?.trim()) message = 'Enter the HR reason for excluding this full-time period.'
    if (message) rows[index] = message
  })

  if (!form && !Object.keys(rows).length) {
    const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date))
    const ongoing = sorted.filter(period => period.is_ongoing)
    if (ongoing.length > 1) form = 'Only one employment period can be ongoing.'
    else if (ongoing.length === 1 && !sorted[sorted.length - 1].is_ongoing) form = 'The ongoing employment period must be the most recent one.'
    else {
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].start_date <= sorted[i - 1].end_date) { form = 'Employment periods must not overlap.'; break }
      }
    }
  }

  const reason = (changeReason || '').trim()
  const changeReasonError = !reason ? 'Enter the reason for this change.' : reason.length > 1000 ? 'The reason must not exceed 1,000 characters.' : ''
  return { rows, form, changeReason: changeReasonError, isValid: !form && !Object.keys(rows).length && !changeReasonError }
}

/** Maps an API error ({ code, message, field }) to the editor's error shape. */
export function apiErrorToFormErrors(apiError) {
  const error = apiError?.response?.data?.error || {}
  const match = /^segments\.(\d+)$/.exec(error.field || '')
  if (match) return { rows: { [Number(match[1])]: error.message }, form: '', changeReason: '' }
  if (error.code === 'CHANGE_REASON_REQUIRED' || error.code === 'CHANGE_REASON_TOO_LONG') return { rows: {}, form: '', changeReason: error.message }
  return { rows: {}, form: error.message || 'Service history could not be saved.', changeReason: '' }
}

export function formatServiceDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(parsed)
}

/* ---------- Onboarding (service history recorded with the new account) ---------- */

/** All new faculty appointments are full-time. */
export function onboardingCurrentType(_facultyEngagement) {
  return 'full_time'
}

/** Starting rows when HR says the person had earlier periods: one earlier period + the current appointment. */
export function initialOnboardingPeriods(startDate, facultyEngagement) {
  return [
    { ...emptyPeriod(), start_date: startDate || '', classification: 'full_time' },
    { ...emptyPeriod(), is_ongoing: true, classification: onboardingCurrentType(facultyEngagement) },
  ]
}

/** Applies the locked parts: first period starts on the Employment Start Date; last is the ongoing current appointment. */
export function normalizeOnboardingPeriods(periods, startDate, facultyEngagement) {
  const last = periods.length - 1
  return periods.map((period, index) => ({
    ...period,
    ...(index === 0 ? { start_date: startDate || '' } : {}),
    ...(index === last
      ? { is_ongoing: true, end_date: '', classification: onboardingCurrentType(facultyEngagement) }
      : { is_ongoing: false }),
  }))
}

/** Same rules as the server's buildOnboardingSegments(). Returns { rows, form, isValid }. */
export function validateOnboardingPeriods(periods, startDate, facultyEngagement, today = localToday()) {
  const normalized = normalizeOnboardingPeriods(periods, startDate, facultyEngagement)
  const result = validateServiceHistory(normalized, 'onboarding', today)
  let form = result.form
  if (!form && normalized.length < 2) form = 'Add the earlier period before the current appointment, or untick earlier periods.'
  const isValid = !form && !Object.keys(result.rows).length
  return { rows: result.rows, form, isValid }
}
