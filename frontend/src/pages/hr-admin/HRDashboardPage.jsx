import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, CalendarDays, CheckCircle2, Clock3, KeyRound, RefreshCw, ShieldCheck, UserRoundCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchHRAudit, fetchHRDashboard } from '../../services/hrAdminService'
import { getCurrentPersonnelEvaluationPeriod } from '../../services/personnelEvaluationPeriodService'

const activityLabels = {
  COLLEGE_DEAN_ASSIGNED: 'Dean assigned',
  COLLEGE_DEAN_REASSIGNED: 'Dean reassigned',
  master_data_updated: 'Personnel profile updated',
  classification_updated: 'Personnel classification updated',
  rank_changed: 'Personnel rank changed',
  evaluation_finalized: 'Evaluation finalized',
  password_reset: 'Personnel password reset',
  provisioned: 'Personnel account created',
  activated: 'Personnel account activated'
}

const readableEvent = event => {
  const code = String(event.event_type || event.event_code || '').trim()
  if (activityLabels[code]) return activityLabels[code]
  const normalized = code.replace(/[_-]+/g, ' ').trim().toLowerCase()
  if (!normalized || normalized === 'system action') return 'HR record updated'
  return normalized.replace(/\b\w/g, letter => letter.toUpperCase())
}

const activityContext = event => {
  let detail = event.detail
  if (typeof detail === 'string' && detail.trim().startsWith('{')) {
    try { detail = JSON.parse(detail).justification || JSON.parse(detail).reason || '' } catch { /* use subject fallback */ }
  }
  const subject = event.subject_name || event.target_name || ''
  const context = [subject, typeof detail === 'string' && detail !== '.' ? detail : ''].filter(Boolean)
  return context.join(' · ') || 'Institutional HR record'
}

const formatTimestamp = value => {
  if (!value) return 'Time not recorded'
  const date = new Date(String(value).replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function SectionSkeleton({ rows = 2 }) {
  return <div className="space-y-3" aria-label="Loading"><div className="h-6 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />{Array.from({ length: rows }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div>
}

export function HRDashboard() {
  const [summary, setSummary] = useState(null)
  const [cycle, setCycle] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState({ summary: true, cycle: true, activity: true })
  const [refreshing, setRefreshing] = useState(false)
  const [errors, setErrors] = useState({})

  const loadSummary = useCallback(async () => { setLoading(state => ({ ...state, summary: !summary })); try { const response = await fetchHRDashboard(); setSummary(response?.data || response); setErrors(state => ({ ...state, summary: '' })) } catch (error) { setErrors(state => ({ ...state, summary: error?.error?.message || error?.message || 'Dashboard summary could not be loaded.' })) } finally { setLoading(state => ({ ...state, summary: false })) } }, [summary])
  const loadCycle = useCallback(async () => { setLoading(state => ({ ...state, cycle: !cycle })); try { const response = await getCurrentPersonnelEvaluationPeriod(); setCycle(response?.period || response?.data?.period || response || null); setErrors(state => ({ ...state, cycle: '' })) } catch { setCycle(null); setErrors(state => ({ ...state, cycle: '' })) } finally { setLoading(state => ({ ...state, cycle: false })) } }, [cycle])
  const loadActivity = useCallback(async () => { setLoading(state => ({ ...state, activity: activity.length === 0 })); try { const response = await fetchHRAudit({ per_page: 5 }); const payload = response?.data || response || {}; setActivity((payload.events || []).slice(0, 5)); setErrors(state => ({ ...state, activity: '' })) } catch (error) { setErrors(state => ({ ...state, activity: error?.error?.message || error?.message || 'Recent activity could not be loaded.' })) } finally { setLoading(state => ({ ...state, activity: false })) } }, [activity.length])

  useEffect(() => { void loadSummary(); void loadCycle(); void loadActivity() }, []) // independent initial requests
  const refresh = async () => { setRefreshing(true); await Promise.allSettled([loadSummary(), loadCycle(), loadActivity()]); setRefreshing(false) }

  const evaluationCount = Number(summary?.evaluations?.submitted || 0) + Number(summary?.evaluations?.ready_for_finalization || 0)
  const attention = useMemo(() => [
    evaluationCount > 0 && { count: evaluationCount, title: 'Evaluations awaiting HR review', description: 'Review submitted personnel evaluations and supporting documents.', href: '/hr/ranking-cycles', action: 'Review Queue', priority: 'high', icon: Clock3 },
    Number(summary?.colleges_without_dean || 0) > 0 && { count: Number(summary.colleges_without_dean), title: 'Colleges without a Dean', description: 'Review colleges that still need a leadership assignment.', href: '/hr/organizational-structure', action: 'View Colleges', priority: 'standard', icon: Building2 },
    Number(summary?.pending_qualification_reviews || 0) > 0 && { count: Number(summary.pending_qualification_reviews), title: 'Personnel records requiring review', description: 'Resolve pending personnel qualification decisions.', href: '/hr/personnel-directory', action: 'View Personnel', priority: 'standard', icon: UserRoundCheck },
    Number(summary?.pending_password_resets || 0) > 0 && { count: Number(summary.pending_password_resets), title: 'Password reset requests', description: 'Review account recovery requests awaiting HR action.', href: '/hr/password-resets', action: 'Review Requests', priority: 'high', icon: KeyRound }
  ].filter(Boolean), [evaluationCount, summary])

  return <main className="space-y-10 pb-10 text-[#12211A] selection:bg-emerald-200 selection:text-emerald-950 dark:text-slate-100">
    <header className="grid gap-6 border-b border-[#DDE8E2] pb-7 lg:grid-cols-[1fr_360px] lg:items-end dark:border-slate-800"><div><h1 className="text-3xl font-black tracking-[-0.025em] sm:text-4xl">Dashboard</h1><p className="mt-2 max-w-2xl text-base text-[#66766E] dark:text-slate-300">Monitor HR activities requiring your attention.</p></div><div className="flex items-start justify-between gap-4 rounded-2xl bg-[#F1F7F3] p-4 dark:bg-slate-900"><div><p className="text-xs font-semibold text-[#66766E] dark:text-slate-400">Ranking Cycle</p>{loading.cycle ? <div className="mt-2 h-10 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : <><p className="mt-1 font-bold">{cycle?.name || cycle?.academic_year_label || 'No active ranking track'}</p>{cycle && <p className="mt-1 text-xs text-[#66766E] dark:text-slate-400">{cycle.submission_open_at || cycle.start_date} – {cycle.submission_close_at || cycle.end_date}</p>}<Link to="/hr/ranking-cycles" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#087443] underline underline-offset-4">Open Ranking Cycles <ArrowRight className="h-3 w-3" /></Link></>}</div><CalendarDays className="h-5 w-5 text-[#087443]" /></div></header>

    <section aria-labelledby="attention-heading"><div className="flex items-center justify-between"><h2 id="attention-heading" className="text-2xl font-black tracking-[-0.02em]">Needs Attention</h2><button type="button" onClick={refresh} disabled={refreshing} className="rounded-lg p-2 text-[#66766E] hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087443] disabled:opacity-50 dark:hover:bg-slate-800" aria-label="Refresh dashboard"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button></div>{loading.summary && !summary ? <div className="mt-5"><SectionSkeleton /></div> : errors.summary && !summary ? <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-900">{errors.summary}</p> : attention.length ? <div className="mt-5 divide-y divide-[#DDE8E2] border-y border-[#DDE8E2] dark:divide-slate-800 dark:border-slate-800">{attention.map(item => { const Icon = item.icon; return <article key={item.title} className="grid gap-4 py-5 sm:grid-cols-[64px_1fr_auto] sm:items-center"><div className={`grid h-12 w-12 place-items-center rounded-xl ${item.priority === 'high' ? 'bg-[#FFF7E0] text-[#9A6500]' : 'bg-[#EAF6EF] text-[#087443]'}`}><Icon className="h-5 w-5" /></div><div><p className="text-lg font-black tabular-nums"><span className="mr-2">{item.count}</span>{item.title}</p><p className="mt-1 text-sm text-[#66766E] dark:text-slate-300">{item.description}</p></div><Link to={item.href} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087443] ${item.priority === 'high' ? 'bg-[#087443] text-white hover:bg-[#064E32]' : 'border border-[#B9CBC1] text-[#064E32] hover:bg-[#EAF6EF] dark:text-emerald-300'}`}>{item.action}<ArrowRight className="h-4 w-4" /></Link></article>})}</div> : <div className="mt-5 flex items-center gap-4 rounded-2xl bg-[#EAF6EF] p-5 text-[#064E32] dark:bg-emerald-950 dark:text-emerald-200"><CheckCircle2 className="h-6 w-6 shrink-0" /><div><p className="font-black">You’re all caught up.</p><p className="mt-1 text-sm">No HR actions currently require attention.</p></div></div>}</section>

    <section aria-labelledby="glance-heading"><h2 id="glance-heading" className="text-2xl font-black tracking-[-0.02em]">At a Glance</h2>{loading.summary && !summary ? <div className="mt-5"><SectionSkeleton rows={1} /></div> : <><dl className="mt-5 grid divide-y divide-[#DDE8E2] border-y border-[#DDE8E2] sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-800 dark:border-slate-800">{[[summary?.total_personnel ?? '—','Personnel',Users],[summary?.total_colleges ?? '—','Colleges',Building2],[summary?.total_offices_units ?? '—','Offices & Units',Building2]].map(([value,label,Icon]) => <div key={label} className="flex items-center gap-4 px-1 py-5 sm:px-6 sm:first:pl-1"><Icon className="h-5 w-5 text-[#66766E]" /><div><dd className="text-2xl font-black tabular-nums">{value}</dd><dt className="text-sm text-[#66766E] dark:text-slate-300">{label}</dt></div></div>)}</dl><div className="mt-4 flex flex-wrap gap-5"><Link to="/hr/personnel-directory" className="inline-flex items-center gap-1 text-sm font-bold text-[#087443] underline underline-offset-4">View Personnel <ArrowRight className="h-4 w-4" /></Link><Link to="/hr/organizational-structure" className="inline-flex items-center gap-1 text-sm font-bold text-[#087443] underline underline-offset-4">View Organization <ArrowRight className="h-4 w-4" /></Link></div></>}</section>

    <section aria-labelledby="activity-heading"><div className="flex items-end justify-between gap-4"><h2 id="activity-heading" className="text-2xl font-black tracking-[-0.02em]">Recent Activity</h2><Link to="/hr/audit-trail" className="inline-flex items-center gap-1 text-sm font-bold text-[#087443] underline underline-offset-4">View Audit Trail <ArrowRight className="h-4 w-4" /></Link></div>{loading.activity && !activity.length ? <div className="mt-5"><SectionSkeleton rows={3} /></div> : errors.activity && !activity.length ? <p role="alert" className="mt-5 text-sm text-rose-800">{errors.activity}</p> : activity.length ? <ol className="mt-5 divide-y divide-[#DDE8E2] border-y border-[#DDE8E2] dark:divide-slate-800 dark:border-slate-800">{activity.map(event => <li key={event.id} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="font-bold">{readableEvent(event)}</p><p className="mt-1 text-sm text-[#66766E] dark:text-slate-300">{activityContext(event)}</p></div><time dateTime={event.occurred_at} className="text-xs text-[#66766E] dark:text-slate-400">{formatTimestamp(event.occurred_at)}</time></li>)}</ol> : <p className="mt-5 py-8 text-sm text-[#66766E]">No recent HR activity.</p>}</section>
  </main>
}

export default HRDashboard
