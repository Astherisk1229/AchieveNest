import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, ChevronDown, RefreshCw, Search } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getDeanReviewDetail, getDeanReviews } from '../../services/deanWorkspaceService'
import { DEAN_ROUTES } from '../../config/deanRoutes'
import DeanPortfolioEvaluationWorkspace from './DeanPortfolioEvaluationWorkspace'

const tabs = [
  ['needs_review', 'Needs Review'], ['resubmitted', 'Resubmitted'], ['returned', 'Returned'],
  ['endorsed', 'Endorsed to HR'], ['completed', 'Completed']
]

const emptyMessages = {
  needs_review: 'No academic faculty submissions currently require your review.',
  resubmitted: 'No returned portfolios have been resubmitted yet.',
  returned: 'No portfolios are currently waiting for faculty revision.',
  endorsed: 'No portfolios have been endorsed to HR in this period.',
  completed: 'No faculty ranking reviews are completed in this period.'
}

function friendlyStatus(status, version) {
  if (version > 1 && ['submitted', 'in_evaluation'].includes(status)) return 'Resubmitted'
  return ({ submitted: 'Awaiting Dean Review', in_evaluation: 'Review in Progress', returned_for_revision: 'Returned for Revision', ready_for_finalization: 'Endorsed to HR', completed: 'Completed' })[status] || status
}

function ReviewQueue() {
  const [params, setParams] = useSearchParams()
  const tab = tabs.some(([key]) => key === params.get('status')) ? params.get('status') : 'needs_review'
  const [search, setSearch] = useState(params.get('search') || '')
  const [program, setProgram] = useState(params.get('program') || '')
  const [state, setState] = useState({ phase: 'idle', data: null, error: '' })

  const load = useCallback(async () => {
    setState(current => ({ ...current, phase: 'loading', error: '' }))
    try {
      const data = await getDeanReviews({ status: tab, search: params.get('search') || '', program: params.get('program') || '' })
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

  useEffect(() => { load() }, [load])

  const updateParams = useCallback((changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setParams(next)
  }, [params, setParams])

  const submitSearch = (event) => { event.preventDefault(); updateParams({ search, program }) }
  const data = state.data
  const counts = data?.counts || {}
  const reviews = useMemo(() => data?.reviews || [], [data])

  return <main className="mx-auto max-w-6xl space-y-6 py-4">
    <header>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Faculty Ranking Reviews</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Academic faculty under your college requiring Dean review.</p>
    </header>

    {state.phase === 'loading' && <div className="space-y-3" aria-busy="true" aria-label="Loading faculty ranking reviews"><div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" /><div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" /></div>}

    {state.phase === 'error' && <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
      <AlertCircle className="h-5 w-5" /><h2 className="mt-2 font-bold">Faculty review queue unavailable</h2><p className="mt-1 text-sm">{state.error}</p>
      <button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-900 px-3 py-2 text-sm font-bold text-white"><RefreshCw className="h-4 w-4" />Try Again</button>
    </section>}

    {state.phase === 'success' && !data?.evaluation_period && <section className="rounded-xl border border-slate-200 px-6 py-12 text-center dark:border-slate-800">
      <CalendarDays className="mx-auto h-7 w-7 text-slate-400" /><h2 className="mt-3 font-extrabold text-slate-950 dark:text-white">No active evaluation period</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">HR has not opened a current ranking/evaluation period.</p>
    </section>}

    {state.phase === 'success' && data?.evaluation_period && <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800"><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{data.evaluation_period.name}</p><p className="text-xs font-semibold text-slate-500">{data.workspace?.college_name} · {data.evaluation_period.status_label}</p></div>
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-200" aria-label="Review status">
        {tabs.map(([key, label]) => <button key={key} type="button" onClick={() => updateParams({ status: key })} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-bold ${tab === key ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{label} <span className="ml-1 tabular-nums">{counts[key] || 0}</span></button>)}
      </nav>
      <form onSubmit={submitSearch} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)_auto]">
        <label className="relative"><span className="sr-only">Search faculty</span><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or personnel ID" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="relative"><span className="sr-only">Program or department</span><select value={program} onChange={e => setProgram(e.target.value)} className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">All programs / departments</option>{(data.programs || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" /></label>
        <button className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Apply</button>
      </form>
      {!reviews.length ? <section className="rounded-xl border border-slate-200 px-6 py-12 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">{emptyMessages[tab]}</section> : <section className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.8fr)_minmax(0,.8fr)] gap-4 bg-slate-50 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500 md:grid dark:bg-slate-900"><span>Faculty</span><span>Program / Rank</span><span>Submission</span><span>Status / Action</span></div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">{reviews.map(review => <article key={review.id} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.8fr)_minmax(0,.8fr)] md:items-center">
          <div><p className="font-bold text-slate-950 dark:text-white">{review.full_name}</p><p className="text-xs text-slate-500">{review.institutional_id}</p></div>
          <div><p className="text-sm font-semibold">{review.program_name || review.department_name || 'Program not recorded'}</p><p className="text-xs text-slate-500">{review.current_rank_title || review.position_title || 'Rank not recorded'}</p></div>
          <div><p className="text-sm font-bold">Version {review.version_number || 1}</p><p className="text-xs text-slate-500">{review.submitted_at ? new Date(review.submitted_at).toLocaleDateString() : 'Date unavailable'}</p></div>
          <div><p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{friendlyStatus(review.status, Number(review.version_number || 1))}</p><Link to={`${DEAN_ROUTES.FACULTY_RANKING_REVIEWS}/${encodeURIComponent(review.id)}`} className="mt-2 inline-flex rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white">Review Portfolio</Link></div>
        </article>)}</div>
      </section>}
    </>}
  </main>
}

function ReviewDetail({ evaluationId }) {
  const [state, setState] = useState({ phase: 'loading', data: null, error: '' })
  const load = useCallback(async () => { setState(current => ({ phase: 'loading', data: current.data, error: '' })); try { const data=await getDeanReviewDetail(evaluationId); setState({ phase: 'success', data, error: '' }); return data } catch(error) { setState({ phase: 'error', data: null, error: error?.response?.data?.error?.message || error?.message || 'Unable to load this portfolio.' }); throw error } }, [evaluationId])
  useEffect(load, [load])
  if (state.phase === 'loading') return <main className="mx-auto max-w-6xl space-y-3 py-4" aria-busy="true"><div className="h-9 w-64 animate-pulse rounded bg-slate-200" /><div className="h-72 animate-pulse rounded-xl bg-slate-100" /></main>
  if (state.phase === 'error') return <main className="mx-auto max-w-3xl py-10"><div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900"><AlertCircle className="h-5 w-5" /><h1 className="mt-2 font-bold">Portfolio review unavailable</h1><p className="mt-1 text-sm">{state.error}</p><button onClick={load} className="mt-4 rounded-lg bg-rose-900 px-3 py-2 text-sm font-bold text-white">Try Again</button></div></main>
  const review=state.data?.review || {}
  return <main className="mx-auto max-w-[1500px] space-y-5 py-4"><Link to={DEAN_ROUTES.FACULTY_RANKING_REVIEWS} className="text-sm font-bold text-emerald-800">← Faculty Ranking Reviews</Link><header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black text-slate-950 dark:text-white">Review Portfolio</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.full_name} · {review.institutional_id} · Version {review.version_number || 1}</p></div><p className="text-sm font-bold">{review.college_name} · {friendlyStatus(review.status, Number(review.version_number || 1))}</p></header><DeanPortfolioEvaluationWorkspace data={state.data} onReload={load} /></main>
}

export default function DeanFacultyRankingReviewsPage() {
  const { evaluationId } = useParams()
  return evaluationId ? <ReviewDetail evaluationId={evaluationId} /> : <ReviewQueue />
}
