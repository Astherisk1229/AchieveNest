import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, X } from 'lucide-react'
import { submitPasswordChange } from '../../services/authService'

const policyMessage = 'Password does not meet the required security rules.'

function safePasswordError(error) {
  const code = error?.error?.code || error?.response?.data?.error?.code || error?.code
  if (code === 'INCORRECT_CURRENT_PASSWORD') return 'Current password is incorrect.'
  if (code === 'CURRENT_PASSWORD_REQUIRED') return 'Enter your current password.'
  if (code === 'CONFIRM_PASSWORD_REQUIRED') return 'Confirm your new password.'
  if (code === 'PASSWORD_MISMATCH') return 'Passwords do not match.'
  if (code === 'INVALID_PASSWORD_LENGTH' || code === 'INVALID_PASSWORD_POLICY') return policyMessage
  if (code === 'PASSWORD_REUSE_FORBIDDEN') return 'Choose a new password that is different from your current password.'
  if (code === 'MISSING_BEARER_TOKEN' || code === 'INVALID_ACCESS_TOKEN') return 'Your session has expired. Sign in again before changing your password.'
  return 'Your password could not be updated. Check your entries and try again.'
}

export default function ChangePasswordDialog({ onClose, onSuccess }) {
  const dialogRef = useRef(null)
  const currentInputRef = useRef(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return undefined
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    currentInputRef.current?.focus()
    return () => { if (dialog.open && typeof dialog.close === 'function') dialog.close() }
  }, [])

  const requirements = [
    ['At least 8 characters', newPassword.length >= 8],
    ['Uppercase and lowercase letters', /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)],
    ['At least one number', /[0-9]/.test(newPassword)],
    ['At least one special character', /[^A-Za-z0-9]/.test(newPassword)]
  ]
  const passwordsMatch = Boolean(confirmPassword) && newPassword === confirmPassword
  const passwordIsDifferent = Boolean(currentPassword) && newPassword !== currentPassword

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    if (!currentPassword) return setErrorMessage('Enter your current password.')
    if (!requirements.every(([, valid]) => valid)) return setErrorMessage(policyMessage)
    if (!passwordsMatch) return setErrorMessage('Passwords do not match.')
    if (!passwordIsDifferent) return setErrorMessage('Choose a new password that is different from your current password.')

    setIsSubmitting(true)
    try {
      await submitPasswordChange(newPassword, confirmPassword, currentPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onSuccess?.()
    } catch (error) {
      setErrorMessage(safePasswordError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordField = ({ id, label, value, setValue, visible, setVisible, autoComplete, inputRef }) => <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</label>
    <div className="relative">
      <input ref={inputRef} id={id} name={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => setValue(event.target.value)} autoComplete={autoComplete} required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-950 outline-none transition focus-visible:border-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-700/25 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
      <button type="button" onClick={() => setVisible((state) => !state)} aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800">{visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button>
    </div>
  </div>

  return <dialog ref={dialogRef} aria-labelledby="change-password-title" onCancel={(event) => { event.preventDefault(); if (!isSubmitting) onClose?.() }} className="fixed m-auto max-h-[90dvh] w-[min(440px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/55 dark:border-slate-700 dark:bg-[#131e2e] dark:text-slate-100">
    <form onSubmit={handleSubmit} className="p-5 sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800 dark:text-emerald-300" aria-hidden="true" /><div><h2 id="change-password-title" className="text-base font-extrabold">Change Password</h2><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Verify your current password before choosing a new one.</p></div></div>
        <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close dialog" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50 dark:hover:bg-slate-800"><X className="h-4 w-4" aria-hidden="true" /></button>
      </header>

      {errorMessage && <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{errorMessage}</p>}
      <div className="space-y-3.5">
        {passwordField({ id: 'current-password', label: 'Current Password', value: currentPassword, setValue: setCurrentPassword, visible: showCurrent, setVisible: setShowCurrent, autoComplete: 'current-password', inputRef: currentInputRef })}
        {passwordField({ id: 'new-password', label: 'New Password', value: newPassword, setValue: setNewPassword, visible: showNew, setVisible: setShowNew, autoComplete: 'new-password' })}
        {passwordField({ id: 'confirm-new-password', label: 'Confirm New Password', value: confirmPassword, setValue: setConfirmPassword, visible: showConfirm, setVisible: setShowConfirm, autoComplete: 'new-password' })}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] dark:border-slate-700 dark:bg-slate-900/70">
        <p className="mb-2 font-semibold">Password requirements</p>
        <ul className="space-y-1">{requirements.map(([label, valid]) => <li key={label} className={`flex items-center gap-2 ${valid ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{label}</li>)}<li className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Passwords match</li></ul>
      </div>

      <footer className="mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
        <button type="submit" disabled={isSubmitting || !currentPassword || !requirements.every(([, valid]) => valid) || !passwordsMatch || !passwordIsDifferent} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900">{isSubmitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />}{isSubmitting ? 'Updating…' : 'Update Password'}</button>
      </footer>
    </form>
  </dialog>
}
