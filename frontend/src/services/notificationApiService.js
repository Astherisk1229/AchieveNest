/**
 * notificationApiService.js
 *
 * Frontend service for Package V: Bidirectional Persisted Notifications.
 * Replaces hardcoded mock notification arrays with backend-persisted notifications.
 */

import apiClient from './apiClient.js'

export default class notificationApiService {
  /**
   * Fetches persisted notifications and unread count for current authenticated user.
   * @returns {Promise<{ data: { notifications: Array, unread_count: number, total: number } }>}
   */
  static async getNotifications() {
    try {
      const res = await apiClient.get('/notifications')
      return res?.data || res || { data: { notifications: [], unread_count: 0, total: 0 } }
    } catch (err) {
      console.warn('[notificationApiService] Could not load notifications:', err.message)
      return { data: { notifications: [], unread_count: 0, total: 0 } }
    }
  }

  /**
   * Marks a specific notification as read.
   * @param {string} id
   * @returns {Promise<Object>}
   */
  static async markAsRead(id) {
    try {
      const res = await apiClient.patch(`/notifications/${id}/read`)
      return res?.data || res
    } catch (err) {
      console.error('[notificationApiService] Failed to mark as read:', err)
      throw err
    }
  }

  /**
   * Marks all notifications as read for current user.
   * @returns {Promise<Object>}
   */
  static async markAllAsRead() {
    try {
      const res = await apiClient.patch('/notifications/read-all')
      return res?.data || res
    } catch (err) {
      console.error('[notificationApiService] Failed to mark all as read:', err)
      throw err
    }
  }
}
