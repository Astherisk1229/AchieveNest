import apiClient from './apiClient'

export const achievementService = {
  async getAchievements(params = {}) {
    const res = await apiClient.get('/achievements', { params })
    return res?.data?.achievements || res?.achievements || []
  },

  async submitAchievement(payload) {
    const res = await apiClient.post('/achievements', payload)
    return res?.data || res
  },

  async getVerificationQueue() {
    const res = await apiClient.get('/verification/queue')
    return res?.data?.queue || res?.queue || []
  },

  async decideVerification(requestId, { decision, remarks }) {
    const res = await apiClient.post(`/verification/${requestId}/decide`, {
      decision,
      remarks
    })
    return res?.data || res
  },

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
