import React, { useState } from 'react'
import { X, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function BatchConfirmationReviewModal({
  selectedCandidates = [],
  onClose,
  onConfirmBatch
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchResults, setBatchResults] = useState(null)

  const eligibleCandidates = selectedCandidates.filter(c => !c.confirmed && c.eligibilityStatus !== 'below_threshold')
  const blockedCandidates = selectedCandidates.filter(c => c.eligibilityStatus === 'below_threshold')
  const alreadyConfirmed = selectedCandidates.filter(c => c.confirmed)

  const handleExecuteBatch = async () => {
    setIsProcessing(true)
    setTimeout(() => {
      const results = onConfirmBatch(eligibleCandidates.map(c => c.id))
      setBatchResults(results || { confirmed: eligibleCandidates.length, skipped: blockedCandidates.length })
      setIsProcessing(false)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#064e2b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <h3 className="font-extrabold text-base">Batch Award Confirmation</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          {batchResults ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#16834a] mx-auto" />
              <h4 className="font-black text-sm text-[#064e2b] dark:text-emerald-300">Batch Processing Complete</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Successfully confirmed <strong className="text-[#16834a]">{batchResults.confirmed || eligibleCandidates.length}</strong> candidates. 
                {batchResults.skipped > 0 && ` ${batchResults.skipped} ineligible candidates were skipped.`}
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Review selected candidate eligibility before confirming award recipient status for this batch.
              </p>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Total Selected</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{selectedCandidates.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="text-[10px] uppercase font-black text-emerald-600 block">Eligible to Confirm</span>
                  <span className="text-base font-black text-[#16834a] dark:text-emerald-400">{eligibleCandidates.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
                  <span className="text-[10px] uppercase font-black text-amber-600 block">Blocked / Skipped</span>
                  <span className="text-base font-black text-amber-700 dark:text-amber-300">{blockedCandidates.length + alreadyConfirmed.length}</span>
                </div>
              </div>

              {blockedCandidates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{blockedCandidates.length} candidates are below the category score threshold and will be skipped.</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          {batchResults ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#064e2b] text-white font-extrabold text-xs transition cursor-pointer"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteBatch}
                disabled={isProcessing || eligibleCandidates.length === 0}
                className="px-4 py-2 rounded-xl bg-[#16834a] hover:bg-[#236e3e] text-white font-extrabold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Confirm {eligibleCandidates.length} Eligible</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export default BatchConfirmationReviewModal
