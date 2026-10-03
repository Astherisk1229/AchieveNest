import apiClient from './apiClient'

export async function fetchDeanAnnualReviews(params = {}) {
  const response = await apiClient.get('/dean/annual-reviews', { params })
  return response?.data?.data || response?.data || response
}

export async function fetchReviewerTrackRoster(cycleId, trackKey) {
  const response = await apiClient.get(`/reviewer/ranking-cycles/${encodeURIComponent(cycleId)}/tracks/${encodeURIComponent(trackKey)}/personnel`)
  return response?.data?.data || response?.data || response
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

export async function previewAnnualReviewImports(files, evaluationPeriodId, expectedPersonnelProfileId = null) {
  const body = new FormData()
  files.forEach(file => body.append('files[]', file))
  body.append('evaluation_period_id', evaluationPeriodId)
  if (expectedPersonnelProfileId) body.append('expected_personnel_profile_id', expectedPersonnelProfileId)
  // apiClient defaults ordinary payloads to JSON. Explicitly clear that default so
  // Axios leaves FormData intact and the browser can add the multipart boundary.
  const response = await apiClient.post('/annual-review-imports/preview', body, {
    headers: { 'Content-Type': undefined }
  })
  return response?.data?.data || response?.data || response
}

export async function fetchAnnualReviewHistory(personnelProfileId, evaluationPeriodId = '') {
  const response = await apiClient.get(`/annual-review-imports/history/${encodeURIComponent(personnelProfileId)}`, { params: evaluationPeriodId ? { evaluation_period_id: evaluationPeriodId } : {} })
  return response?.data?.data || response?.data || response
}

export async function confirmAnnualReviewImport(importId, payload = {}) {
  const response = await apiClient.post(`/annual-review-imports/${encodeURIComponent(importId)}/confirm`, payload)
  return response?.data?.data || response?.data || response
}
/** The stored annual-review workbook as a Blob (apiClient already unwraps the response body). */
export async function fetchAnnualReviewImportFile(importId) {
  const blob = await apiClient.get(`/annual-review-imports/${encodeURIComponent(importId)}/file`, { responseType: 'blob' })
  if (!(blob instanceof Blob)) throw new Error('The annual-review workbook could not be loaded.')
  return blob
}

export async function downloadAnnualReviewImport(importId, filename = 'annual-review.xlsx') {
  const blob = await fetchAnnualReviewImportFile(importId)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default {
  fetchDeanAnnualReviews,
  fetchReviewerTrackRoster,
  fetchDeanAnnualReviewDetail,
  recordDeanAnnualReview,
  supersedeDeanAnnualReview
  , previewAnnualReviewImports, confirmAnnualReviewImport, downloadAnnualReviewImport, fetchAnnualReviewImportFile, fetchAnnualReviewHistory
}
