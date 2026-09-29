// PARKED (2026-09-30): no UI may call this canonical lifecycle service. Student achievements use
// portfolioService (/portfolio endpoints). See docs/IMPLEMENTATION_PROMPT_STUDENT_ACHIEVEMENT_WORKFLOW.md.
import apiClient from './apiClient'

const unwrap = response => response?.data ?? response

const studentAchievementLifecycleService = {
  createDraft: async () => unwrap(await apiClient.post('/student/achievements/drafts')),
  getDraft: async (recordId) => unwrap(await apiClient.get(`/student/achievements/${recordId}`)),
  saveDraft: async (recordId, payload) => unwrap(await apiClient.put(`/student/achievements/${recordId}`, payload)),
  getSchema: async () => unwrap(await apiClient.get('/student/achievement-schema')),
  getContractSchema: async (contractCode) => unwrap(await apiClient.get(`/student/achievement-schema/${encodeURIComponent(contractCode)}`)),
  uploadEvidence: async (recordId, file) => {
    const form = new FormData()
    form.append('file', file)
    // Do not set Content-Type manually: the browser must add the multipart boundary
    // that PHP uses to populate the canonical uploaded-file request field.
    return unwrap(await apiClient.post(`/student/achievements/${recordId}/evidence`, form))
  },
  previewEvidence: (recordId, evidenceId) => apiClient.get(
    `/student/achievements/${recordId}/evidence/${evidenceId}/preview`,
    { responseType: 'blob' }
  ),
  removeEvidence: async (recordId, evidenceId) => unwrap(await apiClient.delete(
    `/student/achievements/${recordId}/evidence/${evidenceId}`
  )),
  // The backend grants the deployment-owned OCR child up to 60 seconds. This
  // request needs a matching client allowance so a successful persisted upload
  // is not reported as failed while advisory extraction is still running.
  scanEvidence: async (recordId, evidenceId) => unwrap(await apiClient.post(
    `/student/achievements/${recordId}/evidence/${evidenceId}/scan`,
    {},
    { timeout: 75_000 }
  )),
  submit: async (recordId) => unwrap(await apiClient.post(`/student/achievements/${recordId}/submit`))
}

export default studentAchievementLifecycleService
