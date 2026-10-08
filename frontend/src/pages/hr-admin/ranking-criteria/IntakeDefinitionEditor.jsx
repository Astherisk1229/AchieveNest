import React, { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'

const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select']
const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-slate-100'

function asObject(value, fallback = {}) {
  if (typeof value === 'string') {
    try { return JSON.parse(value) || fallback } catch { return fallback }
  }
  return value && typeof value === 'object' ? value : fallback
}

function fieldsOf(value) {
  const parsed = asObject(value, [])
  return Array.isArray(parsed) ? parsed : Array.isArray(parsed.fields) ? parsed.fields : []
}

function evidenceOf(value) {
  const parsed = asObject(value, {})
  return { required: parsed.required !== false, accepted: Array.isArray(parsed.accepted) ? parsed.accepted : [] }
}

function FieldDefinition({ field, index, editable, onChange, onRemove }) {
  const validation = field.validation || {}
  const patch = (name, value) => onChange({ ...field, [name]: value })
  const setValidation = (name, value) => {
    const numeric = value === '' ? undefined : Number(value)
    const next = { ...validation }
    if (numeric === undefined) delete next[name]
    else next[name] = numeric
    patch('validation', next)
  }
  const choices = Array.isArray(field.options) ? field.options : []
  const choiceText = choices.map(choice => typeof choice === 'string' ? choice : choice?.label || choice?.value || '').join('\n')

  return <fieldset className="rounded-lg border border-slate-200 p-3">
    <legend className="px-1 text-xs font-bold text-slate-600">Field {index + 1}</legend>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label><span className="text-xs font-semibold text-slate-600">Field key</span><input disabled={!editable} value={field.key || ''} onChange={event => patch('key', event.target.value)} placeholder="e.g. semester" className={inputClass} /></label>
      <label><span className="text-xs font-semibold text-slate-600">Display label</span><input disabled={!editable} value={field.label || ''} onChange={event => patch('label', event.target.value)} placeholder="e.g. Semester" className={inputClass} /></label>
      <label><span className="text-xs font-semibold text-slate-600">Field type</span><select disabled={!editable} value={field.type || 'text'} onChange={event => patch('type', event.target.value)} className={inputClass}>{FIELD_TYPES.map(type => <option key={type} value={type}>{type === 'textarea' ? 'Long text' : type[0].toUpperCase() + type.slice(1)}</option>)}</select></label>
      <label className="flex items-end gap-2 pb-2 text-sm font-semibold"><input type="checkbox" disabled={!editable} checked={field.required === true} onChange={event => patch('required', event.target.checked)} className="h-4 w-4 accent-emerald-800" />Required</label>
      <label><span className="text-xs font-semibold text-slate-600">OCR mapping key <span className="font-normal">(optional)</span></span><input disabled={!editable} value={field.ocr_key || ''} onChange={event => patch('ocr_key', event.target.value)} placeholder="e.g. units_earned" className={inputClass} /></label>
      <label><span className="text-xs font-semibold text-slate-600">Minimum / length</span><input type="number" min="0" disabled={!editable} value={validation.min ?? validation.minLength ?? ''} onChange={event => setValidation(field.type === 'text' || field.type === 'textarea' ? 'minLength' : 'min', event.target.value)} className={inputClass} /></label>
      <label><span className="text-xs font-semibold text-slate-600">Maximum / length</span><input type="number" min="0" disabled={!editable} value={validation.max ?? validation.maxLength ?? ''} onChange={event => setValidation(field.type === 'text' || field.type === 'textarea' ? 'maxLength' : 'max', event.target.value)} className={inputClass} /></label>
      {field.type === 'select' && <label className="sm:col-span-2 xl:col-span-4"><span className="text-xs font-semibold text-slate-600">Allowed choices <span className="font-normal">(one per line)</span></span><textarea disabled={!editable} rows={3} value={choiceText} onChange={event => patch('options', event.target.value.split(/\r?\n/).map(item => item.trim()).filter(Boolean))} placeholder="Enter only HR-approved choices" className={inputClass} /></label>}
      {editable && <div className="flex items-end sm:col-span-2 xl:col-span-4"><button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"><Trash2 className="h-3.5 w-3.5" />Remove field</button></div>}
    </div>
  </fieldset>
}

export default function IntakeDefinitionEditor({ criterion, editable, updateItem, itemType = 'subcategory' }) {
  const [newEvidence, setNewEvidence] = useState('')
  const fields = fieldsOf(criterion.field_schema)
  const evidence = evidenceOf(criterion.evidence_rules)
  const patch = (field, value) => updateItem(itemType, criterion.id, field, value)
  const setFields = next => patch('field_schema', next)
  const setEvidence = next => patch('evidence_rules', next)
  const addEvidence = () => {
    const value = newEvidence.trim()
    if (!value || evidence.accepted.includes(value)) return
    setEvidence({ ...evidence, accepted: [...evidence.accepted, value] })
    setNewEvidence('')
  }

  return <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70">
    <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700">
      Faculty intake definition <span className="ml-1 text-xs font-medium text-slate-500">{criterion.intake_active === 0 || criterion.intake_active === '0' ? 'Inactive' : `${fields.length} field${fields.length === 1 ? '' : 's'}`}</span>
    </summary>
    <div className="space-y-4 border-t border-slate-200 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {itemType === 'subcategory' && <label><span className="text-xs font-semibold text-slate-600">Selectable criterion label</span><input disabled={!editable} value={criterion.name || ''} onChange={event => patch('name', event.target.value)} className={inputClass} /></label>}
        <label><span className="text-xs font-semibold text-slate-600">Intake mode</span><select disabled={!editable} value={criterion.intake_mode || 'FORM'} onChange={event => patch('intake_mode', event.target.value)} className={inputClass}><option value="FORM">Structured fields</option><option value="MANUAL_HR">Manual / HR-defined</option></select></label>
        <label className="sm:col-span-2"><span className="text-xs font-semibold text-slate-600">Scoring rule reference</span><textarea disabled={!editable} rows={2} value={criterion.scoring_rule_reference || ''} onChange={event => patch('scoring_rule_reference', event.target.value)} placeholder="Enter the approved rule text or state that HR will determine the score." className={inputClass} /></label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2"><input type="checkbox" disabled={!editable} checked={criterion.intake_active !== 0 && criterion.intake_active !== '0'} onChange={event => patch('intake_active', event.target.checked ? 1 : 0)} className="h-4 w-4 accent-emerald-800" />Available for new Faculty accomplishments in this version</label>
      </div>

      {criterion.intake_mode !== 'MANUAL_HR' && <section aria-label={`Required fields for ${criterion.name}`} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h4 className="text-sm font-bold">Required fields</h4><p className="text-xs text-slate-500">Set the fields Faculty must complete and any HR-approved choices.</p></div>{editable && <button type="button" onClick={() => setFields([...fields, { key: `field_${fields.length + 1}`, label: '', type: 'text', required: true, validation: {} }])} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><Plus className="h-3.5 w-3.5" />Add field</button>}</div>
        {fields.length ? fields.map((field, index) => <FieldDefinition key={`${criterion.id}-${index}`} field={field} index={index} editable={editable} onChange={next => setFields(fields.map((item, itemIndex) => itemIndex === index ? next : item))} onRemove={() => setFields(fields.filter((_, itemIndex) => itemIndex !== index))} />) : <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Add the HR-approved fields for this criterion before publishing.</p>}
      </section>}

      {criterion.intake_mode === 'MANUAL_HR' && <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">Faculty can identify this criterion and provide the listed evidence. HR will apply the configured manual scoring rule.</p>}

      <section aria-label={`Accepted evidence for ${criterion.name}`}>
        <div className="flex items-center justify-between gap-2"><div><h4 className="text-sm font-bold">Supporting document</h4><p className="text-xs text-slate-500">List evidence types HR accepts for this criterion.</p></div><label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" disabled={!editable} checked={evidence.required} onChange={event => setEvidence({ ...evidence, required: event.target.checked })} className="h-4 w-4 accent-emerald-800" />Required</label></div>
        {evidence.accepted.length > 0 && <ul className="mt-2 flex flex-wrap gap-2">{evidence.accepted.map((item, index) => <li key={`${item}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">{item}{editable && <button type="button" onClick={() => setEvidence({ ...evidence, accepted: evidence.accepted.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove ${item}`} className="rounded p-0.5 text-slate-500 hover:text-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"><X className="h-3 w-3" aria-hidden="true" /></button>}</li>)}</ul>}
        {editable && <div className="mt-2 flex gap-2"><input value={newEvidence} onChange={event => setNewEvidence(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addEvidence() } }} placeholder="e.g. transcript, institutional record" aria-label="Accepted supporting evidence" className={inputClass} /><button type="button" onClick={addEvidence} disabled={!newEvidence.trim()} className="mt-1 shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-40">Add evidence</button></div>}
        {!editable && evidence.accepted.length === 0 && <p className="mt-2 text-xs text-slate-500">No accepted evidence types configured.</p>}
      </section>
    </div>
  </details>
}
