import { describe, expect, it } from 'vitest'
import { personnelScoringRemark } from '../personnelScoringRemarks'

describe('personnel portfolio scoring remarks', () => {
  it('shows provisional points and clearly says portfolio submission and evaluator verification are pending', () => {
    expect(personnelScoringRemark({
      criterion_snapshot: { provisional_scoring: { status: 'pending_verification', points: 20 } }
    })).toBe('Provisional: 20 points · Pending portfolio submission and evaluator verification')
  })

  it('shows verified points only after the backend records an evaluator decision', () => {
    expect(personnelScoringRemark({
      criterion_snapshot: { provisional_scoring: { status: 'verified', points: 20, verified_points: 18 } }
    })).toBe('Verified: 18 points')
  })

  it('changes the pending message after portfolio submission', () => {
    expect(personnelScoringRemark({
      criterion_snapshot: { provisional_scoring: { status: 'pending_verification', points: 10, portfolio_submission_status: 'submitted' } }
    })).toBe('Provisional: 10 points · Portfolio submitted; pending evaluator verification')
  })

  it('does not show points for returned or evaluator-rated-only criteria', () => {
    expect(personnelScoringRemark({ criterion_snapshot: { provisional_scoring: { status: 'returned', points: 20 } } }))
      .toBe('Returned for correction; no points verified')
    expect(personnelScoringRemark({ criterion_snapshot: { provisional_scoring: { status: 'evaluator_rating_required' } } }))
      .toBe('Evaluator rating required; no provisional points assigned')
  })
})
