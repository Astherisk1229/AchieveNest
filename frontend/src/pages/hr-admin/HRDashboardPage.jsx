import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchHRDashboard } from '../../services/hrAdminService'
import { hrEvaluationService } from '../../services/hrEvaluationService'
import { listRankingCycles } from '../../services/personnelEvaluationPeriodService'
import { featuredCycle, formatRange, workspacePath } from './ranking-cycles/rankingCyclePresentation'
import { LifecycleBadge } from './ranking-cycles/RankingCycleBadges'

const hasAction = (row, actions) => (row?.allowed_actions || []).some(action => actions.includes(action))
const trackWorkspacePath = (cycle, stage) => {
  const track = cycle?.tracks?.[0]
  if (!cycle || !track) return '/hr/ranking-cycles'
  return workspacePath(cycle, track.personnel_group).replace(/\/[^/]+$/, `/${stage}`)
}

function Skeleton() {
  return <div aria-label="Loading dashboard" className="animate-pulse space-y-4"><div className="h-9 w-56 rounded bg-slate-200 dark:bg-slate-800"/><div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-900"/></div>
}

export function HRDashboard() {
  const [summary, setSummary] = useState(null)
  const [cycleData, setCycleData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [summaryResponse, cycleResponse] = await Promise.all([fetchHRDashboard(), listRankingCycles()])
      const nextSummary = summaryResponse?.data || summaryResponse
      const cycles = cycleResponse?.cycles || []
      const featured = featuredCycle(cycles)
      let roster = []
      let actionable = 0
      if (featured) {
        const tracks = featured.tracks || []
        const workspaces = await Promise.all(tracks.map(async track => {
          const key = track.personnel_group === 'NON_TEACHING_FACULTY' ? 'non-teaching-faculty' : 'faculty'
          const [submissions, evaluation] = await Promise.all([
            hrEvaluationService.workspace(featured.id, key, 'submissions'),
            hrEvaluationService.workspace(featured.id, key, 'evaluation')
          ])
          return { submissions: submissions?.rows || [], evaluation: evaluation?.rows || [] }
        }))
        roster = workspaces.flatMap(result => result.submissions)
        actionable = workspaces.flatMap(result => result.evaluation).filter(row => hasAction(row, ['start_evaluation', 'evaluate_items', 'return_for_revision', 'mark_ready', 'review_final_rank', 'finalize_evaluation'])).length
      }
      setSummary(nextSummary)
      setCycleData({ featured, roster, actionable })
    } catch (loadError) {
      setError(loadError?.error?.message || loadError?.message || 'Dashboard information could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    if (cycleData?.featured?.lifecycle_status?.key !== 'UPCOMING') return undefined
    const timer = window.setInterval(() => { void load() }, 60_000)
    return () => window.clearInterval(timer)
  }, [cycleData?.featured?.lifecycle_status?.key, load])

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }
  const featured = cycleData?.featured
  const submitted = cycleData?.roster?.filter(row => row.submission_status === 'submitted').length || 0
  const eligible = cycleData?.roster?.length || 0
  const remaining = Math.max(0, eligible - submitted)
  const attention = useMemo(() => {
    const items = []
    if (cycleData?.actionable > 0) items.push({ count: cycleData.actionable, title: 'Evaluations awaiting HR review', href: trackWorkspacePath(featured, 'evaluation'), action: 'Open Evaluation Queue' })
    if (Number(summary?.colleges_without_dean || 0) > 0) items.push({ count: Number(summary.colleges_without_dean), title: 'Colleges without an assigned Dean', href: '/hr/organizational-structure', action: 'View Colleges' })
    return items
  }, [cycleData, featured, summary])

  if (loading && !summary) return <main className="space-y-8"><Skeleton/><Skeleton/></main>

  return <main className="space-y-8 pb-10 text-[#12211A] selection:bg-emerald-200 selection:text-emerald-950 dark:text-slate-100">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DDE8E2] pb-5 dark:border-slate-800">
      <div><h1 className="text-3xl font-black tracking-[-0.025em] sm:text-4xl">HR Dashboard</h1><p className="mt-2 text-sm text-[#66766E] dark:text-slate-300">Overview of your HR workspace</p></div>
      {featured && <div className="flex items-center gap-3 rounded-xl bg-[#F1F7F3] px-4 py-3 dark:bg-slate-900"><CalendarDays className="h-5 w-5 text-[#087443]"/><div><p className="text-xs text-[#66766E] dark:text-slate-400">Active Ranking Period</p><p className="font-bold">{featured.display_name}</p><LifecycleBadge status={featured.lifecycle_status}/></div></div>}
    </header>

    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}

    <section aria-label="HR dashboard key metrics" className="grid gap-4 sm:grid-cols-3">
      <Link to="/hr/personnel-directory" className="rounded-xl border border-[#DDE8E2] bg-white p-5 transition-colors hover:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#66766E] dark:text-slate-300">Active Personnel</span><Users className="h-5 w-5 text-[#087443]"/></div><p className="mt-3 text-3xl font-black tabular-nums">{summary?.total_personnel ?? '—'}</p><span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#087443]">Personnel Directory <ArrowRight className="h-4 w-4"/></span></Link>
      <Link to={trackWorkspacePath(featured, 'evaluation')} className="rounded-xl border border-[#DDE8E2] bg-white p-5 transition-colors hover:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#66766E] dark:text-slate-300">Awaiting HR Review</span><Clock3 className="h-5 w-5 text-[#087443]"/></div><p className="mt-3 text-3xl font-black tabular-nums">{cycleData?.actionable ?? '—'}</p><span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#087443]">Open Evaluation Queue <ArrowRight className="h-4 w-4"/></span></Link>
      <Link to={trackWorkspacePath(featured, 'submissions')} className="rounded-xl border border-[#DDE8E2] bg-white p-5 transition-colors hover:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#66766E] dark:text-slate-300">Submitted Portfolios</span><CheckCircle2 className="h-5 w-5 text-[#087443]"/></div><p className="mt-3 text-3xl font-black tabular-nums">{cycleData ? submitted : '—'}</p><span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#087443]">View Ranking Period <ArrowRight className="h-4 w-4"/></span></Link>
    </section>

    <section aria-labelledby="attention-heading"><div className="flex items-center justify-between"><h2 id="attention-heading" className="text-xl font-black">Needs Attention</h2><button type="button" onClick={refresh} disabled={refreshing} className="rounded-lg px-3 py-2 text-sm font-bold text-[#087443] hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50 dark:hover:bg-slate-800">{refreshing ? 'Refreshing…' : 'Refresh'}</button></div>{attention.length ? <ul className="mt-3 divide-y divide-[#DDE8E2] border-y border-[#DDE8E2] dark:divide-slate-800 dark:border-slate-800">{attention.map(item => <li key={item.title} className="flex flex-wrap items-center justify-between gap-3 py-4"><p className="font-semibold"><span className="mr-2 font-black tabular-nums">{item.count}</span>{item.title}</p><Link to={item.href} className="inline-flex items-center gap-1 rounded-lg bg-[#087443] px-3 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{item.action}<ArrowRight className="h-4 w-4"/></Link></li>)}</ul> : <p className="mt-3 rounded-xl bg-[#EAF6EF] p-4 text-sm font-semibold text-[#064E32] dark:bg-emerald-950 dark:text-emerald-200">You’re all caught up. No actionable HR issues were reported.</p>}</section>

    <section aria-labelledby="period-heading"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 id="period-heading" className="text-xl font-black">Current Ranking Period</h2>{featured && <><p className="mt-1 font-bold">{featured.display_name}</p><p className="mt-1 text-sm text-[#66766E] dark:text-slate-300">{featured.academic_year_label || featured.academic_year} · Submission {formatRange(featured.schedule?.submission_open_at, featured.schedule?.submission_close_at)}</p></>}</div></div>{!featured ? <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-[#66766E] dark:text-slate-300">{error ? 'Ranking period details could not be loaded.' : 'No active or upcoming ranking period is configured.'}</p> : <div className="mt-3 rounded-xl border border-[#DDE8E2] bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex flex-wrap items-center justify-between gap-4"><div><LifecycleBadge status={featured.lifecycle_status}/><p className="mt-3 text-sm text-[#66766E] dark:text-slate-300">{submitted} submitted · {remaining} remaining of {eligible} eligible personnel</p></div><Link to={workspacePath(featured)} className="inline-flex items-center gap-2 rounded-lg bg-[#087443] px-4 py-2.5 text-sm font-bold text-white">View Period <ArrowRight className="h-4 w-4"/></Link></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Portfolio submission progress" aria-valuemin="0" aria-valuemax={eligible} aria-valuenow={submitted}><div className="h-full rounded-full bg-[#087443] transition-[width]" style={{ width: `${eligible ? Math.min(100, submitted / eligible * 100) : 0}%` }}/></div></div>}</section>
  </main>
}

export const HRDashboardPage = HRDashboard
export default HRDashboard
