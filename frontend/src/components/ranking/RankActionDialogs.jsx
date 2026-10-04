import React, { useEffect, useRef, useState } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import { facultyRankCatalogService } from '../../services/facultyRankCatalogService'
import { rankActionError } from '../../services/rankPlacementViewService'

const today = () => new Date().toISOString().slice(0, 10)
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950'
const labelClass = 'block text-sm font-bold text-slate-800 dark:text-slate-100'

/**
 * Shared modal frame. Runs `onSubmit`, shows the backend error inside the dialog,
 * and closes only when the action succeeded.
 */
function DialogFrame({ title, description, confirmLabel, canSubmit = true, onSubmit, onClose, children }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const firstRef = useRef(null)
  useEffect(() => {
    firstRef.current?.focus()
    const onKey = event => { if (event.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit()
    } catch (err) {
      setError(rankActionError(err))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
        </header>
        <div ref={firstRef} tabIndex={-1} className="space-y-4 outline-none">{children}</div>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}
        <footer className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold dark:border-slate-700">Cancel</button>
          <button type="submit" disabled={busy || !canSubmit} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-black text-white disabled:opacity-50">
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{confirmLabel}
          </button>
        </footer>
      </form>
    </div>
  )
}

/** One required reason (cancel an approved rank or placement, request recovery). */
export function ReasonDialog({ title, description, label = 'Reason', confirmLabel, onSubmit, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <DialogFrame title={title} description={description} confirmLabel={confirmLabel} canSubmit={reason.trim() !== ''} onSubmit={() => onSubmit(reason.trim())} onClose={onClose}>
      <label className={labelClass}>{label}
        <textarea value={reason} onChange={event => setReason(event.target.value)} rows="3" required className={inputClass} />
      </label>
    </DialogFrame>
  )
}

/** Confirm a placement suggestion, or correct a pending placement: effective date (+ reason when correcting). */
export function PlacementDateDialog({ title, description, confirmLabel, withReason = false, initialDate = '', onSubmit, onClose }) {
  const [date, setDate] = useState(initialDate || '')
  const [reason, setReason] = useState('')
  const ready = date !== '' && (!withReason || reason.trim() !== '')
  return (
    <DialogFrame title={title} description={description} confirmLabel={confirmLabel} canSubmit={ready} onSubmit={() => onSubmit({ effectiveDate: date, reason: reason.trim() })} onClose={onClose}>
      <label className={labelClass}>Effective date
        <input type="date" value={date} onChange={event => setDate(event.target.value)} required className={inputClass} />
      </label>
      {withReason && (
        <label className={labelClass}>Reason for the correction
          <textarea value={reason} onChange={event => setReason(event.target.value)} rows="3" required className={inputClass} />
        </label>
      )}
    </DialogFrame>
  )
}

/** Record the approval that was completed outside AchieveNest. The rank is fixed to the HR final recommendation. */
export function RecordApprovedRankDialog({ review, officialDocument, onSubmit, onClose }) {
  const [approvalDate, setApprovalDate] = useState('')
  const [effectivityDate, setEffectivityDate] = useState(today())
  const [file, setFile] = useState(null)
  const rankLabel = facultyRankCatalogService.FULL_TIME_RANKS.find(rank => rank.code === review.hr_final_rank_code)?.label || review.hr_final_rank_code
  const ready = approvalDate !== '' && effectivityDate !== '' && file !== null
  return (
    <DialogFrame
      title="Record approved rank"
      description="Record the approval that was signed outside AchieveNest. The approved rank must match the HR final recommendation."
      confirmLabel="Record approved rank"
      canSubmit={ready}
      onSubmit={() => onSubmit({ approvedRankCode: review.hr_final_rank_code, approvalDate, effectivityDate, officialDocumentId: officialDocument.id, signedDocument: file })}
      onClose={onClose}
    >
      <dl className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
        <dt className="text-xs font-bold text-slate-500">Approved rank</dt>
        <dd className="font-black">{rankLabel}</dd>
      </dl>
      <label className={labelClass}>Approval date
        <input type="date" value={approvalDate} onChange={event => setApprovalDate(event.target.value)} max={today()} required className={inputClass} />
      </label>
      <label className={labelClass}>Effectivity date
        <input type="date" value={effectivityDate} min={today()} onChange={event => setEffectivityDate(event.target.value)} required className={inputClass} />
        <span className="mt-1 block text-xs font-normal text-slate-500">A future date keeps the rank pending until that day. Past dates are not accepted.</span>
      </label>
      <label className={labelClass}>Signed approved document
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={event => setFile(event.target.files?.[0] || null)} required className={inputClass} />
      </label>
    </DialogFrame>
  )
}

/** Formal, non-destructive correction of an approved rank record. */
export function CorrectApprovedRankDialog({ record, onSubmit, onClose }) {
  const [type, setType] = useState('data')
  const [reason, setReason] = useState('')
  const [rankCode, setRankCode] = useState(record.approved_rank_code || record.rank_code || '')
  const [approvalDate, setApprovalDate] = useState(record.approval_date || '')
  const [effectivityDate, setEffectivityDate] = useState(record.effectivity_date || '')
  const [reuse, setReuse] = useState(true)
  const [stillSupports, setStillSupports] = useState(false)
  const [file, setFile] = useState(null)
  const original = record.approved_rank_code || record.rank_code || ''
  const substantive = type === 'substantive'
  const rankChanged = substantive && rankCode !== original
  const needsNewDocument = rankChanged && !(reuse && stillSupports)
  const ready = reason.trim() !== '' && (!needsNewDocument || file !== null)

  return (
    <DialogFrame
      title="Correct approved rank"
      description="The original record is kept. A corrected record replaces it going forward."
      confirmLabel="Save correction"
      canSubmit={ready}
      onSubmit={() => onSubmit({
        correctionType: type,
        reason: reason.trim(),
        approvedRankCode: substantive ? rankCode : undefined,
        approvalDate,
        effectivityDate,
        reuseOriginalDocument: reuse && !file,
        originalDocumentStillSupports: stillSupports,
        supportingDocument: file
      })}
      onClose={onClose}
    >
      <label className={labelClass}>Type of correction
        <select value={type} onChange={event => setType(event.target.value)} className={inputClass}>
          <option value="data">Data correction (dates, details; the rank stays the same)</option>
          <option value="substantive">Substantive correction (the rank changes)</option>
        </select>
      </label>
      {substantive && (
        <label className={labelClass}>Corrected rank
          <select value={rankCode} onChange={event => setRankCode(event.target.value)} className={inputClass}>
            {facultyRankCatalogService.FULL_TIME_RANKS.map(rank => <option key={rank.code} value={rank.code}>{rank.label}</option>)}
          </select>
        </label>
      )}
      <label className={labelClass}>Approval date
        <input type="date" value={approvalDate} onChange={event => setApprovalDate(event.target.value)} className={inputClass} />
      </label>
      <label className={labelClass}>Effectivity date
        <input type="date" value={effectivityDate} onChange={event => setEffectivityDate(event.target.value)} className={inputClass} />
        <span className="mt-1 block text-xs font-normal text-slate-500">Only a pending rank can move to a new future date.</span>
      </label>
      <label className={labelClass}>Reason for the correction
        <textarea value={reason} onChange={event => setReason(event.target.value)} rows="3" required className={inputClass} />
      </label>
      <label className="flex items-start gap-2 text-sm font-semibold">
        <input type="checkbox" checked={reuse} onChange={event => setReuse(event.target.checked)} className="mt-1" />
        Keep the original signed document
      </label>
      {rankChanged && reuse && (
        <label className="flex items-start gap-2 text-sm font-semibold">
          <input type="checkbox" checked={stillSupports} onChange={event => setStillSupports(event.target.checked)} className="mt-1" />
          The original document still supports the corrected rank
        </label>
      )}
      <label className={labelClass}>New supporting document{needsNewDocument ? ' (required)' : ' (optional)'}
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={event => setFile(event.target.files?.[0] || null)} className={inputClass} />
      </label>
    </DialogFrame>
  )
}
