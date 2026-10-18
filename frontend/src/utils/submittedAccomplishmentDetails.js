import { facultySubcategoryByCode } from '../config/facultyAcademicAccomplishmentSchema'

const object = value => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch { return {} }
}

const display = value => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''

/** Read only the values frozen into the submitted evaluation item. */
export function submittedAccomplishmentDetails(item = {}) {
  const payload = object(item.scoring_payload)
  const metadata = object(payload.category_metadata || item.category_metadata)
  const details = object(metadata.details)
  const schema = facultySubcategoryByCode(metadata.subcategory_code)
  const isFacultyB1 = ['B1_ACTIVITY', 'B.1.1'].includes(String(metadata.subcategory_code || '').trim().toUpperCase())
  const isRetiredHeadcount = key => ['participants', 'participantcount', 'participantscount', 'numberofparticipants', 'numberofparticipant', 'participantheadcount']
    .includes(String(key || '').replaceAll(/[^a-z0-9]/gi, '').toLowerCase())
  const fields = schema?.fields || []
  const rows = fields.flatMap(field => {
    if (field.showWhen && details[field.showWhen.field] !== field.showWhen.equals) return []
    const value = display(details[field.name])
    return value ? [{ key: field.name, label: field.label, value }] : []
  })
  const seen = new Set(rows.map(row => row.key))
  // Older submitted items may not have a recognized schema. Show their saved
  // scalar details without substituting values from the mutable profile.
  if (!schema) for (const [key, raw] of Object.entries(details)) {
    if (isFacultyB1 && isRetiredHeadcount(key)) continue
    const value = display(raw)
    if (value && !seen.has(key)) rows.push({ key, label: key.replaceAll('_', ' '), value })
  }
  const start = display(metadata.start_date)
  const end = display(metadata.end_date)
  if (start) rows.push({ key: 'start_date', label: 'Start date', value: start })
  if (end) rows.push({ key: 'end_date', label: 'End date', value: end })
  if (metadata.ongoing === true) rows.push({ key: 'ongoing', label: 'Status', value: 'Ongoing' })
  if (!start && !end) {
    const date = display(payload.occurrence_date)
    if (date) rows.push({ key: 'occurrence_date', label: 'Date', value: date })
  }
  return rows
}

export function submittedScoringOptions(item = {}) {
  const snapshot = object(item.criterion_snapshot)
  return (Array.isArray(snapshot.matched_options) ? snapshot.matched_options : []).flatMap(option => {
    const label = display(option.label || option.name || option.option_name || option.description)
    if (option.points == null || option.points === '') return []
    const points = Number(option.points)
    return label && Number.isFinite(points) ? [{ label, points }] : []
  })
}
