import apiClient from './apiClient'

/**
 * Canonical frontend adapter for persisted Events.
 *
 * Event authority lives in the backend `events` table.
 * Attendance records have their own services. Event certificate display
 * settings live on the event and are exposed only to authorized viewers.
 */
const eventService = {
  async list() {
    const response = await apiClient.get('/events')
    return response?.data?.events ?? []
  },

  async listVenues() {
    const response = await apiClient.get('/event-venues')
    return response?.data?.venues ?? []
  },

  async getCertificatePreview(eventId) {
    const response = await apiClient.get(`/events/${encodeURIComponent(eventId)}/certificate-preview`)
    return response?.data?.event_certificate ?? null
  },

  async listEventVenues() {
    return this.listVenues()
  },

  async create(payload) {
    const response = await apiClient.post('/events', payload)
    return response?.data ?? null
  },

  async update(eventId, payload) {
    const response = await apiClient.patch(
      `/events/${encodeURIComponent(eventId)}`,
      payload
    )

    return response?.data ?? null
  },

  async cancel(eventId) {
    const response = await apiClient.post(
      `/events/${encodeURIComponent(eventId)}/cancel`
    )

    return response?.data ?? null
  }
}

export default eventService
