import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import hrEvaluationService from '../../../services/hrEvaluationService'
import NonTeachingRankApplicationPanel from '../../../components/evaluation/NonTeachingRankApplicationPanel'
import PortfolioEvaluationStudio from '../evaluation-submissions/evaluation/PortfolioEvaluationStudio'
import ReturnForRevisionModal from '../evaluation-submissions/evaluation/actions/ReturnForRevisionModal'
import useRankingWorkspaceStage from './useRankingWorkspaceStage'
import { DetailDrawer, PersonnelCell, PrimaryButton, StageBadge, StageHeader, StageState, StageTable, StageToolbar } from './RankingStagePrimitives'
import { formatDate } from './rankingStageFormatters'
import { evaluationAction } from './evaluationStagePolicy'

const options = [
  { value: 'resubmitted', label: 'Resubmitted' },
  { value: 'ready_for_evaluation', label: 'Ready for Evaluation' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'returned_for_revision', label: 'Returned for Revision' },
  { value: 'awaiting_finalization', label: 'Awaiting Finalization' },
  { value: 'endorsed_to_hr', label: 'Endorsed to HR' },
  { value: 'completed', label: 'Completed' },
]

const queues = [
  { value: 'needs_hr_action', label: 'Needs HR action' },
  { value: 'waiting_on_personnel', label: 'Waiting on personnel' },
  { value: 'awaiting_finalization', label: 'Awaiting finalization' },
  { value: 'all', label: 'All portfolios' },
]

const hasAction = (row, actions) => (row.allowed_actions || []).some(action => actions.includes(action))
const isResubmitted = row => Number(row.evaluation?.version_number || 1) > 1 && row.presentation_status?.key === 'ready_for_evaluation'
const needsHrAction = row => hasAction(row, ['start_evaluation', 'evaluate_items'])
const awaitingFinalization = row => row.presentation_status?.key === 'awaiting_finalization'
  || hasAction(row, ['review_final_rank', 'finalize_evaluation'])
const queueMatches = (row, queue) => {
  const status = row.presentation_status?.key
  if (queue === 'all') return true
  if (queue === 'waiting_on_personnel') return status === 'returned_for_revision'
  if (queue === 'awaiting_finalization') return status !== 'returned_for_revision' && awaitingFinalization(row)
  return status !== 'returned_for_revision' && !awaitingFinalization(row) && needsHrAction(row)
}
const dateValue = value => value ? String(value).slice(0, 10) : ''

const versionStatusLabel = status => ({
  submitted: 'Submitted',
  in_evaluation: 'In progress',
  returned_for_revision: 'Returned for revision',
  ready_for_finalization: 'Awaiting finalization',
  completed: 'Completed',
})[status] || 'Historical version'

function Confirmation({ action, onCancel, onConfirm, busy, error }) {
  if (!action) return null
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="evaluation-confirm-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950"><div className="flex items-start justify-between gap-4"><div><AlertTriangle className="h-5 w-5 text-amber-600"/><h2 id="evaluation-confirm-title" className="mt-3 text-lg font-black text-slate-950 dark:text-white">{action.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.description}</p></div><button type="button" onClick={onCancel} aria-label="Cancel action" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-900"><X className="h-4 w-4"/></button></div>{error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} className="min-h-10 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">Cancel</button><PrimaryButton disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : action.confirmLabel}</PrimaryButton></div></section></div>
}

export default function EvaluationStage({ cycleId, trackKey, trackKeys = null }) {
  const workspace = useRankingWorkspaceStage(cycleId, trackKeys || trackKey, 'evaluation')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const personnelId = searchParams.get('personnel_id')
  const [search, setSearch] = useState('')
  const [queue, setQueue] = useState(() => personnelId ? 'all' : 'needs_hr_action')
  const [status, setStatus] = useState('all')
  const [department, setDepartment] = useState('all')
  const [submittedAfter, setSubmittedAfter] = useState('')
  const [submittedBefore, setSubmittedBefore] = useState('')
  const [studio, setStudio] = useState(null)
  const [detail, setDetail] = useState(null)
  const [returning, setReturning] = useState(null)
  const [nonTeachingRank, setNonTeachingRank] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const searchedRows = useMemo(() => (workspace.data?.rows || []).filter(row => {
    const query = search.trim().toLowerCase()
    const person = row.personnel || {}
    return (!personnelId || String(person.id) === personnelId)
      && (!query || `${person.full_name || ''} ${person.institutional_id || ''}`.toLowerCase().includes(query))
  }), [workspace.data?.rows, search, personnelId])
  const queueCounts = useMemo(() => Object.fromEntries(queues.map(item => [item.value,
    item.value === 'all' ? searchedRows.length : searchedRows.filter(row => queueMatches(row, item.value)).length,
  ])), [searchedRows])
  const departments = useMemo(() => {
    const assignments = new Map()
    for (const row of workspace.data?.rows || []) {
      const person = row.personnel || {}
      if (person.college_name) assignments.set(`college:${person.college_name}`, `College: ${person.college_name}`)
      if (person.department_name) assignments.set(`department:${person.department_name}`, `Department: ${person.department_name}`)
    }
    return [...assignments].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [workspace.data?.rows])
  const rows = useMemo(() => searchedRows.filter(row => {
    const rowStatus = row.presentation_status?.key
    const rowDate = dateValue(row.evaluation?.submitted_at)
    const person = row.personnel || {}
    const matchesDepartment = department === 'all'
      || (department.startsWith('department:') && person.department_name === department.slice('department:'.length))
      || (department.startsWith('college:') && person.college_name === department.slice('college:'.length))
    return queueMatches(row, queue)
      && (status === 'all' || (status === 'resubmitted' ? isResubmitted(row) : rowStatus === status))
      && matchesDepartment
      && (!submittedAfter || (rowDate && rowDate >= submittedAfter))
      && (!submittedBefore || (rowDate && rowDate <= submittedBefore))
  }), [searchedRows, queue, status, department, submittedAfter, submittedBefore])
  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setDepartment('all')
    setSubmittedAfter('')
    setSubmittedBefore('')
  }
  const filterChips = [
    status !== 'all' && { label: options.find(option => option.value === status)?.label || status, onRemove: () => setStatus('all') },
    department !== 'all' && { label: departments.find(option => option.value === department)?.label || department, onRemove: () => setDepartment('all') },
    submittedAfter && { label: `From ${submittedAfter}`, onRemove: () => setSubmittedAfter('') },
    submittedBefore && { label: `Through ${submittedBefore}`, onRemove: () => setSubmittedBefore('') },
  ].filter(Boolean)

  const loadDetail = async row => {
    const response = await hrEvaluationService.get(row.evaluation.id)
    return {
      ...row.personnel,
      ...row.evaluation,
      ...(response?.evaluation || {}),
      faculty_name: row.personnel.full_name,
      employee_id: row.personnel.institutional_id,
      email: row.personnel.institutional_email || '',
      items: response?.items || [],
      scores: response?.scores || {},
      allowed_actions: response?.allowed_actions || row.allowed_actions || [],
      personnel_profile_id: row.personnel.id,
      workflow_state: row.workflow_state || null,
    }
  }

  const openSummary = row => {
    const group = String(row.personnel?.personnel_group || row.personnel_group || '').toUpperCase()
    const rowTrack = group === 'NON_TEACHING_FACULTY' ? 'non-teaching-faculty' : 'faculty'
    const evaluationId = row.evaluation?.id || row.id
    const personId = row.personnel?.id || row.personnel_profile_id
    const returnParams = new URLSearchParams(location.search)
    if (personId) returnParams.set('personnel_id', personId)
    const returnTo = `${location.pathname}${returnParams.size ? `?${returnParams}` : ''}`
    const params = new URLSearchParams({ from: 'portfolio-evaluation', track: rowTrack, return_to: returnTo, ...(personId ? { personnel_id: personId } : {}) })
    navigate(`/hr/ranking-cycles/${encodeURIComponent(cycleId)}/${encodeURIComponent(rowTrack)}/results/${encodeURIComponent(evaluationId)}/summary?${params}`)
  }

  const runRowAction = async (row, kind) => {
    setActionError('')
    try {
      if (kind === 'evaluate') {
        setStudio(await loadDetail(row))
      } else if (kind === 'summary') {
        openSummary(row)
      } else {
        setDetail(row)
      }
    } catch (error) {
      setActionError(error?.error?.message || error?.message || 'The evaluation action could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const startStudioEvaluation = async () => {
    if (!studio) return
    await hrEvaluationService.start(studio.id)
    const [refreshed, response] = await Promise.all([workspace.reload(), hrEvaluationService.get(studio.id)])
    const row = refreshed?.rows?.find(item => String(item.evaluation?.id) === String(studio.id))
    setStudio(current => ({
      ...current,
      ...(row?.personnel || {}),
      ...(row?.evaluation || {}),
      ...(response?.evaluation || {}),
      status: response?.evaluation?.status || 'in_evaluation',
      items: response?.items || [],
      scores: response?.scores || {},
      allowed_actions: row?.allowed_actions || response?.allowed_actions || []
    }))
  }

  const confirmAction = async () => {
    if (!confirmation) return
    const completedReview = confirmation.kind === 'ready' ? confirmation.row : null
    let reviewSaved = false
    setBusy(true)
    setActionError('')
    try {
      if (confirmation.kind === 'ready') {
        await hrEvaluationService.markReady(confirmation.row.id)
        reviewSaved = true
        if (String(confirmation.row.personnel_group || '').toUpperCase() === 'NON_TEACHING_FACULTY') {
          await hrEvaluationService.finalize(confirmation.row.id)
        }
      }
      setStudio(null)
      setConfirmation(null)
      await workspace.reload()
      if (completedReview) openSummary(completedReview)
    } catch (error) {
      if (reviewSaved && completedReview) {
        setStudio(null)
        setConfirmation(null)
        await workspace.reload()
        openSummary(completedReview)
      } else {
        setActionError(error?.error?.message || error?.message || 'The evaluation action could not be completed.')
      }
    } finally {
      setBusy(false)
    }
  }

  const confirmReturn = async (id, payload) => {
    const selectedReasons = Object.entries(payload.reasons || {}).filter(([, selected]) => selected).map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
    const reason = [payload.remarks, selectedReasons.length ? `Reasons: ${selectedReasons.join(', ')}.` : ''].filter(Boolean).join('\n')
    try {
      await hrEvaluationService.returnForRevision(id, { reason })
      setReturning(null)
      setStudio(null)
      await workspace.reload()
    } catch (error) {
      setActionError(error?.error?.message || error?.message || 'The portfolio could not be returned for revision.')
    }
  }

  return (
    <main className="space-y-5 py-4">
      <StageHeader title="Portfolio Evaluation" description="Review portfolios assigned to HR. Dean-evaluated faculty remain with their College Dean." phase={workspace.phase} onRefresh={workspace.reload}/>
      {workspace.data && <p className="-mt-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">{queueCounts.needs_hr_action} {queueCounts.needs_hr_action === 1 ? 'portfolio needs' : 'portfolios need'} action from HR</p>}
      {actionError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-100">{actionError}</p>}
      <nav aria-label="Portfolio queues" className="-mx-1 flex gap-1 overflow-x-auto px-1" role="group">{queues.map(item => <button key={item.value} type="button" aria-pressed={queue === item.value} onClick={() => setQueue(item.value)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${queue === item.value ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'}`}><span>{item.label}</span><span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${queue === item.value ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{workspace.phase === 'loading' ? '—' : queueCounts[item.value]}</span></button>)}</nav>
      <StageToolbar search={search} onSearch={setSearch} status={status} onStatus={setStatus} options={options} allLabel="All statuses" departments={departments} department={department} onDepartment={setDepartment} submittedAfter={submittedAfter} onSubmittedAfter={setSubmittedAfter} submittedBefore={submittedBefore} onSubmittedBefore={setSubmittedBefore} filterChips={filterChips}/>
      <StageState phase={workspace.phase} error={workspace.error} onRetry={workspace.reload}>
        <StageTable
          columns={[{ label: 'Personnel', className: 'w-[32%] px-4 py-3' }, { label: 'Evaluation status' }, { label: 'Version' }, { label: 'Submitted' }, { label: 'Action', className: 'w-[24%] px-4 py-3 text-right' }]}
          rows={rows}
          emptyTitle={personnelId ? 'No HR-assigned portfolio matches this person and period.' : queue === 'needs_hr_action' && status === 'all' && department === 'all' && !submittedAfter && !submittedBefore && !search.trim() ? 'No portfolios need HR action.' : 'No portfolios match these filters.'}
          emptyDescription={personnelId ? 'Choose another period or category, or clear the personnel filter.' : filterChips.length || search.trim() ? 'Clear filters or search terms to see more portfolios.' : queue === 'needs_hr_action' ? 'There are no portfolios HR can act on right now. Check the other queues for items awaiting a response or finalization.' : 'Try another queue or adjust the filters.'}
          emptyAction={personnelId ? undefined : filterChips.length || search.trim() ? { label: 'Clear filters', onClick: clearFilters } : queue !== 'all' ? { label: 'View all portfolios', onClick: () => { setQueue('all'); setStatus('all') } } : undefined}
          renderRow={row => {
            const action = evaluationAction(row)
            const monitoring = row.workflow_state
            const resubmitted = isResubmitted(row)
            return <tr key={row.evaluation.id}>
              <td className="px-4 py-4"><PersonnelCell person={row.personnel}/></td>
              <td className="px-4 py-4"><StageBadge value={resubmitted ? 'resubmitted' : row.presentation_status.key} label={resubmitted ? 'Resubmitted' : row.presentation_status.label}/></td>
              <td className="px-4 py-4 font-bold tabular-nums"><span>Version {row.evaluation.version_number || 1}</span>{row.previous_versions?.length > 0 && <button type="button" onClick={() => setDetail(row)} className="mt-1 block text-xs font-semibold text-emerald-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">View version history</button>}</td>
              <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(row.evaluation.submitted_at)}</td>
              <td className="px-4 py-4 text-right">
                {monitoring
                  ? <div className="flex flex-col items-end gap-1.5"><span className="text-xs font-bold text-slate-700 dark:text-slate-200">{monitoring.label}</span>{action?.kind === 'view' && <button type="button" onClick={() => runRowAction(row, 'view')} className="text-xs font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">View details</button>}</div>
                  : action ? <PrimaryButton disabled={busy} onClick={() => runRowAction(row, action.kind)}>{action.label}</PrimaryButton>
                    : <span className="text-xs font-semibold text-slate-500">No action available</span>}
              </td>
            </tr>
          }}
        />
      </StageState>
      <DetailDrawer title={detail?.personnel?.full_name} subtitle={detail ? detail.presentation_status?.label : ''} onClose={() => setDetail(null)}>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Evaluation version</dt><dd className="mt-1 font-bold">{detail?.evaluation?.version_number || 1}</dd></div>
          <div><dt className="text-slate-500">Submitted</dt><dd className="mt-1 font-bold">{formatDate(detail?.evaluation?.submitted_at)}</dd></div>
          <div><dt className="text-slate-500">Position</dt><dd className="mt-1 font-bold">{detail?.personnel?.position_title || 'Not recorded'}</dd></div>
          <div><dt className="text-slate-500">Assignment</dt><dd className="mt-1 font-bold">{detail?.personnel?.college_name || detail?.personnel?.department_name || 'Not recorded'}</dd></div>
          {detail?.workflow_state && <div className="sm:col-span-2"><dt className="text-slate-500">Current owner</dt><dd className="mt-1 font-bold">{detail.workflow_state.label}</dd></div>}
        </dl>
        {detail?.previous_versions?.length > 0 && <section className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800" aria-label="Previous portfolio versions"><h3 className="text-sm font-bold text-slate-950 dark:text-white">Previous versions</h3><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">These submissions are historical. HR actions apply only to the latest version above.</p><ol className="mt-3 space-y-2">{detail.previous_versions.map(version => <li key={version.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800"><span className="font-bold">Version {version.version_number}</span><span className="text-right text-slate-600 dark:text-slate-300">{versionStatusLabel(version.status)}<br/>{formatDate(version.submitted_at)}</span></li>)}</ol></section>}
      </DetailDrawer>
      {studio && <PortfolioEvaluationStudio key={`${studio.id}:${studio.status}`} submission={studio} onStartEvaluation={studio.allowed_actions.includes('start_evaluation') ? startStudioEvaluation : undefined} onClose={() => setStudio(null)} onSaveProgress={() => setActionError('Progress is saved when each evidence decision is recorded.')} onOpenReturnModal={studio.allowed_actions.includes('return_for_revision') ? () => setReturning(studio) : undefined} onOpenFinalizeModal={studio.allowed_actions.includes('mark_ready') ? () => setConfirmation({ row: studio, kind: 'ready', title: 'Complete this evaluation review?', description: String(studio.personnel_group || '').toUpperCase() === 'NON_TEACHING_FACULTY' ? 'This saves the review and creates the official evaluation result. A passing evaluation needs a confirmed eligible Rank Applied For; an Instructor without a verified Master’s retains the present rank.' : 'This sends the reviewed portfolio to HR. Rank progression is handled separately.', confirmLabel: 'Complete review' }) : undefined} onOpenRankPreparation={studio.allowed_actions.includes('mark_ready') && String(studio.personnel_group || '').toUpperCase() === 'NON_TEACHING_FACULTY' ? () => setNonTeachingRank(studio) : undefined} rankPreparationLabel="Prepare rank recommendation" finalizeLabel="Complete review"/>}
      <ReturnForRevisionModal submission={returning} isOpen={Boolean(returning)} onClose={() => setReturning(null)} onConfirmReturn={confirmReturn}/>
      {nonTeachingRank && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/70 p-4"><NonTeachingRankApplicationPanel personnelId={nonTeachingRank.personnel_profile_id} cycleId={cycleId} trackId={nonTeachingRank.evaluation_period_id} onClose={() => setNonTeachingRank(null)}/></div>}
      <Confirmation action={confirmation} onCancel={() => setConfirmation(null)} onConfirm={confirmAction} busy={busy} error={actionError}/>
    </main>
  )
}
