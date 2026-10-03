import { describe, it, expect } from 'vitest'
import { formatOrganizationNameSuggestion } from '../../../utils/nameFormatter'

describe('Plan 02 Phase 6 — Organization Name Formatting Utility & Rules', () => {
  it('capitalizes meaningful words in lowercase input', () => {
    expect(
      formatOrganizationNameSuggestion('association of information technology students')
    ).toBe('Association of Information Technology Students')
  })

  it('keeps connector words lowercase in non-leading positions', () => {
    expect(
      formatOrganizationNameSuggestion('society OF computer studies')
    ).toBe('Society of Computer Studies')
    expect(
      formatOrganizationNameSuggestion('students FOR environmental awareness')
    ).toBe('Students for Environmental Awareness')
    expect(
      formatOrganizationNameSuggestion('college OF arts AND sciences')
    ).toBe('College of Arts and Sciences')
  })

  it('capitalizes connector words if they appear as the first word', () => {
    expect(
      formatOrganizationNameSuggestion('the student council')
    ).toBe('The Student Council')
    expect(
      formatOrganizationNameSuggestion('of minds and leaders')
    ).toBe('Of Minds and Leaders')
  })

  it('preserves explicit all-caps acronyms inside organization names', () => {
    expect(
      formatOrganizationNameSuggestion('PSITS student chapter')
    ).toBe('PSITS Student Chapter')
    expect(
      formatOrganizationNameSuggestion('NDMU association of IT students')
    ).toBe('NDMU Association of IT Students')
    expect(
      formatOrganizationNameSuggestion('JPIA student guild')
    ).toBe('JPIA Student Guild')
  })

  it('trims and collapses repeated whitespace', () => {
    expect(
      formatOrganizationNameSuggestion('  Association   of   IT Students  ')
    ).toBe('Association of IT Students')
  })

  it('preserves punctuation including apostrophes, ampersands, and dashes', () => {
    expect(
      formatOrganizationNameSuggestion("students' organization")
    ).toBe("Students' Organization")
    expect(
      formatOrganizationNameSuggestion('arts & sciences council')
    ).toBe('Arts & Sciences Council')
    expect(
      formatOrganizationNameSuggestion('PSITS - NDMU chapter')
    ).toBe('PSITS - NDMU Chapter')
    expect(
      formatOrganizationNameSuggestion('PSITS – NDMU chapter')
    ).toBe('PSITS – NDMU Chapter')
  })

  it('handles hyphenated words without lowercasing second segment', () => {
    expect(
      formatOrganizationNameSuggestion('socio-cultural organization')
    ).toBe('Socio-Cultural Organization')
    expect(
      formatOrganizationNameSuggestion('student-led initiative')
    ).toBe('Student-Led Initiative')
  })

  it('handles slash-separated abbreviations safely', () => {
    expect(
      formatOrganizationNameSuggestion('IT/CS student society')
    ).toBe('IT/CS Student Society')
    expect(
      formatOrganizationNameSuggestion('arts/culture organization')
    ).toBe('Arts/Culture Organization')
  })

  it('preserves parentheses and qualifiers', () => {
    expect(
      formatOrganizationNameSuggestion('Association of Information Technology Students (AITS)')
    ).toBe('Association of Information Technology Students (AITS)')
  })

  it('preserves numeric and alphanumeric terms', () => {
    expect(
      formatOrganizationNameSuggestion('21st century leaders')
    ).toBe('21st Century Leaders')
    expect(
      formatOrganizationNameSuggestion('IT 3A class organization')
    ).toBe('IT 3A Class Organization')
  })

  it('returns empty string on empty or whitespace-only input', () => {
    expect(formatOrganizationNameSuggestion('')).toBe('')
    expect(formatOrganizationNameSuggestion('   ')).toBe('')
    expect(formatOrganizationNameSuggestion(null)).toBe('')
    expect(formatOrganizationNameSuggestion(undefined)).toBe('')
  })
})
