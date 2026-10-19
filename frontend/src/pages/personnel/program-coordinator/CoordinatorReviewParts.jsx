import React, { useEffect, useState } from 'react'
import { formatDateTime } from '../../../utils/achievementDates'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import portfolioService from '../../../services/portfolioService'
import { formatApiError } from '../../../hooks/useVerification'

const ACTION_LABELS = { verified: 'Verified', revision_requested: 'Returned for revision', rejected: 'Rejected', submitted: 'Submitted', resubmitted: 'Resubmitted', scoring_requested: 'Award matching requested', criteria_scored: 'Award criteria matched', scoring_failed: 'Award matching deferred (OSAD will retry)' }

/** Returns an error message, or null when a decision may be sent. */
export function validateDecision(action, remarks) {
  if (!['approve', 'return', 'reject'].includes(action)) return 'Unknown decision.'
  if ((action === 'return' || action === 'reject') && !String(remarks || '').trim()) {
    return action === 'return'
      ? 'Remarks are required when returning a submission for revision.'
      : 'Remarks are required when rejecting a submission.'
  }
  return null
}

/** Verification history from GET /portfolio/{id} (student_portfolio_verification_events). */
export function CoordinatorEventTimeline({ events = [] }) {
  if (!events.length) return null
  return <ol className="space-y-2">
    {events.map(event => <li key={event.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
      <p className="font-bold text-slate-900">{ACTION_LABELS[event.action] || event.action}<span className="ml-2 font-medium text-slate-500">{formatDateTime(event.occurred_at) || event.occurred_at}</span></p>
      {event.actor_name && <p className="text-slate-600">By {event.actor_name}</p>}
      {event.remarks && <p className="mt-1 text-slate-700">{event.remarks}</p>}
    </li>)}
  </ol>
}

/**
 * Approve / Return / Reject controls for a record awaiting review ('Pending' = backend 'submitted').
 * Return and Reject require remarks. Backend errors are shown verbatim.
 */
export function CoordinatorDecisionActions({ item, onApprove, onReturn, onReject, onDone }) {
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setRemarks(''); setError('') }, [item?.id])

  if (!item) return null
  if (item.status !== 'Pending') {
    const notes = {
      Verified: 'This submission has been verified.',
      Returned: 'This submission was returned to the student for revision and is waiting for resubmission.',
      Rejected: 'This submission was rejected.'
    }
    return <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-slate-500" /><p className="text-xs font-bold text-slate-700">{notes[item.status] || `Status: ${item.status}`}</p></div>
  }

  const decide = async action => {
    const problem = validateDecision(action, remarks)
    if (problem) { setError(problem); return }
    setBusy(true); setError('')
    try {
      const handler = { approve: onApprove, return: onReturn, reject: onReject }[action]
      const result = await handler(item.id, remarks.trim())
      setRemarks('')
      onDone?.(action, result)
    } catch (err) {
      setError(formatApiError(err, 'The decision could not be recorded.'))
    } finally { setBusy(false) }
  }

  return <div className="shrink-0 space-y-2 border-t border-slate-200 bg-white px-6 py-3.5">
    <label htmlFor={`decision-remarks-${item.id}`} className="block text-xs font-bold text-slate-800">Remarks <span className="font-medium text-slate-500">(required to return or reject)</span></label>
    <textarea id={`decision-remarks-${item.id}`} value={remarks} onChange={event => { setRemarks(event.target.value); setError('') }} rows={2} placeholder="Explain what needs to change, or why the submission is rejected…" className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#16834a] focus:bg-white" />
    {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" disabled={busy} onClick={() => decide('reject')} className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" /><span>Reject</span></button>
      <button type="button" disabled={busy} onClick={() => decide('return')} className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" /><span>Return for Revision</span></button>
      <button type="button" disabled={busy} onClick={() => decide('approve')} className="flex items-center gap-1.5 rounded-xl bg-[#16834a] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#126b3c] disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /><span>Approve &amp; Verify</span></button>
    </div>
  </div>
}

/** Loads record, evidence and event timeline from GET /portfolio/{id} for the selected item. */
export function useCoordinatorRecordDetail(recordId, loadRecordDetail) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!recordId) { setDetail(null); return undefined }
    let active = true
    setDetail(null); setError('')
    loadRecordDetail(recordId)
      .then(result => { if (active) setDetail(result) })
      .catch(err => { if (active) setError(formatApiError(err, 'Could not load the submission details.')) })
    return () => { active = false }
  }, [recordId, loadRecordDetail])
  return { detail, error }
}
