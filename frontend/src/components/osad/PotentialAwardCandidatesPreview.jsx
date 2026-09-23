import React from 'react'
import { ArrowRight, Users } from 'lucide-react'

export default function PotentialAwardCandidatesPreview({ onViewAll }) {
  return <section className="border-y border-slate-200 py-5 dark:border-slate-800" aria-labelledby="potential-candidates-entry-heading">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
        <div><h2 id="potential-candidates-entry-heading" className="font-semibold text-slate-900 dark:text-white">Potential Candidates</h2><p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Open Awards &amp; Criteria to review server-authoritative candidate worklists for each award.</p></div>
      </div>
      {onViewAll && <button type="button" onClick={onViewAll} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950">Open Awards &amp; Criteria <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
    </div>
  </section>
}
