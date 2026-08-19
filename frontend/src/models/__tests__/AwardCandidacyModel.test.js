import { describe, it, expect } from 'vitest'
import { AwardCandidacyModel, CANDIDACY_ELIGIBILITY, CANDIDACY_CONFIRMATION } from '../AwardCandidacyModel'

describe('AwardCandidacyModel', () => {
  it('validates candidacy confirmability correctly', () => {
    const qualified = { eligibilityStatus: CANDIDACY_ELIGIBILITY.QUALIFIED, confirmationStatus: CANDIDACY_CONFIRMATION.UNCONFIRMED }
    expect(AwardCandidacyModel.isConfirmable(qualified, 'ready_for_review').eligible).toBe(true)

    const belowThreshold = { eligibilityStatus: CANDIDACY_ELIGIBILITY.BELOW_THRESHOLD }
    expect(AwardCandidacyModel.isConfirmable(belowThreshold, 'ready_for_review').eligible).toBe(false)

    const alreadyConfirmed = { eligibilityStatus: CANDIDACY_ELIGIBILITY.QUALIFIED, confirmationStatus: CANDIDACY_CONFIRMATION.CONFIRMED }
    expect(AwardCandidacyModel.isConfirmable(alreadyConfirmed, 'ready_for_review').eligible).toBe(false)
  })

  it('sorts candidates deterministically by score, raw score, verified proofs, and name', () => {
    const candidates = [
      { id: '1', student_name: 'Bob', weightedScore: 90, verified_proofs: 3 },
      { id: '2', student_name: 'Alice', weightedScore: 95, verified_proofs: 4 },
      { id: '3', student_name: 'Charlie', weightedScore: 90, verified_proofs: 5 }
    ]

    const sorted = AwardCandidacyModel.sortCandidatesDeterministic(candidates)
    expect(sorted[0].id).toBe('2') // score 95
    expect(sorted[1].id).toBe('3') // score 90, proofs 5
    expect(sorted[2].id).toBe('1') // score 90, proofs 3
  })

  it('assigns global ranks while preserving individual objects', () => {
    const candidates = [
      { id: '1', weightedScore: 80 },
      { id: '2', weightedScore: 98 }
    ]

    const ranked = AwardCandidacyModel.assignGlobalRanks(candidates)
    expect(ranked[0].id).toBe('2')
    expect(ranked[0].globalRank).toBe(1)
    expect(ranked[1].id).toBe('1')
    expect(ranked[1].globalRank).toBe(2)
  })
})
