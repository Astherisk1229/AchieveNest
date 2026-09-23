import { describe, expect, it } from 'vitest'
import {
  STUDENT_SUFFIX_OPTIONS,
  normalizeInstitutionalEmail,
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

  it('exposes canonical suffix values', () => {
    expect(STUDENT_SUFFIX_OPTIONS).toEqual(['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'])
  })
})
