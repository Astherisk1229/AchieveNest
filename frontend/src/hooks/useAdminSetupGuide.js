import { useState, useMemo, useEffect, useCallback } from 'react'
import AdminSetupGuideController from '../controllers/AdminSetupGuideController'

const STORAGE_KEY = 'achievenest_admin_setup_guide_preferences_v1'

export function useAdminSetupGuide(currentUser, activeRoleContext) {
  const userId = currentUser?.id || currentUser?.employee_id || 'demo_admin'
  const roleContext = activeRoleContext || currentUser?.active_role_context || currentUser?.user_type || 'osad_staff'

  const prefKey = `${userId}_${roleContext}`

  const [preferences, setPreferences] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed[prefKey] || { isExpanded: false, isDismissed: false }
      }
    } catch (e) {
      console.warn('Failed to load guide preferences:', e)
    }
    return { isExpanded: false, isDismissed: false }
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const allPrefs = raw ? JSON.parse(raw) : {}
      const activePref = allPrefs[prefKey] || { isExpanded: false, isDismissed: false }
      setPreferences(activePref)
    } catch (e) {
      console.warn('Failed to sync guide preferences:', e)
    }
  }, [prefKey])

  const savePreferences = useCallback((newPref) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const allPrefs = raw ? JSON.parse(raw) : {}
      allPrefs[prefKey] = { ...allPrefs[prefKey], ...newPref, updatedAt: new Date().toISOString() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPrefs))
      setPreferences(allPrefs[prefKey])
    } catch (e) {
      console.error('Failed to save guide preferences:', e)
    }
  }, [prefKey])

  const toggleExpanded = () => {
    savePreferences({ isExpanded: !preferences.isExpanded })
  }

  const toggleDismissed = () => {
    savePreferences({ isDismissed: !preferences.isDismissed })
  }

  const resetPreferences = () => {
    savePreferences({ isExpanded: false, isDismissed: false })
  }

  // Derive guide state from domain data
  const guide = useMemo(() => {
    return AdminSetupGuideController.evaluateGuide(roleContext)
  }, [roleContext])

  return {
    guide,
    roleContext,
    isExpanded: preferences.isExpanded,
    isDismissed: preferences.isDismissed,
    toggleExpanded,
    toggleDismissed,
    resetPreferences
  }
}

export default useAdminSetupGuide
