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

  /**
   * Secure multipart evidence upload. The backend derives MIME type, size,
   * checksum and Storage path from the actual bytes; callers must not supply
   * those security-sensitive values.
   */
  async addEvidence(id, file, evidenceType = 'certificate') {
    if (!(file instanceof File)) {
      throw new TypeError('A File object is required for evidence upload.')
    }
    const form = new FormData()
    form.append('file', file, file.name)
    form.append('evidence_type', evidenceType)
    const res = await apiClient.post(`/portfolio/${id}/evidence`, form)
    return res?.data || res
  },

  async getEvidenceDownload(evidenceId) {
    const res = await apiClient.get(`/portfolio/evidence/${evidenceId}/download`)
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
