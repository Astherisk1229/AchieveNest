import React from 'react'
import { CheckSquare, X, ShieldCheck } from 'lucide-react'

export function BatchConfirmationToolbar({
  selectedCount,
  onSelectAllEligible,
  onClearSelection,
  onOpenBatchConfirmModal
}) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl px-5 py-3 shadow-2xl border border-slate-800 flex items-center gap-4 animate-in slide-in-from-bottom duration-200 font-sans">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
          {selectedCount}
        </span>
        <span className="text-xs font-bold text-slate-200">Candidates Selected</span>
      </div>

      <div className="h-4 w-px bg-slate-800" />

      <button
        type="button"
        onClick={onSelectAllEligible}
        className="text-xs font-extrabold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1"
      >
        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
        <span>Select Visible Eligible</span>
      </button>

      <button
        type="button"
        onClick={onOpenBatchConfirmModal}
        className="px-3.5 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-extrabold transition cursor-pointer shadow-sm flex items-center gap-1.5"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Batch Confirm ({selectedCount})</span>
      </button>

      <button
        type="button"
        onClick={onClearSelection}
        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer ml-1"
        title="Clear Selection"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default BatchConfirmationToolbar
