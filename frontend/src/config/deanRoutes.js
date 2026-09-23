export const DEAN_ROUTES = Object.freeze({
  DASHBOARD: '/dean/dashboard',
  ANNUAL_REVIEW_ELIGIBILITY: '/dean/annual-review-eligibility',
  FACULTY_RANKING_REVIEWS: '/dean/faculty-ranking-reviews',
  COLLEGE_PERSONNEL: '/dean/college-personnel',
  LEGACY_REVIEWS: '/dean/reviews',
  LEGACY_ROSTER: '/dean/roster'
})

export function deanReviewDetailRoute(submissionId) {
  return `${DEAN_ROUTES.FACULTY_RANKING_REVIEWS}/${encodeURIComponent(submissionId)}`
}
