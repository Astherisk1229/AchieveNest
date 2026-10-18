import { describe, expect, it } from 'vitest'
import { DEAN_ROUTES, deanReviewDetailRoute } from '../deanRoutes'
import { NAVIGATION_CATALOG } from '../navigationCatalog'
import fs from 'fs'
import path from 'path'

describe('canonical Dean routes', () => {
  it('defines the canonical module and legacy migration paths centrally', () => {
    expect(DEAN_ROUTES).toEqual({
      DASHBOARD: '/dean/dashboard',
      FACULTY_EVALUATION: '/dean/faculty-evaluation',
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

    expect(deanDashboard).toBeUndefined()
    expect(deanReview.path).toBe(DEAN_ROUTES.FACULTY_EVALUATION)
    expect(deanReview.label).toBe('Faculty Evaluation')
    expect(deanAnnualReview).toBeUndefined()
    expect(deanPersonnel.path).toBe(DEAN_ROUTES.COLLEGE_PERSONNEL)
  })

  it('creates canonical, URL-safe review detail links', () => {
    expect(deanReviewDetailRoute('evaluation/123')).toBe('/dean/faculty-evaluation?tab=portfolio\u0026evaluation=evaluation%2F123')
    const app = fs.readFileSync(path.resolve(__dirname, '../../App.jsx'), 'utf8')
    expect(app).toContain('FACULTY_RANKING_REVIEWS}/:evaluationId')
    expect(app).toContain('DeanEvaluationRedirect tab="annual"')
    expect(app).toContain('DeanEvaluationRedirect tab="portfolio"')
    expect(app).toMatch(/import\s*\{[^}]*\buseParams\b[^}]*\}\s*from\s*'react-router-dom'/)
  })
})
