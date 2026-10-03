import React from 'react'

export default function AwardCriteriaOverview({ criteria }) {
  return (
    <section aria-labelledby="scoring-overview-heading">
      <h2 id="scoring-overview-heading" className="text-lg font-semibold text-slate-950 dark:text-white">How the score is calculated</h2>
      <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {criteria.map((criterion, index) => (
          <div key={criterion.id || index} className="py-3">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{String.fromCharCode(65 + index)}. {criterion.name}</p>
              <p className="shrink-0 text-sm tabular-nums font-semibold text-slate-700 dark:text-slate-200">{criterion.maxPoints === null ? 'Maximum unavailable' : `${criterion.maxPoints} pts`}</p>
            </div>
            {criterion.componentModels.length > 0 && (
              <ul className="mt-2 space-y-1 pl-5">
                {criterion.componentModels.map((component, componentIndex) => (
                  <li key={component.id || componentIndex} className="flex items-baseline justify-between gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <span>{component.name}</span>
                    <span className="shrink-0 tabular-nums">{component.maxPoints === null ? 'Maximum unavailable' : `${component.maxPoints} pts`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
