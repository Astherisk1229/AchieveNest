import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import DeanPortfolioEvaluationTab from '../DeanPortfolioEvaluationTab'
import fs from 'fs'
import path from 'path'

describe('Dean portfolio evaluation queue', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../DeanPortfolioEvaluationTab.jsx'), 'utf8')

  it('presents a compact faculty-first portfolio queue and preserves workflow detail', () => {
    for (const contract of ['data.ranking_cycle?.display_name', 'Faculty Portfolios', 'portfolios need', 'position_title', 'friendlyStatus(review.status', 'DeanPortfolioEvaluationWorkspace']) {
      expect(source).toContain(contract)
    }
    expect(source).toContain('Annual Review &amp; Eligibility')
  })

  it('keeps historical status navigation and compact filters', () => {
    expect(source).toContain("tab === 'resubmitted' ? resubmitted")
    expect(source).toContain('overviewData')
    expect(source).toContain('View Annual Review &amp; Eligibility')
    expect(source).toContain('<details className="relative">')
    expect(source).toContain('No portfolios need your review.')
  })

  it('keeps program and department filters separate and addressable', () => {
    expect(source).toContain('All programs')
    expect(source).toContain('All departments')
    expect(source).toContain("params.get('department')")
    expect(source).toContain('review.department_id')
  })

  it('returns to the existing Faculty Evaluation list with fresh returned status', () => {
    expect(source).toContain("queueParams.delete('evaluation')")
    expect(source).toContain("returnedParams.set('status', 'returned')")
    expect(source).toContain('await onRefreshOverview?.()')
    expect(source).toContain('navigate(`${DEAN_ROUTES.FACULTY_EVALUATION}?${returnedParams.toString()}`')
    expect(source).toContain('Portfolio returned successfully. Waiting for faculty revision.')
    expect(source).toContain("tab === 'returned' ? review.status === 'returned_for_revision'")
    expect(source).toContain("review.status === 'returned_for_revision' ? 'View Details'")
    expect(source).toContain('Waiting for the faculty member to submit a corrected portfolio.')
    expect(source).toContain("summaryMode ? 'Evaluation Summaries' : 'Faculty Evaluation'")
  })

  it('renders the backend returned record, status, and detail link in the existing list', () => {
    const overview = {
      evaluation_period: { id: 'period-1', name: 'Faculty Ranking' },
      workspace: { college_name: 'College of Arts and Sciences' },
      counts: { needs_review: 0, returned: 1 },
      reviews: [{ id: 'review-1', personnel_profile_id: 'jane-1', full_name: 'Jane Doe', current_rank_title: 'Professor I', status: 'returned_for_revision', dean_review_status: 'returned', version_number: 1 }],
    }
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={[{ pathname: '/dean/faculty-evaluation', search: '?tab=portfolio&status=returned', state: { portfolioReturnSuccess: 'Portfolio returned successfully. Waiting for faculty revision.' } }]}><DeanPortfolioEvaluationTab embedded overviewData={overview} /></MemoryRouter>)
    expect(html).toContain('Portfolio returned successfully. Waiting for faculty revision.')
    expect(html).toContain('Jane Doe')
    expect(html).toContain('Professor I — College of Arts and Sciences')
    expect(html).toContain('Returned for Revision')
    expect(html).toContain('Waiting for the faculty member to submit a corrected portfolio.')
    expect(html).toContain('View Details')
    expect(html).toContain('evaluation=review-1')
    expect(html).not.toContain('>Evaluate<')
  })
})
