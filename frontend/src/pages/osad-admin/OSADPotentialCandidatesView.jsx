import React from 'react'
import { AlertTriangle, ArrowRight, Search, Users } from 'lucide-react'
import OSADAwardAuthorityBadge from '../../components/osad/OSADAwardAuthorityBadge'
import OSADAwardPageShell from '../../components/osad/OSADAwardPageShell'
import { OSADEmptyState, OSADErrorState, OSADSearchEmptyState } from '../../components/osad/OSADStateBlock'
import useAwardPotentialCandidates from '../../hooks/useAwardPotentialCandidates'

function Score({ candidate }) {
  if (['CONFIGURATION_ERROR', 'THRESHOLD_CONFIGURATION_ERROR', 'AWARD_AUTHORITY_PENDING'].includes(candidate.scoring_status)) {
    return <span className="text-slate-500">Score unavailable</span>
  }
  return (
    <div className="space-y-0.5 tabular-nums">
      <p className="font-semibold text-slate-900 dark:text-white">
        {candidate.rawScoreAvailable ? `${candidate.raw_portfolio_score} / ${candidate.computable_max_score}` : 'Score unavailable'}
      </p>
      <p className="text-xs text-slate-500">
        {candidate.potentialScoreAvailable ? `${candidate.portfolio_potential_score}% Portfolio Potential Score` : 'Potential score unavailable'}
      </p>
    </div>
  )
}

function Status({ candidate }) {
  const attention = candidate.scoring_status === 'PARTIALLY_UNSCORABLE'
  return (
    <div className="space-y-1">
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        {candidate.reviewStatusLabel}
      </span>
      {attention && (
        <p className="flex max-w-52 items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span><strong>Score requires attention.</strong> Some evidence could not be scored automatically.</span>
        </p>
      )}
    </div>
  )
}

function ReviewAction() {
  return <span className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">Review Candidate <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
}

const keyboardActivate = (event, action) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

function CandidateSkeleton() {
  return <div role="status" aria-label="Loading potential candidates" className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-[#131e2e]">
    {[1, 2, 3, 4].map((item) => <div key={item} className="grid animate-pulse grid-cols-[1.4fr_1fr_1fr] gap-5 px-4 py-4 motion-reduce:animate-none"><span className="h-4 rounded bg-slate-200 dark:bg-slate-800" /><span className="h-4 rounded bg-slate-100 dark:bg-slate-800" /><span className="h-4 rounded bg-slate-100 dark:bg-slate-800" /></div>)}
  </div>
}

export default function OSADPotentialCandidatesView({ award, onBack, onCatalog, onSelectStudent }) {
  const state = useAwardPotentialCandidates(award)
  const qualificationAvailable = award?.field_availability?.raw_qualifying_score?.status === 'AVAILABLE'
    && award?.field_availability?.computable_max_score?.status === 'AVAILABLE'
    && award?.field_availability?.candidate_threshold_percent?.status === 'AVAILABLE'

  const hasControls = state.model.candidates.length > 0
  const filteredEmpty = hasControls && state.candidates.length === 0

  return <OSADAwardPageShell title="Potential Candidates" description={award?.name || 'Award candidate worklist'} icon={Users}
    badge={<OSADAwardAuthorityBadge value={award?.authority_status} />}
    breadcrumbs={[{ label: 'Awards & Criteria', onClick: onCatalog }, { label: award?.name || 'Award', onClick: onBack }, { label: 'Potential Candidates' }]}>
    <div className="space-y-5">
      <section className="max-w-3xl space-y-3" aria-label="Candidate discovery qualification">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Students who reached the portfolio-based candidate-discovery threshold.</p>
        {qualificationAvailable ? <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex gap-2"><dt className="text-slate-500">Required Score</dt><dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{award.raw_qualifying_score} / {award.computable_max_score}</dd></div>
          <div className="flex gap-2"><dt className="text-slate-500">Qualification Threshold</dt><dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{award.candidate_threshold_percent}%</dd></div>
        </dl> : <p className="text-sm text-slate-500">Qualification values unavailable.</p>}
      </section>

      {hasControls && <div className="flex flex-col gap-3 border-y border-slate-200 py-4 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
          <label className="relative block w-full sm:max-w-sm"><span className="sr-only">Search students</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input type="search" value={state.search} onChange={(event) => state.setSearch(event.target.value)} placeholder="Search student…" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          <label><span className="sr-only">Filter review status</span><select value={state.status} onChange={(event) => state.setStatus(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">{state.statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><span>Sort</span><select value={state.sort} onChange={(event) => state.setSort(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="SCORE_DESC">Highest Potential Score</option><option value="SCORE_ASC">Lowest Potential Score</option><option value="NAME">Student Name</option><option value="RECENT">Recently Identified</option></select></label>
      </div>}

      {state.authorityPending ? <OSADEmptyState icon={Users} title="Candidate generation unavailable" description="This award's criteria are pending authority approval." />
        : state.loading ? <CandidateSkeleton />
        : state.error ? <OSADErrorState title="We couldn't load potential candidates." message="Your data hasn't been changed." onRetry={state.reload} retryLabel="Try again" />
        : !hasControls ? <OSADEmptyState icon={Users} title="No potential candidates yet" description="No students currently meet the portfolio candidate-discovery requirements for this award. Candidate results update as verified achievements become available." actionLabel="View Criteria" onAction={onBack} />
        : filteredEmpty ? <OSADSearchEmptyState title={state.search ? `No candidates found for “${state.search}”.` : 'No candidates match this review status.'} description={state.search ? 'Try another name or clear the search.' : 'Choose another workflow status to continue.'} onReset={() => { state.setSearch(''); state.setStatus('ALL') }} resetLabel="Clear search and filters" />
        : <>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200" aria-live="polite">{state.candidates.length} potential {state.candidates.length === 1 ? 'candidate' : 'candidates'}</p>
          <section className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#131e2e] md:block" aria-label="Potential candidate worklist">
            <table className="w-full table-fixed border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300"><tr><th scope="col" className="w-[27%] px-4 py-3">Student</th><th scope="col" className="w-[21%] px-4 py-3">Program</th><th scope="col" className="w-[22%] px-4 py-3">Portfolio score</th><th scope="col" className="w-[18%] px-4 py-3">Review status</th><th scope="col" className="w-[12%] px-4 py-3"><span className="sr-only">Action</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{state.candidates.map((candidate) => <tr key={candidate.id} tabIndex={0} onClick={() => onSelectStudent?.(candidate)} onKeyDown={(event) => keyboardActivate(event, () => onSelectStudent?.(candidate))} aria-label={`Review ${candidate.student_name || 'candidate'}`} className="cursor-pointer align-top hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 dark:hover:bg-slate-900/60"><th scope="row" className="px-4 py-4 font-semibold text-slate-900 dark:text-white"><span className="block truncate">{candidate.student_name || 'Name unavailable'}</span></th><td className="px-4 py-4 text-slate-600 dark:text-slate-300"><span className="block truncate">{candidate.program || 'Program unavailable'}</span></td><td className="px-4 py-4"><Score candidate={candidate} /></td><td className="px-4 py-4"><Status candidate={candidate} /></td><td className="px-4 py-3 text-right"><ReviewAction /></td></tr>)}</tbody></table>
          </section>
          <section className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800 md:hidden" aria-label="Potential candidate worklist">{state.candidates.map((candidate) => <article role="link" tabIndex={0} key={candidate.id} aria-label={`Review ${candidate.student_name || 'candidate'}`} onClick={() => onSelectStudent?.(candidate)} onKeyDown={(event) => keyboardActivate(event, () => onSelectStudent?.(candidate))} className="w-full cursor-pointer space-y-3 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><div><h3 className="font-semibold text-slate-900 dark:text-white">{candidate.student_name || 'Name unavailable'}</h3><p className="text-sm text-slate-500">{candidate.program || 'Program unavailable'}</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Score candidate={candidate} /><Status candidate={candidate} /></div><ReviewAction /></article>)}</section>
        </>}
    </div>
  </OSADAwardPageShell>
}
