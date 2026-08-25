import React from 'react'
import { Award, CheckCircle2, RotateCcw } from 'lucide-react'
import CriterionEvaluation from '../../studio/evaluation/CriterionEvaluation'

export default function NDMURatingPane({
  submission,
  scores = {},
  evidenceItems = [],
  selectedEvidence,
  onVerifyItem,
  onRejectItem,
  onOpenReturnModal,
  onOpenFinalizeModal,
  onClearSelectedEvidence
}) {
  const unverifiedCount = evidenceItems.filter(
    (i) => i.verificationStatus === 'pending' || i.verification_status === 'pending'
  ).length

  const unratedCount = evidenceItems.filter(
    (i) => (i.verificationStatus === 'verified' || i.verification_status === 'verified') &&
           i.ratingStatus !== 'rated' && i.rating_status !== 'rated'
  ).length

  const areaATotal = Number(scores.areaA?.total ?? scores.areaA_score ?? 0).toFixed(2)
  const areaBTotal = Number(scores.areaB?.awardedTotal ?? scores.areaB?.total ?? scores.areaB_score ?? 0).toFixed(2)
  const areaCTotal = Number(scores.areaC?.total ?? scores.areaC_score ?? 0).toFixed(2)
  const totalScore = Number(scores.grandTotalAwarded ?? scores.total_score ?? scores.totalScore ?? 0).toFixed(2)

  const isReadyForFinalize = unverifiedCount === 0 && unratedCount === 0 && evidenceItems.length > 0

  return (
    <div className="h-full flex flex-col font-sans overflow-hidden bg-white dark:bg-[#131e2e]">
      {/* Live Capped Score Summary Box Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-[#EFF7F0]/30 dark:bg-emerald-950/20 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#176B43] dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>Rating Matrix Score Summary</span>
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {unverifiedCount === 0 && unratedCount === 0
              ? '✓ All Items Evaluated'
              : `${unverifiedCount + unratedCount} Items Remaining`}
          </span>
        </div>

        {/* Areas Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-400">Area A (Prof Dev)</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {areaATotal} <span className="text-xs text-slate-400 font-normal">/ 70</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-400">Area B (Productivity)</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {areaBTotal} <span className="text-xs text-slate-400 font-normal">/ 50</span>
            </p>
            {scores.areaB?.rawTotal > scores.areaB?.awardedTotal && (
              <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                Raw: {Number(scores.areaB?.rawTotal).toFixed(2)} (Capped 50)
              </p>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase text-slate-400">Area C (Service)</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
              {areaCTotal} <span className="text-xs text-slate-400 font-normal">/ 40</span>
            </p>
          </div>
        </div>

        {/* Grand Total */}
        <div className="p-3 rounded-xl bg-[#176B43] text-white flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider">Total Ranking Points</span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            {totalScore} / 160.00
          </span>
        </div>
      </div>

      {/* Item Evidence Verification & Rating Studio */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <CriterionEvaluation
          selectedEvidence={selectedEvidence}
          onVerify={(id, pts, payload, rem) => onVerifyItem(id, pts, payload, rem)}
          onVerifyAndNext={(id, pts, payload, rem) => onVerifyItem(id, pts, payload, rem, true)}
          onReject={(id, rem) => onRejectItem(id, rem)}
          tenureYears={submission?.tenure_years || 0}
        />
      </div>

      {/* Studio Action Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenReturnModal}
          className="py-2.5 px-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Return for Revision</span>
        </button>

        <button
          type="button"
          disabled={!isReadyForFinalize}
          onClick={onOpenFinalizeModal}
          className="py-2.5 px-4 rounded-xl bg-[#176B43] hover:bg-[#125334] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Finalize Evaluation</span>
        </button>
      </div>
    </div>
  )
}
