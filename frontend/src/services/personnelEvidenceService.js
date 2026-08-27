import apiClient from './apiClient'

/**
 * Secure Personnel evidence transfer helpers.
 * Security-sensitive metadata is derived by the backend from the actual bytes.
 */
export const personnelEvidenceService = {
  async upload(accomplishmentId, file) {
    if (!(file instanceof File)) {
      throw new TypeError('A File object is required for evidence upload.')
    }

    const form = new FormData()
    form.append('file', file, file.name)

    const res = await apiClient.post(`/personnel/accomplishments/${accomplishmentId}/evidence`, form)
    return res?.data || res
  },

  async getDownload(evidenceId) {
    const res = await apiClient.get(`/personnel/evidence/${evidenceId}/download`)
    return res?.data || res
  }
}

export default personnelEvidenceService
