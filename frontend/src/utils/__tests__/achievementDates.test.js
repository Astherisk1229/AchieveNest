import { describe, expect, it } from 'vitest'
import { formatDate, formatDateRange, formatDateTime } from '../achievementDates'

describe('achievement date display', () => {
  it('formats plain dates without a time-zone shift', () => {
    expect(formatDate('2026-05-28')).toBe('May 28, 2026')
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026')
    expect(formatDate('')).toBe('')
    expect(formatDate('not a date')).toBe('')
  })

  it('formats ranges compactly', () => {
    expect(formatDateRange('2026-05-28', null)).toBe('May 28, 2026')
    expect(formatDateRange('2026-05-28', '2026-05-28')).toBe('May 28, 2026')
    expect(formatDateRange('2026-05-28', '2026-05-30')).toBe('May 28 – 30, 2026')
    expect(formatDateRange('2026-05-28', '2026-06-02')).toBe('May 28 – Jun 2, 2026')
    expect(formatDateRange('2025-12-30', '2026-01-02')).toBe('Dec 30, 2025 – Jan 2, 2026')
    expect(formatDateRange('', '2026-01-02')).toBe('')
  })

  it('formats database timestamps for "saved" labels', () => {
    expect(formatDateTime('2026-09-30 14:42:30.000000')).toBe('Sep 30, 2026, 2:42 PM')
    expect(formatDateTime('2026-09-30 00:05:00')).toBe('Sep 30, 2026, 12:05 AM')
    expect(formatDateTime('2026-09-30')).toBe('Sep 30, 2026')
  })
})
