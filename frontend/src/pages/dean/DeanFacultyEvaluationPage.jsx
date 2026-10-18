import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, History, RefreshCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getDeanReviews, listDeanEvaluationPeriods } from '../../services/deanWorkspaceService'
import { DEAN_ROUTES } from '../../config/deanRoutes'
import DeanAnnualReviewEligibilityPage from './DeanAnnualReviewEligibilityPage'
import DeanPortfolioEvaluationTab from './DeanPortfolioEvaluationTab'
import DeanEvaluationSummariesTab from './DeanEvaluationSummariesTab'

export default function DeanFacultyEvaluationPage() {
  const [params, setParams] = useSearchParams()
  const requestedTab = params.get('tab')
  const tab = requestedTab === 'summaries' ? 'summaries' : requestedTab === 'portfolio' || params.has('evaluation') ? 'portfolio' : 'annual'
  const selectedPeriodId = params.get('period') || ''
  const [overview, setOverview] = useState({ phase: 'loading', data: null, error: '' })
  const [history, setHistory] = useState({ phase: 'loading', periods: [], error: '' })
  const [refreshKey, setRefreshKey] = useState(0)
  const [visitedTabs, setVisitedTabs] = useState(() => ({ annual: tab === 'annual', portfolio: tab === 'portfolio', summaries: tab === 'summaries' }))

  const loadOverview = useCallback(async () => {
    setOverview(current => ({ ...current, phase: 'loading', error: '' }))
    try {
      const data = await getDeanReviews({ status: 'all', ...(selectedPeriodId ? { evaluation_period_id: selectedPeriodId } : {}) })
      setOverview({ phase: 'success', data, error: '' })
      return data
    } catch (error) {
      const apiError = error?.error || error?.response?.data?.error || {}
      setOverview({ phase: 'error', data: null, error: apiError.message || error?.message || 'Faculty evaluation information could not be loaded.' })
      return null
    }
  }, [selectedPeriodId])

  useEffect(() => { loadOverview() }, [loadOverview])
  useEffect(() => {
    let live = true
    listDeanEvaluationPeriods().then(periods => { if (live) setHistory({ phase: 'success', periods, error: '' }) })
      .catch(error => { if (live) setHistory({ phase: 'error', periods: [], error: error?.response?.data?.error?.message || 'Previous periods could not be loaded.' }) })
    return () => { live = false }
  }, [])
  useEffect(() => { setVisitedTabs(current => current[tab] ? current : { ...current, [tab]: true }) }, [tab])

  const updateParams = useCallback((changes, { replace = false } = {}) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([key, value]) => value == null || value === '' ? next.delete(key) : next.set(key, String(value)))
    setParams(next, { replace })
  }, [params, setParams])

  const setTab = nextTab => {
    setVisitedTabs(current => current[nextTab] ? current : { ...current, [nextTab]: true })
    updateParams({ tab: nextTab, evaluation: '' })
  }
  const selectPeriod = value => updateParams({ period: value === 'current' ? '' : value, evaluation: '', person: '' })

  const portfolioByPersonnel = useMemo(() => Object.fromEntries((overview.data?.reviews || []).map(review => [String(review.personnel_profile_id), review])), [overview.data?.reviews])
  const openPortfolio = personnelId => {
    const review = portfolioByPersonnel[String(personnelId)]
    if (!review?.id) return
    updateParams({ tab: 'portfolio', person: personnelId, evaluation: review.id })
  }
  const openAnnualReview = personnelId => updateParams({ tab: 'annual', person: personnelId, evaluation: '' })
  const period = overview.data?.evaluation_period
  const cycle = overview.data?.ranking_cycle
  const previousPeriods = history.periods.filter(item => selectedPeriodId || String(item.id) !== String(period?.id || ''))
  const formatPeriodDate = value => {
    if (!value) return null
    const parsed = new Date(String(value).replace(' ', 'T'))
    return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const submissionStart = formatPeriodDate(period?.submission_open_at)
  const submissionEnd = formatPeriodDate(period?.submission_close_at)
  const evaluationStart = formatPeriodDate(period?.evaluation_start_at)
  const evaluationEnd = formatPeriodDate(period?.evaluation_end_at)
  const dateRange = (start, end) => start && end ? `${start} – ${end}` : start || end || 'Not scheduled'
  return <main className="mx-auto max-w-[1500px] space-y-5 py-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Faculty Evaluation</h1>
      <button type="button" onClick={async () => { await loadOverview(); setRefreshKey(value => value + 1) }} disabled={overview.phase === 'loading'} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60 dark:border-slate-700"><RefreshCw className={`h-4 w-4 ${overview.phase === 'loading' ? 'animate-spin' : ''}`} />Refresh</button>
    </header>

    {overview.phase === 'loading' && !overview.data && <div aria-busy="true" aria-label="Loading ranking cycle" className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />}
    {overview.phase === 'error' && <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">{overview.error}</section>}
    {overview.data && <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">{period ? <section aria-label="HR ranking period" className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:flex-row sm:items-start sm:justify-between dark:border-emerald-900 dark:bg-emerald-950/25"><div className="flex min-w-0 gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800 dark:text-emerald-300" /><div className="min-w-0"><p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">{cycle?.operational_enabled === false ? 'Ranking Period Disabled' : overview.data.read_only ? 'Historical Ranking Period' : 'Current Ranking Period'}</p><h2 className="mt-0.5 font-bold text-slate-950 dark:text-white">{cycle?.display_name || period.name}{cycle?.academic_year || period.academic_year ? ` · AY ${String(cycle?.academic_year || period.academic_year).replace('-', '–')}` : ''}</h2><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-700 dark:text-slate-300"><p><span className="font-bold">Submission:</span> {dateRange(submissionStart, submissionEnd)}</p><p><span className="font-bold">Evaluation:</span> {dateRange(evaluationStart, evaluationEnd)}</p></div></div></div><span className="inline-flex shrink-0 items-center self-start rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800">{cycle?.lifecycle_status?.label || period.status_label || period.status}</span></section> : <section role="status" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"><CalendarDays className="h-4 w-4 shrink-0 text-slate-400" /><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No active faculty ranking period</p></section>}{previousPeriods.length > 0 && <label className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"><History className="h-4 w-4 text-emerald-700 dark:text-emerald-300" /><span className="sr-only">View previous periods</span><select aria-label="View previous periods" value={selectedPeriodId || 'current'} onChange={event => selectPeriod(event.target.value)} className="max-w-[14rem] bg-transparent py-1 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><option value="current">Current period</option>{previousPeriods.map(item => <option key={item.id} value={item.id}>{item.display_name} · {item.status_label}</option>)}</select></label>}{history.phase === 'error' && <p role="status" className="sr-only">{history.error}</p>}</div>}

    {cycle?.operational_enabled === false && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">HR has temporarily disabled this ranking period. Existing records remain available in read-only mode.</p>}
    <div role="tablist" aria-label="Faculty evaluation stages" className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
      <button id="annual-review-tab" type="button" role="tab" aria-selected={tab === 'annual'} aria-controls="annual-review-panel" onClick={() => setTab('annual')} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${tab === 'annual' ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Annual Reviews</button>
      <button id="portfolio-evaluation-tab" type="button" role="tab" aria-selected={tab === 'portfolio'} aria-controls="portfolio-evaluation-panel" onClick={() => setTab('portfolio')} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${tab === 'portfolio' ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Portfolio Evaluation{period && Number.isFinite(Number(overview.data?.counts?.needs_review)) ? <span className="ml-1 tabular-nums">({overview.data.counts.needs_review})</span> : null}</button>
      <button id="evaluation-summaries-tab" type="button" role="tab" aria-selected={tab === 'summaries'} aria-controls="evaluation-summaries-panel" onClick={() => setTab('summaries')} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${tab === 'summaries' ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Evaluation Summaries{period && Number.isFinite(Number(overview.data?.counts?.endorsed + overview.data?.counts?.completed)) ? <span className="ml-1 tabular-nums">({overview.data.counts.endorsed + overview.data.counts.completed})</span> : null}</button>
    </div>

    <section id="annual-review-panel" role="tabpanel" aria-labelledby="annual-review-tab" hidden={tab !== 'annual'} className="min-w-0">{visitedTabs.annual && <DeanAnnualReviewEligibilityPage embedded deanWorkspace cycleId={cycle?.id || undefined} trackKey={cycle?.id ? 'faculty' : undefined} selectedPersonnelId={params.get('person') || ''} portfolioByPersonnel={portfolioByPersonnel} onViewPortfolio={openPortfolio} onSelectFaculty={person => updateParams({ person })} onClearSelected={() => updateParams({ person: '' })} onDataChanged={loadOverview} refreshKey={refreshKey} />}</section>
    <section id="portfolio-evaluation-panel" role="tabpanel" aria-labelledby="portfolio-evaluation-tab" hidden={tab !== 'portfolio'} className="min-w-0">{visitedTabs.portfolio && (overview.data ? <DeanPortfolioEvaluationTab embedded overviewData={overview.data} onViewAnnualReview={openAnnualReview} onRefreshOverview={loadOverview} /> : overview.phase === 'loading' ? <div aria-busy="true" className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" /> : null)}</section>
    <section id="evaluation-summaries-panel" role="tabpanel" aria-labelledby="evaluation-summaries-tab" hidden={tab !== 'summaries'} className="min-w-0">{visitedTabs.summaries && (overview.data ? params.get('evaluation') ? <DeanPortfolioEvaluationTab embedded summaryMode overviewData={overview.data} onRefreshOverview={loadOverview} /> : <DeanEvaluationSummariesTab reviews={overview.data.reviews || []} onViewSummary={evaluationId => updateParams({ tab: 'summaries', evaluation: evaluationId })} /> : overview.phase === 'loading' ? <div aria-busy="true" className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" /> : null)}</section>
    <span className="sr-only">Workspace route: {DEAN_ROUTES.FACULTY_EVALUATION}</span>
  </main>
}
