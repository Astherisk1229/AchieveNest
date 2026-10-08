import React, { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function AcademicProgramMultiSelect({ programs, selectedIds, onSelect, disabled, error }) {
  const [search, setSearch] = useState('')
  const selectedPrograms = programs.filter(program => selectedIds.includes(program.id))
  const normalizedSearch = search.trim().toLowerCase()
  const filteredPrograms = programs.filter(program =>
    `${program.code || ''} ${program.name || ''}`.toLowerCase().includes(normalizedSearch)
  )
  const summary = selectedPrograms.length
    ? `${selectedPrograms.slice(0, 2).map(program => program.code || program.name).join(', ')}${selectedPrograms.length > 2 ? ` +${selectedPrograms.length - 2} more` : ''}`
    : 'Select academic programs'

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic Program Affiliations</legend>
      <details className="group relative" data-disabled={disabled ? 'true' : undefined}>
        <summary
          aria-disabled={disabled}
          onClick={event => { if (disabled) event.preventDefault() }}
          className={`flex min-h-11 w-full list-none items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-medium dark:border-slate-800 dark:bg-slate-900 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <span className={selectedPrograms.length ? 'truncate text-slate-800 dark:text-slate-200' : 'truncate text-slate-400 italic'}>{summary}</span>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
        </summary>
        <div className="absolute z-20 mt-1 max-h-52 w-full space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => event.stopPropagation()}
            placeholder="Search programs"
            aria-label="Search academic programs"
            className="sticky top-0 z-10 mb-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
          />
          {filteredPrograms.length ? filteredPrograms.map(program => (
            <button
              key={program.id}
              type="button"
              aria-pressed={selectedIds.includes(program.id)}
              onClick={() => onSelect(program.id)}
              className={`flex w-full items-start justify-between gap-3 rounded-lg p-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 ${selectedIds.includes(program.id) ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}
            >
              <span>{program.code ? `${program.code} — ` : ''}{program.name}</span>
              {selectedIds.includes(program.id) && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />}
            </button>
          )) : (
            <p className="p-2 text-xs italic text-slate-400">{programs.length ? 'No matching programs.' : 'No programs found for selected college.'}</p>
          )}
        </div>
      </details>
      {error && <span className="block text-xs font-semibold text-rose-600">{error}</span>}
    </fieldset>
  )
}
