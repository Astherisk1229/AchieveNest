import React, { useEffect, useRef, useState } from 'react'
import { ChevronRight, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { confirmDialog } from '../../../components/ui/DialogProvider'
import { areAllCriteriaNodesExpanded, createCategory, createSubcategory, dimensionLabels, expandVisibleCriteriaNodes, handleCriteriaTabKeyDown, rendererGroups, toggleCriteriaAccordion } from './criteriaHierarchyDefinitions'
export { createCategory, createSubcategory, createLevel } from './criteriaHierarchyDefinitions'

const makeId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20'
const copy = value => JSON.parse(JSON.stringify(value))

const summarizeChangedFields = (before, after, fields) => {
  const changed = fields
    .filter(([key]) => JSON.stringify(before?.[key] ?? null) !== JSON.stringify(after?.[key] ?? null))
    .map(([, label]) => label)
  if (!changed.length) return 'Updated criteria.'
  const description = changed.length === 1
    ? changed[0]
    : `${changed.slice(0, -1).join(', ')} and ${changed[changed.length - 1]}`
  return `Updated ${description}.`
}

const summarizeLevelChanges = (before = [], after = []) => {
  const beforeById = new Map(before.filter(item => !item.__new).map(item => [item.id, item]))
  const afterById = new Map(after.filter(item => !item.__new).map(item => [item.id, item]))
  const added = after.filter(item => item.__new).length
  const removed = [...beforeById.keys()].filter(id => !afterById.has(id)).length
  const changed = [...afterById].filter(([id, item]) => {
    const original = beforeById.get(id)
    return original && (original.label !== item.label || Number(original.points) !== Number(item.points) || Number(original.is_active) !== Number(item.is_active))
  }).length
  const parts = []
  if (added) parts.push(`added ${added} level${added === 1 ? '' : 's'}`)
  if (removed) parts.push(`removed ${removed} level${removed === 1 ? '' : 's'}`)
  if (changed) parts.push(`updated ${changed} level${changed === 1 ? '' : 's'}`)
  return parts.length ? `Scoring levels ${parts.join(', ')}.` : 'Updated scoring levels.'
}
const EMPTY_TREE = { areas: [], version: {} }
const active = value => Number(value?.is_active ?? 1) === 1
const pointText = value => `${Number(value || 0)} ${Number(value || 0) === 1 ? 'pt' : 'pts'}`
const nextOptionCode = (items, prefix) => { const used = new Set(items.map(item => String(item.option_code || '').toUpperCase())); let number = 1; while (used.has(`${prefix}_${number}`)) number += 1; return `${prefix}_${number}` }

function Field({ label, value, onChange, type = 'text', min, step, multiline = false }) {
  const shared = { className: `${input} mt-1`, value: value ?? '', onChange: event => onChange(type === 'number' ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value), ...(type === 'number' ? { type, min: min ?? 0, step: step || '0.01' } : {}) }
  return <label className="block text-sm font-semibold text-slate-700">{label}{multiline ? <textarea rows="2" maxLength={2000} {...shared}/> : <input maxLength={255} {...shared}/>}</label>
}

function ActiveField({ checked, onChange }) {
  return <label className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={active({ is_active: checked })} onChange={event => onChange(event.target.checked ? 1 : 0)}/>Active for new entries</label>
}

function InlineEditor({ title, children, onCancel, onSave, error, saveLabel = 'Save Changes' }) {
  return <section aria-label={title} className="my-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
    <h4 className="font-extrabold text-emerald-950">{title}</h4>
    {error && <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900">{error}</p>}
    <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-bold text-slate-700 hover:bg-white"><X className="h-4 w-4"/>Cancel</button><button type="button" onClick={onSave} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900"><Save className="h-4 w-4"/>{saveLabel}</button></div>
  </section>
}

function EditAction({ label, onClick }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-800 px-3 text-xs font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"><Pencil aria-hidden="true" className="h-3.5 w-3.5"/>{label}</button>
}

function ScoringGroup({ group, options, selected, editing, onEdit, onCancel, onSave, onChange, onAdd, onRemove }) {
  const label = dimensionLabels[group] || group.replaceAll('_', ' ').toLocaleLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
  const shown = [...options].sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
  return <section className="min-w-0">
    {selected && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2"><h5 className="font-bold text-slate-900">{label} — Scoring Options</h5>{!editing && <EditAction label="Edit Scoring Options" onClick={onEdit}/>}</div>}
    {editing && <InlineEditor title={`Edit ${label}`} onCancel={onCancel} onSave={onSave}>
      <p className="text-sm leading-5 text-slate-600 sm:col-span-2">This dimension is identified by the existing scoring renderer. Its name is fixed so the configured evaluation workflow is preserved. Edit its options and point values below.</p>
      <div className="sm:col-span-2">
        <div className="grid grid-cols-[minmax(0,1fr)_7rem_5rem] gap-2 border-b border-emerald-200 pb-2 text-xs font-bold uppercase tracking-wide text-slate-600"><span>Scoring option</span><span className="text-right">Points</span><span className="sr-only">Row actions</span></div>
        <div className="divide-y divide-emerald-100">{options.map((option, index) => <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_7rem_5rem] items-center gap-2 py-2">
          <input aria-label={`${label} option ${index + 1}`} className={`${input} min-w-0`} value={option.label || ''} maxLength={255} onChange={event => onChange(option.id, { label: event.target.value })}/>
          <input aria-label={`Points for ${option.label || label}`} type="number" min="0" step="0.01" className={`${input} text-right tabular-nums`} value={option.points ?? ''} onChange={event => onChange(option.id, { points: event.target.value === '' ? null : Number(event.target.value) })}/>
          <div className="flex justify-end"><button type="button" aria-label={`Remove ${option.label || 'option'}`} onClick={() => onRemove(option)} className="rounded p-1.5 text-rose-700"><Trash2 className="h-4 w-4"/></button></div>
          <label className="col-span-full inline-flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={active(option)} onChange={event => onChange(option.id, { is_active: event.target.checked ? 1 : 0 })}/>Active for new evaluations</label>
        </div>)}</div>
        <button type="button" onClick={onAdd} className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg border border-emerald-800 px-3 text-xs font-bold text-emerald-900 hover:bg-white"><Plus className="h-3.5 w-3.5"/>Add Scoring Option</button>
      </div>
    </InlineEditor>}
    {!editing && <div className="mt-2 overflow-hidden rounded-lg border border-slate-200"><div className="grid grid-cols-[minmax(0,1fr)_7rem] bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600"><span>Option</span><span className="text-right">Points</span></div>{shown.length ? shown.map(option => <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-3 border-t border-slate-100 px-3 py-2 text-sm"><span className="break-words">{option.label}{!active(option) && <span className="ml-2 text-xs font-bold text-slate-500">Archived</span>}</span><span className="text-right font-bold tabular-nums whitespace-nowrap">{option.points == null ? '—' : pointText(option.points)}</span></div>) : <p className="border-t border-slate-100 px-3 py-3 text-sm text-slate-500">No scoring options are configured for this dimension.</p>}</div>}
  </section>
}

export default function CriteriaHierarchyBuilder({ tree: incomingTree, onChange, onDelete, onReviewSubcategoryChange, onDirtyChange, onExpansionChange, searchQuery = '', statusFilter = 'all' }) {
  const tree = incomingTree?.areas ? incomingTree : EMPTY_TREE
  const [expandedAreas, setExpandedAreas] = useState(() => new Set())
  const [expandedCategories, setExpandedCategories] = useState(() => new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState(() => new Set())
  const [multipleExpansion, setMultipleExpansion] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedGroups, setSelectedGroups] = useState({})
  const searchExpansionRef = useRef(null)
  const searchingRef = useRef(false)
  const isDirty = editing && JSON.stringify(editing.draft) !== JSON.stringify(editing.original)
  useEffect(() => { onDirtyChange?.(Boolean(isDirty)) }, [isDirty, onDirtyChange])

  const updateTree = patch => onChange(current => patch(current))
  const toggle = (setter, id, siblings = []) => setter(previous => toggleCriteriaAccordion(previous, id, siblings, multipleExpansion))
  const canReplaceEditor = async () => {
    if (isDirty && !(await confirmDialog({ title: 'Discard unsaved item edits?', message: 'Opening another item will discard the current unsaved form changes.', confirmLabel: 'Discard edits', cancelLabel: 'Keep editing', tone: 'warning' }))) return false
    return true
  }
  const prepareForAccordionNavigation = async () => {
    if (!editing) return true
    if (isDirty && !(await confirmDialog({ title: 'Discard unsaved item edits?', message: 'Changing Areas or Categories will close the current editor and discard its unsaved form changes.', confirmLabel: 'Discard edits', cancelLabel: 'Keep editing', tone: 'warning' }))) return false
    setEditing(null)
    return true
  }
  const openEdit = async (type, target, initial, context = {}) => {
    if (!(await canReplaceEditor())) return false
    setEditing({ type, id: target.id, context, original: copy(initial), draft: copy(initial), auditOpen: type === 'levels' })
    return true
  }
  const cancelEdit = async () => {
    if (isDirty && !(await confirmDialog({ title: 'Discard unsaved item edits?', message: 'Canceling will discard the changes in this form.', confirmLabel: 'Discard edits', cancelLabel: 'Keep editing', tone: 'warning' }))) return
    setEditing(null)
  }
  const updateEdit = patch => setEditing(current => ({ ...current, error: '', draft: { ...current.draft, ...patch } }))
  const patchArea = (areaId, patch) => updateTree(current => ({ ...current, areas: current.areas.map(area => area.id === areaId ? { ...area, ...patch } : area) }))
  const patchCategory = (areaId, categoryId, patch) => updateTree(current => ({ ...current, areas: current.areas.map(area => area.id === areaId ? { ...area, categories: area.categories.map(category => category.id === categoryId ? { ...category, ...patch } : category) } : area) }))
  const patchSubcategory = (areaId, categoryId, subcategoryId, patch) => updateTree(current => ({ ...current, areas: current.areas.map(area => area.id === areaId ? { ...area, categories: area.categories.map(category => category.id === categoryId ? { ...category, subcategories: category.subcategories.map(subcategory => subcategory.id === subcategoryId ? { ...subcategory, ...patch } : subcategory) } : category) } : area) }))
  const saveEdit = async () => {
    if (!editing) return
    const { type, id, context, draft } = editing
    let issue = ''
    if (['area', 'category', 'subcategory'].includes(type) && !String(draft.name || '').trim()) issue = 'Enter a name before saving.'
    if (type === 'area' && !String(draft.area_code || '').trim()) issue = 'Enter an area code before saving.'
    if (type === 'category' && !String(draft.category_code || '').trim()) issue = 'Enter a category code before saving.'
    if (type === 'subcategory' && !String(draft.subcategory_code || '').trim()) issue = 'Enter a subcategory code before saving.'
    if (['area', 'category', 'subcategory'].includes(type) && (!Number.isFinite(Number(draft[type === 'area' ? 'max_points' : type === 'category' ? 'max_points' : 'default_points'])) || Number(draft[type === 'area' ? 'max_points' : type === 'category' ? 'max_points' : 'default_points']) < 0)) issue = 'Point values must be non-negative numbers.'
    if (['options', 'levels'].includes(type) && draft.items.some(item => !String(item.label || '').trim() || (item.__new && (item.points === '' || item.points === null)) || (item.points !== null && item.points !== '' && (!Number.isFinite(Number(item.points)) || Number(item.points) < 0)))) issue = 'Give each option a name and use non-negative numeric points.'
    if (type === 'rule' && (!Number.isFinite(Number(draft.max_points_per_entry)) || Number(draft.max_points_per_entry) < 0 || (draft.max_occurrences !== null && draft.max_occurrences !== undefined && draft.max_occurrences !== '' && (!Number.isInteger(Number(draft.max_occurrences)) || Number(draft.max_occurrences) < 1)))) issue = 'Enter non-negative points and a whole-number occurrence limit of at least 1.'
    if (issue) { setEditing(current => ({ ...current, error: issue })); return }
    if (type === 'levels') {
      if (!isDirty) { setEditing(current => ({ ...current, error: 'Change at least one level or point value before saving.' })); return }
      const reason = String(editing.changeReason || '').trim()
      if (reason.length < 10) { setEditing(current => ({ ...current, error: 'Enter a change reason of at least 10 characters.' })); return }
      const current = tree.areas.flatMap(area => area.categories || []).flatMap(category => category.subcategories || []).find(item => item.id === id)
      const removed = (current?.levels || []).filter(level => !level.__new && !draft.items.some(item => item.id === level.id))
      if (removed.length && !(await confirmDialog({ title: `Remove ${removed.length} level${removed.length === 1 ? '' : 's'}?`, message: 'The previous criteria revision and historical evaluations will be preserved.', confirmLabel: 'Review removal', tone: 'danger' }))) return
      const candidateTree = { ...tree, areas: tree.areas.map(area => area.id !== context.areaId ? area : { ...area, categories: area.categories.map(category => category.id !== context.categoryId ? category : { ...category, subcategories: category.subcategories.map(subcategory => subcategory.id !== id ? subcategory : { ...subcategory, levels: draft.items }) }) }) }
      const summary = summarizeLevelChanges(current?.levels || [], draft.items)
      const review = await onReviewSubcategoryChange?.(candidateTree, { reason, summary, criterion: { code: current?.subcategory_code, name: current?.name }, type: 'subcategory', deletedNodes: removed.map(level => ({ type: 'level', id: level.id })) })
      if (typeof review === 'string') {
        const message = /draft could not be saved/i.test(review) ? 'Criteria changes could not be saved. Please retry.' : review
        setEditing(previous => ({ ...previous, error: message }))
      }
      return
    }
    if (type === 'area') patchArea(id, { area_code: draft.area_code, name: draft.name, description: draft.description, max_points: draft.max_points, is_active: draft.is_active })
    if (type === 'category') patchCategory(context.areaId, id, { category_code: draft.category_code, name: draft.name, description: draft.description, max_points: draft.max_points, is_active: draft.is_active, scoring_rule_reference: draft.scoring_rule_reference })
    if (type === 'subcategory') patchSubcategory(context.areaId, context.categoryId, id, { subcategory_code: draft.subcategory_code, name: draft.name, description: draft.description, default_points: draft.default_points, is_active: draft.is_active, scoring_rule_reference: draft.scoring_rule_reference })
    if (type === 'rule') patchCategory(context.areaId, context.categoryId, { criteria: context.category.criteria.map(rule => rule.id === id ? { ...rule, ...draft } : rule) })
    if (type === 'options') updateTree(current => ({ ...current, areas: current.areas.map(area => area.id === context.areaId ? { ...area, categories: area.categories.map(category => category.id === context.categoryId ? { ...category, options: [...category.options.filter(option => option.option_group_code !== context.group), ...draft.items] } : category) } : area) }))
    setEditing(null)
  }
  const reviewSubcategory = async (area, category) => {
    if (!editing || editing.type !== 'subcategory') return
    const draft = editing.draft
    const usesDirectPoints = !(draft.levels || []).length
    let issue = ''
    if (!String(draft.name || '').trim()) issue = 'Enter a criterion name.'
    if (draft.__new && !String(draft.subcategory_code || '').trim()) issue = 'Enter a criterion code.'
    if (usesDirectPoints && (!Number.isFinite(Number(draft.default_points)) || Number(draft.default_points) < 0)) issue = 'Enter a non-negative points value.'
    if (JSON.stringify(draft) === JSON.stringify(editing.original)) issue = 'There are no changes to review.'
    if (issue) { setEditing(current => ({ ...current, error: issue })); return }
    if (!editing.auditOpen) { setEditing(current => ({ ...current, auditOpen: true, error: '' })); return }
    if (String(editing.changeReason || '').trim().length < 10) {
      setEditing(current => ({ ...current, error: 'Enter a change reason of at least 10 characters.' }))
      return
    }
    const candidateTree = {
      ...tree,
      areas: tree.areas.map(item => item.id !== area.id ? item : ({ ...item,
        categories: item.categories.map(parent => parent.id !== category.id ? parent : ({ ...parent,
          subcategories: parent.subcategories.map(subcategory => subcategory.id === draft.id ? { ...draft } : subcategory),
        })),
      })),
    }
    await onReviewSubcategoryChange?.(candidateTree, {
      reason: String(editing.changeReason).trim(),
      summary: summarizeChangedFields(editing.original, draft, [
        ['subcategory_code', 'criterion code'], ['name', 'criterion name'], ['description', 'description'],
        ['default_points', 'default points'], ['is_active', 'active status'], ['scoring_rule_reference', 'HR scoring guidance'],
      ]),
      criterion: { code: draft.subcategory_code, name: draft.name },
      previousCriterion: { code: editing.original.subcategory_code, name: editing.original.name },
      type: 'subcategory',
    })
  }
  const reviewCategory = async area => {
    if (!editing || editing.type !== 'category') return
    const draft = editing.draft
    if (!String(draft.name || '').trim() || !String(draft.category_code || '').trim()) {
      setEditing(current => ({ ...current, error: 'Enter a category name and code.' })); return
    }
    if (JSON.stringify(draft) === JSON.stringify(editing.original)) {
      setEditing(current => ({ ...current, error: 'There are no changes to review.' })); return
    }
    if (!editing.auditOpen) { setEditing(current => ({ ...current, auditOpen: true, error: '' })); return }
    if (String(editing.changeReason || '').trim().length < 10) {
      setEditing(current => ({ ...current, error: 'Enter a change reason of at least 10 characters.' })); return
    }
    const candidateTree = { ...tree, areas: tree.areas.map(item => item.id !== area.id ? item : ({ ...item, categories: item.categories.map(category => category.id === draft.id ? { ...draft } : category) })) }
    await onReviewSubcategoryChange?.(candidateTree, {
      reason: String(editing.changeReason).trim(),
      summary: summarizeChangedFields(editing.original, draft, [
        ['category_code', 'category code'], ['name', 'category name'], ['description', 'description'],
        ['max_points', 'cutoff points'], ['is_active', 'active status'], ['scoring_rule_reference', 'HR scoring guidance'],
      ]),
      criterion: { code: draft.category_code, name: draft.name },
      previousCriterion: { code: editing.original.category_code, name: editing.original.name },
      type: 'category',
    })
  }
  const addArea = async () => {
    if (!(await canReplaceEditor())) return
    const area = { id: makeId('area'), scale_version_id: tree.version?.id, area_code: '', name: 'New Area', description: '', max_points: 0, display_order: tree.areas.length + 1, entry_policy: 'personnel_entry_allowed', is_active: 1, categories: [], __new: true }
    updateTree(current => ({ ...current, areas: [...current.areas, area] }))
    setExpandedAreas(current => new Set([...current, area.id]))
    setEditing({ type: 'area', id: area.id, context: {}, original: copy(area), draft: copy(area) })
  }
  const addCategory = async area => {
    if (!(await canReplaceEditor())) return
    const category = createCategory(area)
    patchArea(area.id, { categories: [...area.categories, category] })
    setExpandedAreas(current => new Set([...current, area.id]))
    setExpandedCategories(current => new Set([...current, category.id]))
    setEditing({ type: 'category', id: category.id, context: { areaId: area.id }, original: copy(category), draft: copy(category) })
  }
  const addSubcategory = async (area, category) => {
    if (!(await canReplaceEditor())) return
    const subcategory = createSubcategory(category)
    patchCategory(area.id, category.id, { subcategories: [...category.subcategories, subcategory] })
    setExpandedCategories(current => new Set([...current, category.id]))
    setExpandedSubcategories(current => new Set([...current, subcategory.id]))
    setEditing({ type: 'subcategory', id: subcategory.id, context: { areaId: area.id, categoryId: category.id }, original: copy(subcategory), draft: copy(subcategory) })
  }
  const matches = (...values) => !searchQuery.trim() || values.some(value => String(value || '').toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()))
  const allowed = item => statusFilter === 'all' || (statusFilter === 'active' ? active(item) : !active(item))
  const optionMatches = category => (category.options || []).some(option => allowed(option) && matches(option.label, option.option_code, option.option_group_code))
  const subMatches = subcategory => (allowed(subcategory) || (editing?.id === subcategory.id)) && (matches(subcategory.name, subcategory.subcategory_code) || (subcategory.levels || []).some(level => allowed(level) && matches(level.label, level.option_code)) || editing?.id === subcategory.id)
  const categoryMatches = category => (allowed(category) || (editing?.id === category.id) || editing?.context.categoryId === category.id) && (matches(category.name, category.category_code) || (category.criteria || []).some(rule => matches(rule.name, rule.criterion_code, rule.description)) || category.subcategories.some(subMatches) || optionMatches(category) || editing?.id === category.id || editing?.context.categoryId === category.id)
  const areaMatches = area => (allowed(area) || editing?.id === area.id || editing?.context.areaId === area.id) && (matches(area.name, area.area_code) || area.categories.some(categoryMatches) || editing?.id === area.id || editing?.context.areaId === area.id)
  const visibleAreas = tree.areas.filter(areaMatches)
  const groupOptions = (category, group) => (category.options || []).filter(option => option.option_group_code === group && (statusFilter === 'all' || allowed(option)))
  const activeGroupCodes = category => rendererGroups[category.renderer_key] || []

  useEffect(() => {
    const searching = Boolean(searchQuery.trim())
    if (searching) {
      if (!searchingRef.current) searchExpansionRef.current = { expandedAreas, expandedCategories, expandedSubcategories, multipleExpansion }
      const next = expandVisibleCriteriaNodes(visibleAreas.map(area => ({
        ...area,
        categories: area.categories.filter(categoryMatches).map(category => ({
          ...category,
          subcategories: category.subcategories.filter(subMatches),
        })),
      })))
      setExpandedAreas(next.areas)
      setExpandedCategories(next.categories)
      setExpandedSubcategories(next.subcategories)
      setMultipleExpansion(true)
    } else if (searchingRef.current && searchExpansionRef.current) {
      setExpandedAreas(searchExpansionRef.current.expandedAreas)
      setExpandedCategories(searchExpansionRef.current.expandedCategories)
      setExpandedSubcategories(searchExpansionRef.current.expandedSubcategories)
      setMultipleExpansion(searchExpansionRef.current.multipleExpansion)
      searchExpansionRef.current = null
    }
    searchingRef.current = searching
  // Expansion changes do not alter the search results; update only when the query or criteria version changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, incomingTree])
  const changeGroup = (categoryId, group) => setSelectedGroups(current => ({ ...current, [categoryId]: group }))

  const handleDelete = async (type, item, preserveEditor = false, skipConfirmation = false) => {
    if (!onDelete) return false
    if (!preserveEditor && isDirty && !(await confirmDialog({ title: 'Discard unsaved item edits?', message: 'Deleting this item will close the current editor and discard its unsaved form changes.', confirmLabel: 'Discard edits', cancelLabel: 'Keep editing', tone: 'warning' }))) return false
    if (!preserveEditor && isDirty) setEditing(null)
    return onDelete(type, item, { skipConfirmation })
  }

  const handleCollapseAll = async () => {
    if (isDirty && !(await confirmDialog({ title: 'Discard unsaved item edits?', message: 'Collapsing all will close the current editor and discard its unsaved form changes.', confirmLabel: 'Discard edits', cancelLabel: 'Keep editing', tone: 'warning' }))) return
    setEditing(null); setExpandedAreas(new Set()); setExpandedCategories(new Set()); setExpandedSubcategories(new Set()); setMultipleExpansion(false)
  }
  const handleExpandAll = () => {
    const next = expandVisibleCriteriaNodes(visibleAreas.map(area => ({ ...area, categories: area.categories.filter(categoryMatches).map(category => ({ ...category, subcategories: category.subcategories.filter(subMatches) })) })))
    setExpandedAreas(next.areas); setExpandedCategories(next.categories); setExpandedSubcategories(next.subcategories); setMultipleExpansion(true)
  }

  const allExpanded = areAllCriteriaNodesExpanded(visibleAreas, expandedAreas, expandedCategories, expandedSubcategories)
  const expansionToggleRef = useRef(null)
  expansionToggleRef.current = () => { if (allExpanded) void handleCollapseAll(); else handleExpandAll() }
  useEffect(() => {
    onExpansionChange?.({ allExpanded, toggle: () => expansionToggleRef.current?.() })
  }, [allExpanded, expandedAreas, expandedCategories, expandedSubcategories, isDirty, onExpansionChange, searchQuery, statusFilter, tree])
  if (!incomingTree?.areas) return null

  return <section aria-label="Criteria hierarchy" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-black">Criteria hierarchy</h3><p className="text-sm text-slate-600">A criteria change is saved only after you review its impact and choose Apply Changes.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={addArea} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-800 px-3 text-sm font-bold text-white"><Plus className="h-4 w-4"/>Add Area</button></div></div>
    {!visibleAreas.length && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No matching criteria. Adjust the search or status filter.</div>}
    {visibleAreas.map(area => {
      const areaOpen = expandedAreas.has(area.id)
      const areaEditing = editing?.type === 'area' && editing.id === area.id
      return <article key={area.id} className={`overflow-hidden rounded-xl border bg-white transition-colors ${areaOpen ? 'border-emerald-200' : 'border-slate-200'} ${searchQuery.trim() ? 'ring-1 ring-amber-300' : ''}`}>
        <header className={`flex flex-wrap items-center gap-2 px-4 py-2.5 transition-colors sm:px-5 ${areaOpen ? 'bg-emerald-50/80' : 'bg-slate-50'}`}>
          <button type="button" aria-expanded={areaOpen} onClick={async () => { if (await prepareForAccordionNavigation()) toggle(setExpandedAreas, area.id, visibleAreas.map(item => item.id)) }} className="flex min-h-10 w-full min-w-0 flex-wrap items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:w-auto sm:flex-1 sm:flex-nowrap sm:gap-3"><ChevronRight aria-hidden="true" className={`h-4 w-4 shrink-0 text-emerald-800 transition-transform ${areaOpen ? 'rotate-90' : ''}`}/><span className="shrink-0 rounded bg-emerald-800 px-2 py-1 font-mono text-xs font-black text-white">{area.area_code || 'NEW'}</span><span className="min-w-0 flex-1 break-words font-semibold">{area.name}</span>{!active(area) && <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-xs font-bold text-slate-600">Archived</span>}<span className="basis-full pl-6 text-sm font-medium tabular-nums text-slate-600 sm:basis-auto sm:pl-0">Maximum {pointText(area.max_points)}</span></button>
          {!areaEditing && <EditAction label="Edit Area" onClick={() => void openEdit('area', area, area)}/>}
        </header>
        {areaEditing && <div className="px-4 sm:px-5"><InlineEditor title={`Edit Area ${area.area_code}`} onCancel={cancelEdit} error={editing.error} onSave={saveEdit}><Field label="Area Code" value={editing.draft.area_code} onChange={area_code => updateEdit({ area_code: area_code.toUpperCase() })}/><Field label="Area Name" value={editing.draft.name} onChange={name => updateEdit({ name })}/><Field label="Maximum Points" type="number" step="0.01" value={editing.draft.max_points} onChange={max_points => updateEdit({ max_points })}/><Field label="Description" multiline value={editing.draft.description} onChange={description => updateEdit({ description })}/><ActiveField checked={editing.draft.is_active} onChange={is_active => updateEdit({ is_active })}/></InlineEditor></div>}
        {areaOpen && !areaEditing && <div className="space-y-2 border-t border-slate-200 p-3 sm:p-4">
          {area.categories.filter(categoryMatches).map(category => {
            const categoryOpen = expandedCategories.has(category.id)
            const categoryEditing = editing?.type === 'category' && editing.id === category.id
            const groups = activeGroupCodes(category)
            const matchingGroup = searchQuery.trim() && groups.find(group => matches(dimensionLabels[group], group, ...(category.options || []).filter(option => option.option_group_code === group).map(option => option.label)))
            const selected = (editing?.type === 'options' && editing.id === category.id ? editing.context.group : null) || matchingGroup || selectedGroups[category.id] || groups[0]
            return <section key={category.id} className="overflow-hidden rounded-xl border border-slate-200">
              <header className={`flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4 ${searchQuery.trim() ? 'bg-amber-50/70' : ''}`}>
                <button type="button" aria-expanded={categoryOpen} onClick={async () => { if (await prepareForAccordionNavigation()) toggle(setExpandedCategories, category.id, area.categories.map(item => item.id)) }} className="flex min-h-10 w-full min-w-0 flex-wrap items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:w-auto sm:flex-1 sm:flex-nowrap"><ChevronRight aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${categoryOpen ? 'rotate-90' : ''}`}/><span className="shrink-0 font-mono text-xs font-bold text-emerald-800">{category.category_code}</span><span className="min-w-0 flex-1 break-words font-semibold">{category.name}</span>{!active(category) && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Archived</span>}<span className="basis-full pl-6 text-sm font-medium tabular-nums text-slate-600 sm:basis-auto sm:pl-0">Cutoff {pointText(category.max_points)}</span></button>
                {!categoryEditing && <EditAction label="Edit Category" onClick={() => void openEdit('category', category, category, { areaId: area.id })}/>}
              </header>
              {categoryEditing && <div className="px-3 sm:px-4"><InlineEditor title={`Edit Category ${category.category_code}`} onCancel={cancelEdit} error={editing.error} onSave={() => void reviewCategory(area)}><Field label="Category Code" value={editing.draft.category_code} onChange={category_code => updateEdit({ category_code: category_code.toUpperCase() })}/><Field label="Category Name" value={editing.draft.name} onChange={name => updateEdit({ name })}/><Field label="Cutoff Points" type="number" step="0.01" value={editing.draft.max_points} onChange={max_points => updateEdit({ max_points })}/><Field label="Description" multiline value={editing.draft.description} onChange={description => updateEdit({ description })}/><ActiveField checked={editing.draft.is_active} onChange={is_active => updateEdit({ is_active })}/><Field label="HR Scoring Guidance" multiline value={editing.draft.scoring_rule_reference} onChange={scoring_rule_reference => updateEdit({ scoring_rule_reference })}/>{editing.auditOpen && <Field label="Change Reason (at least 10 characters)" value={editing.changeReason || ''} onChange={changeReason => setEditing(current => ({ ...current, changeReason, error: '' }))}/>}</InlineEditor></div>}
              {categoryOpen && !categoryEditing && <div className="space-y-3 border-t border-slate-200 p-3 sm:p-4">
                {groups.length > 0 && <div>
                  {groups.length > 1 && <div role="tablist" aria-label={`${category.name} scoring dimensions`} className="flex gap-1 overflow-x-auto border-b border-slate-200">{groups.map(group => <button key={group} type="button" role="tab" data-tab-value={group} aria-selected={selected === group} tabIndex={selected === group ? 0 : -1} onKeyDown={event => handleCriteriaTabKeyDown(event, groups, value => changeGroup(category.id, value))} onClick={() => changeGroup(category.id, group)} className={`min-h-10 shrink-0 border-b-2 px-3 text-sm font-bold ${selected === group ? 'border-emerald-800 text-emerald-900' : 'border-transparent text-slate-600 hover:text-emerald-900'}`}>{dimensionLabels[group] || group}</button>)}</div>}
                  {groups.map(group => {
                    const visibleGroup = groups.length === 1 || selected === group
                    const options = groupOptions(category, group).filter(option => !searchQuery.trim() || matches(dimensionLabels[group], group) || matches(option.label, option.option_code))
                    const allOptions = (category.options || []).filter(option => option.option_group_code === group)
                    const editingGroup = editing?.type === 'options' && editing.id === category.id && editing.context.group === group
                    const queryMatches = matches(dimensionLabels[group], group, ...options.map(option => [option.label, option.option_code]).flat())
                    if (!visibleGroup || (searchQuery.trim() && !queryMatches)) return null
                    return <div key={group} role={groups.length > 1 ? 'tabpanel' : undefined} className="pt-3">
                      <ScoringGroup group={group} options={editingGroup ? editing.draft.items : options} selected={visibleGroup} editing={editingGroup}
                        onEdit={() => void openEdit('options', category, { items: copy(allOptions) }, { areaId: area.id, categoryId: category.id, category, group })}
                        onCancel={cancelEdit}
                        onSave={async () => {
                          const nextIds = new Set(editing.draft.items.map(option => option.id))
                          const removedOptions = allOptions.filter(option => !nextIds.has(option.id) && !option.__new)
                          if (removedOptions.length && !(await confirmDialog({ title: `Delete ${removedOptions.length} scoring option${removedOptions.length === 1 ? '' : 's'}?`, message: 'The draft can delete only unused criteria. Saving will be rejected if the version is protected by an evaluation or ranking period.', confirmLabel: 'Delete from draft', tone: 'danger' }))) return
                          for (const option of removedOptions) if (!(await handleDelete('scoring_option', option, true, true))) return
                          saveEdit()
                        }}
                        onChange={(optionId, patch) => updateEdit({ items: editing.draft.items.map(option => option.id === optionId ? { ...option, ...patch } : option) })}
                        onAdd={() => updateEdit({ items: [...editing.draft.items, { id: makeId('option'), scale_category_id: category.id, option_group_code: group, option_code: nextOptionCode(editing.draft.items, 'OPTION'), label: '', points: 0, display_order: editing.draft.items.length + 1, is_active: 1, __new: true }] })}
                         onRemove={option => updateEdit({ items: editing.draft.items.filter(item => item.id !== option.id) })}/>
                    </div>
                  })}
                </div>}
                {(category.criteria || []).filter(rule => !searchQuery.trim() || matches(rule.name, rule.criterion_code, rule.description)).map(rule => {
                  const ruleEditing = editing?.type === 'rule' && editing.id === rule.id
                  return <section key={rule.id} className="rounded-lg border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0 flex-1"><h5 className="break-words font-semibold">{rule.criterion_code} · {rule.name}</h5>{!ruleEditing && rule.description && <p className="mt-1 text-sm text-slate-600">{rule.description}</p>}{!ruleEditing && <p className="mt-1 text-xs text-slate-500">{rule.max_points_per_entry} pts per entry{rule.max_occurrences ? ` · up to ${rule.max_occurrences} occurrences` : ''}</p>}</div>{!ruleEditing && <EditAction label="Edit Criterion" onClick={() => void openEdit('rule', rule, { max_points_per_entry: rule.max_points_per_entry, max_occurrences: rule.max_occurrences }, { areaId: area.id, categoryId: category.id, category })}/>}</div>{ruleEditing && <InlineEditor title={`Edit ${rule.name}`} onCancel={cancelEdit} error={editing.error} onSave={saveEdit}><Field label="Maximum Points Per Entry" type="number" step="0.01" value={editing.draft.max_points_per_entry} onChange={max_points_per_entry => updateEdit({ max_points_per_entry })}/><Field label="Maximum Occurrences" type="number" step="1" min="1" value={editing.draft.max_occurrences} onChange={max_occurrences => updateEdit({ max_occurrences })}/></InlineEditor>}</section>
                })}
                {category.subcategories.filter(subMatches).map(subcategory => {
                  const subOpen = expandedSubcategories.has(subcategory.id)
                  const subEditing = editing?.type === 'subcategory' && editing.id === subcategory.id
                  const levels = groupOptions({ options: subcategory.levels }, 'LEVEL').filter(level => !searchQuery.trim() || matches(subcategory.name, subcategory.subcategory_code) || matches(level.label, level.option_code))
                  const editingLevels = editing?.type === 'levels' && editing.id === subcategory.id
                  return <section key={subcategory.id} className="rounded-lg bg-slate-50 px-3">
                    <header className={`flex flex-wrap items-center gap-2 py-1.5 ${searchQuery.trim() ? 'rounded-md bg-amber-50/70' : ''}`}><button type="button" aria-expanded={subOpen} onClick={async () => { if (await prepareForAccordionNavigation()) toggle(setExpandedSubcategories, subcategory.id) }} className="flex min-h-10 min-w-0 flex-1 flex-wrap items-center gap-2 text-left"><ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${subOpen ? 'rotate-90' : ''}`}/><span className="shrink-0 font-mono text-xs font-bold text-slate-500">{subcategory.subcategory_code}</span><span className="min-w-0 flex-1 break-words font-semibold">{subcategory.name}</span>{!active(subcategory) && <span className="shrink-0 text-xs font-bold text-slate-500">Archived</span>}<span className="shrink-0 text-sm font-semibold tabular-nums">{pointText(subcategory.default_points)}</span></button>{!subEditing && <EditAction label="Edit Subcategory" onClick={() => void openEdit('subcategory', subcategory, subcategory, { areaId: area.id, categoryId: category.id })}/>}{onDelete && <button type="button" aria-label={`Delete ${subcategory.name}`} onClick={() => void handleDelete('subcategory', subcategory)} className="rounded p-2 text-rose-700"><Trash2 className="h-4 w-4"/></button>}</header>
                    {subEditing && <section aria-label={`Edit ${editing.draft.name || 'criterion'}`} className="my-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <h4 className="text-base font-extrabold text-emerald-950">Edit {editing.draft.name || 'Criterion'}</h4>
                      <p className="mt-1 text-sm text-slate-600">Update the name, points, or instructions for this criterion.</p>
                      {editing.error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900">{editing.error}</p>}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {editing.draft.__new && <Field label="Criterion Code" value={editing.draft.subcategory_code} onChange={subcategory_code => updateEdit({ subcategory_code: subcategory_code.toUpperCase() })}/>}
                        <Field label="Criterion Name" value={editing.draft.name} onChange={name => updateEdit({ name })}/>
                        {!(editing.draft.levels || []).length && <Field label="Points" type="number" step="0.01" value={editing.draft.default_points} onChange={default_points => updateEdit({ default_points })}/>}
                        <div className="sm:col-span-2"><Field label="Description" multiline value={editing.draft.description} onChange={description => updateEdit({ description })}/></div>
                        <label className="flex min-h-10 items-start gap-2 text-sm font-semibold text-slate-800 sm:col-span-2"><input type="checkbox" checked={active(editing.draft)} onChange={event => updateEdit({ is_active: event.target.checked ? 1 : 0 })} className="mt-0.5 h-4 w-4 accent-emerald-800"/><span>Include this criterion in evaluations</span></label>
                        <div className="sm:col-span-2"><Field label="HR Scoring Guidance" multiline value={editing.draft.scoring_rule_reference} onChange={scoring_rule_reference => updateEdit({ scoring_rule_reference })}/></div>
                      </div>
                      {editing.auditOpen && <div className="mt-4 grid gap-3 border-t border-emerald-200 pt-4"><p className="text-sm text-slate-600">A change reason is required for the criteria change history. A summary will be generated from the fields you changed.</p><label className="text-sm font-semibold">Change Reason <span className="text-rose-700">*</span><textarea rows="2" minLength={10} value={editing.changeReason || ''} onChange={event => setEditing(current => ({ ...current, changeReason: event.target.value, error: '' }))} className={`${input} mt-1 font-normal`} placeholder="Why is this criterion changing?"/></label></div>}
                      <div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Cancel</button><button type="button" disabled={!isDirty} onClick={() => void reviewSubcategory(area, category)} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-800 px-4 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50">Review Changes</button></div>
                    </section>}
                    {subOpen && !subEditing && <div className="space-y-3 border-t border-slate-200 pb-3">
                      {(levels.length > 0 || (subcategory.levels || []).length === 0) && <section className="pt-3"><div className="flex flex-wrap items-center justify-between gap-2"><h5 className="font-bold">Level — Scoring Options</h5>{!editingLevels && <EditAction label="Edit Levels" onClick={() => void openEdit('levels', subcategory, { items: copy(subcategory.levels || []) }, { areaId: area.id, categoryId: category.id })}/>}</div>{editingLevels && <InlineEditor title={`Edit Levels for ${subcategory.name}`} onCancel={cancelEdit} error={editing.error} onSave={saveEdit} saveLabel="Save Changes"><div className="sm:col-span-2"><div className="grid grid-cols-[minmax(0,1fr)_7rem_5rem] gap-2 text-xs font-bold uppercase text-slate-600"><span>Level</span><span className="text-right">Points</span><span/></div>{editing.draft.items.map((level, index) => <div key={level.id} className="grid grid-cols-[minmax(0,1fr)_7rem_5rem] items-center gap-2 py-2"><input aria-label={`Level ${index + 1}`} className={`${input} min-w-0`} value={level.label || ''} onChange={event => updateEdit({ items: editing.draft.items.map(item => item.id === level.id ? { ...item, label: event.target.value } : item) })}/><input aria-label={`Points for ${level.label || 'level'}`} type="number" min="0" step="0.01" className={`${input} text-right tabular-nums`} value={level.points ?? ''} onChange={event => updateEdit({ items: editing.draft.items.map(item => item.id === level.id ? { ...item, points: event.target.value === '' ? null : Number(event.target.value) } : item) })}/><div className="flex justify-end"><label className="px-1 text-[10px] font-semibold"><input aria-label={`Active ${level.label}`} type="checkbox" checked={active(level)} onChange={event => updateEdit({ items: editing.draft.items.map(item => item.id === level.id ? { ...item, is_active: event.target.checked ? 1 : 0 } : item) })}/> Active</label><button type="button" aria-label={`Remove ${level.label}`} onClick={() => updateEdit({ items: editing.draft.items.filter(item => item.id !== level.id) })} className="rounded p-1.5 text-rose-700"><Trash2 className="h-4 w-4"/></button></div></div>)}<button type="button" onClick={() => updateEdit({ items: [...editing.draft.items, { id: makeId('level'), scale_subcategory_id: subcategory.id, option_group_code: 'LEVEL', option_code: nextOptionCode(editing.draft.items, 'LEVEL'), label: '', points: 0, display_order: editing.draft.items.length + 1, is_active: 1, __new: true }] })} className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg border border-emerald-800 px-3 text-xs font-bold text-emerald-900"><Plus className="h-3.5 w-3.5"/>Add Level</button></div>{editing.auditOpen && <div className="sm:col-span-2 grid gap-3 border-t border-emerald-200 pt-3"><p className="text-sm text-slate-600">Reviewing these levels creates a persisted criteria revision after you confirm the impact. A summary will be generated from the level changes.</p><label className="text-sm font-semibold">Change Reason <span className="text-rose-700">*</span><textarea rows="2" minLength={10} value={editing.changeReason || ''} onChange={event => setEditing(current => ({ ...current, changeReason: event.target.value, error: '' }))} className={`${input} mt-1 font-normal`}/></label></div>}</InlineEditor>}{!editingLevels && <CompactOptionTable options={levels} empty="No levels are configured for this subcategory."/>}</section>}
                      <button type="button" onClick={() => addSubcategory(area, category)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-bold hover:bg-white"><Plus className="h-3.5 w-3.5"/>Add Subcategory</button>
                    </div>}
                  </section>
                })}
                {(category.criteria || []).length === 0 && groups.length === 0 && (category.subcategories || []).length === 0 && <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">No scoring options are configured in this criteria version.</p>}
              </div>}
            </section>
          })}
          <button type="button" onClick={() => addCategory(area)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-800 px-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50"><Plus className="h-4 w-4"/>Add Category</button>
        </div>}
      </article>
    })}
  </section>
}

function CompactOptionTable({ options, empty }) {
  const visible = (options || []).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
  return <div className="mt-2 overflow-hidden rounded-lg border border-slate-200"><div className="grid grid-cols-[minmax(0,1fr)_7rem] bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600"><span>Option</span><span className="text-right">Points</span></div>{visible.length ? visible.map(option => <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3 border-t border-slate-100 px-3 py-2 text-sm"><span className="break-words">{option.label}{!active(option) && <span className="ml-2 text-xs font-bold text-slate-500">Archived</span>}</span><span className="text-right font-bold tabular-nums whitespace-nowrap">{pointText(option.points)}</span></div>) : <p className="border-t border-slate-100 px-3 py-3 text-sm text-slate-500">{empty}</p>}</div>
}
