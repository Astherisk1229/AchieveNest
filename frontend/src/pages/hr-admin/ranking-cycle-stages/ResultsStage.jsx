import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useRankingWorkspaceStage from './useRankingWorkspaceStage'
import { PersonnelCell, StageBadge, StageHeader, StageState, StageTable, StageToolbar } from './RankingStagePrimitives'
import { formatDate } from './rankingStageFormatters'

const score = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ResultsStage({ cycleId, trackKey }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [page, setPage] = useState(1)
  useEffect(() => { const timer = setTimeout(() => setDebouncedSearch(search), 250); return () => clearTimeout(timer) }, [search])
  const workspace = useRankingWorkspaceStage(cycleId, trackKey, 'results', { page, per_page: 25, search: debouncedSearch })
  const totalPages = Math.max(1, Math.ceil((workspace.data?.total_rows || 0) / 25))

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false
    for (const [key, value] of [['personnelType', trackKey], ['filters', 'completed'], ['stage', 'results']]) {
      if (next.get(key) !== value) { next.set(key, value); changed = true }
    }
    if (changed) setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, trackKey])

  const setSearch = value => {
    setPage(1)
    const next = new URLSearchParams(searchParams)
    if (value) next.set('search', value)
    else next.delete('search')
    setSearchParams(next, { replace: true })
  }

  const rows = workspace.data?.rows || []

  const summaryPath = row => `/hr/ranking-cycles/${encodeURIComponent(cycleId)}/${encodeURIComponent(trackKey)}/results/${encodeURIComponent(row.evaluation.id)}/summary?${searchParams.toString()}`

  return <main className="space-y-5 py-4">
    <StageHeader title="Results" description="Open immutable reports for technically completed evaluations in this cycle." phase={workspace.phase} onRefresh={workspace.reload}/>
    <StageToolbar search={search} onSearch={setSearch} status="completed" onStatus={() => {}} options={[]}/>
    <StageState phase={workspace.phase} error={workspace.error} onRetry={workspace.reload}>
      <StageTable columns={[{ label: 'Personnel', className: 'w-[38%] px-4 py-3' }, { label: 'Result status' }, { label: 'Completed' }, { label: 'Report score' }, { label: 'Action', className: 'px-4 py-3 text-right' }]} rows={rows} emptyTitle="No completed results yet" emptyDescription="Immutable result reports appear here after technical finalization." renderRow={row => <tr key={row.evaluation.id}>
        <td className="px-4 py-4"><PersonnelCell person={row.personnel}/></td>
        <td className="px-4 py-4"><StageBadge value={row.result_status} label="Completed"/></td>
        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(row.result?.evaluation?.completed_at)}</td>
        <td className="px-4 py-4 font-bold tabular-nums">{score.format(row.report_score)}</td>
        <td className="px-4 py-4 text-right">{row.allowed_actions?.includes('view_report') && <Link to={summaryPath(row)} className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-800 px-3 text-xs font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Evaluation Summary</Link>}</td>
      </tr>}/>
    </StageState>
    {workspace.data && totalPages > 1 && <nav aria-label="Results pages" className="flex items-center justify-end gap-3 text-sm"><button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-50">Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-50">Next</button></nav>}
  </main>
}
