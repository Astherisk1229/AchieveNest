import apiClient from './apiClient'

const unwrap = response => response?.data?.data || response?.data || response
const enc = value => encodeURIComponent(value)

export const facultyPhaseOService = {
  context: evaluationId => apiClient.get(`/reviewer/evaluations/${enc(evaluationId)}/phase-o`).then(unwrap),
  suggestApplied: (personnelId, payload) => apiClient.post(`/reviewer/personnel/${enc(personnelId)}/rank-applied-for/suggest`, payload).then(unwrap),
  confirmApplied: (decisionId, payload) => apiClient.post(`/reviewer/rank-applied-for/${enc(decisionId)}/confirm`, payload).then(unwrap),
  suggestRecommended: evaluationId => apiClient.post(`/reviewer/evaluations/${enc(evaluationId)}/recommended-rank/suggest`).then(unwrap),
  confirmRecommended: (decisionId, payload) => apiClient.post(`/reviewer/recommended-ranks/${enc(decisionId)}/confirm`, payload).then(unwrap),
  finalize: (decisionId, payload) => apiClient.post(`/hr/recommended-ranks/${enc(decisionId)}/finalize`, payload).then(unwrap),
  reconsider: (decisionId, reason) => apiClient.post(`/hr/recommended-ranks/${enc(decisionId)}/return-for-reconsideration`, { reason }).then(unwrap),
  generateDocument: reviewId => apiClient.post(`/hr/final-rank-reviews/${enc(reviewId)}/official-summary`).then(unwrap),
  openDocument: async documentId => {
    const blob = await apiClient.get(`/official-evaluation-documents/${enc(documentId)}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}

export default facultyPhaseOService
