import apiClient from './apiClient'

export async function fetchPersonnelDirectory(params = {}) {
  const response = await apiClient.get('/hr/personnel', { params })
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

export async function assignDeanRole(profileId, collegeId) {
  const response = await apiClient.post(`/hr/personnel/${profileId}/dean-role`, {
    college_id: collegeId
  })
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

export default {
  fetchPersonnelDirectory,
  fetchHRDashboard,
  fetchHRAudit,
  assignDeanRole,
  revokeDeanRole,
  recordQualificationReview,
  fetchQualificationReviews
}
