import React, { useMemo, useState } from 'react'
import { FileCheck2, Search } from 'lucide-react'

const summaryStatuses = new Set(['ready_for_finalization', 'completed'])
const statusLabel = status => status === 'completed' ? 'Completed' : 'Endorsed to HR'
const submittedDate = value => {
  if (!value) return 'Date unavailable'
  const date = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DeanEvaluationSummariesTab({ reviews = [], onViewSummary }) {
  const [search, setSearch] = useState('')
  const summaries = useMemo(() => reviews
    .filter(review => summaryStatuses.has(review.status))
    .filter(review => {
      const query = search.trim().toLocaleLowerCase()
      return !query || [review.full_name, review.institutional_id, review.program_name, review.department_name]
        .some(value => String(value || '').toLocaleLowerCase().includes(query))
    })
    .sort((left, right) => String(right.submitted_at || '').localeCompare(String(left.submitted_at || ''))), [reviews, search])
  const totalCount = reviews.filter(review => summaryStatuses.has(review.status)).length

  return <section aria-labelledby="dean-evaluation-summaries-heading" className="space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="dean-evaluation-summaries-heading" className="text-xl font-black text-slate-950 dark:text-white">Evaluation Summaries</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Official results for evaluations endorsed to HR or completed.</p>
      </div>
      <p className="text-sm font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">{totalCount} {totalCount === 1 ? 'summary' : 'summaries'}</p>
    </header>

    <label className="relative block">
      <span className="sr-only">Search evaluation summaries</span>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
      <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search personnel name or ID" className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
    </label>

    {summaries.length ? <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="grid grid-cols-[minmax(12rem,1.5fr)_minmax(9rem,1fr)_7rem_9rem_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 max-sm:hidden">
        <span>Personnel</span><span>Evaluation status</span><span>Version</span><span>Submitted</span><span className="sr-only">Action</span>
      </div>
      <ul aria-label="Evaluation summaries" className="divide-y divide-slate-200 dark:divide-slate-800">
        {summaries.map(review => <li key={review.id}>
          <div className="grid grid-cols-1 items-center gap-3 px-4 py-4 sm:grid-cols-[minmax(12rem,1.5fr)_minmax(9rem,1fr)_7rem_9rem_auto]">
            <div className="min-w-0"><p className="truncate font-bold text-slate-950 dark:text-white">{review.full_name || 'Personnel record'}</p><p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">{review.institutional_id || review.position_title || 'ID unavailable'}</p></div>
            <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">{statusLabel(review.status)}</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Version {review.version_number || 1}</span>
            <time className="text-sm text-slate-600 dark:text-slate-300" dateTime={review.submitted_at || undefined}>{submittedDate(review.submitted_at)}</time>
            <button type="button" onClick={() => onViewSummary?.(review.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-200 dark:hover:bg-emerald-950/40"><FileCheck2 aria-hidden="true" className="h-4 w-4" />View summary</button>
          </div>
        </li>)}
      </ul>
    </div> : <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-950">
      <FileCheck2 aria-hidden="true" className="mx-auto h-6 w-6 text-slate-400" />
      <h3 className="mt-3 font-bold text-slate-950 dark:text-white">{search ? 'No matching evaluation summaries.' : 'No evaluation summaries yet.'}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{search ? 'Try another name or personnel ID.' : 'Summaries will appear here after a faculty evaluation is endorsed to HR or completed.'}</p>
    </div>}
  </section>
}
