/**
 * PersonnelNotificationService.js
 *
 * Frontend Authoritative Notification Synchronization & Presentation Service for Plan J — Phase J3.
 * Handles client-side normalization, unread count tracking, state transition formatting,
 * and deep link routing for persisted workflow notifications.
 */

import PersonnelWorkflowNotificationRegistry from './PersonnelWorkflowNotificationRegistry.js';

export default class PersonnelNotificationService {
  /**
   * Normalizes a raw notification record from the API for UI rendering.
   */
  static formatNotificationFeedItem(item = {}) {
    const isRead = Boolean(item.read_at || item.is_read || item.isRead);
    const notificationType = item.notification_type || item.type || 'general';

    return {
      id: item.id || null,
      recipient_profile_id: item.recipient_profile_id || null,
      actor_profile_id: item.actor_profile_id || null,
      notification_type: notificationType,
      title: item.title || 'Workflow Update',
      message: item.message || '',
      reference_type: item.reference_type || 'personnel_evaluations',
      reference_id: item.reference_id || null,
      is_mandatory: item.is_mandatory !== false,
      is_read: isRead,
      read_at: item.read_at || null,
      created_at: item.created_at || new Date().toISOString(),
      deep_link: item.deep_link || item.link || PersonnelNotificationService.resolveDefaultDeepLink(notificationType, item.reference_id)
    };
  }

  /**
   * Resolves default client route based on notification type and entity reference.
   */
  static resolveDefaultDeepLink(notificationType, referenceId = null) {
    switch (notificationType) {
      case 'personnel_revision_requested':
        return '/personnel/portfolio/revision';
      case 'personnel_evaluation_finalized':
      case 'personnel_summary_available':
        return '/personnel/portfolio/summary';
      case 'personnel_reviewer_work_arrived':
      case 'personnel_reviewer_assigned':
      case 'personnel_portfolio_resubmitted':
        return referenceId ? `/personnel/evaluations/workspace?evaluation_id=${referenceId}` : '/personnel/evaluations/workspace';
      case 'personnel_review_started':
      default:
        return '/personnel/portfolio';
    }
  }

  /**
   * Calculates unread count from an array of notification feed items.
   */
  static calculateUnreadCount(notifications = []) {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter(n => !n.is_read && !n.read_at).length;
  }

  /**
   * Optimistically marks a notification as read in a client collection.
   */
  static markAsReadInCollection(notifications = [], notificationId = null) {
    if (!Array.isArray(notifications)) return [];
    const now = new Date().toISOString();
    return notifications.map(n => {
      if (n.id === notificationId) {
        return { ...n, is_read: true, read_at: n.read_at || now };
      }
      return n;
    });
  }

  /**
   * Optimistically marks all notifications as read in a client collection.
   */
  static markAllAsReadInCollection(notifications = []) {
    if (!Array.isArray(notifications)) return [];
    const now = new Date().toISOString();
    return notifications.map(n => ({
      ...n,
      is_read: true,
      read_at: n.read_at || now
    }));
  }

  /**
   * Filters notifications by read status or search term.
   */
  static filterNotifications(notifications = [], filter = 'all', searchTerm = '') {
    if (!Array.isArray(notifications)) return [];
    let list = notifications;

    if (filter === 'unread') {
      list = list.filter(n => !n.is_read && !n.read_at);
    } else if (filter === 'read') {
      list = list.filter(n => n.is_read || n.read_at);
    }

    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q))
      );
    }

    return list;
  }
}
