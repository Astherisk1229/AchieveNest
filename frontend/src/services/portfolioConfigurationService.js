import apiClient from './apiClient'

export async function fetchWorkspaceConfiguration(params = {}) {
  const response = await apiClient.get('/personnel/portfolio/configuration', { params })
  return response?.data || response
}

export async function fetchAreaConfiguration(areaCode, params = {}) {
  const response = await apiClient.get(`/personnel/portfolio/configuration/areas/${areaCode}`, { params })
  return response?.data || response
}

export async function validateAccomplishmentEntry(entry) {
  const response = await apiClient.post('/personnel/portfolio/validate-entry', entry)
  return response?.data || response
}

export async function fetchEvaluationScalesCatalogue() {
  const response = await apiClient.get('/admin/evaluation-scales')
  return response?.data || response
}

export async function approveScaleVersion(versionId, reason) {
  const response = await apiClient.post(`/admin/evaluation-scales/${versionId}/approve`, { reason })
  return response?.data || response
}

export async function retireScaleVersion(versionId, reason) {
  const response = await apiClient.post(`/admin/evaluation-scales/${versionId}/retire`, { reason })
  return response?.data || response
}

export default {
  fetchWorkspaceConfiguration,
  fetchAreaConfiguration,
  validateAccomplishmentEntry,
  fetchEvaluationScalesCatalogue,
  approveScaleVersion,
  retireScaleVersion
}
