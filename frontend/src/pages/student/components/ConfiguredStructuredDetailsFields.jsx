import React, { useEffect } from 'react'
import { AlertCircle, HelpCircle } from 'lucide-react'
import { localToday } from '../../../utils/employmentDate'

export function applyConfiguredFieldDefaults(metadata = {}, contract) {
  const version = contract?.schema_version || 'student-form-schema-2'
  const next = { ...metadata, schema_version: version }
  let changed = metadata.schema_version !== version
  ;(contract?.fields || []).forEach(field => {
    if (field.control === 'fixed' && next[field.key] !== field.validation?.value) {
      next[field.key] = field.validation?.value || ''
      changed = true
    }
  })
  return changed ? next : metadata
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-[#16834a] focus:outline-none focus:ring-2 focus:ring-[#16834a]/20 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
const optionsFor = field => (field.options || []).map(option => typeof option === 'string' ? { value: option, label: option } : option)

export default function ConfiguredStructuredDetailsFields({ contract, structuredMetadata = {}, onChange, errors = {}, disabled = false }) {
  const fields = contract?.fields || []
  const version = contract?.schema_version || 'student-form-schema-2'
  const today = localToday()
  useEffect(() => {
    const next = applyConfiguredFieldDefaults(structuredMetadata, contract)
    if (next !== structuredMetadata) onChange?.(next)
  }, [contract, structuredMetadata, onChange])

  if (!contract || fields.length === 0) return <p className="text-sm text-slate-500">No intake fields are configured for this achievement type.</p>
  const set = (key, value) => onChange?.({ ...structuredMetadata, schema_version: version, [key]: value })
  const requiredNow = field => {
    const rule = field.validation?.required_when
    return Boolean(field.required || (rule && Object.entries(rule).some(([key, value]) => structuredMetadata[key] === value)))
  }
  const visible = field => {
    const rule = field.validation?.visible_when
    return !rule || Object.entries(rule).every(([key, value]) => structuredMetadata[key] === value)
  }

  return <div className="space-y-4 pt-2" data-testid="configured-structured-details-fields">
    <div className="border-b border-slate-200 pb-2 dark:border-slate-800">
      <h4 className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
        <span>Category-Specific Fields: {contract.label}</span>
        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">{contract.category_label}</span>
      </h4>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Complete the details required for this achievement type.</p>
    </div>
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {fields.filter(visible).map(field => {
        const control = field.control || 'text'
        const error = errors[field.key] || field.payload_keys?.map(key => errors[key]).find(Boolean)
        const label = <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor={`meta-${field.key}`}>{field.label} {requiredNow(field) && <span className="text-rose-600" aria-hidden="true">*</span>}</label>
        const help = field.help_text || field.helpText
        const span = ['textarea', 'date_range', 'structured_date_or_range', 'ongoing_academic_year_or_activity_dates'].includes(control) ? 'sm:col-span-2' : ''
        let controlUi
        if (control === 'fixed') {
          controlUi = <input id={`meta-${field.key}`} readOnly value={field.validation?.value || structuredMetadata[field.key] || ''} className={`${inputClass} bg-slate-50`} />
        } else if (control === 'select') {
          controlUi = <select id={`meta-${field.key}`} value={structuredMetadata[field.key] ?? ''} disabled={disabled} onChange={event => set(field.key, event.target.value)} className={inputClass}><option value="">Select an option</option>{optionsFor(field).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        } else if (control === 'date') {
          controlUi = <input id={`meta-${field.key}`} type="date" max={today} value={structuredMetadata[field.key] ?? ''} disabled={disabled} onChange={event => set(field.key, event.target.value)} className={inputClass} />
        } else if (control === 'decimal') {
          controlUi = <input id={`meta-${field.key}`} type="number" step="0.01" min={field.validation?.minimum_exclusive != null ? Number(field.validation.minimum_exclusive) + 0.01 : 0} max={field.validation?.maximum} value={structuredMetadata[field.key] ?? ''} disabled={disabled} onChange={event => set(field.key, event.target.value === '' ? '' : Number(event.target.value))} className={inputClass} />
        } else if (control === 'textarea') {
          controlUi = <textarea id={`meta-${field.key}`} rows={3} value={structuredMetadata[field.key] ?? ''} disabled={disabled} onChange={event => set(field.key, event.target.value)} className={`${inputClass} py-2`} />
        } else if (control === 'date_range') {
          const rules = field.validation || {}
          const startDate = structuredMetadata[rules.start_key] || ''
          controlUi = <div className="grid grid-cols-2 gap-2"><input aria-label={`${field.label} start date`} type="date" max={today} value={startDate} disabled={disabled} onChange={event => set(rules.start_key, event.target.value)} className={inputClass}/><input aria-label={`${field.label} end date`} type="date" min={startDate || undefined} max={today} value={structuredMetadata[rules.end_key] || ''} disabled={disabled} onChange={event => set(rules.end_key, event.target.value)} className={inputClass}/></div>
        } else if (control === 'structured_date_or_range') {
          const range = structuredMetadata.period_precision === 'RANGE'
          const dateValue = prefix => {
            const year = String(structuredMetadata[`${prefix}_year`] || '').padStart(4, '0')
            const month = String(structuredMetadata[`${prefix}_month`] || '').padStart(2, '0')
            const day = String(structuredMetadata[`${prefix}_day`] || '').padStart(2, '0')
            return /^\d{4}$/.test(year) && /^\d{2}$/.test(month) && /^\d{2}$/.test(day)
              ? `${year}-${month}-${day}`
              : ''
          }
          const partialDateLabel = prefix => [
            structuredMetadata[`${prefix}_year`],
            structuredMetadata[`${prefix}_month`],
            structuredMetadata[`${prefix}_day`],
          ].filter(value => value !== undefined && value !== null && value !== '').join(' / ')
          const setDateValue = (prefix, value) => {
            const [year = '', month = '', day = ''] = value.split('-')
            onChange?.({
              ...structuredMetadata,
              schema_version: version,
              [`${prefix}_year`]: year,
              [`${prefix}_month`]: month ? String(Number(month)) : '',
              [`${prefix}_day`]: day ? String(Number(day)) : '',
            })
          }
          const startDate = dateValue('period_start')
          const endDate = dateValue('period_end')
          controlUi = <div className="space-y-2">
            <select aria-label={`${field.label} precision`} value={structuredMetadata.period_precision || ''} disabled={disabled} onChange={event => set('period_precision', event.target.value)} className={inputClass}>
              <option value="">Choose specific date or range</option>
              <option value="DATE">Specific date</option>
              <option value="RANGE">Date range</option>
            </select>
            {structuredMetadata.period_precision === 'DATE' && <label className="block">
              <span className="sr-only">Achievement date</span>
              <input aria-label="Achievement date" type="date" min="1900-01-01" max={today} value={startDate} disabled={disabled} onChange={event => setDateValue('period_start', event.target.value)} className={inputClass}/>
              {!startDate && partialDateLabel('period_start') && <span className="mt-1 block text-[11px] text-amber-800 dark:text-amber-300">Saved date parts: {partialDateLabel('period_start')}. Choose a complete date.</span>}
            </label>}
            {range && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Start date</span><input aria-label="Start date" type="date" min="1900-01-01" max={today} value={startDate} disabled={disabled} onChange={event => setDateValue('period_start', event.target.value)} className={inputClass}/>{!startDate && partialDateLabel('period_start') && <span className="mt-1 block text-[11px] text-amber-800 dark:text-amber-300">Saved date parts: {partialDateLabel('period_start')}.</span>}</label>
              <label className="block"><span className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">End date</span><input aria-label="End date" type="date" min={startDate || '1900-01-01'} max={today} value={endDate} disabled={disabled} onChange={event => setDateValue('period_end', event.target.value)} className={inputClass}/>{!endDate && partialDateLabel('period_end') && <span className="mt-1 block text-[11px] text-amber-800 dark:text-amber-300">Saved date parts: {partialDateLabel('period_end')}.</span>}</label>
            </div>}
          </div>
        } else if (control === 'ongoing_academic_year_or_activity_dates') {
          const mode = structuredMetadata.record_mode || ''
          controlUi = <div className="space-y-2"><select aria-label="Record period type" value={mode} disabled={disabled} onChange={event => set('record_mode', event.target.value)} className={inputClass}><option value="">Select period type</option><option value="ACADEMIC_YEAR">Academic year</option><option value="ACTIVITY">Activity dates</option></select>{mode === 'ACADEMIC_YEAR' && <input aria-label="Academic year" placeholder="YYYY-YYYY" value={structuredMetadata.academic_year_start || ''} disabled={disabled} onChange={event => set('academic_year_start', event.target.value)} className={inputClass} />}{mode === 'ACTIVITY' && <div className="grid grid-cols-2 gap-2"><input aria-label="Activity start date" type="date" max={today} value={structuredMetadata.activity_start_date || ''} disabled={disabled} onChange={event => set('activity_start_date', event.target.value)} className={inputClass}/><input aria-label="Activity end date" type="date" min={structuredMetadata.activity_start_date || undefined} max={today} value={structuredMetadata.activity_end_date || ''} disabled={disabled} onChange={event => set('activity_end_date', event.target.value)} className={inputClass}/></div>}</div>
        } else {
          controlUi = <input id={`meta-${field.key}`} type={control === 'academic_year' ? 'text' : 'text'} placeholder={control === 'academic_year' ? 'YYYY-YYYY' : ''} value={structuredMetadata[field.key] ?? ''} disabled={disabled} onChange={event => set(field.key, event.target.value)} className={inputClass}/>
        }
        return <div key={field.key} className={span} data-testid={`configured-field-${field.key}`}>{label}{controlUi}{help && <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><HelpCircle className="h-3 w-3 shrink-0"/><span>{help}</span></p>}{error && <p className="mt-1 flex items-center gap-1 text-xs text-rose-600" role="alert"><AlertCircle className="h-3.5 w-3.5 shrink-0"/><span>{error}</span></p>}</div>
      })}
    </div>
  </div>
}
