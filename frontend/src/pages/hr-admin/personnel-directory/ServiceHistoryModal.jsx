import React, { useEffect, useState } from 'react'
import { Check, X, History } from 'lucide-react'
import { personnelServiceHistoryService } from '../../../services/personnelServiceHistoryService'
import ServicePeriodsEditor from './ServicePeriodsEditor'
import {
  apiErrorToFormErrors,
  emptyPeriod,
  toEditablePeriod,
  toPayloadSegments,
  validateServiceHistory,
} from '../../../utils/serviceHistory'

const NO_ERRORS = { rows: {}, form: '', changeReason: '' }

/**
 * HR editor for a person's employment periods. Each save creates a new HR-confirmed version;
 * earlier versions are kept. Part-time periods never count toward length of service.
 */
export default function ServiceHistoryModal({ personnel, history, isOpen, onClose, onSaved, onConflict }) {
  const [periods, setPeriods] = useState([])
  const [changeReason, setChangeReason] = useState('')
  const [errors, setErrors] = useState(NO_ERRORS)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const segments = history?.current_version?.segments || []
    setPeriods(segments.length ? segments.map(toEditablePeriod) : [{ ...emptyPeriod(), start_date: personnel?.employment_start_date || '', is_ongoing: true }])
    setChangeReason('')
    setErrors(NO_ERRORS)
    setSaving(false)
  }, [isOpen, history, personnel])

  useEffect(() => {
    if (!isOpen) return
    // Escape closes only this editor, not the dossier drawer underneath it.
    const onKeyDown = event => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [isOpen, onClose])

  if (!isOpen || !personnel) return null


  const submit = async event => {
    event.preventDefault()
    const result = validateServiceHistory(periods, changeReason)
    if (!result.isValid) { setErrors(result); return }
    setErrors(NO_ERRORS)
    setSaving(true)
    try {
      const saved = await personnelServiceHistoryService.save(personnel.id, {
        expected_version_number: history?.current_version?.version_number || 0,
        change_reason: changeReason.trim(),
        segments: toPayloadSegments(periods),
      })
      onSaved?.(saved)
      onClose()
    } catch (apiError) {
      if (apiError?.response?.status === 409) {
        // Another HR user saved first: reload the latest version instead of overwriting it.
        onConflict?.()
        onClose()
        return
      }
      setErrors(apiErrorToFormErrors(apiError))
      setSaving(false)
    }
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-950'

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-slate-900/40" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <form
          onSubmit={submit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-history-title"
          className="pointer-events-auto flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-[#131e2e]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 id="service-history-title" className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <History className="h-4 w-4" aria-hidden="true" /> Service History
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{personnel.full_name} · Saving creates version {(history?.current_version?.version_number || 0) + 1}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close service history" className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">
              Record each employment period at NDMU from the official HR record. Only full-time periods count toward length of service; part-time periods and gaps between periods are not counted.
            </p>

            <ServicePeriodsEditor periods={periods} onChange={setPeriods} rowErrors={errors.rows} />

            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Reason for this change
              <textarea value={changeReason} onChange={e => setChangeReason(e.target.value)} rows="2" maxLength={1000} placeholder="e.g. Recorded from 201 file; corrected 2014–2018 break in service" className={inputClass} />
            </label>
            {errors.changeReason && <p role="alert" className="text-xs font-bold text-rose-600">{errors.changeReason}</p>}
            {errors.form && <p role="alert" className="text-xs font-bold text-rose-600">{errors.form}</p>}
          </div>

          <footer className="flex justify-end gap-2 border-t border-slate-200 px-6 py-3 dark:border-slate-800">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-1 rounded-xl bg-[#176B43] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
              <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Service History'}
            </button>
          </footer>
        </form>
      </div>
    </>
  )
}
