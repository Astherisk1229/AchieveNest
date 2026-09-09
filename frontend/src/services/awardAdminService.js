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
 * @param {Object} filters { award_id, cycle_id, college_id, source }
 */
export async function fetchCandidates(filters = {}) {
  const params = {}
  if (filters.award_id && filters.award_id !== 'all') params.award_id = filters.award_id
  if (filters.cycle_id) params.cycle_id = filters.cycle_id
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

