/**
 * UserSettingsController.js
 * Controller handling user-scoped preference persistence in local storage.
 */

import UserSettingsModel from '../models/UserSettingsModel'

const STORAGE_PREFIX = 'achievenest_user_settings_v1_'

export class UserSettingsController {
  static getStorageKey(userId = 'default') {
    return `${STORAGE_PREFIX}${userId}`
  }

  static getSettings(userId = 'default') {
    try {
      const key = this.getStorageKey(userId)
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        return UserSettingsModel.validate(parsed)
      }
    } catch (e) {
      console.warn('UserSettingsController: Failed to load settings:', e)
    }
    return UserSettingsModel.validate({})
  }

  static saveSettings(userId = 'default', settingsData = {}) {
    try {
      const validData = UserSettingsModel.validate(settingsData)
      const key = this.getStorageKey(userId)
      localStorage.setItem(key, JSON.stringify(validData))
      window.dispatchEvent(new Event('storage'))
      return validData
    } catch (e) {
      console.error('UserSettingsController: Failed to save settings:', e)
      throw new Error('Failed to persist user settings.')
    }
  }

  static resetSettings(userId = 'default') {
    const defaults = UserSettingsModel.validate({})
    return this.saveSettings(userId, defaults)
  }
}

export default UserSettingsController
