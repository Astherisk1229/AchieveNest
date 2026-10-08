import React, { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function DepartmentSelect({ departments = [], value = '', onChange, disabled = false, error, label = 'Department' }) {
  const [search, setSearch] = useState('')
  const selected = departments.find(item => String(item.id) === String(value))
  const query = search.trim().toLowerCase()
  const filtered = departments.filter(item => `${item.code || ''} ${item.name || ''}`.toLowerCase().includes(query))
  return <fieldset className="space-y-1.5">
    <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</legend>
    <details className="group relative">
      <summary aria-disabled={disabled} onClick={event => { if (disabled) event.preventDefault() }} className={`flex min-h-11 w-full list-none items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-medium dark:border-slate-800 dark:bg-slate-900 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
        <span className={selected ? 'truncate text-slate-800 dark:text-slate-200' : 'truncate text-slate-400 italic'}>{selected ? `${selected.code ? `${selected.code} — ` : ''}${selected.name}` : disabled ? 'Select a College first' : 'Select a Department'}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
      </summary>
      <div className="absolute z-20 mt-1 max-h-60 w-full space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.stopPropagation()} placeholder="Search departments" aria-label="Search departments" className="sticky top-0 z-10 mb-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900" />
        {filtered.length ? filtered.map(item => <button key={item.id} type="button" aria-pressed={String(value) === String(item.id)} onClick={event => { onChange(item.id); setSearch(''); event.currentTarget.closest('details')?.removeAttribute('open') }} className={`flex w-full items-start justify-between gap-3 rounded-lg p-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 ${String(value) === String(item.id) ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''}`}>
          <span>{item.code ? `${item.code} — ` : ''}{item.name}</span>{String(value) === String(item.id) && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />}
        </button>) : <p className="p-2 text-xs italic text-slate-400">{departments.length ? 'No matching departments.' : 'No departments available for this assignment.'}</p>}
      </div>
    </details>
    {error && <span className="block text-xs font-semibold text-rose-600">{error}</span>}
  </fieldset>
}
