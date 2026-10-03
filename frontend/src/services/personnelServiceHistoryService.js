import apiClient from './apiClient'

/** HR-maintained employment service history (data owner for length of service). HR staff only. */
export const personnelServiceHistoryService = {
  /** Current version, version list, and qualifying length of service as of today. */
  async get(personnelId) {
    const res = await apiClient.get(`/hr/personnel/${encodeURIComponent(personnelId)}/service-history`)
    return res?.data?.data ?? null
  },

  /**
   * Saves the next HR-confirmed version.
   * @param {string} personnelId
   * @param {{ expected_version_number: number, change_reason: string, segments: Array }} payload
   */
  async save(personnelId, payload) {
    const res = await apiClient.post(`/hr/personnel/${encodeURIComponent(personnelId)}/service-history`, payload)
    return res?.data?.data ?? null
  },
}
