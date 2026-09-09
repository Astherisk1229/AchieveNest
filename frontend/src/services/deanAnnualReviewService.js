import apiClient from './apiClient'

export async function fetchDeanAnnualReviews(params = {}) {
  const response = await apiClient.get('/dean/annual-reviews', { params })
  return response?.data || response
}

export async function fetchDeanAnnualReviewDetail(personnelProfileId, params = {}) {
  const response = await apiClient.get(`/dean/annual-reviews/${personnelProfileId}`, { params })
  return response?.data || response
}

export async function recordDeanAnnualReview(payload) {
  const response = await apiClient.post('/dean/annual-reviews', payload)
  return response?.data || response
}

export async function supersedeDeanAnnualReview(reviewId, payload) {
  const response = await apiClient.post(`/dean/annual-reviews/${reviewId}/supersede`, payload)
  return response?.data || response
}

export default {
  fetchDeanAnnualReviews,
  fetchDeanAnnualReviewDetail,
  recordDeanAnnualReview,
  supersedeDeanAnnualReview
}
