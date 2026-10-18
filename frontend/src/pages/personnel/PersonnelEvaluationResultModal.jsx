import React from 'react'
import { Award, X } from 'lucide-react'
import CompletedEvaluationSummary from '../../components/evaluation/CompletedEvaluationSummary'

export default function PersonnelEvaluationResultModal({ result, loading, error, onClose }) {
  if (!result && !loading && !error) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="personnel-evaluation-summary-heading">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><Award className="h-5 w-5" /></span><div><h2 id="personnel-evaluation-summary-heading" className="font-extrabold text-slate-950 dark:text-white">Evaluation Summary</h2><p className="text-xs text-slate-500">Official result for this completed evaluation</p></div></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>
        <div className="p-4 sm:p-6">
          {loading && <p className="py-12 text-center text-sm text-slate-500">Loading your completed result…</p>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
          {result && <CompletedEvaluationSummary result={result} context={result.summary_context || {}} embedded showApprovalLines={false}/>}
        </div>
      </div>
    </div>
  )
}
