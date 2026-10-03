import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Redo2, Save, Send, Undo2, WifiOff } from 'lucide-react'
import { Button } from '../ui/button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import CertificateStudioPanels from './certificate-studio/CertificateStudioPanels'
import CertificateStudioPreview from './certificate-studio/CertificateStudioPreview'
import { PREVIEW_SCENARIOS, STUDIO_LAYOUT_DEFAULTS, STUDIO_SECTIONS, detectStudioIssues, governPlaceholderContract, normalizeStudioDraft } from './certificate-studio/certificateStudioConfig'

const REQUIRED_FIELDS = new Set(['recipient_name', 'activity_title', 'issuer_name'])
const ISSUANCE_FIELDS = new Set(['issued_date', 'certificate_number', 'verification_url'])
const clone = value => JSON.parse(JSON.stringify(value))
const messageFrom = error => error?.error?.message || error?.message || 'The governed template operation could not be completed.'


export default function CertificateTemplateEditorModal({ isOpen = true, onClose, family, registry, onSave, onValidate, onPublish, isBusy = false }) {
  const sourceDraft = family?.draft_version
  const [draft, setDraft] = useState(null)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [activeSection, setActiveSection] = useState('design')
  const [focusedField, setFocusedField] = useState('body')
  const [scenario, setScenario] = useState('standard')
  const [zoom, setZoom] = useState('fit')
  const [showGuides, setShowGuides] = useState(false)
  const [error, setError] = useState('')
  const [backendIssues, setBackendIssues] = useState([])
  const [saveState, setSaveState] = useState('Saved')
  const [publishOpen, setPublishOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [assetNotice, setAssetNotice] = useState('')
  const [fontNotice, setFontNotice] = useState('')
  const [mobileView, setMobileView] = useState('inspector')
  const [preparing, setPreparing] = useState(false)
  const [publishToken, setPublishToken] = useState(null)
  const undoStack = useRef([])
  const redoStack = useRef([])

  useEffect(() => {
    if (!isOpen || !sourceDraft) return
    const next = normalizeStudioDraft(sourceDraft)
    setDraft(next); setSavedSnapshot(JSON.stringify(next)); setBackendIssues(sourceDraft.governance?.validation?.issues || []); setSaveState('Saved')
    undoStack.current = []; redoStack.current = []
  }, [isOpen, sourceDraft])

  const dirty = Boolean(draft && JSON.stringify(draft) !== savedSnapshot)
  const scenarioData = useMemo(() => PREVIEW_SCENARIOS[scenario] || {}, [scenario])
  const layoutIssues = useMemo(() => detectStudioIssues(draft, scenarioData), [draft, scenarioData])
  const issues = [...backendIssues, ...layoutIssues.filter(item => !backendIssues.some(issue => issue.code === item.code))]
  const validationPassed = sourceDraft?.governance?.validation?.status === 'PASS' && !dirty && issues.length === 0

  useEffect(() => { if (!dirty) return undefined; const protect = event => { event.preventDefault(); event.returnValue = '' }; window.addEventListener('beforeunload', protect); return () => window.removeEventListener('beforeunload', protect) }, [dirty])

  const commit = updater => setDraft(current => {
    const next = typeof updater === 'function' ? updater(current) : updater
    if (JSON.stringify(next) === JSON.stringify(current)) return current
    undoStack.current.push(clone(current)); if (undoStack.current.length > 50) undoStack.current.shift(); redoStack.current = []
    setSaveState('Unsaved changes'); setBackendIssues([])
    return next
  })
  const undo = () => { if (!undoStack.current.length) return; const previous = undoStack.current.pop(); redoStack.current.push(clone(draft)); setDraft(previous); setSaveState('Unsaved changes') }
  const redo = () => { if (!redoStack.current.length) return; const next = redoStack.current.pop(); undoStack.current.push(clone(draft)); setDraft(next); setSaveState('Unsaved changes') }
  const updateLayout = patch => commit(current => ({ ...current, layout_schema: { ...current.layout_schema, ...patch } }))
  const updateContent = (field, value) => commit(current => ({ ...current, content_schema: { ...current.content_schema, [field]: value } }))
  const updateSlots = slots => commit(current => ({ ...current, signatory_slots: slots }))
  const insertField = field => {
    const token = field.token || `{{${field.code}}}`
    commit(current => {
      const currentValue = current.content_schema[focusedField] || ''
      const placeholder_contract = current.placeholder_contract.some(item => item.name === field.code) ? current.placeholder_contract : [...current.placeholder_contract, { name: field.code, requirement_type: ISSUANCE_FIELDS.has(field.code) ? 'RESOLVED_AT_ISSUANCE' : REQUIRED_FIELDS.has(field.code) ? 'REQUIRED' : 'OPTIONAL' }]
      return { ...current, content_schema: { ...current.content_schema, [focusedField]: `${currentValue}${currentValue ? ' ' : ''}${token}` }, placeholder_contract }
    })
  }
  const setRequirement = (name, requirement_type) => commit(current => ({ ...current, placeholder_contract: current.placeholder_contract.some(item => item.name === name) ? current.placeholder_contract.map(item => item.name === name ? { ...item, requirement_type } : item) : [...current.placeholder_contract, { name, requirement_type }] }))
  const knownCodes = registry?.placeholders?.length ? new Set(registry.placeholders.map(item => item.code || item.name)) : null
  const save = async () => { setError(''); setSaveState('Saving…'); try { const version = await onSave(sourceDraft.id, { content_schema: draft.content_schema, layout_schema: draft.layout_schema, placeholder_contract: governPlaceholderContract(draft.placeholder_contract, draft.content_schema, knownCodes), signatory_slots: draft.signatory_slots, asset_bindings: draft.asset_bindings, change_summary: draft.change_summary, expected_token: sourceDraft.concurrency_token }); const next = normalizeStudioDraft(version); setDraft(next); setSavedSnapshot(JSON.stringify(next)); setSaveState('Saved'); undoStack.current = []; redoStack.current = []; return version } catch (nextError) { setError(messageFrom(nextError)); setSaveState('Save failed'); return null } }
  // "Check readiness" and "Publish" both save pending edits first, then ask the server to validate
  // that exact version, so what is checked is what gets published.
  const checkReadiness = async () => {
    setError('')
    let token = sourceDraft.concurrency_token
    if (dirty || governPlaceholderContract(draft.placeholder_contract, draft.content_schema, knownCodes).length !== draft.placeholder_contract.length) {
      const saved = await save()
      if (!saved) return null
      token = saved.concurrency_token
    }
    try {
      const result = await onValidate(sourceDraft.id, token)
      setBackendIssues(result?.issues || [])
      return result
    } catch (nextError) {
      setError(messageFrom(nextError)); setBackendIssues(nextError?.error?.issues || [])
      return null
    }
  }
  const validate = async () => { setPreparing(true); try { const result = await checkReadiness(); if (result && !result.valid) setActiveSection('publishing') } finally { setPreparing(false) } }
  const startPublish = async () => {
    setPreparing(true)
    try {
      const result = await checkReadiness()
      if (!result) { setActiveSection('publishing'); return }
      if (!result.valid || layoutIssues.length) { setActiveSection('publishing'); setMobileView('inspector'); return }
      setPublishToken(result.version?.concurrency_token || null)
      setPublishOpen(true)
    } finally { setPreparing(false) }
  }
  const publish = async () => { setPublishOpen(false); setError(''); try { await onPublish(sourceDraft.id, publishToken || sourceDraft.concurrency_token) } catch (nextError) { setError(messageFrom(nextError)); setBackendIssues(nextError?.error?.issues || []); setActiveSection('publishing') } }
  const requestClose = () => dirty ? setDiscardOpen(true) : onClose()
  const readiness = [
    { label: 'Purpose configured', pass: Boolean(family?.certificate_purpose) }, { label: 'Required fields present', pass: draft?.placeholder_contract.some(item => item.requirement_type === 'REQUIRED') },
    { label: 'No unknown placeholders', pass: !backendIssues.some(item => String(item.code).includes('PLACEHOLDER')) }, { label: 'Signatory slots valid', pass: draft?.signatory_slots.length > 0 && draft.signatory_slots.length <= 3 },
    { label: 'Preview renders', pass: Boolean(draft) }, { label: 'No overflow issues', pass: layoutIssues.length === 0 }, { label: 'Assets available', pass: true }, { label: 'No unsaved changes', pass: !dirty }
  ]
  if (!isOpen || !family || !sourceDraft || !draft) return null
  const publishSummary = `This version will be used for future ${family.certificate_purpose} certificates. Published v${family.current_published_version?.version_number || '—'} will remain in Version History. Existing certificates will not change.`

  return <main aria-label="Certificate Studio" className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-slate-100 text-slate-950 selection:bg-emerald-200 selection:text-emerald-950 dark:bg-[#0b1420] dark:text-white dark:selection:bg-emerald-800">
    <header className="relative z-30 shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-[#111c2a] sm:px-5"><div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5"><button type="button" onClick={requestClose} aria-label="Back to certificate templates" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></button><div className="min-w-0"><p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">Certificate Templates</p><div className="flex items-center gap-2"><h1 className="truncate text-base font-semibold tracking-[-0.02em] sm:text-xl">{family.name}</h1><span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">Draft v{sourceDraft.version_number}</span></div></div></div>
      <div className="flex flex-wrap items-center justify-end gap-1.5"><span aria-live="polite" className={`mr-1 flex items-center gap-1.5 text-xs font-medium ${saveState === 'Save failed' ? 'text-rose-700 dark:text-rose-300' : dirty ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>{!dirty && saveState === 'Saved' ? <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> : <span className={`h-1.5 w-1.5 rounded-full ${saveState === 'Saving…' ? 'animate-pulse bg-sky-500 motion-reduce:animate-none' : saveState === 'Save failed' ? 'bg-rose-500' : dirty ? 'bg-amber-500' : 'bg-emerald-600'}`}/>}<span className="hidden sm:inline">{saveState === 'Save failed' ? 'Save failed' : saveState === 'Saving…' ? 'Saving…' : dirty ? 'Unsaved changes' : saveState}</span></span><button type="button" aria-label="Undo" title="Undo" disabled={!undoStack.current.length} onClick={undo} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-30 dark:hover:bg-slate-800"><Undo2 className="h-4 w-4" /></button><button type="button" aria-label="Redo" title="Redo" disabled={!redoStack.current.length} onClick={redo} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-30 dark:hover:bg-slate-800"><Redo2 className="h-4 w-4" /></button><Button variant="outline" disabled={isBusy || !dirty} onClick={save} className="h-9 gap-1.5 rounded-lg px-3 text-xs shadow-none"><Save className="h-3.5 w-3.5" />{saveState === 'Saving…' ? 'Saving…' : 'Save Draft'}</Button><Button disabled={isBusy || preparing} onClick={validationPassed ? () => { setPublishToken(null); setPublishOpen(true) } : startPublish} title="Saves your changes, checks the template and then asks you to confirm" className="h-9 gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs shadow-sm hover:bg-emerald-800"><Send className="h-3.5 w-3.5" />{preparing ? 'Checking…' : isBusy ? 'Working…' : 'Publish'}</Button></div>
    </div>{error && <div role="alert" className="mt-2 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300"><WifiOff className="h-3.5 w-3.5 shrink-0"/><span className="font-semibold">{error}</span><span className="hidden text-slate-500 dark:text-slate-400 sm:inline">Preview remains available.</span></div>}</header>
    <nav aria-label="Certificate Studio steps" className="shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-[#111c2a] sm:px-5"><ol className="flex w-max min-w-full gap-5 sm:gap-8">{STUDIO_SECTIONS.map((item, index) => <li key={item.id}><button type="button" aria-current={activeSection === item.id ? 'step' : undefined} onClick={() => { setActiveSection(item.id); setMobileView('inspector') }} className={`relative flex min-h-12 items-center gap-2 whitespace-nowrap px-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${activeSection === item.id ? 'font-semibold text-emerald-800 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-emerald-600 dark:text-emerald-300' : 'font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}><span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${activeSection === item.id ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300' : 'border-slate-300 dark:border-slate-700'}`}>{index + 1}</span>{item.label}</button></li>)}</ol></nav>
    <div className="flex shrink-0 border-b border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-[#111c2a] md:hidden"><button type="button" onClick={()=>setMobileView('inspector')} className={`flex-1 rounded-md py-2 text-xs font-semibold ${mobileView==='inspector'?'bg-slate-100 text-emerald-800 dark:bg-slate-800 dark:text-emerald-300':'text-slate-500'}`}>Inspector</button><button type="button" onClick={()=>setMobileView('preview')} className={`flex-1 rounded-md py-2 text-xs font-semibold ${mobileView==='preview'?'bg-slate-100 text-emerald-800 dark:bg-slate-800 dark:text-emerald-300':'text-slate-500'}`}>Preview</button></div>
    <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] md:grid-cols-[minmax(19rem,35%)_minmax(0,1fr)]">
      <aside className={`${mobileView==='preview'?'hidden md:block':'block'} h-full min-h-0 overflow-y-auto border-slate-200 bg-white dark:border-slate-800 dark:bg-[#131e2e] md:border-r`} aria-label={`${activeSection} controls`}><CertificateStudioPanels activeSection={activeSection} draft={draft} family={family} registry={registry} focusedField={focusedField} setFocusedField={setFocusedField} onContent={updateContent} onLayout={updateLayout} onSlots={updateSlots} onInsertField={insertField} onRequirement={setRequirement} onResetDesign={() => updateLayout(STUDIO_LAYOUT_DEFAULTS)} onAssetFile={event => event.target.files?.[0] && setAssetNotice(`${event.target.files[0].name} selected for governed upload in Plan 2.`)} onFontFile={event => event.target.files?.[0] && setFontNotice(`${event.target.files[0].name} selected. Licensing and embedding are handled in Plan 2.`)} assetNotice={assetNotice} fontNotice={fontNotice} readiness={readiness} issues={issues} onValidate={validate} isBusy={isBusy || preparing} onNavigate={setActiveSection} onRestorePublished={() => family.current_published_version && commit(normalizeStudioDraft(family.current_published_version))} onChangeSummary={value => commit(current => ({ ...current, change_summary: value }))} /></aside>
      <div className={`${mobileView==='preview'?'flex':'hidden md:flex'} h-full min-h-0 min-w-0 flex-col`}><CertificateStudioPreview draft={draft} scenarioData={scenarioData} scenario={scenario} setScenario={setScenario} zoom={zoom} setZoom={setZoom} showGuides={showGuides} setShowGuides={setShowGuides} issues={layoutIssues} reviewMode={activeSection==='publishing'} /></div>
    </div>
    <ConfirmDialog open={discardOpen} title="Discard unsaved studio changes?" message="Your content and design changes have not been saved." confirmLabel="Discard changes" onConfirm={onClose} onCancel={() => setDiscardOpen(false)} />
    <ConfirmDialog open={publishOpen} title={`Publish ${family.name} v${sourceDraft.version_number}?`} message={publishSummary} confirmLabel={`Publish v${sourceDraft.version_number}`} cancelLabel="Cancel" onConfirm={publish} onCancel={() => setPublishOpen(false)} isProcessing={isBusy} />
  </main>
}
