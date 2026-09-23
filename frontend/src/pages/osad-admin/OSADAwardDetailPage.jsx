import React, { useMemo } from 'react'
import { ClipboardList, Info, Users } from 'lucide-react'
import OSADAwardAuthorityBadge from '../../components/osad/OSADAwardAuthorityBadge'
import OSADAwardPageShell from '../../components/osad/OSADAwardPageShell'
import { OSADEmptyState } from '../../components/osad/OSADStateBlock'
import AwardCriteriaOverview from '../../components/osad/criteria/AwardCriteriaOverview'
import AwardQualificationSummary from '../../components/osad/criteria/AwardQualificationSummary'
import CriterionRenderer from '../../components/osad/criteria/CriterionRenderer'
import HumanOnlyCriteria from '../../components/osad/criteria/HumanOnlyCriteria'
import AwardCriteriaModel from '../../models/AwardCriteriaModel'

export default function OSADAwardDetailPage({ award, onCatalog, onOpenEvaluationPool, onOpenCandidates }) {
  const model = useMemo(() => new AwardCriteriaModel(award), [award])

  return (
    <OSADAwardPageShell
      title={award?.name || 'Award detail'}
      description={award?.description || undefined}
      icon={ClipboardList}
      badge={<OSADAwardAuthorityBadge value={award?.authority_status} />}
      breadcrumbs={[
        { label: 'Awards & Criteria', onClick: onCatalog },
        { label: award?.name || 'Award' }
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onOpenEvaluationPool} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Students for evaluation
          </button>
          <button
            type="button"
            onClick={onOpenCandidates}
            disabled={model.authorityPending}
            title={model.authorityPending ? 'Candidate generation is pending authority approval.' : undefined}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
          >
            Potential candidates
          </button>
        </div>
      }
    >
      {model.authorityPending && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200" aria-label="Authority notice">
          This rubric is marked Proposed. Candidate generation remains unavailable until OSAD authority is confirmed.
        </section>
      )}

      <div className="mx-auto w-full max-w-5xl space-y-9 rounded-xl border border-slate-200 bg-white px-5 py-6 sm:px-8 sm:py-8 dark:border-slate-800 dark:bg-[#131e2e]">
        <AwardQualificationSummary model={model} />

        {model.criteria.length === 0 ? (
          <OSADEmptyState icon={ClipboardList} title="Criteria unavailable" description="The server did not provide a criteria structure for this award." />
        ) : (
          <>
            {model.computableCriteria.length > 0 && <AwardCriteriaOverview criteria={model.computableCriteria} />}

            {model.computableCriteria.length > 0 && (
              <section aria-labelledby="criteria-heading">
                <h2 id="criteria-heading" className="text-lg font-semibold text-slate-950 dark:text-white">Potential Candidate Criteria</h2>
                <div className="mt-3">
                  {model.renderableCriteria.map((criterion) => <CriterionRenderer key={criterion.id} criterion={criterion} />)}
                </div>
              </section>
            )}

            <HumanOnlyCriteria criteria={model.humanCriteria} />
            <AwardQualificationSummary model={model} detailed />
          </>
        )}

        <section className="border-t border-slate-200 pt-5 dark:border-slate-800" aria-labelledby="about-score-heading">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <div>
              <h2 id="about-score-heading" className="text-sm font-semibold text-slate-900 dark:text-white">About this score</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">This portfolio score is used to identify potential candidates. It is not the final OSAD award score.</p>
              {model.humanCriteria.length > 0 && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Human-evaluated criteria remain outside automatic scoring.</p>}
            </div>
          </div>
        </section>

        {model.metadata.length > 0 && (
          <details className="group border-t border-slate-200 pt-5 dark:border-slate-800">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-100">
              About this criteria
              <span className="text-xs font-normal text-slate-500 group-open:hidden">Show details</span>
              <span className="hidden text-xs font-normal text-slate-500 group-open:inline">Hide details</span>
            </summary>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {model.metadata.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{String(value).replaceAll('_', ' ')}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>

      <section className="mx-auto flex max-w-5xl items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
        <p>No score, threshold, criterion type, or point value is calculated or inferred by this page.</p>
      </section>
    </OSADAwardPageShell>
  )
}
