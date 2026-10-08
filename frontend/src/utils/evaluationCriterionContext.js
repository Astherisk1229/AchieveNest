const asObject = value => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try { return JSON.parse(value) || {} } catch { return {} }
  }
  return {}
}

const rowLabel = row => row?.label || row?.name || row?.option_name || row?.description || ''
const numberText = value => {
  const number = Number(value)
  return Number.isFinite(number) ? String(Number(number.toFixed(2))) : ''
}

export function getEvaluationCriterionContext(item = {}) {
  const snapshot = asObject(item.criterion_snapshot ?? item.criterionSnapshot)
  const category = asObject(snapshot.category)
  const subcategory = asObject(snapshot.subcategory || snapshot.matched_subcategory)
  // Older resolver snapshots stored the matched subcategory in `level`; only treat it as a level
  // when it carries an actual configured LEVEL option marker.
  const oldLevel = asObject(snapshot.level)
  const configuredLevel = asObject(snapshot.selected_level || snapshot.configured_level || (String(oldLevel.option_group_code || '').toUpperCase() === 'LEVEL' ? oldLevel : null))
  const options = Array.isArray(snapshot.matched_options) ? snapshot.matched_options : []
  const actualSubcategory = rowLabel(subcategory) ? subcategory : (!rowLabel(configuredLevel) && rowLabel(oldLevel) ? oldLevel : {})
  const categoryName = rowLabel(category) || item.criterion_title || item.criterion_code || ''
  const subcategoryName = rowLabel(actualSubcategory)
  const levelName = rowLabel(configuredLevel) || options.filter(option => String(option.option_group_code || '').toUpperCase() === 'LEVEL').map(rowLabel).filter(Boolean).join(', ')
  const points = Number(snapshot.configured_points ?? item.configured_points_snapshot ?? 0)
  const cutoff = Number(snapshot.criterion_cap ?? category.max_points ?? 0)
  const manual = Boolean(snapshot.evaluator_judgment_required ?? item.evaluator_judgment_required)
  let generatedRemark = String(snapshot.system_generated_remark || '')
  if (!generatedRemark) {
    const label = levelName || subcategoryName || categoryName
    if (label && manual && cutoff > 0) generatedRemark = `${label} — manual evaluator scoring. Maximum: ${numberText(cutoff)} points.`
    else if (label && points > 0 && cutoff > 0) generatedRemark = `${label} — ${numberText(points)} points. Category cut-off: ${numberText(cutoff)} points.`
  }

  return {
    category: categoryName,
    subcategory: subcategoryName,
    level: levelName,
    configuredPoints: numberText(points),
    categoryCutoff: numberText(cutoff),
    criteriaVersionId: item.criterion_version_id || item.criterionVersionId || '',
    criterionReference: snapshot.criterion_reference || item.criterion_key || '',
    manual,
    generatedRemark,
  }
}
