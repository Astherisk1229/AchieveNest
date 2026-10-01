import React, { useMemo, useState } from 'react'
import useRankingWorkspaceStage from './useRankingWorkspaceStage'
import { DetailDrawer, PersonnelCell, PrimaryButton, StageBadge, StageHeader, StageState, StageTable, StageToolbar } from './RankingStagePrimitives'
import { formatDate } from './rankingStageFormatters'

const options = [
  { value: 'not_submitted', label: 'Not Submitted' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
]

export default function SubmissionsStage({ cycleId, trackKey }) {
  const workspace = useRankingWorkspaceStage(cycleId, trackKey, 'submissions')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const rows = useMemo(() => (workspace.data?.rows || []).filter(row => {
    const query = search.trim().toLowerCase()
    const person = row.personnel || {}
    return (!query || `${person.full_name || ''} ${person.institutional_id || ''}`.toLowerCase().includes(query))
      && (status === 'all' || row.submission_status === status)
  }), [workspace.data?.rows, search, status])

  return <main className="space-y-5 py-4"><StageHeader title="Submissions" description="Monitor portfolio activity for every active personnel member in this cycle and personnel type." phase={workspace.phase} onRefresh={workspace.reload}/><StageToolbar search={search} onSearch={setSearch} status={status} onStatus={setStatus} options={options}/><StageState phase={workspace.phase} error={workspace.error} onRetry={workspace.reload}><StageTable columns={[{ label: 'Personnel', className: 'w-[34%] px-4 py-3' }, { label: 'Portfolio activity' }, { label: 'Submission status' }, { label: 'Submitted' }, { label: 'Action', className: 'px-4 py-3 text-right' }]} rows={rows} emptyTitle="No submissions match these filters" emptyDescription="Clear a filter to see the complete personnel roster." renderRow={row => { const evaluation = row.evaluation; const canView = evaluation && row.allowed_actions?.includes('view_submission'); return <tr key={row.personnel.id} className="align-middle"><td className="px-4 py-4"><PersonnelCell person={row.personnel}/></td><td className="px-4 py-4"><p className="font-bold tabular-nums text-slate-900 dark:text-white">{row.working_accomplishment_count}</p><p className="mt-0.5 text-xs text-slate-500">working accomplishment{row.working_accomplishment_count === 1 ? '' : 's'}</p></td><td className="px-4 py-4"><StageBadge value={row.submission_status} label={row.submission_status_label}/></td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(evaluation?.submitted_at)}</td><td className="px-4 py-4 text-right">{canView ? <PrimaryButton onClick={() => setSelected(row)}>View submission</PrimaryButton> : <span className="text-xs text-slate-500">No submission yet</span>}</td></tr> }}/></StageState><DetailDrawer title={selected?.personnel?.full_name} subtitle={selected ? `Portfolio version ${selected.evaluation?.version_number || 1}` : ''} onClose={() => setSelected(null)}><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-bold"><StageBadge value={selected?.submission_status} label={selected?.submission_status_label}/></dd></div><div><dt className="text-slate-500">Submitted</dt><dd className="mt-1 font-bold">{formatDate(selected?.evaluation?.submitted_at)}</dd></div><div><dt className="text-slate-500">Position</dt><dd className="mt-1 font-bold">{selected?.personnel?.position_title || 'Not recorded'}</dd></div><div><dt className="text-slate-500">Assignment</dt><dd className="mt-1 font-bold">{selected?.personnel?.college_name || selected?.personnel?.department_name || 'Not recorded'}</dd></div></dl></DetailDrawer></main>
}
