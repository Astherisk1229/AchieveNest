import { facultySubcategoryForHrCriterion } from '../../../config/facultyAcademicAccomplishmentSchema'

const ACCEPTED_EVIDENCE = ['PDF', 'JPG', 'PNG']
const newId = () => `level-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`

function fieldDefinition(field, schema) {
  const type = field.type === 'integer' ? 'number' : field.type
  const validation = {}
  if (type === 'number') {
    if (field.min !== undefined) validation.min = field.min
    if (field.max !== undefined) validation.max = field.max
    if (field.type === 'integer') validation.integer = true
  } else {
    if (field.min !== undefined) validation.minLength = field.min
    if (field.max !== undefined) validation.maxLength = field.max
  }
  return {
    key: field.name,
    label: field.label,
    type,
    required: field.required !== false,
    ...(field.options ? { options: field.options } : {}),
    ...(schema.ocrMap?.[field.name] ? { ocr_key: schema.ocrMap[field.name] } : {}),
    ...(field.showWhen ? { show_when: field.showWhen } : {}),
    ...(Object.keys(validation).length ? { validation } : {}),
  }
}

function unitLevels(subcategoryCode) {
  const normalizedCode = String(subcategoryCode).toUpperCase()
  const phd = ['A.1.2', 'A1_PHD_UNITS'].includes(normalizedCode)
  // Option codes are unique within the parent category in the existing schema.
  // Prefix by degree so Ph.D. and MA unit schedules can coexist there.
  const codePrefix = phd ? 'PHD_UNIT' : 'MA_UNIT'
  const rows = phd
    ? [[3, 2], [6, 4], [9, 6], [12, 8], [15, 10]]
    : [[3, 1], [6, 2], [9, 3], [12, 4], [15, 5], [18, 6], [21, 7], [24, 8], [27, 9], [30, 10]]
  return rows.map(([threshold, points], index) => ({
    id: newId(), scale_subcategory_id: null, option_group_code: 'LEVEL',
    option_code: `${codePrefix}_${threshold}`, label: `${threshold}${threshold === (phd ? 15 : 30) ? '+' : ''} units`,
    points, display_order: index + 1, is_active: 1, __new: true,
  }))
}

function scoringReference(subcategory, schema) {
  if (String(subcategory.scoring_rule_reference || '').trim()) return subcategory.scoring_rule_reference
  const levels = (subcategory.levels || []).filter(level => Number(level.is_active ?? 1) === 1)
  if (levels.length) {
    const choices = levels.map(level => `${level.label}: ${Number(level.points)} points`).join('; ')
    return `Apply the configured scoring levels for ${schema.label || subcategory.name}: ${choices}. HR verifies the accepted evidence and applies the category and area maximums.`
  }
  const points = Number(subcategory.default_points || 0)
  if (points > 0) {
    return `Award ${points} points when ${schema.label || subcategory.name} is verified. HR confirms the accepted evidence and applies the category and area maximums.`
  }
  return `Use the scoring value configured for ${schema.label || subcategory.name} in this Faculty criteria version. HR verifies the accepted evidence and applies the category and area maximums.`
}

/** Build Faculty Personnel intake settings from the existing official form definitions. */
export function configureFacultyIntakeDefaults(tree) {
  if (String(tree?.sheet?.applies_to || '').toUpperCase() !== 'FACULTY') return tree
  const areas = (tree.areas || []).map(area => ({
    ...area,
    categories: (area.categories || []).map(category => {
      const categoryCode = String(category.category_code || '').toUpperCase()
      if (['B.3', 'B.6'].includes(categoryCode)) {
        return {
          ...category,
          intake_active: 1,
          intake_mode: 'MANUAL_HR',
          field_schema: [],
          evidence_rules: category.evidence_rules?.required === true && category.evidence_rules?.accepted?.length
            ? category.evidence_rules
            : { required: true, accepted: ACCEPTED_EVIDENCE },
          scoring_rule_reference: category.scoring_rule_reference || 'Manual / HR-defined; detailed official scoring rules are pending.',
          subcategories: (category.subcategories || []).map(subcategory => ({ ...subcategory, intake_active: 0 })),
        }
      }
      return {
        ...category,
        subcategories: (category.subcategories || []).map(subcategory => {
          const code = String(subcategory.subcategory_code || '').toUpperCase()
          const schema = facultySubcategoryForHrCriterion(categoryCode, code, subcategory.name)
          // Length of service is calculated by the server from HR-maintained
          // employment history. It is not a Personnel-submitted accomplishment.
          const serverDerivedServiceCredit = /years of service|service credit/i.test(`${subcategory.name || ''} ${code}`)
          const isUnits = ['A.1.2', 'A.1.4', 'A1_PHD_UNITS', 'A1_MA_UNITS'].includes(code) || ['A1_PHD_UNITS', 'A1_MA_UNITS'].includes(String(schema?.code || '').toUpperCase())
          return {
            ...subcategory,
            intake_active: serverDerivedServiceCredit ? 0 : schema ? 1 : Number(subcategory.intake_active || 0),
            intake_mode: 'FORM',
            scoring_rule_reference: schema ? scoringReference(subcategory, schema) : subcategory.scoring_rule_reference,
            field_schema: Array.isArray(subcategory.field_schema) && subcategory.field_schema.length
              ? subcategory.field_schema
              : (schema?.fields || []).map(field => fieldDefinition(field, schema)),
            evidence_rules: subcategory.evidence_rules?.required === true && subcategory.evidence_rules?.accepted?.length
              ? subcategory.evidence_rules
              : { required: true, accepted: ACCEPTED_EVIDENCE },
            ...(isUnits ? { scoring_rule_reference: ['A.1.2', 'A1_PHD_UNITS'].includes(code) || String(schema?.code || '').toUpperCase() === 'A1_PHD_UNITS'
              ? 'Official Faculty Ranking Scale, Table A.1: Ph.D. units (3/6/9/12/15+ units = 2/4/6/8/10 points).'
              : 'Official Faculty Ranking Scale, Table A.1: MA units (3/6/9/12/15/18/21/24/27/30+ units = 1/2/3/4/5/6/7/8/9/10 points).',
              levels: (subcategory.levels?.length ? subcategory.levels : unitLevels(code)).map(level => ({ ...level, scale_subcategory_id: subcategory.id })) } : {}),
          }
        }),
      }
    }),
  }))
  return { ...tree, areas }
}

export function validateFacultyIntakeConfiguration(tree) {
  const issues = []
  for (const area of tree?.areas || []) {
    if (Number(area.is_active ?? 1) !== 1) continue
    for (const category of area.categories || []) {
      if (Number(category.is_active ?? 1) !== 1) continue
      if (['B.3', 'B.6'].includes(String(category.category_code || '').toUpperCase())) {
        if (Number(category.intake_active) !== 1 || String(category.intake_mode).toUpperCase() !== 'MANUAL_HR') {
          issues.push(`${category.category_code} must remain open for Manual / HR-defined entry.`)
        }
        if (category.evidence_rules?.required !== true || !category.evidence_rules?.accepted?.length) issues.push(`${category.category_code} needs required accepted evidence types.`)
        if (!String(category.scoring_rule_reference || '').trim()) issues.push(`${category.category_code} needs an HR scoring reference.`)
        continue
      }
      for (const subcategory of category.subcategories || []) {
        if (Number(subcategory.is_active ?? 1) !== 1 || Number(subcategory.intake_active) !== 1) continue
        if (!Array.isArray(subcategory.field_schema) || subcategory.field_schema.length === 0) {
          issues.push(`${subcategory.subcategory_code || subcategory.name} has no Personnel fields.`)
        }
        if (subcategory.evidence_rules?.required !== true || !subcategory.evidence_rules?.accepted?.length) {
          issues.push(`${subcategory.subcategory_code || subcategory.name} has no required accepted evidence types.`)
        }
        if (!String(subcategory.scoring_rule_reference || '').trim()) issues.push(`${subcategory.subcategory_code || subcategory.name} has no scoring reference.`)
      }
    }
  }
  return issues
}
