/**
 * useConfirmableClose.js
 * Standardized dirty-state and confirmable-close orchestration hook.
 */

import { useState, useCallback, useEffect } from 'react'

export function useConfirmableClose({
  isOpen = false,
  isDirty = false,
  onClose,
  onDiscard,
  enableEscape = true
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const checkDirty = useCallback(() => {
    return typeof isDirty === 'function' ? isDirty() : Boolean(isDirty)
  }, [isDirty])

  const requestClose = useCallback(() => {
    if (checkDirty()) {
      setIsConfirmOpen(true)
    } else {
      if (onDiscard) {
        onDiscard()
      }
      if (onClose) {
        onClose()
      }
    }
  }, [checkDirty, onClose, onDiscard])

  const confirmDiscard = useCallback(() => {
    setIsConfirmOpen(false)
    if (onDiscard) {
      onDiscard()
    }
    if (onClose) {
      onClose()
    }
  }, [onClose, onDiscard])

  const cancelDiscard = useCallback(() => {
    setIsConfirmOpen(false)
  }, [])

  // Listen for Escape key on parent overlay when open and confirmation dialog is not open
  useEffect(() => {
    if (!isOpen || !enableEscape || isConfirmOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        requestClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, enableEscape, isConfirmOpen, requestClose])

  return {
    isConfirmOpen,
    requestClose,
    confirmDiscard,
    cancelDiscard,
    setIsConfirmOpen
  }
}
