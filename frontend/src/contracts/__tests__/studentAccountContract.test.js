import { describe, expect, it } from 'vitest'
import {
  STUDENT_SUFFIX_OPTIONS,
  isActiveAcademicReference,
  isValidStudentName,
  normalizeInstitutionalEmail,
  programBelongsToCollege,
  sanitizeStudentName,
  sanitizeStudentNumber
} from '../studentAccountContract'

describe('studentAccountContract provisioning helpers', () => {
  it('keeps only digits in Student Number input', () => {
    expect(sanitizeStudentNumber(' 2026-10A492 ')).toBe('202610492')
  })

  it('normalizes institutional email input', () => {
    expect(normalizeInstitutionalEmail('  JUAN.DELA CRUZ@NDMU.EDU.PH ')).toBe('juan.delacruz@ndmu.edu.ph')
  })

  it('preserves legitimate name punctuation while dropping digits and unrelated symbols', () => {
    expect(sanitizeStudentName("  Mary-Anne O'Neil123@ ")).toBe(" Mary-Anne O'Neil ")
  })

  it('accepts Unicode names, apostrophes, hyphens, and initials while rejecting unrelated punctuation', () => {
    expect(isValidStudentName('María-José')).toBe(true)
    expect(isValidStudentName('D’Angelo')).toBe(true)
    expect(isValidStudentName('A.')).toBe(true)
    expect(isValidStudentName('Jo@n')).toBe(false)
    expect(isValidStudentName('', false)).toBe(true)
  })

  it('keeps only active academic references and enforces College ownership', () => {
    expect(isActiveAcademicReference({ status: 'active' })).toBe(true)
    expect(isActiveAcademicReference({ status: 'inactive' })).toBe(false)
    expect(isActiveAcademicReference({ is_active: 0 })).toBe(false)
    expect(programBelongsToCollege({ college_id: 'college-a' }, 'college-a')).toBe(true)
    expect(programBelongsToCollege({ college_id: 'college-b' }, 'college-a')).toBe(false)
  })

  it('exposes canonical suffix values', () => {
    expect(STUDENT_SUFFIX_OPTIONS).toEqual(['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'])
  })
})
