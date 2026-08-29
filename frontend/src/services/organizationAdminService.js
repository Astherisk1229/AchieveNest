/**
 * organizationAdminService.js
 * Administrative service for persistent Student Organization management in OSAD.
 */

import apiClient from './apiClient'
import { getCurrentUser } from './authService'

function getAuthHeaders(contentType = null) {
  const user = getCurrentUser()
  const token = user?.token
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (contentType) {
    headers['Content-Type'] = contentType
  }
  return headers
}

/**
 * Fetches all student organizations with optional filters.
 * @param {Object} filters { status, category, scope }
 */
export async function fetchOrganizations(filters = {}) {
  const params = {}
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.category && filters.category !== 'all') params.category = filters.category
  if (filters.scope && filters.scope !== 'all') params.scope = filters.scope

  const response = await apiClient.get('/osad/organizations', {
    params,
    headers: getAuthHeaders()
  })

  return response?.data?.organizations || response?.organizations || []
}

/**
 * Fetches a single organization by ID.
 * @param {string} id
 */
export async function fetchOrganization(id) {
  const response = await apiClient.get(`/osad/organizations/${id}`, {
    headers: getAuthHeaders()
  })

  return response?.data?.organization || response?.organization || null
}

/**
 * Creates a new Student Organization.
 * Accepts FormData (for optional logo upload) or plain Object.
 * @param {FormData|Object} payload
 */
export async function createOrganization(payload) {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
  const headers = getAuthHeaders(isFormData ? null : 'application/json')

  const response = await apiClient.post('/osad/organizations', payload, {
    headers
  })

  return response?.data?.organization || response?.organization || response?.data || response
}

/**
 * Updates an organization logo with a new file.
 * @param {string} id
 * @param {File} file
 */
export async function updateOrganizationLogo(id, file) {
  const formData = new FormData()
  formData.append('logo', file)

  const response = await apiClient.post(`/osad/organizations/${id}/logo`, formData, {
    headers: getAuthHeaders(undefined)
  })

  return response?.data?.organization || response?.organization || response?.data || response
}

/**
 * Deletes an organization's logo.
 * @param {string} id
 */
export async function deleteOrganizationLogo(id) {
  const response = await apiClient.delete(`/osad/organizations/${id}/logo`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Returns the URL to view/fetch an organization's logo.
 * @param {string} id
 */
export function getOrganizationLogoUrl(id) {
  const baseURL = apiClient.defaults?.baseURL || '/api/v1'
  return `${baseURL}/osad/organizations/${id}/logo`
}
