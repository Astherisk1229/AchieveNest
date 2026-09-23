/**
 * AchieveNest — Plan 07 Phase 4 & 5
 * useProvisioningCredential Hook
 *
 * Encapsulates ephemeral credential modal state, copy actions, print lifecycle,
 * confirmation dismissal, fault handling, and memory cleanup for Student and Personnel provisioning.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  parseProvisioningCredentialResponse,
  buildCredentialCopyText,
  ProvisioningCredentialContractError
} from '../contracts/provisioningCredentialContract'
import { useCredentialSlipPrint } from './useCredentialSlipPrint'
import apiClient from '../services/apiClient'

export function useProvisioningCredential() {
  const [credential, setCredential] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [hasPrinted, setHasPrinted] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(null)
  const [deliveryFault, setDeliveryFault] = useState(null)

  const printHook = useCredentialSlipPrint()

  // Ref tracking current credential for synchronous unmount cleanup
  const credentialRef = useRef(null)
  credentialRef.current = credential

  // Clean up credential memory on unmount
  useEffect(() => {
    return () => {
      credentialRef.current = null
    }
  }, [])

  /**
   * Processes a successful provisioning response (HTTP 201) and opens the modal.
   * If parsing fails on a 201 response, enters the committed-account delivery fault state.
   */
  const handleProvisioningSuccess = useCallback((rawResponse, expectedOwnerType) => {
    try {
      const normalized = parseProvisioningCredentialResponse(rawResponse, expectedOwnerType)
      setCredential(normalized)
      setHasCopied(false)
      setHasPrinted(false)
      setCopyFeedback(null)
      setDeliveryFault(null)
      setIsConfirmDiscardOpen(false)
      setIsOpen(true)
      printHook.clearPrintState()
      return { success: true, credential: normalized }
    } catch (err) {
      console.error('Provisioning credential contract failure:', err)
      const fault = {
        ownerType: expectedOwnerType,
        error: err instanceof ProvisioningCredentialContractError ? err.code : 'UNKNOWN_ERROR',
        message: 'The account was created, but its temporary credential could not be safely displayed.'
      }
      setDeliveryFault(fault)
      setCredential(null)
      setIsOpen(false)
      printHook.clearPrintState()
      return { success: false, fault }
    }
  }, [printHook])

  /**
   * Copies formatted credentials to clipboard.
   */
  const handleCopy = useCallback(async () => {
    if (!credential) return { success: false, error: 'NO_CREDENTIAL' }

    const textToCopy = buildCredentialCopyText(credential)
    let copySuccessful = false

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy)
        copySuccessful = true
      }
    } catch (err) {
      console.warn('Navigator clipboard failed, attempting document.execCommand fallback:', err)
    }

    // Fallback if navigator.clipboard is unavailable or rejected
    if (!copySuccessful && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        textarea.style.position = 'fixed'
        textarea.style.left = '-999999px'
        textarea.style.top = '-999999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        copySuccessful = document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch (fallbackErr) {
        console.warn('Fallback copy failed:', fallbackErr)
      }
    }

    if (copySuccessful) {
      setHasCopied(true)
      setCopyFeedback('Credentials copied to clipboard')
      if (credential?.id) {
        apiClient.post(`/accounts/${credential.id}/audit-delivery-action`, { action: 'credentials_copied' }).catch(() => {})
      }
      return { success: true }
    } else {
      setCopyFeedback('Copy failed. Please manually select and copy the credentials.')
      return { success: false, manualFallback: true, text: textToCopy }
    }
  }, [credential])

  /**
   * Triggers the printable credential slip lifecycle.
   */
  const handlePrint = useCallback(async () => {
    if (!credential) return { success: false, error: 'NO_CREDENTIAL' }
    const res = await printHook.prepareAndPrint(credential)
    if (res.success) {
      setHasPrinted(true)
      if (credential?.id) {
        apiClient.post(`/accounts/${credential.id}/audit-delivery-action`, { action: 'credential_slip_printed' }).catch(() => {})
      }
    }
    return res
  }, [credential, printHook])

  /**
   * Requests dismissal of the credential modal.
   * If unacknowledged (neither copied nor printed), triggers confirmation dialog.
   */
  const requestClose = useCallback((onAfterClose) => {
    if (!hasCopied && !hasPrinted) {
      setIsConfirmDiscardOpen(true)
    } else {
      clearAndClose(onAfterClose)
    }
  }, [hasCopied, hasPrinted])

  /**
   * Confirms discarding the credential and destroys ephemeral state before executing onAfterClose.
   */
  const confirmDiscard = useCallback((onAfterClose) => {
    clearAndClose(onAfterClose)
  }, [])

  /**
   * Cancels the discard confirmation dialog.
   */
  const cancelDiscard = useCallback(() => {
    setIsConfirmDiscardOpen(false)
  }, [])

  /**
   * Permanently clears all credential data from component state and closes the modal.
   */
  const clearAndClose = useCallback((onAfterClose) => {
    setIsConfirmDiscardOpen(false)
    setIsOpen(false)
    setCredential(null)
    setHasCopied(false)
    setHasPrinted(false)
    setCopyFeedback(null)
    setDeliveryFault(null)
    printHook.clearPrintState()

    if (typeof onAfterClose === 'function') {
      onAfterClose()
    }
  }, [printHook])

  const clearDeliveryFault = useCallback((onAfterClose) => {
    setDeliveryFault(null)
    printHook.clearPrintState()
    if (typeof onAfterClose === 'function') {
      onAfterClose()
    }
  }, [printHook])

  return {
    credential,
    isOpen,
    isConfirmDiscardOpen,
    hasCopied,
    hasPrinted,
    setHasPrinted,
    copyFeedback,
    deliveryFault,
    printHook,
    handleProvisioningSuccess,
    handleCopy,
    handlePrint,
    requestClose,
    confirmDiscard,
    cancelDiscard,
    clearAndClose,
    clearDeliveryFault
  }
}
