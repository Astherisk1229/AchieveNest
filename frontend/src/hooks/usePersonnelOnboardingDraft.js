/**
 * usePersonnelOnboardingDraft.js
 * Custom React Hook bridging OnboardPersonnelModal to PersonnelOnboardingDraftController.
 * Provides debounced auto-save, draft detection, recovery, and explicit discard state.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import PersonnelOnboardingDraftController from '../controllers/PersonnelOnboardingDraftController.js'

export function usePersonnelOnboardingDraft(ownerContext, isOpen = false) {
  const [recoverableDraft, setRecoverableDraft] = useState(null)
  const [recoveryDecisionPending, setRecoveryDecisionPending] = useState(false)
  const [draftSaveStatus, setDraftSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'
  const debounceTimerRef = useRef(null)

  // Check for existing recoverable draft when modal opens
  const checkDraft = useCallback(() => {
    if (!isOpen) {
      setRecoverableDraft(null)
      setRecoveryDecisionPending(false)
      return
    }

    const draft = PersonnelOnboardingDraftController.getDraft(ownerContext)
    if (draft) {
      setRecoverableDraft(draft)
      setRecoveryDecisionPending(true)
    } else {
      setRecoverableDraft(null)
      setRecoveryDecisionPending(false)
    }
  }, [ownerContext, isOpen])

  useEffect(() => {
    checkDraft()
    const unsubscribe = PersonnelOnboardingDraftController.subscribe(checkDraft)
    return () => unsubscribe()
  }, [checkDraft])

  // Debounced Save Snapshot
  const saveSnapshot = useCallback((formSnapshot) => {
    if (!isOpen || recoveryDecisionPending) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setDraftSaveStatus('saving')

    debounceTimerRef.current = setTimeout(() => {
      const success = PersonnelOnboardingDraftController.saveDraft(ownerContext, formSnapshot)
      if (success) {
        setDraftSaveStatus('saved')
        setTimeout(() => setDraftSaveStatus('idle'), 2000)
      } else {
        setDraftSaveStatus('error')
      }
    }, 750)
  }, [ownerContext, isOpen, recoveryDecisionPending])

  // Resume Draft Action
  const resumeDraft = useCallback(() => {
    const draft = PersonnelOnboardingDraftController.getDraft(ownerContext)
    setRecoveryDecisionPending(false)
    return draft
  }, [ownerContext])

  // Start Fresh / Clear Action
  const clearDraft = useCallback(() => {
    PersonnelOnboardingDraftController.clearDraft(ownerContext)
    setRecoverableDraft(null)
    setRecoveryDecisionPending(false)
    setDraftSaveStatus('idle')
  }, [ownerContext])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  return {
    recoverableDraft,
    recoveryDecisionPending,
    draftSaveStatus,
    resumeDraft,
    clearDraft,
    saveSnapshot
  }
}
