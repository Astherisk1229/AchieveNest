import React from 'react'

const displayNumber = (value) => Number.isInteger(value) ? String(value) : String(value)
const purposeLabel = (purpose) => purpose === 'FULL_EVALUATION' ? 'Full evaluation' : purpose === 'POTENTIAL_CANDIDATE_DISCOVERY' ? 'Portfolio candidate discovery' : 'Qualification threshold'

function Metric({ label, value, unavailable = 'Unavailable' }) {
  return (
    <div className="min-w-0 py-3 sm:px-4 sm:first:pl-0">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`mt-1 text-base font-semibold tabular-nums ${value === null ? 'text-slate-500 dark:text-slate-400' : 'text-slate-950 dark:text-white'}`}>{value ?? unavailable}</dd>
    </div>
  )
}

export default function AwardQualificationSummary({ model, detailed = false }) {
  const { required, threshold, maximum } = model.qualification
  const requiredText = required !== null && maximum !== null ? `${displayNumber(required)} / ${displayNumber(maximum)}` : null

  return (
    <section aria-labelledby={detailed ? 'qualification-heading' : 'qualification-summary-heading'}>
      <h2 id={detailed ? 'qualification-heading' : 'qualification-summary-heading'} className="text-lg font-semibold text-slate-950 dark:text-white">
        {detailed ? 'Qualification Threshold' : 'Qualification Summary'}
      </h2>
      {model.authorityPending && <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">Candidate generation is pending authority approval.</p>}
      <dl className="mt-3 grid divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800">
        <Metric label="Required Score" value={requiredText} />
        <Metric label="Qualification Threshold" value={threshold === null ? null : `${displayNumber(threshold)}%`} />
        <Metric label="Maximum Portfolio Score" value={maximum === null ? null : `${displayNumber(maximum)} pts`} />
      </dl>
      {detailed && model.thresholds.length > 1 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {model.thresholds.map((item) => (
            <div key={item.purpose} className="border-t border-slate-200 pt-3 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{purposeLabel(item.purpose)}</p>
              <p className="mt-1 font-semibold tabular-nums text-slate-950 dark:text-white">{displayNumber(item.value)}%</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
