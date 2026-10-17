import React, { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { decodeLockedValue, fixedNonTeachingCriterion } from '../../../../../utils/nonTeachingLockedCriterion'

const points = value => `${Number(value || 0).toFixed(2)} pts`

export default function NonTeachingCriterionEvaluation({ selectedEvidence: item, evidence = [], categoryRaw = 0, criteriaSnapshot, onVerifyAndNext, onReject, onOpenEvidence, onRemarksChange }) {
  const [remarks, setRemarks] = useState('')
  const [manualPoints, setManualPoints] = useState('')
  const [classification, setClassification] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [showRemarks, setShowRemarks] = useState(false)
  useEffect(() => {
    setRemarks(item?.evaluatorRemarks ?? item?.evaluator_remarks ?? '')
    setManualPoints(item?.ratingStatus === 'rated' ? String(item.awardedPoints ?? '') : '')
    setClassification('')
    setError('')
    setRejecting(false)
    setShowRemarks(Boolean(item?.evaluatorRemarks ?? item?.evaluator_remarks))
  }, [item?.id, item?.evaluatorRemarks, item?.evaluator_remarks, item?.ratingStatus, item?.awardedPoints])
  if (!item) return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Select an accomplishment in the portfolio to review it.</p>

  const fixed = fixedNonTeachingCriterion(item)
  const snapshot = decodeLockedValue(item.criterion_snapshot ?? item.criterionSnapshot)
  const category = decodeLockedValue(snapshot.category)
  const leaf = decodeLockedValue(snapshot.subcategory ?? snapshot.level)
  const displayCode = String(item.criterionCode ?? item.criterion_code ?? '')
  const code = displayCode.toUpperCase()
  const broadB2 = code === 'B.2' && String(category.category_code ?? '').toUpperCase() === 'B.2'
    && !snapshot.subcategory && String(item.criterionKey ?? item.criterion_key ?? '').toUpperCase() === 'B.2'
  const lockedCriteria = decodeLockedValue(criteriaSnapshot)
  const lockedB2 = (lockedCriteria.areas || []).flatMap(area => area.categories || []).find(entry => String(entry.category_code || '').toUpperCase() === 'B.2')
  const choices = broadB2 ? ['B.2.a', 'B.2.b', 'B.2.c'].map((choice, index) => {
    const leaf = (lockedB2?.subcategories || []).find(entry => String(entry.subcategory_code || '').toUpperCase() === `B.2.${index + 1}`)
    return leaf && Number(leaf.default_points) > 0 ? { code: choice, points: Number(leaf.default_points), leaf: leaf.subcategory_code, label: leaf.name || leaf.title || choice } : null
  }).filter(Boolean) : []
  const selectedChoice = choices.find(choice => choice.code === classification)
  const classificationLabel = fixed ? `${displayCode} · ${leaf.name || leaf.title || fixed.leafCode}` : selectedChoice ? `${selectedChoice.code} · ${selectedChoice.label}` : ''
  const manual = code === 'B.5' && String(category.category_code ?? '').toUpperCase() === 'B.5'
    && String(snapshot.criterion_reference ?? '').toUpperCase() === String(item.criterionKey ?? item.criterion_key ?? '').toUpperCase()
    && Boolean(snapshot.evaluator_judgment_required) && Boolean(item.evaluator_judgment_required)
  const valid = Boolean(fixed || manual || selectedChoice)
  const categoryCode = fixed?.categoryCode ?? code
  const categoryMax = fixed?.categoryMax ?? Number(lockedB2?.max_points || category.max_points || item.max_allowed_points || 0)
  const awarded = item.verificationStatus === 'verified' && item.ratingStatus === 'rated' ? Number(item.awardedPoints || 0) : 0
  const proposed = fixed?.points ?? selectedChoice?.points ?? Number(manualPoints)
  const projectedRaw = Number(categoryRaw || 0) - awarded + (Number.isFinite(proposed) ? proposed : 0)
  const counted = Math.min(categoryMax, Math.max(0, categoryRaw))
  const projectedCounted = Math.min(categoryMax, Math.max(0, projectedRaw))
  const manualValid = manual && manualPoints !== '' && Number.isFinite(proposed) && proposed > 0 && proposed <= categoryMax && Math.round(proposed * 100) === proposed * 100

  const save = async action => {
    setSaving(true); setError('')
    try { await action() }
    catch (cause) { setError(cause?.response?.data?.error?.message || cause?.error?.message || cause?.message || 'The decision could not be saved.') }
    finally { setSaving(false) }
  }

  return <section className="space-y-4 text-sm text-slate-900 dark:text-slate-100" aria-label="Non-teaching accomplishment evaluation">
    <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <header>
        <h2 className="text-base font-bold leading-snug">{item.evidenceTitle || item.title}</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{classificationLabel || (manual ? `${displayCode} · Evaluator assigned points` : `${displayCode} · Criterion mapping needs HR review`)}</p>
      </header>
      {evidence.length ? <div>
        <button type="button" onClick={() => onOpenEvidence?.(evidence[0])} className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-left font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-slate-700 dark:text-emerald-300"><FileText className="h-4 w-4 shrink-0" />View supporting document{evidence.length > 1 ? ` (${evidence.length})` : ''}</button>
        {evidence.length > 1 && <details className="mt-2 text-xs"><summary className="cursor-pointer text-emerald-800 dark:text-emerald-300">Other supporting documents</summary><div className="mt-2 space-y-1">{evidence.slice(1).map((proof, index) => <button key={proof.id || index} type="button" onClick={() => onOpenEvidence?.(proof)} className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-left hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"><FileText className="h-4 w-4 shrink-0" />{proof.original_filename || `Document ${index + 2}`}</button>)}</div></details>}
      </div> : <p className="text-slate-600 dark:text-slate-300">No supporting document is attached.</p>}
      {!valid && !broadB2 && <p role="alert" className="rounded-lg bg-rose-50 p-3 font-semibold text-rose-800">The submitted criterion does not match its locked evaluation snapshot. Ask HR to review the mapping before scoring.</p>}
      {broadB2 && <label className="block font-semibold">Applicable B.2 classification<select value={classification} onChange={event => setClassification(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900"><option value="">Select applicable classification...</option>{choices.map(choice => <option key={choice.code} value={choice.code}>{choice.code} · {choice.label} · {points(choice.points)}</option>)}</select></label>}
      {broadB2 && choices.length === 0 && <p role="alert" className="rounded-lg bg-rose-50 p-3 font-semibold text-rose-800">The locked B.2 classifications are unavailable. Ask HR to review the criteria version before scoring.</p>}
      {manual && <label className="block font-semibold">Points for this qualifying item (maximum {points(categoryMax)})<input type="number" min="0.01" max={categoryMax} step="0.01" value={manualPoints} onChange={event => setManualPoints(event.target.value)} className="mt-2 block w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-900" /></label>}
      {awarded > 0 && <p role="status" className="font-semibold text-emerald-800">Already approved: {points(awarded)}. The full item score remains saved.</p>}
      {!rejecting && !showRemarks && <button type="button" onClick={() => setShowRemarks(true)} className="text-xs font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-300">Add remark</button>}
      {(rejecting || showRemarks) && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">{rejecting ? 'Reason for rejection (required)' : 'Evaluator item remark (optional)'}<textarea rows={3} value={remarks} onChange={event => { setRemarks(event.target.value); onRemarksChange?.(item.id, event.target.value) }} className="mt-2 block w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-2 text-rose-800">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button type="button" disabled={saving} onClick={() => { if (!rejecting) { setRejecting(true); setError(''); return } if (remarks.trim()) save(() => onReject(item.id, remarks)); else setError('Enter a reason before rejecting this accomplishment.') }} className="rounded-lg border border-rose-300 px-4 py-2 font-bold text-rose-800 disabled:opacity-50 sm:flex-1">{rejecting ? 'Confirm rejection' : 'Reject'}</button>
        <button type="button" disabled={saving || !valid || (manual && !manualValid)} onClick={() => save(() => onVerifyAndNext(item.id, proposed, {}, remarks, selectedChoice?.code || ''))} className="rounded-lg bg-emerald-800 px-4 py-2 font-bold text-white disabled:opacity-50 sm:flex-1">{valid && !manual || manualValid ? `Approve this item · ${points(proposed)}` : 'Approve this item'}</button>
      </div>
      {rejecting && <button type="button" onClick={() => { setRejecting(false); setError('') }} className="text-xs font-semibold text-slate-600 underline underline-offset-2 dark:text-slate-300">Cancel rejection</button>}
    </div>
    {valid && <details className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <summary className="cursor-pointer font-semibold">Scoring details</summary>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div><dt>{categoryCode} counted now</dt><dd className="font-bold tabular-nums">{points(counted)} from {points(categoryRaw)} raw</dd></div>
        <div><dt>{categoryCode} if approved</dt><dd className="font-bold tabular-nums">{points(projectedCounted)} from {points(projectedRaw)} raw</dd></div>
        <div><dt>Category maximum</dt><dd className="font-bold tabular-nums">{points(categoryMax)}</dd></div>
      </dl>
    </details>}
  </section>
}
