import React from 'react'

export default function HumanOnlyCriteria({ criteria }) {
  if (criteria.length === 0) return null
  return (
    <section aria-labelledby="human-criteria-heading">
      <h2 id="human-criteria-heading" className="text-lg font-semibold text-slate-950 dark:text-white">Human-evaluated criteria</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">These criteria remain outside automatic portfolio scoring.</p>
      <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {criteria.map((criterion) => (
          <article key={criterion.id} className="flex items-baseline justify-between gap-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{criterion.name}</h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Evaluated during the official OSAD review process.</p>
            </div>
            {criterion.maxPoints !== null && <span className="shrink-0 text-sm tabular-nums font-semibold text-slate-700 dark:text-slate-200">{criterion.maxPoints} pts max</span>}
          </article>
        ))}
      </div>
    </section>
  )
}
