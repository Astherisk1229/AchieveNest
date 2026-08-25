/**
 * AwardCandidacyModel.js
 * Model representing a Student's Stage 1 Candidate Portfolio Review for an Award Category.
 *
 * Stage 1 Workflow:
 * - System calculates Stage 1 Portfolio Score from verified student achievements against award criteria.
 * - System surfaces student as POTENTIAL_CANDIDATE if meeting threshold, or BELOW_THRESHOLD.
 * - OSAD human decision: ADVANCED_TO_INTERVIEW or NOT_ADVANCED.
 * - Interview (Stage 2) and Final Award selection take place outside Stage 1 automation.
 */

export const CANDIDACY_STATUS = {
  POTENTIAL_CANDIDATE: 'POTENTIAL_CANDIDATE',
  BELOW_THRESHOLD: 'BELOW_THRESHOLD',
  INELIGIBLE: 'INELIGIBLE'
}

export const REVIEW_STATUS = {
  UNREVIEWED: 'UNREVIEWED',
  REVIEWED: 'REVIEWED'
}

export const OSAD_DECISION = {
  PENDING: 'PENDING',
  ADVANCED_TO_INTERVIEW: 'ADVANCED_TO_INTERVIEW',
  NOT_ADVANCED: 'NOT_ADVANCED'
}

// Backward-compatibility aliases
export const CANDIDACY_ELIGIBILITY = {
  QUALIFIED: 'POTENTIAL_CANDIDATE',
  BELOW_THRESHOLD: 'BELOW_THRESHOLD',
  NEEDS_REVIEW: 'UNREVIEWED',
  DISQUALIFIED: 'INELIGIBLE'
}

export const CANDIDACY_CONFIRMATION = {
  UNCONFIRMED: 'PENDING',
  CONFIRMED: 'ADVANCED_TO_INTERVIEW',
  REVOKED: 'NOT_ADVANCED'
}

export class AwardCandidacyModel {
  /**
   * Checks if candidate can be advanced to interview.
   */
  static canAdvance(candidacy, cycleStatus = 'active') {
    if (!candidacy) return { canAdvance: false, reason: 'Invalid candidate record' }
    if (cycleStatus === 'published' || cycleStatus === 'archived') {
      return { canAdvance: false, reason: 'Award cycle is locked' }
    }
    return { canAdvance: true, reason: null }
  }

  /**
   * Deterministic tie-breaker sorter for candidate review list:
   * 1. Higher Stage 1 Score
   * 2. Higher raw score / criteria points
   * 3. Greater number of verified proof items
   * 4. Student full name (alphabetical)
   */
  static sortCandidatesDeterministic(candidates = []) {
    return [...candidates].sort((a, b) => {
      const scoreA = a.stage1_score ?? a.weightedScore ?? a.score ?? 0
      const scoreB = b.stage1_score ?? b.weightedScore ?? b.score ?? 0
      if (scoreB !== scoreA) return scoreB - scoreA

      const rawA = a.rawScore ?? scoreA
      const rawB = b.rawScore ?? scoreB
      if (rawB !== rawA) return rawB - rawA

      const proofsA = a.verified_proofs ?? a.proofsCount ?? 0
      const proofsB = b.verified_proofs ?? b.proofsCount ?? 0
      if (proofsB !== proofsA) return proofsB - proofsA

      const nameA = a.student_name || a.name || ''
      const nameB = b.student_name || b.name || ''
      return nameA.localeCompare(nameB)
    })
  }

  /**
   * Assigns Stage 1 ranks to candidates as a review aid.
   */
  static assignGlobalRanks(candidates = []) {
    const sorted = this.sortCandidatesDeterministic(candidates)
    return sorted.map((candidate, idx) => ({
      ...candidate,
      globalRank: idx + 1,
      stage1Rank: idx + 1
    }))
  }
}

export default AwardCandidacyModel
