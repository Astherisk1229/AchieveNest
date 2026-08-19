import { useState, useMemo } from 'react'
import { getAccountRolePresentation } from '../models/AccountRolePresentation'
import UserProfileController from '../controllers/UserProfileController'

export function useUserProfile(currentUser) {
  const presentation = useMemo(() => {
    return getAccountRolePresentation(currentUser)
  }, [currentUser])

  const userId = currentUser?.id || currentUser?.employee_id || currentUser?.student_id || 'demo_user'

  const [savedOverrides, setSavedOverrides] = useState(() => {
    return UserProfileController.getProfileOverrides(userId)
  })

  // Merged User Object
  const mergedUser = useMemo(() => {
    const base = { ...presentation.defaultUserData, ...(currentUser || {}) }
    return { ...base, ...savedOverrides }
  }, [presentation, currentUser, savedOverrides])

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleSaveOverrides = (newOverrides) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const updated = UserProfileController.saveProfileOverrides(userId, newOverrides)
      setSavedOverrides(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      setIsSaving(false)
      return true
    } catch (e) {
      setSaveError(e.message || 'Failed to save profile changes.')
      setIsSaving(false)
      return false
    }
  }

  return {
    user: mergedUser,
    presentation,
    userId,
    isSaving,
    saveSuccess,
    saveError,
    handleSaveOverrides
  }
}

export default useUserProfile
