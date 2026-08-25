import React from 'react'
import { Printer, Download, FileText, CheckCircle2 } from 'lucide-react'

export function CandidateReviewActions({
  cycleStatus = 'ready_for_review',
  onPrintDraft,
  onExportCsv,
  onPublishRoster,
  onPrintOfficial,
  onGenerateSummaryReport
}) {
  const handleExport = onGenerateSummaryReport || onExportCsv

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => handleExport && handleExport(false)}
        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>Export Stage 1 Report (CSV)</span>
      </button>

      <button
        type="button"
        onClick={onPrintDraft || onPrintOfficial}
        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
      >
        <Printer className="w-3.5 h-3.5 text-slate-500" />
        <span>Print Review Summary</span>
      </button>
    </div>
  )
}

export const AwardRosterActions = CandidateReviewActions
export default CandidateReviewActions
