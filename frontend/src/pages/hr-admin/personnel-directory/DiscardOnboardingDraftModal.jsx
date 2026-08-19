import React from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

/**
 * DiscardOnboardingDraftModal Component
 * Provides explicit destructive-action confirmation before clearing a saved local onboarding draft.
 */
export default function DiscardOnboardingDraftModal({
  isOpen,
  targetName = 'Personnel Member',
  onClose,
  onConfirmDiscard
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Discard Unfinished Onboarding Draft?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to permanently delete the saved draft for <strong className="text-slate-700 dark:text-slate-200">{targetName}</strong>? All entered form progress will be cleared and cannot be recovered.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirmDiscard}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard Draft &amp; Start Fresh</span>
          </button>
        </div>
      </div>
    </div>
  )
}
