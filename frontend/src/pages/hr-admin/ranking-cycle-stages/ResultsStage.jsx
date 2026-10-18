import React, { useEffect, useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import useRankingWorkspaceStage from './useRankingWorkspaceStage'
import { PersonnelCell, StageBadge, StageHeader, StageState, StageTable, StageToolbar } from './RankingStagePrimitives'
import { formatDate } from './rankingStageFormatters'

const score = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const locationFor = person => {
  if (person.college_id || person.college_name) return { key: `college:${person.college_id || person.college_name}`, legacyKey: String(person.college_id || person.college_name), label: person.college_name || 'College not recorded' }
  if (person.department_id || person.department_name) return { key: `department:${person.department_id || person.department_name}`, label: person.department_name || 'Department not recorded' }
  return null
}

export default function ResultsStage({ cycleId, trackKey, trackKeys = null }) {
  const workspace = useRankingWorkspaceStage(cycleId, trackKeys || trackKey, 'results')
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const search = searchParams.get('search') || ''
  const selectedLocation = searchParams.get('summary_college') || 'all'

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false
    for (const [key, value] of [['personnelType', trackKey], ['stage', 'results']]) {
      if (value == null) continue
      if (next.get(key) !== value) { next.set(key, value); changed = true }
    }
    if (changed) setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, trackKey])

  const setSearch = value => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('search', value)
    else next.delete('search')
    setSearchParams(next, { replace: true })
  }

  const setLocation = value => {
    const next = new URLSearchParams(searchParams)
    if (value === 'all') next.delete('summary_college')
    else next.set('summary_college', value)
    setSearchParams(next, { replace: true })
  }

  const locations = useMemo(() => {
    const values = new Map()
    for (const row of workspace.data?.rows || []) {
      const location = locationFor(row.personnel || {})
      if (location && !values.has(location.key)) values.set(location.key, location)
    }
    return [...values.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [workspace.data?.rows])
  const locationSelectValue = locations.find(location => location.legacyKey === selectedLocation)?.key || selectedLocation

  const rows = useMemo(() => (workspace.data?.rows || []).filter(row => {
    const query = search.trim().toLowerCase()
    const person = row.personnel || {}
    const matchesSearch = !query || `${person.full_name || ''} ${person.institutional_id || ''}`.toLowerCase().includes(query)
    const location = locationFor(person)
    return matchesSearch && (selectedLocation === 'all' || location?.key === selectedLocation || location?.legacyKey === selectedLocation)
  }), [workspace.data?.rows, search, selectedLocation])

  const summaryPath = row => {
    const group = String(row.personnel?.personnel_group || '').toUpperCase()
    const rowTrackKey = group === 'NON_TEACHING_FACULTY' ? 'non-teaching-faculty' : 'faculty'
    const params = new URLSearchParams(searchParams)
    params.set('return_to', `${location.pathname}${location.search}`)
    return `/hr/ranking-cycles/${encodeURIComponent(cycleId)}/${encodeURIComponent(rowTrackKey)}/results/${encodeURIComponent(row.evaluation.id)}/summary?${params}`
  }
  const evaluationPath = row => {
    const group = String(row.personnel?.personnel_group || '').toUpperCase()
    const track = group === 'NON_TEACHING_FACULTY' ? 'non-teaching-faculty' : 'faculty'
    return `/hr/ranking-cycles?${new URLSearchParams({ tab: 'portfolio-evaluation', period: cycleId, track, personnel_id: row.personnel.id })}`
  }
  const combinedView = Boolean(trackKeys?.length > 1)
  const columns = [{ label: 'Personnel', className: 'w-[34%] px-4 py-3' }, ...(combinedView ? [{ label: 'Personnel category' }] : []), { label: 'Status' }, { label: 'Reviewed by' }, { label: 'Date' }, ...(!combinedView ? [{ label: 'Report score' }] : []), { label: 'Action', className: 'px-4 py-3 text-right' }]

  return <main className="space-y-5 py-4">
    <StageHeader title="Evaluation Summaries" description="Review endorsed faculty summaries, non-teaching evaluations awaiting finalization, and completed results for this period." phase={workspace.phase} onRefresh={workspace.reload}/>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><StageToolbar search={search} onSearch={setSearch} status="completed" onStatus={() => {}} options={[]} className="max-w-none"/><label className="grid gap-1"><span className="sr-only">Filter by college or department</span><select aria-label="Filter by college or department" value={locationSelectValue} onChange={event => setLocation(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950"><option value="all">All colleges and departments</option>{locations.map(location => <option key={location.key} value={location.key}>{location.label}</option>)}</select></label></div>
    <StageState phase={workspace.phase} error={workspace.error} onRetry={workspace.reload}>
      <StageTable columns={columns} rows={rows} emptyTitle="No evaluation summaries yet" emptyDescription="Dean-endorsed faculty summaries and non-teaching reviews awaiting finalization appear here. Completed results remain available after finalization." renderRow={row => <tr key={row.evaluation.id}>
        <td className="px-4 py-4"><PersonnelCell person={row.personnel}/></td>
        {combinedView && <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{String(row.personnel?.personnel_group || '').toUpperCase() === 'NON_TEACHING_FACULTY' ? 'Non-Teaching Personnel' : 'Teaching Faculty'}</td>}
        <td className="px-4 py-4"><StageBadge value={row.result_status} label={row.result_status === 'endorsed_to_hr' ? 'Endorsed to HR' : row.result_status === 'awaiting_finalization' ? 'Awaiting finalization' : 'Completed'}/></td>
        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{row.endorsement?.by || '—'}</td>
        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(row.endorsement?.at || row.result?.evaluation?.completed_at)}</td>
        {!combinedView && <td className="px-4 py-4 font-bold tabular-nums">{score.format(row.report_score)}</td>}
        <td className="px-4 py-4 text-right">{row.allowed_actions?.includes('view_report') || (row.result_status === 'awaiting_finalization' && row.allowed_actions?.includes('view_evaluation')) ? <Link to={summaryPath(row)} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-800 px-3 text-xs font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">View summary</Link> : row.allowed_actions?.includes('view_evaluation') && <Link to={evaluationPath(row)} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-800 px-3 text-xs font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">View evaluation</Link>}</td>
      </tr>}/>
    </StageState>
  </main>
}
