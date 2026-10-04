import apiClient from './apiClient'

const certificateService = {
  async getTemplates(purpose = '', { signal } = {}) {
    const query = purpose ? `?purpose=${encodeURIComponent(purpose)}` : ''
    const response = await apiClient.get(`/certificates/templates${query}`, { signal })
    return response?.data || []
  },
  async getReadiness(payload, { signal } = {}) {
    const response = await apiClient.post('/certificates/readiness', payload, { signal })
    return response?.data
  },
  async getEventCertificateCandidates(eventId, { signal } = {}) {
    const response = await apiClient.get(`/events/${encodeURIComponent(eventId)}/certificate-candidates`, { signal })
    return response?.data?.candidates || []
  },
  async resolveEventCertificateSourceRecords(eventId, studentIds = [], { signal } = {}) {
    const response = await apiClient.post(`/events/${encodeURIComponent(eventId)}/certificate-source-records/resolve`, { student_ids: studentIds }, { signal })
    return response?.data?.results || []
  },
  async issueCertificate(payload, { signal } = {}) {
    const response = await apiClient.post('/certificates/issue', payload, { signal })
    return response?.data
  },
  async issue(payload, options = {}) {
    return this.issueCertificate(payload, options)
  },
  async listCertificates(params = {}, { signal } = {}) {
    const response = await apiClient.get('/certificates', { params, signal })
    const data = response?.data || {}
    return {
      certificates: Array.isArray(data.certificates) ? data.certificates : [],
      summary: data.summary || { total: 0, issued: 0, revoked: 0, superseded: 0 }
    }
  },
  async revokeCertificate(certificateId, payload) {
    const response = await apiClient.post(`/certificates/${encodeURIComponent(certificateId)}/revoke`, payload)
    return response?.data
  },
  async reissueCertificate(certificateId, payload) {
    const response = await apiClient.post(`/certificates/${encodeURIComponent(certificateId)}/reissue`, payload)
    return response?.data
  },
  async verify(publicVerificationId) {
    const response = await apiClient.get(`/certificates/verify/${encodeURIComponent(publicVerificationId)}`)
    return response?.data
  }
}

export default certificateService
