const makeId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`

export const dimensionLabels = {
  SPONSOR: 'Sponsor', EXTENT: 'Extent', PARTICIPANTS: 'Participant Level / Scope', ROLE: 'Role',
  SCOPE: 'Scope', TYPE: 'Type', NOMINEE: 'Nominee', AWARDEE: 'Awardee', MATERIAL_TYPE: 'Material Type',
}

export const rendererGroups = {
  GUEST_LECTURER_MATRIX: ['SPONSOR', 'EXTENT', 'PARTICIPANTS', 'ROLE'],
  PUBLICATION_MATRIX: ['SCOPE', 'TYPE'],
  RECOGNITION_MATRIX: ['NOMINEE', 'AWARDEE'],
  INSTRUCTIONAL_MATERIALS: ['MATERIAL_TYPE'],
}

export function areAllCriteriaNodesExpanded(areas, openAreas, openCategories, openSubcategories) {
  return areas.length > 0 && areas.every(area => openAreas.has(area.id) && (area.categories || []).every(category => openCategories.has(category.id) && (category.subcategories || []).every(subcategory => openSubcategories.has(subcategory.id))))
}

export function toggleCriteriaAccordion(current, id, siblingIds = [], allowMultiple = false) {
  const next = new Set(current)
  if (next.has(id)) {
    next.delete(id)
    return next
  }
  if (!allowMultiple) siblingIds.forEach(siblingId => next.delete(siblingId))
  next.add(id)
  return next
}

export function expandVisibleCriteriaNodes(areas = []) {
  return {
    areas: new Set(areas.map(area => area.id)),
    categories: new Set(areas.flatMap(area => (area.categories || []).map(category => category.id))),
    subcategories: new Set(areas.flatMap(area => (area.categories || []).flatMap(category => (category.subcategories || []).map(subcategory => subcategory.id)))),
  }
}

export const createCategory = (area, id = makeId('category')) => ({ id, scale_area_id: area.id, category_code: '', name: 'New Category', description: null, display_order: (area.categories || []).length + 1, max_points: 0, scoring_mode: 'MANUAL', requires_manual_hr_rule: 0, is_active: 1, subcategories: [], criteria: [], options: [], __new: true })
export const createSubcategory = (category, id = makeId('subcategory')) => ({ id, scale_category_id: category.id, subcategory_code: '', name: 'New Subcategory', description: null, display_order: (category.subcategories || []).length + 1, default_points: 0, is_active: 1, scoring_rule_reference: '', intake_active: 0, intake_mode: 'FORM', field_schema: [], evidence_rules: { required: true, accepted: [] }, levels: [], __new: true })
export const createLevel = (subcategory, id = makeId('level')) => ({ id, scale_subcategory_id: subcategory.id, option_group_code: 'LEVEL', option_code: '', label: 'New Level', points: 0, is_active: 1, display_order: (subcategory.levels || []).length + 1, __new: true })

export function handleCriteriaTabKeyDown(event, values, onSelect) {
  const current = values.indexOf(event.currentTarget.dataset.tabValue)
  let next = current
  if (event.key === 'ArrowRight') next = (current + 1) % values.length
  else if (event.key === 'ArrowLeft') next = (current - 1 + values.length) % values.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = values.length - 1
  else return
  event.preventDefault()
  const tabs = event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')
  tabs?.[next]?.focus()
  onSelect(values[next])
}
