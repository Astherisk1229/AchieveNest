import { describe, expect, it } from 'vitest'
import { formatEmploymentStartDate, localToday, validateEmploymentStartDate } from '../employmentDate'

describe('employment date utilities', () => {
  const today = new Date(2026, 8, 12)

  it('uses a local calendar date without UTC drift', () => expect(localToday(today)).toBe('2026-09-12'))
  it('requires a date for registration', () => expect(validateEmploymentStartDate('', { required: true, today })).toBe('Employment start date is required.'))
  it('permits a missing legacy date', () => expect(validateEmploymentStartDate('', { today })).toBe(''))
  it('rejects impossible and future dates', () => {
    expect(validateEmploymentStartDate('2026-02-30', { today })).toBe('Enter a valid employment start date.')
    expect(validateEmploymentStartDate('2026-09-13', { today })).toBe('Employment start date cannot be in the future.')
  })
  it('formats dates and missing values safely', () => {
    expect(formatEmploymentStartDate('2020-01-15')).toContain('2020')
    expect(formatEmploymentStartDate(null)).toBe('Not yet recorded')
  })
})
