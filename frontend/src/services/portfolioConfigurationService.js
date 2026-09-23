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

export async function fetchEvaluationScaleVersion(versionId) {
  const response = await apiClient.get(`/admin/evaluation-scales/versions/${encodeURIComponent(versionId)}`)
  return response?.data || response
}

export async function fetchActiveRankingCriteria(personnelGroup) {
  const response = await apiClient.get('/admin/ranking-criteria/active', { params: { personnel_group: personnelGroup } })
  return response?.data || response
}

export async function cloneScaleVersion(sourceVersionId, input) {
  const response = await apiClient.post(`/admin/evaluation-scales/versions/${encodeURIComponent(sourceVersionId)}/clone`, input)
  return response?.data || response
}

export async function updateScaleVersion(versionId, input) {
  const response = await apiClient.put(`/admin/evaluation-scales/versions/${encodeURIComponent(versionId)}`, input)
  return response?.data || response
}

export async function validateScaleVersion(versionId) {
  const response = await apiClient.post(`/admin/evaluation-scales/versions/${encodeURIComponent(versionId)}/validate`)
  return response?.data || response
}

export async function compareScaleVersions(versionId, otherVersionId) {
  const response = await apiClient.get(`/admin/evaluation-scales/versions/${encodeURIComponent(versionId)}/compare/${encodeURIComponent(otherVersionId)}`)
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
  fetchEvaluationScaleVersion,
  fetchActiveRankingCriteria,
  cloneScaleVersion,
  updateScaleVersion,
  validateScaleVersion,
  compareScaleVersions,
  approveScaleVersion,
  retireScaleVersion
}
