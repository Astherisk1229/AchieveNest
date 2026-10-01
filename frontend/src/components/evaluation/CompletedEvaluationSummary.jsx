import React from 'react'
import { FileCheck2, Printer } from 'lucide-react'
import NonTeachingRankingScale from './NonTeachingRankingScale'

const number = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const date = value => value ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

const formats = {
  FACULTY_EVALUATION_SUMMARY: {
    title: 'Faculty Evaluation Summary',
    description: 'Official completed faculty portfolio evaluation',
    criterionHeading: 'Criterion',
  },
  NON_TEACHING_FACULTY_EVALUATION_RESULT: {
    title: 'Non-Teaching Personnel Ranking Scale',
    description: 'Official completed personnel evaluation',
    criterionHeading: 'Indicator / criterion',
  },
}

const criterionDetails = item => {
  const snapshot = item.criterion_snapshot || {}
  return {
    code: item.criterion_code || snapshot.code || snapshot.criterion_code || '—',
    title: snapshot.title || snapshot.name || snapshot.criterion || item.item_description || item.achievement || 'Criterion snapshot',
  }
}

export default function CompletedEvaluationSummary({ result }) {
  const format = formats[result?.summary?.format_key]
  if (!format) return <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:bg-rose-950/30 dark:text-rose-100">This completed report uses an unsupported summary format.</div>

  if (result.summary.format_key === 'NON_TEACHING_FACULTY_EVALUATION_RESULT') {
    return <NonTeachingRankingScale result={result}/>
  }

  const items = result.items || []
  return <article data-evaluation-summary className="overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white print:border-0 print:shadow-none">
    <style>{`@media print { body * { visibility: hidden !important; } [data-evaluation-summary], [data-evaluation-summary] * { visibility: visible !important; } [data-evaluation-summary] { position: absolute; inset: 0; width: 100%; } [data-print-hidden] { display: none !important; } @page { size: A4; margin: 14mm; } }`}</style>
    <header className="border-b border-slate-200 px-5 py-5 sm:px-7 dark:border-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-2xl font-black tracking-[-0.025em]">{format.title}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{format.description}</p></div>
        <button data-print-hidden type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Printer className="h-4 w-4"/>Print / Export PDF</button>
      </div>
    </header>

    <dl className="grid gap-x-8 gap-y-4 border-b border-slate-200 px-5 py-5 text-sm sm:grid-cols-2 lg:grid-cols-3 sm:px-7 dark:border-slate-800" aria-label="Evaluation details">
      <Detail label="Personnel" value={result.personnel?.name}/><Detail label="Personnel ID" value={result.personnel?.institutional_id}/><Detail label="Personnel type" value={result.personnel?.group === 'FACULTY' ? 'Faculty' : 'Non-Teaching Faculty'}/>
      <Detail label="Position" value={result.personnel?.position}/><Detail label="Department / College" value={[result.personnel?.department, result.personnel?.college].filter(Boolean).join(' · ')}/><Detail label="Evaluation period" value={result.evaluation_period?.name || result.evaluation_period?.academic_year}/>
      <Detail label="Criteria version" value={result.scale_version_id}/><Detail label="Evaluation version" value={`Version ${result.evaluation?.version_number}`}/><Detail label="Completed" value={date(result.evaluation?.completed_at)}/>
    </dl>

    <section className="px-5 py-6 sm:px-7" aria-labelledby="criterion-results-heading">
      <h2 id="criterion-results-heading" className="text-lg font-black">Criterion results and contributing evidence</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Evidence appears here only when its finalized verification status is verified.</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th className="px-4 py-3">{format.criterionHeading}</th><th className="px-4 py-3">Achievement</th><th className="px-4 py-3">Contributing evidence</th><th className="px-4 py-3 text-right">Awarded</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{items.map((item, index) => {
        const criterion = criterionDetails(item)
        const evidence = item.verification_status === 'verified' ? (item.evidence_snapshot || []) : []
        return <tr key={item.id || `${criterion.code}-${index}`}><td className="px-4 py-4"><p className="font-bold">{criterion.code}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{criterion.title}</p></td><td className="px-4 py-4">{item.achievement || item.item_description || '—'}</td><td className="px-4 py-4">{evidence.length ? <ul className="space-y-1">{evidence.map((entry, evidenceIndex) => <li key={entry.id || evidenceIndex} className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 shrink-0 text-emerald-700"/><span>{entry.original_filename || 'Verified evidence'}</span></li>)}</ul> : <span className="text-slate-500">No contributing evidence</span>}</td><td className="px-4 py-4 text-right font-bold tabular-nums">{number.format(item.awarded_points || 0)}</td></tr>
      })}{items.length === 0 && <tr><td colSpan="4" className="px-5 py-12 text-center text-slate-500">No criterion snapshots were recorded in this report.</td></tr>}</tbody></table></div>
    </section>

    <footer className="grid gap-6 border-t border-slate-200 bg-slate-50 px-5 py-5 sm:grid-cols-[1fr_auto] sm:px-7 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="text-xs leading-5 text-slate-500"><p>Immutable report · {result.result_snapshot?.report_id}</p><p>Generated {date(result.result_snapshot?.generated_at)}</p></div>
      <dl className="grid grid-cols-3 gap-x-6 text-right"><Score label="Report score" value={result.scores?.total}/><Score label="Maximum" value={result.scores?.maximum}/><Score label="Passing" value={result.scores?.passing}/></dl>
    </footer>
  </article>
}

function Detail({ label, value }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-bold">{value || '—'}</dd></div> }
function Score({ label, value }) { return <div><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 text-lg font-black tabular-nums">{value === null || value === undefined ? '—' : number.format(value)}</dd></div> }
