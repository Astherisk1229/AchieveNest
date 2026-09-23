/**
 * ConfirmDialog.jsx
 * Accessible shared confirmation dialog for unsaved changes and critical actions.
 */

import React, { useEffect, useRef } from 'react'
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react'
import { Button } from './button'

export function ConfirmDialog({
  open = false,
  isOpen,
  title = 'Are you sure?',
  message = 'Unsaved changes will be lost if you close without saving.',
  confirmLabel = 'Discard Changes',
  confirmText,
  cancelLabel = 'Continue Editing',
  cancelText,
  tone = 'warning', // 'warning' | 'destructive' | 'default'
  type,
  onConfirm,
  onCancel,
  isProcessing = false
}) {
  const confirmBtnRef = useRef(null)
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)
  const isDialogOpen = Boolean(isOpen !== undefined ? isOpen : open)
  const effectiveConfirmLabel = confirmText || confirmLabel
  const effectiveCancelLabel = cancelText || cancelLabel
  const effectiveTone = type || tone

  useEffect(() => {
    if (!isDialogOpen) return

    previousFocusRef.current = document.activeElement

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (onCancel && !isProcessing) {
          onCancel()
        }
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      previousFocusRef.current?.focus?.()
    }
  }, [isDialogOpen, onCancel, isProcessing])

  useEffect(() => {
    if (isDialogOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus()
    }
  }, [isDialogOpen])

  if (!isDialogOpen) return null

  const getToneIcon = () => {
    switch (effectiveTone) {
      case 'destructive':
        return (
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        )
      case 'default':
        return (
          <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
        )
      case 'warning':
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )
    }
  }

  const getConfirmVariant = () => {
    if (effectiveTone === 'destructive') return 'destructive'
    return 'default'
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onCancel && !isProcessing) {
      onCancel()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 relative text-slate-900 dark:text-slate-100"
      >
        <button
          type="button"
          disabled={isProcessing}
          onClick={onCancel}
          aria-label="Close confirmation dialog"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {getToneIcon()}
          <div className="space-y-1.5 pt-0.5">
            <h3 id="confirm-dialog-title" className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <p id="confirm-dialog-description" className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            disabled={isProcessing}
            onClick={onCancel}
            className="text-xs font-bold"
          >
            {effectiveCancelLabel}
          </Button>

          <Button
            ref={confirmBtnRef}
            type="button"
            variant={getConfirmVariant()}
            disabled={isProcessing}
            onClick={onConfirm}
            className="text-xs font-extrabold shadow-sm"
          >
            {effectiveConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
