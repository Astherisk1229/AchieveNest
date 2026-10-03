import React from 'react'
import { Search, X } from 'lucide-react'

export default function AwardSearch({ value, onChange, onClear }) {
  return (
    <label className="relative block w-full sm:max-w-md">
      <span className="sr-only">Search awards by name</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search awards by name..."
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Clear award search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </label>
  )
}
