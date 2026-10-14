import apiClient from './apiClient'

const attendanceCertificateService = {
  async list({ signal } = {}) {
    const response = await apiClient.get('/attendance-certificates', { signal })
    const data = response?.data || {}

    return {
      certificates: Array.isArray(data.certificates) ? data.certificates : [],
      summary: data.summary || { total: 0, verified: 0, events: 0 }
    }
  }
}

export default attendanceCertificateService
