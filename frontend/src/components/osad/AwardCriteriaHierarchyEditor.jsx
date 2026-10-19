import React, { useEffect, useState } from 'react'
import { Plus, Save, X } from 'lucide-react'
import { fetchAwardCriteriaHierarchy, saveAwardCriteriaHierarchy } from '../../services/awardAdminService'

const newId = () => globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
const blankCategory = () => ({ id: newId(), name: '', cut_off_points: '', active: true, order: 1, subcategories: [] })
const blankSubcategory = () => ({ id: newId(), name: '', points: '', active: true, order: 1, levels: [] })
const blankLevel = () => ({ id: newId(), name: '', points: '', active: true, order: 1 })

function Field({ label, type = 'text', value, onChange, step }) {
  return <label className="grid gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
    {label}<input type={type} min={type === 'number' ? '0' : undefined} step={step} value={value ?? ''} onChange={(event) => onChange(type === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
  </label>
}

export default function AwardCriteriaHierarchyEditor({ award, onClose, onSaved }) {
  const [hierarchy, setHierarchy] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [errors, setErrors] = useState([])

  useEffect(() => {
    let active = true
    setLoading(true)
    setMessage('')
    setErrorMessage('')
    fetchAwardCriteriaHierarchy(award.id)
      .then((result) => { if (active) setHierarchy(result.hierarchy || { categories: [] }) })
      .catch((error) => { if (active) setErrorMessage(error?.response?.data?.error?.message || error?.message || 'Could not load criteria.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [award.id])

  const updateCategory = (ci, patch) => setHierarchy((current) => ({ ...current, categories: current.categories.map((item, i) => i === ci ? { ...item, ...patch } : item) }))
  const updateSubcategory = (ci, si, patch) => setHierarchy((current) => ({ ...current, categories: current.categories.map((category, i) => i === ci ? { ...category, subcategories: category.subcategories.map((item, j) => j === si ? { ...item, ...patch } : item) } : category) }))
  const updateLevel = (ci, si, li, patch) => setHierarchy((current) => ({ ...current, categories: current.categories.map((category, i) => i === ci ? { ...category, subcategories: category.subcategories.map((sub, j) => j === si ? { ...sub, levels: sub.levels.map((item, k) => k === li ? { ...item, ...patch } : item) } : sub) } : category) }))

  const save = async () => {
    setBusy(true)
    setMessage('')
    setErrorMessage('')
    setErrors([])
    try {
      const result = await saveAwardCriteriaHierarchy(award.id, hierarchy)
      setHierarchy(result.hierarchy || hierarchy)
      setMessage('Criteria saved.')
      onSaved?.()
    } catch (error) {
      const apiError = error?.response?.data?.error
      setErrorMessage(apiError?.message || error?.message || 'The criteria update failed.')
      if (Array.isArray(apiError?.details)) setErrors(apiError.details)
    } finally {
      setBusy(false)
    }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="osad-hierarchy-title">
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
      <header className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
        <div><h2 id="osad-hierarchy-title" className="text-xl font-bold text-slate-900 dark:text-white">Manage Categories</h2><p className="mt-1 text-sm text-slate-500">{award.name} · Category → Subcategory → optional Levels</p></div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
      </header>
      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
        {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{errorMessage}</p>}
        <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">This hierarchy controls category, subcategory and optional level choices. Saving here does not change award scoring rules.</p>
        {errors.length > 0 && <ul className="list-inside list-disc rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul>}
        {loading ? <p role="status" className="text-sm text-slate-500">Loading criteria…</p> : !hierarchy ? null : <>
          <div className="space-y-3">
            {hierarchy.categories?.map((category, ci) => <section key={category.id || ci} className="rounded-xl border border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => setExpanded({ ...expanded, [category.id]: !expanded[category.id] })} className="flex w-full items-center justify-between p-4 text-left"><span><strong>{category.name || 'New Category'}</strong><span className="ml-3 text-sm text-slate-500">Cut-off: {category.cut_off_points ?? '—'} · {category.subcategories?.length || 0} Subcategories</span></span><span>{expanded[category.id] ? '−' : '+'}</span></button>
              {expanded[category.id] && <div className="space-y-3 border-t p-4 dark:border-slate-800">
                <div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]"><Field label="Category Name" value={category.name} onChange={(value) => updateCategory(ci, { name: value })} /><Field label="Cut-off Points" type="number" step="0.01" value={category.cut_off_points} onChange={(value) => updateCategory(ci, { cut_off_points: value })} /><button type="button" onClick={() => updateCategory(ci, { active: !category.active })} className="self-end rounded-lg border px-3 py-2 text-sm">{category.active ? 'Active' : 'Inactive'}</button><button type="button" onClick={() => setHierarchy((current) => ({ ...current, categories: current.categories.filter((_, i) => i !== ci) }))} className="self-end rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50">Remove</button></div>
                {category.subcategories?.map((sub, si) => <div key={sub.id || si} className="ml-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <button type="button" onClick={() => setExpanded({ ...expanded, [sub.id]: !expanded[sub.id] })} className="mb-3 flex w-full justify-between text-left text-sm font-semibold">{sub.name || 'New Subcategory'} · {sub.points ?? '—'} points <span>{expanded[sub.id] ? '−' : '+'}</span></button>
                  {expanded[sub.id] && <><div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]"><Field label="Subcategory Name" value={sub.name} onChange={(value) => updateSubcategory(ci, si, { name: value })} /><Field label="Points" type="number" step="0.01" value={sub.points} onChange={(value) => updateSubcategory(ci, si, { points: value })} /><button type="button" onClick={() => updateSubcategory(ci, si, { active: !sub.active })} className="self-end rounded-lg border px-3 py-2 text-sm">{sub.active ? 'Active' : 'Inactive'}</button><button type="button" onClick={() => updateCategory(ci, { subcategories: category.subcategories.filter((_, i) => i !== si) })} className="self-end px-2 py-2 text-sm text-red-700">Remove</button></div>
                    <p className="mt-3 text-xs text-slate-500">Levels (optional). Add levels only when this subcategory has selectable scoring levels.</p>
                    <div className="mt-2 space-y-2">{sub.levels?.map((level, li) => <div className="grid gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-[1fr_150px_auto_auto] dark:bg-slate-900" key={level.id || li}><Field label="Level Name" value={level.name} onChange={(value) => updateLevel(ci, si, li, { name: value })} /><Field label="Points" type="number" step="0.01" value={level.points} onChange={(value) => updateLevel(ci, si, li, { points: value })} /><button type="button" onClick={() => updateLevel(ci, si, li, { active: !level.active })} className="self-end rounded-lg border px-2 py-2 text-sm">{level.active ? 'Active' : 'Inactive'}</button><button type="button" onClick={() => updateSubcategory(ci, si, { levels: sub.levels.filter((_, i) => i !== li) })} className="self-end px-2 py-2 text-sm text-red-700">Remove</button></div>)}</div>
                    <button type="button" onClick={() => updateSubcategory(ci, si, { levels: [...(sub.levels || []), blankLevel()] })} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800"><Plus size={16} /> Add Level</button>
                  </>}
                </div>)}
                <button type="button" onClick={() => updateCategory(ci, { subcategories: [...(category.subcategories || []), blankSubcategory()] })} className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800"><Plus size={16} /> Add Subcategory</button>
              </div>}
            </section>)}
          </div>
          <button type="button" onClick={() => { const next = [...(hierarchy.categories || []), blankCategory()]; setHierarchy({ ...hierarchy, categories: next }); setExpanded({ ...expanded, [next[next.length - 1].id]: true }) }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white"><Plus size={18} /> Add Category</button>
        </>}
      </main>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
        <button type="button" disabled={busy || loading || !hierarchy} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} />{busy ? 'Saving…' : 'Save Changes'}</button>
        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-semibold">Close</button>
      </footer>
    </div>
  </div>
}
