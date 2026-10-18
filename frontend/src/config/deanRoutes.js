export const DEAN_ROUTES = Object.freeze({
  DASHBOARD: '/dean/dashboard',
  FACULTY_EVALUATION: '/dean/faculty-evaluation',
  ANNUAL_REVIEW_ELIGIBILITY: '/dean/annual-review-eligibility',
  FACULTY_RANKING_REVIEWS: '/dean/faculty-ranking-reviews',
  COLLEGE_PERSONNEL: '/dean/college-personnel',
  LEGACY_REVIEWS: '/dean/reviews',
  LEGACY_ROSTER: '/dean/roster'
})

export function deanReviewDetailRoute(submissionId, context = {}) {
  const params = new URLSearchParams({ tab: 'portfolio', evaluation: String(submissionId) })
  Object.entries(context).forEach(([key, value]) => { if (value) params.set(key, String(value)) })
  return `${DEAN_ROUTES.FACULTY_EVALUATION}?${params.toString()}`
}
