import { getSubcategorySchema } from '../config/portfolioFormSchemaRegistry'
import { affectsAwardEvaluation } from '../config/awardEvaluationFields'
import { parseStructuredMetadata } from '../controllers/StudentAchievementDraftSession'

/**
 * Category-specific details the student entered, as label/value rows using the subcategory
 * form's own labels (dropdown values shown by their option label). Only filled fields appear.
 */
export function detailRows(subcategoryId, metadataValue) {
  const metadata = parseStructuredMetadata(metadataValue)
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
export function missingRequiredDetails(subcategoryId, metadataValue) {
  const metadata = parseStructuredMetadata(metadataValue)
  return (getSubcategorySchema(subcategoryId)?.fields || [])
    .filter(field => field.required && [undefined, null, ''].includes(metadata[field.key]))
    .map(field => ({ key: field.key, label: field.label, affectsAwards: affectsAwardEvaluation(field.key) }))
}
