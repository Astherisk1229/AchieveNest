/**
 * ConfirmDialog.jsx
 * Accessible shared confirmation dialog for unsaved changes and critical actions.
 */

import React, { useEffect, useId, useRef } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, Info, X } from 'lucide-react'
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
  isProcessing = false,
  hideCancel = false, // single-button notice (replaces window.alert)
  inputLabel, // optional text field (replaces window.prompt)
  inputValue = '',
  inputPlaceholder = '',
  inputRequired = false,
  onInputChange
}) {
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`
  const inputId = `${baseId}-input`
  const hasInput = typeof onInputChange === 'function'
  const inputMissing = hasInput && inputRequired && !String(inputValue || '').trim()
  const confirmBtnRef = useRef(null)
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)
  const isDialogOpen = Boolean(isOpen !== undefined ? isOpen : open)
  const effectiveConfirmLabel = confirmText || confirmLabel
  const effectiveCancelLabel = cancelText || cancelLabel
  const effectiveTone = type || tone

  // Keep the latest handlers in refs so typing in the optional input does not
  // re-run the effects below (which would steal focus on every keystroke).
  const onCancelRef = useRef(onCancel)
  const isProcessingRef = useRef(isProcessing)
  onCancelRef.current = onCancel
  isProcessingRef.current = isProcessing

  useEffect(() => {
    if (!isDialogOpen) return
    previousFocusRef.current = document.activeElement
    return () => { previousFocusRef.current?.focus?.() }
  }, [isDialogOpen])

  useEffect(() => {
    if (!isDialogOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (onCancelRef.current && !isProcessingRef.current) {
          onCancelRef.current()
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
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isDialogOpen])

  useEffect(() => {
    if (!isDialogOpen) return
    const input = hasInput ? dialogRef.current?.querySelector('textarea') : null
    if (input) input.focus()
    else if (confirmBtnRef.current) confirmBtnRef.current.focus()
  }, [isDialogOpen, hasInput])

  if (!isDialogOpen) return null

  const getToneIcon = () => {
    switch (effectiveTone) {
      case 'destructive':
        return (
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        )
      case 'success':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )
      case 'info':
        return (
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
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
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
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
            <h3 id={titleId} className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <p id={descriptionId} className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {hasInput && (
          <div className="space-y-1.5">
            <label htmlFor={inputId} className="block text-sm font-bold text-slate-800 dark:text-slate-200">{inputLabel || 'Details'}{inputRequired && <span className="text-rose-600"> *</span>}</label>
            <textarea
              id={inputId}
              rows={3}
              value={inputValue}
              placeholder={inputPlaceholder}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {!hideCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={isProcessing}
              onClick={onCancel}
              className="text-xs font-bold"
            >
              {effectiveCancelLabel}
            </Button>
          )}

          <Button
            ref={confirmBtnRef}
            type="button"
            variant={getConfirmVariant()}
            disabled={isProcessing || inputMissing}
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
