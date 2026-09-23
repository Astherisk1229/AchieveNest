import apiClient from './apiClient'

const unwrap = response => response?.data || response

export const hrEvaluationService = {
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
  }
}

export default hrEvaluationService
