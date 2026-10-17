import React, { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import CompletedEvaluationSummary from '../../components/evaluation/CompletedEvaluationSummary'
import FacultyEvaluationSummary from '../../components/evaluation/FacultyEvaluationSummary'
import hrEvaluationService from '../../services/hrEvaluationService'
import { getRankingCycle } from '../../services/personnelEvaluationPeriodService'
import { formatRange } from './ranking-cycles/rankingCyclePresentation'
import { HR_PERIOD_WORKSPACE_TABS } from '../../utils/hrRankingNavigation'

export default function EvaluationSummaryPage() {
  const { cycleId, trackKey, evaluationId } = useParams()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState({ phase: 'loading', result: null, report: null, context: null, canFinalize: false, error: '' })
  const [cycle, setCycle] = useState(null)
  const [finalizing, setFinalizing] = useState(false)
  const [actionError, setActionError] = useState('')
  const fromEvaluation = searchParams.get('from') === 'portfolio-evaluation'
  const resultsParams = new URLSearchParams(searchParams)
  resultsParams.set('tab', fromEvaluation ? 'portfolio-evaluation' : 'evaluation-summaries')
  resultsParams.set('period', cycleId)
  if (!['all', 'faculty', 'non-teaching-faculty'].includes(resultsParams.get('track'))) {
    resultsParams.set('track', trackKey)
  }
  resultsParams.delete('stage')
  resultsParams.delete('personnelType')
  resultsParams.delete('from')
  resultsParams.delete('return_to')
  const originalWorkspace = searchParams.get('return_to')
  const resultsPath = /^\/hr\/ranking-cycles(?:\?|\/)/.test(originalWorkspace || '')
    && !originalWorkspace.includes('/summary')
    && !originalWorkspace.includes('return_to=')
    ? originalWorkspace
    : `/hr/ranking-cycles?${resultsParams.toString()}`

  useEffect(() => {
    let current = true
    getRankingCycle(cycleId).then(response => {
      if (current) setCycle(response?.cycle || response)
    }).catch(() => { if (current) setCycle(null) })
    return () => { current = false }
  }, [cycleId])

  useEffect(() => {
    let current = true
    setState({ phase: 'loading', result: null, report: null, context: null, canFinalize: false, error: '' })
    setActionError('')
    Promise.allSettled([
      hrEvaluationService.getReport(evaluationId),
      hrEvaluationService.workspace(cycleId, trackKey, 'evaluation'),
    ]).then(async ([reportOutcome, workspaceOutcome]) => {
      if (!current) return
      if (reportOutcome.status !== 'fulfilled') throw reportOutcome.reason
      let response = reportOutcome.value
      const row = workspaceOutcome.status === 'fulfilled'
        ? (workspaceOutcome.value?.rows || []).find(entry => String(entry.evaluation?.id) === String(evaluationId))
        : null
      const canFinalize = Boolean(row?.allowed_actions?.includes('finalize_evaluation')
        || (response?.result?.personnel?.group === 'NON_TEACHING_FACULTY' && response?.summary_context?.comments_editable))
      if (response?.result?.personnel?.group === 'NON_TEACHING_FACULTY'
        && response?.result?.evaluation?.status === 'ready_for_finalization' && canFinalize) {
        try {
          await hrEvaluationService.finalize(evaluationId)
          response = await hrEvaluationService.getReport(evaluationId)
        } catch (error) {
          if (current) setActionError(error?.response?.data?.error?.message || error?.message || 'The official result could not be created.')
        }
      }
      if (current) setState({ phase: 'ready', result: response?.result || null, report: response?.report?.snapshot || null, context: response?.summary_context || null, canFinalize, error: '' })
    }).catch(error => {
      if (current) setState({ phase: 'error', result: null, report: null, context: null, canFinalize: false, error: error?.response?.data?.error?.message || error?.message || 'The evaluation summary could not be loaded.' })
    })
    return () => { current = false }
  }, [cycleId, evaluationId, trackKey])

  const finalize = async () => {
    if (!state.canFinalize || finalizing) return
    setFinalizing(true)
    setActionError('')
    try {
      await hrEvaluationService.finalize(evaluationId)
      const response = await hrEvaluationService.getReport(evaluationId)
      setState({ phase: 'ready', result: response?.result || null, report: response?.report?.snapshot || null, context: response?.summary_context || null, canFinalize: false, error: '' })
    } catch (error) {
      setActionError(error?.response?.data?.error?.message || error?.message || 'The evaluation could not be finalized.')
    } finally {
      setFinalizing(false)
    }
  }

  const saveComments = async comments => {
    await hrEvaluationService.saveSummaryComments(evaluationId, comments)
    const response = await hrEvaluationService.getReport(evaluationId)
    setState(current => ({ ...current, report: response?.report?.snapshot || current.report, context: response?.summary_context || current.context }))
  }

  const awaitingNonTeachingFinalization = state.result?.personnel?.group === 'NON_TEACHING_FACULTY'
    && state.result?.evaluation?.status === 'ready_for_finalization'

  const selectedTab = fromEvaluation ? 'portfolio-evaluation' : 'evaluation-summaries'
  const workspaceHref = tab => {
    const params = new URLSearchParams()
    params.set('tab', tab)
    params.set('period', cycleId)
    if (tab !== 'evaluation-criteria') params.set('track', trackKey)
    return `/hr/ranking-cycles?${params.toString()}`
  }
  const isNonTeaching = state.result?.personnel?.group === 'NON_TEACHING_FACULTY'

  return <main className="mx-auto max-w-[1500px] space-y-5 pb-8">
    {cycle && <section aria-label="Current ranking period" className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/25">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800 dark:text-emerald-300"/><div><p className="text-xs font-black uppercase tracking-widest text-emerald-900 dark:text-emerald-200">Current ranking period</p><p className="mt-1 font-bold text-slate-950 dark:text-white">{cycle.display_name}</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-200">Submission: {formatRange(cycle.schedule?.submission_open_at, cycle.schedule?.submission_close_at)} <span className="mx-2" aria-hidden="true">·</span> Evaluation: {formatRange(cycle.schedule?.evaluation_start_at, cycle.schedule?.evaluation_end_at)}</p></div></div>
        <span className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-900 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-200">{cycle.lifecycle_status?.label || cycle.lifecycle_status?.key || 'Ranking period'}</span>
      </div>
      <nav aria-label="Ranking period workspace" className="flex flex-wrap border-t border-emerald-200 bg-white px-2 dark:border-emerald-900 dark:bg-slate-950 sm:px-4">{HR_PERIOD_WORKSPACE_TABS.filter(tab => tab.key !== 'annual-reviews' || cycle.tracks?.some(track => track.personnel_group === 'FACULTY')).map(tab => <Link key={tab.key} to={workspaceHref(tab.key)} aria-current={selectedTab === tab.key ? 'page' : undefined} className={`inline-flex min-h-12 items-center border-b-2 px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 sm:px-4 ${selectedTab === tab.key ? 'border-emerald-700 text-emerald-900 dark:text-emerald-200' : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'}`}>{tab.label}</Link>)}</nav>
    </section>}
    <nav aria-label="Evaluation summary navigation" className="w-full">
      <Link to={resultsPath} className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-emerald-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300"><ArrowLeft aria-hidden="true" className="h-4 w-4"/>Back to {fromEvaluation ? 'Portfolio Evaluation' : 'Evaluation Summaries'}</Link>
    </nav>
    {state.phase === 'loading' && <div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/>}
    {state.phase === 'error' && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:bg-rose-950/30 dark:text-rose-100">{state.error}</div>}
    {actionError && <div role="alert" className="mx-auto flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:bg-rose-950/30 dark:text-rose-100"><span>{actionError}</span>{awaitingNonTeachingFinalization && state.canFinalize && <button type="button" disabled={finalizing} onClick={finalize} className="rounded-lg bg-emerald-800 px-4 py-2 font-bold text-white disabled:opacity-50">{finalizing ? 'Completing…' : 'Retry completion'}</button>}</div>}
    {state.phase === 'ready' && state.result?.personnel?.group === 'FACULTY' && state.report?.status === 'endorsed_to_hr' && <FacultyEvaluationSummary report={state.report} context={state.context || {}} onDownloadPdf={() => hrEvaluationService.downloadSummaryPdf(evaluationId)}/>}
    {state.phase === 'ready' && isNonTeaching && <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-black text-slate-950 dark:text-white">Review Portfolio</h1><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{state.result.personnel?.name} · Version {state.result.evaluation?.version_number || 1}</p></div><p className="text-sm font-bold text-slate-900 dark:text-slate-100">{state.result.personnel?.department || 'Non-Teaching Personnel'} · {awaitingNonTeachingFinalization ? 'Review completed' : 'Evaluation completed'}</p></header>}
    {state.phase === 'ready' && (state.result?.personnel?.group !== 'FACULTY' || state.report?.status !== 'endorsed_to_hr') && state.result && <CompletedEvaluationSummary result={state.result} preview={awaitingNonTeachingFinalization} context={state.context || {}} onSaveComments={awaitingNonTeachingFinalization ? saveComments : undefined} embedded={isNonTeaching}/>}
  </main>
}
