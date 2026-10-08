import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, CircleDashed, FileText, Square, SquareCheckBig } from 'lucide-react'
import portfolioService from '../../../services/portfolioConfigurationService'
import { createRankingCycle } from '../../../services/personnelEvaluationPeriodService'
import RankingCycleDialog, { LockedBadge, buttonStyles, errorMessage, inputClass } from './RankingCycleDialog'
import CriteriaPreviewDialog from './CriteriaPreviewDialog'
import {
  GROUPS, GROUP_LABELS, academicYearOptions, activeCriteriaSummary, conflictingGroups,
  coverageLabel, criteriaLabel, formatRange, generatedCycleName, localToday, validateCycleDraft,
} from './rankingCyclePresentation'

const initialYear = () => { const now = new Date(); const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1; return `${start}-${start + 1}` }
// Default to the current academic year, or the next one that is still free for both groups.
const firstOpenYear = cycles => {
  const [start] = initialYear().split('-').map(Number)
  for (let year = start; year < start + 4; year += 1) {
    const candidate = `${year}-${year + 1}`
    if (conflictingGroups(cycles, candidate).size === 0) return candidate
  }
  return initialYear()
}
const blank = cycles => ({ academic_year: firstOpenYear(cycles), groups: [...GROUPS], submission_open_at: '', submission_close_at: '', evaluation_start_at: '', evaluation_end_at: '' })
const coverageValue = groups => groups.length === 2 ? 'BOTH' : groups[0] || ''

/** Loads the active, approved criteria version for each personnel group (the version the backend will bind). */
export function useActiveCriteria(groups) {
  const [criteria, setCriteria] = useState({})
  const requested = useRef(new Set())
  useEffect(() => {
    for (const group of groups) {
      if (requested.current.has(group)) continue
      requested.current.add(group)
      setCriteria(current => ({ ...current, [group]: { phase: 'loading' } }))
      portfolioService.fetchActiveRankingCriteria(group)
        .then(payload => {
          const summary = activeCriteriaSummary(payload)
          setCriteria(current => ({ ...current, [group]: summary ? { phase: 'ready', ...summary } : { phase: 'error', message: `No active criteria is configured for ${GROUP_LABELS[group]}.` } }))
        })
        .catch(failure => setCriteria(current => ({ ...current, [group]: { phase: 'error', message: errorMessage(failure, `No active criteria is configured for ${GROUP_LABELS[group]}.`) } })))
    }
  }, [groups])
  return criteria
}

function Field({ label, error, children, id }) {
  return <div><label htmlFor={id} className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</label><div className="mt-1.5">{children}</div>{error && <p className="mt-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>}</div>
}

export function DateRange({ idPrefix, start, end, onStart, onEnd, disabled = false, label }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2" role="group" aria-label={label}>
    <input id={`${idPrefix}-start`} aria-label={`${label} start date`} type="date" value={start} onChange={event => onStart(event.target.value)} disabled={disabled} className={`${inputClass} tabular-nums`}/>
    <ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-400"/>
    <input id={`${idPrefix}-end`} aria-label={`${label} end date`} type="date" value={end} min={start || undefined} onChange={event => onEnd(event.target.value)} disabled={disabled} className={`${inputClass} tabular-nums`}/>
  </div>
}

export function CoverageToggle({ groups, onChange, blocked = new Set(), disabledGroups = new Set() }) {
  const toggle = group => onChange(groups.includes(group) ? groups.filter(item => item !== group) : GROUPS.filter(item => item === group || groups.includes(item)))
  return <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Personnel coverage">
    {GROUPS.map(group => {
      const checked = groups.includes(group)
      const locked = disabledGroups.has(group)
      const Icon = checked ? SquareCheckBig : Square
      return <button key={group} type="button" role="checkbox" aria-checked={checked} disabled={locked} onClick={() => toggle(group)} className={`flex min-h-12 items-center gap-2.5 rounded-lg border px-3 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${checked ? 'border-emerald-700 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'}`}>
        <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${checked ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}/>
        <span className="min-w-0 flex-1">{GROUP_LABELS[group]}{blocked.has(group) && <span className="block text-xs font-semibold text-rose-700 dark:text-rose-300">Already has a cycle this year</span>}</span>
      </button>
    })}
  </div>
}

export function CriteriaRows({ groups, criteria, onView }) {
  if (!groups.length) return <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 dark:border-slate-700">Select personnel coverage to see the applicable criteria.</p>
  return <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
    {groups.map(group => {
      const entry = criteria[group] || { phase: 'loading' }
      return <li key={group} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm">
        <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400"/>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-slate-500">{GROUP_LABELS[group]}</span>
          {entry.phase === 'loading' && <span className="text-slate-500">Loading criteria…</span>}
          {entry.phase === 'error' && <span className="font-semibold text-rose-700 dark:text-rose-300">{entry.message}</span>}
          {entry.phase === 'ready' && <span className="font-semibold text-slate-900 dark:text-slate-100">{criteriaLabel(entry)}</span>}
        </span>
        {entry.phase === 'ready' && <><button type="button" onClick={() => onView(entry.version_id)} className={buttonStyles.link}>View Criteria</button><LockedBadge/></>}
      </li>
    })}
  </ul>
}

function PreviewRow({ label, value, missing }) {
  return <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-1.5 text-sm"><dt className="text-slate-500 dark:text-slate-400">{label}</dt><dd className={missing ? 'font-semibold text-amber-800 dark:text-amber-200' : 'font-semibold text-slate-900 dark:text-slate-100'}>{value}</dd></div>
}

export default function NewRankingCycleDialog({ cycles, onClose, onCreated }) {
  const [form, setForm] = useState(() => blank(cycles))
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [viewing, setViewing] = useState(null)
  const requestKey = useRef(crypto.randomUUID())
  const criteria = useActiveCriteria(GROUPS)

  const conflicts = useMemo(() => conflictingGroups(cycles, form.academic_year), [cycles, form.academic_year])
  const draft = { ...form, coverage: coverageValue(form.groups) }
  const { errors, ready } = validateCycleDraft(draft, { criteria, conflicts, today: localToday() })
  const years = useMemo(() => academicYearOptions(new Date(), (cycles || []).map(cycle => cycle.academic_year)), [cycles])
  const name = generatedCycleName(form.academic_year, form.groups)
  const set = patch => { setForm(current => ({ ...current, ...patch })); setServerError(''); requestKey.current = crypto.randomUUID() }

  const submit = async event => {
    event.preventDefault()
    setTouched(true)
    if (!ready || saving) return
    setSaving(true)
    setServerError('')
    try {
      const result = await createRankingCycle({
        academic_year: form.academic_year,
        personnel_coverage: draft.coverage,
        submission_open_at: form.submission_open_at,
        submission_close_at: form.submission_close_at,
        evaluation_start_at: form.evaluation_start_at,
        evaluation_end_at: form.evaluation_end_at,
      }, requestKey.current)
      onCreated(result?.cycle || result)
    } catch (failure) {
      setServerError(errorMessage(failure, 'The ranking period could not be created.'))
      setSaving(false)
    }
  }

  const shown = key => (touched || key === 'coverage') ? errors[key] : undefined
  const statusReady = ready && !serverError
  const missing = [!form.groups.length && 'personnel coverage', (!form.submission_open_at || !form.submission_close_at) && 'submission period', (!form.evaluation_start_at || !form.evaluation_end_at) && 'evaluation period'].filter(Boolean)

  return <>
    <RankingCycleDialog width="max-w-5xl" title="New Ranking Period" description="Configure the details for the new ranking period." onClose={() => !saving && onClose()} footer={<>
      <button type="button" onClick={onClose} disabled={saving} className={buttonStyles.secondary}>Cancel</button>
      <button type="submit" form="new-ranking-cycle" disabled={!ready || saving} className={buttonStyles.primary}>{saving ? 'Creating…' : 'Create Ranking Period'}</button>
    </>}>
      <form id="new-ranking-cycle" onSubmit={submit} noValidate className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-5">
          <Field id="cycle-academic-year" label="Academic Year" error={shown('academic_year')}>
            <select id="cycle-academic-year" data-autofocus value={form.academic_year} onChange={event => set({ academic_year: event.target.value })} className={inputClass}>
              {years.map(year => <option key={year} value={year}>{year.replace('-', '–')}</option>)}
            </select>
          </Field>
          <Field label="Personnel Coverage" error={shown('coverage')}>
            <CoverageToggle groups={form.groups} blocked={conflicts} onChange={groups => set({ groups })}/>
          </Field>
          <div className="grid gap-5">
            <Field label="Submission Period" error={shown('submission')}><DateRange idPrefix="submission" label="Submission period" start={form.submission_open_at} end={form.submission_close_at} onStart={value => set({ submission_open_at: value })} onEnd={value => set({ submission_close_at: value })}/></Field>
            <Field label="Evaluation Period" error={shown('evaluation')}><DateRange idPrefix="evaluation" label="Evaluation period" start={form.evaluation_start_at} end={form.evaluation_end_at} onStart={value => set({ evaluation_start_at: value })} onEnd={value => set({ evaluation_end_at: value })}/></Field>
          </div>
          <Field label="Criteria"><CriteriaRows groups={form.groups} criteria={criteria} onView={setViewing}/></Field>
          {serverError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{serverError}</p>}
        </div>

        <aside aria-label="Period preview" className="h-fit rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200">Period Preview</h3>
          <div className="mt-3 flex items-start gap-2.5 border-b border-emerald-200/70 pb-3 dark:border-emerald-900">
            <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800 dark:text-emerald-300"/>
            <div><p className="font-black text-slate-950 dark:text-white" data-testid="generated-cycle-name">{name}</p><p className="text-xs text-slate-600 dark:text-slate-400">This is how the period will appear.</p></div>
          </div>
          <dl className="mt-2">
            <PreviewRow label="Academic Year" value={form.academic_year ? form.academic_year.replace('-', '–') : 'Not set'} missing={!form.academic_year}/>
            <PreviewRow label="Coverage" value={coverageLabel(form.groups)} missing={!form.groups.length}/>
            <PreviewRow label="Submission Period" value={form.submission_open_at && form.submission_close_at ? formatRange(form.submission_open_at, form.submission_close_at) : 'Not set'} missing={!form.submission_open_at || !form.submission_close_at}/>
            <PreviewRow label="Evaluation Period" value={form.evaluation_start_at && form.evaluation_end_at ? formatRange(form.evaluation_start_at, form.evaluation_end_at) : 'Not set'} missing={!form.evaluation_start_at || !form.evaluation_end_at}/>
            {form.groups.includes('FACULTY') && <PreviewRow label="Teaching Faculty Criteria" value={criteria.FACULTY?.phase === 'ready' ? criteriaLabel(criteria.FACULTY) : 'Not set'} missing={criteria.FACULTY?.phase !== 'ready'}/>}
            {form.groups.includes('NON_TEACHING_FACULTY') && <PreviewRow label="NTF Criteria" value={criteria.NON_TEACHING_FACULTY?.phase === 'ready' ? criteriaLabel(criteria.NON_TEACHING_FACULTY) : 'Not set'} missing={criteria.NON_TEACHING_FACULTY?.phase !== 'ready'}/>}
            <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-1.5 text-sm"><dt className="text-slate-500 dark:text-slate-400">Status</dt><dd className={`flex items-start gap-1.5 font-semibold ${statusReady ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`} data-testid="cycle-readiness">
              {statusReady ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0"/> : <CircleDashed aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0"/>}
              <span>{statusReady ? 'Ready to Create' : errors.coverage && form.groups.length ? errors.coverage : missing.length ? `Needs ${missing.join(', ')}` : serverError || Object.values(errors)[0] || 'Not ready'}</span>
            </dd></div>
          </dl>
          <p className="mt-3 border-t border-emerald-200/70 pt-3 text-xs leading-5 text-slate-600 dark:border-emerald-900 dark:text-slate-400">The period opens in Annual Reviews. Submissions open when you start them from Period Settings.</p>
        </aside>
      </form>
    </RankingCycleDialog>
    {viewing && <CriteriaPreviewDialog versionId={viewing} onClose={() => setViewing(null)}/>}
  </>
}

