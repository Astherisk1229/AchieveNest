import apiClient from './apiClient'

/**
 * Signed-in personnel's own length of service, computed by the server from the HR service history
 * (full-time only, part-time and breaks excluded). Returns null when it cannot be loaded.
 */
export async function fetchOwnLengthOfService() {
  const res = await apiClient.get('/personnel/profile')
  return res?.data?.data?.length_of_service ?? null
}

/** Returns the whole completed-year count used by the portfolio and profile UI. */
export function completedServiceYearsLabel(service) {
  if (!service) return null
  const completed = service.completed_years ?? service.years
  if (completed != null && Number.isFinite(Number(completed))) {
    const years = Math.max(0, Math.floor(Number(completed)))
    return `${years} ${years === 1 ? 'year' : 'years'}`
  }
  const match = String(service.display || '').match(/(?:^|,\s*)(\d+)\s+years?/i)
  if (!match) return null
  const years = Number(match[1])
  return `${years} ${years === 1 ? 'year' : 'years'}`
}

/** Label for the portfolio chip, e.g. "7 years of service". */
export function lengthOfServiceLabel(service) {
  const years = completedServiceYearsLabel(service)
  return years ? `${years} of service` : 'Years of service not yet recorded by HR'
}

/**
 * Saves Personnel-editable profile details. Institutional email remains HR-managed.
 */
export async function updateOwnProfile({ contact_number, about_me, specialization }) {
  const res = await apiClient.put('/personnel/profile', { contact_number, about_me, specialization })
  return res?.data || res
}

/** Signed-in personnel's saved self-service fields, mapped to the shape the profile UI uses. */
export async function fetchOwnProfileFields() {
  const res = await apiClient.get('/personnel/profile')
  const d = res?.data?.data ?? res?.data ?? {}
  return {
    contact_number: d.phone || '',
    phone: d.phone || '',
    about_me: d.about_me || '',
    specialization: d.specialization || '',
    ...(d.employee_id ? { employee_id: d.employee_id } : {}),
    ...(d.email ? { email: d.email, institutional_email: d.email } : {}),
    ...(d.avatar_url ? { avatar_url: d.avatar_url } : {}),
    ...(d.current_rank_title ? { current_rank_title: d.current_rank_title, academic_rank: d.current_rank_title } : {}),
    ...(d.position_title ? { position_title: d.position_title } : {}),
    ...(d.length_of_service ? { length_of_service: d.length_of_service } : {})
  }
}
