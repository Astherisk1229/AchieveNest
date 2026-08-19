import React, { useState } from 'react'
import { X, ShieldAlert, AlertTriangle, ArrowRightLeft, UserCheck } from 'lucide-react'

export function RecipientConflictModal({
  categoryTitle = "Dean's Honor Roll",
  existingRecipient,
  newCandidate,
  onClose,
  onConfirmReplacement
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!newCandidate) return null

  const handleExecuteReplace = (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('A mandatory explanation reason is required to replace a confirmed recipient.')
      return
    }

    onConfirmReplacement(newCandidate.id, reason.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="px-6 py-4 bg-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-200" />
            <h3 className="font-extrabold text-base">Category Recipient Quota Reached</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExecuteReplace} className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-amber-900 dark:text-amber-300 font-medium">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              The Award Category <strong>[{categoryTitle}]</strong> permits a maximum of 1 confirmed recipient.
            </span>
          </div>

          {/* Recipient Comparison Card */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 block">Current Recipient</span>
              <h5 className="font-extrabold text-slate-900 dark:text-white">
                {existingRecipient?.student_name || 'Existing Confirmed Awardee'}
              </h5>
              <p className="text-[11px] text-slate-500 font-semibold">
                {existingRecipient?.program || 'BS Computer Science'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 space-y-1">
              <span className="text-[10px] uppercase font-black text-[#2d8a4e] block">Proposed Replacement</span>
              <h5 className="font-extrabold text-slate-900 dark:text-white">
                {newCandidate.student_name || newCandidate.name}
              </h5>
              <p className="text-[11px] text-slate-500 font-semibold">
                {newCandidate.program || 'BS Computer Science'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Reason for Replacement <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              placeholder="Provide a detailed explanation for replacing the confirmed recipient..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition"
            />
            {error && <p className="text-rose-500 font-extrabold text-[11px]">{error}</p>}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Replace Recipient</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default RecipientConflictModal
