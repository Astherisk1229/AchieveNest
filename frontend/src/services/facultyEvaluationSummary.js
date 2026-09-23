import { NDMU_PERSONNEL_RATING_RULES } from '../pages/hr-admin/evaluation-submissions/evaluation/rating/NDMURatingRules.js'

export const FACULTY_SUMMARY_ROWS = Object.freeze([
  ['A.1.a', 'a. Ph.D. Holder', 'A', 40, 'A1_PHD_HOLDER', '1. Degrees'],
  ['A.1.b', 'b. Ph.D. Units', 'A', 10, 'A1_PHD_UNITS', '1. Degrees'],
  ['A.1.c', 'c. MA Holder', 'A', 20, 'A1_MA_HOLDER', '1. Degrees'],
  ['A.1.d', 'd. MA Units', 'A', 10, 'A1_MA_UNITS', '1. Degrees'],
  ['A.2', '2. Active Membership to Professional Organizations', 'A', NDMU_PERSONNEL_RATING_RULES.areaA.criteria.memberships.maxPoints],
  ['A.3', '3. Attendance to Seminar / Workshop / Trainings', 'A', NDMU_PERSONNEL_RATING_RULES.areaA.criteria.seminars.maxPoints],
  ['B.1', '1. Invited as Guest Lecturer / Consultant / Judge / Resource Person', 'B', NDMU_PERSONNEL_RATING_RULES.areaB.criteria.lectures.maxPoints],
  ['B.2', '2. Publication', 'B', NDMU_PERSONNEL_RATING_RULES.areaB.criteria.publications.maxPoints],
  ['B.3', '3. Conduct of Research', 'B', NDMU_PERSONNEL_RATING_RULES.areaB.criteria.research.maxPoints],
  ['B.4', '4. Professional Recognition or Awards', 'B', NDMU_PERSONNEL_RATING_RULES.areaB.criteria.awards.maxPoints],
  ['B.5', '5. Production of Instructional Materials', 'B', NDMU_PERSONNEL_RATING_RULES.areaB.criteria.instructional.maxPoints],
  ['B.6', '6. Creative Work', 'B', NDMU_PERSONNEL_RATING_RULES.areaB.criteria.creative.maxPoints],
  ['C.1.1', 'a. Moderator / Officer of Clubs', 'C', 20, null, '1. Involvement in Extra-Curricular Activities / Recognized School Organizations'],
  ['C.1.2', 'b. Trainer / Coach', 'C', 20, null, '1. Involvement in Extra-Curricular Activities / Recognized School Organizations'],
  ['C.1.3', 'c. Membership in Working Committees', 'C', 20, null, '1. Involvement in Extra-Curricular Activities / Recognized School Organizations'],
  ['C.1.4', 'd. Rendered Service in School Activities', 'C', 10, null, '1. Involvement in Extra-Curricular Activities / Recognized School Organizations'],
  ['C.2.1', 'a. Active Involvement in Church Activities', 'C', 25, null, '2. Community Involvement'],
  ['C.2.2', 'b. Active Involvement in Community / Civic Activities', 'C', 25, null, '2. Community Involvement'],
  ['C.2.3', 'c. Support to Charity and Community Projects', 'C', 5, null, '2. Community Involvement'],
  ['C.3', '3. No. of Years at NDMU', 'C', 10]
].map(([code, criterion, area, weight, subcategory, parent]) => ({ code, criterion, area, weight, subcategory, parent })))

export const FACULTY_AREA_CAPS = Object.freeze({ A: 70, B: 50, C: 40 })
export const FACULTY_GRAND_TOTAL_CAP = 160
export const FACULTY_PASSING_SCORE = 120
const FINAL_STATUSES = new Set(['completed', 'completed_scored', 'confirmed', 'finalized'])

const parseObject = (value) => {
  if (value && typeof value === 'object') return value
  try { return JSON.parse(value || '{}') } catch { return {} }
}

const evidenceLabel = (items) => {
  const evidence = items.flatMap((item) => item.evidence || item.evidence_files || (item.evidence_id || item.file_name ? [item] : []))
  if (!evidence.length) return ''
  if (evidence.length > 1) {
    const names = evidence.map((entry) => String(entry.original_filename || entry.file_name || '').toLowerCase())
    return names.every((name) => name.includes('certificate')) ? `${evidence.length} Certificates` : `${evidence.length} Supporting Documents`
  }
  const name = evidence[0].original_filename || evidence[0].file_name || ''
  return name ? name.replace(/\.[^.]+$/, '') : '1 Supporting Document'
}

const criterionCode = (item) => String(item.category_code || item.categoryCode || item.category || item.criterion_code || item.criterionCode || '').trim()

const matchesDefinition = (definition, item) => {
  const metadata = parseObject(item.category_metadata || item.scoring_payload?.category_metadata)
  if (definition.subcategory) return metadata.subcategory_code === definition.subcategory
  const code = criterionCode(item)
  if (code === definition.code) return true
  const aliases = { 'C.1.1': 'C.1.a', 'C.1.2': 'C.1.b', 'C.1.3': 'C.1.c', 'C.1.4': 'C.1.d', 'C.2.1': 'C.2.a', 'C.2.2': 'C.2.b', 'C.2.3': 'C.2.c' }
  return aliases[definition.code] === code
}

export function buildFacultyEvaluationSummaryRows(items = []) {
  return FACULTY_SUMMARY_ROWS.map((definition) => {
    const contributing = items.filter((item) => matchesDefinition(definition, item))
    const rawPoints = contributing.reduce((sum, item) => sum + Number(item.accepted_points ?? item.awardedPoints ?? 0), 0)
    return { ...definition, documents_submitted: evidenceLabel(contributing), raw_points: rawPoints, points_earned: Math.min(definition.weight, rawPoints), contributing_item_ids: contributing.map((item) => item.id || item.item_id).filter(Boolean) }
  })
}

export function buildFacultyEvaluationSummary({ evaluation = {}, items = [] } = {}) {
  const rows = buildFacultyEvaluationSummaryRows(items)
  const areas = Object.fromEntries(Object.entries(FACULTY_AREA_CAPS).map(([area, cap]) => {
    const areaRows = rows.filter((row) => row.area === area)
    const rawPoints = areaRows.reduce((sum, row) => sum + row.points_earned, 0)
    return [area, { area, cap, raw_points: rawPoints, points_earned: Math.min(cap, rawPoints), rows: areaRows }]
  }))
  const rawTotal = Object.values(areas).reduce((sum, area) => sum + area.points_earned, 0)
  const status = String(evaluation.evaluation_status || evaluation.status || '').toLowerCase()
  const portfolioVersionId = evaluation.portfolio_version_id || evaluation.version_id || evaluation.id || null

  return {
    document_status: FINAL_STATUSES.has(status) ? 'final' : 'draft',
    portfolio_version_id: portfolioVersionId,
    areas,
    raw_total: rawTotal,
    grand_total: Math.min(FACULTY_GRAND_TOTAL_CAP, rawTotal),
    maximum_score: FACULTY_GRAND_TOTAL_CAP,
    passing_score: FACULTY_PASSING_SCORE,
    approval: {
      recommended_for_approval: '',
      chair: '',
      members: ['', '', ''],
      approved: '',
      president: '',
      date: ''
    }
  }
}
