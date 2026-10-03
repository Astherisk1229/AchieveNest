import { describe, expect, it } from 'vitest'
import {
  filterPrograms,
  getProgramLabel,
  isInstitutionalEmail,
  normalizeInstitutionalEmail,
  sanitizePersonName,
  sanitizeStudentNumber
} from '../studentRegistrationValidation'

describe('Student registration input contract', () => {
  it('keeps only Student Number digits and enforces the visible maximum', () => {
    expect(sanitizeStudentNumber('2026-10A492')).toBe('202610492')
    expect(sanitizeStudentNumber('1'.repeat(55))).toHaveLength(50)
  })

  it('preserves Unicode name characters and approved punctuation', () => {
    expect(sanitizePersonName("Jo123hn@@ O’Neil-Santos.")).toBe("John O’Neil-Santos.")
    expect(sanitizePersonName('María José')).toBe('María José')
  })

  it('normalizes email without guessing missing address components', () => {
    expect(normalizeInstitutionalEmail('  STUDENT.NAME @NDMU.EDU.PH ')).toBe('student.name@ndmu.edu.ph')
    expect(isInstitutionalEmail('student.name@ndmu.edu.ph')).toBe(true)
    expect(isInstitutionalEmail('student.name@gmail.com')).toBe(false)
  })

  it('returns only active Programs from the selected College and searches code or name', () => {
    const programs = [
      { id: '1', code: 'BSIT', name: 'Bachelor of Science in Information Technology', college_id: 'c1', status: 'active' },
      { id: '2', code: 'BSCS', name: 'Computer Science', college_id: 'c1', status: 'inactive' },
      { id: '3', code: 'BSIT', name: 'Information Technology', college_id: 'c2', status: 'active' }
    ]
    expect(filterPrograms(programs, 'c1', 'info').map((program) => program.id)).toEqual(['1'])
    expect(filterPrograms(programs, 'c1', 'BSIT').map((program) => program.id)).toEqual(['1'])
    expect(getProgramLabel(programs[0])).toBe('BSIT — Bachelor of Science in Information Technology')
  })
})
