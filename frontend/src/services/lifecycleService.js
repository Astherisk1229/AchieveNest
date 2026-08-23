import apiClient from './apiClient'

export const lifecycleService = {
  async suspendAccount(accountId, reason) {
    const res = await apiClient.post(`/accounts/${accountId}/suspend`, { reason })
    return res?.data || res
  },

  async archiveAccount(accountId, reason) {
    const res = await apiClient.post(`/accounts/${accountId}/archive`, { reason })
    return res?.data || res
  },

  async restoreAccount(accountId) {
    const res = await apiClient.post(`/accounts/${accountId}/restore`)
    return res?.data || res
  },

  async getAccountLifecycleEvents(accountId) {
    const res = await apiClient.get(`/accounts/${accountId}/lifecycle`)
    return res?.data?.events || res?.events || []
  }
}

export default lifecycleService
