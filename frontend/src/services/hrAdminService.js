import apiClient from './apiClient'

export async function fetchPersonnelDirectory(params = {}) {
  const response = await apiClient.get('/hr/personnel', { params })
  return response?.data || response
}

export async function fetchOrganizationalStructure() {
  const response = await apiClient.get('/hr/organizational-structure')
  return response?.data || response
}

export async function fetchHRDashboard() {
  const response = await apiClient.get('/hr/dashboard')
  return response?.data || response
}

export async function fetchHRAudit(params = {}) {
  const response = await apiClient.get('/hr/audit', { params })
  return response?.data || response
}

export async function assignDeanRole(profileId, collegeId, payload = {}) {
  const response = await apiClient.post(`/hr/personnel/${profileId}/dean-role`, {
    college_id: collegeId,
    ...payload
  })
  return response?.data || response
}

export async function reassignCollegeDean(collegeId, payload) {
  const response = await apiClient.post(`/hr/colleges/${collegeId}/reassign-dean`, payload)
  return response?.data || response
}

export async function fetchDeanAssignmentHistory(collegeId) {
  const response = await apiClient.get(`/hr/colleges/${collegeId}/dean-history`)
  return response?.data || response
}

export async function revokeDeanRole(profileId, assignmentId) {
  const response = await apiClient.delete(`/hr/personnel/${profileId}/dean-role/${assignmentId}`)
  return response?.data || response
}

export async function recordQualificationReview(profileId, payload) {
  const response = await apiClient.post(`/hr/personnel/${profileId}/qualification-reviews`, payload)
  return response?.data || response
}

export async function fetchQualificationReviews(profileId) {
  const response = await apiClient.get(`/hr/personnel/${profileId}/qualification-reviews`)
  return response?.data || response
}

export async function updatePersonnelClassification(profileId, payload) {
  const response = await apiClient.put(`/hr/personnel/${profileId}/classification`, payload)
  return response?.data || response
}

export async function fetchPersonnelMasterData(profileId) {
  const response = await apiClient.get(`/hr/personnel/${profileId}/master-data`)
  return response?.data || response
}

export async function updatePersonnelMasterData(profileId, payload) {
  const response = await apiClient.put(`/hr/personnel/${profileId}/master-data`, payload)
  return response?.data || response
}

export async function updatePersonnelStatus(profileId, payload) {
  const response = await apiClient.put(`/hr/personnel/${profileId}/status`, payload)
  return response?.data || response
}

export async function downloadPersonnelTemplate() {
  const response = await apiClient.get('/hr/personnel/import/template', {
    responseType: 'blob'
  })
  return response
}

export async function previewPersonnelImport(formDataOrPayload) {
  let response
  if (formDataOrPayload instanceof FormData) {
    response = await apiClient.post('/hr/personnel/import/preview', formDataOrPayload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  } else {
    response = await apiClient.post('/hr/personnel/import/preview', formDataOrPayload)
  }
  return response?.data || response
}

export async function commitPersonnelImport(validRows) {
  const response = await apiClient.post('/hr/personnel/import/commit', {
    rows: validRows
  })
  return response?.data || response
}

export default {
  fetchPersonnelDirectory,
  fetchOrganizationalStructure,
  fetchHRDashboard,
  fetchHRAudit,
  assignDeanRole,
  reassignCollegeDean,
  fetchDeanAssignmentHistory,
  revokeDeanRole,
  recordQualificationReview,
  fetchQualificationReviews,
  updatePersonnelClassification,
  fetchPersonnelMasterData,
  updatePersonnelMasterData,
  updatePersonnelStatus,
  downloadPersonnelTemplate,
  previewPersonnelImport,
  commitPersonnelImport
}
