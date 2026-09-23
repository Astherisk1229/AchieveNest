import { describe, expect, it } from 'vitest'
import { PERSONNEL_PORTFOLIO_FORMATS, resolvePersonnelPortfolioFormat } from '../personnelPortfolioFormat'

describe('Personnel portfolio format resolver', () => {
  it('routes only canonical academic faculty to the Faculty Academic format', () => {
    expect(resolvePersonnelPortfolioFormat({ personnel_group: 'faculty', organizational_side: 'academic' })).toBe(PERSONNEL_PORTFOLIO_FORMATS.FACULTY_ACADEMIC)
    expect(resolvePersonnelPortfolioFormat({ personnel_group: 'faculty', organizational_side: 'non_academic' })).toBe(PERSONNEL_PORTFOLIO_FORMATS.NON_TEACHING)
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
})
