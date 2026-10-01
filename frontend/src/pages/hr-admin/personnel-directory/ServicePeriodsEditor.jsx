import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CLASSIFICATION_OPTIONS, classificationLabel, emptyPeriod } from '../../../utils/serviceHistory'
import { localToday } from '../../../utils/employmentDate'

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-950 disabled:opacity-60'
const labelClass = 'block text-[11px] font-bold text-slate-600 dark:text-slate-300'

/**
 * Shared employment-period rows (Dossier editor and Onboard Personnel form).
 *
 * `onboarding` = { startDate, currentType } locks the parts the account form already decides:
 * the first period starts on the Employment Start Date, and the last period is the current
 * appointment (ongoing, of the selected Faculty Engagement type).
 */
export default function ServicePeriodsEditor({ periods, onChange, rowErrors = {}, onboarding = null }) {
  const lastIndex = periods.length - 1

  const update = (index, field, value) => {
    onChange(periods.map((period, i) => {
      if (i !== index) return period
      const next = { ...period, [field]: value }
      if (field === 'is_ongoing' && value) next.end_date = ''
      if (field === 'classification' && value === 'part_time') next.excluded = false
      return next
    }))
  }

  const addPeriod = () => {
    if (!onboarding) { onChange([...periods, emptyPeriod()]); return }
    // Insert an earlier period just before the current appointment.
    onChange([...periods.slice(0, lastIndex), emptyPeriod(), periods[lastIndex]])
  }

  const canRemove = index => (onboarding ? periods.length > 2 && index !== 0 && index !== lastIndex : periods.length > 1)

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {periods.map((period, index) => {
          const isFirstLocked = Boolean(onboarding) && index === 0
          const isCurrent = Boolean(onboarding) && index === lastIndex
          return (
            <li key={index} className={`rounded-xl border p-3 ${rowErrors[index] ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{isCurrent ? 'Current appointment' : `Period ${index + 1}`}</p>
                {canRemove(index) && (
                  <button type="button" onClick={() => onChange(periods.filter((_, i) => i !== index))} aria-label={`Remove period ${index + 1}`} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <label className={labelClass}>
                  Start date
                  <input type="date" max={localToday()} value={isFirstLocked ? onboarding.startDate : period.start_date} disabled={isFirstLocked} onChange={e => update(index, 'start_date', e.target.value)} className={inputClass} />
                  {isFirstLocked && <span className="mt-0.5 block text-[10px] font-medium text-slate-500">Same as Employment Start Date</span>}
                </label>
                <label className={labelClass}>
                  End date
                  <input type="date" max={localToday()} min={period.start_date || undefined} value={period.end_date} disabled={period.is_ongoing} onChange={e => update(index, 'end_date', e.target.value)} className={inputClass} />
                </label>
                {isCurrent ? (
                  <p className="flex items-end pb-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">Ongoing (current)</p>
                ) : (
                  <label className="flex items-end gap-2 pb-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={period.is_ongoing} disabled={Boolean(onboarding)} onChange={e => update(index, 'is_ongoing', e.target.checked)} />
                    Ongoing (current)
                  </label>
                )}
                <label className={labelClass}>
                  Employment type
                  {isCurrent ? (
                    <input type="text" value={classificationLabel(onboarding.currentType)} disabled className={inputClass} aria-describedby={`current-type-${index}`} />
                  ) : (
                    <select value={period.classification} onChange={e => update(index, 'classification', e.target.value)} className={inputClass}>
                      {CLASSIFICATION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  )}
                  {isCurrent && <span id={`current-type-${index}`} className="mt-0.5 block text-[10px] font-medium text-slate-500">From Faculty Engagement</span>}
                </label>
              </div>
              {period.classification === 'full_time' ? (
                <div className="mt-2 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
                  <label className="flex items-center gap-2 pb-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={period.excluded} onChange={e => update(index, 'excluded', e.target.checked)} />
                    Exclude from service
                  </label>
                  {period.excluded && (
                    <label className={labelClass}>
                      HR reason for exclusion
                      <input type="text" value={period.hr_reason} placeholder="e.g. Leave without pay" onChange={e => update(index, 'hr_reason', e.target.value)} className={inputClass} />
                    </label>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300">Part-time — not counted toward length of service.</p>
              )}
              <label className={`mt-2 ${labelClass}`}>
                Source / remarks (optional)
                <input type="text" value={period.source_remarks} placeholder="e.g. Appointment paper, 201 file" onChange={e => update(index, 'source_remarks', e.target.value)} className={inputClass} />
              </label>
              {rowErrors[index] && <p role="alert" className="mt-2 text-xs font-bold text-rose-600">{rowErrors[index]}</p>}
            </li>
          )
        })}
      </ol>

      <button type="button" onClick={addPeriod} className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
        <Plus className="h-3.5 w-3.5" /> {onboarding ? 'Add earlier period' : 'Add period'}
      </button>
    </div>
  )
}
