import apiClient from './apiClient'

function data(response) {
  return response?.data ?? response
}

const certificateTemplateService = {
  async listFamilies({ signal } = {}) {
    return data(await apiClient.get('/certificate-templates', { signal }))?.families || []
  },
  async getFamily(familyId, { signal } = {}) {
    return data(await apiClient.get(`/certificate-templates/${encodeURIComponent(familyId)}`, { signal }))
  },
  async createFamily(payload) {
    return data(await apiClient.post('/certificate-templates', payload))
  },
  async createDraft(familyId, payload = {}) {
    return data(await apiClient.post(`/certificate-templates/${encodeURIComponent(familyId)}/versions`, payload))
  },
  async getVersion(versionId, { signal } = {}) {
    return data(await apiClient.get(`/certificate-template-versions/${encodeURIComponent(versionId)}`, { signal }))
  },
  async updateDraft(versionId, payload) {
    return data(await apiClient.patch(`/certificate-template-versions/${encodeURIComponent(versionId)}`, payload))
  },
  async validateDraft(versionId, expectedToken) {
    return data(await apiClient.post(`/certificate-template-versions/${encodeURIComponent(versionId)}/validate`, { expected_token: expectedToken }))
  },
  async publishDraft(versionId, expectedToken) {
    return data(await apiClient.post(`/certificate-template-versions/${encodeURIComponent(versionId)}/publish`, { expected_token: expectedToken }))
  },
  async getRegistry({ signal } = {}) {
    return data(await apiClient.get('/certificate-templates/placeholders', { signal }))
  }
}

export default certificateTemplateService
