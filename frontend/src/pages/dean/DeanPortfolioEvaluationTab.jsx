import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, ChevronDown, Filter, RefreshCw, Search, X } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getDeanReviewDetail, getDeanReviews } from '../../services/deanWorkspaceService'
import { DEAN_ROUTES, deanReviewDetailRoute } from '../../config/deanRoutes'
import DeanPortfolioEvaluationWorkspace from './DeanPortfolioEvaluationWorkspace'

const statusOptions = [
  ['all', 'All Portfolios'], ['needs_review', 'Needs Review'], ['resubmitted', 'Resubmitted'],
  ['returned', 'Returned'], ['endorsed', 'Endorsed to HR'], ['completed', 'Completed']
]

const emptyMessages = {
  all: ['No portfolios available.', 'There are no faculty portfolios in this evaluation period.'],
  needs_review: ['No portfolios need your review.', "You're all caught up for now."],
  resubmitted: ['No resubmitted portfolios.', 'There are no resubmitted portfolios to review right now.'],
  returned: ['No returned portfolios.', 'No portfolios are currently waiting for faculty revision.'],
  endorsed: ['No portfolios endorsed to HR.', 'Endorsed portfolios will appear here.'],
  completed: ['No completed portfolios.', 'Completed faculty reviews will appear here.']
}

function friendlyStatus(status, version) {
  if (version > 1 && ['submitted', 'in_evaluation'].includes(status)) return 'Resubmitted'
  return ({ submitted: 'Awaiting Dean Review', in_evaluation: 'Review in Progress', returned_for_revision: 'Returned for Revision', ready_for_finalization: 'Endorsed to HR', completed: 'Completed' })[status] || status
}

function ReviewQueue({ embedded = false, overviewData = null }) {
  const location = useLocation()
  const returnNotice = location.state?.portfolioReturnSuccess
  const [params, setParams] = useSearchParams()
  const tab = statusOptions.some(([key]) => key === params.get('status')) ? params.get('status') : 'needs_review'
  const [search, setSearch] = useState(params.get('search') || '')
  const [program, setProgram] = useState(params.get('program') || '')
  const [department, setDepartment] = useState(params.get('department') || '')
  const [state, setState] = useState(() => overviewData ? { phase: 'success', data: overviewData, error: '' } : { phase: 'idle', data: null, error: '' })
  useEffect(() => {
    setSearch(params.get('search') || '')
    setProgram(params.get('program') || '')
    setDepartment(params.get('department') || '')
  }, [params])

  const load = useCallback(async () => {
    setState(current => ({ ...current, phase: 'loading', error: '' }))
    try {
      const data = await getDeanReviews({ status: tab, search: params.get('search') || '', program: params.get('program') || '', department: params.get('department') || '', ...(params.get('period') ? { evaluation_period_id: params.get('period') } : {}) })
      setState({ phase: 'success', data, error: '' })
    } catch (error) {
      const apiError = error?.error || error?.response?.data?.error || {}
      const messages = {
        DEAN_ASSIGNMENT_NOT_FOUND: 'No active Dean assignment was found.',
        DEAN_COLLEGE_SCOPE_MISSING: 'Your Dean role does not have an assigned college.',
        WORKSPACE_SCOPE_FORBIDDEN: 'This review is outside your assigned college.',
        DEAN_ASSIGNMENT_REQUIRED: 'Your Dean role does not currently have an active college assignment.'
      }
      setState({ phase: 'error', data: null, error: messages[apiError.code] || apiError.message || 'Unable to load faculty ranking reviews.' })
    }
  }, [params, tab])

  useEffect(() => {
    if (overviewData) setState({ phase: 'success', data: overviewData, error: '' })
    else load()
  }, [load, overviewData])

  const updateParams = useCallback((changes, options = {}) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setParams(next, options)
  }, [params, setParams])

  useEffect(() => {
    const currentSearch = params.get('search') || ''
    if (search === currentSearch) return undefined
    const timer = window.setTimeout(() => updateParams({ search }, { replace: true }), 300)
    return () => window.clearTimeout(timer)
  }, [params, search, updateParams])

  const data = state.data
  const counts = data?.counts || {}
  const reviews = useMemo(() => (data?.reviews || []).filter(review => {
    const version = Number(review.version_number || 1)
    const resubmitted = version > 1 && ['submitted', 'in_evaluation'].includes(review.status)
    const statusMatch = tab === 'all' ? true
      : tab === 'resubmitted' ? resubmitted
      : tab === 'returned' ? review.status === 'returned_for_revision'
        : tab === 'endorsed' ? review.status === 'ready_for_finalization'
          : tab === 'completed' ? review.status === 'completed'
            : review.dean_review_status === 'needs_review'
    const query = (params.get('search') || '').trim().toLocaleLowerCase()
    const searchMatch = !query || [review.full_name, review.institutional_id, review.program_name, review.department_name].some(value => String(value || '').toLocaleLowerCase().includes(query))
    const programMatch = !params.get('program') || String(review.program_id || '') === params.get('program')
    const departmentMatch = !params.get('department') || String(review.department_id || '') === params.get('department')
    return statusMatch && searchMatch && programMatch && departmentMatch
  }), [data, params, tab])
  const Root = embedded ? 'div' : 'main'

  return <Root className={embedded ? 'min-w-0 space-y-5' : 'mx-auto max-w-6xl space-y-6 py-4'}>
    {returnNotice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">{returnNotice}</div>}
    {!embedded && <header>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Portfolio Evaluation</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Academic faculty under your college requiring Dean review.</p>
    </header>}

    {state.phase === 'loading' && <div className="space-y-3" aria-busy="true" aria-label="Loading faculty ranking reviews"><div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" /><div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" /></div>}

    {state.phase === 'error' && <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
      <AlertCircle className="h-5 w-5" /><h2 className="mt-2 font-bold">Faculty review queue unavailable</h2><p className="mt-1 text-sm">{state.error}</p>
      <button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-900 px-3 py-2 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" />Try Again</button>
    </section>}

    {!embedded && state.phase === 'success' && !data?.evaluation_period && <section className="rounded-xl border border-slate-200 px-6 py-12 text-center dark:border-slate-800">
      <CalendarDays className="mx-auto h-7 w-7 text-slate-400" /><h2 className="mt-3 font-extrabold text-slate-950 dark:text-white">No active evaluation period</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">HR has not opened a current ranking/evaluation period.</p>
    </section>}
    {embedded && state.phase === 'success' && !data?.evaluation_period && <section className="rounded-xl border border-slate-200 px-6 py-10 text-center dark:border-slate-800"><CalendarDays className="mx-auto h-7 w-7 text-slate-400" /><h2 className="mt-3 font-bold text-slate-950 dark:text-white">No active faculty ranking cycle</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">HR has not opened a current evaluation period.</p></section>}

    {state.phase === 'success' && data?.evaluation_period && <>
      {embedded && data.read_only && <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">Historical period · records are read only</p>}
      {embedded && <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-lg font-black text-slate-950 dark:text-white">Faculty Portfolios</h2><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{counts.needs_review || 0} need review</p></div>}
      {!embedded && <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800"><div><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.ranking_cycle?.display_name || data.evaluation_period.name}</p><p className="mt-0.5 text-xs text-slate-500">Faculty track · {data.evaluation_period.name}</p></div><p className="text-xs font-semibold text-slate-500">{data.workspace?.college_name} · {data.ranking_cycle?.lifecycle_status?.label || data.evaluation_period.status_label}</p></div>}
      <div className="flex flex-wrap items-start gap-2">
        <label className="relative min-w-[min(100%,18rem)] flex-1"><span className="sr-only">Search faculty by name or ID</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search faculty..." className="h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950" />{search && <button type="button" onClick={() => { setSearch(''); updateParams({ search: '' }, { replace: true }) }} aria-label="Clear search" className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>}</label>
        <details className="relative"><summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"><Filter className="h-4 w-4" />Filter{(tab !== 'needs_review' || program || department) && <span className="rounded-full bg-emerald-100 px-1.5 text-xs text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100" aria-label="Filters active">{Number(tab !== 'needs_review') + Number(Boolean(program)) + Number(Boolean(department))}</span>}<ChevronDown className="h-4 w-4" /></summary>
          <div className="absolute right-0 z-20 mt-2 grid w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-950"><label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">Portfolio status<select value={tab} onChange={e => updateParams({ status: e.target.value === 'needs_review' ? '' : e.target.value })} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900">{statusOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">Program<select value={program} onChange={e => { setProgram(e.target.value); updateParams({ program: e.target.value }) }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"><option value="">All programs</option>{(data.programs || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">Department<select value={department} onChange={e => { setDepartment(e.target.value); updateParams({ department: e.target.value }) }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal dark:border-slate-700 dark:bg-slate-900"><option value="">All departments</option>{(data.departments || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button type="button" onClick={() => { setSearch(''); setProgram(''); setDepartment(''); updateParams({ search: '', program: '', department: '', status: '' }) }} className="min-h-9 justify-self-start rounded-lg px-2 text-sm font-bold text-emerald-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Reset Filters</button></div>
        </details>
      </div>
      {!reviews.length ? <section className="rounded-xl border border-slate-200 px-6 py-12 text-center dark:border-slate-800 dark:text-slate-300"><h3 className="font-bold text-slate-900 dark:text-white">{search ? 'No matching faculty found.' : (program || department) ? 'No portfolios match these filters.' : (emptyMessages[tab] || emptyMessages.needs_review)[0]}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{search ? 'Try another name or clear your search.' : (program || department) ? 'Try changing or resetting the selected filters.' : (emptyMessages[tab] || emptyMessages.needs_review)[1]}</p>{(search || program || department) && <button type="button" onClick={() => { setSearch(''); setProgram(''); setDepartment(''); updateParams({ search: '', program: '', department: '' }, { replace: true }) }} className="mt-3 rounded-lg px-3 py-2 text-sm font-bold text-emerald-800 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">{search ? 'Clear search' : 'Reset filters'}</button>}</section> : <section aria-label="Faculty portfolios" className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">{reviews.map(review => <Link key={review.id} to={deanReviewDetailRoute(review.id, { person: review.personnel_profile_id, period: params.get('period'), status: tab, search: params.get('search'), program: params.get('program'), department: params.get('department') })} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-emerald-50 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 dark:hover:bg-emerald-950/30"><div className="min-w-0"><p className="truncate font-bold text-slate-950 dark:text-white">{review.full_name}</p><p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">{review.current_rank_title || review.position_title || 'Position not recorded'}{data.workspace?.college_name && ` — ${data.workspace.college_name}`}</p>{review.status === 'returned_for_revision' && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Waiting for the faculty member to submit a corrected portfolio.</p>}</div><div className="flex shrink-0 items-center gap-3"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{friendlyStatus(review.status, Number(review.version_number || 1))}</span><span className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white">{review.status === 'returned_for_revision' ? 'View Details' : overviewData?.read_only ? 'View record' : review.dean_review_status === 'needs_review' ? 'Evaluate' : 'View'}<span aria-hidden="true">→</span></span></div></Link>)}</section>}
    </>}
  </Root>
}

function ReviewDetail({ evaluationId, embedded = false, summaryMode = false, onViewAnnualReview, onRefreshOverview }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' })
  const load = useCallback(async (refreshOverview = false) => {
    setState(current => ({ phase: current.data ? 'success' : 'loading', data: current.data, error: '' }))
    try {
      const data = await getDeanReviewDetail(evaluationId)
      setState({ phase: 'success', data, error: '' })
      if (refreshOverview) {
        try { await onRefreshOverview?.() } catch { /* Detail is current even if the queue refresh fails. */ }
      }
      return data
    } catch (error) {
      setState({ phase: 'error', data: null, error: error?.response?.data?.error?.message || error?.message || 'Unable to load this portfolio.' })
      throw error
    }
  }, [evaluationId, onRefreshOverview])
  // load() is async; keep the effect body a block so React never receives the promise as a cleanup.
  useEffect(() => { load().catch(() => {}) }, [load])
  useEffect(() => {
    const refreshWhenFocused = () => {
      if (document.visibilityState === 'visible') load().catch(() => {})
    }
    window.addEventListener('focus', refreshWhenFocused)
    return () => window.removeEventListener('focus', refreshWhenFocused)
  }, [load])
  const Root = embedded ? 'div' : 'main'
  if (state.phase === 'loading') return <Root className={embedded ? 'space-y-3' : 'mx-auto max-w-6xl space-y-3 py-4'} aria-busy="true"><div className="h-9 w-64 animate-pulse rounded bg-slate-200" /><div className="h-72 animate-pulse rounded-xl bg-slate-100" /></Root>
  if (state.phase === 'error') return <Root className={embedded ? 'mx-auto max-w-3xl py-5' : 'mx-auto max-w-3xl py-10'}><div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900"><AlertCircle className="h-5 w-5" /><h1 className="mt-2 font-bold">Portfolio review unavailable</h1><p className="mt-1 text-sm">{state.error}</p><button onClick={load} className="mt-4 rounded-lg bg-rose-900 px-3 py-2 text-sm font-bold text-white">Try Again</button></div></Root>
  const review=state.data?.review || {}
  const queueParams = new URLSearchParams(params)
  queueParams.set('tab', summaryMode ? 'summaries' : 'portfolio')
  queueParams.delete('evaluation')
  queueParams.delete('person')
  if (summaryMode) queueParams.delete('status')
  if (review.status === 'returned_for_revision') queueParams.set('status', 'returned')
  const backToFacultyEvaluation = `${DEAN_ROUTES.FACULTY_EVALUATION}?${queueParams.toString()}`
  const onReturned = async () => {
    await onRefreshOverview?.()
    const returnedParams = new URLSearchParams(queueParams)
    returnedParams.set('status', 'returned')
    navigate(`${DEAN_ROUTES.FACULTY_EVALUATION}?${returnedParams.toString()}`, {
      replace: true,
      state: { portfolioReturnSuccess: 'Portfolio returned successfully. Waiting for faculty revision.' },
    })
  }
  const readOnly = state.data?.read_only === true
  if (summaryMode && !['ready_for_finalization', 'completed'].includes(review.status)) return <Root className="space-y-4"><Link to={backToFacultyEvaluation} className="text-sm font-bold text-emerald-800">← Back to Evaluation Summaries</Link><section role="alert" className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"><h1 className="font-bold text-slate-950 dark:text-white">Evaluation summary unavailable</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">This portfolio has not been endorsed to HR or completed.</p></section></Root>
  return <Root className={embedded ? 'space-y-5' : 'mx-auto max-w-[1500px] space-y-5 py-4'}><Link to={backToFacultyEvaluation} className={review.status === 'returned_for_revision' ? "inline-flex min-h-10 items-center rounded-lg border border-emerald-700 bg-white px-4 py-2 text-sm font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:bg-slate-950 dark:text-emerald-200" : "text-sm font-bold text-emerald-800"}>← Back to {summaryMode ? 'Evaluation Summaries' : 'Faculty Evaluation'}</Link><header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black text-slate-950 dark:text-white">{summaryMode ? 'Evaluation Summary' : review.status === 'returned_for_revision' ? 'Returned Portfolio' : readOnly ? 'Historical Portfolio' : 'Review Portfolio'}</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.full_name} · {review.institutional_id} · Version {review.version_number || 1}</p>{summaryMode ? <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">Official evaluation result</p> : readOnly && <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">Historical record · read only</p>}</div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{review.college_name} · {friendlyStatus(review.status, Number(review.version_number || 1))}</p>{!summaryMode && review.status !== 'returned_for_revision' && <button type="button" onClick={() => onViewAnnualReview?.(review.personnel_profile_id)} className="rounded-lg border border-emerald-700 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/30">View Annual Review &amp; Eligibility</button>}</div></header><DeanPortfolioEvaluationWorkspace data={state.data} readOnly={readOnly || summaryMode} onReload={() => load(true)} onReturned={onReturned} /></Root>
}

export default function DeanPortfolioEvaluationTab({ embedded = false, summaryMode = false, overviewData = null, onViewAnnualReview, onRefreshOverview }) {
  const { evaluationId: pathEvaluationId } = useParams()
  const [params] = useSearchParams()
  const evaluationId = embedded ? params.get('evaluation') : pathEvaluationId
  return evaluationId ? <ReviewDetail evaluationId={evaluationId} embedded={embedded} summaryMode={summaryMode} onViewAnnualReview={onViewAnnualReview} onRefreshOverview={onRefreshOverview} /> : <ReviewQueue embedded={embedded} overviewData={overviewData} />
}
