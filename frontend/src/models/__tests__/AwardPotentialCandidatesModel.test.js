import { describe, expect, it } from 'vitest'
import AwardPotentialCandidatesModel from '../AwardPotentialCandidatesModel'

const candidate = (overrides = {}) => ({
  student_id: 'student-1',
  student_name: 'Sean Asther Faderes',
  program: 'BS Information Technology',
  raw_portfolio_score: 56,
  computable_max_score: 70,
  portfolio_potential_score: 80,
  candidate_threshold_percent: 80,
  raw_qualifying_score: 56,
  candidate_status: 'POTENTIAL_CANDIDATE',
  review_status: 'READY_FOR_REVIEW',
  qualification_basis: 'PORTFOLIO_THRESHOLD',
  threshold_purpose: 'POTENTIAL_CANDIDATE_DISCOVERY',
  scoring_status: 'SCORED',
  configuration_status: 'SCORED',
  configuration_valid: true,
  field_availability: {
    raw_portfolio_score: { status: 'AVAILABLE' },
    computable_max_score: { status: 'AVAILABLE' },
    portfolio_potential_score: { status: 'AVAILABLE' }
  },
  ...overrides
})

describe('AwardPotentialCandidatesModel', () => {
  it('consumes server score and threshold-boundary values without deriving qualification', () => {
    const model = new AwardPotentialCandidatesModel({ potential_candidates: [candidate()] })
    expect(model.candidates[0]).toMatchObject({
      raw_portfolio_score: 56,
      computable_max_score: 70,
      portfolio_potential_score: 80,
      candidate_status: 'POTENTIAL_CANDIDATE',
      rawScoreAvailable: true,
      potentialScoreAvailable: true
    })
  })

  it('keeps partial and unavailable scoring states explicit', () => {
    const model = new AwardPotentialCandidatesModel({ potential_candidates: [
      candidate({ scoring_status: 'PARTIALLY_UNSCORABLE' }),
      candidate({ student_id: 'student-2', portfolio_potential_score: null, field_availability: { portfolio_potential_score: { status: 'UNAVAILABLE' } } })
    ] })
    expect(model.candidates[0].scoring_status).toBe('PARTIALLY_UNSCORABLE')
    expect(model.candidates[1].potentialScoreAvailable).toBe(false)
  })

  it('filters by server workflow status and searches authoritative identity fields', () => {
    const model = new AwardPotentialCandidatesModel({ potential_candidates: [
      candidate(),
      candidate({ student_id: 'student-2', student_name: 'Alex Cruz', program: 'BS Nursing', review_status: 'UNDER_REVIEW' })
    ] })
    expect(AwardPotentialCandidatesModel.filterAndSort(model.candidates, { search: 'nursing' })).toHaveLength(1)
    expect(AwardPotentialCandidatesModel.filterAndSort(model.candidates, { status: 'UNDER_REVIEW' })[0].student_name).toBe('Alex Cruz')
  })

  it('sorts scores as a usability aid without assigning ranks', () => {
    const model = new AwardPotentialCandidatesModel({ potential_candidates: [candidate(), candidate({ student_id: 'student-2', student_name: 'Alex', portfolio_potential_score: 92 })] })
    const sorted = AwardPotentialCandidatesModel.filterAndSort(model.candidates, { sort: 'SCORE_DESC' })
    expect(sorted.map((item) => item.student_name)).toEqual(['Alex', 'Sean Asther Faderes'])
    expect(sorted.every((item) => !('rank' in item))).toBe(true)
  })

  it('blocks both Proposed and authority-pending awards', () => {
    expect(AwardPotentialCandidatesModel.authorityPending({ authority_status: 'PROPOSED' })).toBe(true)
    expect(AwardPotentialCandidatesModel.authorityPending({ configuration_status: 'AWARD_AUTHORITY_PENDING' })).toBe(true)
  })
})
