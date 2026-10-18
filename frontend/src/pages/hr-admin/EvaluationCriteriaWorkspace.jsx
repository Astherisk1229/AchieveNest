import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, BookOpen, ChevronRight, FileClock, GraduationCap, History, Layers3, Pencil, Printer, RefreshCw, Search, ShieldCheck, Users, X } from 'lucide-react'
import portfolioService from '../../services/portfolioConfigurationService'
import { normalizeCriteriaCatalogue } from './ranking-criteria/criteriaCatalogue'
import CriteriaHierarchyBuilder from './ranking-criteria/CriteriaHierarchyBuilder'
import { areAllCriteriaNodesExpanded, dimensionLabels, expandVisibleCriteriaNodes, handleCriteriaTabKeyDown, rendererGroups, toggleCriteriaAccordion } from './ranking-criteria/criteriaHierarchyDefinitions'
import { confirmDialog } from '../../components/ui/DialogProvider'
import { configureFacultyIntakeDefaults } from './ranking-criteria/facultyIntakeDefaults'
import { buildCriteriaChangeSummary, ongoingEvaluationMessage } from './ranking-criteria/criteriaChangeSummary'

const GROUPS = [
  { id: 'FACULTY', label: 'Teaching Faculty', icon: GraduationCap },
  { id: 'NON_TEACHING_FACULTY', label: 'Non-Teaching Personnel', icon: Users },
]
const STATUS = { approved: 'Active', draft: 'Draft', retired: 'Superseded' }
const input = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-700 dark:bg-slate-950'
const termMatches = (value, query) => String(value || '').toLocaleLowerCase().includes(query)
const isActive = item => Number(item?.is_active ?? 1) === 1
const eventLabel = action => ({ version_created: 'Criteria revision created', draft_edited: 'Criteria revised', version_published: 'Criteria revision activated', version_superseded: 'Previous criteria revision superseded' }[action] || String(action || 'change').replaceAll('_', ' '))
const formatPoints = value => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString()
const formatImpactCount = value => value === null || value === undefined || !Number.isFinite(Number(value)) ? 'Not reported' : Number(value).toLocaleString()
const criteriaErrorText = (value, fallback) => {
  const visited = new Set()
  const read = candidate => {
    if (typeof candidate === 'string') return candidate.trim()
    if (candidate == null) return ''
    if (typeof candidate !== 'object' || visited.has(candidate)) return ''
    visited.add(candidate)
    for (const next of [candidate.response?.data, candidate.error, candidate.message, candidate.detail]) {
      const message = read(next)
      if (message) return message
    }
    return ''
  }
  return read(value) || fallback
}
const formatEffectiveDate = value => {
  if (!value) return ''
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return String(value)
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function filterTree(tree, query, filter) {
  if (!tree?.areas) return { ...tree, areas: [] }
  const text = query.trim().toLocaleLowerCase()
  const allowed = item => filter === 'all' || (filter === 'active' ? isActive(item) : !isActive(item))
  const match = (item, fields) => fields.some(field => termMatches(item?.[field], text))
  const categoriesFor = area => (area.categories || []).filter(category => allowed(category)).map(category => {
    const dimensionLabelMatches = (rendererGroups[category.renderer_key] || []).some(group => termMatches(dimensionLabels[group] || group, text))
    const subcategories = (category.subcategories || []).filter(subcategory => allowed(subcategory)).map(subcategory => {
      const levels = (subcategory.levels || []).filter(level => allowed(level) && (!text || match(level, ['label', 'option_code'])))
      const subMatches = !text || match(subcategory, ['name', 'subcategory_code']) || levels.length > 0
      return subMatches ? { ...subcategory, levels } : null
    }).filter(Boolean)
    const options = (category.options || []).filter(option => allowed(option) && (!text || match(option, ['label', 'option_code', 'option_group_code']) || termMatches(dimensionLabels[option.option_group_code] || option.option_group_code, text)))
    const criteria = (category.criteria || []).filter(item => !text || match(item, ['criterion_code', 'name', 'description']))
    const subMatches = subcategories.length > 0
    const categoryMatches = !text || match(category, ['name', 'category_code'])
    return categoryMatches || subMatches || options.length || criteria.length || dimensionLabelMatches ? { ...category, subcategories, options, criteria } : null
  }).filter(Boolean)
  const areas = (tree.areas || []).filter(area => allowed(area)).map(area => {
    const categories = categoriesFor(area)
    const areaMatches = !text || match(area, ['name', 'area_code'])
    return areaMatches || categories.length ? { ...area, categories } : null
  }).filter(Boolean)
  return { ...tree, areas }
}

function ReadOnlyHierarchy({ tree, query = '', onExpansionChange }) {
  const [openAreas, setOpenAreas] = useState(() => new Set())
  const [openCategories, setOpenCategories] = useState(() => new Set())
  const [openSubcategories, setOpenSubcategories] = useState(() => new Set())
  const [multipleExpansion, setMultipleExpansion] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState({})
  const searchExpansionRef = useRef(null)
  const searchingRef = useRef(false)
  const toggle = (setter, id, siblingIds = []) => setter(previous => toggleCriteriaAccordion(previous, id, siblingIds, multipleExpansion))
  const expandAll = () => { const next = expandVisibleCriteriaNodes(tree.areas || []); setOpenAreas(next.areas); setOpenCategories(next.categories); setOpenSubcategories(next.subcategories); setMultipleExpansion(true) }
  const collapseAll = () => { setOpenAreas(new Set()); setOpenCategories(new Set()); setOpenSubcategories(new Set()); setMultipleExpansion(false) }
  const allExpanded = areAllCriteriaNodesExpanded(tree?.areas || [], openAreas, openCategories, openSubcategories)
  const expansionToggleRef = useRef(null)
  expansionToggleRef.current = () => { if (allExpanded) collapseAll(); else expandAll() }
  useEffect(() => {
    const searching = Boolean(query.trim())
    if (searching) {
      if (!searchingRef.current) searchExpansionRef.current = { openAreas, openCategories, openSubcategories, multipleExpansion }
      const next = expandVisibleCriteriaNodes(tree?.areas || [])
      setOpenAreas(next.areas); setOpenCategories(next.categories); setOpenSubcategories(next.subcategories); setMultipleExpansion(true)
    } else if (searchingRef.current && searchExpansionRef.current) {
      setOpenAreas(searchExpansionRef.current.openAreas); setOpenCategories(searchExpansionRef.current.openCategories); setOpenSubcategories(searchExpansionRef.current.openSubcategories); setMultipleExpansion(searchExpansionRef.current.multipleExpansion)
      searchExpansionRef.current = null
    }
    searchingRef.current = searching
  // Restore the user's previous browsing state after search is cleared.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tree])
  useEffect(() => { onExpansionChange?.({ allExpanded, toggle: () => expansionToggleRef.current?.() }) }, [allExpanded, onExpansionChange, openAreas, openCategories, openSubcategories, tree])
  if (!tree?.areas?.length) return <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center"><Layers3 className="mx-auto h-8 w-8 text-slate-400"/><h3 className="mt-3 font-bold">No matching criteria</h3><p className="mt-1 text-sm text-slate-600">Clear the search or choose a different status filter.</p></div>
  return <section aria-label="Criteria hierarchy" className="space-y-3"><div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
    {tree.areas.map(area => <section key={area.id}>
      <button type="button" aria-expanded={openAreas.has(area.id)} onClick={() => toggle(setOpenAreas, area.id, (tree.areas || []).map(item => item.id))} className={`flex w-full flex-wrap items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-700 sm:px-5 ${openAreas.has(area.id) ? 'bg-emerald-50/80' : 'bg-slate-50'} ${query.trim() ? 'ring-1 ring-inset ring-amber-300' : ''}`}><ChevronRight aria-hidden="true" className={`h-4 w-4 shrink-0 text-emerald-800 transition-transform ${openAreas.has(area.id) ? 'rotate-90' : ''}`}/><span className="rounded-md bg-emerald-900 px-2 py-1 text-center font-mono text-xs font-black text-white">{area.area_code}</span><span className="min-w-0 flex-1 font-semibold">{area.name}</span>{!isActive(area) && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Archived</span>}<span className="text-sm font-medium tabular-nums text-slate-600">Maximum {Number(area.max_points || 0)} pts</span></button>
      {openAreas.has(area.id) && <div className="space-y-2 border-t border-slate-200 px-3 py-3 sm:px-5">{(area.categories || []).map(category => { const groups = rendererGroups[category.renderer_key] || []; const configured = groups.filter(group => (category.options || []).some(option => option.option_group_code === group)); const matchingGroup = query.trim() && groups.find(group => termMatches(dimensionLabels[group] || group, query.trim().toLocaleLowerCase()) || (category.options || []).some(option => option.option_group_code === group && [option.label, option.option_code].some(value => termMatches(value, query.trim().toLocaleLowerCase())))); const selected = matchingGroup || selectedGroups[category.id] || configured[0] || groups[0]; return <section key={category.id} className={`overflow-hidden rounded-xl border border-slate-200 ${query.trim() ? 'ring-1 ring-amber-300' : ''}`}><button type="button" aria-expanded={openCategories.has(category.id)} onClick={() => toggle(setOpenCategories, category.id, (area.categories || []).map(item => item.id))} className="flex min-h-11 w-full flex-wrap items-center gap-2 px-3 py-1.5 text-left"><ChevronRight aria-hidden="true" className={`h-4 w-4 transition-transform ${openCategories.has(category.id) ? 'rotate-90' : ''}`}/><span className="font-mono text-xs font-bold text-emerald-800">{category.category_code}</span><span className="min-w-0 flex-1 font-semibold">{category.name}</span>{!isActive(category) && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Archived</span>}<span className="text-sm font-medium tabular-nums text-slate-600">Cutoff {Number(category.max_points || 0)} pts</span></button>
        {openCategories.has(category.id) && <div className="space-y-3 border-t border-slate-200 p-3 sm:p-4">{groups.length > 1 && <div role="tablist" aria-label={`${category.name} scoring dimensions`} className="flex gap-1 overflow-x-auto border-b border-slate-200">{groups.map(group => <button key={group} type="button" role="tab" data-tab-value={group} aria-selected={selected === group} tabIndex={selected === group ? 0 : -1} onKeyDown={event => handleCriteriaTabKeyDown(event, groups, value => setSelectedGroups(current => ({ ...current, [category.id]: value })))} onClick={() => setSelectedGroups(current => ({ ...current, [category.id]: group }))} className={`min-h-10 shrink-0 border-b-2 px-3 text-sm font-bold ${selected === group ? 'border-emerald-800 text-emerald-900' : 'border-transparent text-slate-600'}`}>{dimensionLabels[group] || group}</button>)}</div>}
          {groups.filter(group => groups.length === 1 || selected === group).map(group => { const options = (category.options || []).filter(option => option.option_group_code === group).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)); return <section key={group} role={groups.length > 1 ? 'tabpanel' : undefined}><h4 className="mb-2 font-bold">{dimensionLabels[group] || group} — Scoring Options</h4><div className="overflow-hidden rounded-lg border border-slate-200"><div className="grid grid-cols-[minmax(0,1fr)_7rem] bg-slate-50 px-3 py-2 text-xs font-bold uppercase text-slate-600"><span>Option</span><span className="text-right">Points</span></div>{options.length ? options.map(option => <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3 border-t border-slate-100 px-3 py-2 text-sm"><span className="break-words">{option.label}{!isActive(option) && <span className="ml-2 text-xs font-bold text-slate-500">Archived</span>}</span><span className="whitespace-nowrap text-right font-bold tabular-nums">{option.points == null ? '—' : `${Number(option.points)} ${Number(option.points) === 1 ? 'pt' : 'pts'}`}</span></div>) : <p className="border-t border-slate-100 px-3 py-3 text-sm text-slate-500">No scoring options are configured in this criteria version.</p>}</div></section>})}
          {category.criteria?.map(rule => <p key={rule.id} className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-2 text-sm"><span><strong>{rule.criterion_code}</strong> · {rule.name}</span><span className="font-semibold tabular-nums">{Number(rule.max_points_per_entry || 0)} pts per entry{rule.max_occurrences ? ` · max ${rule.max_occurrences} occurrence(s)` : ''}</span></p>)}
          {(category.subcategories || []).map(subcategory => <section key={subcategory.id} className="rounded-lg bg-slate-50 p-3"><button type="button" aria-expanded={openSubcategories.has(subcategory.id)} onClick={() => toggle(setOpenSubcategories, subcategory.id)} className="flex min-h-10 w-full items-center justify-between gap-2 text-left"><span className="font-semibold">{subcategory.subcategory_code} · {subcategory.name} <span className="font-normal text-slate-600">{Number(subcategory.default_points || 0)} pts</span></span><ChevronRight aria-hidden="true" className={`h-4 w-4 transition-transform ${openSubcategories.has(subcategory.id) ? 'rotate-90' : ''}`}/></button>{openSubcategories.has(subcategory.id) && (subcategory.levels || []).length > 0 && <CompactOptionList options={subcategory.levels}/>}</section>)}
          {!groups.length && !category.criteria?.length && !category.subcategories?.length && <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">No scoring options are configured for this category.</p>}
        </div>}</section>})}</div>}
    </section>)}
  </div></section>
}

function CompactOptionList({ options }) {
  return <div className="mt-2 overflow-hidden rounded-lg border border-slate-200"><div className="grid grid-cols-[minmax(0,1fr)_7rem] bg-white px-3 py-2 text-xs font-bold uppercase text-slate-600"><span>Level</span><span className="text-right">Points</span></div>{options.map(option => <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3 border-t border-slate-100 px-3 py-2 text-sm"><span>{option.label}{!isActive(option) && <span className="ml-2 text-xs font-bold text-slate-500">Archived</span>}</span><span className="whitespace-nowrap text-right font-bold tabular-nums">{Number(option.points || 0)} {Number(option.points || 0) === 1 ? 'pt' : 'pts'}</span></div>)}</div>
}

function VersionHistory({ scale, events, loading, onSelectVersion, selectedId }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
    <div className="flex items-start gap-3"><FileClock className="mt-0.5 h-5 w-5 text-emerald-800"/><div><h2 className="font-extrabold">Version history</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Each published version remains available to the ranking periods that use it.</p></div></div>
    <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">{(scale?.versions || []).map(version => <article key={version.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"><button type="button" onClick={() => onSelectVersion(version.id)} className={`font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${selectedId === version.id ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>{version.status === 'approved' ? 'Current criteria' : version.status === 'draft' ? 'Edit draft version' : 'View prior criteria'}</button><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${version.status === 'approved' ? 'bg-emerald-100 text-emerald-900' : version.status === 'draft' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'}`}>{STATUS[version.status] || version.status}</span><span className="text-sm text-slate-600 dark:text-slate-400">Effective {version.effective_start_date || 'not set'} · {version.ranking_period_count || 0} linked period(s)</span><span className="text-sm text-slate-600 dark:text-slate-400">{version.change_reason || version.source_document_ref || 'No change note recorded'}</span></article>)}</div>
    <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800"><h3 className="flex items-center gap-2 text-sm font-extrabold"><History className="h-4 w-4 text-emerald-800"/>Change history</h3>
      {loading ? <p role="status" className="mt-3 text-sm text-slate-500">Loading change history…</p> : events.length ? <ol className="mt-3 space-y-3">{events.map(event => <li key={event.id} className="grid gap-1 border-l-2 border-emerald-700/40 pl-3 sm:grid-cols-[11rem_1fr]"><time className="text-xs font-semibold text-slate-500">{event.created_at ? new Date(event.created_at.replace(' ', 'T')).toLocaleString() : 'Time unavailable'}</time><div><p className="text-sm font-bold">{eventLabel(event.action)} · {event.actor_name || 'HR administrator'}</p>{event.reason && <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{event.reason}</p>}{event.after_state?.areas && <p className="mt-1 text-xs text-slate-500">Criteria snapshot recorded with this change.</p>}</div></li>)}</ol> : <p className="mt-2 text-sm text-slate-500">No changes have been recorded for the selected version yet.</p>}
    </div>
  </section>
}

function CriterionChangeConfirmation({ preview, context, error, saving, onBack, onSave }) {
  const dialogRef = useRef(null)
  const summary = buildCriteriaChangeSummary(preview.changes || [], context)
  const affected = preview.affected_nonfinalized_evaluation_count
  const reconfirmation = preview.affected_endorsed_evaluation_count
  const hasAffected = Number.isFinite(Number(affected)) && Number(affected) > 0
  const blockers = preview.activation_blockers || []
  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement
    dialog?.querySelector('button:not(:disabled)')?.focus()
    return () => previouslyFocused?.focus?.()
  }, [])
  useEffect(() => {
    const dialog = dialogRef.current
    const focusable = () => [...(dialog?.querySelectorAll('button:not(:disabled)') || [])]
    const handleKeyDown = event => {
      if (event.key === 'Escape' && !saving) { event.preventDefault(); onBack(); return }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus() }
      else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onBack, saving])
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3" role="dialog" aria-modal="true" aria-labelledby="criteria-impact-title" aria-describedby="criteria-impact-description">
    <section ref={dialogRef} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:p-6">
      <h2 id="criteria-impact-title" className="text-xl font-black text-slate-950 dark:text-white">Save Changes?</h2>
      <p id="criteria-impact-description" className="mt-2 text-sm text-slate-700 dark:text-slate-300">You updated <strong>{summary.title || 'a criterion'}.</strong></p>

      {(summary.summaryLines.length + summary.scoringLines.length + summary.fieldLines.length + summary.evidenceLines.length > 0 || summary.limitations.length > 0) && <section className="mt-4" aria-labelledby="criteria-change-summary-title">
        <h3 id="criteria-change-summary-title" className="text-sm font-bold">What changed</h3>
        {summary.summaryLines.length > 0 && <ul className="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">{summary.summaryLines.map((line, index) => <li key={`summary-${index}`}>{line}</li>)}</ul>}
        {summary.scoringLines.length > 0 && <div className="mt-3"><h4 className="text-sm font-semibold">Scoring Changes</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">{summary.scoringLines.map((line, index) => <li key={`score-${index}`}>{line}</li>)}</ul></div>}
        {summary.fieldLines.length > 0 && <div className="mt-3"><h4 className="text-sm font-semibold">Accomplishment Form Fields</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">{summary.fieldLines.map((line, index) => <li key={`field-${index}`}>{line}</li>)}</ul></div>}
        {summary.evidenceLines.length > 0 && <div className="mt-3"><h4 className="text-sm font-semibold">Evidence Requirements</h4><ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">{summary.evidenceLines.map((line, index) => <li key={`evidence-${index}`}>{line}</li>)}</ul></div>}
        {summary.limitations.length > 0 && <div role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">{summary.limitations.join(' ')}</div>}
      </section>}

      <section className={`mt-4 rounded-xl p-3 text-sm ${hasAffected ? 'bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100' : 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100'}`} aria-label="Evaluation impact">
        <p><strong>Important:</strong> {ongoingEvaluationMessage(affected)}</p>
        {Number.isFinite(Number(reconfirmation)) && Number(reconfirmation) > 0 && <p className="mt-1">{Number(reconfirmation).toLocaleString()} ongoing evaluation{Number(reconfirmation) === 1 ? '' : 's'} will need reviewer reconfirmation.</p>}
        {(reconfirmation === null || reconfirmation === undefined || reconfirmation === '') && <p className="mt-1">Reviewer reconfirmation requirements could not be confirmed.</p>}
      </section>
      {summary.consequence && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{summary.consequence}</p>}
      {blockers.length > 0 && <div role="alert" className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{blockers.map((blocker, index) => <p key={index}>{criteriaErrorText(blocker, 'This criteria change is blocked.')}</p>)}</div>}
      {error && <div role="alert" className="mt-3 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{criteriaErrorText(error, 'The criteria change could not be saved.')}</div>}

      <footer className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
        <button type="button" disabled={saving} onClick={onBack} className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900">Go Back</button>
        <button type="button" disabled={saving || !preview.activation_allowed || !preview.preview_token} onClick={onSave} className="min-h-10 rounded-xl bg-emerald-900 px-4 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-950">{saving ? 'Saving…' : 'Save Changes'}</button>
      </footer>
    </section>
  </div>
}

export default function EvaluationCriteriaWorkspace({ periodTrack = null, periodTracks = null } = {}) {
  const [searchParams] = useSearchParams()
  const [group, setGroup] = useState(() => periodTrack?.personnel_group || periodTracks?.[0]?.personnel_group || (GROUPS.some(item => item.id === searchParams.get('group')) ? searchParams.get('group') : 'FACULTY'))
  const [scales, setScales] = useState([])
  const [versionId, setVersionId] = useState(() => periodTrack?.criteria?.version_id || periodTracks?.[0]?.criteria?.version_id || searchParams.get('version') || '')
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [treeLoading, setTreeLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('active')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [changeReason, setChangeReason] = useState('')
  const [changeSummary, setChangeSummary] = useState('')
  const [scoreLimitsOpen, setScoreLimitsOpen] = useState(false)
  const [scoreLimits, setScoreLimits] = useState({ overall_max_points: '', passing_score: '' })
  const [persistedScoreLimits, setPersistedScoreLimits] = useState({ overall_max_points: '', passing_score: '' })
  const [deletedNodes, setDeletedNodes] = useState([])
  const [impactPreview, setImpactPreview] = useState(null)
  const [impactContext, setImpactContext] = useState(null)
  const [inlineEditorDirty, setInlineEditorDirty] = useState(false)
  const [allExpanded, setAllExpanded] = useState(false)
  const expansionHandler = useRef(null)

  const registerExpansionControl = useCallback(control => {
    expansionHandler.current = control?.toggle || null
    setAllExpanded(Boolean(control?.allExpanded))
  }, [])

  const loadCatalogue = useCallback(async () => {
    setLoading(true); setError('')
    try { setScales(normalizeCriteriaCatalogue(await portfolioService.fetchEvaluationScalesCatalogue())) }
    catch (requestError) { setScales([]); setError(criteriaErrorText(requestError, 'Criteria versions could not be loaded.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void loadCatalogue() }, [loadCatalogue])
  const scale = useMemo(() => scales.find(item => String(item.personnel_group || '').toUpperCase() === group), [scales, group])
  const activeVersion = scale?.versions?.find(version => version.status === 'approved') || null
  const selectedVersion = scale?.versions?.find(version => version.id === versionId) || null
  const linkedPeriodTrack = periodTracks?.find(item => item.personnel_group === group) || periodTrack
  const visibleGroups = periodTracks?.length ? GROUPS.filter(item => periodTracks.some(track => track.personnel_group === item.id)) : GROUPS

  useEffect(() => {
    if (loading) return
    if (periodTracks?.length) {
      const linkedVersionId = periodTracks.find(item => item.personnel_group === group)?.criteria?.version_id || ''
      if (versionId !== linkedVersionId) setVersionId(linkedVersionId)
      return
    }
    if (!scale) { setVersionId(''); setTree(null); return }
    const selectableVersions = scale.versions || []
    const versionStillExists = selectableVersions.some(version => version.id === versionId)
    if (!versionStillExists) setVersionId(activeVersion?.id || selectableVersions[0]?.id || '')
  }, [scale, versionId, activeVersion?.id, loading, periodTracks, group])

  const loadVersion = useCallback(async nextId => {
    expansionHandler.current = null; setAllExpanded(false)
    if (!nextId) { setTree(null); setScoreLimitsOpen(false); return }
    setVersionId(nextId); setTreeLoading(true); setError(''); setImpactPreview(null); setImpactContext(null); setDeletedNodes([])
    setScoreLimitsOpen(false)
    try {
      const payload = await portfolioService.fetchEvaluationScaleVersion(nextId)
      const nextTree = payload?.data || payload
      setTree(String(nextTree?.sheet?.applies_to || '').toUpperCase() === 'FACULTY' && nextTree?.version?.status === 'approved'
        ? configureFacultyIntakeDefaults(nextTree)
        : nextTree)
      const loadedLimits = { overall_max_points: nextTree.sheet?.overall_max_points ?? '', passing_score: nextTree.sheet?.passing_score ?? '' }
      setScoreLimits(loadedLimits); setPersistedScoreLimits(loadedLimits)
      setChangeReason(''); setChangeSummary('')
    } catch (requestError) { setTree(null); setError(criteriaErrorText(requestError, 'The selected criteria version could not be loaded.')) }
    finally { setTreeLoading(false) }
  }, [])
  useEffect(() => { if (versionId) void loadVersion(versionId) }, [versionId, loadVersion])

  const filteredTree = useMemo(() => filterTree(tree, query, filter), [tree, query, filter])
  const draftMode = selectedVersion?.status === 'draft'
  const editable = Boolean(selectedVersion && activeVersion?.id === selectedVersion.id && selectedVersion.status === 'approved')

  const serializeTree = (sourceTree = tree, limits = sourceTree.sheet, extraDeletedNodes = []) => {
    const areas = [], categories = [], subcategories = [], criteria = [], options = []
    for (const area of sourceTree.areas || []) {
      areas.push({ id: area.id, scale_version_id: sourceTree.version.id, area_code: area.area_code, name: area.name, description: area.description, display_order: area.display_order, max_points: area.max_points, entry_policy: area.entry_policy, is_active: area.is_active })
      for (const category of area.categories || []) {
        const { subcategories: _subs, criteria: _criteria, options: _options, levels: _levels, ...categoryFields } = category
        categories.push({ ...categoryFields, scale_area_id: area.id })
        for (const subcategory of category.subcategories || []) {
          const { levels, ...subcategoryFields } = subcategory
          subcategories.push({ ...subcategoryFields, scale_category_id: category.id })
          for (const level of levels || []) options.push({ ...level, scale_category_id: category.id, scale_subcategory_id: subcategory.id, option_group_code: 'LEVEL' })
        }
        criteria.push(...(category.criteria || []).map(item => ({ ...item, scale_category_id: category.id })))
        options.push(...(category.options || []).map(item => ({ ...item, scale_category_id: category.id })))
      }
    }
    const seenOptionIds = new Set()
    const uniqueOptions = options.filter(option => {
      if (!option.id) return true
      if (seenOptionIds.has(option.id)) return false
      seenOptionIds.add(option.id)
      return true
    })
    return { total_max_points: limits.overall_max_points, passing_score: limits.passing_score, areas, categories, subcategories, criteria, options: uniqueOptions, deleted_nodes: [...deletedNodes, ...extraDeletedNodes] }
  }
  const directChangeInput = (sourceTree = tree, reason = changeReason, summary = changeSummary, limits = scoreLimits, extraDeletedNodes = []) => ({ expected_source_updated_at: sourceTree?.version?.updated_at, criteria: serializeTree(sourceTree, limits, extraDeletedNodes), change_reason: reason, change_summary: summary })
  const reviewDirectChange = async (candidateTree = tree, { reason = changeReason, summary = changeSummary, limits = scoreLimits, context = { type: 'scoring_limits' }, deletedNodes: extraDeletedNodes = [] } = {}) => {
    if (!editable || !tree) return false
    const maximum = Number(limits.overall_max_points)
    const passing = Number(limits.passing_score)
    const areaMaximum = (candidateTree.areas || []).reduce((total, area) => total + Number(area.max_points || 0), 0)
    if (limits.overall_max_points === '' || !Number.isFinite(maximum) || maximum <= 0) { setError('Enter an overall maximum greater than zero.'); return false }
    if (limits.passing_score === '' || !Number.isFinite(passing) || passing < 0 || passing > maximum) { setError('Enter a passing threshold from zero up to the overall maximum.'); return false }
    if (Math.abs(areaMaximum - maximum) > 0.001) { setError(`The overall maximum must match the current Area maximum total (${formatPoints(areaMaximum)} points).`); return false }
    if (reason.trim().length < 10 || !summary.trim()) { setError('Enter a change reason of at least 10 characters and a change summary.'); return false }
    if (context.type === 'scoring_limits' && inlineEditorDirty) { setError('Finish or cancel the current criteria item edit before reviewing changes.'); return false }
    setSaving(true); setError(''); setSuccess('')
    try {
      const criteriaTree = group === 'FACULTY' ? configureFacultyIntakeDefaults(candidateTree) : candidateTree
      const payload = directChangeInput(criteriaTree, reason.trim(), summary.trim(), limits, extraDeletedNodes)
      const response = await portfolioService.previewDirectCriteriaChange(versionId, payload)
      setImpactContext({ ...context, payload, previousTree: tree, nextTree: criteriaTree })
      setImpactPreview(response?.data || response)
      return true
    }
    catch (requestError) {
      const message = criteriaErrorText(requestError, 'Change impact could not be calculated.')
      setError(message)
      return message
    }
    finally { setSaving(false) }
  }
  const confirmDirectChange = async () => {
    if (!impactPreview?.preview_token || !editable) return
    setSaving(true); setError('')
    try {
      const applied = await portfolioService.applyDirectCriteriaChange(versionId, { ...(impactContext?.payload || directChangeInput()), preview_token: impactPreview.preview_token })
      const result = applied?.data || applied
      const newVersionId = result?.data?.version_id || result?.version_id
      setImpactPreview(null); setImpactContext(null); setScoreLimitsOpen(false); await loadCatalogue()
      if (newVersionId) await loadVersion(newVersionId)
      setSuccess('Criteria updated. The system created an internal revision and queued affected evaluations for recalculation.')
    } catch (requestError) { setError(criteriaErrorText(requestError, 'The criteria change could not be applied.')) }
    finally { setSaving(false) }
  }

  const loadHistory = async () => {
    setShowHistory(open => !open)
    if (showHistory) return
    setHistoryLoading(true)
    try { const payload = await portfolioService.fetchScaleVersionHistory(versionId); setHistory(payload?.data || payload || []) }
    catch (requestError) { setError(criteriaErrorText(requestError, 'Version change history could not be loaded.')) }
    finally { setHistoryLoading(false) }
  }

  const requestDelete = async (type, node, { skipConfirmation = false } = {}) => {
    const title = node.name || node.label || node.area_code || node.category_code || 'this item'
    if (!skipConfirmation && !(await confirmDialog({ title: `Remove ${title} from the new revision?`, message: 'The previous criteria revision and historical evaluation snapshots will be preserved.', confirmLabel: 'Remove from revision', tone: 'danger' }))) return false
    setTree(current => ({ ...current, areas: current.areas.map(area => ({ ...area, categories: (area.categories || []).map(category => ({ ...category, subcategories: (category.subcategories || []).map(subcategory => ({ ...subcategory, levels: (subcategory.levels || []).filter(item => !(type === 'level' && item.id === node.id)) })).filter(subcategory => !(type === 'subcategory' && subcategory.id === node.id)), options: (category.options || []).filter(item => !(type === 'scoring_option' && item.id === node.id)), criteria: (category.criteria || []).filter(item => !(type === 'criterion' && item.id === node.id)) })).filter(category => !(type === 'category' && category.id === node.id)) })).filter(area => !(type === 'section' && area.id === node.id)) }))
    if (!node.__new) setDeletedNodes(list => [...list, { type, id: node.id }])
    setImpactPreview(null); setImpactContext(null); setSuccess(''); setError('')
    return true
  }

  const selectedGroup = GROUPS.find(item => item.id === group) || GROUPS[0]
  const confirmDiscardInlineEditor = async () => {
    if (!inlineEditorDirty) return true
    const confirmed = await confirmDialog({ title: 'Discard unsaved item edits?', message: 'Changing criteria group or version will discard the current unsaved inline form.', confirmLabel: 'Discard edits', cancelLabel: 'Keep editing', tone: 'warning' })
    if (confirmed) setInlineEditorDirty(false)
    return confirmed
  }

  const isCriterionChange = ['subcategory', 'category'].includes(impactContext?.type)

  return <main className="mx-auto max-w-[1440px] space-y-6 pb-12 text-slate-950 dark:text-slate-50">
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 md:flex-row md:items-end"><div><h1 className="text-3xl font-black tracking-[-.025em]">Evaluation Criteria</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Manage the criteria used for personnel ranking and evaluation.</p></div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"><ShieldCheck className="h-4 w-4"/>Versioned governance</span><button type="button" onClick={loadCatalogue} aria-label="Refresh criteria" className="rounded-xl border border-slate-300 p-2.5 text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"><RefreshCw className="h-4 w-4"/></button></div></header>

    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Personnel classification" className="h-fit border-b border-slate-200 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4 dark:border-slate-800"><p className="px-2 pb-2 text-xs font-bold uppercase tracking-[.12em] text-slate-500">Personnel group</p><div className="flex gap-2 overflow-x-auto lg:flex-col">{visibleGroups.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={async () => { if (!(await confirmDiscardInlineEditor())) return; const linkedVersion = periodTracks?.find(track => track.personnel_group === item.id)?.criteria?.version_id; setGroup(item.id); setVersionId(periodTracks?.length ? linkedVersion || '' : ''); setTree(null); setShowHistory(false); setQuery('') }} aria-pressed={group === item.id} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${group === item.id ? 'bg-emerald-950 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'}`}><Icon aria-hidden="true" className="h-4 w-4"/>{item.label}</button> })}</div>
        <div className="mt-5 hidden rounded-xl bg-slate-100/80 p-3 text-xs leading-5 text-slate-600 lg:block dark:bg-slate-900 dark:text-slate-400"><BookOpen className="mb-2 h-4 w-4 text-emerald-800"/>Scoring values shown here come from the selected criteria revision. Confirmed changes create an internal revision, update eligible ongoing evaluations, and preserve finalized results.</div>
      </nav>

      <section className="min-w-0 space-y-3" aria-labelledby="criteria-group-heading">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-emerald-800">Evaluation criteria</p><h2 id="criteria-group-heading" className="mt-1 text-xl font-black">{selectedGroup.label}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{scale?.title || 'No criteria sheet configured for this group.'}</p></div><div className="flex flex-wrap items-center gap-2">{draftMode && <span className="rounded-full bg-blue-100 px-3 py-2 text-xs font-bold text-blue-900">Draft · not active</span>}{editable && !draftMode && <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900">Current criteria</span>}{selectedVersion && <button type="button" onClick={() => void loadHistory()} aria-expanded={showHistory} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-bold hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-700 dark:hover:bg-slate-900"><History className="h-4 w-4"/>History</button>}</div></div>

        {periodTracks?.length > 0 && <p className="text-xs text-slate-500">Showing the criteria version linked to this ranking period{linkedPeriodTrack?.criteria?.version_number ? ` · Version ${linkedPeriodTrack.criteria.version_number}` : ''}.</p>}
        {periodTracks?.length > 0 && !linkedPeriodTrack?.criteria?.version_id && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">No criteria version is linked to this personnel category in the selected period.</p>}

        {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><span>{criteriaErrorText(error, 'The criteria request failed.')}</span><button type="button" aria-label="Dismiss error" onClick={() => setError('')} className="ml-auto rounded p-1 hover:bg-rose-100"><X className="h-4 w-4"/></button></div>}
        {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{success}</div>}
        {showHistory && selectedVersion && <VersionHistory scale={scale} events={history} loading={historyLoading} selectedId={versionId} onSelectVersion={async nextId => { if (!(await confirmDiscardInlineEditor())) return; setShowHistory(false); setVersionId(nextId) }} />}

        {tree && !loading && !treeLoading && <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${selectedVersion?.status === 'approved' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : selectedVersion?.status === 'draft' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{STATUS[selectedVersion?.status] || selectedVersion?.status}</span><span className="text-slate-600 dark:text-slate-400">Effective {formatEffectiveDate(selectedVersion?.effective_start_date) || 'date not set'}</span><span aria-hidden="true" className="text-slate-400">·</span><span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">Maximum {formatPoints(tree.sheet.overall_max_points)} pts</span><span aria-hidden="true" className="text-slate-400">·</span><span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">Passing {formatPoints(tree.sheet.passing_score)} pts</span></div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{editable && <button type="button" onClick={() => { setScoreLimits({ ...persistedScoreLimits }); setChangeReason(''); setChangeSummary(''); setError(''); setScoreLimitsOpen(open => !open) }} aria-expanded={scoreLimitsOpen} aria-controls="scoring-limits-form" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-800 px-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-950"><Pencil aria-hidden="true" className="h-4 w-4"/>Edit Scoring Limits</button>}<button type="button" disabled={!filteredTree?.areas?.length || !expansionHandler.current} aria-expanded={allExpanded} onClick={() => expansionHandler.current?.()} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">{allExpanded ? 'Collapse All' : 'Expand All'}</button><button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"><Printer aria-hidden="true" className="h-4 w-4"/>Print</button></div>
        </div>}

        {editable && tree && scoreLimitsOpen && <section id="scoring-limits-form" aria-labelledby="scoring-limits-title" className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60"><div><h3 id="scoring-limits-title" className="text-base font-extrabold">Edit Maximum Points and Passing Threshold</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Changes to these values may affect ongoing personnel evaluations.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="block text-sm font-bold">Overall Maximum Points<input required type="number" min="0.01" step="0.01" className={`${input} mt-1`} value={scoreLimits.overall_max_points} onChange={event => { setScoreLimits(current => ({ ...current, overall_max_points: event.target.value === '' ? '' : Number(event.target.value) })); setImpactPreview(null) }}/></label><label className="block text-sm font-bold">Passing Threshold<input required type="number" min="0" step="0.01" className={`${input} mt-1`} value={scoreLimits.passing_score} onChange={event => { setScoreLimits(current => ({ ...current, passing_score: event.target.value === '' ? '' : Number(event.target.value) })); setImpactPreview(null) }}/></label><label className="block text-sm font-bold sm:col-span-2">Change Reason <span className="text-rose-600">*</span><textarea required minLength={10} rows="2" className={`${input} mt-1 font-normal`} value={changeReason} onChange={event => { setChangeReason(event.target.value); setImpactPreview(null) }} placeholder="Why are these criteria changing?"/></label><label className="block text-sm font-bold sm:col-span-2">Change Summary <span className="text-rose-600">*</span><textarea required rows="2" className={`${input} mt-1 font-normal`} value={changeSummary} onChange={event => { setChangeSummary(event.target.value); setImpactPreview(null) }} placeholder="Summarize the intended updates."/></label></div><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { setScoreLimits({ ...persistedScoreLimits }); setScoreLimitsOpen(false); setChangeReason(''); setChangeSummary(''); setError(''); setImpactPreview(null) }} className="inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-bold text-slate-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button><button type="button" disabled={saving || inlineEditorDirty} onClick={() => void reviewDirectChange()} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-900 px-4 text-sm font-bold text-white hover:bg-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50">{saving ? 'Reviewing…' : 'Review Changes'}</button></div></section>}

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_13rem]">
          <label className="relative block min-w-0"><span className="sr-only">Search evaluation criteria</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/><input aria-label="Search evaluation criteria" value={query} onChange={event => setQuery(event.target.value)} className={`${input} h-11 py-2 pl-10 pr-11`} placeholder="Search evaluation criteria..."/>{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:hover:bg-slate-800"><X aria-hidden="true" className="h-4 w-4"/></button>}</label>
          <label className="block min-w-0"><span className="sr-only">Criteria status</span><select aria-label="Criteria status" value={filter} onChange={event => setFilter(event.target.value)} className={`${input} h-11 py-2 text-sm font-bold text-slate-800 dark:text-slate-100`}><option value="active">Active criteria</option><option value="archived">Archived criteria</option><option value="all">All criteria</option></select></label>
        </div>

        {loading || treeLoading ? <div role="status" className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950">Loading {selectedGroup.label.toLowerCase()} criteria…</div> : tree ? <>
          {editable ? <CriteriaHierarchyBuilder key={versionId} tree={tree} onDirtyChange={setInlineEditorDirty} onExpansionChange={registerExpansionControl} onReviewSubcategoryChange={(candidateTree, details) => reviewDirectChange(candidateTree, { reason: details.reason, summary: details.summary, limits: candidateTree.sheet, deletedNodes: details.deletedNodes || [], context: { type: details.type || 'subcategory', criterion: details.criterion, previousCriterion: details.previousCriterion } })} onChange={next => { setTree(next); setImpactPreview(null); setImpactContext(null); setSuccess('') }} onDelete={requestDelete} searchQuery={query} statusFilter={filter}/> : <ReadOnlyHierarchy tree={filteredTree} query={query} onExpansionChange={registerExpansionControl}/>}
        </> : !loading && <div role="status" className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700"><Layers3 className="mx-auto h-8 w-8 text-slate-400"/><h3 className="mt-3 font-bold">No criteria version is configured</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">No persisted criteria sheet is available for {selectedGroup.label.toLowerCase()}.</p></div>}
      </section>
    </div>

    {impactPreview && isCriterionChange && <CriterionChangeConfirmation preview={impactPreview} context={impactContext} error={error} saving={saving} onBack={() => { setImpactPreview(null); setImpactContext(null) }} onSave={() => void confirmDirectChange()}/>}
    {impactPreview && !isCriterionChange && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-3" role="dialog" aria-modal="true" aria-labelledby="criteria-impact-title"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950 sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 id="criteria-impact-title" className="text-xl font-black">{impactContext?.type === 'faculty_intake' ? 'Review Faculty Intake Configuration' : 'Confirm Scoring Limits Update'}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Review the server-calculated impact before applying this change.</p></div><button type="button" onClick={() => { setImpactPreview(null); setImpactContext(null) }} aria-label="Close impact review" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5"/></button></div>
      {impactContext?.type === 'faculty_intake' ? <div className="mt-5 space-y-3"><p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-950">This immediately activates a new criteria revision for Faculty. Selectable criteria receive Personnel intake fields and evidence rules. Ph.D. and MA unit levels follow the official thresholds. B.3 and B.6 remain manual / HR-defined. Existing historical criteria snapshots remain tied to their versions.</p><dl className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Affected open evaluations</dt><dd className="mt-1 text-xl font-black">{formatImpactCount(impactPreview.affected_nonfinalized_evaluation_count)}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Reviewer reconfirmation required</dt><dd className="mt-1 font-bold">{formatImpactCount(impactPreview.affected_endorsed_evaluation_count)} endorsed evaluation(s)</dd></div></dl></div> : ['subcategory', 'category'].includes(impactContext?.type) ? <div className="mt-5 space-y-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Criterion</p><p className="mt-1 font-bold">{impactContext.criterion?.code} · {impactContext.criterion?.name}</p></div><p className="text-sm text-slate-700">This change applies to ongoing evaluations that use this criteria version. Finalized evaluations will not be modified.</p><dl className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Affected ongoing evaluations</dt><dd className="mt-1 text-xl font-black">{formatImpactCount(impactPreview.affected_nonfinalized_evaluation_count)}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Reviewer reconfirmation required</dt><dd className="mt-1 font-bold">{formatImpactCount(impactPreview.affected_endorsed_evaluation_count)} endorsed evaluation(s)</dd></div></dl></div> : <dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Personnel group</dt><dd className="mt-1 font-bold">{selectedGroup.label}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Effective application</dt><dd className="mt-1 font-bold">Immediately</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Previous overall maximum</dt><dd className="mt-1 font-bold tabular-nums">{formatPoints(persistedScoreLimits.overall_max_points)} pts</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Proposed overall maximum</dt><dd className="mt-1 font-bold tabular-nums">{formatPoints(scoreLimits.overall_max_points)} pts</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Previous passing threshold</dt><dd className="mt-1 font-bold tabular-nums">{formatPoints(persistedScoreLimits.passing_score)} pts</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Proposed passing threshold</dt><dd className="mt-1 font-bold tabular-nums">{formatPoints(scoreLimits.passing_score)} pts</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Affected ongoing evaluations</dt><dd className="mt-1 text-xl font-black">{formatImpactCount(impactPreview.affected_nonfinalized_evaluation_count)}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">Reviewer reconfirmation required</dt><dd className="mt-1 font-bold">{formatImpactCount(impactPreview.affected_endorsed_evaluation_count)} endorsed evaluation(s)</dd></div><div className="rounded-xl bg-slate-50 p-3 sm:col-span-2"><dt className="text-xs font-bold uppercase text-slate-500">Finalized evaluations modified</dt><dd className="mt-1 font-bold">{formatImpactCount(impactPreview.finalized_evaluations_modified)}</dd></div></dl>}
      {impactPreview.changes?.length > 0 && <section className="mt-5"><h3 className="text-sm font-extrabold">Criteria differences</h3><ul className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3 text-sm">{impactPreview.changes.map(change => <li key={change.path} className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{change.path}</span><span className="text-slate-600">{change.type}: {change.before ?? '—'} → {change.after ?? '—'}</span></li>)}</ul></section>}{impactPreview.activation_blockers?.length > 0 && <div role="alert" className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-900">{impactPreview.activation_blockers.map(blocker => blocker.message).join(' ')}</div>}<div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { setImpactPreview(null); setImpactContext(null) }} className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold">Back to Editing</button><button type="button" disabled={saving || !impactPreview.activation_allowed} onClick={() => void confirmDirectChange()} className="min-h-10 rounded-xl bg-emerald-900 px-4 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Confirm Save'}</button></div></section></div>}
  </main>
}
