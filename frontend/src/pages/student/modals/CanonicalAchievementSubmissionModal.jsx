import React, { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronLeft, Eye, FileText, LoaderCircle, RefreshCw, Save, Send, ShieldCheck, Sparkles, Trash2, Upload, X } from 'lucide-react'
import studentAchievementLifecycleService from '../../../services/studentAchievementLifecycleService'

const ACCEPTED_TYPES = 'image/jpeg,image/png,application/pdf'
const BASIC_FIELDS = [['activity_title', 'Activity / Event Title'], ['start_date_raw', 'Start Date'], ['end_date_raw', 'End Date'], ['venue', 'Venue'], ['organizer_granting_body', 'Organizer / Granting Body']]

function fieldControl(field, value, onChange, disabled) {
  const shared = { id: `achievement-field-${field.key}`, name: field.key, value: value ?? '', disabled, onChange: e => onChange(field.key, e.target.value), className: 'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800' }
  if (field.type === 'textarea') return <textarea {...shared} rows={3} className={`${shared.className} py-2`} />
  if (field.type === 'select' || field.type === 'enum') return <select {...shared}><option value="">Select an option</option>{(field.options || field.enum_values || []).map(option => <option key={typeof option === 'string' ? option : option.value} value={typeof option === 'string' ? option : option.value}>{typeof option === 'string' ? option : option.label}</option>)}</select>
  return <input {...shared} type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} />
}

export default function CanonicalAchievementSubmissionModal({ isOpen, onClose }) {
  const titleId = useId()
  const [draft, setDraft] = useState(null)
  const [catalog, setCatalog] = useState(null)
  const [catalogProblem, setCatalogProblem] = useState(null)
  const [categoryCode, setCategoryCode] = useState('')
  const [contract, setContract] = useState(null)
  const [fields, setFields] = useState({})
  const [basicFields, setBasicFields] = useState({})
  const [basicTouched, setBasicTouched] = useState({})
  const [documentDerived, setDocumentDerived] = useState({})
  const [evidence, setEvidence] = useState([])
  const [previews, setPreviews] = useState({})
  const [fullPreview, setFullPreview] = useState(null)
  const [ocr, setOcr] = useState(null)
  const [scanMessage, setScanMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [message, setMessage] = useState(null)
  const replacementInputRef = useRef(null)
  const replacementTargetRef = useRef(null)

  const categories = catalog?.categories || []
  const selectedCategory = categories.find(category => category.code === categoryCode || category.code === contract?.category_code)
  const selectedContract = selectedCategory?.subcategories?.find(item => item.contract_code === contract?.contract_code) || contract
  const canSave = Boolean(draft?.achievement_record_id)
  const cleanEvidence = evidence.some(item => item.security_status === 'clean' && item.status === 'active')

  useEffect(() => {
    if (!isOpen) return
    let active = true
    setBusy(true); setMessage(null); setCatalogProblem(null); setReviewing(false); setOcr(null); setScanMessage(''); setBasicFields({}); setBasicTouched({}); setDocumentDerived({}); setFullPreview(null)
    Promise.allSettled([studentAchievementLifecycleService.createDraft(), studentAchievementLifecycleService.getSchema()])
      .then(([draftResult, schemaResult]) => {
        if (!active) return
        if (draftResult.status === 'fulfilled') {
          const created = draftResult.value
          setDraft(created); setEvidence(created.evidence || []); setFields(created.draft_fields || {})
        } else {
          setMessage({ type: 'error', text: 'We could not start a new achievement draft. Please try again.' })
        }
        if (schemaResult.status === 'fulfilled' && Array.isArray(schemaResult.value?.categories)) {
          setCatalog(schemaResult.value)
        } else {
          setCatalogProblem('Achievement types are temporarily unavailable. You can save evidence and try again, but you cannot submit until the form schema loads.')
        }
      })
      .finally(() => active && setBusy(false))
    return () => { active = false }
  }, [isOpen])

  useEffect(() => {
    if (!draft?.achievement_record_id || evidence.length === 0) { setPreviews({}); return undefined }
    let cancelled = false
    const urls = []
    Promise.all(evidence.map(async item => {
      try {
        const blob = await studentAchievementLifecycleService.previewEvidence(draft.achievement_record_id, item.id)
        const url = URL.createObjectURL(blob); urls.push(url)
        return [item.id, url]
      } catch { return null }
    })).then(entries => { if (!cancelled) setPreviews(Object.fromEntries(entries.filter(Boolean))) })
    return () => { cancelled = true; urls.forEach(url => URL.revokeObjectURL(url)) }
  }, [draft?.achievement_record_id, evidence])

  const chooseCategory = event => {
    setCategoryCode(event.target.value)
    setContract(null)
    setFields({})
    setMessage(null)
  }

  const chooseContract = async event => {
    const code = event.target.value
    const next = categories.flatMap(category => category.subcategories || []).find(item => item.contract_code === code) || null
    setContract(next); setFields({}); setMessage(null)
    if (next && draft) {
      try {
        const saved = await studentAchievementLifecycleService.saveDraft(draft.achievement_record_id, { contract_code: next.contract_code, fields: {} })
        setDraft(saved); setEvidence(saved.evidence || []); setFields(saved.draft_fields || {})
      } catch (error) { setMessage({ type: 'error', text: error?.error?.message || 'Unable to select this achievement type.' }) }
    }
  }

  const saveDraft = async () => {
    if (!draft) return
    setBusy(true); setMessage(null)
    try {
      const saved = await studentAchievementLifecycleService.saveDraft(draft.achievement_record_id, { contract_code: contract?.contract_code || null, fields })
      setDraft(saved); setEvidence(saved.evidence || []); setFields(saved.draft_fields || fields)
      setMessage({ type: 'success', text: 'Draft saved.' })
    } catch (error) { setMessage({ type: 'error', text: error?.error?.message || 'Draft could not be saved.' }) } finally { setBusy(false) }
  }

  const applyOcrReview = ocrResponse => {
    const review = ocrResponse?.review_suggestions || []
    if (!review.length) return
    setBasicFields(previous => {
      const next = { ...previous }
      review.forEach(item => {
        if (!basicTouched[item.key] && !next[item.key] && item.value) next[item.key] = item.value
      })
      return next
    })
    setDocumentDerived(previous => {
      const next = { ...previous }
      review.forEach(item => {
        if (!basicTouched[item.key] && item.value) next[item.key] = true
      })
      return next
    })
  }

  const uploadEvidence = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !draft) return
    const replacing = replacementTargetRef.current
    replacementTargetRef.current = null
    setBusy(true); setMessage(null); setScanMessage('Checking your document…')
    try {
      if (replacing) setScanMessage('Uploading replacement…')
      const uploaded = await studentAchievementLifecycleService.uploadEvidence(draft.achievement_record_id, file)
      let scanned = null
      try {
        if (replacing) {
          setScanMessage('Checking replacement…')
          await new Promise(resolve => window.setTimeout(resolve, 0))
          setScanMessage('Reading replacement…')
        } else {
          setScanMessage('Checking your document…')
        }
        scanned = await studentAchievementLifecycleService.scanEvidence(draft.achievement_record_id, uploaded.evidence_id)
      } catch {
        // The upload is already canonical and recoverable. A scan failure must
        // never be shown as an upload failure or block manual entry.
        setScanMessage(replacing ? 'We could not check the replacement yet. You can continue entering details manually.' : 'We could not check this document yet. You can continue entering details manually.')
      }
      if (replacing) {
        try {
          await studentAchievementLifecycleService.removeEvidence(draft.achievement_record_id, replacing.id)
        } catch {
          const actual = await studentAchievementLifecycleService.getDraft(draft.achievement_record_id)
          setDraft(actual); setEvidence(actual.evidence || [])
          setMessage({ type: 'error', text: 'The new document was uploaded, but we could not finish the replacement. Both documents remain attached. Please try again.' })
          return
        }
      }
      const refreshed = await studentAchievementLifecycleService.getDraft(draft.achievement_record_id)
      setDraft(refreshed); setEvidence(refreshed.evidence || []); setOcr(scanned?.ocr || null)
      applyOcrReview(scanned?.ocr)
      if (scanned) setScanMessage(scanned.scan?.status === 'clean' ? (replacing ? 'Replacement ready.' : 'Your document is ready.') : scanned.scan?.status === 'infected' ? 'This document could not be accepted.' : 'We could not check this document yet. You can continue entering details manually.')
    } catch {
      setScanMessage('')
      setMessage({ type: 'error', text: replacing ? 'The replacement could not be uploaded. Your existing document is still attached. Please check the file and try again.' : 'Evidence could not be uploaded. Please choose a JPEG, PNG, or PDF under 10 MiB and try again.' })
    } finally { setBusy(false) }
  }

  const startReplacement = item => {
    replacementTargetRef.current = item
    replacementInputRef.current?.click()
  }

  const removeEvidence = async evidenceId => {
    if (!draft) return
    setBusy(true); setMessage(null)
    try {
      const refreshed = await studentAchievementLifecycleService.removeEvidence(draft.achievement_record_id, evidenceId)
      setDraft(refreshed); setEvidence(refreshed.evidence || []); setOcr(null); setPreviews({})
      setScanMessage('Document removed from this draft.')
    } catch (error) { setMessage({ type: 'error', text: error?.error?.message || 'Document could not be removed.' }) } finally { setBusy(false) }
  }

  const submit = async () => {
    if (!draft) return
    setBusy(true); setMessage(null)
    try {
      await saveDraft()
      const result = await studentAchievementLifecycleService.submit(draft.achievement_record_id)
      const pending = result?.routing_status === 'routing_pending'
      setMessage({ type: 'success', text: pending ? 'Submitted — awaiting coordinator assignment. Your achievement and evidence were safely received.' : 'Submitted for verification.' })
      setReviewing(false)
    } catch (error) { setMessage({ type: 'error', text: error?.error?.message || 'Complete the required fields and clean evidence before submitting.' }) } finally { setBusy(false) }
  }

  if (!isOpen) return null
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4">
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden bg-[#f8fbf8] shadow-2xl dark:bg-slate-950 sm:h-[92vh] sm:rounded-3xl">
      <header className="flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-7">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#16834a]">Student achievements</p><h2 id={titleId} className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Add achievement</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Upload your proof, review what we found, then complete the remaining details.</p></div>
        <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16834a] dark:hover:bg-slate-800" aria-label="Close form"><X size={20}/></button>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
        {message && <div role="alert" className={`mb-5 flex gap-2 rounded-xl border p-3 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>{message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}<span>{message.text}</span></div>}
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
          <aside className="h-fit rounded-2xl border border-[#dce6df] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0">
            <div className="flex items-center gap-2"><ShieldCheck className="text-[#16834a]" size={19}/><h3 className="font-bold text-slate-900 dark:text-white">Evidence</h3></div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">PDF, JPG, or PNG · up to 10 MiB · PDFs up to two pages.</p>
            <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#a9c6b1] bg-[#f6fbf7] px-4 text-center transition hover:border-[#16834a] hover:bg-[#edf8f0] focus-within:ring-2 focus-within:ring-[#16834a] dark:bg-slate-950"><Upload className="mb-2 text-[#16834a]"/><span className="text-sm font-bold text-slate-800 dark:text-slate-100">Upload supporting evidence</span><span className="mt-1 text-xs text-slate-500">Choose a document to begin.</span><input className="sr-only" type="file" accept={ACCEPTED_TYPES} onChange={uploadEvidence} disabled={busy || !draft}/></label>
            <input ref={replacementInputRef} className="sr-only" type="file" accept={ACCEPTED_TYPES} onChange={uploadEvidence} disabled={busy || !draft} aria-label="Choose replacement document" />
            {scanMessage && <p aria-live="polite" className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{busy && <LoaderCircle className="mr-2 inline animate-spin" size={14}/>} {scanMessage}</p>}
            <div className="mt-4 space-y-3">{Array.isArray(evidence) && evidence.map(item => <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 text-xs dark:border-slate-800">{previews[item.id] && (item.detected_mime_type === 'application/pdf' ? <iframe title={`First page of ${item.original_filename}`} src={`${previews[item.id]}#page=1&view=FitH`} className="h-44 w-full border-0" /> : <img src={previews[item.id]} alt={`Preview of ${item.original_filename}`} className="h-44 w-full object-contain" />)}<div className="flex items-center gap-2 p-3"><FileText className="shrink-0 text-[#16834a]" size={17}/><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800 dark:text-slate-100">{item.original_filename}</p><p className="capitalize text-slate-500">{item.security_status === 'clean' ? 'Ready for submission' : item.security_status === 'rejected' ? 'Rejected' : 'Checking document'}</p></div><button type="button" onClick={() => setFullPreview(item)} className="rounded p-2 hover:bg-slate-100" aria-label={`View full document ${item.original_filename}`}><Eye size={16}/></button><button type="button" disabled={busy || !['draft', 'revision_requested'].includes(draft?.version?.submission_state)} onClick={() => startReplacement(item)} className="rounded p-2 text-[#126b3c] hover:bg-emerald-50 disabled:opacity-50" aria-label={`Replace ${item.original_filename}`}><RefreshCw size={16}/></button><button type="button" disabled={busy || !['draft', 'revision_requested'].includes(draft?.version?.submission_state)} onClick={() => removeEvidence(item.id)} className="rounded p-2 text-rose-700 hover:bg-rose-50" aria-label={`Remove ${item.original_filename}`}><Trash2 size={16}/></button></div></div>)}</div>
          </aside>
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#dce6df] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2"><Sparkles className="text-[#16834a]" size={18}/><h3 className="font-bold text-slate-900 dark:text-white">Basic information</h3></div><p className="mt-1 text-xs text-slate-500">OCR assistance is optional. Your confirmed entries are always authoritative.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{BASIC_FIELDS.map(([key,label]) => <label key={key} className={key === 'activity_title' || key === 'organizer_granting_body' ? 'sm:col-span-2' : ''}><span className="mb-1 flex gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">{label}{documentDerived[key] && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800">From your document</span>}</span><input value={basicFields[key] || ''} onChange={event => { setBasicFields(previous => ({ ...previous, [key]: event.target.value })); setBasicTouched(previous => ({ ...previous, [key]: true })); setDocumentDerived(previous => ({ ...previous, [key]: false })) }} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#16834a] focus:ring-2 focus:ring-[#16834a]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label>)}</div>{ocr && !(ocr.review_suggestions || []).length && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">No usable details were found. You can complete the form manually.</p>}<p className="mt-3 text-xs text-slate-500">Until you choose a subcategory, these review values stay in this form only and are not saved automatically.</p></section>
            <section className="rounded-2xl border border-[#dce6df] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h3 className="font-bold text-slate-900 dark:text-white">Classification</h3><p className="mt-1 text-xs text-slate-500">Choose the category and subcategory yourself. OCR never makes this decision.</p>{catalogProblem && <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">{catalogProblem}</p>}<div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="achievement-category">Category<select id="achievement-category" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900" value={categoryCode} onChange={chooseCategory} disabled={busy || !catalog}><option value="">Select a category</option>{categories.map(category => <option key={category.code} value={category.code}>{category.label}</option>)}</select></label><label className="block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="achievement-contract">Subcategory<select id="achievement-contract" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 disabled:bg-slate-100" value={contract?.contract_code || ''} onChange={chooseContract} disabled={busy || !selectedCategory}><option value="">{selectedCategory ? 'Select a subcategory' : 'Select a category first'}</option>{(selectedCategory?.subcategories || []).map(item => <option key={item.contract_code} value={item.contract_code}>{item.label}</option>)}</select></label></div></section>
            {selectedContract && <section className="rounded-2xl border border-[#dce6df] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h3 className="font-bold text-slate-900 dark:text-white">Additional information</h3><p className="mt-1 text-xs text-slate-500">Fields are provided by the approved achievement schema.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{(selectedContract.fields || []).map(field => <label key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}><span className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">{field.label}{field.required && <span className="text-rose-600"> *</span>}</span>{fieldControl(field, fields[field.key], (key, value) => setFields(previous => ({ ...previous, [key]: value })), busy)}{field.help_text && <span className="mt-1 block text-xs text-slate-500">{field.help_text}</span>}</label>)}</div></section>}
          </div>
        </div>
      </main>
      <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-slate-800 dark:bg-slate-900"><button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Close</button><div className="flex gap-2"><button type="button" disabled={!canSave || busy} onClick={saveDraft} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100"><Save className="mr-2 inline" size={16}/>Save draft</button><button type="button" disabled={!contract || !cleanEvidence || busy} onClick={() => setReviewing(true)} className="min-h-11 rounded-xl bg-[#16834a] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#126b3c] disabled:opacity-50"><Send className="mr-2 inline" size={16}/>Review &amp; submit</button></div></footer>
      {fullPreview && <div role="dialog" aria-modal="true" aria-label={`Full document ${fullPreview.original_filename}`} className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 p-4"><section className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white"><header className="flex items-center justify-between border-b p-3"><p className="truncate text-sm font-bold">{fullPreview.original_filename}</p><button type="button" onClick={() => setFullPreview(null)} className="rounded p-2 hover:bg-slate-100" aria-label="Close full document"><X size={18}/></button></header>{fullPreview.detected_mime_type === 'application/pdf' ? <iframe title={`Full document ${fullPreview.original_filename}`} src={previews[fullPreview.id]} className="min-h-0 flex-1 border-0" /> : <img src={previews[fullPreview.id]} alt={`Full preview of ${fullPreview.original_filename}`} className="min-h-0 flex-1 object-contain" />}</section></div>}
      {reviewing && <div className="absolute inset-0 flex items-end bg-slate-950/40 p-4 sm:items-center sm:justify-center"><section aria-label="Review submission" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"><h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Review your achievement</h3><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt>Evidence</dt><dd>{cleanEvidence ? 'Ready' : 'Needs a clean document'}</dd></div><div className="flex justify-between gap-4"><dt>Category</dt><dd className="text-right">{selectedCategory?.label || 'Not selected'}</dd></div><div className="flex justify-between gap-4"><dt>Subcategory</dt><dd className="text-right">{selectedContract?.label || 'Not selected'}</dd></div></dl><div className="mt-6 flex justify-end gap-2"><button type="button" className="rounded-xl px-3 py-2 text-sm font-bold" onClick={() => setReviewing(false)}><ChevronLeft className="mr-1 inline" size={16}/>Back to edit</button><button type="button" className="rounded-xl bg-[#16834a] px-4 py-2 text-sm font-bold text-white" onClick={submit} disabled={busy}>Submit achievement</button></div></section></div>}
    </section>
  </div>
}
