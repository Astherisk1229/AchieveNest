import React from 'react'
import { Award, FileText, Printer, X } from 'lucide-react'
import personnelEvaluationResultService from '../../services/PersonnelEvaluationResultService'

const points = (value) => Number(value || 0).toFixed(2)

export default function PersonnelEvaluationResultModal({ result, loading, error, onClose }) {
  if (!result && !loading && !error) return null
  const isFaculty = result?.personnel?.group === 'FACULTY'
  const summary = result?.summary || {}
  const sections = isFaculty
    ? (summary.sections || []).map(section => ({ title: section.title, items: section.items || [] }))
    : [
        { title: 'Performance and Personal Indicators', items: summary.performance_personal_indicators?.items || [] },
        { title: 'Service and Leadership', items: summary.service_leadership?.items || [] }
      ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Completed evaluation result">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><Award className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950 dark:text-white">Completed Evaluation Result</h2><p className="text-xs text-slate-500">Released after final completion</p></div></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X className="h-5 w-5" /></button>
        </header>
        <div className="space-y-5 p-6">
          {loading && <p className="py-12 text-center text-sm text-slate-500">Loading your completed result…</p>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
          {result && <>
            <section className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2 dark:bg-slate-800/60">
              <div><span className="block text-xs font-bold uppercase text-slate-500">Classification</span><strong>{isFaculty ? 'Faculty' : 'Non-Teaching Faculty'}</strong></div>
              <div><span className="block text-xs font-bold uppercase text-slate-500">Evaluation version</span><strong>Version {result.evaluation.version_number}{result.evaluation.is_current ? ' · Current' : ' · Historical'}</strong></div>
              <div><span className="block text-xs font-bold uppercase text-slate-500">Period</span><strong>{result.evaluation_period.name || result.evaluation_period.academic_year || '—'}</strong></div>
              <div><span className="block text-xs font-bold uppercase text-slate-500">Completed</span><strong>{result.evaluation.completed_at ? new Date(result.evaluation.completed_at).toLocaleString() : '—'}</strong></div>
            </section>
            {sections.map(section => <section key={section.title}><h3 className="mb-2 font-extrabold text-slate-900 dark:text-white">{section.title}</h3><div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">{section.items.length === 0 ? <p className="p-4 text-sm text-slate-500">No evaluated items in this section.</p> : section.items.map((item, index) => <div key={item.criterion_code || item.document || index} className="flex items-start justify-between gap-4 border-b border-slate-100 p-3 text-sm last:border-0 dark:border-slate-800"><div><strong className="block">{item.criterion_code || 'Evaluated item'}</strong><span className="text-slate-500">{item.document || item.indicator || '—'}</span></div><strong>{points(item.points_earned)} pts</strong></div>)}</div></section>)}
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-950 p-5 text-white"><div><span className="text-xs font-bold uppercase text-emerald-200">Completed total</span><p className="text-3xl font-black">{points(result.scores.total)}</p></div><button type="button" onClick={() => window.open(personnelEvaluationResultService.printableUrl(result.evaluation.version_id), '_blank', 'noopener,noreferrer')} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-900"><Printer className="h-4 w-4" /> Printable HTML</button></section>
            <p className="flex items-center gap-2 text-xs text-slate-500"><FileText className="h-4 w-4" /> This immutable result is bound to evaluation Version {result.evaluation.version_number}.</p>
          </>}
        </div>
      </div>
    </div>
  )
}
