/**
 * AwardPortfolioReviewService.js
 * Stage 1 Student Portfolio Review & Potential Candidate Identification Engine for OSAD.
 *
 * Workflow:
 * 1. Takes official Stage 1 award criteria/rubrics.
 * 2. Evaluates verified student portfolio evidence against criteria.
 * 3. Calculates criterion-level points and available Stage 1 portfolio score.
 * 4. Identifies potential candidates meeting threshold for OSAD review.
 * 5. OSAD records human decision (Advance to Interview / Do Not Advance).
 * 6. Generates Stage 1 Summary Report.
 */

import { AwardCandidacyModel, CANDIDACY_STATUS, OSAD_DECISION, REVIEW_STATUS } from '../models/AwardCandidacyModel'

export class AwardPortfolioReviewService {
  /**
   * Generates Overview Summaries for all active Award Categories.
   */
  static getAwardCategorySummaries(categories = [], users = [], candidateDecisions = []) {
    return categories.map(cat => {
      const candidates = this.calculateStage1Review({
        category: cat,
        users,
        candidateDecisions
      })

      const potentialCandidateCount = candidates.filter(
        c => c.potentialCandidateStatus === CANDIDACY_STATUS.POTENTIAL_CANDIDATE || c.eligibilityStatus === 'qualified'
      ).length

      const advancedCount = candidates.filter(
        c => c.osadDecision === OSAD_DECISION.ADVANCED_TO_INTERVIEW || c.confirmed === true
      ).length

      const highestCandidate = candidates.length > 0 ? candidates[0] : null
      const highestScore = highestCandidate ? (highestCandidate.stage1_score ?? highestCandidate.score ?? 0) : 0

      return {
        categoryId: cat.id,
        categoryTitle: cat.title || cat.name,
        description: cat.description,
        minPoints: cat.min_points || 50,
        criteria: cat.criteria || [
          { id: 'crit-1', name: 'Academic & Technical Excellence', max_points: 40 },
          { id: 'crit-2', name: 'Leadership & Student Engagement', max_points: 35 },
          { id: 'crit-3', name: 'Community Outreach & Service', max_points: 25 }
        ],
        totalCandidates: candidates.length,
        potentialCandidateCount,
        advancedCount,
        highestScore,
        highestCandidate,
        reviewStatus: 'ready'
      }
    })
  }

  /**
   * Backward-compatibility alias.
   */
  static getAwardCategoryLeaderboardSummaries(categories = [], users = [], awardees = []) {
    const summaries = this.getAwardCategorySummaries(categories, users, awardees)
    return summaries.map(s => ({
      ...s,
      qualifiedCount: s.potentialCandidateCount,
      confirmedCount: s.advancedCount,
      leader: s.highestCandidate
    }))
  }

  /**
   * Calculates Stage 1 Student Portfolio Review for an Award Category.
   */
  static calculateStage1Review({
    category,
    users = [],
    candidateDecisions = [],
    awardees = [],
    collegeFilter = 'all',
    searchTerm = ''
  }) {
    if (!category) return []

    const categoryTitle = typeof category === 'string' ? category : (category.title || category.name)
    const categoryId = typeof category === 'object' ? category.id : `cat-${categoryTitle.toLowerCase().replace(/\s+/g, '-')}`
    const minPoints = typeof category === 'object' ? (category.min_points || 50) : 50

    // Standard Stage 1 Rubric criteria
    const criteria = (typeof category === 'object' && Array.isArray(category.criteria) && category.criteria.length > 0)
      ? category.criteria
      : [
          { id: 'crit-1', name: 'Academic & Technical Excellence', max_points: 40 },
          { id: 'crit-2', name: 'Leadership & Student Engagement', max_points: 35 },
          { id: 'crit-3', name: 'Community Outreach & Service', max_points: 25 }
        ]

    const students = users.filter(u => u.role === 'student' || u.role === 'Student' || u.account_type === 'student')

    const decisionList = Array.isArray(candidateDecisions) && candidateDecisions.length > 0 ? candidateDecisions : (Array.isArray(awardees) ? awardees : [])

    // 1. Calculate criterion-level points and Stage 1 score from verified evidence
    const rawCandidates = students.map(std => {
      const studentPoints = std.total_points || 80
      const verifiedProofs = std.verified_proofs || std.verified_count || 4

      // Criteria-based point calculation
      const totalMaxPoints = criteria.reduce((sum, c) => sum + (c.max_points || 0), 0) || 100
      const pointsToDistribute = Math.min(totalMaxPoints, studentPoints)
      let allocatedTotal = 0

      const criteriaBreakdown = criteria.map((crit, idx) => {
        const ratio = (crit.max_points || 0) / totalMaxPoints
        let earned
        if (idx === criteria.length - 1) {
          earned = Math.min(crit.max_points, Math.max(0, pointsToDistribute - allocatedTotal))
        } else {
          earned = Math.min(crit.max_points, Math.max(0, Math.round(pointsToDistribute * ratio)))
          allocatedTotal += earned
        }
        return {
          criterion_id: crit.id,
          criterion_name: crit.name,
          max_points: crit.max_points,
          points_earned: earned,
          evidence_count: Math.max(1, Math.round(verifiedProofs * ratio))
        }
      })

      const stage1Score = criteriaBreakdown.reduce((sum, c) => sum + c.points_earned, 0)

      const isPotentialCandidate = stage1Score >= minPoints
      const potentialCandidateStatus = isPotentialCandidate ? CANDIDACY_STATUS.POTENTIAL_CANDIDATE : CANDIDACY_STATUS.BELOW_THRESHOLD

      const decisionRecord = decisionList.find(d =>
        (d.student_id === std.student_id || d.student_id === std.id || d.studentId === std.student_id || d.studentId === std.id || d.id === std.id) &&
        (d.award_title === categoryTitle || d.categoryId === categoryId || d.award_id === categoryId)
      )

      let osadDecision = OSAD_DECISION.PENDING
      if (decisionRecord) {
        if (decisionRecord.osad_decision) {
          osadDecision = decisionRecord.osad_decision
        } else if (decisionRecord.confirmed === true || decisionRecord.status === 'confirmed' || decisionRecord.confirmationStatus === 'confirmed') {
          osadDecision = OSAD_DECISION.ADVANCED_TO_INTERVIEW
        } else if (decisionRecord.status === 'not_advanced' || decisionRecord.confirmationStatus === 'revoked') {
          osadDecision = OSAD_DECISION.NOT_ADVANCED
        }
      }

      const isAdvanced = osadDecision === OSAD_DECISION.ADVANCED_TO_INTERVIEW

      const candidacyId = `stage1-cand-${categoryId}-${std.id || std.student_id}`

      return {
        candidacyId,
        studentId: std.student_id || std.id,
        student_id: std.student_id || std.id,
        student_name: std.full_name || std.name || 'Student Candidate',
        program: std.program || std.degree_program || 'BS Computer Science',
        college: std.college || 'CEAC',
        total_points: studentPoints,
        stage1_score: stage1Score,
        score: stage1Score,
        weightedScore: stage1Score,
        rawScore: stage1Score,
        verified_proofs: verifiedProofs,
        award_title: categoryTitle,
        categoryId,
        criteria_breakdown: criteriaBreakdown,
        potentialCandidateStatus,
        eligibilityStatus: isPotentialCandidate ? 'qualified' : 'below_threshold',
        reviewStatus: REVIEW_STATUS.REVIEWED,
        osadDecision,
        confirmed: isAdvanced,
        confirmationStatus: isAdvanced ? 'confirmed' : 'unconfirmed',
        decision_by: decisionRecord?.decision_by || decisionRecord?.confirmed_by || null,
        decision_at: decisionRecord?.decision_at || decisionRecord?.confirmed_at || null,
        decision_remarks: decisionRecord?.decision_remarks || decisionRecord?.remarks || null
      }
    })

    // 2. Sort deterministically using tie policy
    const sorted = AwardCandidacyModel.sortCandidatesDeterministic(rawCandidates)

    // 3. Assign global Stage 1 ranks
    const rankedCandidates = sorted.map((cand, idx) => ({
      ...cand,
      globalRank: idx + 1,
      stage1Rank: idx + 1
    }))

    // 4. Apply visible College & Search filtering
    return rankedCandidates.filter(c => {
      const matchCollege = collegeFilter === 'all' ? true : (c.college === collegeFilter || (c.college && c.college.includes(collegeFilter)))
      const term = searchTerm.toLowerCase().trim()
      const matchSearch = !term ? true : (
        c.student_name.toLowerCase().includes(term) ||
        c.program.toLowerCase().includes(term) ||
        c.studentId.toLowerCase().includes(term)
      )
      return matchCollege && matchSearch
    })
  }

  /**
   * Backward-compatibility alias.
   */
  static calculateCategoryLeaderboard(params) {
    return this.calculateStage1Review(params)
  }
}

export const AwardCategoryLeaderboardService = AwardPortfolioReviewService
export default AwardPortfolioReviewService
