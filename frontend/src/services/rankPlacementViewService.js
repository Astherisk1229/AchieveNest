import apiClient from './apiClient'

const unwrap = response => response?.data ?? response ?? []

export async function loadRankPlacementView(role, personnelId) {
  const rankPath = role === 'personnel' ? '/personnel/rank-history' : role === 'hr' ? `/hr/personnel/${encodeURIComponent(personnelId)}/rank-history` : `/reviewer/personnel/${encodeURIComponent(personnelId)}/rank-history`
  const placementPath = role === 'personnel' ? '/personnel/rank-placements' : role === 'hr' ? `/hr/personnel/${encodeURIComponent(personnelId)}/rank-placements` : `/reviewer/personnel/${encodeURIComponent(personnelId)}/rank-placements`
  const requests = [apiClient.get(rankPath), apiClient.get(placementPath)]
  if (role === 'personnel') requests.push(apiClient.get('/notifications'))
  const [rankResponse, placementResponse, notificationResponse] = await Promise.all(requests)
  return {
    ranks: unwrap(rankResponse),
    rankCompatibility: rankResponse?.meta ?? {},
    placements: unwrap(placementResponse),
    notifications: role === 'personnel' ? (unwrap(notificationResponse)?.notifications ?? []) : []
  }
}

export async function downloadSignedApprovedRank(recordId) {
  const blob = await apiClient.get(`/approved-ranks/${encodeURIComponent(recordId)}/signed-document`, { responseType: 'blob' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'signed-approved-ranking-document'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function retryRankActivation(recordId) {
  return apiClient.post(`/hr/approved-ranks/${encodeURIComponent(recordId)}/retry-activation`)
}

const enc = value => encodeURIComponent(value)
const data = response => response?.data ?? response

// Approved rank (recorded after the offline signed approval)
export async function recordApprovedRank(reviewId, { approvedRankCode, approvalDate, effectivityDate, officialDocumentId, signedDocument }) {
  const form = new FormData()
  form.append('approved_rank_code', approvedRankCode)
  form.append('approval_date', approvalDate)
  form.append('effectivity_date', effectivityDate)
  form.append('official_document_id', officialDocumentId)
  form.append('signed_approved_document', signedDocument)
  return data(await apiClient.post(`/hr/final-rank-reviews/${enc(reviewId)}/approved-rank`, form))
}

export async function correctApprovedRank(recordId, { correctionType, reason, approvedRankCode, approvalDate, effectivityDate, reuseOriginalDocument, originalDocumentStillSupports, supportingDocument }) {
  const form = new FormData()
  form.append('correction_type', correctionType)
  form.append('reason', reason)
  if (approvedRankCode) form.append('approved_rank_code', approvedRankCode)
  if (approvalDate) form.append('approval_date', approvalDate)
  if (effectivityDate) form.append('effectivity_date', effectivityDate)
  form.append('reuse_original_document', reuseOriginalDocument ? '1' : '0')
  form.append('original_document_still_supports', originalDocumentStillSupports ? '1' : '0')
  if (supportingDocument) form.append('supporting_document', supportingDocument)
  return data(await apiClient.post(`/hr/approved-ranks/${enc(recordId)}/correct`, form))
}

export async function cancelApprovedRank(recordId, reason) {
  return data(await apiClient.post(`/hr/approved-ranks/${enc(recordId)}/cancel`, { reason }))
}

// path: 'correction' | 'cancellation'. Only valid while the record is in activation_failed.
export async function requestApprovedRankRecovery(recordId, path, reason) {
  return data(await apiClient.post(`/hr/approved-ranks/${enc(recordId)}/recovery-path`, { path, reason }))
}

export async function beginReconsideration(reviewId) {
  return data(await apiClient.post(`/reviewer/hr-final-rank-reviews/${enc(reviewId)}/begin-reconsideration`))
}

// Rank placement (credential-based placement group)
export async function suggestPlacement(personnelId) {
  return data(await apiClient.post(`/hr/personnel/${enc(personnelId)}/rank-placement/suggest`))
}

export async function confirmPlacement(suggestionId, effectiveDate) {
  return data(await apiClient.post(`/hr/rank-placement-suggestions/${enc(suggestionId)}/confirm`, { effective_date: effectiveDate }))
}

export async function retryPlacement(placementId) {
  return data(await apiClient.post(`/hr/rank-placements/${enc(placementId)}/retry`))
}

export async function correctPlacement(placementId, reason, effectiveDate) {
  return data(await apiClient.post(`/hr/rank-placements/${enc(placementId)}/correct`, { reason, effective_date: effectiveDate }))
}

export async function cancelPlacement(placementId, reason) {
  return data(await apiClient.post(`/hr/rank-placements/${enc(placementId)}/cancel`, { reason }))
}

// Backend errors carry a machine code (for example PAST_EFFECTIVITY_DATE_NOT_ALLOWED); show it readably.
export function rankActionError(error, fallback = 'The action could not be completed.') {
  const code = error?.error?.code || error?.response?.data?.error?.code
  if (code && /^[A-Z0-9_]+$/.test(code)) return code.toLowerCase().replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()) + '.'
  return error?.error?.message || error?.message || fallback
}
