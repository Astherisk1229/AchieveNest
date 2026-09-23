import { facultySchemaByCode, facultySubcategoryByCode } from '../config/facultyAcademicAccomplishmentSchema'

export const EMPTY_ACCOMPLISHMENT_FORM = Object.freeze({ id: null, mode: 'create', area: 'A', categoryCode: 'A.1', subcategoryCode: 'A1_PHD_HOLDER', date: '', startDate: '', endDate: '', ongoing: false, details: {}, persistedEvidence: [], pendingEvidence: [], originalSnapshot: null, legacy: false })

const parseMetadata = (value) => {
  if (!value) return {}
  if (typeof value === 'object') return value
  try { return JSON.parse(value) } catch { return {} }
}

export function isStrictIsoDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)
}

export function mapAccomplishmentToForm(record = {}) {
  const metadata = parseMetadata(record.category_metadata)
  const categoryCode = record.category_code || String(record.category || '').match(/^([ABC]\.\d(?:\.\d)?)/)?.[1] || ''
  const subcategory = facultySubcategoryByCode(metadata.subcategory_code)
  const category = facultySchemaByCode(categoryCode)
  const fallbackSubcategory = category?.subcategories?.[0]
  const resolved = subcategory || fallbackSubcategory
  const evidence = Array.isArray(record.evidence) ? record.evidence : (record.primary_evidence ? [record.primary_evidence] : [])
  const details = metadata.details && typeof metadata.details === 'object' ? metadata.details : { ...metadata }
  if (!subcategory && resolved) {
    const textFields = resolved.fields.filter((field) => field.type === 'text')
    if (textFields[0] && !details[textFields[0].name] && record.title) details[textFields[0].name] = record.title
    if (textFields[1] && !details[textFields[1].name] && (record.organizer_or_publisher || record.issuer)) details[textFields[1].name] = record.organizer_or_publisher || record.issuer
  }
  const form = {
    id: record.id,
    mode: 'edit',
    area: resolved?.area || category?.area || '',
    categoryCode,
    subcategoryCode: resolved?.code || '',
    date: record.occurrence_date || record.date_achieved || record.date || '',
    startDate: metadata.start_date || '',
    endDate: metadata.end_date || '',
    ongoing: metadata.ongoing === true,
    details,
    persistedEvidence: evidence,
    pendingEvidence: [],
    legacy: !subcategory,
    originalSnapshot: null
  }
  form.originalSnapshot = JSON.stringify({ ...form, originalSnapshot: null })
  return form
}

export function validateAccomplishmentForm(form, config, today = new Date().toLocaleDateString('en-CA')) {
  const errors = {}
  if (!config) return { form: 'Select a valid subcategory.' }
  const future = (value) => value && value > today
  if (config.dateMode === 'single') {
    if (!isStrictIsoDate(form.date)) errors.date = `${config.dateLabel} is required and must be a valid date.`
    else if (future(form.date)) errors.date = `${config.dateLabel} cannot be in the future.`
  } else {
    if (!isStrictIsoDate(form.startDate)) errors.startDate = 'Start date is required and must be valid.'
    if (!form.ongoing && !isStrictIsoDate(form.endDate)) errors.endDate = 'End date is required and must be valid.'
    if (form.startDate && form.endDate && form.startDate > form.endDate) errors.endDate = 'End date must be on or after the start date.'
    if (!form.ongoing && future(form.endDate)) errors.endDate = 'End date cannot be in the future.'
    if (form.ongoing && !config.allowOngoing) errors.ongoing = 'Ongoing is not allowed for this subcategory.'
  }
  for (const field of config.fields) {
    if (field.showWhen && form.details[field.showWhen.field] !== field.showWhen.equals) continue
    const value = form.details[field.name]
    if (field.required === false && !String(value || '').trim()) continue
    if (field.type === 'integer') {
      if (!/^[1-9]\d*$/.test(String(value || ''))) errors[field.name] = `${field.label} must be a whole number greater than zero.`
    } else if (field.type === 'select') {
      if (!field.options.includes(value)) errors[field.name] = `Select a valid ${field.label.toLowerCase()}.`
    } else {
      const clean = String(value || '').trim()
      if (/\p{Cc}/u.test(clean) || clean.length < field.min || clean.length > field.max) errors[field.name] = `${field.label} must be ${field.min}–${field.max} valid characters.`
    }
  }
  if (!form.persistedEvidence.length && !form.pendingEvidence.length) errors.evidence = 'Supporting evidence is required before saving.'
  return errors
}
