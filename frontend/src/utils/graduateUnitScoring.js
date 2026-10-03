/**
 * A.1.2 Ph.D. Units / A.1.4 MA Units — display mirror of the server's GraduateUnitScoringService.
 * Each semester is its own record; units of counted (verified, rated) records are summed per
 * level and the official table is applied ONCE. Per-semester points are never added. MA and
 * Ph.D. units are never mixed. The server's totals remain authoritative.
 */
export const GRADUATE_UNIT_SEMESTERS = ['First Semester', 'Second Semester', 'Summer']

const LEVEL_BY_CODE = { A1_PHD_UNITS: 'PHD', 'A.1.2': 'PHD', A1_MA_UNITS: 'MA', 'A.1.4': 'MA' }
const LABEL = { PHD: 'Ph.D. Units', MA: 'MA Units' }

const decode = (value) => {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string' || !value) return {}
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' ? parsed : {} } catch { return {} }
}

export function graduateUnitPoints(level, units) {
  const groups = Math.floor(Math.max(0, Number(units) || 0) / 3)
  if (level === 'PHD') return Math.min(10, groups * 2)
  if (level === 'MA') return Math.min(10, groups)
  return 0
}

export function graduateUnitLevel(item = {}) {
  const payload = decode(item.scoringPayload ?? item.scoring_payload)
  const metadata = decode(item.category_metadata ?? payload.category_metadata)
  const snapshot = decode(item.criterion_snapshot ?? item.criterionSnapshot)
  for (const code of [metadata.subcategory_code, item.subcategory_code, item.criterionKey, item.criterion_key, snapshot.criterion_reference]) {
    const level = LEVEL_BY_CODE[String(code || '').trim().toUpperCase()]
    if (level) return level
  }
  return null
}

export function graduateUnitsOf(item = {}) {
  const payload = decode(item.scoringPayload ?? item.scoring_payload)
  const metadata = decode(item.category_metadata ?? payload.category_metadata)
  const value = String(decode(metadata.details).units_completed ?? '').trim()
  return /^\d+$/.test(value) ? Number(value) : 0
}

const counts = (item) => (item.verificationStatus ?? item.verification_status) === 'verified' && (item.ratingStatus ?? item.rating_status) === 'rated'

/** { MA: { units, points, itemIds }, PHD: { … } } over counted items only. */
export function aggregateGraduateUnits(items = []) {
  const levels = {}
  for (const item of items) {
    const level = graduateUnitLevel(item)
    if (!level || !counts(item)) continue
    levels[level] ??= { level, label: LABEL[level], units: 0, points: 0, itemIds: [] }
    levels[level].units += graduateUnitsOf(item)
    levels[level].itemIds.push(item.id)
  }
  for (const row of Object.values(levels)) row.points = graduateUnitPoints(row.level, row.units)
  return levels
}
