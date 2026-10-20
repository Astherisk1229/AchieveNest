import apiClient from './apiClient'

const data = response => response?.data || response || {}

export const portfolioSubmissionPortalService = {
  async listStudentPortals() { return data(await apiClient.get('/student/portfolio-submissions')).portals || [] },
  async getStudentPortal(portalId) { return data(await apiClient.get(`/student/portfolio-submissions/${portalId}`)) },
  async submitStudentPortfolio(portalId, awardDefinitionIds) { return data(await apiClient.post(`/student/portfolio-submissions/${portalId}/submit`, { award_definition_ids: awardDefinitionIds })) },
  async downloadStudentFile(portalId, submissionId, fileId) {
    return apiClient.get(`/student/portfolio-submissions/${portalId}/submissions/${submissionId}/files/${fileId}`, { responseType: 'blob' })
  },
  async listOsadPortals() { return data(await apiClient.get('/osad/portfolio-submission-portals')).portals || [] },
  async getActiveAwardYear() { return data(await apiClient.get('/osad/portfolio-submission-portals/active-award-year')) },
  async createPortal(payload) { return data(await apiClient.post('/osad/portfolio-submission-portals', payload)) },
  async getOsadPortal(portalId) { return data(await apiClient.get(`/osad/portfolio-submission-portals/${portalId}`)) },
  async addPortalAward(portalId, awardDefinitionId) { return data(await apiClient.post(`/osad/portfolio-submission-portals/${portalId}/awards`, { award_definition_id: awardDefinitionId })) },
  async setPortalStatus(portalId, status) { return data(await apiClient.patch(`/osad/portfolio-submission-portals/${portalId}/status`, { status })) },
  async selectStudents(portalId, studentIds, awardDefinitionIds) { return data(await apiClient.post(`/osad/portfolio-submission-portals/${portalId}/students`, { student_ids: studentIds, award_definition_ids: awardDefinitionIds })) },
  async assignStudentAwards(portalId, studentId, awardDefinitionIds) { return data(await apiClient.put(`/osad/portfolio-submission-portals/${portalId}/students/${studentId}/awards`, { award_definition_ids: awardDefinitionIds })) },
  async revokeStudent(portalId, studentId) { return data(await apiClient.delete(`/osad/portfolio-submission-portals/${portalId}/students/${studentId}`)) },
  async reopen(portalId, studentId, reason, acknowledgeEvaluationException = false) {
    return data(await apiClient.post(`/osad/portfolio-submission-portals/${portalId}/students/${studentId}/reopen`, { reason, acknowledge_evaluation_exception: acknowledgeEvaluationException }))
  },
  async startEvaluation(portalId, studentId) { return data(await apiClient.post(`/osad/portfolio-submission-portals/${portalId}/students/${studentId}/start-evaluation`)) },
  async getSubmissionHistory(portalId, studentId) { return data(await apiClient.get(`/osad/portfolio-submission-portals/${portalId}/students/${studentId}/submissions`)) },
  async downloadOsadFile(portalId, studentId, submissionId, fileId) {
    return apiClient.get(`/osad/portfolio-submission-portals/${portalId}/students/${studentId}/submissions/${submissionId}/files/${fileId}`, { responseType: 'blob' })
  }
}

export default portfolioSubmissionPortalService
