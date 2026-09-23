import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, CalendarDays, Eye, RefreshCw, Search, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getDeanDashboard, getDeanRoster } from '../../services/deanWorkspaceService'
import { deanReviewDetailRoute, DEAN_ROUTES } from '../../config/deanRoutes'
import { Select, SelectItem } from '../../components/ui/select'

const labels = {
  not_yet_submitted: 'Not Yet Submitted', awaiting_dean_review: 'Awaiting Dean Review',
  returned_for_revision: 'Returned for Revision', resubmitted: 'Resubmitted',
  endorsed_to_hr: 'Endorsed to HR', under_hr_review: 'Under HR Review', completed: 'Completed'
}

const statusStyles = {
  submitted: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  resubmitted: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  returned_for_revision: 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200',
  ready_for_finalization: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
  in_evaluation: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  not_yet_submitted: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
  hr_managed: 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
}

const titleCase = value => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
const meaningfulRoles = person => (person.functional_roles || []).filter(role => role.role_key !== 'personnel')
const roleLabel = person => meaningfulRoles(person).map(role => role.display_name).join(', ') || '—'

function RosterSkeleton() {
  return <main className="mx-auto max-w-[1500px] space-y-6 py-4" aria-busy="true" aria-label="Loading College Personnel Roster">
    <div className="space-y-3"><div className="h-8 w-72 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" /><div className="h-4 w-[28rem] max-w-full animate-pulse rounded bg-slate-100 dark:bg-slate-900" /></div>
    <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">{Array.from({ length: 5 }, (_, index) => <div key={index} className="grid grid-cols-7 gap-4 border-b border-slate-100 px-5 py-5 last:border-0 dark:border-slate-800"><span className="col-span-2 h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /><span className="h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /><span className="h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /><span className="h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /><span className="col-span-2 h-5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /></div>)}</div>
  </main>
}

function PersonnelDetails({ person, onClose }) {
  if (!person) return null
  const roles = roleLabel(person)
  return <div className="fixed inset-0 z-50 bg-slate-950/45" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <aside role="dialog" aria-modal="true" aria-labelledby="roster-person-title" className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-[-16px_0_48px_rgba(15,23,42,.18)] dark:bg-slate-950">
      <header className="flex items-start justify-between gap-6 border-b border-slate-200 px-6 py-6 dark:border-slate-800"><div><h2 id="roster-person-title" className="text-xl font-black text-slate-950 dark:text-white">{person.full_name}</h2><p className="mt-1 text-sm text-slate-500">{person.institutional_id}</p></div><button type="button" autoFocus onClick={onClose} aria-label="Close personnel details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></header>
      <div className="flex-1 overflow-y-auto px-6 py-7"><dl className="grid gap-6 sm:grid-cols-2">{[
        ['Classification', person.classification_label], ['Assignment', person.program_name || person.department_name || person.college_name],
        ['College', person.college_name], ['Functional role', roles], ['Position', person.position_title || 'Not recorded'],
        ['Academic rank', person.current_rank_title || 'Not recorded'], ['Employment', titleCase(person.employment_status)],
        ['Review responsibility', person.review_responsibility === 'dean' ? 'Dean' : 'HR'],
        ['Evaluation status', person.evaluation_status_label || 'Not available']
      ].map(([term, value]) => <div key={term}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{term}</dt><dd className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</dd></div>)}</dl><Link to={`/dean/personnel/${encodeURIComponent(person.id)}/rank-placement`} className="mt-8 inline-flex min-h-10 items-center rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">View Rank &amp; Placement</Link></div>
    </aside>
  </div>
}

function RosterView({ data }) {
  const [params, setParams] = useSearchParams()
  const [selectedPerson, setSelectedPerson] = useState(null)
  const personnel = useMemo(() => data.personnel || [], [data.personnel])
  const filters = { search: params.get('search') || '', classification: params.get('classification') || 'all', assignment: params.get('assignment') || 'all', route: params.get('route') || 'all', status: params.get('status') || 'all' }
  const setFilter = (key, value) => setParams(current => { const next = new URLSearchParams(current); if (!value || value === 'all') next.delete(key); else next.set(key, value); return next }, { replace: true })
  const clearFilters = () => setParams({}, { replace: true })
  const options = useMemo(() => ({
    classifications: [...new Set(personnel.map(person => person.classification_label).filter(Boolean))].sort(),
    assignments: [...new Map(personnel.map(person => [person.program_id || person.department_name || person.college_id, person.program_name || person.department_name || person.college_name]).filter(([id]) => id)).entries()],
    statuses: [...new Map(personnel.map(person => [person.evaluation_status, person.evaluation_status_label]).filter(([key]) => key)).entries()]
  }), [personnel])
  const filtered = useMemo(() => personnel.filter(person => {
    const identity = `${person.full_name} ${person.institutional_id}`.toLowerCase()
    const assignmentKey = person.program_id || person.department_name || person.college_id
    return (!filters.search || identity.includes(filters.search.toLowerCase())) && (filters.classification === 'all' || person.classification_label === filters.classification) && (filters.assignment === 'all' || assignmentKey === filters.assignment) && (filters.route === 'all' || person.evaluation_route === filters.route) && (filters.status === 'all' || person.evaluation_status === filters.status)
  }).sort((a, b) => a.full_name.localeCompare(b.full_name)), [personnel, filters.search, filters.classification, filters.assignment, filters.route, filters.status])
  const activeFilters = Object.entries(filters).filter(([, value]) => value && value !== 'all')
  const filterLabel = (key, value) => key === 'route' ? (value === 'DEAN_THEN_HR' ? 'Dean' : 'HR') : key === 'status' ? options.statuses.find(([option]) => option === value)?.[1] : key === 'assignment' ? options.assignments.find(([option]) => option === value)?.[1] : value

  const action = person => person.is_review_actionable && person.evaluation?.id
    ? <Link to={deanReviewDetailRoute(person.evaluation.id)} className="inline-flex items-center justify-center rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Review Portfolio</Link>
    : <button type="button" onClick={() => setSelectedPerson(person)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Eye className="h-3.5 w-3.5" />View</button>

  return <main className="mx-auto max-w-[1500px] space-y-6 py-4">
    <header><h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">College Personnel Roster</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">View personnel assigned to your college and monitor review responsibility and status.</p><p className="mt-3 text-sm font-bold text-emerald-800 dark:text-emerald-300">{data.college?.name} <span className="font-normal text-slate-400">·</span> {data.total || 0} personnel</p></header>
    <section aria-label="Roster summary" className="flex flex-wrap divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:divide-slate-700 dark:border-slate-800 dark:bg-slate-900">{[[data.summary?.total ?? data.total, 'Personnel'], [data.summary?.dean_then_hr, 'Dean responsibility'], [data.summary?.hr_direct, 'HR responsibility']].map(([value, label]) => <div key={label} className="min-w-36 px-5 first:pl-0"><span className="text-xl font-black tabular-nums text-slate-950 dark:text-white">{value ?? 0}</span><span className="ml-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span></div>)}</section>
    {!data.evaluation_period && <div role="status" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200"><strong>No active evaluation period.</strong> Evaluation statuses will become available when HR opens a period.</div>}
    <section aria-label="Roster filters" className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_repeat(4,minmax(150px,1fr))]">
      <label className="relative"><span className="sr-only">Search personnel</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={filters.search} onChange={event => setFilter('search', event.target.value)} placeholder="Search name or personnel ID" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
      <Select value={filters.classification} onValueChange={value => setFilter('classification', value)} aria-label="Filter by classification"><SelectItem value="all">All classifications</SelectItem>{options.classifications.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</Select>
      <Select value={filters.assignment} onValueChange={value => setFilter('assignment', value)} aria-label="Filter by assignment"><SelectItem value="all">All assignments</SelectItem>{options.assignments.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</Select>
      <Select value={filters.route} onValueChange={value => setFilter('route', value)} aria-label="Filter by review responsibility"><SelectItem value="all">All responsibilities</SelectItem><SelectItem value="DEAN_THEN_HR">Dean</SelectItem><SelectItem value="HR_DIRECT">HR</SelectItem></Select>
      <Select value={filters.status} onValueChange={value => setFilter('status', value)} disabled={!data.evaluation_period} aria-label="Filter by evaluation status"><SelectItem value="all">All statuses</SelectItem>{options.statuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</Select>
    </div>{activeFilters.length > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-slate-500">Active filters:</span>{activeFilters.map(([key, value]) => <button key={key} type="button" onClick={() => setFilter(key, 'all')} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700">{filterLabel(key, value)}<X className="h-3 w-3" /></button>)}<button type="button" onClick={clearFilters} className="text-xs font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 dark:text-emerald-300">Clear filters</button></div>}</section>
    {!personnel.length ? <div className="rounded-2xl border border-slate-200 py-16 text-center dark:border-slate-800"><p className="font-bold text-slate-900 dark:text-white">No personnel are currently assigned to this college.</p></div> : !filtered.length ? <div className="rounded-2xl border border-slate-200 py-16 text-center dark:border-slate-800"><p className="font-bold text-slate-900 dark:text-white">No personnel match the current filters.</p><button type="button" onClick={clearFilters} className="mt-3 text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">Clear filters</button></div> : <>
      <div className="hidden overflow-visible rounded-2xl border border-slate-200 lg:block dark:border-slate-800"><table className="w-full table-fixed border-collapse"><thead><tr className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">{[['Personnel','19%'],['Classification','14%'],['Assignment','20%'],['Role','12%'],['Review Responsibility','15%'],['Status','12%'],['Action','8%']].map(([label, width]) => <th key={label} scope="col" style={{ width }} className="px-4 py-2.5">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-800">{filtered.map(person => <tr key={person.id} className="align-top hover:bg-slate-50/70 dark:hover:bg-slate-900/60"><td className="px-4 py-3"><p className="font-bold leading-5 text-slate-950 dark:text-white">{person.full_name}</p><p className="mt-0.5 text-xs leading-4 text-slate-500">{person.institutional_id}</p></td><td className="px-4 py-3 text-sm font-semibold leading-5 text-slate-700 dark:text-slate-200"><span className="whitespace-nowrap">{person.classification_label}</span></td><td className="px-4 py-3"><p className="text-sm font-semibold leading-5 text-slate-800 dark:text-slate-200">{person.program_name || person.department_name || 'College assignment'}</p></td><td className="px-4 py-3 text-sm leading-5 text-slate-700 dark:text-slate-300">{roleLabel(person)}</td><td className="px-4 py-3"><p className="whitespace-nowrap text-sm font-bold leading-5 text-slate-800 dark:text-slate-200">{person.review_responsibility === 'dean' ? 'Dean' : 'HR'}</p>{person.is_self && <p className="mt-0.5 text-xs leading-4 text-slate-500">Self-review unavailable</p>}</td><td className="px-4 py-3">{data.evaluation_period ? <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold leading-5 ${statusStyles[person.evaluation_status] || statusStyles.hr_managed}`}>{person.evaluation_status_label}</span> : <span aria-label="Status unavailable" className="text-slate-400">—</span>}</td><td className="px-4 py-3">{action(person)}</td></tr>)}</tbody></table></div>
      <div className="grid gap-3 lg:hidden">{filtered.map(person => { const roles = meaningfulRoles(person); return <article key={person.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black leading-5 text-slate-950 dark:text-white">{person.full_name}</h2><p className="mt-0.5 text-xs text-slate-500">{person.institutional_id}</p></div>{data.evaluation_period && <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-bold leading-5 ${statusStyles[person.evaluation_status] || statusStyles.hr_managed}`}>{person.evaluation_status_label}</span>}</div><dl className="mt-3 grid gap-2.5 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold text-slate-500">Classification</dt><dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">{person.classification_label}</dd></div><div><dt className="text-xs font-semibold text-slate-500">Assignment</dt><dd className="mt-0.5 font-semibold leading-5 text-slate-800 dark:text-slate-200">{person.program_name || person.department_name || person.college_name}</dd></div>{roles.length > 0 && <div><dt className="text-xs font-semibold text-slate-500">Role</dt><dd className="mt-0.5 text-slate-700 dark:text-slate-300">{roles.map(role => role.display_name).join(', ')}</dd></div>}<div><dt className="text-xs font-semibold text-slate-500">Review responsibility</dt><dd className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">{person.review_responsibility === 'dean' ? 'Dean' : 'HR'}</dd>{person.is_self && <p className="mt-0.5 text-xs text-slate-500">Self-review unavailable</p>}</div></dl><div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">{action(person)}</div></article> })}</div>
      <footer className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500"><p>Showing <strong className="text-slate-800 dark:text-slate-200">{filtered.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{data.total}</strong> personnel</p><p>Sorted by personnel name A–Z</p></footer>
    </>}
    <PersonnelDetails person={selectedPerson} onClose={() => setSelectedPerson(null)} />
  </main>
}

export default function DeanWorkspacePage({ view = 'dashboard' }) {
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const load = () => {
    setState(current => ({ ...current, loading: true, error: '' }))
    const request = view === 'roster' ? getDeanRoster() : getDeanDashboard()
    request.then(data => setState({ loading: false, data, error: '' }))
      .catch(error => {
        const apiError = error?.error || error?.response?.data?.error || {}
        const messages = {
          DEAN_ASSIGNMENT_NOT_FOUND: 'No active Dean assignment was found.',
          DEAN_COLLEGE_SCOPE_MISSING: 'Your Dean role does not have an assigned college.',
          DEAN_COLLEGE_SCOPE_FORBIDDEN: 'This record is outside your assigned college.',
          DEAN_ASSIGNMENT_REQUIRED: 'Your Dean role does not currently have an active college assignment.'
        }
        setState({ loading: false, data: null, error: messages[apiError.code] || apiError.message || error?.message || 'Unable to load Dean workspace data.' })
      })
  }
  useEffect(load, [view])

  if (state.loading) return view === 'roster' ? <RosterSkeleton /> : <main className="mx-auto max-w-6xl space-y-4 py-4" aria-busy="true"><div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" /><div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" /></main>
  if (state.error) return <main className="mx-auto max-w-3xl py-12"><div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><AlertCircle className="h-5 w-5" /><p className="mt-2 font-bold">{view === 'roster' ? 'Unable to load College Personnel Roster.' : 'Dean workspace unavailable'}</p><p className="mt-1 text-sm">{state.error}</p><button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-900 px-3 py-2 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2"><RefreshCw className="h-3.5 w-3.5" />Try Again</button></div></main>

  const data = state.data || {}; const metrics = data.metrics || {}; const period = data.evaluation_period
  const firstName = String(user?.full_name || 'Dean').trim().split(/\s+/)[0]
  if (view === 'roster') return <RosterView data={data} />

  return <main className="mx-auto max-w-6xl space-y-9 py-4 font-sans">
    <header><h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">Hi, Dean {firstName}!</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Here’s what needs your attention in {data.college?.name}.</p></header>
    <section className="flex items-start gap-3 rounded-xl bg-[#064e2b] p-5 text-white"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-bold">Evaluation Period</h2>{period ? <><p className="mt-1 text-sm font-semibold">{period.name}</p><p className="text-xs text-emerald-100">{period.status_label} · {period.start_date} – {period.end_date}</p></> : <><p className="mt-1 text-sm font-semibold">No active evaluation period</p><p className="text-xs text-emerald-100">HR has not opened a current ranking/evaluation period.</p></>}</div></section>
    <section><h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Needs Attention</h2><div className="mt-3 grid gap-3 sm:grid-cols-3">{[['awaiting_dean_review','Awaiting Review'],['resubmitted','Resubmitted'],['not_yet_submitted','Not Yet Submitted']].map(([key,label]) => <Link key={key} to={key === 'not_yet_submitted' ? `${DEAN_ROUTES.COLLEGE_PERSONNEL}?submission=missing` : `${DEAN_ROUTES.FACULTY_RANKING_REVIEWS}?status=${key}`} className="rounded-xl border border-slate-200 p-4 hover:border-emerald-500 dark:border-slate-800"><span className="text-2xl font-extrabold tabular-nums">{period ? metrics[key] || 0 : 0}</span><span className="mt-1 block text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span></Link>)}</div></section>
    <section><h2 className="text-lg font-extrabold text-slate-950 dark:text-white">At a Glance</h2><dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-slate-200 py-5 md:grid-cols-5 dark:border-slate-800">{[['total_college_personnel','College Personnel'],['academic_faculty','Academic Faculty'],['hr_handled_personnel','HR-Handled'],['endorsed_to_hr','Endorsed to HR'],['completed','Completed']].map(([key,label]) => <div key={key}><dd className="text-xl font-extrabold tabular-nums">{metrics[key] || 0}</dd><dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt></div>)}</dl></section>
    <section><h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Academic Faculty Evaluation Progress</h2><dl className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">{Object.entries(labels).map(([key,label]) => <div key={key} className="flex justify-between py-2.5 text-sm"><dt>{label}</dt><dd className="font-extrabold tabular-nums">{period ? metrics[key] || 0 : 0}</dd></div>)}</dl></section>
    <div className="flex gap-4 text-sm font-bold"><Link to={DEAN_ROUTES.FACULTY_RANKING_REVIEWS} className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300">View Faculty Ranking Reviews <ArrowRight className="h-4 w-4" /></Link><Link to={DEAN_ROUTES.COLLEGE_PERSONNEL} className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300">View College Personnel Roster <ArrowRight className="h-4 w-4" /></Link></div>
  </main>
}
