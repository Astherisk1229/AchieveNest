import apiClient from './apiClient'

export const provisioningService = {
  async checkAvailability(field, value, { signal } = {}) {
    const res = await apiClient.post('/provisioning/availability', { field, value }, { signal })
    return res?.data || res
  },

  async fetchStudents(params = {}, { signal } = {}) {
    const res = await apiClient.get('/osad/students', { params, signal })
    return res?.data?.students || res?.students || []
  },

  async provisionManualStudent(payload) {
    const res = await apiClient.post('/provisioning/manual-student', payload)
    return res?.data || res
  },

  async provisionManualPersonnel(payload) {
    const res = await apiClient.post('/provisioning/manual-personnel', payload)
    return res?.data || res
  },

  async previewRoster(rosterType, rows) {
    const res = await apiClient.post('/provisioning/preview-roster', {
      roster_type: rosterType,
      rows
    })
    return res?.data || res
  },

  async commitRoster(rosterType, rows) {
    const res = await apiClient.post('/provisioning/commit-roster', {
      roster_type: rosterType,
      rows
    })
    return res?.data || res
  }
}

export default provisioningService
