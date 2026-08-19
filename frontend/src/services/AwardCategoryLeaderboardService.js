/**
 * AwardCategoryLeaderboardService.js
 * Calculation engine and registry for OSAD Category Leaderboards.
 * Ensures every Award Category owns an independent leaderboard calculated from that category's criteria, weights, caps, and threshold.
 */

import { AwardCandidacyModel } from '../models/AwardCandidacyModel'

export class AwardCategoryLeaderboardService {
  /**
   * Generates Overview Summaries for all active Award Categories.
   * Renders summary cards with leader, candidate counts, threshold, recipient limit, and calculation status.
   */
  static getAwardCategoryLeaderboardSummaries(categories = [], users = [], awardees = []) {
    return categories.map(cat => {
      const candidates = this.calculateCategoryLeaderboard({
        category: cat,
        users,
        awardees
      })

      const qualifiedCount = candidates.filter(c => c.eligibilityStatus === 'qualified').length
      const confirmedCount = candidates.filter(c => c.confirmed).length
      const leader = candidates.length > 0 ? candidates[0] : null
      const highestScore = candidates.length > 0 ? candidates[0].score : 0

      return {
        categoryId: cat.id,
        categoryTitle: cat.title,
        description: cat.description,
        minPoints: cat.min_points || 50,
        weightMultiplier: cat.weight_multiplier || 1.0,
        recipientLimit: cat.recipient_limit ?? 1,
        totalCandidates: candidates.length,
        qualifiedCount,
        confirmedCount,
        highestScore,
        leader,
        calculationStatus: 'ready'
      }
    })
  }

  /**
   * Computes an independent category leaderboard for a specific Award Category.
   */
  static calculateCategoryLeaderboard({ category, users = [], awardees = [], collegeFilter = 'all', searchTerm = '' }) {
    if (!category) return []

    const categoryTitle = typeof category === 'string' ? category : category.title
    const categoryId = typeof category === 'object' ? category.id : `cat-${categoryTitle.toLowerCase().replace(/\s+/g, '-')}`
    const minPoints = typeof category === 'object' ? (category.min_points || 50) : 50
    const weightMultiplier = typeof category === 'object' ? (category.weight_multiplier || 1.0) : 1.0
    const recipientLimit = typeof category === 'object' ? (category.recipient_limit ?? 1) : 1

    const students = users.filter(u => u.role === 'student' || u.role === 'Student')

    // 1. Calculate raw and weighted category scores per student
    const rawCandidates = students.map(std => {
      const studentPoints = std.total_points || 80
      // Category score formula: studentPoints * weightMultiplier clamped to 100
      const rawScore = Math.min(100, Math.round(studentPoints * weightMultiplier))
      const weightedScore = rawScore
      const eligibilityStatus = rawScore < minPoints ? 'below_threshold' : 'qualified'

      const isConfirmed = Array.isArray(awardees) && awardees.some(a => 
        (a.student_id === std.student_id || a.student_id === std.id || a.id === std.id) &&
        (a.award_title === categoryTitle || a.categoryId === categoryId)
      )

      const candidacyId = `candidacy-ay2025-${categoryId}-${std.id || std.student_id}`

      return {
        candidacyId,
        studentId: std.student_id || std.id,
        student_name: std.full_name || std.name || 'Student Candidate',
        program: std.program || 'BS Computer Science',
        college: std.college || 'CEAC',
        total_points: studentPoints,
        rawScore,
        score: weightedScore,
        weightedScore,
        verified_proofs: std.verified_proofs || 4,
        award_title: categoryTitle,
        categoryId,
        eligibilityStatus,
        reviewStatus: 'reviewed',
        confirmed: isConfirmed,
        confirmationStatus: isConfirmed ? 'confirmed' : 'unconfirmed',
        recipientLimit
      }
    })

    // 2. Sort deterministically using Category Tie Policy
    const sorted = AwardCandidacyModel.sortCandidatesDeterministic(rawCandidates)

    // 3. Assign Global Category Ranks
    const rankedLeaderboard = sorted.map((cand, idx) => ({
      ...cand,
      globalRank: idx + 1
    }))

    // 4. Apply visible College & Search filtering without altering stored globalRank
    return rankedLeaderboard.filter(c => {
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
}

export default AwardCategoryLeaderboardService
