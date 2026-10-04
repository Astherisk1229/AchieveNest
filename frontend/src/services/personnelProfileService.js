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

/**
 * Saves the self-service profile fields (contact number, location, about me, specialization).
 * Name, ID, designation and email are managed by HR and are not sent. Returns the saved profile.
 */
export async function updateOwnProfile({ contact_number, location, about_me, specialization }) {
  const res = await apiClient.put('/personnel/profile', { contact_number, location, about_me, specialization })
  return res?.data || res
}

/** Signed-in personnel's saved self-service fields, mapped to the shape the profile UI uses. */
export async function fetchOwnProfileFields() {
  const res = await apiClient.get('/personnel/profile')
  const d = res?.data?.data ?? res?.data ?? {}
  return {
    contact_number: d.phone || '',
    phone: d.phone || '',
    location: d.location || '',
    about_me: d.about_me || '',
    specialization: d.specialization || ''
  }
}
