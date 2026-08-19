/**
 * UserSettingsModel.js
 * Model defining notification keys, defaults, and schema validation for user settings.
 */

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  faculty_submission_received: true,
  personnel_password_reset_requested: true,
  weekly_evaluation_audit_digest: true,
  evaluation_return_or_finalization_updates: true
}

export const DEFAULT_PORTAL_PREFERENCES = {
  compact_view: false,
  auto_save_drafts: true,
  email_digest_frequency: 'weekly'
}

export class UserSettingsModel {
  static validate(settings = {}) {
    const notifications = settings.notifications && typeof settings.notifications === 'object'
      ? { ...DEFAULT_NOTIFICATION_PREFERENCES, ...settings.notifications }
      : { ...DEFAULT_NOTIFICATION_PREFERENCES }

    const portal = settings.portal && typeof settings.portal === 'object'
      ? { ...DEFAULT_PORTAL_PREFERENCES, ...settings.portal }
      : { ...DEFAULT_PORTAL_PREFERENCES }

    return {
      notifications,
      portal,
      schema_version: '1.0'
    }
  }
}

export default UserSettingsModel
