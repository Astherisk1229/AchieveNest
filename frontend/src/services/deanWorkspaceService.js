import apiClient from './apiClient'

export async function getDeanDashboard() {
  const response = await apiClient.get('/dean/dashboard')
  return response?.data?.data || response?.data || null
}

export async function getDeanRoster() {
  const response = await apiClient.get('/dean/roster')
  return response?.data?.data || response?.data || null
}

export async function getDeanReviews(params = {}) {
  const response = await apiClient.get('/dean/reviews', { params })
  return response?.data?.data || response?.data || null
}

export async function getDeanReviewDetail(id) {
  const response = await apiClient.get(`/dean/reviews/${encodeURIComponent(id)}`)
  return response?.data?.data || response?.data || null
}

const unwrap = response => response?.data?.data || response?.data || response
export async function startDeanReview(id) { return unwrap(await apiClient.post(`/reviewer/evaluations/${encodeURIComponent(id)}/start`)) }
export async function approveDeanReviewItem(evaluationId, itemId, note = '') {
  await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(evaluationId)}/items/${encodeURIComponent(itemId)}/verify`, { verification_status: 'verified', evaluator_remarks: note })
  return unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(evaluationId)}/items/${encodeURIComponent(itemId)}/rate`, { evaluator_remarks: note }))
}
export async function rejectDeanReviewItem(evaluationId, itemId, reason) { return unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(evaluationId)}/items/${encodeURIComponent(itemId)}/verify`, { verification_status: 'ineligible', evaluator_remarks: reason })) }
export async function returnDeanReview(id, reason) { return unwrap(await apiClient.post(`/reviewer/evaluations/${encodeURIComponent(id)}/return`, { reason })) }
export async function endorseDeanReview(id) { return unwrap(await apiClient.post(`/reviewer/evaluations/${encodeURIComponent(id)}/ready`)) }
export async function getDeanReviewReport(id) { return unwrap(await apiClient.get(`/reviewer/evaluations/${encodeURIComponent(id)}/report`)) }
