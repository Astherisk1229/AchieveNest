import { describe, expect, it } from 'vitest'
import {
  PERSONNEL_PORTFOLIO_FORMATS,
  isPersonnelAreaEntryAllowed,
  resolvePersonnelPortfolioFormat
} from '../personnelPortfolioFormat'

describe('Personnel portfolio format resolver', () => {
  it('routes Faculty by personnel group regardless of the legacy side', () => {
    expect(resolvePersonnelPortfolioFormat({ personnel_group: 'faculty', organizational_side: 'academic' })).toBe(PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC)
    expect(resolvePersonnelPortfolioFormat({ personnel_group: 'faculty', organizational_side: 'non_academic' })).toBe(PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC)
  })

  it('preserves the two-group model for non-teaching faculty on either side', () => {
    expect(resolvePersonnelPortfolioFormat({ personnel_group: 'non_teaching_faculty', organizational_side: 'academic' })).toBe(PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING)
    expect(resolvePersonnelPortfolioFormat({ personnel_group: 'non_teaching_faculty', organizational_side: 'non_academic' })).toBe(PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING)
  })

  it('uses the immutable submission snapshot ahead of the current profile', () => {
    expect(resolvePersonnelPortfolioFormat(
      { personnel_group: 'faculty', organizational_side: 'academic' },
      { personnel_group_at_submission: 'non_teaching_faculty', organizational_side_at_submission: 'academic' }
    )).toBe(PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING)
  })

  it('keeps Area A read-only for non-teaching faculty even without workspace configuration', () => {
    const nonTeaching = { personnel_group: 'non_teaching_faculty', organizational_side: 'academic' }

    expect(isPersonnelAreaEntryAllowed(nonTeaching, 'A')).toBe(false)
    expect(isPersonnelAreaEntryAllowed(nonTeaching, 'B')).toBe(true)
    expect(isPersonnelAreaEntryAllowed(nonTeaching, 'C')).toBe(true)
  })

  it('honors evaluator-only and read-only policies for every personnel format', () => {
    const academic = { personnel_group: 'faculty', organizational_side: 'academic' }

    expect(isPersonnelAreaEntryAllowed(academic, 'A', { entry_policy: 'evaluator_only' })).toBe(false)
    expect(isPersonnelAreaEntryAllowed(academic, 'B', { is_personnel_entry_allowed: false })).toBe(false)
  })
})
