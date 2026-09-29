import apiClient from './apiClient'

// Student achievement and verification calls live in portfolioService (/portfolio endpoints).
export const achievementService = {
  async getEvents() {
    const res = await apiClient.get('/events')
    return res?.data?.events || res?.events || []
  },

  async createEvent(payload) {
    const res = await apiClient.post('/events', payload)
    return res?.data || res
  },

  async addEventParticipants(eventId, participants) {
    const res = await apiClient.post(`/events/${eventId}/participants`, { participants })
    return res?.data || res
  }
}

export default achievementService
