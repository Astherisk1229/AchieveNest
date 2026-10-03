import { describe, it, expect } from 'vitest'
import {
  STUDENT_YEAR_LEVELS,
  STUDENT_SEX_OPTIONS,
  STUDENT_SEX_SELECT_OPTIONS,
  STUDENT_YEAR_LEVEL_SELECT_OPTIONS,
  formatStudentSexDisplay,
  compareAcademicYears,
  getAcademicYearValues
} from '../studentAccountContract'

describe('Plan 08 Phase 7 — Dependent UI & Reporting Consistency', () => {
  describe('Canonical Year Level Contract', () => {
    it('contains strictly 1st Year through 5th Year with no Graduate option', () => {
      expect(STUDENT_YEAR_LEVELS).toEqual([
        '1st Year',
        '2nd Year',
        '3rd Year',
        '4th Year',
        '5th Year'
      ])
      expect(STUDENT_YEAR_LEVELS).not.toContain('Graduate')
      expect(STUDENT_YEAR_LEVELS).not.toContain('6th Year')
    })

    it('provides valid select dropdown options with disabled placeholder', () => {
      const placeholder = STUDENT_YEAR_LEVEL_SELECT_OPTIONS[0]
      expect(placeholder.value).toBe('')
      expect(placeholder.disabled).toBe(true)
      expect(placeholder.label).toBe('Select Year Level')
      expect(STUDENT_YEAR_LEVEL_SELECT_OPTIONS.length).toBe(6)
    })
  })

  describe('Sex Display & Null Safety Helper', () => {
    it('renders canonical sex values verbatim', () => {
      expect(formatStudentSexDisplay('Male')).toBe('Male')
      expect(formatStudentSexDisplay('Female')).toBe('Female')
      expect(formatStudentSexDisplay('Prefer not to say')).toBe('Prefer not to say')
    })

    it('renders neutral default fallback for legacy null, undefined, or empty values', () => {
      expect(formatStudentSexDisplay(null)).toBe('Not yet provided')
      expect(formatStudentSexDisplay(undefined)).toBe('Not yet provided')
      expect(formatStudentSexDisplay('')).toBe('Not yet provided')
      expect(formatStudentSexDisplay('   ')).toBe('Not yet provided')
    })

    it('supports custom neutral display fallback for table rendering', () => {
      expect(formatStudentSexDisplay(null, '—')).toBe('—')
      expect(formatStudentSexDisplay(undefined, '—')).toBe('—')
      expect(formatStudentSexDisplay('', '—')).toBe('—')
    })
  })

  describe('Academic Year Numeric Chronological Sorting', () => {
    it('sorts academic years descending (newest-first) using numerical start year', () => {
      const list = ['2025-2026', '2027-2028', '2026-2027']
      const sorted = [...list].sort((a, b) => compareAcademicYears(a, b, true))
      expect(sorted).toEqual(['2027-2028', '2026-2027', '2025-2026'])
    })

    it('sorts academic years ascending (chronological) using numerical start year', () => {
      const list = ['2027-2028', '2025-2026', '2026-2027']
      const sorted = [...list].sort((a, b) => compareAcademicYears(a, b, false))
      expect(sorted).toEqual(['2025-2026', '2026-2027', '2027-2028'])
    })

    it('handles legacy edge cases without NaN failure', () => {
      expect(compareAcademicYears(null, '2026-2027')).toBeGreaterThan(0)
      expect(compareAcademicYears('2026-2027', '')).toBeLessThan(0)
    })
  })
})
