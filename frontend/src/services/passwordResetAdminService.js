/**
 * passwordResetAdminService.js
 * Administrative service for OSAD and HR Password Reset Requests.
 */

import apiClient from './apiClient'
import { getCurrentUser } from './authService'

function getAuthHeaders() {
  const user = getCurrentUser()
  const token = user?.token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Fetches office-scoped password reset requests for the authenticated admin.
 * @param {string} status 'pending' | 'completed' | 'rejected' | 'all'
 */
export async function fetchPasswordResetRequests(status = '') {
  const params = status && status !== 'all' ? { status } : {}
  const response = await apiClient.get('/password-reset-requests', {
    params,
    headers: getAuthHeaders()
  })

  return response?.data?.requests || response?.requests || []
}

/**
 * Executes administrative password reset and generates one-time temporary password.
 * @param {string} requestId
 */
export async function executePasswordReset(requestId) {
  const response = await apiClient.post(`/password-reset-requests/${requestId}/reset`, {}, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

/**
 * Rejects a pending password reset request with an administrative reason.
 * @param {string} requestId
 * @param {string} reason
 */
export async function rejectPasswordReset(requestId, reason = '') {
  const response = await apiClient.post(`/password-reset-requests/${requestId}/reject`, { reason }, {
    headers: getAuthHeaders()
  })

  return response?.data || response
}

export default {
  fetchPasswordResetRequests,
  executePasswordReset,
  rejectPasswordReset
}
