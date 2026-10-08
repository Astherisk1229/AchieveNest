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
// awardedPoints is sent only for criteria without an official point breakdown (evaluator_judgment_required).
export async function approveDeanReviewItem(evaluationId, itemId, note = '', awardedPoints = null) {
  await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(evaluationId)}/items/${encodeURIComponent(itemId)}/verify`, { verification_status: 'verified', evaluator_remarks: note })
  const body = awardedPoints === null || awardedPoints === undefined ? { evaluator_remarks: note } : { evaluator_remarks: note, awarded_points: Number(awardedPoints) }
  return unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(evaluationId)}/items/${encodeURIComponent(itemId)}/rate`, body))
}
export async function rejectDeanReviewItem(evaluationId, itemId, reason) { return unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(evaluationId)}/items/${encodeURIComponent(itemId)}/verify`, { verification_status: 'ineligible', evaluator_remarks: reason })) }
export async function saveDeanReviewItemRemarks(evaluationId, itemId, remarks) { return unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(evaluationId)}/items/${encodeURIComponent(itemId)}/remarks`, { evaluator_remarks: remarks })) }
export async function createDeanDeficiency(evaluationId, reason, evaluationItemId = '') {
  return unwrap(await apiClient.post(`/hr/evaluations/${encodeURIComponent(evaluationId)}/deficiencies`, {
    reason,
    ...(evaluationItemId ? { evaluation_item_id: evaluationItemId } : {})
  }))
}
export async function returnDeanReview(id, reason) { return unwrap(await apiClient.post(`/reviewer/evaluations/${encodeURIComponent(id)}/return`, { reason })) }
export async function endorseDeanReview(id) { return unwrap(await apiClient.post(`/reviewer/evaluations/${encodeURIComponent(id)}/ready`)) }
export async function getDeanReviewReport(id) { return unwrap(await apiClient.get(`/reviewer/evaluations/${encodeURIComponent(id)}/report`)) }
