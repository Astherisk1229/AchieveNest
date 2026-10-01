import React, { useMemo, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import hrEvaluationService from '../../../services/hrEvaluationService'
import FacultyPhaseOWorkspace from '../../../components/evaluation/FacultyPhaseOWorkspace'
import PortfolioEvaluationStudio from '../evaluation-submissions/evaluation/PortfolioEvaluationStudio'
import ReturnForRevisionModal from '../evaluation-submissions/evaluation/actions/ReturnForRevisionModal'
import useRankingWorkspaceStage from './useRankingWorkspaceStage'
import { DetailDrawer, PersonnelCell, PrimaryButton, StageBadge, StageHeader, StageState, StageTable, StageToolbar } from './RankingStagePrimitives'
import { formatDate } from './rankingStageFormatters'
import { evaluationAction, mayOpenFacultyPhaseO, mayUseGenericFinalizer } from './evaluationStagePolicy'

const options = [
  { value: 'ready_for_evaluation', label: 'Ready for Evaluation' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'returned_for_revision', label: 'Returned for Revision' },
  { value: 'completed', label: 'Completed' },
]

function Confirmation({ action, onCancel, onConfirm, busy }) {
  if (!action) return null
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="evaluation-confirm-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950"><div className="flex items-start justify-between gap-4"><div><AlertTriangle className="h-5 w-5 text-amber-600"/><h2 id="evaluation-confirm-title" className="mt-3 text-lg font-black text-slate-950 dark:text-white">{action.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.description}</p></div><button type="button" onClick={onCancel} aria-label="Cancel action" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-900"><X className="h-4 w-4"/></button></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} className="min-h-10 rounded-lg px-4 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">Cancel</button><PrimaryButton disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : action.confirmLabel}</PrimaryButton></div></section></div>
}

export default function EvaluationStage({ cycleId, trackKey }) {
  const workspace = useRankingWorkspaceStage(cycleId, trackKey, 'evaluation')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [studio, setStudio] = useState(null)
  const [detail, setDetail] = useState(null)
  const [returning, setReturning] = useState(null)
  const [phaseO, setPhaseO] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const rows = useMemo(() => (workspace.data?.rows || []).filter(row => {
    const query = search.trim().toLowerCase()
    const person = row.personnel || {}
    return (!query || `${person.full_name || ''} ${person.institutional_id || ''}`.toLowerCase().includes(query))
      && (status === 'all' || row.presentation_status?.key === status)
  }), [workspace.data?.rows, search, status])

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
      allowed_actions: row.allowed_actions || [],
      workflow_state: row.workflow_state || null,
    }
  }

  const runRowAction = async (row, kind) => {
    setActionError('')
    try {
      if (kind === 'start') {
        setBusy(true)
        await hrEvaluationService.start(row.evaluation.id)
        await workspace.reload()
      } else if (kind === 'evaluate') {
        setStudio(await loadDetail(row))
      } else if (kind === 'phase-o' && mayOpenFacultyPhaseO(row)) {
        setPhaseO(row.evaluation)
      } else if (kind === 'finalize' && mayUseGenericFinalizer(row)) {
        setConfirmation({ row, kind, title: 'Finalize this evaluation?', description: 'Finalization creates the immutable result and prevents ordinary evaluation changes.', confirmLabel: 'Finalize evaluation' })
      } else {
        setDetail(row)
      }
    } catch (error) {
      setActionError(error?.error?.message || error?.message || 'The evaluation action could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const confirmAction = async () => {
    if (!confirmation) return
    setBusy(true)
    setActionError('')
    try {
      if (confirmation.kind === 'ready') await hrEvaluationService.markReady(confirmation.row.id)
      if (confirmation.kind === 'finalize') {
        if (!mayUseGenericFinalizer(confirmation.row)) throw new Error('Faculty evaluations must be completed through the final rank review workflow.')
        await hrEvaluationService.finalize(confirmation.row.evaluation.id)
      }
      setStudio(null)
      setConfirmation(null)
      await workspace.reload()
    } catch (error) {
      setActionError(error?.error?.message || error?.message || 'The evaluation action could not be completed.')
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

  return <main className="space-y-5 py-4"><StageHeader title="Evaluation" description="Review submitted portfolios, record evidence decisions, and complete the assigned evaluation workflow." phase={workspace.phase} onRefresh={workspace.reload}/>{actionError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-100">{actionError}</p>}<StageToolbar search={search} onSearch={setSearch} status={status} onStatus={setStatus} options={options}/><StageState phase={workspace.phase} error={workspace.error} onRetry={workspace.reload}><StageTable columns={[{ label: 'Personnel', className: 'w-[32%] px-4 py-3' }, { label: 'Evaluation status' }, { label: 'Version' }, { label: 'Submitted' }, { label: 'Action', className: 'w-[24%] px-4 py-3 text-right' }]} rows={rows} emptyTitle="No evaluations match these filters" emptyDescription="Submitted evaluations will appear here without completed result records." renderRow={row => { const action = evaluationAction(row); const monitoring = row.workflow_state; return <tr key={row.evaluation.id}><td className="px-4 py-4"><PersonnelCell person={row.personnel}/></td><td className="px-4 py-4"><StageBadge value={row.presentation_status.key} label={row.presentation_status.label}/></td><td className="px-4 py-4 font-bold tabular-nums">{row.evaluation.version_number || 1}</td><td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(row.evaluation.submitted_at)}</td><td className="px-4 py-4 text-right">{monitoring ? <div className="flex flex-col items-end gap-1.5"><span className="text-xs font-bold text-slate-700 dark:text-slate-200">{monitoring.label}</span>{action?.kind === 'view' && <button type="button" onClick={() => runRowAction(row, 'view')} className="text-xs font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">View details</button>}</div> : action ? <PrimaryButton disabled={busy} onClick={() => runRowAction(row, action.kind)}>{action.label}</PrimaryButton> : <span className="text-xs font-semibold text-slate-500">No action available</span>}</td></tr> }}/></StageState><DetailDrawer title={detail?.personnel?.full_name} subtitle={detail ? detail.presentation_status?.label : ''} onClose={() => setDetail(null)}><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Evaluation version</dt><dd className="mt-1 font-bold">{detail?.evaluation?.version_number || 1}</dd></div><div><dt className="text-slate-500">Submitted</dt><dd className="mt-1 font-bold">{formatDate(detail?.evaluation?.submitted_at)}</dd></div><div><dt className="text-slate-500">Position</dt><dd className="mt-1 font-bold">{detail?.personnel?.position_title || 'Not recorded'}</dd></div><div><dt className="text-slate-500">Assignment</dt><dd className="mt-1 font-bold">{detail?.personnel?.college_name || detail?.personnel?.department_name || 'Not recorded'}</dd></div>{detail?.workflow_state && <div className="sm:col-span-2"><dt className="text-slate-500">Current owner</dt><dd className="mt-1 font-bold">{detail.workflow_state.label}</dd></div>}</dl></DetailDrawer>{studio && <PortfolioEvaluationStudio submission={studio} onClose={() => setStudio(null)} onSaveProgress={() => setActionError('Progress is saved when each evidence decision is recorded.')} onOpenReturnModal={studio.allowed_actions.includes('return_for_revision') ? () => setReturning(studio) : undefined} onOpenFinalizeModal={studio.allowed_actions.includes('mark_ready') ? () => setConfirmation({ row: studio, kind: 'ready', title: 'Complete this evaluation review?', description: 'The portfolio will move to the completed presentation state and, when required, be handed to HR for finalization.', confirmLabel: 'Complete review' }) : undefined} finalizeLabel="Complete review"/>}<ReturnForRevisionModal submission={returning} isOpen={Boolean(returning)} onClose={() => setReturning(null)} onConfirmReturn={confirmReturn}/>{phaseO && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 sm:p-8"><div className="mx-auto max-w-4xl"><FacultyPhaseOWorkspace evaluationId={phaseO.id} mode="hr" onChanged={workspace.reload} onClose={() => setPhaseO(null)}/></div></div>}<Confirmation action={confirmation} onCancel={() => setConfirmation(null)} onConfirm={confirmAction} busy={busy}/></main>
}
