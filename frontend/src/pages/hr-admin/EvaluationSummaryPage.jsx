import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import CompletedEvaluationSummary from '../../components/evaluation/CompletedEvaluationSummary'
import hrEvaluationService from '../../services/hrEvaluationService'

export default function EvaluationSummaryPage() {
  const { cycleId, trackKey, evaluationId } = useParams()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState({ phase: 'loading', result: null, error: '' })
  const resultsPath = `/hr/ranking-cycles/${encodeURIComponent(cycleId)}/${encodeURIComponent(trackKey)}/results?${searchParams.toString()}`

  useEffect(() => {
    let current = true
    setState({ phase: 'loading', result: null, error: '' })
    hrEvaluationService.getReport(evaluationId).then(response => {
      if (current) setState({ phase: 'ready', result: response?.result || response?.report?.snapshot || null, error: '' })
    }).catch(error => {
      if (current) setState({ phase: 'error', result: null, error: error?.response?.data?.error?.message || error?.message || 'The immutable evaluation summary could not be loaded.' })
    })
    return () => { current = false }
  }, [evaluationId])

  return <main className="space-y-5 pb-8">
    <Link to={resultsPath} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/30"><ArrowLeft className="h-4 w-4"/>Back to Results</Link>
    {state.phase === 'loading' && <div aria-busy="true" className="h-96 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900"/>}
    {state.phase === 'error' && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:bg-rose-950/30 dark:text-rose-100">{state.error}</div>}
    {state.phase === 'ready' && state.result && <CompletedEvaluationSummary result={state.result}/>} 
  </main>
}
