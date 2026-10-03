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
  // Non-Teaching Area A: HR enters or corrects the DS of one criterion (A.1–A.3).
  async setAreaADs(id, criterionCode, ds, reason = '') {
    const data = unwrap(await apiClient.patch(`/reviewer/evaluations/${encodeURIComponent(id)}/area-a/${encodeURIComponent(criterionCode)}`, { ds, reason }))
    return data?.item || data?.data?.item || null
  }
}

export default hrEvaluationService
