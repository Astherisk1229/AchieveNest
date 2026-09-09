import React, { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Printer,
  Lock,
  User,
  Mail,
  Hash,
  Sparkles,
  FileCheck2
} from 'lucide-react'
import { Button } from '../ui/button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import CredentialSlipPrintView from './CredentialSlipPrintView'

export default function OneTimeCredentialModal({
  isOpen,
  credential,
  onRequestClose,
  isConfirmDiscardOpen,
  onConfirmDiscard,
  onCancelDiscard,
  hasCopied = false,
  hasPrinted = false,
  copyFeedback = null,
  onCopy,
  onPrint = null,
  isPrintPrepared = false,
  printedAtLabel = '',
  printAttemptCount = 0
}) {
  const [isRevealed, setIsRevealed] = useState(false)
  const dialogRef = useRef(null)

  // Reset reveal state whenever modal opens or credential changes
  useEffect(() => {
    if (isOpen) {
      setIsRevealed(false)
    }
  }, [isOpen, credential])

  // Keyboard navigation & Escape handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (onRequestClose) {
          onRequestClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onRequestClose])

  if (!isOpen || !credential) return null

  const isStudent = credential.ownerType === 'student'
  const isReset = credential.action === 'administrative_reset' || credential.isReset || credential.action === 'password_reset'
  const ownerTypeLabel = isStudent ? 'Student Account' : 'Personnel Account'
  const idLabel = isStudent ? 'Student ID' : 'Personnel ID'
  const titleText = isReset ? 'Temporary Password Reset Successfully' : 'Account Created Successfully'
  const statusBadgeText = isReset ? 'Password Change Required' : 'Pending First Login'
  const warningText = isReset
    ? 'The previous password is no longer valid. This new temporary password is shown only once. Give or print it only for the verified account owner. The user must create a new personal password after signing in.'
    : 'This temporary password is displayed only once. Please copy or print it now and securely deliver it to the account owner. You will not be able to retrieve it after closing this modal.'

  return (
    <>
      {/* Backdrop — Clicking backdrop does NOT close the modal */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998] transition-opacity"
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="one-time-credential-title"
        aria-describedby="one-time-credential-desc"
        ref={dialogRef}
      >
        <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 my-8">
          
          {/* Header */}
          <div className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {ownerTypeLabel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {statusBadgeText}
                </span>
              </div>
              <h2 id="one-time-credential-title" className="text-xl font-black mt-1 tracking-tight">
                {titleText}
              </h2>
            </div>
          </div>

          {/* Account Details */}
          <div className="mt-5 space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <User className="w-4 h-4 text-slate-400" /> Account Owner
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {credential.fullName}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <Hash className="w-4 h-4 text-slate-400" /> {idLabel}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {credential.institutionalId}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                <Mail className="w-4 h-4 text-slate-400" /> Institutional Email
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {credential.institutionalEmail}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic text-right">
              * Use this institutional email to sign in to AchieveNest.
            </p>
          </div>

          {/* Temporary Password Section */}
          <div className="mt-5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              One-Time Temporary Password
            </label>
            
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              
              <div className="flex-1 font-mono text-base sm:text-lg font-black tracking-widest text-slate-900 dark:text-slate-100 select-all px-2 overflow-x-auto">
                {isRevealed ? credential.temporaryPassword : '••••••••••••••••'}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRevealed(prev => !prev)}
                aria-pressed={isRevealed}
                className="flex items-center gap-1.5 text-xs font-bold"
                aria-label={isRevealed ? 'Hide temporary password' : 'Reveal temporary password'}
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reveal</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p id="one-time-credential-desc" className="leading-relaxed">
              <strong>Important Security Notice:</strong>{' '}
              {warningText}
            </p>
          </div>

          {/* Copy / Print Feedback Live Region */}
          {copyFeedback && (
            <div
              role="status"
              aria-live="polite"
              className="mt-3 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {copyFeedback}
            </div>
          )}

          {/* Physical Delivery Checklist Guidance */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> Physical Handoff Checklist:
            </div>
            <p>1. Verify recipient identity with Student/Personnel ID before physical handoff.</p>
            <p>2. Instruct user to sign in using Institutional Email and change password immediately.</p>
            <p>3. If slip is lost or exposed, perform an authorized Reset Temporary Password.</p>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCopy}
                className="flex items-center gap-2 font-bold text-xs rounded-xl"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Credentials Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Credentials</span>
                  </>
                )}
              </Button>

              {/* Phase 5 Print Credential Slip Action */}
              {typeof onPrint === 'function' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onPrint(credential)}
                  className="flex items-center gap-2 font-bold text-xs rounded-xl"
                  aria-label={hasPrinted || printAttemptCount > 0 ? 'Print Credential Slip Again' : 'Print Credential Slip'}
                >
                  <Printer className="w-4 h-4" />
                  <span>{hasPrinted || printAttemptCount > 0 ? 'Print Again' : 'Print Credential Slip'}</span>
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="default"
              onClick={onRequestClose}
              className="rounded-xl px-6 font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Done
            </Button>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDiscardOpen}
        title="Discard Temporary Credential?"
        message="Have you securely saved or delivered these credentials? Closing this window permanently removes the displayed temporary password. It cannot be viewed again."
        confirmText="Close and remove credentials"
        cancelText="Continue viewing credentials"
        type="warning"
        onConfirm={onConfirmDiscard}
        onCancel={onCancelDiscard}
      />

      {/* Print Slip View — Mounted only during active print preparation/lifecycle */}
      {isPrintPrepared && (
        <CredentialSlipPrintView
          credential={credential}
          printedAtLabel={printedAtLabel}
        />
      )}
    </>
  )
}
