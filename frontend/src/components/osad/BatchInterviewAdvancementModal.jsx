import React, { useState } from 'react'
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function BatchInterviewAdvancementModal({
  selectedCandidates = [],
  onClose,
  onAdvanceBatch,
  onConfirmBatch
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchResults, setBatchResults] = useState(null)

  const handleExecute = onAdvanceBatch || onConfirmBatch

  const eligibleCandidates = selectedCandidates.filter(
    c => !c.confirmed && c.osadDecision !== 'ADVANCED_TO_INTERVIEW' && c.potentialCandidateStatus !== 'BELOW_THRESHOLD' && c.eligibilityStatus !== 'below_threshold'
  )
  const blockedCandidates = selectedCandidates.filter(
    c => c.potentialCandidateStatus === 'BELOW_THRESHOLD' || c.eligibilityStatus === 'below_threshold'
  )
  const alreadyAdvanced = selectedCandidates.filter(
    c => c.confirmed || c.osadDecision === 'ADVANCED_TO_INTERVIEW'
  )

  const handleExecuteBatch = async () => {
    setIsProcessing(true)
    setTimeout(() => {
      const results = handleExecute ? handleExecute(eligibleCandidates.map(c => c.candidacyId || c.id || c.studentId)) : null
      setBatchResults(results || { advanced: eligibleCandidates.length, skipped: blockedCandidates.length })
      setIsProcessing(false)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#064e2b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <h3 className="font-extrabold text-base">Batch Interview Advancement</h3>
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
                Successfully advanced <strong className="text-[#16834a]">{batchResults.advanced || eligibleCandidates.length}</strong> candidates to interview. 
                {batchResults.skipped > 0 && ` ${batchResults.skipped} candidates below threshold were skipped.`}
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Advance selected eligible candidates to Stage 2 (Interview) based on their Stage 1 portfolio review scores.
              </p>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Total Selected</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{selectedCandidates.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
                  <span className="text-[10px] uppercase font-black text-emerald-600 block">Eligible to Advance</span>
                  <span className="text-base font-black text-[#16834a] dark:text-emerald-400">{eligibleCandidates.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
                  <span className="text-[10px] uppercase font-black text-amber-600 block">Below Threshold / Skipped</span>
                  <span className="text-base font-black text-amber-700 dark:text-amber-300">{blockedCandidates.length + alreadyAdvanced.length}</span>
                </div>
              </div>

              {blockedCandidates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{blockedCandidates.length} candidates are below the Stage 1 review score threshold and will be skipped.</span>
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
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition cursor-pointer hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteBatch}
                disabled={eligibleCandidates.length === 0 || isProcessing}
                className="px-4 py-2 rounded-xl bg-[#064e2b] hover:bg-[#16834a] disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Advance Selected ({eligibleCandidates.length})</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

export const BatchConfirmationReviewModal = BatchInterviewAdvancementModal
export default BatchInterviewAdvancementModal
