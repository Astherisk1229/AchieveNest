/**
 * awardAdminService.js
 * Administrative API service for OSAD Awards, Criteria, and Potential Award Candidates.
 */

import apiClient from './apiClient'
import { getCurrentUser } from './authService'

function getAuthHeaders() {
  const user = getCurrentUser()
  const token = user?.token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Fetches active award definitions with criteria and candidate threshold (80.00%).
 */
export async function fetchAwards() {
  const response = await apiClient.get('/osad/awards', {
    headers: getAuthHeaders()
  })

  return response?.data?.awards || response?.awards || []
}

/**
 * Fetches potential award candidates and dean nominations across all awards with optional filters.
 * @param {Object} filters { award_id, college_id, source }
 */
export async function fetchCandidates(filters = {}) {
  const params = {}
  if (filters.award_id && filters.award_id !== 'all') params.award_id = filters.award_id
  if (filters.college_id && filters.college_id !== 'all') params.college_id = filters.college_id
  if (filters.source && filters.source !== 'all') params.source = filters.source

  const response = await apiClient.get('/osad/candidates', {
    params,
    headers: getAuthHeaders()
  })

  return response?.data?.candidates || response?.candidates || []
}

/**
 * Fetches explainable scoring basis and verified evidence trace for a student's award evaluation.
 * @param {string} awardId
 * @param {string} studentId
 */
export async function fetchScoringBasis(awardId, studentId) {
  const response = await apiClient.get(`/osad/awards/${awardId}/students/${studentId}/basis`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Executes automated award evaluation for all eligible students or a single student.
 * @param {string} awardId
 * @param {Object} payload { cycle_id, student_profile_id }
 */
export async function runAwardEvaluation(awardId, payload = {}) {
  const response = await apiClient.post(`/osad/awards/${awardId}/evaluate`, payload, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Submits a Dean candidate nomination for an award within the Dean's assigned college.
 * @param {Object} payload { student_profile_id, award_definition_id, cycle_id, justification }
 */
export async function submitDeanNomination(payload) {
  const response = await apiClient.post('/dean/nominations', payload, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}
