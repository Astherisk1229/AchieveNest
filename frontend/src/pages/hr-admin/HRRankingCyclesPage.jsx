import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, MoreVertical, Plus, Search } from 'lucide-react'
import { listRankingCycles } from '../../services/personnelEvaluationPeriodService'
import RankingCycleContext from '../../components/ranking/RankingCycleContext'
import AnnualReviewsStage from './ranking-cycle-stages/AnnualReviewsStage'
import SubmissionsStage from './ranking-cycle-stages/SubmissionsStage'
import EvaluationStage from './ranking-cycle-stages/EvaluationStage'
import ResultsStage from './ranking-cycle-stages/ResultsStage'
import NewRankingCycleDialog from './ranking-cycles/NewRankingCycleDialog'
import CycleSettingsDialog from './ranking-cycles/CycleSettingsDialog'
import CriteriaPreviewDialog from './ranking-cycles/CriteriaPreviewDialog'
import { ArchiveCycleDialog, DeleteEmptyCycleDialog } from './ranking-cycles/ArchiveCycleDialog'
import { CoverageBadges, LifecycleBadge, StageSteps } from './ranking-cycles/RankingCycleBadges'
import { errorMessage } from './ranking-cycles/RankingCycleDialog'
import {
  COVERAGE_OPTIONS, GROUP_BY_TRACK_KEY, LIFECYCLE_OPTIONS, filterAndSortCycles, formatDate, formatRange, primaryAction, workspacePath,
} from './ranking-cycles/rankingCyclePresentation'

const stages = new Set(['annual-reviews', 'submissions', 'evaluation', 'results'])
const legacyStages = { overview: 'annual-reviews', evaluations: 'evaluation' }
const selectClass = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

function FilterSelect({ label, value, onChange, options }) {
  return <label className="min-w-0"><span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className={selectClass}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function RowMenu({ cycle, onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = event => { if (event.type === 'keydown' ? event.key === 'Escape' : !ref.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])
  const actions = cycle.allowed_actions || []
  const items = [
    actions.includes('complete_setup') ? null : ['settings', 'Cycle Settings'],
    cycle.tracks?.length ? ['criteria', 'View Criteria'] : null,
    actions.includes('archive') ? ['archive', 'Archive Cycle'] : null,
    actions.includes('delete') ? ['delete', 'Delete Empty Cycle'] : null,
  ].filter(Boolean)
  return <div ref={ref} className="relative">
    <button type="button" aria-label={`More actions for ${cycle.display_name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-white"><MoreVertical className="h-4 w-4"/></button>
    {open && <div role="menu" className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-800 dark:bg-slate-950">
      {items.map(([key, label]) => <button key={key} type="button" role="menuitem" onClick={() => { setOpen(false); onSelect(key, cycle) }} className={`block w-full px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-slate-900 ${key === 'archive' || key === 'delete' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'}`}>{label}</button>)}
    </div>}
  </div>
}

function ScheduleCell({ schedule }) {
  return <div className="space-y-1.5 text-sm">
    <p><span className="block text-xs font-semibold text-slate-500">Submission</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatRange(schedule?.submission_open_at, schedule?.submission_close_at)}</span></p>
    <p><span className="block text-xs font-semibold text-slate-500">Evaluation</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatRange(schedule?.evaluation_start_at, schedule?.evaluation_end_at)}</span></p>
  </div>
}

function CyclesList({ cycles, error, onCreate, onAction }) {
  const [filters, setFilters] = useState({ search: '', academicYear: 'all', coverage: 'all', status: 'all', sort: 'newest' })
  const set = patch => setFilters(current => ({ ...current, ...patch }))
  const rows = useMemo(() => filterAndSortCycles(cycles, filters), [cycles, filters])
  const years = useMemo(() => [...new Set(cycles.map(cycle => cycle.academic_year))].sort().reverse(), [cycles])
  const filtered = filters.search || filters.academicYear !== 'all' || filters.coverage !== 'all' || filters.status !== 'all'

  return <section className="space-y-5">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-black tracking-[-0.025em] text-slate-950 dark:text-white">Ranking Cycles</h1><p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Choose the ranking cycle you want to work on.</p></div>
      <button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Plus className="h-4 w-4"/>New Ranking Cycle</button>
    </header>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] md:items-end dark:border-slate-800">
        <label className="relative min-w-0"><span className="sr-only">Search ranking cycles</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"/><input type="search" value={filters.search} onChange={event => set({ search: event.target.value })} placeholder="Search ranking cycles…" className={`${selectClass} pl-9`}/></label>
        <FilterSelect label="Academic Year" value={filters.academicYear} onChange={academicYear => set({ academicYear })} options={[{ value: 'all', label: 'All Years' }, ...years.map(year => ({ value: year, label: year.replace('-', '–') }))]}/>
        <FilterSelect label="Coverage" value={filters.coverage} onChange={coverage => set({ coverage })} options={[{ value: 'all', label: 'All' }, ...COVERAGE_OPTIONS]}/>
        <FilterSelect label="Status" value={filters.status} onChange={status => set({ status })} options={[{ value: 'all', label: 'All' }, ...LIFECYCLE_OPTIONS]}/>
        <FilterSelect label="Sort by" value={filters.sort} onChange={sort => set({ sort })} options={[{ value: 'newest', label: 'Newest First' }, { value: 'oldest', label: 'Oldest First' }, { value: 'name', label: 'Name (A–Z)' }]}/>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] table-fixed text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th scope="col" className="w-[22%] px-5 py-3">Ranking Cycle</th><th scope="col" className="w-[15%] px-3 py-3">Coverage</th><th scope="col" className="w-[18%] px-3 py-3">Schedule</th><th scope="col" className="w-[12%] px-3 py-3">Current Stage</th><th scope="col" className="w-[13%] px-3 py-3">Status</th><th scope="col" className="w-[20%] px-5 py-3 text-right">Action</th></tr></thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map(cycle => {
            const action = primaryAction(cycle)
            const highlighted = cycle.lifecycle_status?.key === 'ONGOING'
            return <tr key={cycle.id} data-testid="ranking-cycle-row" className={`align-middle transition-colors ${highlighted ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : 'hover:bg-slate-50/70 dark:hover:bg-slate-900/60'}`}>
              <td className="px-5 py-4"><div className="flex items-start gap-3"><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><CalendarDays className="h-5 w-5"/></span><div className="min-w-0"><p className="flex flex-wrap items-center gap-2 font-black text-slate-950 dark:text-white">{cycle.display_name}{cycle.is_legacy && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">Legacy</span>}</p><p className="mt-0.5 text-xs text-slate-500">Created {formatDate(cycle.created_at)}{cycle.created_by_label ? ` · ${cycle.created_by_label}` : ''}</p>{cycle.configuration_issues?.length > 0 && <p className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-200">{cycle.configuration_issues[0]}</p>}</div></div></td>
              <td className="px-3 py-4"><CoverageBadges coverage={cycle.coverage}/></td>
              <td className="px-3 py-4"><ScheduleCell schedule={cycle.schedule}/></td>
              <td className="px-3 py-4"><StageSteps stage={cycle.current_stage}/></td>
              <td className="px-3 py-4"><LifecycleBadge wrap status={cycle.lifecycle_status}/></td>
              <td className="px-5 py-4"><div className="flex items-center justify-end gap-2">
                {action.kind === 'complete_setup'
                  ? <button type="button" onClick={() => onAction('complete_setup', cycle)} className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-300 px-3 font-bold text-amber-900 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30">Complete Setup</button>
                  : <Link to={workspacePath(cycle)} className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${action.kind === 'open' ? 'bg-emerald-800 text-white hover:bg-emerald-900' : 'border border-slate-300 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900'}`}>{action.kind === 'open' ? 'Open Cycle' : 'View Cycle'}<ArrowRight className="h-4 w-4"/></Link>}
                <RowMenu cycle={cycle} onSelect={onAction}/>
              </div></td>
            </tr>
          })}
          {!rows.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500"><CalendarDays className="mx-auto h-6 w-6"/><p className="mt-2 font-bold text-slate-700 dark:text-slate-200">{filtered ? 'No ranking cycles match these filters' : 'No ranking cycles yet'}</p><p className="mt-1 text-xs">{filtered ? 'Clear a filter or search to see more cycles.' : 'Create a ranking cycle to get started.'}</p></td></tr>}
        </tbody>
      </table></div>
    </div>
  </section>
}

export default function HRRankingCyclesPage() {
  const { cycleId, trackKey, stage } = useParams()
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setPhase('loading')
    try {
      const data = await listRankingCycles()
      setCycles(data?.cycles || [])
      setError('')
      setPhase('ready')
      return data?.cycles || []
    } catch (failure) {
      setError(errorMessage(failure, 'Ranking cycles could not be loaded.'))
      setPhase(current => current === 'ready' ? 'ready' : 'error')
      return []
    }
  }, [])

  useEffect(() => { load() }, [load])

  const cycle = useMemo(() => cycles.find(item => item.id === cycleId), [cycles, cycleId])
  const track = cycle?.tracks?.find(item => item.personnel_group === GROUP_BY_TRACK_KEY[trackKey])
  const closeDialog = () => setDialog(null)
  const onAction = (kind, target) => {
    if (kind === 'complete_setup') setDialog({ kind: 'settings', cycle: target, section: 'coverage' })
    else if (kind === 'settings') setDialog({ kind: 'settings', cycle: target, section: 'general' })
    else if (kind === 'criteria') setDialog({ kind: 'criteria', versionId: target.tracks[0]?.criteria?.version_id, cycle: target })
    else if (kind === 'archive') setDialog({ kind: 'archive', cycle: target })
    else if (kind === 'delete') setDialog({ kind: 'delete', cycle: target })
  }

  const dialogs = <>
    {dialog?.kind === 'create' && <NewRankingCycleDialog cycles={cycles} onClose={closeDialog} onCreated={async created => { setDialog(null); await load({ quiet: true }); navigate(workspacePath(created)) }}/>}
    {dialog?.kind === 'settings' && <CycleSettingsDialog cycle={dialog.cycle} cycles={cycles} section={dialog.section} onClose={() => { setDialog(null); load({ quiet: true }) }} onChanged={() => load({ quiet: true })} onArchive={target => setDialog({ kind: 'archive', cycle: target })}/>}
    {dialog?.kind === 'criteria' && dialog.versionId && <CriteriaPreviewDialog versionId={dialog.versionId} onClose={closeDialog}/>}
    {dialog?.kind === 'archive' && <ArchiveCycleDialog cycle={dialog.cycle} onClose={closeDialog} onArchived={async () => { setDialog(null); await load({ quiet: true }) }}/>}
    {dialog?.kind === 'delete' && <DeleteEmptyCycleDialog cycle={dialog.cycle} onClose={closeDialog} onDeleted={async () => { setDialog(null); await load({ quiet: true }); if (cycleId) navigate('/hr/ranking-cycles') }}/>}
  </>

  if (phase === 'loading') return <div className="space-y-3" aria-busy="true"><div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800"/><div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/></div>
  if (phase === 'error') return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error} <button type="button" onClick={() => load()} className="font-bold underline underline-offset-4">Try again</button></div>

  if (!cycleId) return <><CyclesList cycles={cycles} error={error} onCreate={() => setDialog({ kind: 'create' })} onAction={onAction}/>{dialogs}</>

  if (!cycle) return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">Ranking cycle was not found. <Link className="font-bold underline underline-offset-4" to="/hr/ranking-cycles">Return to cycles</Link></p>

  const openSettings = section => setDialog({ kind: 'settings', cycle, section: typeof section === 'string' ? section : 'general' })
  const viewCriteria = versionId => setDialog({ kind: 'criteria', versionId, cycle })

  if (!cycle.track_count) return <><RankingCycleContext cycle={cycle} onOpenSettings={openSettings}/><div className="mx-auto mt-8 max-w-xl border-y border-slate-200 py-10 text-center dark:border-slate-800"><CalendarDays className="mx-auto h-7 w-7 text-slate-400"/><h2 className="mt-3 text-lg font-black">Incomplete Configuration</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">This cycle has no personnel coverage or schedule yet. Complete its setup to open Annual Reviews, Submissions, Evaluation, and Results.</p><button type="button" onClick={() => openSettings('coverage')} className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Complete Setup</button></div>{dialogs}</>

  if (!trackKey || !GROUP_BY_TRACK_KEY[trackKey] || !track) return <Navigate replace to={workspacePath(cycle)}/>
  if (legacyStages[stage]) return <Navigate replace to={`/hr/ranking-cycles/${encodeURIComponent(cycle.id)}/${trackKey}/${legacyStages[stage]}`}/>
  if (!stage || !stages.has(stage)) return <Navigate replace to={`/hr/ranking-cycles/${encodeURIComponent(cycle.id)}/${trackKey}/annual-reviews`}/>

  const stageComponents = {
    'annual-reviews': AnnualReviewsStage,
    submissions: SubmissionsStage,
    evaluation: EvaluationStage,
    results: ResultsStage,
  }
  const StageComponent = stageComponents[stage]
  const content = <StageComponent key={`${track.id}-${stage}-${track.status}`} cycleId={cycle.id} trackKey={trackKey}/>

  return <><RankingCycleContext cycle={cycle} track={track} trackKey={trackKey} onViewCriteria={viewCriteria} onOpenSettings={openSettings}/><div className="mt-6">{content}</div>{dialogs}</>
}
