import { describe, it, expect } from 'vitest'
import { calculateNDMUScores, NDMU_RATING_RULES } from '../NDMURatingEngine'

describe('NDMURatingEngine', () => {
  it('defines rules structure and caps correctly', () => {
    expect(NDMU_RATING_RULES.areaA.maxPoints).toBe(70)
    expect(NDMU_RATING_RULES.areaB.sectionCap).toBe(50)
    expect(NDMU_RATING_RULES.areaC.maxPoints).toBe(40)
    expect(NDMU_RATING_RULES.grandTotalCap).toBe(160)
  })

  it('calculates points correctly for verified evidence items', () => {
    const verifiedItems = [
      { categoryArea: 'areaA', criterionKey: 'degrees', awardedPoints: 40, verificationStatus: 'verified' },
      { categoryArea: 'areaA', criterionKey: 'memberships', awardedPoints: 5, verificationStatus: 'verified' },
      { categoryArea: 'areaB', criterionKey: 'publications', awardedPoints: 30, verificationStatus: 'verified' },
      { categoryArea: 'areaC', criterionKey: 'extracurricular', awardedPoints: 20, verificationStatus: 'verified' }
    ]

    const result = calculateNDMUScores(verifiedItems, 6)

    expect(result.areaA.degrees).toBe(40)
    expect(result.areaA.memberships).toBe(5)
    expect(result.areaA.total).toBe(45)

    expect(result.areaB.publications).toBe(30)
    expect(result.areaB.total).toBe(30)

    expect(result.areaC.extracurricular).toBe(20)
    expect(result.areaC.tenure).toBe(3) // 6 years / 2 = 3 pts
    expect(result.areaC.total).toBe(23)

    expect(result.grandTotal).toBe(98)
  })

  it('ignores rejected and pending evidence items', () => {
    const items = [
      { categoryArea: 'areaA', criterionKey: 'degrees', awardedPoints: 40, verificationStatus: 'rejected' },
      { categoryArea: 'areaA', criterionKey: 'seminars', awardedPoints: 15, verificationStatus: 'pending' },
      { categoryArea: 'areaA', criterionKey: 'memberships', awardedPoints: 10, verificationStatus: 'verified' }
    ]

    const result = calculateNDMUScores(items, 0)

    expect(result.areaA.degrees).toBe(0)
    expect(result.areaA.seminars).toBe(0)
    expect(result.areaA.memberships).toBe(10)
    expect(result.areaA.total).toBe(10)
  })

  it('enforces section caps and grand total caps', () => {
    const highScoringItems = [
      { categoryArea: 'areaA', criterionKey: 'degrees', awardedPoints: 40, verificationStatus: 'verified' },
      { categoryArea: 'areaA', criterionKey: 'memberships', awardedPoints: 10, verificationStatus: 'verified' },
      { categoryArea: 'areaA', criterionKey: 'seminars', awardedPoints: 30, verificationStatus: 'verified' }, // areaA raw = 80, capped at 70

      { categoryArea: 'areaB', criterionKey: 'lectures', awardedPoints: 40, verificationStatus: 'verified' },
      { categoryArea: 'areaB', criterionKey: 'publications', awardedPoints: 40, verificationStatus: 'verified' }, // areaB raw = 80, capped at 50

      { categoryArea: 'areaC', criterionKey: 'extracurricular', awardedPoints: 30, verificationStatus: 'verified' },
      { categoryArea: 'areaC', criterionKey: 'community', awardedPoints: 30, verificationStatus: 'verified' } // areaC raw = 60 + tenure, capped at 40
    ]

    const result = calculateNDMUScores(highScoringItems, 20)

    expect(result.areaA.total).toBe(70)
    expect(result.areaB.total).toBe(50)
    expect(result.areaC.total).toBe(40)
    expect(result.grandTotal).toBe(160) // 70 + 50 + 40 = 160
  })

  it('does not mutate input evidence items array', () => {
    const originalItems = [
      { categoryArea: 'areaA', criterionKey: 'degrees', awardedPoints: 40, verificationStatus: 'verified' }
    ]
    const itemsCopy = JSON.stringify(originalItems)

    calculateNDMUScores(originalItems, 4)

    expect(JSON.stringify(originalItems)).toBe(itemsCopy)
  })

  it('handles null, empty, and non-numeric inputs gracefully', () => {
    const result = calculateNDMUScores(null, null)

    expect(result.areaA.total).toBe(0)
    expect(result.areaB.total).toBe(0)
    expect(result.areaC.total).toBe(0)
    expect(result.grandTotal).toBe(0)
  })
})
