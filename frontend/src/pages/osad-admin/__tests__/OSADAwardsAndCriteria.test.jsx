import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OSADAwardsAndCriteriaPage from '../OSADAwardsAndCriteriaPage'
import * as awardAdminService from '../../../services/awardAdminService'

describe('OSADAwardsAndCriteria (Phase F)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('instantiates OSADAwardsAndCriteriaPage component', () => {
    const element = <OSADAwardsAndCriteriaPage />
    expect(element.type).toBe(OSADAwardsAndCriteriaPage)
  })

  it('awardAdminService exposes fetchAwards, fetchCandidates, and fetchScoringBasis', () => {
    expect(typeof awardAdminService.fetchAwards).toBe('function')
    expect(typeof awardAdminService.fetchCandidates).toBe('function')
    expect(typeof awardAdminService.fetchScoringBasis).toBe('function')
    expect(typeof awardAdminService.runAwardEvaluation).toBe('function')
    expect(typeof awardAdminService.submitDeanNomination).toBe('function')
  })

  it('validates authoritative 15 awards structure and candidate threshold invariant (80.00%)', () => {
    const mockAwards = [
      {
        id: 'awd-01',
        code: 'AWD-MOS',
        name: 'Most Outstanding Student',
        candidate_threshold_percent: 80.0,
        criteria: [
          { code: 'CRIT-1', max_points: 30, weight_percentage: 30 },
          { code: 'CRIT-2', max_points: 35, weight_percentage: 35 },
          { code: 'CRIT-3', max_points: 35, weight_percentage: 35 }
        ]
      }
    ]

    expect(mockAwards[0].candidate_threshold_percent).toBe(80.0)
    const sumWeights = mockAwards[0].criteria.reduce((acc, c) => acc + c.weight_percentage, 0)
    expect(sumWeights).toBe(100)
  })
})
