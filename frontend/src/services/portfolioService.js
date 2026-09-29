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

  async updateRecord(id, payload) {
    const res = await apiClient.put(`/portfolio/${id}`, payload)
    return res?.data || res
  },

  async addEvidence(id, payload) {
    const res = await apiClient.post(`/portfolio/${id}/evidence`, payload)
    return res?.data || res
  },

  // ClamAV has a 60-second backend limit (loading signatures alone can take ~40s on a
  // local install), so the client waits longer than the server before giving up.
  async scanEvidence(recordId, evidenceId) {
    const res = await apiClient.post(`/portfolio/${recordId}/evidence/${evidenceId}/scan`, {}, { timeout: 90_000 })
    return res?.data || res
  },

  // Advisory OCR for evidence that already passed the scan; the backend allows up to 60s.
  async readEvidence(recordId, evidenceId) {
    const res = await apiClient.post(`/portfolio/${recordId}/evidence/${evidenceId}/ocr`, {}, { timeout: 90_000 })
    return res?.data || res
  },

  async removeEvidence(recordId, evidenceId) {
    const res = await apiClient.delete(`/portfolio/${recordId}/evidence/${evidenceId}`)
    return res?.data || res
  },

  async downloadEvidence(evidenceId) {
    return apiClient.get(`/evidence/student/${evidenceId}/download`, { responseType: 'blob' })
  },

  async downloadCertificatePdf(pdfUrl, certificateNumber = 'Official') {
    if (!pdfUrl) {
      throw new Error('No PDF URL available for this certificate.')
    }
    try {
      const url = pdfUrl.startsWith('/api/v1') ? pdfUrl.replace(/^\/api\/v1/, '') : pdfUrl
      const blob = await apiClient.get(url, { responseType: 'blob' })
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      const safeNumber = String(certificateNumber).replace(/[^a-zA-Z0-9-_]/g, '_')
      link.download = `AchieveNest-Certificate-${safeNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
      return true
    } catch (err) {
      let errorData = err?.response?.data
      if (typeof Blob !== 'undefined' && errorData instanceof Blob) {
        try {
          const text = await errorData.text()
          errorData = JSON.parse(text)
        } catch {}
      }
      const status = err?.response?.status
      const code = errorData?.error?.code || errorData?.code
      let friendlyMessage = 'Failed to download certificate PDF.'
      if (code === 'CERTIFICATE_SUPERSEDED') {
        friendlyMessage = 'This certificate has been replaced and can no longer be downloaded.'
      } else if (status === 409 || code === 'CERTIFICATE_REVOKED') {
        friendlyMessage = 'This certificate has been revoked and can no longer be downloaded.'
      } else if (status === 403) {
        friendlyMessage = 'You do not have access to this certificate.'
      } else if (status === 404) {
        friendlyMessage = 'Certificate not found.'
      } else if (errorData?.error?.message) {
        friendlyMessage = errorData.error.message
      }
      const error = new Error(friendlyMessage)
      error.code = code
      error.status = status
      throw error
    }
  },

  async resubmitRecord(id) {
    const res = await apiClient.post(`/portfolio/${id}/resubmit`)
    return res?.data || res
  },

  // status: 'submitted' | 'revision_requested' | 'verified' | 'rejected' | 'all' (default: awaiting action)
  async fetchCoordinatorQueue(params = {}) {
    const res = await apiClient.get('/program-coordinator/verification-queue', { params })
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
