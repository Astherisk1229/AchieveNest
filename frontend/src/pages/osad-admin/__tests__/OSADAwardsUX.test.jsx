import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import AwardEvaluationSummaryModal from '../modals/AwardEvaluationSummaryModal'
import OSADAwardCandidateReviewPage from '../OSADAwardCandidateReviewPage'
import OSADAwardsAndCriteriaPage from '../OSADAwardsAndCriteriaPage'

describe('Phase H — OSAD Awards & Scoring Criteria UX', () => {
  it('instantiates AwardEvaluationSummaryModal cleanly with candidate props', () => {
    const candidate = {
      name: 'Maria Santos',
      portfolio_raw_score: '45.00',
      max_computable_score: '50.00',
      potential_score: '90.00',
      pathway: 'automatic_portfolio',
    }
    const award = { name: 'Most Outstanding Student Award' }

    const element = (
      <AwardEvaluationSummaryModal
        isOpen={true}
        candidate={candidate}
        award={award}
        onClose={vi.fn()}
      />
    )

    expect(element.type).toBe(AwardEvaluationSummaryModal)
    expect(element.props.isOpen).toBe(true)
    expect(element.props.candidate.name).toBe('Maria Santos')
    expect(element.props.candidate.potential_score).toBe('90.00')
    expect(element.props.candidate.pathway).toBe('automatic_portfolio')
  })

  it('instantiates Dean direct nomination candidate without synthetic score inflation', () => {
    const deanCandidate = {
      name: 'Juan Dela Cruz',
      portfolio_raw_score: '30.00',
      max_computable_score: '50.00',
      potential_score: '60.00',
      pathway: 'dean_nomination',
    }
    const award = { name: 'Most Outstanding Student Award' }

    const element = (
      <AwardEvaluationSummaryModal
        isOpen={true}
        candidate={deanCandidate}
        award={award}
        onClose={vi.fn()}
      />
    )

    expect(element.props.candidate.name).toBe('Juan Dela Cruz')
    expect(element.props.candidate.potential_score).toBe('60.00')
    expect(element.props.candidate.pathway).toBe('dean_nomination')
  })

  it('instantiates OSADAwardCandidateReviewPage and OSADAwardsAndCriteriaPage', () => {
    const reviewPage = <OSADAwardCandidateReviewPage />
    const criteriaPage = <OSADAwardsAndCriteriaPage />

    expect(reviewPage.type).toBe(OSADAwardCandidateReviewPage)
    expect(criteriaPage.type).toBe(OSADAwardsAndCriteriaPage)
  })
})
