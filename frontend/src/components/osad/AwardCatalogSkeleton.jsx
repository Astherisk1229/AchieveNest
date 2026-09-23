import React from 'react'

export default function AwardCatalogSkeleton() {
  return (
    <div role="status" aria-label="Loading award catalog" className="divide-y divide-slate-100 dark:divide-slate-800">
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="grid animate-pulse gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <div className="h-4 w-56 max-w-full rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-40 max-w-full rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-72 max-w-full rounded bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="h-6 w-24 rounded-md bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
      <span className="sr-only">Loading awards</span>
    </div>
  )
}
