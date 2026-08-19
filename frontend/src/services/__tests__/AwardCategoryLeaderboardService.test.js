import { describe, it, expect } from 'vitest'
import { AwardCategoryLeaderboardService } from '../AwardCategoryLeaderboardService'

describe('AwardCategoryLeaderboardService', () => {
  const sampleUsers = [
    { id: 'std-1', student_id: '2024-001', role: 'student', full_name: 'Maria Clara Santos', program: 'BS Computer Science', college: 'CEAC', total_points: 90, verified_proofs: 5 },
    { id: 'std-2', student_id: '2024-002', role: 'student', full_name: 'Samantha Ray', program: 'BS Business Administration', college: 'CBA', total_points: 75, verified_proofs: 4 },
    { id: 'std-3', student_id: '2024-003', role: 'student', full_name: 'Juan Dela Cruz', program: 'BS Computer Science', college: 'CEAC', total_points: 40, verified_proofs: 2 }
  ]

  const sampleCategories = [
    { id: 'cat-deans-list', title: "Dean's List", min_points: 50, weight_multiplier: 1.0, recipient_limit: 1 },
    { id: 'cat-leadership', title: 'Leadership', min_points: 60, weight_multiplier: 1.2, recipient_limit: 1 }
  ]

  it('generates Category Overview Summaries for all active categories', () => {
    const summaries = AwardCategoryLeaderboardService.getAwardCategoryLeaderboardSummaries(sampleCategories, sampleUsers, [])
    expect(summaries.length).toBe(2)
    expect(summaries[0].categoryTitle).toBe("Dean's List")
    expect(summaries[0].qualifiedCount).toBe(2) // 90 & 75 >= 50
    expect(summaries[0].leader.student_name).toBe('Maria Clara Santos')
  })

  it('calculates independent category leaderboards and scores using category rules', () => {
    const deansLeaderboard = AwardCategoryLeaderboardService.calculateCategoryLeaderboard({
      category: sampleCategories[0],
      users: sampleUsers,
      awardees: []
    })

    const leadershipLeaderboard = AwardCategoryLeaderboardService.calculateCategoryLeaderboard({
      category: sampleCategories[1],
      users: sampleUsers,
      awardees: []
    })

    expect(deansLeaderboard[0].score).toBe(90) // 90 * 1.0
    expect(leadershipLeaderboard[0].score).toBe(100) // 90 * 1.2 clamped to 100
  })

  it('allows a student to appear in multiple category leaderboards with separate ranks', () => {
    const deans = AwardCategoryLeaderboardService.calculateCategoryLeaderboard({ category: sampleCategories[0], users: sampleUsers })
    const leadership = AwardCategoryLeaderboardService.calculateCategoryLeaderboard({ category: sampleCategories[1], users: sampleUsers })

    const mariaDeans = deans.find(c => c.studentId === '2024-001')
    const mariaLeadership = leadership.find(c => c.studentId === '2024-001')

    expect(mariaDeans.globalRank).toBe(1)
    expect(mariaLeadership.globalRank).toBe(1)
    expect(mariaDeans.candidacyId).not.toBe(mariaLeadership.candidacyId)
  })

  it('preserves global category rank when list is filtered by College', () => {
    const leaderboard = AwardCategoryLeaderboardService.calculateCategoryLeaderboard({
      category: sampleCategories[0],
      users: sampleUsers,
      collegeFilter: 'CBA'
    })

    expect(leaderboard.length).toBe(1)
    expect(leaderboard[0].student_name).toBe('Samantha Ray')
    expect(leaderboard[0].globalRank).toBe(2) // Global rank #2 preserved!
  })
})
