import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import IntakeDefinitionEditor from './IntakeDefinitionEditor'

const makeId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'

export const createCategory = (area, id = makeId('category')) => ({ id, scale_area_id: area.id, category_code: '', name: 'New Category', description: null, display_order: (area.categories || []).length + 1, max_points: 0, scoring_mode: 'MANUAL', requires_manual_hr_rule: 0, is_active: 1, subcategories: [], criteria: [], options: [] })
export const createSubcategory = (category, id = makeId('subcategory')) => ({ id, scale_category_id: category.id, subcategory_code: '', name: 'New Subcategory', description: null, display_order: (category.subcategories || []).length + 1, default_points: 0, is_active: 1, intake_active: 0, intake_mode: 'FORM', field_schema: [], evidence_rules: { required: true, accepted: [] }, scoring_rule_reference: '', levels: [] })
export const createLevel = (subcategory, id = makeId('level')) => ({ id, scale_subcategory_id: subcategory.id, option_group_code: 'LEVEL', option_code: '', label: 'New Level', points: 0, is_active: 1, display_order: (subcategory.levels || []).length + 1 })

function PointField({ label, value, onChange }) {
  return <label className="block text-sm font-semibold text-slate-700"><span>{label}</span><input aria-label={label} type="number" min="0" step="0.01" required className={`${input} mt-1`} value={value ?? ''} onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))}/></label>
}

function ActiveToggle({ label, checked, onChange }) {
  return <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={checked !== false && checked !== 0} onChange={event => onChange(event.target.checked ? 1 : 0)} />{label}</label>
}

export default function CriteriaHierarchyBuilder({ tree, onChange, showIntake = false }) {
  const [expandedAreas, setExpandedAreas] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState(() => new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState(() => new Set())
  if (!tree?.areas) return null

  const commit = (next) => onChange(next)
  const toggle = (setter, id) => setter(previous => {
    const next = new Set(previous)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const allAreaIds = tree.areas.map(area => area.id)
  const allCategoryIds = tree.areas.flatMap(area => area.categories.map(category => category.id))
  const allSubcategoryIds = tree.areas.flatMap(area => area.categories.flatMap(category => category.subcategories.map(item => item.id)))
  const expandAll = () => {
    setExpandedAreas(new Set(allAreaIds))
    setExpandedCategories(new Set(allCategoryIds))
    setExpandedSubcategories(new Set(allSubcategoryIds))
  }
  const collapseAll = () => { setExpandedAreas(new Set()); setExpandedCategories(new Set()); setExpandedSubcategories(new Set()) }
  const patchCategory = (id, patch) => commit({ ...tree, areas: tree.areas.map(area => ({ ...area, categories: area.categories.map(category => category.id === id ? { ...category, ...patch } : category) })) })
  const patchSubcategory = (categoryId, id, patch) => commit({ ...tree, areas: tree.areas.map(area => ({ ...area, categories: area.categories.map(category => category.id === categoryId ? { ...category, subcategories: category.subcategories.map(item => item.id === id ? { ...item, ...patch } : item) } : category) })) })
  const patchLevel = (categoryId, subcategoryId, levelId, patch) => commit({ ...tree, areas: tree.areas.map(area => ({ ...area, categories: area.categories.map(category => category.id === categoryId ? { ...category, subcategories: category.subcategories.map(item => item.id === subcategoryId ? { ...item, levels: (item.levels || []).map(level => level.id === levelId ? { ...level, ...patch } : level) } : item) } : category) })) })
  const addCategory = (area) => {
    const category = createCategory(area)
    commit({ ...tree, areas: tree.areas.map(item => item.id === area.id ? { ...item, categories: [...item.categories, category] } : item) })
    setExpandedAreas(previous => previous === null ? null : new Set([...previous, area.id]))
    setExpandedCategories(previous => new Set([...previous, category.id]))
  }
  const addSubcategory = (category) => {
    const item = createSubcategory(category)
    patchCategory(category.id, { subcategories: [...category.subcategories, item] })
    setExpandedCategories(previous => new Set([...previous, category.id]))
    setExpandedSubcategories(previous => new Set([...previous, item.id]))
  }
  const addLevel = (category, subcategory) => {
    const level = createLevel(subcategory)
    patchSubcategory(category.id, subcategory.id, { levels: [...(subcategory.levels || []), level] })
  }

  return <section aria-label="Criteria Builder" className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-black">Criteria Builder</h3><p className="mt-1 text-sm text-slate-600">Set each Category cut-off and Subcategory points independently. Add Levels only when the official scoring rule uses them.</p></div><div className="flex gap-2"><button type="button" onClick={expandAll} className="rounded-lg border px-3 py-2 text-sm font-bold hover:bg-white">Expand All</button><button type="button" onClick={collapseAll} className="rounded-lg border px-3 py-2 text-sm font-bold hover:bg-white">Collapse All</button></div></div>
    {tree.areas.map(area => <section key={area.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" aria-expanded={expandedAreas === null || expandedAreas.has(area.id)} onClick={() => setExpandedAreas(previous => { const next = new Set(previous === null ? allAreaIds : previous); if (next.has(area.id)) next.delete(area.id); else next.add(area.id); return next })} className="text-left font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">{area.area_code}. {area.name} <span className="ml-1 text-xs font-semibold text-slate-500">{expandedAreas === null || expandedAreas.has(area.id) ? 'Collapse' : 'Expand'}</span></button><button type="button" onClick={() => addCategory(area)} className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"><Plus className="h-4 w-4"/>Add Category</button></div>
      {(expandedAreas === null || expandedAreas.has(area.id)) && area.categories.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">No categories have been added to this section yet.</p>}
      {(expandedAreas === null || expandedAreas.has(area.id)) && area.categories.map(category => {
        const expanded = expandedCategories.has(category.id)
        return <article key={category.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button type="button" aria-expanded={expanded} onClick={() => toggle(setExpandedCategories, category.id)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50">
            <span><strong>{category.name}</strong>{Number(category.is_active ?? 1) === 0 && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Inactive</span>}<span className="mt-1 block text-sm text-slate-600">Cut-off: {Number(category.max_points || 0)} · {category.subcategories.length} {category.subcategories.length === 1 ? 'Subcategory' : 'Subcategories'}</span></span>{expanded ? <ChevronDown className="h-5 w-5"/> : <ChevronRight className="h-5 w-5"/>}
          </button>
          {expanded && <div className="space-y-4 border-t border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]"><label className="block text-sm font-semibold text-slate-700">Category Name<input aria-label="Category Name" required maxLength={255} className={`${input} mt-1`} value={category.name || ''} onChange={event => patchCategory(category.id, { name: event.target.value })}/></label><PointField label="Cut-off Points" value={category.max_points} onChange={value => patchCategory(category.id, { max_points: value })}/><div className="sm:col-span-2"><ActiveToggle label="Active for new entries" checked={category.is_active} onChange={is_active => patchCategory(category.id, { is_active })}/></div></div>
            <div className="space-y-3">
              {category.subcategories.length === 0 && <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">No subcategories yet. Add one when this category needs a direct scoring item.</p>}
              {category.subcategories.map(subcategory => {
                const subExpanded = expandedSubcategories.has(subcategory.id)
                return <section key={subcategory.id} className="rounded-xl border border-slate-200 bg-slate-50">
                  <button type="button" aria-expanded={subExpanded} onClick={() => toggle(setExpandedSubcategories, subcategory.id)} className="flex w-full items-center justify-between gap-4 px-3 py-3 text-left"><span><strong>{subcategory.name}</strong>{Number(subcategory.is_active ?? 1) === 0 && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Inactive</span>}<span className="ml-2 text-sm text-slate-600">{Number(subcategory.default_points || 0)} points</span><span className="mt-1 block text-xs text-slate-500">{(subcategory.levels || []).length} {(subcategory.levels || []).length === 1 ? 'Level' : 'Levels'}</span></span>{subExpanded ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}</button>
                  {subExpanded && <div className="space-y-4 border-t border-slate-200 bg-white p-3">
                    <div className="grid gap-3 sm:grid-cols-[1fr_12rem]"><label className="block text-sm font-semibold text-slate-700">Subcategory Name<input aria-label="Subcategory Name" required maxLength={255} className={`${input} mt-1`} value={subcategory.name || ''} onChange={event => patchSubcategory(category.id, subcategory.id, { name: event.target.value })}/></label><PointField label="Corresponding Points" value={subcategory.default_points} onChange={value => patchSubcategory(category.id, subcategory.id, { default_points: value })}/><div className="sm:col-span-2"><ActiveToggle label="Active for new entries" checked={subcategory.is_active} onChange={is_active => patchSubcategory(category.id, subcategory.id, { is_active })}/></div></div>
                    <div className="rounded-lg border border-dashed border-slate-300 p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><h5 className="font-bold">Levels (optional)</h5><p className="mt-1 text-xs text-slate-600">Add levels only when this subcategory has its own scoring levels.</p></div><button type="button" onClick={() => addLevel(category, subcategory)} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold"><Plus className="h-3.5 w-3.5"/>Add Level</button></div>
                      {(subcategory.levels || []).length > 0 && <div className="mt-3 space-y-2">{subcategory.levels.map(level => <div key={level.id} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]"><label className="block text-xs font-semibold text-slate-600">Level Name<input aria-label="Level Name" required maxLength={255} className={`${input} mt-1`} value={level.label || ''} onChange={event => patchLevel(category.id, subcategory.id, level.id, { label: event.target.value })}/></label><PointField label="Points" value={level.points} onChange={value => patchLevel(category.id, subcategory.id, level.id, { points: value })}/><div className="self-end pb-2"><ActiveToggle label="Active" checked={level.is_active} onChange={is_active => patchLevel(category.id, subcategory.id, level.id, { is_active })}/></div><button type="button" aria-label={`Remove ${level.label || 'level'}`} onClick={() => patchSubcategory(category.id, subcategory.id, { levels: subcategory.levels.filter(item => item.id !== level.id) })} className="self-end rounded-lg p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4"/></button></div>)}</div>}
                    </div>
                    {showIntake && <IntakeDefinitionEditor criterion={subcategory} editable updateItem={(_type, _id, field, value) => patchSubcategory(category.id, subcategory.id, { [field]: value })}/>}
                  </div>}
                </section>
              })}
              <button type="button" onClick={() => addSubcategory(category)} className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50"><Plus className="h-4 w-4"/>Add Subcategory</button>
            </div>
          </div>}
        </article>
      })}
    </section>)}
  </section>
}
