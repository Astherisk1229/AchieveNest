import apiClient from './apiClient'

/**
 * personnelPortfolioService.js
 * Frontend service for Personnel whole-portfolio submission and lifecycle status queries (Plan C).
 */

/**
 * Submit the current active working portfolio package for evaluation.
 * Creates an immutable point-in-time snapshot on the server.
 *
 * @param {Object} payload { academic_year, tenure_years }
 * @returns {Promise<Object>} { data: { submission_id, status, submitted_at, total_items } }
 */
export async function submitPortfolio(payload = {}) {
  const res = await apiClient.post('/personnel/portfolio/submit', payload)
  return res?.data || res
}

/**
 * Retrieve the latest submission package and status for the authenticated Personnel.
 *
 * @returns {Promise<Object>} { data: { submission, status, items_count } }
 */
export async function getLatestSubmission() {
  const res = await apiClient.get('/personnel/portfolio/submission/latest')
  return res?.data || res
}

/**
 * Return an active whole-portfolio submission for revision (Reviewer action).
 *
 * @param {string} evaluationId
 * @param {Object} payload { reason, required_corrections, item_deficiencies }
 * @returns {Promise<Object>}
 */
export async function returnPortfolioForRevision(evaluationId, payload = {}) {
  const res = await apiClient.post(`/personnel/portfolio/submissions/${evaluationId}/return-for-revision`, payload)
  return res?.data || res
}

/**
 * Resubmit the corrected working revision as a new immutable version (Plan C Phase C4).
 *
 * @param {Object} payload Optional metadata
 * @returns {Promise<Object>} { data: { submission_id, version_number, status, submitted_at, total_items } }
 */
export async function resubmitPortfolio(payload = {}) {
  const res = await apiClient.post('/personnel/portfolio/submissions/resubmit', payload)
  return res?.data || res
}

/**
 * Retrieve the full chronological submission version history for the personnel (Plan C Phase C4).
 *
 * @param {string|null} personnelProfileId Optional profile ID for reviewer queries
 * @returns {Promise<Object>} { data: { versions: Array, total_versions: number, current_version_number: number } }
 */
export async function getSubmissionHistory(personnelProfileId = null) {
  const params = personnelProfileId ? { personnel_profile_id: personnelProfileId } : {}
  const res = await apiClient.get('/personnel/portfolio/submissions/history', { params })
  return res?.data || res
}

/**
 * Irreversibly delete/purge the personnel portfolio and submission history (Plan C Phase C5 Deletion Exception).
 *
 * @param {Object} payload { confirmation: "DELETE_PORTFOLIO", reason?: string, personnel_profile_id?: string }
 * @returns {Promise<Object>} { data: { message, target_profile_id, purged_evaluations, purged_accomplishments } }
 */
export async function purgePortfolio(payload = {}) {
  const res = await apiClient.post('/personnel/portfolio/purge', payload)
  return res?.data || res
}

export const personnelPortfolioService = {
  submitPortfolio,
  resubmitPortfolio,
  getLatestSubmission,
  getSubmissionHistory,
  returnPortfolioForRevision,
  purgePortfolio
}

export default personnelPortfolioService
