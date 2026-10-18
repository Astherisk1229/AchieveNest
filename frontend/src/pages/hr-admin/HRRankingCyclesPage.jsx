import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronDown, Filter, MoreVertical, Plus, Search, Settings2 } from 'lucide-react'
import { listRankingCycles } from '../../services/personnelEvaluationPeriodService'
import RankingCycleContext from '../../components/ranking/RankingCycleContext'
import AnnualReviewsStage from './ranking-cycle-stages/AnnualReviewsStage'
import SubmissionsStage from './ranking-cycle-stages/SubmissionsStage'
import EvaluationStage from './ranking-cycle-stages/EvaluationStage'
import ResultsStage from './ranking-cycle-stages/ResultsStage'
import NewRankingCycleDialog from './ranking-cycles/NewRankingCycleDialog'
import CycleSettingsDialog from './ranking-cycles/CycleSettingsDialog'
import CriteriaPreviewDialog from './ranking-cycles/CriteriaPreviewDialog'
import { ArchiveCycleDialog, CancelCycleDialog, DeleteEmptyCycleDialog, RestoreCycleDialog } from './ranking-cycles/ArchiveCycleDialog'
import { CoverageBadges, LifecycleBadge, StageSteps } from './ranking-cycles/RankingCycleBadges'
import { errorMessage } from './ranking-cycles/RankingCycleDialog'
import {
  COVERAGE_OPTIONS, GROUP_BY_TRACK_KEY, LIFECYCLE_OPTIONS, TRACK_KEYS, filterAndSortCycles, formatDate, formatRange, primaryAction, workspacePath,
} from './ranking-cycles/rankingCyclePresentation'
import { HR_PERIOD_WORKSPACE_TABS, HR_RANKING_TABS } from '../../utils/hrRankingNavigation'

const EvaluationCriteriaWorkspace = React.lazy(() => import('./EvaluationCriteriaWorkspace'))

const stages = new Set(['annual-reviews', 'submissions', 'evaluation', 'results'])
const legacyStages = { overview: 'annual-reviews', evaluations: 'evaluation' }
const workspaceTabs = [...HR_RANKING_TABS, ...HR_PERIOD_WORKSPACE_TABS]
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
    actions.includes('complete_setup') ? null : ['settings', 'Period Settings'],
    cycle.tracks?.length ? ['criteria', 'View Criteria'] : null,
    actions.includes('archive') ? ['archive', 'Archive Period'] : null,
    actions.includes('restore') ? ['restore', 'Restore as Completed'] : null,
    actions.includes('cancel') ? ['cancel', 'Cancel Period'] : null,
    actions.includes('delete') || ['CANCELLED', 'ARCHIVED'].includes(cycle.lifecycle_status?.key) ? ['delete', 'Delete Period'] : null,
  ].filter(Boolean)
  return <div ref={ref} className="relative">
    <button type="button" aria-label={`More actions for ${cycle.display_name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-white"><MoreVertical className="h-4 w-4"/></button>
    {open && <div role="menu" className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg dark:border-slate-800 dark:bg-slate-950">
      {items.map(([key, label]) => {
        const deleteBlocked = key === 'delete' && !actions.includes('delete')
        const blockedReason = cycle.deletion_eligibility?.reason
        return <button key={key} type="button" role="menuitem" disabled={deleteBlocked} aria-disabled={deleteBlocked} title={deleteBlocked ? blockedReason : undefined} onClick={() => { if (deleteBlocked) return; setOpen(false); onSelect(key, cycle) }} className={`block w-full px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-900 ${key === 'archive' || key === 'delete' || key === 'cancel' ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-100'}`}>{label}</button>
      })}
    </div>}
  </div>
}

function ScheduleCell({ schedule }) {
  return <div className="space-y-1.5 text-sm">
    <p><span className="block text-xs font-semibold text-slate-500">Submission</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatRange(schedule?.submission_open_at, schedule?.submission_close_at)}</span></p>
    <p><span className="block text-xs font-semibold text-slate-500">Evaluation</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatRange(schedule?.evaluation_start_at, schedule?.evaluation_end_at)}</span></p>
  </div>
}

function CyclesList({ cycles, error, onCreate, onAction, onOpen }) {
  const [filters, setFilters] = useState({ search: '', academicYear: 'all', coverage: 'all', status: 'all', sort: 'newest' })
  const set = patch => setFilters(current => ({ ...current, ...patch }))
  const rows = useMemo(() => filterAndSortCycles(cycles, filters), [cycles, filters])
  const years = useMemo(() => [...new Set(cycles.map(cycle => cycle.academic_year))].sort().reverse(), [cycles])
  const filtered = filters.search || filters.academicYear !== 'all' || filters.coverage !== 'all' || filters.status !== 'all'
  const activeFilterCount = [filters.academicYear !== 'all', filters.coverage !== 'all', filters.status !== 'all', filters.sort !== 'newest'].filter(Boolean).length
  const clearFilters = () => setFilters({ search: '', academicYear: 'all', coverage: 'all', status: 'all', sort: 'newest' })

  return <section className="space-y-5">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-black tracking-[-0.025em] text-slate-950 dark:text-white">Ranking Periods</h1><p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Choose the ranking period you want to work on.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onCreate} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Plus className="h-4 w-4"/>New Ranking Period</button>
      </div>
    </header>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row dark:border-slate-800">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Search ranking periods</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400"/><input type="search" value={filters.search} onChange={event => set({ search: event.target.value })} placeholder="Search ranking periods…" className={`${selectClass} pl-9`}/></label>
        <details className="relative shrink-0">
          <summary className="flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><Filter aria-hidden="true" className="h-4 w-4"/>Filter{activeFilterCount > 0 && <span className="rounded-full bg-emerald-100 px-1.5 text-xs text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">{activeFilterCount}</span>}<ChevronDown aria-hidden="true" className="h-4 w-4"/></summary>
          <div className="absolute right-0 z-30 mt-2 grid w-[min(20rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-950">
            <FilterSelect label="Academic year" value={filters.academicYear} onChange={academicYear => set({ academicYear })} options={[{ value: 'all', label: 'All years' }, ...years.map(year => ({ value: year, label: year.replace('-', '–') }))]}/>
            <FilterSelect label="Personnel coverage" value={filters.coverage} onChange={coverage => set({ coverage })} options={[{ value: 'all', label: 'All coverage' }, ...COVERAGE_OPTIONS]}/>
            <FilterSelect label="Status" value={filters.status} onChange={status => set({ status })} options={[{ value: 'all', label: 'All statuses' }, ...LIFECYCLE_OPTIONS]}/>
            <FilterSelect label="Sort by" value={filters.sort} onChange={sort => set({ sort })} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name (A–Z)' }]}/>
            {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="justify-self-start text-sm font-bold text-emerald-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Clear filters</button>}
          </div>
        </details>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] table-fixed text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th scope="col" className="w-[22%] px-5 py-3">Ranking Period</th><th scope="col" className="w-[15%] px-3 py-3">Coverage</th><th scope="col" className="w-[18%] px-3 py-3">Schedule</th><th scope="col" className="w-[12%] px-3 py-3">Current Stage</th><th scope="col" className="w-[13%] px-3 py-3">Status</th><th scope="col" className="w-[20%] px-5 py-3 text-right">Action</th></tr></thead>
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
                  : <button type="button" onClick={() => onOpen(cycle)} className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${action.kind === 'open' ? 'bg-emerald-800 text-white hover:bg-emerald-900' : 'border border-slate-300 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900'}`}>{action.kind === 'open' ? 'Open Period' : 'View Period'}<ArrowRight className="h-4 w-4"/></button>}
                <RowMenu cycle={cycle} onSelect={onAction}/>
              </div></td>
            </tr>
          })}
          {!rows.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500"><CalendarDays className="mx-auto h-6 w-6"/><p className="mt-2 font-bold text-slate-700 dark:text-slate-200">{filtered ? 'No ranking periods match these filters' : 'No ranking periods yet'}</p><p className="mt-1 text-xs">{filtered ? 'Clear a filter or search to see more periods.' : 'Create a ranking period to get started.'}</p></td></tr>}
        </tbody>
      </table></div>
    </div>
  </section>
}

function PeriodSummary({ cycle, selectedTab, onSelectTab, onOpenSettings }) {
  const schedule = cycle.schedule || {}
  return <section aria-label="Selected ranking period" className="overflow-hidden rounded-xl border border-emerald-200 bg-white dark:border-emerald-900 dark:bg-slate-950">
    <header className="grid gap-5 bg-emerald-50/70 px-4 py-4 dark:bg-emerald-950/25 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-6 sm:py-5">
      <div className="min-w-0">
        <Link to="/hr/ranking-cycles?tab=periods" className="inline-flex min-h-9 items-center gap-1 text-sm font-bold text-emerald-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-emerald-200">← Back to Ranking Periods</Link>
        <div className="mt-2 flex min-w-0 items-start gap-3"><CalendarDays aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-emerald-800 dark:text-emerald-300"/><div className="min-w-0"><h1 className="text-xl font-bold leading-tight tracking-[-0.02em] text-slate-950 dark:text-white sm:text-2xl">{cycle.display_name}</h1><p className="mt-1 text-base leading-6 text-slate-700 dark:text-slate-200">{cycle.academic_year_label || cycle.academic_year || 'Academic year not recorded'} <span aria-hidden="true">·</span> {cycle.coverage?.label || 'Personnel coverage not recorded'}</p></div></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:pt-8"><LifecycleBadge status={cycle.lifecycle_status}/><button type="button" onClick={onOpenSettings} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-200 dark:hover:bg-emerald-950"><Settings2 aria-hidden="true" className="h-4 w-4"/>Period Settings</button></div>
      <dl className="grid gap-x-6 gap-y-2 border-t border-emerald-200/80 pt-3 text-sm leading-5 text-slate-700 dark:border-emerald-900 dark:text-slate-200 sm:col-span-2 sm:grid-cols-2 sm:pt-4 lg:grid-cols-3">
        <div><dt className="font-semibold text-slate-700 dark:text-slate-200">Submission</dt><dd className="mt-0.5">{formatRange(schedule.submission_open_at, schedule.submission_close_at)}</dd></div>
        <div><dt className="font-semibold text-slate-700 dark:text-slate-200">Evaluation</dt><dd className="mt-0.5">{formatRange(schedule.evaluation_start_at, schedule.evaluation_end_at)}</dd></div>
        <div><dt className="font-semibold text-slate-700 dark:text-slate-200">Current stage</dt><dd className="mt-0.5">{cycle.current_stage?.label || 'Not set'}</dd></div>
      </dl>
    </header>
    <nav aria-label="Ranking period workspace" className="border-t border-slate-200 px-2 dark:border-slate-800 sm:px-4"><div className="flex flex-wrap">{HR_PERIOD_WORKSPACE_TABS.filter(item => item.key !== 'annual-reviews' || cycle.tracks?.some(track => track.personnel_group === 'FACULTY')).map(item => <button key={item.key} type="button" aria-current={selectedTab === item.key ? 'page' : undefined} onClick={() => onSelectTab(item.key)} className={`min-h-12 whitespace-nowrap border-b-2 px-3 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 sm:px-4 ${selectedTab === item.key ? 'border-emerald-700 text-emerald-900 dark:text-emerald-200' : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'}`}>{item.label}</button>)}</div></nav>
  </section>
}

function PersonnelCategoryTabs({ tracks, selected, onChange }) {
  if (tracks.length < 2) return null
  const options = [
    { value: 'all', label: 'All Personnel' },
    ...tracks.map(track => ({ value: TRACK_KEYS[track.personnel_group], label: track.personnel_group === 'NON_TEACHING_FACULTY' ? 'Non-Teaching Personnel' : 'Teaching Faculty' })),
  ]
  return <nav aria-label="Personnel category" className="flex flex-wrap border-b border-slate-200 dark:border-slate-800" role="tablist">{options.map(option => <button key={option.value} type="button" role="tab" aria-selected={selected === option.value} onClick={() => onChange(option.value)} className={`min-h-11 border-b-2 px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 ${selected === option.value ? 'border-emerald-700 text-emerald-900 dark:text-emerald-200' : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'}`}>{option.label}</button>)}</nav>
}

export default function HRRankingCyclesPage() {
  const { cycleId, trackKey, stage } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
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
      setError(errorMessage(failure, 'Ranking periods could not be loaded.'))
      setPhase(current => current === 'ready' ? 'ready' : 'error')
      return []
    }
  }, [])

  useEffect(() => { load() }, [load])

  const requestedTab = workspaceTabs.some(item => item.key === searchParams.get('tab')) ? searchParams.get('tab') : 'periods'
  const selectedCycleId = cycleId || (searchParams.get('tab') === 'overview' ? null : searchParams.get('period'))
  const selectedTab = requestedTab === 'periods' && selectedCycleId ? 'annual-reviews' : requestedTab
  const cycle = useMemo(() => cycles.find(item => item.id === selectedCycleId), [cycles, selectedCycleId])
  const requestedTrackKey = trackKey || searchParams.get('track')
  const coveredTrackKeys = useMemo(() => (cycle?.tracks || []).map(item => TRACK_KEYS[item.personnel_group]).filter(Boolean), [cycle?.tracks])
  const selectedTrackKey = requestedTrackKey || (coveredTrackKeys.length > 1 ? 'all' : coveredTrackKeys[0] || null)
  const invalidTrack = Boolean(requestedTrackKey && (requestedTrackKey === 'all' ? coveredTrackKeys.length < 2 : !coveredTrackKeys.includes(requestedTrackKey)))
  const selectedTrackKeys = useMemo(() => {
    if (!coveredTrackKeys.length || invalidTrack) return []
    if (selectedTrackKey === 'all') return coveredTrackKeys
    return coveredTrackKeys.includes(selectedTrackKey) ? [selectedTrackKey] : []
  }, [coveredTrackKeys, invalidTrack, selectedTrackKey])
  const track = cycle?.tracks?.find(item => item.personnel_group === GROUP_BY_TRACK_KEY[selectedTrackKey])
    || (cycle?.tracks?.length === 1 ? cycle.tracks[0] : null)
  const closeDialog = () => setDialog(null)
  const onAction = (kind, target) => {
    if (kind === 'complete_setup') setDialog({ kind: 'settings', cycle: target, section: 'coverage' })
    else if (kind === 'settings') setDialog({ kind: 'settings', cycle: target, section: 'general' })
    else if (kind === 'criteria') setDialog({ kind: 'criteria', versionId: target.tracks[0]?.criteria?.version_id, cycle: target })
    else if (kind === 'archive') setDialog({ kind: 'archive', cycle: target })
    else if (kind === 'cancel') setDialog({ kind: 'cancel', cycle: target })
    else if (kind === 'restore') setDialog({ kind: 'restore', cycle: target })
    else if (kind === 'delete') setDialog({ kind: 'delete', cycle: target })
  }

  const dialogs = <>
    {dialog?.kind === 'create' && <NewRankingCycleDialog cycles={cycles} onClose={closeDialog} onCreated={async created => { setDialog(null); await load({ quiet: true }); navigate(`/hr/ranking-cycles?tab=annual-reviews&period=${encodeURIComponent(created.id)}`) }}/>}
    {dialog?.kind === 'settings' && <CycleSettingsDialog cycle={dialog.cycle} cycles={cycles} section={dialog.section} onClose={() => { setDialog(null); load({ quiet: true }) }} onChanged={() => load({ quiet: true })} onArchive={target => setDialog({ kind: 'archive', cycle: target })} onCancel={target => setDialog({ kind: 'cancel', cycle: target })} onRestore={target => setDialog({ kind: 'restore', cycle: target })} onDelete={target => setDialog({ kind: 'delete', cycle: target })}/>}
    {dialog?.kind === 'criteria' && dialog.versionId && <CriteriaPreviewDialog versionId={dialog.versionId} onClose={closeDialog}/>}
    {dialog?.kind === 'archive' && <ArchiveCycleDialog cycle={dialog.cycle} onClose={closeDialog} onArchived={async () => { setDialog(null); await load({ quiet: true }) }}/>}
    {dialog?.kind === 'cancel' && <CancelCycleDialog cycle={dialog.cycle} onClose={closeDialog} onCancelled={async () => { setDialog(null); await load({ quiet: true }) }}/>}
    {dialog?.kind === 'restore' && <RestoreCycleDialog cycle={dialog.cycle} onClose={closeDialog} onRestored={async () => { setDialog(null); await load({ quiet: true }) }}/>}
    {dialog?.kind === 'delete' && <DeleteEmptyCycleDialog cycle={dialog.cycle} onClose={closeDialog} onDeleted={async deleted => { setDialog(null); await load({ quiet: true }); if (cycleId || selectedCycleId === deleted.id) navigate('/hr/ranking-cycles?tab=periods', { replace: true }) }}/>}
  </>

  if (phase === 'loading') return <div className="space-y-3" aria-busy="true"><div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800"/><div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/></div>
  if (phase === 'error') return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error} <button type="button" onClick={() => load()} className="font-bold underline underline-offset-4">Try again</button></div>

  const setWorkspaceLocation = (tab, period = selectedCycleId, group = selectedTrackKey) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    if (period) next.set('period', period); else next.delete('period')
    if (tab === 'annual-reviews') group = 'faculty'
    if (tab !== 'periods' && tab !== 'evaluation-criteria' && group) next.set('track', group); else next.delete('track')
    if (tab !== 'portfolio-evaluation') next.delete('view')
    else if (selectedTab !== 'portfolio-evaluation') next.delete('view')
    setSearchParams(next)
  }
  const openPeriod = target => {
    const hasFaculty = target.tracks?.some(item => item.personnel_group === 'FACULTY')
    setWorkspaceLocation(hasFaculty ? 'annual-reviews' : 'portfolio-evaluation', target.id, hasFaculty ? 'faculty' : 'non-teaching-faculty')
  }
  const changeTrack = key => setWorkspaceLocation(selectedTab, selectedCycleId, key)
  const openSettings = section => setDialog({ kind: 'settings', cycle, section: typeof section === 'string' ? section : 'general' })
  const viewCriteria = versionId => setDialog({ kind: 'criteria', versionId, cycle })

  // Keep pre-redesign stage URLs working for saved links and bookmarks.
  if (cycleId && stage) {
    if (!cycle) return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">Ranking period was not found. <Link className="font-bold underline underline-offset-4" to="/hr/ranking-cycles">Return to periods</Link></p>
    if (!cycle.track_count) return <><RankingCycleContext cycle={cycle} onOpenSettings={() => openSettings('coverage')}/><div className="mx-auto mt-8 max-w-xl border-y border-slate-200 py-10 text-center dark:border-slate-800"><CalendarDays className="mx-auto h-7 w-7 text-slate-400"/><h2 className="mt-3 text-lg font-black">Incomplete Configuration</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">This period has no personnel coverage or schedule yet. Complete its setup to open the period workspaces.</p><button type="button" onClick={() => openSettings('coverage')} className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Complete Setup</button></div>{dialogs}</>
    if (!trackKey || !GROUP_BY_TRACK_KEY[trackKey] || !track) return <Navigate replace to={workspacePath(cycle)}/>
    if (legacyStages[stage]) return <Navigate replace to={`/hr/ranking-cycles/${encodeURIComponent(cycle.id)}/${trackKey}/${legacyStages[stage]}`}/>
    if (stage === 'annual-reviews' && track.personnel_group === 'NON_TEACHING_FACULTY') return <Navigate replace to={`/hr/ranking-cycles?tab=portfolio-evaluation&period=${encodeURIComponent(cycle.id)}&track=non-teaching-faculty`}/>
    if (!stages.has(stage)) return <Navigate replace to={`/hr/ranking-cycles/${encodeURIComponent(cycle.id)}/${trackKey}/annual-reviews`}/>
    const stageComponents = { 'annual-reviews': AnnualReviewsStage, submissions: SubmissionsStage, evaluation: EvaluationStage, results: ResultsStage }
    const StageComponent = stageComponents[stage]
    return <><RankingCycleContext cycle={cycle} track={track} trackKey={trackKey} onViewCriteria={viewCriteria} onOpenSettings={openSettings}/><div className="mt-6"><StageComponent key={`${track.id}-${stage}-${track.status}`} cycleId={cycle.id} trackKey={trackKey}/></div>{dialogs}</>
  }

  if (cycle?.track_count && selectedTab === 'annual-reviews' && (selectedTrackKey !== 'faculty' || !coveredTrackKeys.includes('faculty'))) {
    const next = new URLSearchParams(searchParams)
    const hasFaculty = coveredTrackKeys.includes('faculty')
    next.set('tab', hasFaculty ? 'annual-reviews' : 'portfolio-evaluation')
    next.set('track', hasFaculty ? 'faculty' : 'non-teaching-faculty')
    next.set('period', cycle.id)
    return <Navigate replace to={`/hr/ranking-cycles?${next.toString()}`}/>
  }

  const tabStages = { 'annual-reviews': AnnualReviewsStage, 'portfolio-evaluation': EvaluationStage, 'evaluation-summaries': ResultsStage }
  const ActiveStage = selectedTab === 'portfolio-evaluation' && searchParams.get('view') === 'submissions'
    ? SubmissionsStage
    : tabStages[selectedTab]
  const periodRequired = ['annual-reviews', 'portfolio-evaluation', 'evaluation-summaries'].includes(selectedTab)
  const categoryRequired = periodRequired && selectedTab !== 'annual-reviews' && coveredTrackKeys.length > 1

  return <div className="space-y-5">
    <div className="space-y-5">
      {selectedTab === 'periods' && !selectedCycleId && <CyclesList cycles={cycles} error={error} onCreate={() => setDialog({ kind: 'create' })} onAction={onAction} onOpen={openPeriod}/>}
      {selectedTab === 'periods' && selectedCycleId && !cycle && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">That ranking period could not be found. <button type="button" onClick={() => setWorkspaceLocation('periods', null, null)} className="font-bold underline">Return to periods</button></p>}
      {selectedTab !== 'periods' && !selectedCycleId && <div className="border-y border-slate-200 py-6 dark:border-slate-800"><h1 className="text-xl font-black text-slate-950 dark:text-white">Choose a ranking period</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Select an HR-managed period to open Annual Reviews.</p>{cycles.length ? <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">{cycles.map(item => <button key={item.id} type="button" onClick={() => openPeriod(item)} className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"><span><span className="block font-bold text-slate-950 dark:text-white">{item.display_name}</span><span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">{item.coverage?.label || 'Personnel coverage not recorded'}</span></span><span className="flex shrink-0 items-center gap-3"><LifecycleBadge status={item.lifecycle_status}/><ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-400"/></span></button>)}</div> : <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">No ranking periods are available. Create one to get started.</p>}</div>}
      {selectedTab !== 'periods' && selectedCycleId && !cycle && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">That ranking period could not be found. <button type="button" onClick={() => setWorkspaceLocation('periods', null, null)} className="font-bold underline">Choose another period</button></p>}
      {selectedTab === 'evaluation-criteria' && !selectedCycleId && <React.Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/>}><EvaluationCriteriaWorkspace/></React.Suspense>}
      {selectedTab !== 'periods' && selectedCycleId && cycle && <>
        <PeriodSummary cycle={cycle} selectedTab={selectedTab} onSelectTab={tab => setWorkspaceLocation(tab, cycle.id)} onOpenSettings={() => openSettings(cycle.track_count ? 'general' : 'coverage')}/>
        {!cycle.track_count && <div className="rounded-xl border border-slate-200 px-5 py-8 text-center dark:border-slate-800"><h2 className="font-bold text-slate-950 dark:text-white">Complete this period’s setup</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Personnel coverage and schedules are required before its workspaces can open.</p><button type="button" onClick={() => openSettings('coverage')} className="mt-4 min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900">Complete Setup</button></div>}
        {categoryRequired && <PersonnelCategoryTabs tracks={cycle.tracks || []} selected={selectedTrackKey} onChange={changeTrack}/>}
        {invalidTrack && periodRequired && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">This personnel category is not covered by the selected period. Choose a category shown above or return to Ranking Periods.</p>}
        {periodRequired && selectedTrackKeys.length > 0 && !invalidTrack && ActiveStage && <ActiveStage key={`${selectedTrackKeys.join('-')}-${selectedTab}-${searchParams.get('view') || ''}-${searchParams.get('personnel_id') || ''}`} cycleId={cycle.id} trackKey={selectedTrackKeys.length === 1 ? selectedTrackKeys[0] : undefined} trackKeys={selectedTrackKeys} embedded={selectedTab === 'annual-reviews'} hideCategoryFilter/>}
        {selectedTab === 'evaluation-criteria' && <React.Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/>}><EvaluationCriteriaWorkspace key={cycle.id} periodTracks={cycle.tracks || []}/></React.Suspense>}
      </>}
    </div>
    {dialogs}
  </div>
}
