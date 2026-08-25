import { describe, it, expect } from 'vitest'
import { AwardCandidacyModel, CANDIDACY_STATUS, OSAD_DECISION } from '../AwardCandidacyModel'

describe('AwardCandidacyModel', () => {
  it('validates candidate advancement eligibility correctly', () => {
    const qualified = { potentialCandidateStatus: CANDIDACY_STATUS.POTENTIAL_CANDIDATE, osadDecision: OSAD_DECISION.PENDING }
    expect(AwardCandidacyModel.canAdvance(qualified, 'active').canAdvance).toBe(true)

    expect(AwardCandidacyModel.canAdvance(qualified, 'published').canAdvance).toBe(false)
  })

  it('sorts candidates deterministically by Stage 1 score, raw score, verified proofs, and name', () => {
    const candidates = [
      { id: '1', student_name: 'Bob', stage1_score: 90, verified_proofs: 3 },
      { id: '2', student_name: 'Alice', stage1_score: 95, verified_proofs: 4 },
      { id: '3', student_name: 'Charlie', stage1_score: 90, verified_proofs: 5 }
    ]

    const sorted = AwardCandidacyModel.sortCandidatesDeterministic(candidates)
    expect(sorted[0].id).toBe('2') // score 95
    expect(sorted[1].id).toBe('3') // score 90, proofs 5
    expect(sorted[2].id).toBe('1') // score 90, proofs 3
  })

  it('assigns Stage 1 ranks while preserving candidate properties', () => {
    const candidates = [
      { id: '1', stage1_score: 80 },
      { id: '2', stage1_score: 98 }
    ]

    const ranked = AwardCandidacyModel.assignGlobalRanks(candidates)
    expect(ranked[0].id).toBe('2')
    expect(ranked[0].stage1Rank).toBe(1)
    expect(ranked[1].id).toBe('1')
    expect(ranked[1].stage1Rank).toBe(2)
  })
})
