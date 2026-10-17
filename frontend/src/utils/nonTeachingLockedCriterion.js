const LEAVES = {
  'B.1.A': ['B.1', 'B.1.1'], 'B.1.B': ['B.1', 'B.1.2'],
  'B.1.C': ['B.1', 'B.1.3'], 'B.1.D': ['B.1', 'B.1.4'],
  'B.2.A': ['B.2', 'B.2.1'], 'B.2.B': ['B.2', 'B.2.2'],
  'B.2.C': ['B.2', 'B.2.3'], 'B.4': ['B.4', 'B.4.1'],
}

export const decodeLockedValue = value => {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string') return {}
  try { return JSON.parse(value) || {} } catch { return {} }
}

export function fixedNonTeachingCriterion(item) {
  const code = String(item?.criterionCode ?? item?.criterion_code ?? '').trim().toUpperCase()
  const expected = LEAVES[code]
  if (!expected) return null
  const [categoryCode, leafCode] = expected
  const snapshot = decodeLockedValue(item?.criterion_snapshot ?? item?.criterionSnapshot)
  const category = decodeLockedValue(snapshot.category)
  const leaf = decodeLockedValue(snapshot.subcategory ?? snapshot.level)
  const points = Number(snapshot.configured_points)
  const categoryMax = Number(category.max_points)
  const itemPoints = Number(item?.configured_points_snapshot ?? item?.configuredPoints)
  const payload = decodeLockedValue(item?.scoring_payload ?? item?.scoringPayload)
  const metadata = decodeLockedValue(payload.category_metadata)
  const contract = String(metadata.contract_code || '').trim().toUpperCase()
  const expectedContract = `NTF-${code.replaceAll('.', '')}`
  if ((metadata.portfolio_format && metadata.portfolio_format !== 'non_teaching_faculty')
    || (contract && contract !== expectedContract)
    || (metadata.criterion_code && String(metadata.criterion_code).toUpperCase() !== code)
    || (code === 'B.4' && !metadata.portfolio_format && !contract)
    || String(category.category_code || '').toUpperCase() !== categoryCode
    || String(leaf.subcategory_code || '').toUpperCase() !== leafCode
    || String(snapshot.criterion_reference || '').toUpperCase() !== leafCode
    || String(item?.criterionKey ?? item?.criterion_key ?? '').toUpperCase() !== leafCode
    || !Number.isFinite(points) || points <= 0 || !Number.isFinite(categoryMax) || categoryMax < points
    || points !== itemPoints
    || (leaf.default_points != null && points !== Number(leaf.default_points))) return null
  return { code, categoryCode, leafCode, points, categoryMax, categoryTitle: category.title || category.category_title || categoryCode }
}
