import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Download, Eye, FileText, RotateCcw, X, XCircle } from 'lucide-react'
import portfolioService from '../../../services/portfolioService'
import { formatApiError } from '../../../hooks/useVerification'

const PREVIEWABLE = ['application/pdf', 'image/jpeg', 'image/png']

export function formatBytes(bytes) {
  const size = Number(bytes) || 0
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size >= 1024) return `${Math.round(size / 1024)} KB`
  return `${size} B`
}

/** Returns an error message, or null when the decision may be sent. Remarks are required for return and reject. */
export function validateDecision(action, remarks) {
  if (!['approve', 'return', 'reject'].includes(action)) return 'Unknown decision.'
  if ((action === 'return' || action === 'reject') && !String(remarks || '').trim()) {
    return action === 'return'
      ? 'Remarks are required when returning a submission for revision.'
      : 'Remarks are required when rejecting a submission.'
  }
  return null
}

/** Blob error bodies (responseType: 'blob') are JSON; read them so backend errors are shown verbatim. */
async function blobErrorMessage(error) {
  try {
    if (typeof Blob !== 'undefined' && error instanceof Blob) return formatApiError(JSON.parse(await error.text()))
  } catch { /* fall through */ }
  return formatApiError(error, 'The evidence file could not be opened.')
}

/**
 * Lists every evidence item with its real file name, MIME type and size, an inline preview for
 * PDF/JPEG/PNG, and View/Download actions. All bytes come from the protected download endpoint.
 */
export function CoordinatorEvidenceList({ evidence = [] }) {
  const [urls, setUrls] = useState({})
  const [errors, setErrors] = useState({})
  const [fullView, setFullView] = useState(null)
  const latest = useRef(evidence)
  latest.current = evidence
  // Re-fetch only when the set of evidence ids changes, not on every parent render.
  const evidenceKey = evidence.map(item => item.id).join(',')

  useEffect(() => {
    let cancelled = false
    const created = []
    setUrls({}); setErrors({}); setFullView(null)
    latest.current.forEach(item => {
      portfolioService.downloadEvidence(item.id)
        .then(blob => {
          const url = URL.createObjectURL(blob)
          if (cancelled) { URL.revokeObjectURL(url); return }
          created.push(url)
          setUrls(previous => ({ ...previous, [item.id]: url }))
        })
        .catch(async error => {
          const message = await blobErrorMessage(error)
          if (!cancelled) setErrors(previous => ({ ...previous, [item.id]: message }))
        })
    })
    return () => { cancelled = true; created.forEach(url => URL.revokeObjectURL(url)) }
  }, [evidenceKey])

  if (evidence.length === 0) {
    return <p className="text-xs font-medium text-rose-700">No active supporting evidence is attached to this submission.</p>
  }

  const mimeOf = item => item.detected_mime_type || item.mime_type || 'application/octet-stream'

  return <div className="space-y-3">
    {evidence.map(item => {
      const mime = mimeOf(item)
      const url = urls[item.id]
      return <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {url && PREVIEWABLE.includes(mime) && (mime === 'application/pdf'
          ? <iframe title={`Preview of ${item.original_filename}`} src={`${url}#page=1&view=FitH`} className="h-56 w-full border-0 bg-slate-50" />
          : <img src={url} alt={`Preview of ${item.original_filename}`} className="h-56 w-full bg-slate-50 object-contain" />)}
        <div className="flex items-center justify-between gap-3 p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-[#16834a]"><FileText className="h-4 w-4" /></div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">{item.original_filename}</p>
              <p className="font-mono text-[11px] text-slate-500">{mime} • {formatBytes(item.byte_size)}</p>
              {errors[item.id] && <p role="alert" className="text-[11px] font-medium text-rose-700">{errors[item.id]}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" disabled={!url} onClick={() => setFullView(item)} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"><Eye className="h-3.5 w-3.5" /><span>View</span></button>
            {url
              ? <a href={url} download={item.original_filename} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"><Download className="h-3.5 w-3.5" /><span>Download</span></a>
              : <span className="px-2 text-[11px] text-slate-400">{errors[item.id] ? 'Unavailable' : 'Loading…'}</span>}
          </div>
        </div>
      </div>
    })}
    {fullView && urls[fullView.id] && <div role="dialog" aria-modal="true" aria-label={`Full document ${fullView.original_filename}`} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4">
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b p-3"><p className="truncate text-sm font-bold">{fullView.original_filename}</p><button type="button" onClick={() => setFullView(null)} className="rounded p-2 hover:bg-slate-100" aria-label="Close full document"><X className="h-4 w-4" /></button></div>
        {mimeOf(fullView) === 'application/pdf'
          ? <iframe title={`Full document ${fullView.original_filename}`} src={urls[fullView.id]} className="min-h-0 flex-1 border-0" />
          : PREVIEWABLE.includes(mimeOf(fullView))
            ? <img src={urls[fullView.id]} alt={`Full view of ${fullView.original_filename}`} className="min-h-0 flex-1 object-contain" />
            : <p className="p-6 text-sm text-slate-600">This file type cannot be previewed. Use Download.</p>}
      </div>
    </div>}
  </div>
}

const ACTION_LABELS = { verified: 'Verified', revision_requested: 'Returned for revision', rejected: 'Rejected', submitted: 'Submitted', resubmitted: 'Resubmitted', scoring_requested: 'Award matching requested', criteria_scored: 'Award criteria matched', scoring_failed: 'Award matching deferred (OSAD will retry)' }

/** Verification history from GET /portfolio/{id} (student_portfolio_verification_events). */
export function CoordinatorEventTimeline({ events = [] }) {
  if (!events.length) return null
  return <ol className="space-y-2">
    {events.map(event => <li key={event.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
      <p className="font-bold text-slate-900">{ACTION_LABELS[event.action] || event.action}<span className="ml-2 font-medium text-slate-500">{event.occurred_at}</span></p>
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
      await handler(item.id, remarks.trim())
      setRemarks('')
      onDone?.(action)
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

/** Evidence (with previews) and verification history for one record, loaded from GET /portfolio/{id}. */
export function CoordinatorRecordReview({ item, loadRecordDetail }) {
  const { detail, error } = useCoordinatorRecordDetail(item?.id, loadRecordDetail)
  if (!item) return null
  // The queue already carries reviewer-safe evidence; the detail call adds the event timeline.
  const evidence = detail?.evidence || item.evidence || []
  return <div className="space-y-4">
    <div className="space-y-2">
      <p className="text-xs font-extrabold text-slate-900">Supporting Documents &amp; Evidence ({evidence.length})</p>
      <CoordinatorEvidenceList evidence={evidence} />
    </div>
    {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
    {detail?.events?.length > 0 && <div className="space-y-2">
      <p className="text-xs font-extrabold text-slate-900">Verification History</p>
      <CoordinatorEventTimeline events={detail.events} />
    </div>}
  </div>
}
