import { getSubcategorySchema } from '../config/portfolioFormSchemaRegistry'
import { affectsAwardEvaluation } from '../config/awardEvaluationFields'
import { parseStructuredMetadata } from '../controllers/StudentAchievementDraftSession'

const isConfigured = metadata => metadata.schema_version === 'student-form-schema-2'
const populated = value => ![undefined, null, ''].includes(value)

export function isConfiguredAchievement(metadataValue) {
  return isConfigured(parseStructuredMetadata(metadataValue))
}

function configuredContract(subcategoryId, catalog) {
  return catalog?.categories?.flatMap(category => category.subcategories || [])
    .find(contract => contract.legacy_subcategory_id === subcategoryId) || null
}

function configuredPeriod(metadata, control) {
  if (control === 'date_range') return [metadata._start, metadata._end].filter(Boolean).join(' – ')
  if (metadata.period_precision === 'DATE') {
    const { period_start_year: year, period_start_month: month, period_start_day: day } = metadata
    return year && month && day ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : String(year || '')
  }
  if (metadata.period_precision === 'RANGE') {
    const start = [metadata.period_start_year, metadata.period_start_month, metadata.period_start_day].filter(Boolean).join('-')
    const end = [metadata.period_end_year, metadata.period_end_month, metadata.period_end_day].filter(Boolean).join('-')
    return [start, end].filter(Boolean).join(' – ')
  }
  return ''
}

function configuredRows(subcategoryId, metadata, catalog) {
  const contract = configuredContract(subcategoryId, catalog)
  if (!contract) return null
  const rows = []
  for (const field of contract.fields || []) {
    const rules = field.validation || {}
    const visible = !rules.visible_when || Object.entries(rules.visible_when).every(([key, value]) => metadata[key] === value)
    if (!visible) continue
    const control = field.control || 'text'
    let value
    if (control === 'fixed') value = metadata[field.key] ?? rules.value
    else if (control === 'date_range') value = configuredPeriod({ _start: metadata[rules.start_key], _end: metadata[rules.end_key] }, control)
    else if (control === 'structured_date_or_range') value = configuredPeriod(metadata, control)
    else value = metadata[field.key]
    if (!populated(value)) continue
    const option = (field.options || []).find(item => (typeof item === 'string' ? item : item.value) === value)
    rows.push({ key: field.key, label: field.label, value: option ? (typeof option === 'string' ? option : option.label) : String(value), affectsAwards: affectsAwardEvaluation(field.key) })
  }
  return rows
}

/**
 * Category-specific details the student entered, as label/value rows using the subcategory
 * form's own labels (dropdown values shown by their option label). Only filled fields appear.
 */
export function detailRows(subcategoryId, metadataValue, catalog = null) {
  const metadata = parseStructuredMetadata(metadataValue)
  if (isConfigured(metadata)) return configuredRows(subcategoryId, metadata, catalog) || []
  const fields = getSubcategorySchema(subcategoryId)?.fields || []
  return fields
    .filter(field => ![undefined, null, ''].includes(metadata[field.key]))
    .map(field => {
      const raw = metadata[field.key]
      const option = (field.options || []).find(item => item.value === raw)
      return { key: field.key, label: field.label, value: option ? option.label : String(raw), affectsAwards: affectsAwardEvaluation(field.key) }
    })
}

/** Required fields of the subcategory that the student left empty. */
export function missingRequiredDetails(subcategoryId, metadataValue, catalog = null) {
  const metadata = parseStructuredMetadata(metadataValue)
  if (isConfigured(metadata)) {
    const contract = configuredContract(subcategoryId, catalog)
    if (!contract) return []
    return (contract.fields || []).filter(field => {
      const rules = field.validation || {}
      const visible = !rules.visible_when || Object.entries(rules.visible_when).every(([key, value]) => metadata[key] === value)
      const conditionRequired = rules.required_when && Object.entries(rules.required_when).some(([key, value]) => metadata[key] === value)
      if (!visible || (!field.required && !conditionRequired)) return false
      if (field.control === 'date_range') return !populated(metadata[rules.start_key])
      if (field.control === 'structured_date_or_range') return !['DATE', 'RANGE'].includes(metadata.period_precision)
      return !populated(metadata[field.key])
    }).map(field => ({ key: field.key, label: field.label, affectsAwards: affectsAwardEvaluation(field.key) }))
  }
  return (getSubcategorySchema(subcategoryId)?.fields || [])
    .filter(field => field.required && [undefined, null, ''].includes(metadata[field.key]))
    .map(field => ({ key: field.key, label: field.label, affectsAwards: affectsAwardEvaluation(field.key) }))
}
