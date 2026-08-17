import React, { useState } from 'react'
import { Award, ShieldCheck, CheckCircle2, AlertCircle, RotateCcw, Check, HelpCircle, FileText, X } from 'lucide-react'
import EvidenceDocumentViewer from '../portfolio/EvidenceDocumentViewer'

export default function NDMURatingPane({
  submission,
  scores,
  evidenceItems = [],
  selectedEvidence,
  onVerifyItem,
  onRejectItem,
  onOpenReturnModal,
  onOpenFinalizeModal,
  onClearSelectedEvidence
}) {
  const [remarks, setRemarks] = useState('')
  const [overridePoints, setOverridePoints] = useState('')

  const handleVerifySelected = () => {
    if (!selectedEvidence) return
    const pts = parseFloat(overridePoints) || selectedEvidence.eligiblePoints || 0
    onVerifyItem(selectedEvidence.id, pts)
    setOverridePoints('')
  }

  const handleRejectSelected = () => {
    if (!selectedEvidence) return
    onRejectItem(selectedEvidence.id, 'Document unreadable or insufficient proof')
  }

  const unverifiedCount = evidenceItems.filter(i => !i.verificationStatus || i.verificationStatus === 'pending').length

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-white dark:bg-[#131e2e]">
      {/* Live Capped Score Summary Box Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-[#1b4332]/5 dark:bg-emerald-950/30 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#1b4332] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>Official NDMU Rating Matrix Score Summary</span>
          </span>
          <span className="text-[10px] font-extrabold text-slate-500">
            {unverifiedCount === 0 ? '✓ All Items Evaluated' : `${unverifiedCount} Items Pending Evaluation`}
          </span>
        </div>

        {/* Areas Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400">Area A (Prof Dev)</p>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {scores.areaA?.total || 64} <span className="text-xs text-slate-400 font-normal">/ 70</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400">Area B (Productivity)</p>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {scores.areaB?.awardedTotal || 45} <span className="text-xs text-slate-400 font-normal">/ 50</span>
            </p>
            {scores.areaB?.rawTotal > scores.areaB?.awardedTotal && (
              <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                Raw: {scores.areaB?.rawTotal} (Capped 50)
              </p>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400">Area C (Service)</p>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {scores.areaC?.total || 32} <span className="text-xs text-slate-400 font-normal">/ 40</span>
            </p>
          </div>
        </div>

        {/* Grand Total */}
        <div className="p-3 rounded-xl bg-[#1b4332] text-white flex items-center justify-between shadow-xs">
          <span className="text-xs font-black uppercase tracking-wider">Grand Total Awarded Score</span>
          <span className="text-lg font-black tracking-tight text-emerald-300">
            {scores.grandTotalAwarded || 141} / 160 Points Max
          </span>
        </div>
      </div>

      {/* Item Evidence Verification & Proof Inspection Workspace */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedEvidence ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            {/* Embedded Proof Document Previewer (Synchronized Right Pane Workspace) */}
            <EvidenceDocumentViewer
              item={selectedEvidence}
              onClose={() => onClearSelectedEvidence && onClearSelectedEvidence()}
            />

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Verifying Item: {selectedEvidence.title}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Default Eligible: {selectedEvidence.eligiblePoints} pts
                </span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Awarded Points (Override if necessary)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={overridePoints !== '' ? overridePoints : selectedEvidence.eligiblePoints}
                  onChange={e => setOverridePoints(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleVerifySelected}
                  className="flex-1 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Verify Item (+{overridePoints || selectedEvidence.eligiblePoints} pts)</span>
                </button>

                <button
                  type="button"
                  onClick={handleRejectSelected}
                  className="py-2.5 px-4 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 font-extrabold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 font-medium rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
            <HelpCircle className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            Click any row from the Left Pane to view its proof document here and verify points.
          </div>
        )}

        {/* HR Evaluator Remarks */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
            HR Evaluator Remarks &amp; Certification Notes
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Record official evaluation notes for ranking committee audit trail..."
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:border-[#1b4332]"
          />
        </div>
      </div>

      {/* Footer Decision Action Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onOpenReturnModal}
          className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <span>Return for Revision</span>
        </button>

        <button
          type="button"
          onClick={onOpenFinalizeModal}
          className="px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Finalize &amp; Issue Official HR Seal</span>
        </button>
      </div>
    </div>
  )
}
