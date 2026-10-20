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

function unwrapApiData(response) {
  const body = response?.data || response
  return body?.data ?? body
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

export async function fetchAwardCriteriaHierarchy(awardId) {
  const response = await apiClient.get(`/osad/awards/${awardId}/criteria-hierarchy`, { headers: getAuthHeaders() })
  return unwrapApiData(response)
}

export async function saveAwardCriteriaHierarchy(awardId, hierarchy) {
  const response = await apiClient.put(`/osad/awards/${awardId}/criteria-hierarchy`, { hierarchy }, { headers: getAuthHeaders() })
  return unwrapApiData(response)
}

/**
 * Fetches portfolio-evaluated award candidates with optional filters.
 * @param {Object} filters { award_id, cycle_id, college_id }
 */
export async function fetchCandidates(filters = {}) {
  const params = {}
  if (filters.award_id && filters.award_id !== 'all') params.award_id = filters.award_id
  if (filters.cycle_id) params.cycle_id = filters.cycle_id
  if (filters.college_id && filters.college_id !== 'all') params.college_id = filters.college_id

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
 * @param {string|null} studentId
 */
export async function executeAwardEvaluation(awardId, studentId = null) {
  const payload = studentId ? { student_id: studentId } : {}
  const response = await apiClient.post(`/osad/awards/${awardId}/evaluate`, payload, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

export const runAwardEvaluation = executeAwardEvaluation

/**
 * Fetches eligible students with relevant verified evidence (Students for Evaluation).
 * @param {string} awardId
 */
export async function fetchStudentsForEvaluation(awardId) {
  const response = await apiClient.get(`/osad/awards/${awardId}/students-for-evaluation`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Fetches complete review workspace package for a student and award.
 * @param {string} awardId
 * @param {string} studentId
 */
export async function fetchStudentReviewWorkspace(awardId, studentId) {
  const response = await apiClient.get(`/osad/awards/${awardId}/students/${studentId}/review`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Saves manual criteria draft or updates scores.
 * @param {string} awardId
 * @param {string} studentId
 * @param {Object} manualScores
 * @param {string|null} notes
 * @param {boolean} finalize
 */
export async function saveManualCriteria(awardId, studentId, manualScores, notes = null, finalize = false) {
  const response = await apiClient.patch(`/osad/awards/${awardId}/students/${studentId}/manual-criteria`, {
    manual_scores: manualScores,
    notes,
    finalize
  }, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Finalizes evaluation for a student.
 * @param {string} awardId
 * @param {string} studentId
 * @param {Object} manualScores
 * @param {string|null} notes
 */
export async function finalizeStudentEvaluation(awardId, studentId, manualScores, notes = null) {
  const response = await apiClient.post(`/osad/awards/${awardId}/students/${studentId}/finalize`, {
    manual_scores: manualScores,
    notes
  }, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Recalculates portfolio score for a student from master evidence.
 * @param {string} awardId
 * @param {string} studentId
 */
export async function recalculateStudentScore(awardId, studentId) {
  const response = await apiClient.post(`/osad/awards/${awardId}/students/${studentId}/recalculate`, {}, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Fetches all Potential Candidates for an award (>= 80% threshold).
 * @param {string} awardId
 */
export async function fetchPotentialCandidates(awardId) {
  const response = await apiClient.get(`/osad/awards/${awardId}/potential-candidates`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * View-only evaluation summary of one student for one award (approved achievements that earned points).
 * @param {string} awardId
 * @param {string} studentId
 */
export async function fetchEvaluationSummary(awardId, studentId) {
  const response = await apiClient.get(`/osad/awards/${awardId}/students/${studentId}/evaluation-summary`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Fetches all evaluated results for an award (Potential Candidates + Below Threshold).
 * @param {string} awardId
 */
export async function fetchEvaluatedResults(awardId) {
  const response = await apiClient.get(`/osad/awards/${awardId}/evaluated-results`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Classifies a student against the 80% Potential Candidate threshold.
 * @param {string} awardId
 * @param {string} studentId
 */
export async function classifyStudentPotentialCandidate(awardId, studentId) {
  const response = await apiClient.post(`/osad/awards/${awardId}/students/${studentId}/classify`, {}, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Retrieves candidate classification status for a student.
 * @param {string} awardId
 * @param {string} studentId
 */
export async function fetchStudentCandidateStatus(awardId, studentId) {
  const response = await apiClient.get(`/osad/awards/${awardId}/students/${studentId}/candidate-status`, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}
