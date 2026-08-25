import { describe, it, expect } from 'vitest'
import { AwardPortfolioReviewService, AwardCategoryLeaderboardService } from '../AwardPortfolioReviewService'

describe('AwardPortfolioReviewService (Stage 1 Portfolio Review)', () => {
  const sampleUsers = [
    { id: 'std-1', student_id: '2024-001', role: 'student', full_name: 'Maria Clara Santos', program: 'BS Computer Science', college: 'CEAC', total_points: 90, verified_proofs: 5 },
    { id: 'std-2', student_id: '2024-002', role: 'student', full_name: 'Samantha Ray', program: 'BS Business Administration', college: 'CBA', total_points: 75, verified_proofs: 4 },
    { id: 'std-3', student_id: '2024-003', role: 'student', full_name: 'Juan Dela Cruz', program: 'BS Computer Science', college: 'CEAC', total_points: 40, verified_proofs: 2 }
  ]

  const sampleCategories = [
    { id: 'cat-deans-list', title: "Dean's List", min_points: 50, recipient_limit: 1 },
    { id: 'cat-leadership', title: 'Leadership', min_points: 60, recipient_limit: 1 }
  ]

  it('generates Category Stage 1 Overview Summaries for all active categories', () => {
    const summaries = AwardPortfolioReviewService.getAwardCategorySummaries(sampleCategories, sampleUsers, [])
    expect(summaries.length).toBe(2)
    expect(summaries[0].categoryTitle).toBe("Dean's List")
    expect(summaries[0].potentialCandidateCount).toBe(2) // 90 & 75 >= 50
    expect(summaries[0].highestCandidate.student_name).toBe('Maria Clara Santos')
  })

  it('calculates criteria-based Stage 1 reviews with criteria breakdown', () => {
    const deansReview = AwardPortfolioReviewService.calculateStage1Review({
      category: sampleCategories[0],
      users: sampleUsers,
      candidateDecisions: []
    })

    expect(deansReview[0].stage1_score).toBe(90)
    expect(deansReview[0].criteria_breakdown.length).toBeGreaterThan(0)
    expect(deansReview[0].potentialCandidateStatus).toBe('POTENTIAL_CANDIDATE')
  })

  it('allows a student to appear in multiple category candidate reviews with independent ranks', () => {
    const deans = AwardPortfolioReviewService.calculateStage1Review({ category: sampleCategories[0], users: sampleUsers })
    const leadership = AwardPortfolioReviewService.calculateStage1Review({ category: sampleCategories[1], users: sampleUsers })

    const mariaDeans = deans.find(c => c.studentId === '2024-001')
    const mariaLeadership = leadership.find(c => c.studentId === '2024-001')

    expect(mariaDeans.stage1Rank).toBe(1)
    expect(mariaLeadership.stage1Rank).toBe(1)
    expect(mariaDeans.candidacyId).not.toBe(mariaLeadership.candidacyId)
  })

  it('preserves Stage 1 candidate rank when list is filtered by College', () => {
    const reviewList = AwardPortfolioReviewService.calculateStage1Review({
      category: sampleCategories[0],
      users: sampleUsers,
      collegeFilter: 'CBA'
    })

    expect(reviewList.length).toBe(1)
    expect(reviewList[0].student_name).toBe('Samantha Ray')
    expect(reviewList[0].stage1Rank).toBe(2) // Rank #2 preserved!
  })
})
