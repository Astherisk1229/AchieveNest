/**
 * UserProfilePreferencesModel.js
 * Model enforcing sanitization and schema validation for user-scoped profile overrides.
 */

export class UserProfilePreferencesModel {
  static validate(overrides = {}) {
    const sanitized = {}

    // Validate phone number
    if (typeof overrides.phone === 'string') {
      const trimmed = overrides.phone.trim()
      if (trimmed.length <= 30) {
        sanitized.phone = trimmed
      }
    }

    // Validate location
    if (typeof overrides.location === 'string') {
      const trimmed = overrides.location.trim()
      if (trimmed.length <= 100) {
        sanitized.location = trimmed
      }
    }

    // Validate avatar URL (http, https, or relative data URL)
    if (typeof overrides.avatar_url === 'string') {
      const url = overrides.avatar_url.trim()
      if (/^(https?:\/\/|data:image\/|\/)/i.test(url)) {
        sanitized.avatar_url = url
      }
    }

    return sanitized
  }
}

export default UserProfilePreferencesModel
