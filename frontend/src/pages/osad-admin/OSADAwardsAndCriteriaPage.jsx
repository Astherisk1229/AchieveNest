import React from 'react'
import { FileText, Trophy } from 'lucide-react'
import AwardCatalogRow from '../../components/osad/AwardCatalogRow'
import AwardCatalogSkeleton from '../../components/osad/AwardCatalogSkeleton'
import AwardSearch from '../../components/osad/AwardSearch'
import OSADAwardPageShell from '../../components/osad/OSADAwardPageShell'
import { OSADEmptyState, OSADErrorState, OSADSearchEmptyState } from '../../components/osad/OSADStateBlock'
import useAwardCatalog from '../../hooks/useAwardCatalog'

export default function OSADAwardsAndCriteriaPage({ onSelectAward, onPreviewEvaluationSummary }) {
  const catalog = useAwardCatalog()

  return (
    <OSADAwardPageShell
      title="Awards & Criteria"
      description="Review the criteria used by AchieveNest to identify potential award candidates."
      icon={Trophy}
      actions={(
        <button
          type="button"
          onClick={onPreviewEvaluationSummary}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300 motion-reduce:transition-none"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Preview Evaluation Summary
        </button>
      )}
    >
      <section aria-labelledby="award-catalog-heading" className="space-y-4">
        <AwardSearch value={catalog.searchTerm} onChange={catalog.setSearchTerm} onClear={() => catalog.setSearchTerm('')} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div role="group" aria-label="Award eligibility filters" className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">All Awards</span>
          </div>
          {!catalog.loading && !catalog.error && (
            <p id="award-catalog-heading" className="text-sm font-medium tabular-nums text-slate-600 dark:text-slate-300">
              {catalog.awards.length} {catalog.awards.length === 1 ? 'award' : 'awards'}
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#131e2e]">
          {catalog.loading ? (
            <AwardCatalogSkeleton />
          ) : catalog.error ? (
            <div className="p-6">
              <OSADErrorState
                title="We couldn't load the awards."
                message="Your data hasn't been changed."
                onRetry={catalog.reload}
                retryLabel="Try again"
              />
            </div>
          ) : catalog.awards.length === 0 ? (
            <div className="p-6"><OSADEmptyState icon={Trophy} title="No awards are available" description="The catalog does not currently contain any visible awards." /></div>
          ) : catalog.filteredAwards.length === 0 ? (
            <div className="p-6">
              <OSADSearchEmptyState
                title={`No awards found for “${catalog.searchTerm.trim()}”.`}
                description="Try another award name or clear your search."
                onReset={() => catalog.setSearchTerm('')}
                resetLabel="Clear search"
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800" aria-label="Awards">
              {catalog.filteredAwards.map((award) => <AwardCatalogRow key={award.id} award={award} onOpen={onSelectAward} />)}
            </ul>
          )}
        </div>
      </section>
    </OSADAwardPageShell>
  )
}
