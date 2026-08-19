import { useState, useMemo } from 'react'
import UserSettingsController from '../controllers/UserSettingsController'

export function useUserSettings(currentUser) {
  const userId = currentUser?.id || currentUser?.employee_id || currentUser?.student_id || 'demo_user'

  const [settings, setSettings] = useState(() => {
    return UserSettingsController.getSettings(userId)
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleToggleNotification = (key) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const updatedNotifications = {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
      const newSettings = { ...settings, notifications: updatedNotifications }
      const persisted = UserSettingsController.saveSettings(userId, newSettings)
      setSettings(persisted)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
      setIsSaving(false)
      return true
    } catch (e) {
      setSaveError(e.message || 'Failed to save settings.')
      setIsSaving(false)
      return false
    }
  }

  const handleResetDefaults = () => {
    setIsSaving(true)
    try {
      const resetData = UserSettingsController.resetSettings(userId)
      setSettings(resetData)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
      setIsSaving(false)
      return true
    } catch (e) {
      setSaveError(e.message || 'Failed to reset settings.')
      setIsSaving(false)
      return false
    }
  }

  return {
    settings,
    notifications: settings.notifications,
    portal: settings.portal,
    isSaving,
    saveSuccess,
    saveError,
    handleToggleNotification,
    handleResetDefaults
  }
}

export default useUserSettings
