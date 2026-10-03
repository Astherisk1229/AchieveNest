import React from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import OSADAwardsAndCriteriaPage from '../OSADAwardsAndCriteriaPage'
import OSADPotentialCandidatesView from '../OSADPotentialCandidatesView'
import OSADAwardDetailPage from '../OSADAwardDetailPage'
import OSADAwardRoutePage from '../OSADAwardRoutePage'

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8')

describe('Phase 1 awards structural UI', () => {
  it('exposes the route-oriented page surfaces', () => {
    expect((<OSADAwardsAndCriteriaPage />).type).toBe(OSADAwardsAndCriteriaPage)
    expect((<OSADAwardDetailPage />).type).toBe(OSADAwardDetailPage)
    expect((<OSADPotentialCandidatesView />).type).toBe(OSADPotentialCandidatesView)
    expect((<OSADAwardRoutePage />).type).toBe(OSADAwardRoutePage)
  })

  it('registers stable award routes and preserves dashboard compatibility', () => {
    const app = read('../../../App.jsx')
    const dashboard = read('../OSADDashboardPage.jsx')

    expect(app).toContain('path="/osad/awards"')
    expect(app).toContain('path="/osad/awards/:awardId"')
    expect(app).toContain('path="/osad/awards/:awardId/candidates"')
    expect(app).toContain('path="/osad/awards/:awardId/candidates/:studentId/review"')
    expect(dashboard).toContain('<Navigate to="/osad/awards" replace />')
  })

  it('removes ranked-candidate presentation and generic score fallbacks', () => {
    const candidateList = read('../OSADPotentialCandidatesView.jsx')
    const candidateReview = read('../OSADStudentAwardReviewWorkspace.jsx')
    const catalog = read('../OSADAwardsAndCriteriaPage.jsx')

    expect(candidateList).not.toMatch(/top3Candidates|Top Stage 1 Candidates|stage1Rank/)
    expect(candidateReview).not.toMatch(/top3Candidates|Top Stage 1 Candidates|stage1Rank/)
    expect(candidateList).not.toMatch(/computable_max_score\s*\|\|\s*50/)
    expect(candidateList).not.toMatch(/candidate_threshold_percent\s*\|\|/)
    expect(catalog).not.toContain('v1.0')
    expect(catalog).not.toContain('2025-2026')
  })

  it('keeps proposed-rubric candidate generation unavailable in the UI', () => {
    const candidateList = read('../OSADPotentialCandidatesView.jsx')
    const detail = read('../OSADAwardDetailPage.jsx')

    expect(candidateList).toContain('Candidate generation unavailable')
    expect(candidateList).toContain('state.authorityPending')
    expect(detail).toContain('disabled={model.authorityPending}')
  })

  it('provides explicit loading, error, empty, and search-empty states', () => {
    const catalog = read('../OSADAwardsAndCriteriaPage.jsx')
    const candidateList = read('../OSADPotentialCandidatesView.jsx')

    for (const state of ['AwardCatalogSkeleton', 'OSADErrorState', 'OSADEmptyState', 'OSADSearchEmptyState']) {
      expect(catalog).toContain(state)
    }
    for (const state of ['CandidateSkeleton', 'OSADErrorState', 'OSADEmptyState', 'OSADSearchEmptyState']) {
      expect(candidateList).toContain(state)
    }
  })
})
