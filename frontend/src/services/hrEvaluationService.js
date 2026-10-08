import apiClient from './apiClient'

const unwrap = response => response?.data || response

export const hrEvaluationService = {
  async workspace(cycleId, trackKey, stage) {
    return unwrap(await apiClient.get(`/hr/ranking-cycles/${encodeURIComponent(cycleId)}/tracks/${encodeURIComponent(trackKey)}/workspace/${encodeURIComponent(stage)}`))
  },
  async list(params = {}) {
    const data = unwrap(await apiClient.get('/reviewer/evaluations', { params }))
    return data?.evaluations || []
  },
  async get(id) {
    return unwrap(await apiClient.get(`/reviewer/evaluations/${id}`))
  },
  async getReport(id) {
    return unwrap(await apiClient.get(`/reviewer/evaluations/${id}/report`))
  },
  async start(id) {
    return unwrap(await apiClient.post(`/reviewer/evaluations/${id}/start`))
  },
  async returnForRevision(id, payload) {
    return unwrap(await apiClient.post(`/reviewer/evaluations/${id}/return`, payload))
  },
  async markReady(id) {
    return unwrap(await apiClient.post(`/reviewer/evaluations/${id}/ready`))
  },
  async finalize(id, payload = {}) {
    return unwrap(await apiClient.post(`/reviewer/evaluations/${id}/finalize`, payload))
  },
  async verifyItem(id, itemId, status = 'verified', remarks = '') {
    return unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}/verify`, { verification_status: status, evaluator_remarks: remarks }))
  },
  async rateItem(id, itemId, remarks = '', awardedPoints = null) {
    const payload = { evaluator_remarks: remarks }
    if (awardedPoints !== null && awardedPoints !== undefined) payload.awarded_points = Number(awardedPoints)
    return unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}/rate`, payload))
  },
  async saveItemRemarks(id, itemId, remarks = '') {
    return unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}/remarks`, { evaluator_remarks: remarks }))
  },
  // Non-Teaching Area A: HR enters or corrects the DS of one criterion (A.1–A.3).
  async setAreaADs(id, criterionCode, ds, reason = '') {
    const data = unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(id)}/area-a/${encodeURIComponent(criterionCode)}`, { ds, reason }))
    return data?.item || data?.data?.item || null
  }
}

export default hrEvaluationService
