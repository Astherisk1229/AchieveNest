import apiClient from './apiClient'

export const portfolioService = {
  async fetchCategories() {
    const res = await apiClient.get('/portfolio/categories')
    return res?.data?.categories || res?.categories || []
  },

  async fetchRecords(params = {}) {
    const res = await apiClient.get('/portfolio', { params })
    return res?.data?.records || res?.records || []
  },

  async fetchRecord(id) {
    const res = await apiClient.get(`/portfolio/${id}`)
    return res?.data || res
  },

  async createRecord(payload) {
    const res = await apiClient.post('/portfolio', payload)
    return res?.data || res
  },

  async addEvidence(id, payload) {
    const res = await apiClient.post(`/portfolio/${id}/evidence`, payload)
    return res?.data || res
  },

  async fetchCoordinatorQueue() {
    const res = await apiClient.get('/program-coordinator/verification-queue')
    return res?.data?.queue || res?.queue || []
  },

  async verifyRecord(id, remarks = '') {
    const res = await apiClient.post(`/portfolio/${id}/verify`, { remarks })
    return res?.data || res
  },

  async requestRevision(id, remarks = '') {
    const res = await apiClient.post(`/portfolio/${id}/request-revision`, { remarks })
    return res?.data || res
  },

  async rejectRecord(id, remarks = '') {
    const res = await apiClient.post(`/portfolio/${id}/reject`, { remarks })
    return res?.data || res
  },

  async fetchAwards() {
    const res = await apiClient.get('/osad/awards')
    return res?.data?.awards || res?.awards || []
  },

  async fetchAwardCandidates(awardId) {
    const res = await apiClient.get(`/osad/awards/${awardId}/candidates`)
    return res?.data || res
  },

  async fetchCandidateScoringBasis(awardId, studentId) {
    const res = await apiClient.get(`/osad/awards/${awardId}/students/${studentId}/basis`)
    return res?.data || res
  },

  async createDeanNomination(payload) {
    const res = await apiClient.post('/dean/nominations', payload)
    return res?.data || res
  }
}

export default portfolioService
