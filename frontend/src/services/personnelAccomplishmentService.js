import apiClient from './apiClient'

/**
 * personnelAccomplishmentService.js
 * Frontend Service for Personnel Accomplishment persistence and secure evidence file upload/streaming.
 */
export const personnelAccomplishmentService = {
  /**
   * Fetch all portfolio accomplishments for the authenticated personnel (or HR scoped view).
   */
  async fetchAccomplishments(params = {}) {
    const res = await apiClient.get('/personnel/accomplishments', { params })
    return res?.data?.accomplishments || res?.accomplishments || []
  },

  /**
   * Persist a new accomplishment record to the database.
   */
  async createAccomplishment(payload) {
    const res = await apiClient.post('/personnel/accomplishments', payload)
    return res?.data || res
  },

  /**
   * Update an existing editable accomplishment record in the database.
   */
  async updateAccomplishment(accomplishmentId, payload) {
    const res = await apiClient.put(`/personnel/accomplishments/${accomplishmentId}`, payload)
    return res?.data || res
  },

  /**
   * Upload and link a physical evidence file (PDF, JPG, PNG <= 10MB) to an accomplishment.
   */
  async uploadEvidence(accomplishmentId, file) {
    const formData = new FormData()
    formData.append('file', file)

    const res = await apiClient.post(`/personnel/accomplishments/${accomplishmentId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res?.data || res
  },

  /**
   * Delete an accomplishment and its associated evidence records and storage files.
   */
  async deleteAccomplishment(accomplishmentId) {
    const res = await apiClient.delete(`/personnel/accomplishments/${accomplishmentId}`)
    return res?.data || res
  },

  /**
   * Download real evidence binary file via authenticated stream endpoint.
   */
  async downloadEvidenceBlob(evidenceId, filename = 'evidence_document.pdf') {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    let token = localStorage.getItem('achievenest_access_token') || sessionStorage.getItem('achievenest_access_token')
    if (!token) {
      try {
        const raw = localStorage.getItem('achievenest_current_user') || sessionStorage.getItem('achievenest_current_user')
        const parsed = JSON.parse(raw)
        token = parsed?.token || parsed?.access_token
      } catch {
        token = null
      }
    }

    const response = await fetch(`${baseURL}/evidence/personnel/${evidenceId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (!response.ok) {
      throw new Error(`Failed to download evidence file (Status ${response.status})`)
    }

    const blob = await response.blob()
    if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
    }
    return true
  },

  /**
   * Obtain a temporary Blob URL for inline viewing of proof documents.
   */
  async getEvidenceBlobUrl(evidenceId) {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    let token = localStorage.getItem('achievenest_access_token') || sessionStorage.getItem('achievenest_access_token')
    if (!token) {
      try {
        const raw = localStorage.getItem('achievenest_current_user') || sessionStorage.getItem('achievenest_current_user')
        const parsed = JSON.parse(raw)
        token = parsed?.token || parsed?.access_token
      } catch {
        token = null
      }
    }

    const response = await fetch(`${baseURL}/evidence/personnel/${evidenceId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (!response.ok) {
      throw new Error(`Failed to load evidence file (Status ${response.status})`)
    }

    const blob = await response.blob()
    return URL.createObjectURL(blob)
  }
}

export default personnelAccomplishmentService
