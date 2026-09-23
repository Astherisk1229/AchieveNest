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
