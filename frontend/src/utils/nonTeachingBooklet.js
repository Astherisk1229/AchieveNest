import { resolvePersonnelEvidence } from './personnelEvidence'
import { NTP_AREA_A_ITEMS, ntpCriterionByCode, ntpDetailText, resolveNtpCriterion } from '../config/nonTeachingPortfolioSchema'

const parse = (value) => {
  if (!value) return {}
  if (typeof value === 'object') return value
  try { return JSON.parse(value) || {} } catch { return {} }
}

const text = (value) => String(value ?? '').trim()
const isAreaA = (item) => /^areaa$/i.test(text(item.category_area || item.categoryArea)) || text(item.domain) === 'ntf_annual_review'

/** Rows for Non-Teaching records that were saved under the older B/C categories (kept visible, never dropped). */
export const NTP_OTHER_KEY = 'OTHER'

/**
 * Normalizes a Non-Teaching portfolio (editable records or a submitted evaluation snapshot) into
 * booklet rows that share the Faculty booklet's row shape, plus the HR-rated Area A values.
 */
export function normalizeNonTeachingBookletItems(portfolio = {}) {
  const source = Array.isArray(portfolio.items)
    ? portfolio.items
    : [...(portfolio.area_a_items || []), ...(portfolio.area_b_items || []), ...(portfolio.area_c_items || [])]
  const seen = new Set()
  const rows = source.flatMap((item) => {
    if (isAreaA(item)) return []
    const accomplishmentId = item.accomplishment_id || item.canonical_id || item.id
    if (!accomplishmentId || seen.has(accomplishmentId)) return []
    seen.add(accomplishmentId)
    const payload = parse(item.scoring_payload || item.scoringPayload)
    const metadata = parse(item.category_metadata || payload.category_metadata)
    const details = metadata.details && typeof metadata.details === 'object' ? metadata.details : {}
    const code = resolveNtpCriterion(item)
    const criterion = ntpCriterionByCode(code)
    const start = text(metadata.start_date)
    const end = text(metadata.end_date)
    const single = text(item.occurrence_date || item.date_achieved || item.date || payload.occurrence_date)
    const dateOrPeriod = metadata.ongoing && start ? `${start} – Ongoing` : (start && end && start !== end ? `${start} – ${end}` : (start || single))
    const primary = criterion ? ntpDetailText(criterion, details, criterion.primary) : ''
    const secondary = criterion ? criterion.secondary.map((name) => ntpDetailText(criterion, details, name)).filter(Boolean).join(' · ') : ''
    const title = primary || text(item.evidence_title || item.title || item.item_description || item.achievement)
    const organization = secondary || text(item.organizer_or_publisher || item.issuer || item.location || payload.organizer)
    const evidence = resolvePersonnelEvidence(item)
    return [{
      accomplishmentId,
      criterionKey: criterion ? criterion.code : NTP_OTHER_KEY,
      date_or_period_display: dateOrPeriod,
      accomplishment_display: title,
      organization_display: organization,
      title,
      institution: organization,
      remarks_classification_display: criterion ? text(item.description || payload.original_remarks || '') : text(item.category || item.criterion_title),
      status: item.rating_status === 'rated' ? 'Evaluated' : item.verification_status || item.status || 'Pending review',
      evidence: evidence ? { id: evidence.id, original_filename: evidence.original_filename || item.file_name || '', mime_type: evidence.mime_type || 'application/pdf', status: evidence.status || 'active', previewable: evidence.previewable !== false } : null,
      source: item
    }]
  })
  const counters = {}
  return rows.map((row) => {
    const prefix = row.criterionKey === NTP_OTHER_KEY ? 'OTH' : row.criterionKey.replaceAll('.', '').toUpperCase()
    counters[prefix] = (counters[prefix] || 0) + 1
    return { ...row, reference: `${prefix}-${String(counters[prefix]).padStart(3, '0')}` }
  })
}

/**
 * HR-rated Area A values (DS × weight). Present only on evaluation snapshots; personnel see "Rated by HR".
 * DS is the HR value or the average of the imported school years.
 */
export function nonTeachingAreaARows(portfolio = {}) {
  const source = Array.isArray(portfolio.items) ? portfolio.items : (portfolio.area_a_items || [])
  return NTP_AREA_A_ITEMS.map((definition) => {
    const item = source.find((entry) => isAreaA(entry) && text(entry.criterion_code || entry.criterionCode).toUpperCase() === definition.code) || null
    const payload = parse(item?.scoring_payload || item?.scoringPayload)
    const values = [].concat(payload.ds ?? []).filter((value) => value !== null && value !== '' && Number.isFinite(Number(value))).map(Number)
    const ds = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
    const pointsRaw = item?.awardedPoints ?? item?.awarded_points
    const points = pointsRaw === null || pointsRaw === undefined || pointsRaw === '' ? null : Number(pointsRaw)
    return { ...definition, item, ds, points, setByHr: payload.ds_source === 'hr' }
  })
}

/** B.3: one point per two completed years, capped at 10. */
export function nonTeachingServicePoints(tenureYears) {
  const years = Number(tenureYears)
  if (!Number.isFinite(years) || years < 0) return null
  return Math.min(10, Math.floor(years / 2))
}
