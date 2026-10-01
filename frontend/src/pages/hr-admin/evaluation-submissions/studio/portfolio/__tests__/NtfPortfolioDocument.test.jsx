import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PortfolioNavigator from '../PortfolioNavigator'
import { calculateNTFScores } from '../../../evaluation/rating/NTFRatingEngine'

const render = (submission, items = []) => renderToStaticMarkup(
  <PortfolioNavigator submission={submission} evidenceItems={items} onSelectEvidence={() => {}}/>
)

describe('NTF portfolio document', () => {
  it('renders the complete empty NTF structure without Faculty leakage', () => {
    const html = render({ personnel_group: 'non_teaching_faculty', faculty_name: 'Demo Staff', tenure_years: 0 })
    expect(html).toContain('NON-TEACHING FACULTY PORTFOLIO')
    expect(html).toContain('A.1')
    expect(html).toContain('B.1.a')
    expect(html).toContain('B.2.c')
    expect(html).toContain('B.3 No. of Years at NDMU')
    expect(html).toContain('B.5')
    expect(html).toContain('No submitted evidence')
    expect(html).not.toContain('FACULTY DEVELOPMENT PROGRAM')
    expect(html).not.toContain('C. SERVICE AND LEADERSHIP')
  })

  it('shows locked Area A data and authoritative service history', () => {
    const items = [
      { id: 'a1', categoryArea: 'areaA', criterionCode: 'A.1', awardedPoints: 45 },
      { id: 'a2', categoryArea: 'areaA', criterionCode: 'A.2', awardedPoints: 9 },
      { id: 'a3', categoryArea: 'areaA', criterionCode: 'A.3', awardedPoints: 27 },
      { id: 'b4', categoryArea: 'areaB', criterionCode: 'B.4', title: 'Invited lecturer', verificationStatus: 'verified', ratingStatus: 'rated', awardedPoints: 5 },
    ]
    const html = render({ personnel_group: 'non_teaching_faculty', faculty_name: 'Demo Staff', tenure_years: 9 }, items)
    expect(html).toContain('45.00')
    expect(html).toContain('Locked')
    expect(html).toContain('4 / 10')
    expect(html).toContain('Invited lecturer')
  })

  it('keeps missing Area A pending and does not coerce it to zero', () => {
    const scores = calculateNTFScores([], 6)
    expect(scores.areaA.total).toBeNull()
    expect(scores.grandTotalAwarded).toBeNull()
    expect(scores.areaB.total).toBe(3)
  })

  it('preserves the Faculty document for Faculty personnel', () => {
    const html = render({ personnel_group: 'faculty', faculty_name: 'Demo Faculty' })
    expect(html).toContain('FACULTY DEVELOPMENT PROGRAM')
    expect(html).not.toContain('NON-TEACHING FACULTY PORTFOLIO')
  })
})
