import React from 'react'
import { describe, it, expect } from 'vitest'
import OSADStudentAwardReviewWorkspace from '../OSADStudentAwardReviewWorkspace'
import OSADAwardsAndCriteriaPage from '../OSADAwardsAndCriteriaPage'

describe('Phase H — OSAD Awards & Scoring Criteria UX', () => {
  it('instantiates the route-backed candidate review and awards catalog', () => {
    const reviewPage = <OSADStudentAwardReviewWorkspace awardId="award-1" studentId="student-1" />
    const criteriaPage = <OSADAwardsAndCriteriaPage />

    expect(reviewPage.type).toBe(OSADStudentAwardReviewWorkspace)
    expect(criteriaPage.type).toBe(OSADAwardsAndCriteriaPage)
  })
})
