import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileArchive, FileSpreadsheet, FolderOpen, LoaderCircle, Plus, Search, Settings2, Trash2, Users, X } from 'lucide-react'
import {
  downloadNtfBlankTemplate, downloadNtfPrefilledSelection, downloadNtfPrefilledWorkbook,
  fetchNtfAnnualReviewSettings, saveNtfRatingScale, saveNtfSignatories,
  ntfWorkbookFilename, ntfZipFilename, supportsDirectoryPicker,
} from '../../services/ntfAnnualReviewService'

// The two school years an annual review covers for a ranking track's academic year (mirrors the backend rule).
export const ntfRequiredYears = academicYear => {
  const match = /^(\d{4})-(\d{4})$/.exec(String(academicYear || ''))
  if (!match) return []
  const start = Number(match[1])
  return [`${start - 2}-${start - 1}`, `${start - 1}-${start}`]
}

const errorText = (failure, fallback) => failure?.error?.message || failure?.message || fallback
const button = 'inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900'
const primary = 'inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50'
const input = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950'

const personOf = row => row?.personnel || row || {}
export const ntfOrganization = person => person?.college_name || person?.department_name || ''
export const ntfUnit = person => person?.college_name ? (person?.department_name || '') : ''
export const filterNtfPersonnel = (rows, filters) => rows.map(personOf).filter(person => {
  const query = String(filters.search || '').trim().toLocaleLowerCase()
  const haystack = [person.full_name, person.institutional_id, ntfOrganization(person), ntfUnit(person), person.position_title].filter(Boolean).join(' ').toLocaleLowerCase()
  return (!query || haystack.includes(query))
    && (!filters.organization || ntfOrganization(person) === filters.organization)
    && (!filters.unit || ntfUnit(person) === filters.unit)
    && (!filters.status || person.employment_status === filters.status)
})

const labelize = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
const unique = values => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))

export function NtfPrefilledDownloadDialog({ periodId, academicYear, personnel = [], onClose, returnFocusRef }) {
  const years = ntfRequiredYears(academicYear)
  const dialogRef = useRef(null)
  const initialFocusRef = useRef(null)
  const selectAllRef = useRef(null)
  const generatingRef = useRef(false)
  const [filters, setFilters] = useState({ search: '', organization: '', unit: '', status: '' })
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [saveMode, setSaveMode] = useState('browser')
  const [folderHandle, setFolderHandle] = useState(null)
  const [state, setState] = useState({ generating: false, error: '' })
  const people = useMemo(() => personnel.map(personOf), [personnel])
  const visible = useMemo(() => filterNtfPersonnel(people, filters), [people, filters])
  const selected = useMemo(() => people.filter(person => selectedIds.has(person.id)), [people, selectedIds])
  const organizations = useMemo(() => unique(people.map(ntfOrganization)), [people])
  const units = useMemo(() => unique(people.map(ntfUnit)), [people])
  const statuses = useMemo(() => unique(people.map(person => person.employment_status)), [people])
  const allVisibleSelected = visible.length > 0 && visible.every(person => selectedIds.has(person.id))
  const someVisibleSelected = visible.some(person => selectedIds.has(person.id)) && !allVisibleSelected
  const filtersActive = Object.values(filters).some(Boolean)
  const folderSupported = supportsDirectoryPicker()
  const resultFilename = selected.length === 1 ? ntfWorkbookFilename(selected[0], years) : ntfZipFilename(years)

  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected }, [someVisibleSelected])
  useEffect(() => { generatingRef.current = state.generating }, [state.generating])
  useEffect(() => {
    const dialog = dialogRef.current
    const returnTarget = returnFocusRef?.current
    const priorOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    initialFocusRef.current?.focus()
    const handleKey = event => {
      if (event.key === 'Escape' && !generatingRef.current) { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(element => element.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (document.activeElement === dialog) { event.preventDefault(); (event.shiftKey ? last : first).focus() }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = priorOverflow; document.removeEventListener('keydown', handleKey); returnTarget?.focus() }
  }, [onClose, returnFocusRef])

  const togglePerson = id => setSelectedIds(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const toggleVisible = () => setSelectedIds(current => {
    const next = new Set(current)
    if (allVisibleSelected) visible.forEach(person => next.delete(person.id))
    else visible.forEach(person => next.add(person.id))
    return next
  })
  const clearFilters = () => setFilters({ search: '', organization: '', unit: '', status: '' })
  const chooseFolder = async () => {
    if (!folderSupported || state.generating) return
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setFolderHandle(handle); setSaveMode('folder'); setState(current => ({ ...current, error: '' }))
    } catch (failure) {
      if (failure?.name !== 'AbortError') setState(current => ({ ...current, error: 'The folder could not be opened. Choose another folder or use your browser download location.' }))
    }
  }
  const download = async () => {
    if (!selected.length || state.generating) return
    setState({ generating: true, error: '' })
    try {
      await downloadNtfPrefilledSelection(periodId, selected, years, saveMode === 'folder' ? folderHandle : null)
      onClose()
    } catch (failure) {
      setState({ generating: false, error: errorText(failure, 'The selected workbooks could not be prepared. Review the selection and try again.') })
    }
  }
  const setFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }))
  const actionLabel = selected.length === 1 ? 'Download Workbook' : `Download ${selected.length || ''} Workbooks`.replace('  ', ' ')

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget && !state.generating) onClose() }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="ntf-prefilled-title" aria-describedby="ntf-prefilled-description" tabIndex={-1} className="flex max-h-[96vh] w-full max-w-[1380px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)] outline-none sm:max-h-[92vh] sm:rounded-2xl dark:bg-slate-950">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:gap-5 sm:px-6 dark:border-slate-800">
        <div className="min-w-0 flex-1"><h2 id="ntf-prefilled-title" className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Download Prefilled NTF Workbooks</h2><p id="ntf-prefilled-description" className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Select the non-teaching faculty personnel whose annual review workbooks you want to prepare.</p></div>
        <button type="button" onClick={onClose} disabled={state.generating} aria-label="Close download dialog" className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-40 dark:hover:bg-slate-900"><X className="h-5 w-5" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.8fr)]">
          <div className="min-w-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(250px,1.4fr)_1fr_1fr_0.8fr]">
              <label className="relative sm:col-span-2 xl:col-span-1"><span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Search personnel</span><Search className="absolute bottom-3 left-3 h-4 w-4 text-slate-400" /><input ref={initialFocusRef} value={filters.search} onChange={event => setFilter('search', event.target.value)} placeholder="Search by name or employee ID..." className={`${input} pl-9`} /></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">College / Office</span><select value={filters.organization} onChange={event => setFilter('organization', event.target.value)} className={input}><option value="">All organizations</option>{organizations.map(value => <option key={value}>{value}</option>)}</select></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Department / Unit</span><select value={filters.unit} onChange={event => setFilter('unit', event.target.value)} className={input}><option value="">All departments / units</option>{units.map(value => <option key={value}>{value}</option>)}</select></label>
              <label><span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Employment status</span><select value={filters.status} onChange={event => setFilter('status', event.target.value)} className={input}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{labelize(value)}</option>)}</select></label>
            </div>
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><p aria-live="polite"><strong className="text-slate-800 dark:text-slate-100">{visible.length}</strong> matching personnel · selections stay selected when filters change</p>{filtersActive && <button type="button" onClick={clearFilters} className="font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Clear Filters</button>}</div>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="max-h-[46vh] overflow-auto [scrollbar-color:rgb(148_163_184)_transparent]">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th className="w-14 px-2 py-1"><label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center"><input ref={selectAllRef} type="checkbox" checked={allVisibleSelected} disabled={!visible.length} onChange={toggleVisible} aria-label={`Select all ${visible.length} matching personnel`} className="h-4 w-4 rounded border-slate-300 accent-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600" /></label></th><th className="px-3 py-3">Employee ID</th><th className="px-3 py-3">Name</th><th className="px-3 py-3">College / Office</th><th className="px-3 py-3">Department / Unit</th><th className="px-3 py-3">Position / Specific Job</th><th className="px-3 py-3">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{visible.map(person => { const selectedRow = selectedIds.has(person.id); return <tr key={person.id} className={selectedRow ? 'bg-emerald-50/70 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'}><td className="px-2 py-1"><label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center"><input type="checkbox" checked={selectedRow} onChange={() => togglePerson(person.id)} aria-label={`Select ${person.full_name}`} className="h-4 w-4 rounded border-slate-300 accent-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600" /></label></td><td className="px-3 py-3 font-semibold tabular-nums text-slate-700 dark:text-slate-200">{person.institutional_id || 'Not recorded'}</td><td className="px-3 py-3 font-bold text-slate-950 dark:text-white">{person.full_name}</td><td className="px-3 py-3 text-slate-700 dark:text-slate-200">{ntfOrganization(person) || 'Not recorded'}</td><td className="px-3 py-3 text-slate-600 dark:text-slate-300">{ntfUnit(person) || '—'}</td><td className="px-3 py-3 text-slate-600 dark:text-slate-300">{person.position_title || 'Not recorded'}</td><td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{labelize(person.employment_status || 'Status pending')}</span></td></tr> })}</tbody>
                </table>
                {!visible.length && <div className="grid min-h-48 place-items-center px-6 text-center"><div><Users className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 font-bold text-slate-800 dark:text-slate-100">No personnel match these filters</p><p className="mt-1 text-sm text-slate-500">Clear a filter or try a different name or employee ID.</p></div></div>}
              </div>
            </div>
          </div>

          <aside className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
            <section className="border-b border-slate-200 p-4 dark:border-slate-800"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-slate-950 dark:text-white">Selected Personnel</h3><span className="inline-flex min-w-7 justify-center rounded-full bg-emerald-800 px-2 py-1 text-xs font-black text-white">{selected.length}</span></div>{selected.length ? <><ul className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgb(148_163_184)_transparent]">{selected.map(person => <li key={person.id} className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)] dark:bg-slate-950"><div className="min-w-0"><p className="text-xs font-bold tabular-nums text-emerald-800 dark:text-emerald-300">{person.institutional_id || 'Employee ID not recorded'}</p><p className="truncate text-sm font-black text-slate-950 dark:text-white">{person.full_name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{[ntfOrganization(person), ntfUnit(person)].filter(Boolean).join(' · ') || person.position_title || 'Assignment not recorded'}</p></div><button type="button" onClick={() => togglePerson(person.id)} aria-label={`Remove ${person.full_name} from selection`} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></li>)}</ul><button type="button" onClick={() => setSelectedIds(new Set())} className="mt-3 text-xs font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Clear Selection</button></> : <div className="py-8 text-center"><Users className="mx-auto h-6 w-6 text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No personnel selected yet.</p><p className="mt-1 text-xs leading-5 text-slate-500">Choose one or more personnel from the list.</p></div>}</section>
            <section className="border-b border-slate-200 p-4 dark:border-slate-800"><h3 className="font-black text-slate-950 dark:text-white">Workbook Details</h3><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-xs font-bold text-slate-500">Evaluation Period</dt><dd className="mt-0.5 font-bold">{years.length ? `SY ${years[0]} & SY ${years[1]}` : 'Period not available'}</dd></div><div><dt className="text-xs font-bold text-slate-500">Filename Format (Preview)</dt><dd className="mt-1 break-all rounded-md bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-200">{selected.length === 1 ? resultFilename : `NTF_AnnualReview_${years.length ? `SY${years[0].slice(0, 4)}-${years[1].slice(-4)}` : 'SYPeriod'}_[EmployeeID]_[LastName]_[FirstName].xlsx`}</dd></div></dl><p className="mt-3 text-xs leading-5 text-slate-500">Prefills available data from AchieveNest. HR will encode the detailed ratings (0–100) per item in the workbook.</p></section>
            <section className="p-4"><div className="flex items-center gap-2"><FileArchive className="h-4 w-4 text-emerald-800 dark:text-emerald-300" /><h3 className="font-black text-slate-950 dark:text-white">Download Summary</h3></div><p className="mt-3 text-sm font-bold">{selected.length} {selected.length === 1 ? 'workbook' : 'workbooks'} selected</p>{selected.length > 1 && <p className="mt-1 text-xs text-slate-500">Will be downloaded as a single .zip file</p>}{selected.length > 0 && <p className="mt-2 break-all text-xs font-semibold text-slate-600 dark:text-slate-300">{resultFilename}</p>}</section>
          </aside>
        </div>

        <section className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800" aria-labelledby="save-location-heading"><div className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-emerald-800 dark:text-emerald-300" /><h3 id="save-location-heading" className="font-black text-slate-950 dark:text-white">Save Location</h3></div><p className="mt-1 text-sm text-slate-500">Choose where the downloaded file will be saved on your device.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${saveMode === 'browser' ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'}`}><input type="radio" name="ntf-save-location" checked={saveMode === 'browser'} onChange={() => { setSaveMode('browser'); setFolderHandle(null) }} className="mt-1 accent-emerald-700" /><span><strong className="block text-sm">Browser download location</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500">Uses your browser’s default download folder.</span></span></label><label className={`flex gap-3 rounded-xl border p-3 ${!folderSupported ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'} ${saveMode === 'folder' ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'}`}><input type="radio" name="ntf-save-location" checked={saveMode === 'folder'} disabled={!folderSupported} onChange={chooseFolder} className="mt-1 accent-emerald-700" /><span><strong className="block text-sm">Choose folder</strong><span className="mt-0.5 block text-xs leading-5 text-slate-500">{folderSupported ? (folderHandle ? `Selected: ${folderHandle.name}` : 'Select a specific folder on your device. The choice is kept only while this dialog is open.') : 'Not available in this browser. Browser downloading remains available.'}</span></span></label></div></section>
        {state.error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{state.error}</p>}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs text-slate-500">Only the selected personnel will be included.</p><div className="flex gap-2"><button type="button" onClick={onClose} disabled={state.generating} className={button}>Cancel</button><button type="button" onClick={download} disabled={!selected.length || state.generating || (saveMode === 'folder' && !folderHandle)} className={primary}>{state.generating ? <><LoaderCircle className="h-4 w-4 animate-spin" />Preparing workbooks…</> : <><Download className="h-4 w-4" />{actionLabel}</>}</button></div></footer>
    </section>
  </div>
}

/** HR toolbar for the NTF annual-review workbook (downloads + template settings). */
export function NtfWorkbookPanel({ periodId, academicYear, locked, personnel = [] }) {
  const years = ntfRequiredYears(academicYear)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const downloadButtonRef = useRef(null)
  const run = async (key, action) => {
    setBusy(key); setError('')
    try { await action() } catch (failure) { setError(errorText(failure, 'The workbook could not be downloaded.')) } finally { setBusy('') }
  }
  return <section aria-labelledby="ntf-workbook-heading" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex max-w-2xl gap-3">
        <FileSpreadsheet aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800 dark:text-emerald-300"/>
        <div>
          <h2 id="ntf-workbook-heading" className="text-lg font-black text-slate-950 dark:text-white">NTF annual review workbook</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Download the Non-Teaching Faculty workbook{years.length ? ` for SY ${years[0]} & SY ${years[1]}` : ''}, enter a DS (0–100) for each Area A item per school year, then upload it here. AchieveNest recalculates the points and ratings, and the two-year averages become the locked Area A scores in the evaluation.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={Boolean(busy)} onClick={() => run('blank', () => downloadNtfBlankTemplate(periodId, years))}><Download className="h-4 w-4"/>{busy === 'blank' ? 'Preparing…' : 'Blank Template'}</button>
        <button ref={downloadButtonRef} type="button" className={button} disabled={Boolean(busy)} onClick={() => setDownloadOpen(true)}><Users className="h-4 w-4"/>Download Prefilled Workbooks</button>
        <button type="button" className={button} onClick={() => setSettingsOpen(true)}><Settings2 className="h-4 w-4"/>Template Settings</button>
      </div>
    </div>
    {locked && <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">This ranking track is closed. Templates can still be downloaded for reference.</p>}
    {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
    {downloadOpen && <NtfPrefilledDownloadDialog periodId={periodId} academicYear={academicYear} personnel={personnel} onClose={() => setDownloadOpen(false)} returnFocusRef={downloadButtonRef} />}
    {settingsOpen && <NtfTemplateSettingsDialog onClose={() => setSettingsOpen(false)}/>}
  </section>
}

export function NtfPrefilledButton({ periodId, academicYear, person }) {
  const [state, setState] = useState({ busy: false, error: '' })
  const run = async () => {
    setState({ busy: true, error: '' })
    try { await downloadNtfPrefilledWorkbook(periodId, person, ntfRequiredYears(academicYear)); setState({ busy: false, error: '' }) }
    catch (failure) { setState({ busy: false, error: errorText(failure, 'Download failed.') }) }
  }
  return <><button type="button" onClick={run} disabled={state.busy} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline disabled:opacity-50 dark:text-emerald-300"><Download className="h-3.5 w-3.5"/>{state.busy ? 'Preparing…' : 'Download Workbook'}</button>{state.error && <p role="alert" className="text-xs text-rose-700">{state.error}</p>}</>
}

/** Read-only Area A breakdown of an uploaded NTF workbook (values recalculated by the backend). */
export function NtfAreaABreakdown({ payload }) {
  if (!payload?.items?.length) return null
  const years = payload.school_years || []
  const fmt = value => value === null || value === undefined ? '—' : Number(value).toFixed(2)
  return <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
    <table className="w-full min-w-[520px] text-left text-xs">
      <thead className="bg-slate-50 font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300"><tr><th className="px-3 py-2">Area A item</th>{years.map(year => <th key={year} className="px-3 py-2 text-right">SY {year} DS → points</th>)}<th className="px-3 py-2 text-right">Average</th></tr></thead>
      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
        {payload.items.map(item => <tr key={item.code}><td className="px-3 py-2 font-semibold">{item.code} {item.name} <span className="font-normal text-slate-500">({Number(item.max_points)} pts)</span></td>{[0, 1].map(i => <td key={i} className="px-3 py-2 text-right tabular-nums">{fmt(item.ds?.[i])} → {fmt(item.points?.[i])}</td>)}<td className="px-3 py-2 text-right font-bold tabular-nums">{fmt(item.average_points)}</td></tr>)}
        <tr className="bg-emerald-50/60 font-bold dark:bg-emerald-950/20"><td className="px-3 py-2">Total of {Number(payload.area_max)} · %</td>{[0, 1].map(i => <td key={i} className="px-3 py-2 text-right tabular-nums">{fmt(payload.totals?.[i])} · {payload.percentages?.[i] === null || payload.percentages?.[i] === undefined ? '—' : `${Number(payload.percentages[i]).toFixed(2)}%`}</td>)}<td className="px-3 py-2 text-right tabular-nums">{fmt(payload.average_total)}</td></tr>
      </tbody>
    </table>
    <p className="px-3 py-2 text-[11px] text-slate-500">Rating scale version {payload.rating_scale?.version}{payload.rating_scale?.is_provisional ? ' (AchieveNest provisional scale)' : ''}. The averages become locked Area A scores when the portfolio is evaluated.</p>
  </div>
}

function Dialog({ title, onClose, children }) {
  useEffect(() => { const key = event => { if (event.key === 'Escape') onClose() }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key) }, [onClose])
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-3" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div><h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2><p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">Applies to every future NTF workbook download and upload. Each save creates a new version.</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5"/></button></header>
      <div className="overflow-y-auto px-5 py-5">{children}</div>
    </section>
  </div>
}

export function NtfTemplateSettingsDialog({ onClose }) {
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' })
  const [tab, setTab] = useState('scale')
  const load = async () => {
    try { setState({ phase: 'ready', data: await fetchNtfAnnualReviewSettings(), error: '' }) }
    catch (failure) { setState({ phase: 'error', data: null, error: errorText(failure, 'Settings could not be loaded.') }) }
  }
  useEffect(() => { load() }, [])
  return <Dialog title="NTF Template Settings" onClose={onClose}>
    <div role="tablist" className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-800">{[['scale', 'Rating Scale'], ['signatories', 'Signatories']].map(([key, label]) => <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => setTab(key)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold ${tab === key ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500'}`}>{label}</button>)}</div>
    {state.phase === 'loading' && <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/>}
    {state.phase === 'error' && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{state.error}</p>}
    {state.phase === 'ready' && tab === 'scale' && <RatingScaleForm setting={state.data.rating_scale} onSaved={load}/>}
    {state.phase === 'ready' && tab === 'signatories' && <SignatoriesForm setting={state.data.signatories} sources={state.data.signatory_sources || []} onSaved={load}/>}
  </Dialog>
}

function RatingScaleForm({ setting, onSaved }) {
  const [bands, setBands] = useState(() => (setting.value?.bands || []).map(band => ({ ...band })))
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState({ saving: false, error: '', saved: false })
  const update = (index, patch) => setBands(current => current.map((band, i) => i === index ? { ...band, ...patch } : band))
  const save = async () => {
    setStatus({ saving: true, error: '', saved: false })
    try { await saveNtfRatingScale({ bands: bands.map(band => ({ label: band.label, min_percent: Number(band.min_percent), passing: Boolean(band.passing) })), change_reason: reason }); setStatus({ saving: false, error: '', saved: true }); onSaved() }
    catch (failure) { setStatus({ saving: false, error: errorText(failure, 'The rating scale could not be saved.'), saved: false }) }
  }
  return <div className="space-y-4">
    <p className="text-sm text-slate-600 dark:text-slate-300">Percentage = Area A points ÷ Area A maximum × 100. A score gets the highest band whose minimum it reaches. This is an <strong>AchieveNest provisional scale</strong>, not an official HR policy. Current version: {setting.version}.</p>
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="w-full min-w-[520px] text-sm"><thead className="bg-slate-50 text-left text-xs font-bold text-slate-600 dark:bg-slate-900"><tr><th className="px-3 py-2">Performance rating</th><th className="px-3 py-2">Minimum %</th><th className="px-3 py-2">Counts as passing</th><th className="px-3 py-2"><span className="sr-only">Remove</span></th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">
      {bands.map((band, index) => <tr key={index}><td className="px-3 py-2"><input aria-label={`Band ${index + 1} label`} className={input} value={band.label} onChange={event => update(index, { label: event.target.value })}/></td><td className="px-3 py-2"><input aria-label={`Band ${index + 1} minimum percent`} className={`${input} w-28`} type="number" min="0" max="100" step="0.01" value={band.min_percent} onChange={event => update(index, { min_percent: event.target.value })}/></td><td className="px-3 py-2"><input aria-label={`Band ${index + 1} passing`} type="checkbox" className="h-4 w-4 accent-emerald-700" checked={Boolean(band.passing)} onChange={event => update(index, { passing: event.target.checked })}/></td><td className="px-3 py-2 text-right"><button type="button" aria-label={`Remove band ${band.label}`} disabled={bands.length <= 2} onClick={() => setBands(current => current.filter((_, i) => i !== index))} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"><Trash2 className="h-4 w-4"/></button></td></tr>)}
    </tbody></table></div>
    <button type="button" className={button} disabled={bands.length >= 10} onClick={() => setBands(current => [...current, { label: '', min_percent: 0, passing: false }])}><Plus className="h-4 w-4"/>Add Band</button>
    <label className="block text-sm font-bold">Reason for change (optional)<input className={`${input} mt-1.5 font-normal`} value={reason} onChange={event => setReason(event.target.value)} maxLength={500}/></label>
    {status.error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{status.error}</p>}
    {status.saved && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Saved as a new version. New uploads use it; confirmed workbooks keep the version they were rated with.</p>}
    <div className="flex justify-end"><button type="button" className={primary} disabled={status.saving} onClick={save}>{status.saving ? 'Saving…' : 'Save Rating Scale'}</button></div>
  </div>
}

function SignatoriesForm({ setting, sources, onSaved }) {
  const [value, setValue] = useState(() => ({ college: [...(setting.value?.college || [])], office: [...(setting.value?.office || [])] }))
  const [status, setStatus] = useState({ saving: false, error: '', saved: false })
  const update = (context, index, patch) => setValue(current => ({ ...current, [context]: current[context].map((line, i) => i === index ? { ...line, ...patch } : line) }))
  const save = async () => {
    setStatus({ saving: true, error: '', saved: false })
    try { await saveNtfSignatories(value); setStatus({ saving: false, error: '', saved: true }); onSaved() }
    catch (failure) { setStatus({ saving: false, error: errorText(failure, 'Signatories could not be saved.'), saved: false }) }
  }
  const section = (context, title, hint) => <section className="space-y-3">
    <div><h3 className="font-black text-slate-950 dark:text-white">{title}</h3><p className="text-xs text-slate-500">{hint}</p></div>
    {value[context].length === 0 && <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 dark:border-slate-700">No signature lines. Workbooks show blank signature lines.</p>}
    {value[context].map((line, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1.3fr_auto] dark:border-slate-800">
      <label className="text-xs font-bold">Line label (wording on your form)<input className={`${input} mt-1 font-normal`} value={line.label} placeholder="e.g. Rated by:" onChange={event => update(context, index, { label: event.target.value })}/></label>
      <label className="text-xs font-bold">Signed by<select className={`${input} mt-1 font-normal`} value={line.source} onChange={event => update(context, index, { source: event.target.value })}>{sources.map(source => <option key={source.value} value={source.value}>{source.label}</option>)}</select></label>
      <button type="button" aria-label="Remove signature line" onClick={() => setValue(current => ({ ...current, [context]: current[context].filter((_, i) => i !== index) }))} className="self-end rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Trash2 className="h-4 w-4"/></button>
      {line.source === 'custom' && <div className="grid gap-2 sm:col-span-3 sm:grid-cols-2"><label className="text-xs font-bold">Name<input className={`${input} mt-1 font-normal`} value={line.custom_name || ''} onChange={event => update(context, index, { custom_name: event.target.value })}/></label><label className="text-xs font-bold">Position<input className={`${input} mt-1 font-normal`} value={line.custom_position || ''} onChange={event => update(context, index, { custom_position: event.target.value })}/></label></div>}
    </div>)}
    <button type="button" className={button} disabled={value[context].length >= 6} onClick={() => setValue(current => ({ ...current, [context]: [...current[context], { label: '', source: sources[0]?.value || 'custom', custom_name: '', custom_position: '' }] }))}><Plus className="h-4 w-4"/>Add Signature Line</button>
  </section>
  return <div className="space-y-6">
    <p className="text-sm text-slate-600 dark:text-slate-300">No signatories are preset because the institution has not provided an official mapping. Add the lines your form needs. Dean and Department/Office head names are looked up from the current assignments when a workbook is generated. Version {setting.version}.</p>
    {section('college', 'College-assigned NTF personnel', 'Used when the employee is affiliated with a College.')}
    {section('office', 'Office/Unit-assigned NTF personnel', 'Used when the employee belongs to an administrative office or unit outside a College.')}
    {status.error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{status.error}</p>}
    {status.saved && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Saved. New workbook downloads use these signature lines.</p>}
    <div className="flex justify-end"><button type="button" className={primary} disabled={status.saving} onClick={save}>{status.saving ? 'Saving…' : 'Save Signatories'}</button></div>
  </div>
}
