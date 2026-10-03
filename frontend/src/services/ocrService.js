import apiClient from './apiClient'

export const ocrService = {
  async extractPersisted(evidenceId) {
    const response = await apiClient.post(`/ocr/extract-evidence/${evidenceId}`, {})
    return response?.data?.document || null
  },
  async extract(file) {
    const body = new FormData()
    body.append('document', file)
    const response = await apiClient.post('/ocr/extract', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000
    })
    return response?.data?.document || null
  }
}
