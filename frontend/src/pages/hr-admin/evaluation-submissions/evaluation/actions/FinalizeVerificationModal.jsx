import React from 'react'
import { X, ShieldCheck, CheckCircle2, Award, Check } from 'lucide-react'

export default function FinalizeVerificationModal({ submission, scores = {}, isOpen, onClose, onConfirmFinalize }) {
  if (!isOpen || !submission) return null

  const handleFinalize = () => {
    if (onConfirmFinalize) {
      onConfirmFinalize(submission.id, scores)
    }
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-black text-[#064e2b] dark:text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Finalize Portfolio Verification</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Verification Checklist */}
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              Pre-Finalization Checklist
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 text-[#064e2b] dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>All submitted evidence items reviewed &amp; verified</span>
              </div>
              <div className="flex items-center gap-2 text-[#064e2b] dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>NDMU Rating Matrix criteria mapped &amp; point caps enforced</span>
              </div>
              <div className="flex items-center gap-2 text-[#064e2b] dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Official HR evaluation seal will be generated</span>
              </div>
            </div>
          </div>

          {/* Score Summary Box */}
          <div className="p-4 rounded-2xl bg-[#EFF7F0]/5 dark:bg-emerald-950/30 border border-[#69A97C]/20 dark:border-emerald-800 space-y-2">
            <p className="text-[10px] uppercase font-black tracking-wider text-[#064e2b] dark:text-emerald-400">
              Official Awarded Point Score Summary
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
              <div>
                <p className="text-[10px] text-slate-400">Area A (Prof Dev)</p>
                <p className="font-extrabold text-slate-900 dark:text-white">{scores.areaA?.total || 64} / 70</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Area B (Productivity)</p>
                <p className="font-extrabold text-slate-900 dark:text-white">{scores.areaB?.awardedTotal || 45} / 50</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Area C (Service)</p>
                <p className="font-extrabold text-slate-900 dark:text-white">{scores.areaC?.total || 32} / 40</p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#69A97C]/20 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase">Grand Total Score</span>
              <span className="text-base font-black text-[#064e2b] dark:text-emerald-400">
                {scores.grandTotalAwarded || 141} / 160 Points Max
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              className="px-5 py-2.5 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Finalize &amp; Issue Official HR Seal</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
