/**
 * collegeAdminService.js
 * Administrative service for College identity, branding, and Academic Program management in OSAD.
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
 * Fetches all colleges with optional status filter.
 * @param {Object} filters { status }
 */
export async function fetchColleges(filters = {}) {
  const params = {}
  if (filters.status && filters.status !== 'all') params.status = filters.status

  const response = await apiClient.get('/osad/colleges', {
    params,
    headers: getAuthHeaders()
  })

  return response?.data?.colleges || response?.colleges || []
}

/**
 * Fetches a single college by ID.
 * @param {string} id
 */
export async function fetchCollege(id) {
  const response = await apiClient.get(`/osad/colleges/${id}`, {
    headers: getAuthHeaders()
  })

  return response?.data?.college || response?.college || null
}

/**
 * Atomically creates a new College, optional branding logo, and optional nested programs.
 * Accepts FormData (for optional logo upload) or plain Object.
 * @param {FormData|Object} payload
 */
export async function createCollege(payload) {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
  const headers = getAuthHeaders(isFormData ? null : 'application/json')

  const response = await apiClient.post('/osad/colleges', payload, {
    headers
  })

  return response?.data || response
}

/**
 * Returns the controlled streaming URL for a College logo.
 * @param {string} id
 */
export function getCollegeLogoUrl(id) {
  if (!id) return null
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
  return `${baseURL.replace(/\/$/, '')}/osad/colleges/${id}/logo`
}

/**
 * Fetches academic programs optionally filtered by College ID.
 * @param {Object} filters { college_id }
 */
export async function fetchAcademicPrograms(filters = {}) {
  const params = {}
  if (filters.college_id && filters.college_id !== 'all') params.college_id = filters.college_id

  const response = await apiClient.get('/osad/academic-programs', {
    params,
    headers: getAuthHeaders()
  })

  return response?.data?.programs || response?.programs || []
}

/**
 * Creates a standalone Academic Program under a College.
 * @param {Object} payload { college_id, code, name }
 */
export async function createAcademicProgram(payload) {
  const headers = getAuthHeaders('application/json')

  const response = await apiClient.post('/osad/academic-programs', payload, {
    headers
  })

  return response?.data || response
}

/**
 * Fetches eligible personnel and their coordinator assignments for a College.
 * @param {string} collegeId
 */
export async function fetchCoordinatorPersonnel(collegeId) {
  const response = await apiClient.get(`/osad/colleges/${collegeId}/coordinator-personnel`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Fetches one personnel member's assignment context for a specific College.
 * @param {string} collegeId
 * @param {string} profileId
 */
export async function fetchPersonnelCoordinatorContext(collegeId, profileId) {
  const response = await apiClient.get(`/osad/colleges/${collegeId}/coordinator-personnel/${profileId}`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Atomically updates a personnel member's multi-program coordinator assignments for a College.
 * @param {string} collegeId
 * @param {string} profileId
 * @param {Array<string>} programIds
 */
export async function updatePersonnelCoordinatorAssignments(collegeId, profileId, programIds = []) {
  const headers = getAuthHeaders('application/json')

  const response = await apiClient.put(
    `/osad/colleges/${collegeId}/coordinator-personnel/${profileId}`,
    { program_ids: programIds },
    { headers }
  )

  return response?.data || response
}

/**
 * Updates Academic Program master data (name, degree_level, status, code).
 * @param {string} programId
 * @param {Object} payload { name, degree_level, status, code }
 */
export async function updateAcademicProgram(programId, payload) {
  const headers = getAuthHeaders('application/json')

  const response = await apiClient.put(
    `/osad/academic-programs/${programId}`,
    payload,
    { headers }
  )

  return response?.data || response
}

/**
 * Atomically reassigns an Academic Program's coordinator coverage.
 * @param {string} collegeId
 * @param {string} programId
 * @param {string} newCoordinatorProfileId
 */
export async function reassignProgramCoordinator(collegeId, programId, newCoordinatorProfileId) {
  const headers = getAuthHeaders('application/json')

  const response = await apiClient.post(
    `/osad/colleges/${collegeId}/reassign-coordinator`,
    {
      program_id: programId,
      new_coordinator_profile_id: newCoordinatorProfileId
    },
    { headers }
  )

  return response?.data || response
}

