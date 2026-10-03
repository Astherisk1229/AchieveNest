import apiClient from './apiClient'

/**
 * Signed-in personnel's own length of service, computed by the server from the HR service history
 * (full-time only, part-time and breaks excluded). Returns null when it cannot be loaded.
 */
export async function fetchOwnLengthOfService() {
  const res = await apiClient.get('/personnel/profile')
  return res?.data?.data?.length_of_service ?? null
}

/** Label for the portfolio chip, e.g. "7 years, 4 months of service". */
export function lengthOfServiceLabel(service) {
  if (!service || !service.display) return 'Years of service not yet recorded by HR'
  return `${service.display} of service`
}
