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

export async function downloadEvaluationScaleVersionPdf(versionId, title = 'Ranking-Criteria') {
  let blob
  try {
    const response = await apiClient.get(`/admin/evaluation-scales/versions/${encodeURIComponent(versionId)}/pdf`, { responseType: 'blob', timeout: 120000 })
    blob = response instanceof Blob ? response : response?.data
  } catch (failure) {
    const errorBlob = failure?.response?.data instanceof Blob
      ? failure.response.data
      : failure instanceof Blob
        ? failure
        : null
    if (errorBlob) {
      let parsed = null
      try { parsed = JSON.parse(await errorBlob.text()) } catch { /* Non-JSON download failure. */ }
      throw new Error(parsed?.error?.message || 'The ranking criteria PDF could not be generated.')
    }
    throw failure
  }
  if (!(blob instanceof Blob) || blob.type !== 'application/pdf') throw new Error('The server did not return a valid PDF.')

  const safeName = String(title).normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'Ranking-Criteria'
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeName}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
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
  downloadEvaluationScaleVersionPdf,
  fetchActiveRankingCriteria,
  cloneScaleVersion,
  updateScaleVersion,
  validateScaleVersion,
  compareScaleVersions,
  approveScaleVersion,
  retireScaleVersion
}
