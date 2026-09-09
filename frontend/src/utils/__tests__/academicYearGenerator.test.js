import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateAcademicYearOptions,
  getAcademicYearValues,
  getDefaultAcademicYear,
  EARLIEST_ACADEMIC_YEAR_START
} from '../academicYearGenerator'

describe('academicYearGenerator Utility', () => {
  describe('generateAcademicYearOptions', () => {
    it('generates options from 2025 through 2026 sorted newest-first', () => {
      const options = generateAcademicYearOptions(2026, 2025)
      expect(options).toEqual([
        { value: '2026-2027', label: '2026-2027' },
        { value: '2025-2026', label: '2025-2026' }
      ])
    })

    it('generates options from 2025 through 2027 sorted newest-first', () => {
      const options = generateAcademicYearOptions(2027, 2025)
      expect(options).toEqual([
        { value: '2027-2028', label: '2027-2028' },
        { value: '2026-2027', label: '2026-2027' },
        { value: '2025-2026', label: '2025-2026' }
      ])
    })

    it('guarantees consecutive year pair integrity (end = start + 1)', () => {
      const options = generateAcademicYearOptions(2030, 2025)
      expect(options.length).toBe(6)
      options.forEach(opt => {
        const [start, end] = opt.value.split('-').map(Number)
        expect(end).toBe(start + 1)
        expect(opt.label).toBe(opt.value)
      })
    })

    it('strictly enforces the lower bound (no option earlier than 2025-2026)', () => {
      const options = generateAcademicYearOptions(2026, 2025)
      const oldestOption = options.at(-1)
      expect(oldestOption.value).toBe('2025-2026')
      expect(EARLIEST_ACADEMIC_YEAR_START).toBe(2025)
    })

    it('excludes future academic years beyond currentYear + 1', () => {
      const options = generateAcademicYearOptions(2026, 2025)
      const values = options.map(o => o.value)
      expect(values).not.toContain('2027-2028')
      expect(values).not.toContain('2028-2029')
    })

    it('returns empty array if anchor year is earlier than lower bound', () => {
      const options = generateAcademicYearOptions(2024, 2025)
      expect(options).toEqual([])
    })
  })

  describe('getAcademicYearValues', () => {
    it('returns an array of string values only', () => {
      const values = getAcademicYearValues(2026, 2025)
      expect(values).toEqual(['2026-2027', '2025-2026'])
    })
  })

  describe('getDefaultAcademicYear', () => {
    it('returns the latest academic year as the default selection', () => {
      expect(getDefaultAcademicYear(2026, 2025)).toBe('2026-2027')
      expect(getDefaultAcademicYear(2027, 2025)).toBe('2027-2028')
      expect(getDefaultAcademicYear(2025, 2025)).toBe('2025-2026')
    })
  })

  describe('Calendar Year Boundary Rollover', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('produces 2026-2027 as default on December 31, 2026', () => {
      vi.setSystemTime(new Date(2026, 11, 31, 12, 0, 0))
      const defaultAY = getDefaultAcademicYear()
      const values = getAcademicYearValues()
      expect(defaultAY).toBe('2026-2027')
      expect(values).toEqual(['2026-2027', '2025-2026'])
    })

    it('automatically rolls over to 2027-2028 on January 1, 2027 without code changes', () => {
      vi.setSystemTime(new Date(2027, 0, 1, 12, 0, 0))
      const defaultAY = getDefaultAcademicYear()
      const values = getAcademicYearValues()
      expect(defaultAY).toBe('2027-2028')
      expect(values).toEqual(['2027-2028', '2026-2027', '2025-2026'])
    })

  })
})
