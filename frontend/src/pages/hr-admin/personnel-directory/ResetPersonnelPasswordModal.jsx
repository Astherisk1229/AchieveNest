import React, { useState, useEffect } from 'react'
import { KeyRound, X, Copy, Check } from 'lucide-react'

/**
 * ResetPersonnelPasswordModal
 * HR identity-verified reset. The server generates the temporary password and returns it once;
 * nothing is typed or generated in the browser.
 */
export default function ResetPersonnelPasswordModal({ isOpen, personnel, onClose, onConfirmReset }) {
  const [verified, setVerified] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setVerified(false)
      setResult(null)
      setError('')
      setCopied(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen || !personnel) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.temporary_password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Copy failed. Select the password and copy it manually.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!verified) return
    setIsSubmitting(true)
    setError('')
    try {
      const data = await onConfirmReset(personnel)
      setResult(data)
    } catch (err) {
      setError(err?.error?.message || err?.message || 'The password could not be reset.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const affiliation = personnel.college_name || personnel.administrative_unit_name || personnel.college_code || 'Institutional affiliation unavailable'

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 z-50" onClick={result ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div role="dialog" aria-modal="true" aria-label="Reset Personnel Password" className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl font-sans">
          <div className="p-6 bg-[#EFF7F0] border-b border-[#69A97C] text-[#17663B] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-[#B7791F]" />
              <div>
                <h3 className="font-extrabold text-base">Reset Personnel Password</h3>
                <p className="text-xs text-[#356148] font-medium">HR Administrative Credential Reset</p>
              </div>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{personnel.full_name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                ID: {personnel.employee_id || personnel.institutional_id || 'Not recorded'} • {affiliation}
              </p>
              {personnel.email && <p className="text-[11px] text-[#16834a] font-semibold truncate">{personnel.email}</p>}
            </div>

            {result ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Temporary password (shown once)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold break-all">{result.temporary_password}</code>
                  <button type="button" onClick={handleCopy} className="px-2.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 font-medium">Give this to the personnel member securely. All of their sessions were signed out, and they must change it at next login. It cannot be shown again.</p>
              </div>
            ) : (
              <>
                <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-0.5" />
                  <span>I have verified this person's identity in person or through an authoritative institutional channel.</span>
                </label>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium">
                  The system generates a new temporary password, signs the account out everywhere, and requires a change at next login.
                </div>
              </>
            )}

            {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                {result ? 'Done' : 'Cancel'}
              </button>
              {!result && (
                <button type="submit" disabled={isSubmitting || !verified} className="px-4 py-2.5 rounded-xl bg-[#16834a] text-white font-extrabold text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmitting ? 'Resetting Password...' : 'Confirm Password Reset'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
