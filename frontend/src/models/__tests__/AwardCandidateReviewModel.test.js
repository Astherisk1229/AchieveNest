import { describe, expect, it } from 'vitest'
import AwardCandidateReviewModel from '../AwardCandidateReviewModel'

const workspace = (overrides = {}) => ({
  award: { id: 'award-1', name: 'Campus Journalism Award', authority_status: 'OFFICIAL' },
  student: { id: 'student-1', full_name: 'Sean Faderes', program: 'BS Information Technology' },
  evaluation_status: 'NOT_REVIEWED',
  portfolio_scoring: {
    raw_portfolio_score: 56,
    computable_max_score: 70,
    portfolio_potential_score: 80,
    raw_qualifying_score: 56,
    candidate_threshold_percent: 80,
    candidate_status: 'POTENTIAL_CANDIDATE',
    scoring_status: 'SCORED',
    field_availability: {
      raw_portfolio_score: { status: 'AVAILABLE' },
      computable_max_score: { status: 'AVAILABLE' },
      portfolio_potential_score: { status: 'AVAILABLE' },
      raw_qualifying_score: { status: 'AVAILABLE' },
      candidate_threshold_percent: { status: 'AVAILABLE' }
    },
    criteria: [{
      criterion_id: 'criterion-1', criterion_name: 'News Items', achieved_points: 10, max_points: 10,
      calculation_text: 'Five verified records contributed 2 points each.', aggregation_mode: 'SUM_WITH_CAP',
      verified_record_count: 1, evidence_ids: ['evidence-1'], scoring_status: 'VALID', scoring_warnings: []
    }]
  },
  all_relevant_records: [{ record_id: 'evidence-1', title: 'Campus news story', verification_status: 'verified' }],
  human_only_criteria: [{ criterion_id: 'human-1', name: 'Character', human_only: true }],
  ...overrides
})

describe('AwardCandidateReviewModel', () => {
  it('preserves threshold-boundary server score values without deriving qualification', () => {
    const model = new AwardCandidateReviewModel(workspace())
    expect(model.score).toMatchObject({ raw_portfolio_score: 56, computable_max_score: 70, portfolio_potential_score: 80, raw_qualifying_score: 56 })
    expect(model.scorePresentation()).toEqual({ rawAvailable: true, potentialAvailable: true, requiredAvailable: true, thresholdAvailable: true })
  })

  it('correlates returned evidence IDs without inventing evidence', () => {
    const model = new AwardCandidateReviewModel(workspace())
    expect(model.criteria[0].evidenceRecords).toEqual([expect.objectContaining({ record_id: 'evidence-1' })])
    expect(new AwardCandidateReviewModel(workspace({ all_relevant_records: [] })).criteria[0].evidenceRecords).toEqual([])
  })

  it('preserves partial and unresolved criterion warnings', () => {
    const payload = workspace()
    payload.portfolio_scoring.criteria[0].scoring_status = 'PARTIALLY_UNSCORABLE'
    payload.portfolio_scoring.criteria[0].scoring_warnings = [{ code: 'UNRESOLVED_LEADERSHIP_SCOPE', message: 'Regional and National mappings remain unresolved.' }]
    const criterion = new AwardCandidateReviewModel(payload).criteria[0]
    expect(criterion.scoring_status).toBe('PARTIALLY_UNSCORABLE')
    expect(criterion.warnings[0].code).toBe('UNRESOLVED_LEADERSHIP_SCOPE')
  })

  it('keeps human-only criteria separate', () => {
    const model = new AwardCandidateReviewModel(workspace())
    expect(model.criteria).toHaveLength(1)
    expect(model.humanOnlyCriteria).toEqual([expect.objectContaining({ name: 'Character', human_only: true })])
  })

  it('blocks proposed and authority-pending awards', () => {
    expect(AwardCandidateReviewModel.authorityPending({ authority_status: 'PROPOSED' })).toBe(true)
    expect(AwardCandidateReviewModel.authorityPending({ configuration_status: 'AWARD_AUTHORITY_PENDING' })).toBe(true)
  })
})
