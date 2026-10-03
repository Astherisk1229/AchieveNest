import { describe, expect, it } from 'vitest'
import { DEAN_ROUTES, deanReviewDetailRoute } from '../deanRoutes'
import { NAVIGATION_CATALOG } from '../navigationCatalog'
import fs from 'fs'
import path from 'path'

describe('canonical Dean routes', () => {
  it('defines the canonical module and legacy migration paths centrally', () => {
    expect(DEAN_ROUTES).toEqual({
      DASHBOARD: '/dean/dashboard',
      ANNUAL_REVIEW_ELIGIBILITY: '/dean/annual-review-eligibility',
      FACULTY_RANKING_REVIEWS: '/dean/faculty-ranking-reviews',
      COLLEGE_PERSONNEL: '/dean/college-personnel',
      LEGACY_REVIEWS: '/dean/reviews',
      LEGACY_ROSTER: '/dean/roster'
    })
  })

  it('uses canonical routes for Dean sidebar modules', () => {
    const deanDashboard = NAVIGATION_CATALOG.find(item => item.id === 'dean-dashboard-overview')
    const deanReview = NAVIGATION_CATALOG.find(item => item.id === 'dean-review-workspace')
    const deanAnnualReview = NAVIGATION_CATALOG.find(item => item.id === 'dean-annual-review-eligibility')
    const deanPersonnel = NAVIGATION_CATALOG.find(item => item.id === 'dean-faculty-roster')

    expect(deanDashboard).toMatchObject({ path: DEAN_ROUTES.DASHBOARD, portal: 'dean' })
    expect(deanDashboard).not.toHaveProperty('tab')
    expect(deanDashboard.path).not.toMatch(/^\/personnel\/dashboard/)
    expect(deanReview.path).toBe(DEAN_ROUTES.FACULTY_RANKING_REVIEWS)
    expect(deanAnnualReview.path).toBe(DEAN_ROUTES.ANNUAL_REVIEW_ELIGIBILITY)
    expect(deanPersonnel.path).toBe(DEAN_ROUTES.COLLEGE_PERSONNEL)
  })

  it('creates canonical, URL-safe review detail links', () => {
    expect(deanReviewDetailRoute('evaluation/123')).toBe('/dean/faculty-ranking-reviews/evaluation%2F123')
    const app = fs.readFileSync(path.resolve(__dirname, '../../App.jsx'), 'utf8')
    expect(app).toContain('FACULTY_RANKING_REVIEWS}/:evaluationId')
  })
})
