import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import PortfolioNavigator from '../PortfolioNavigator'
import { calculateNTFScores } from '../../../evaluation/rating/NTFRatingEngine'

vi.mock('../../../../../../services/personnelAccomplishmentService', () => ({
  default: { getEvidenceBlobUrl: vi.fn(), downloadEvidenceBlob: vi.fn() }
}))

const render = (submission, items = [], props = {}) => renderToStaticMarkup(
  <PortfolioNavigator submission={submission} evidenceItems={items} onSelectEvidence={() => {}} {...props}/>
)
const ntp = (extra = {}) => ({ personnel_group: 'non_teaching_faculty', faculty_name: 'Demo Staff', ...extra })

describe('HR review shows the personnel Portfolio Booklet', () => {
  it('renders the Non-Teaching booklet (Appendix N) without Faculty leakage', () => {
    const html = render(ntp({ tenure_years: 0 }))
    expect(html).toContain('NON-TEACHING PERSONNEL PORTFOLIO')
    expect(html).toContain('A. PERFORMANCE AND PERSONAL INDICATORS')
    expect(html).toContain('B. SERVICE AND LEADERSHIP')
    expect(html).toContain('B.1.a Moderator / Officer of Clubs')
    expect(html).toContain('B.2.c Support to Charity and Community Projects')
    expect(html).toContain('B.3 Number of Years at NDMU')
    expect(html).toContain('B.5 Recognition / Meritorious Award')
    expect(html).toContain('No accomplishments recorded.')
    expect(html).not.toContain('FACULTY PORTFOLIO</h2>')
    expect(html).not.toContain('C. SERVICE AND LEADERSHIP')
  })

  it('places submitted items in their Appendix N sections and shows years of service', () => {
    const items = [
      { id: 'i1', category_area: 'areaB', criterion_code: 'B.1.a', criterion_key: 'B.1.1', item_description: 'Staff Association', scoring_payload: JSON.stringify({ category_metadata: { portfolio_format: 'non_teaching_faculty', criterion_code: 'B.1.a', details: { organization: 'Staff Association', assignment_role: 'OFFICER', organizer: 'HR Office' }, start_date: '2025-06-01', end_date: '2026-03-31' } }) },
      { id: 'i2', category_area: 'areaB', criterion_code: 'B.4', criterion_key: 'B.4.1', item_description: 'Records seminar', scoring_payload: { category_metadata: { portfolio_format: 'non_teaching_faculty', criterion_code: 'B.4', details: { engagement: 'Records seminar', role: 'LECTURER', organizer: 'DepEd' } } } },
    ]
    const html = render(ntp({ tenure_years: 9 }), items)
    expect(html).toContain('Staff Association')
    expect(html).toContain('Officer · HR Office')
    expect(html).toContain('Lecturer · DepEd')
    expect(html).toContain('4 / 10')
    expect(html.indexOf('Staff Association')).toBeLessThan(html.indexOf('Records seminar'))
  })

  it('shows the DS (two-year average) and HR-entered values in Area A', () => {
    const items = [
      { id: 'a1', category_area: 'areaA', criterion_code: 'A.1', awardedPoints: 39.5, scoring_payload: JSON.stringify({ locked: true, ds: [78, 80] }) },
      { id: 'a2', category_area: 'areaA', criterion_code: 'A.2', awardedPoints: 8.5, scoring_payload: { ds: [85], ds_source: 'hr' } },
    ]
    const html = render(ntp(), items)
    expect(html).toContain('>79<')
    expect(html).toContain('>85<')
    expect(html).toContain('39.50')
    expect(html).not.toContain('type="number"')
  })

  it('renders DS inputs only when HR may edit them', () => {
    const html = render(ntp(), [], { onUpdateAreaADs: () => true })
    expect(html).toContain('aria-label="DS for A.1 Job Performance"')
  })

  it('keeps missing Area A pending and does not coerce it to zero', () => {
    const scores = calculateNTFScores([], 6)
    expect(scores.areaA.total).toBeNull()
    expect(scores.grandTotalAwarded).toBeNull()
    expect(scores.areaB.total).toBe(3)
  })

  it('shows Faculty the Faculty booklet', () => {
    const html = render({ personnel_group: 'faculty', faculty_name: 'Demo Faculty' })
    expect(html).toContain('FACULTY PORTFOLIO')
    expect(html).toContain('A. PROFESSIONAL DEVELOPMENT')
    expect(html).not.toContain('NON-TEACHING PERSONNEL PORTFOLIO')
  })
})
