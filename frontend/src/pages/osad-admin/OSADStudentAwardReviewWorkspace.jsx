import React, { useCallback, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, FileSearch, Info, UserRound } from 'lucide-react'
import AwardEvidenceDrawer from '../../components/osad/AwardEvidenceDrawer'
import OSADAwardAuthorityBadge from '../../components/osad/OSADAwardAuthorityBadge'
import OSADAwardPageShell from '../../components/osad/OSADAwardPageShell'
import { OSADEmptyState, OSADErrorState } from '../../components/osad/OSADStateBlock'
import useAwardCandidateReview from '../../hooks/useAwardCandidateReview'

function ReviewSkeleton() {
  return <div role="status" aria-label="Loading candidate review" className="mx-auto max-w-5xl animate-pulse space-y-7 motion-reduce:animate-none"><div className="space-y-3"><div className="h-7 w-64 max-w-full rounded bg-slate-200 dark:bg-slate-800" /><div className="h-4 w-40 max-w-full rounded bg-slate-100 dark:bg-slate-800" /></div><div className="grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-3 dark:border-slate-800">{[1, 2, 3].map((item) => <div key={item} className="h-16 rounded bg-slate-100 dark:bg-slate-800" />)}</div><div className="space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-20 rounded bg-slate-100 dark:bg-slate-800" />)}</div></div>
}

function Warning({ warning }) {
  return <p className="mt-2 flex max-w-2xl items-start gap-2 text-sm text-amber-800 dark:text-amber-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{warning.message || 'This criterion requires scoring attention.'}</span></p>
}

export default function OSADStudentAwardReviewWorkspace({ award, awardId, studentId, onBack }) {
  const state = useAwardCandidateReview({ award, awardId, studentId })
  const [selectedCriterion, setSelectedCriterion] = useState(null)
  const evidenceTriggerRef = useRef(null)
  const closeDrawer = useCallback(() => setSelectedCriterion(null), [])

  if (state.authorityPending) return <OSADEmptyState title="Candidate review unavailable" description="This award's criteria are pending authority approval." />
  if (state.loading) return <ReviewSkeleton />
  if (state.error || !state.model) return <OSADErrorState title="We couldn't load this candidate review." message="Your data hasn't been changed." onRetry={state.reload} retryLabel="Try again" />

  const model = state.model
  const score = model.score
  const presentation = model.scorePresentation()
  const pageWarnings = Array.isArray(score.scoring_warnings) ? score.scoring_warnings : []

  return <OSADAwardPageShell title={model.student.full_name || 'Candidate review'} description={model.student.program || 'Program unavailable'} icon={UserRound}
    badge={<OSADAwardAuthorityBadge value={model.award.authority_status} />}
    breadcrumbs={[{ label: 'Potential Candidates', onClick: onBack }, { label: model.student.full_name || 'Candidate review' }]}>
    <div className="mx-auto max-w-5xl space-y-8">
      <section aria-labelledby="score-summary-heading" className="border-y border-slate-200 py-5 dark:border-slate-800">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 id="score-summary-heading" className="text-sm font-semibold text-slate-600 dark:text-slate-300">Portfolio Potential Score</h2><p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">{presentation.rawAvailable ? `${score.raw_portfolio_score} / ${score.computable_max_score}` : 'Score unavailable'}</p><p className="mt-1 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">{presentation.potentialAvailable ? `${score.portfolio_potential_score}%` : 'Potential score unavailable'}</p></div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3 sm:gap-x-8"><div><dt className="text-slate-500">Required Score</dt><dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{presentation.requiredAvailable ? `${score.raw_qualifying_score} / ${score.computable_max_score}` : 'Unavailable'}</dd></div><div><dt className="text-slate-500">Qualification Threshold</dt><dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{presentation.thresholdAvailable ? `${score.candidate_threshold_percent}%` : 'Unavailable'}</dd></div><div><dt className="text-slate-500">Review status</dt><dd className="font-semibold text-slate-900 dark:text-white">{model.reviewStatusLabel}</dd></div></dl>
        </div>
        {pageWarnings.map((warning, index) => <Warning key={warning.code || index} warning={warning} />)}
      </section>

      <section aria-labelledby="qualification-heading"><div className="mb-3"><h2 id="qualification-heading" className="text-lg font-semibold text-slate-950 dark:text-white">Why this student qualified</h2><p className="mt-1 text-sm text-slate-500">Server-authoritative contributions from verified portfolio evidence.</p></div>
        {model.criteria.length === 0 ? <p className="border-y border-slate-200 py-6 text-sm text-slate-500 dark:border-slate-800">Scoring breakdown unavailable.</p>
          : <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{model.criteria.map((criterion) => <article key={criterion.criterion_id} className="py-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="font-semibold text-slate-900 dark:text-white">{criterion.criterion_name || 'Criterion name unavailable'}</h3>{criterion.verified_record_count !== null && criterion.verified_record_count !== undefined && <p className="mt-1 text-sm text-slate-500">{criterion.verified_record_count} verified {criterion.verified_record_count === 1 ? 'record' : 'records'}</p>}{criterion.calculation_text && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{criterion.calculation_text}</p>}</div><p className="shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">{criterion.achievedPointsAvailable && criterion.maxPointsAvailable ? `${criterion.achieved_points} / ${criterion.max_points}` : 'Points unavailable'}</p></div>{criterion.warnings.map((warning, index) => <Warning key={warning.code || index} warning={warning} />)}<button type="button" onClick={(event) => { evidenceTriggerRef.current = event.currentTarget; setSelectedCriterion(criterion) }} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950">View records <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></article>)}</div>}
      </section>

      <section aria-labelledby="human-heading"><h2 id="human-heading" className="text-lg font-semibold text-slate-950 dark:text-white">Human-evaluated criteria</h2><p className="mt-1 text-sm text-slate-500">These criteria remain outside the automatic portfolio calculation.</p>{model.humanOnlyCriteria.length === 0 ? <p className="mt-4 text-sm text-slate-500">No human-evaluated criteria were returned for this award.</p> : <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{model.humanOnlyCriteria.map((criterion, index) => <li key={criterion.criterion_id || index} className="flex items-start gap-3 py-4"><FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" /><div><h3 className="font-semibold text-slate-900 dark:text-white">{criterion.name || 'Criterion name unavailable'}</h3><p className="mt-1 text-sm text-slate-500">{criterion.source_note || 'Evaluated during the official OSAD review process.'}</p></div></li>)}</ul>}</section>

      <section aria-labelledby="about-score-heading" className="flex gap-3 rounded-xl bg-slate-50 p-5 dark:bg-slate-900"><Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" /><div><h2 id="about-score-heading" className="font-semibold text-slate-900 dark:text-white">About this score</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">The Portfolio Potential Score identifies potential candidates from verified portfolio evidence. It is not the final OSAD award score. Human-evaluated criteria remain outside the automatic portfolio calculation.</p></div></section>
    </div>
    <AwardEvidenceDrawer criterion={selectedCriterion} open={selectedCriterion !== null} onClose={closeDrawer} returnFocusRef={evidenceTriggerRef} />
  </OSADAwardPageShell>
}
