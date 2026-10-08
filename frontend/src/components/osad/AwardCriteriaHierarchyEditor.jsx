import React, { useEffect, useState } from 'react'
import { Plus, Save, Check, Send, X } from 'lucide-react'
import {
  createAwardCriteriaHierarchyDraft,
  fetchAwardCriteriaHierarchy,
  publishAwardCriteriaHierarchyDraft,
  saveAwardCriteriaHierarchyDraft,
  validateAwardCriteriaHierarchyDraft,
} from '../../services/awardAdminService'

const newId = () => globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
const blankCategory = () => ({ id: newId(), name: '', cut_off_points: '', active: true, order: 1, subcategories: [] })
const blankSubcategory = () => ({ id: newId(), name: '', points: '', active: true, order: 1, levels: [] })
const blankLevel = () => ({ id: newId(), name: '', points: '', active: true, order: 1 })

function Field({ label, type = 'text', value, onChange, step, disabled = false }) {
  return <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
    {label}<input type={type} min={type === 'number' ? '0' : undefined} step={step} value={value ?? ''} disabled={disabled} onChange={(event) => onChange(type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-900" />
  </label>
}

export default function AwardCriteriaHierarchyEditor({ award, onClose, onPublished }) {
  const [data, setData] = useState(null)
  const [versionId, setVersionId] = useState('')
  const [hierarchy, setHierarchy] = useState({ categories: [] })
  const [expanded, setExpanded] = useState({})
  const [creating, setCreating] = useState(false)
  const [metadata, setMetadata] = useState({ version_number: '', version_label: '', effective_date: '', change_reason: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState([])

  const load = async (preferredId) => {
    const result = await fetchAwardCriteriaHierarchy(award.id)
    setData(result)
    const picked = result.versions?.find((version) => version.id === (preferredId || versionId))
      || result.versions?.find((version) => version.id === result.active_version_id)
      || result.versions?.find((version) => version.status === 'draft')
      || result.versions?.[0]
    setVersionId(picked?.id || '')
    setHierarchy(picked?.hierarchy || { categories: [] })
    setCreating(false)
  }

  useEffect(() => { load().catch(() => setMessage('Could not load criteria versions.')) }, [award.id])
  const selected = data?.versions?.find((version) => version.id === versionId)
  const isDraft = selected?.status === 'draft'
  const updateCategory = (ci, patch) => setHierarchy((current) => ({ ...current, categories: current.categories.map((item, i) => i === ci ? { ...item, ...patch } : item) }))
  const updateSubcategory = (ci, si, patch) => setHierarchy((current) => ({ ...current, categories: current.categories.map((category, i) => i === ci ? { ...category, subcategories: category.subcategories.map((item, j) => j === si ? { ...item, ...patch } : item) } : category) }))
  const updateLevel = (ci, si, li, patch) => setHierarchy((current) => ({ ...current, categories: current.categories.map((category, i) => i === ci ? { ...category, subcategories: category.subcategories.map((sub, j) => j === si ? { ...sub, levels: sub.levels.map((item, k) => k === li ? { ...item, ...patch } : item) } : sub) } : category) }))
  const removeCategory = (ci) => setHierarchy((current) => ({ ...current, categories: current.categories.filter((_, i) => i !== ci) }))

  const run = async (operation) => {
    setBusy(true); setMessage(''); setErrors([])
    try { await operation() } catch (error) { setMessage(error?.response?.data?.error?.message || error?.message || 'The criteria update failed.') } finally { setBusy(false) }
  }
  const createDraft = () => run(async () => {
    const result = await createAwardCriteriaHierarchyDraft(award.id, metadata)
    const created = result?.data || result
    await load(created.id)
    setMessage('Draft created from the published configuration.')
  })
  const save = () => run(async () => { await saveAwardCriteriaHierarchyDraft(award.id, versionId, hierarchy); setMessage('Draft saved.') })
  const validate = () => run(async () => { const result = await validateAwardCriteriaHierarchyDraft(award.id, versionId); setErrors(result.errors || []); setMessage(result.valid ? 'Draft is valid and ready to publish.' : 'Resolve the validation items below.') })
  const publish = () => run(async () => { const result = await publishAwardCriteriaHierarchyDraft(award.id, versionId); const published = result?.data || result; await load(published.id); setMessage('Hierarchy published. The existing scoring rules were not changed.'); onPublished?.() })

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="osad-hierarchy-title">
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
      <header className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
        <div><h2 id="osad-hierarchy-title" className="text-xl font-bold text-slate-900 dark:text-white">Manage Categories</h2><p className="mt-1 text-sm text-slate-500">{award.name} · Category → Subcategory → optional Levels</p></div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
      </header>
      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">This hierarchy controls category, subcategory and level choices. Publishing it does not change the existing award scoring rules.</p>
        {errors.length > 0 && <ul className="list-inside list-disc rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul>}
        {!data ? <p className="text-sm text-slate-500">Loading versions…</p> : <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-64 gap-1 text-sm font-medium">Criteria version<select value={versionId} onChange={(event) => { const version = data.versions.find((item) => item.id === event.target.value); setVersionId(event.target.value); setHierarchy(version?.hierarchy || { categories: [] }); setErrors([]); setMessage('') }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">{data.versions.map((version) => <option key={version.id} value={version.id}>{version.version_label || `v${version.version_number}`} · {version.status}</option>)}</select></label>
            {isDraft && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">DRAFT</span>}
            <button type="button" onClick={() => setCreating(true)} className="ml-auto rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">Create New Version</button>
          </div>
          {selected && <p className="text-xs text-slate-500">{selected.change_reason || 'Existing published award configuration.'}{selected.effective_date ? ` · Effective ${selected.effective_date}` : ''}</p>}
          {creating && <section className="grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 md:grid-cols-2">
            <Field label="New version number" value={metadata.version_number} onChange={(value) => setMetadata({ ...metadata, version_number: value })} />
            <Field label="Version label" value={metadata.version_label} onChange={(value) => setMetadata({ ...metadata, version_label: value })} />
            <Field label="Effective date" type="date" value={metadata.effective_date} onChange={(value) => setMetadata({ ...metadata, effective_date: value })} />
            <Field label="Reason for change" value={metadata.change_reason} onChange={(value) => setMetadata({ ...metadata, change_reason: value })} />
            <div className="flex gap-2 md:col-span-2"><button disabled={busy} onClick={createDraft} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Create Draft</button><button onClick={() => setCreating(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
          </section>}
          <div className="space-y-3">
            {hierarchy.categories?.map((category, ci) => <section key={category.id || ci} className="rounded-xl border border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setExpanded({ ...expanded, [category.id]: !expanded[category.id] })} className="flex w-full items-center justify-between p-4 text-left"><span><strong>{category.name || 'New Category'}</strong><span className="ml-3 text-sm text-slate-500">Cut-off: {category.cut_off_points ?? '—'} · {category.subcategories?.length || 0} Subcategories</span></span><span>{expanded[category.id] ? '−' : '+'}</span></button>
              {expanded[category.id] && <div className="space-y-3 border-t p-4 dark:border-slate-800">
                <div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]"><Field label="Category Name" disabled={!isDraft} value={category.name} onChange={(value) => updateCategory(ci, { name: value })} /><Field label="Cut-off Points" disabled={!isDraft} type="number" step="0.01" value={category.cut_off_points} onChange={(value) => updateCategory(ci, { cut_off_points: value })} />{isDraft && <><button type="button" onClick={() => updateCategory(ci, { active: !category.active })} className="self-end rounded-lg border px-3 py-2 text-sm">{category.active ? 'Active' : 'Inactive'}</button><button type="button" onClick={() => removeCategory(ci)} className="self-end rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50">Remove</button></>}</div>
                {category.subcategories?.map((sub, si) => <div key={sub.id || si} className="ml-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <button type="button" onClick={() => setExpanded({ ...expanded, [sub.id]: !expanded[sub.id] })} className="mb-3 flex w-full justify-between text-left text-sm font-semibold">{sub.name || 'New Subcategory'} · {sub.points ?? '—'} points <span>{expanded[sub.id] ? '−' : '+'}</span></button>
                  {expanded[sub.id] && <><div className="grid gap-3 md:grid-cols-[1fr_180px_auto]"><Field label="Subcategory Name" disabled={!isDraft} value={sub.name} onChange={(value) => updateSubcategory(ci, si, { name: value })} /><Field label="Points" disabled={!isDraft} type="number" step="0.01" value={sub.points} onChange={(value) => updateSubcategory(ci, si, { points: value })} />{isDraft && <button type="button" onClick={() => updateSubcategory(ci, si, { active: !sub.active })} className="self-end rounded-lg border px-3 py-2 text-sm">{sub.active ? 'Active' : 'Inactive'}</button>}</div>
                    <p className="mt-3 text-xs text-slate-500">Levels (optional). Add levels only when this Subcategory has selectable scoring levels.</p>
                    <div className="mt-2 space-y-2">{sub.levels?.map((level, li) => <div className="grid gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-[1fr_150px_auto_auto] dark:bg-slate-900" key={level.id || li}><Field label="Level Name" disabled={!isDraft} value={level.name} onChange={(value) => updateLevel(ci, si, li, { name: value })} /><Field label="Points" disabled={!isDraft} type="number" step="0.01" value={level.points} onChange={(value) => updateLevel(ci, si, li, { points: value })} /><button disabled={!isDraft} type="button" onClick={() => updateLevel(ci, si, li, { active: !level.active })} className="self-end rounded-lg border px-2 py-2 text-sm">{level.active ? 'Active' : 'Inactive'}</button><button disabled={!isDraft} type="button" onClick={() => updateSubcategory(ci, si, { levels: sub.levels.filter((_, i) => i !== li) })} className="self-end px-2 py-2 text-sm text-red-700">Remove</button></div>)}</div>
                    {isDraft && <button type="button" onClick={() => updateSubcategory(ci, si, { levels: [...(sub.levels || []), blankLevel()] })} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800"><Plus size={16} /> Add Level</button>}
                  </>}
                </div>)}
                {isDraft && <button type="button" onClick={() => updateCategory(ci, { subcategories: [...(category.subcategories || []), blankSubcategory()] })} className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800"><Plus size={16} /> Add Subcategory</button>}
              </div>}
            </section>)}
          </div>
          {isDraft && <button type="button" onClick={() => { const next = [...(hierarchy.categories || []), blankCategory()]; setHierarchy({ ...hierarchy, categories: next }); setExpanded({ ...expanded, [next[next.length - 1].id]: true }) }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white"><Plus size={18} /> Add Category</button>}
        </>}
      </main>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
        {isDraft && <><button type="button" disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold"><Save size={16} />Save Draft</button><button type="button" disabled={busy} onClick={validate} className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800"><Check size={16} />Validate</button><button type="button" disabled={busy} onClick={publish} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"><Send size={16} />Publish</button></>}
        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-semibold">Close</button>
      </footer>
    </div>
  </div>
}
