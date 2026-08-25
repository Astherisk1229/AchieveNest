import apiClient from './apiClient'

export const provisioningService = {
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
