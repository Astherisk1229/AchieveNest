/**
 * AwardCandidacyModel.js
 * Model representing a Student's candidacy for a specific Award Category in an Award Cycle.
 */

export const CANDIDACY_ELIGIBILITY = {
  QUALIFIED: 'qualified',
  BELOW_THRESHOLD: 'below_threshold',
  NEEDS_REVIEW: 'needs_review',
  DISQUALIFIED: 'disqualified'
}

export const CANDIDACY_REVIEW = {
  UNREVIEWED: 'unreviewed',
  REVIEWED: 'reviewed'
}

export const CANDIDACY_CONFIRMATION = {
  UNCONFIRMED: 'unconfirmed',
  CONFIRMED: 'confirmed',
  REVOKED: 'revoked'
}

export const MAX_CONFIRMED_PER_CATEGORY = 1

export class AwardCandidacyModel {
  static isConfirmable(candidacy, cycleStatus, categoryConfirmedCount = 0) {
    if (!candidacy) return { eligible: false, reason: 'Invalid candidacy record' }
    if (candidacy.eligibilityStatus !== CANDIDACY_ELIGIBILITY.QUALIFIED) {
      return { eligible: false, reason: `Candidacy is ${candidacy.eligibilityStatus || 'not qualified'}` }
    }
    if (candidacy.confirmationStatus === CANDIDACY_CONFIRMATION.CONFIRMED) {
      return { eligible: false, reason: 'Candidacy is already confirmed' }
    }
    if (candidacy.confirmationStatus === CANDIDACY_CONFIRMATION.REVOKED) {
      return { eligible: false, reason: 'Candidacy confirmation was revoked' }
    }
    if (cycleStatus === 'published' || cycleStatus === 'archived') {
      return { eligible: false, reason: 'Cycle is published and locked' }
    }
    if (categoryConfirmedCount >= MAX_CONFIRMED_PER_CATEGORY && !candidacy.confirmed) {
      return { eligible: true, reason: 'Confirming will replace the current awardee for this category (Max 1)' }
    }
    return { eligible: true, reason: null }
  }

  /**
   * Deterministic tie-breaker sorter:
   * 1. Higher weighted score
   * 2. Higher raw score
   * 3. Greater number of verified proof items
   * 4. Student full name (alphabetical)
   */
  static sortCandidatesDeterministic(candidates = []) {
    return [...candidates].sort((a, b) => {
      const scoreA = a.weightedScore ?? a.score ?? 0
      const scoreB = b.weightedScore ?? b.score ?? 0
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
   * Assigns global rank to candidates while preserving the stored global rank during UI filtering.
   */
  static assignGlobalRanks(candidates = []) {
    const sorted = this.sortCandidatesDeterministic(candidates)
    return sorted.map((candidate, idx) => ({
      ...candidate,
      globalRank: idx + 1
    }))
  }
}

export default AwardCandidacyModel
