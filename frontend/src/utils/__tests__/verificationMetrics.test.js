import { describe, it, expect } from 'vitest'
import { calculateAverageReviewTime, getUnfilteredStatusCounts } from '../verificationMetrics'

describe('verificationMetrics utility', () => {
  describe('calculateAverageReviewTime', () => {
    it('returns fallback display when submissions array is empty or has no timestamps', () => {
      const result = calculateAverageReviewTime([])
      expect(result.displayValue).toBe('—')
      expect(result.subtext).toBe('No completed review data')
      expect(result.sampleSize).toBe(0)
    })

    it('calculates average review time accurately for completed reviews', () => {
      const submissions = [
        {
          status: 'Verified',
          submitted_at: '2026-02-19T08:00:00.000Z',
          reviewed_at: '2026-02-19T10:30:00.000Z' // 2 hours 30 mins = 150 mins
        },
        {
          status: 'Returned',
          submitted_at: '2026-02-19T09:00:00.000Z',
          reviewed_at: '2026-02-19T10:30:00.000Z' // 1 hour 30 mins = 90 mins
        },
        {
          status: 'Pending',
          submitted_at: '2026-02-19T11:00:00.000Z' // Should be ignored
        }
      ]

      const result = calculateAverageReviewTime(submissions)
      expect(result.sampleSize).toBe(2)
      expect(result.minutes).toBe(120) // (150 + 90) / 2 = 120 mins = 2h
      expect(result.displayValue).toBe('2h')
    })
  })

  describe('getUnfilteredStatusCounts', () => {
    it('returns exact count breakdown by status', () => {
      const submissions = [
        { status: 'Pending' },
        { status: 'Pending' },
        { status: 'Verified' },
        { status: 'Returned' }
      ]
      const counts = getUnfilteredStatusCounts(submissions)
      expect(counts.pending).toBe(2)
      expect(counts.verified).toBe(1)
      expect(counts.returned).toBe(1)
    })
  })
})
