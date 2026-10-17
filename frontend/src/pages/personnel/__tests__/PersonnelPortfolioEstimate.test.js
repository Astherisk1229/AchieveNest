import { describe, expect, it } from 'vitest'
import { submissionPointEstimate } from '../PersonnelPortfolioPage'

describe('non-teaching portfolio estimate', () => {
  it('uses locked item points when provisional scores are absent and caps category totals', () => {
    const item = (id, category, points, cap) => ({
      id,
      category_code: category,
      criterion_snapshot: {
        configured_points: points,
        evaluator_judgment_required: false,
        category: { category_code: category, max_points: cap, area_max_points: 60 }
      }
    })
    const estimate = submissionPointEstimate([['B', [
      item('b2-1', 'B.2', 25, 30),
      item('b2-2', 'B.2', 25, 30),
      item('b1-1', 'B.1', 20, 30)
    ]]])

    expect(estimate.calculatedRecords).toBe(3)
    expect(estimate.byArea.B).toBe(50)
    expect(estimate.total).toBe(50)
  })
})
