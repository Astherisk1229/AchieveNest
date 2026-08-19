/**
 * UserProfileController.js
 * Controller handling namespaced local storage persistence for user profile overrides.
 */

import UserProfilePreferencesModel from '../models/UserProfilePreferencesModel'

const STORAGE_PREFIX = 'achievenest_user_profile_prefs_v1_'

export class UserProfileController {
  static getStorageKey(userId = 'default') {
    return `${STORAGE_PREFIX}${userId}`
  }

  static getProfileOverrides(userId = 'default') {
    try {
      const key = this.getStorageKey(userId)
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        return UserProfilePreferencesModel.validate(parsed)
      }
    } catch (e) {
      console.warn('UserProfileController: Failed to load profile overrides:', e)
    }
    return {}
  }

  static saveProfileOverrides(userId = 'default', overrides = {}) {
    try {
      const validData = UserProfilePreferencesModel.validate(overrides)
      const existing = this.getProfileOverrides(userId)
      const merged = { ...existing, ...validData, updated_at: new Date().toISOString() }

      const key = this.getStorageKey(userId)
      localStorage.setItem(key, JSON.stringify(merged))
      window.dispatchEvent(new Event('storage'))
      return merged
    } catch (e) {
      console.error('UserProfileController: Failed to save profile overrides:', e)
      throw new Error('Failed to persist profile changes.')
    }
  }
}

export default UserProfileController
