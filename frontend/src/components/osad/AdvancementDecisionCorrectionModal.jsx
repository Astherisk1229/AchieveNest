import React, { useState } from 'react'
import { X, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Button } from '../ui/button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useConfirmableClose } from '../../hooks/useConfirmableClose'

export function AdvancementDecisionCorrectionModal({
  candidate,
  isPublished = false,
  onClose,
  onConfirmReverse,
  onConfirmUndo
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const isDirty = () => reason.trim() !== ''

  const handleReset = () => {
    setReason('')
    setError('')
  }

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen: Boolean(candidate),
    isDirty,
    onClose,
    onDiscard: handleReset
  })

  if (!candidate) return null

  const handleExecute = onConfirmReverse || onConfirmUndo

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('A mandatory reason is required for administrative decision changes.')
      return
    }

    if (handleExecute) {
      handleExecute(candidate.candidacyId || candidate.id || candidate.studentId, reason.trim())
    }
    handleReset()
    onClose()
  }

  return (
    <>
      <div
        onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white"
        >
          
          {/* Modal Header */}
          <div className="px-6 py-4 bg-rose-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-200" />
              <h3 className="font-extrabold text-base">
                Reverse Advancement Decision
              </h3>
            </div>
            <button
              type="button"
              aria-label="Close dialog"
              onClick={requestClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              You are about to reverse the Stage 1 advancement decision for candidate{' '}
              <strong className="text-slate-900 dark:text-white">{candidate.student_name || candidate.name}</strong> ({candidate.program}).
            </p>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-amber-800 dark:text-amber-300 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This correction will be recorded in the append-only OSAD activity log for institutional audit compliance.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason for Decision Reversal <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Provide a detailed administrative explanation for reversing this decision..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 transition"
              />
              {error && <p className="text-rose-500 font-extrabold text-[11px]">{error}</p>}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={requestClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold transition cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="destructive"
                className="gap-1.5 shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Reversal</span>
              </Button>
            </div>
          </form>

        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Discard Decision Reversal Reason?"
        message="Are you sure you want to close? The entered reversal explanation will be discarded."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />
    </>
  )
}

export const UndoConfirmationReviewModal = AdvancementDecisionCorrectionModal
export default AdvancementDecisionCorrectionModal
