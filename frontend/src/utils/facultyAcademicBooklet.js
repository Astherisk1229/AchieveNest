import { resolvePersonnelEvidence } from './personnelEvidence'
import { usesFacultyAcademicPortfolio } from './personnelPortfolioFormat'
import { facultySubcategoryByCode, formatFacultyAccomplishmentInstitution, formatFacultyAccomplishmentTitle } from '../config/facultyAcademicAccomplishmentSchema'
import { personnelScoringRemark } from './personnelScoringRemarks'
import { aggregateGraduateUnits, graduateUnitLevel } from './graduateUnitScoring'

export const FACULTY_ACADEMIC_CRITERIA = [
  { key: 'A.1', area: 'A', label: 'A.1 Education', columns: ['Date(s)', 'Course/Degree', 'School/University', 'Remarks'] },
  { key: 'A.2', area: 'A', label: 'A.2 Active Membership to Professional Organizations', columns: ['Date(s)', 'Organization', 'Conducted or Organized by', 'Remarks'] },
  { key: 'A.3', area: 'A', label: 'A.3 Attendance to Seminar-Workshop / Trainings', columns: ['Date(s)', 'Title', 'Conducted or Organized by', 'Remarks'] },
  { key: 'B.1', area: 'B', label: 'B.1 Guest Lecturer / Consultant / Judge / Resource Person', columns: ['Date(s)', 'Activity', 'Conducted or Organized by', 'Remarks'] },
  { key: 'B.2', area: 'B', label: 'B.2 Publication', columns: ['Date(s)', 'Publications', 'Granted by', 'Name/Signature'] },
  { key: 'B.3', area: 'B', label: 'B.3 Conduct of Research', columns: ['Date(s)', 'Research', 'Granted by', 'Name/Signature'] },
  { key: 'B.4', area: 'B', label: 'B.4 Recognition/Awards', columns: ['Date(s)', 'Recognition/Awards', 'Granted by', 'Name/Signature'] },
  { key: 'B.5', area: 'B', label: 'B.5 Production of Instructional Materials', columns: ['Date(s)', 'Materials', 'Granted by', 'Name/Signature'] },
  { key: 'B.6', area: 'B', label: 'B.6 Creative Work', columns: ['Date(s)', 'Creative Work', 'Granted by', 'Name/Signature'] },
  { key: 'C.1.1', area: 'C', label: 'C.1.a Moderator of Clubs / Organizations', columns: ['Date / Period', 'Organization / Role', 'School Organization', 'Remarks / Classification'] },
  { key: 'C.1.2', area: 'C', label: 'C.1.b Coach / Trainer', columns: ['Date / Period', 'Activity / Team', 'School / Institution', 'Remarks / Classification'] },
  { key: 'C.1.3', area: 'C', label: 'C.1.c Membership in Working Committees', columns: ['Date / Period', 'Committee / Assignment', 'School / Institution', 'Remarks / Classification'] },
  { key: 'C.1.4', area: 'C', label: 'C.1.d Rendered Service in School Activities', columns: ['Date / Period', 'Service / Activity', 'School / Institution', 'Remarks / Classification'] },
  { key: 'C.2.1', area: 'C', label: 'C.2.a Active Involvement in Church Activities', columns: ['Date / Period', 'Activity / Service', 'Church / Organization', 'Remarks / Classification'] },
  { key: 'C.2.2', area: 'C', label: 'C.2.b Active Involvement in Community / Civic Activities', columns: ['Date / Period', 'Activity / Service', 'Community / Organization', 'Remarks / Classification'] },
  { key: 'C.2.3', area: 'C', label: 'C.2.c Support to Charity and Community Projects', columns: ['Date / Period', 'Project / Support', 'Beneficiary / Organization', 'Remarks / Classification'] },
  { key: 'C.3', area: 'C', label: 'C.3 Years of Service at NDMU', columns: ['Inclusive Date', 'Remarks'] }
]

const CATEGORY_ALIASES = [
  [/^A\.1\b|degree|education/i, 'A.1'], [/^A\.2\b|membership.*professional/i, 'A.2'], [/^A\.3\b|seminar|training/i, 'A.3'],
  [/^B\.1\b|guest lecturer|consultant|resource person|judge/i, 'B.1'], [/^B\.2\b|publication/i, 'B.2'],
  [/^B\.3\b|conduct of research/i, 'B.3'], [/^B\.4\b|recognition|award/i, 'B.4'],
  [/^B\.5\b|instructional material/i, 'B.5'], [/^B\.6\b|creative work/i, 'B.6'],
  [/^C\.1\.1\b|^C\.1\.a\b|moderator/i, 'C.1.1'], [/^C\.1\.2\b|^C\.1\.b\b|coach|trainer/i, 'C.1.2'],
  [/^C\.1\.3\b|^C\.1\.c\b|working committee/i, 'C.1.3'], [/^C\.1\.4\b|^C\.1\.d\b|intramural|rendered service/i, 'C.1.4'],
  [/^C\.2\.1\b|^C\.2\.a\b|church activit/i, 'C.2.1'], [/^C\.2\.2\b|^C\.2\.b\b|community|civic/i, 'C.2.2'],
  [/^C\.2\.3\b|^C\.2\.c\b|charity/i, 'C.2.3'], [/^C\.3\b|years of service/i, 'C.3']
]

function parseObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value || '{}')
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch { return {} }
  }
  return {}
}

// Submitted evaluation items keep their original accomplishment metadata inside
// scoring_payload. Some API/database shapes also expose category_metadata as an
// empty object. Prefer actual item values, but don't let an empty object hide
// the metadata frozen into the submitted snapshot.
function facultyMetadata(item = {}, payload = null) {
  const scoringPayload = payload || parseObject(item.scoring_payload)
  const payloadMetadata = parseObject(scoringPayload.category_metadata)
  const itemMetadata = parseObject(item.category_metadata)
  return {
    ...payloadMetadata,
    ...itemMetadata,
    details: {
      ...parseObject(payloadMetadata.details),
      ...parseObject(itemMetadata.details)
    }
  }
}

export function resolveFacultyCriterion(item = {}) {
  const payload = parseObject(item.scoring_payload)
  const metadata = facultyMetadata(item, payload)
  let snapshot = item.criterion_snapshot || item.criterionSnapshot || {}
  try { if (typeof snapshot === 'string') snapshot = JSON.parse(snapshot || '{}') } catch { snapshot = {} }
  const explicit = String(
    item.criterion_code || item.criterion_key || item.criterionKey || item.category_code ||
    metadata.criterion_code || snapshot.category?.code || snapshot.criterion?.code || ''
  ).trim()
  // Submitted evaluation items may carry the HR leaf only in criterion_key
  // (for example A1_PHD_UNITS), while live accomplishment rows store it in
  // category_metadata.subcategory_code. Resolve both shapes into the official
  // Faculty booklet category so A.1 Education entries are not silently omitted.
  // The submitted leaf is more specific than a stale or generic criterion code.
  const subcategory = String(
    item.subcategory_code || metadata.subcategory_code || item.criterion_key || item.criterionKey ||
    item.criterion_code || item.category_code ||
    snapshot.subcategory?.subcategory_code || snapshot.subcategory?.code || snapshot.criterion?.code ||
    snapshot.category?.subcategory_code || snapshot.category?.code || ''
  ).trim().toUpperCase()
  const subcategoryAliases = {
    A1_PHD_HOLDER: 'A.1', A1_PHD_UNITS: 'A.1', A1_MA_HOLDER: 'A.1', A1_MA_UNITS: 'A.1',
    'A.1.1': 'A.1', 'A.1.2': 'A.1', 'A.1.3': 'A.1', 'A.1.4': 'A.1',
    'A.1.A': 'A.1', 'A.1.B': 'A.1', 'A.1.C': 'A.1', 'A.1.D': 'A.1',
    A2_MEMBERSHIP: 'A.2', A3_ATTENDANCE: 'A.3',
    B1_ACTIVITY: 'B.1', B2_PUBLICATION: 'B.2', B3_RESEARCH: 'B.3', B4_AWARD: 'B.4',
    B5_MATERIAL: 'B.5', B6_CREATIVE_WORK: 'B.6',
    C1_MODERATOR: 'C.1.1', C1_COACH: 'C.1.2', C1_COMMITTEE: 'C.1.3', C1_SERVICE: 'C.1.4',
    C2_CHURCH: 'C.2.1', C2_CIVIC: 'C.2.2', C2_CHARITY: 'C.2.3'
  }
  if (subcategoryAliases[subcategory]) return subcategoryAliases[subcategory]
  const educationDetails = metadata.details || {}
  const educationText = [item.item_description, item.title, item.evidence_title, educationDetails.degree_title, educationDetails.program]
    .filter(Boolean).join(' ')
  if (/\bdoctor|ph\.?\s*d|master/i.test(educationText)
      && (educationDetails.units_completed !== undefined || /\bunits?\b/i.test(educationText))) return 'A.1'
  const exact = FACULTY_ACADEMIC_CRITERIA.find((criterion) => explicit === criterion.key)
  if (exact) return exact.key
  // A stale advisory/unclassified flag must not suppress a valid saved leaf
  // classification or its structured Education details. Honor those first;
  // only drop the row when there is no authoritative classification to use.
  if (item.is_unclassified || item.advisory_status === 'Needs Classification') return null
  const category = String(
    item.category || item.criterion_title || snapshot.subcategory?.name || snapshot.criterion?.name ||
    snapshot.category?.name || metadata.details?.degree_title || metadata.details?.program || item.item_description || item.title || ''
  ).trim()
  return CATEGORY_ALIASES.find(([pattern]) => pattern.test(category))?.[1] || null
}

export function normalizeFacultyBookletItems(portfolio = {}) {
  const source = Array.isArray(portfolio.items)
    ? portfolio.items
    : [...(portfolio.area_a_items || []), ...(portfolio.area_b_items || []), ...(portfolio.area_c_items || [])]
  const graduateTotals = portfolio.scoreAudience !== 'evaluator' ? {}
    : Array.isArray(portfolio.graduate_units)
      ? Object.fromEntries(portfolio.graduate_units.map((total) => [total.level, { ...total, itemIds: total.item_ids }]))
      : aggregateGraduateUnits(source.map((item) => {
        const payload = parseObject(item.scoring_payload)
        return { ...item, category_metadata: facultyMetadata(item, payload) }
      }))
  const graduateTotalByItemId = new Map()
  Object.values(graduateTotals).forEach((total) => {
    total.itemIds.forEach((id) => graduateTotalByItemId.set(String(id), total))
  })
  const firstGraduateItemByLevel = new Map()
  Object.entries(graduateTotals).forEach(([level, total]) => {
    const firstId = total.itemIds[0]
    if (firstId !== undefined) firstGraduateItemByLevel.set(level, String(firstId))
  })
  const seen = new Set()
  const normalized = source.flatMap((item) => {
    const payload = parseObject(item.scoring_payload)
    const metadata = facultyMetadata(item, payload)
    const accomplishmentId = item.accomplishment_id || item.canonical_id || item.id
    const criterionKey = resolveFacultyCriterion(item)
    if (!accomplishmentId || !criterionKey || seen.has(accomplishmentId)) return []
    // Service years come from HR's employment record, not from a personnel
    // accomplishment or uploaded certificate. Ignore legacy/manual C.3 rows.
    if (criterionKey === 'C.3') return []
    seen.add(accomplishmentId)
    const evidence = resolvePersonnelEvidence(item)
    const evidenceId = item.evidence_id || evidence?.id || null
    const fileName = evidence?.original_filename || item.file_name || item.proof_file_name || ''
    const subcategoryCode = metadata.subcategory_code || ''
    const subcategory = facultySubcategoryByCode(subcategoryCode)
    const details = { ...metadata, ...parseObject(metadata.details) }
    const start = metadata.start_date || ''
    const end = metadata.end_date || ''
    const dateOrPeriod = metadata.ongoing && start ? `${start} – Ongoing` : (start && end ? `${start} – ${end}` : (item.occurrence_date || item.date_achieved || item.date || payload.occurrence_date || ''))
    const classifications = [subcategory?.label]
    if (details.membership_role) classifications.push(details.membership_role, details.position)
    if (details.role && !classifications.includes(details.role)) classifications.push(details.role)
    classifications.push(details.recognition_status, details.publication_type, details.material_type, details.creative_work_type, details.scope, details.extent, details.support_type)
    const accomplishmentDisplay = formatFacultyAccomplishmentTitle(details, subcategoryCode) || item.evidence_title || item.title || item.item_description || ''
    const organizationDisplay = formatFacultyAccomplishmentInstitution(details, subcategoryCode) || item.organizer_or_publisher || item.issuer || item.location || payload.organizer || ''
    const first = (...values) => values.map(value => String(value ?? '').trim()).find(Boolean) || ''
    // Score remarks are evaluator-only. Personnel booklets show accomplishment
    // details without exposing provisional or evaluator scoring.
    const graduateLevel = graduateUnitLevel({ ...item, category_metadata: metadata })
    const graduateTotal = graduateTotalByItemId.get(String(item.id ?? ''))
    const scoreRemark = portfolio.scoreAudience !== 'evaluator'
      ? ''
      : graduateLevel
        ? (graduateTotal
          ? (firstGraduateItemByLevel.get(graduateLevel) === String(item.id)
            ? `Approved: ${graduateTotal.points} points across ${graduateTotal.units} ${graduateLevel === 'PHD' ? 'Ph.D.' : 'MA'} units`
            : `Included in approved ${graduateLevel === 'PHD' ? 'Ph.D.' : 'MA'} units total`)
          : 'Graduate-unit score pending Dean review')
        : personnelScoringRemark(item)
    // The printed portfolio's Remarks column is reserved for the score state.
    // Classification labels (for example, "MA Degree Holder") belong to the
    // accomplishment details and must not be mistaken for points/remarks.
    const remarks = scoreRemark
    const cellsByCriterion = {
      'A.1': [dateOrPeriod, first(details.course_or_degree, details.degree_title, details.program, accomplishmentDisplay), first(details.school_or_university, details.institution, organizationDisplay), remarks],
      'A.2': [dateOrPeriod, first(details.organization, accomplishmentDisplay), first(details.conducted_or_organized_by, details.organizer, details.institution, organizationDisplay), remarks],
      'A.3': [dateOrPeriod, first(details.title, details.activity_title, accomplishmentDisplay), first(details.conducted_or_organized_by, details.organizer, details.institution, organizationDisplay), remarks],
      'B.1': [dateOrPeriod, first(details.activity, details.activity_title, accomplishmentDisplay), first(details.conducted_or_organized_by, details.organizer, details.institution, organizationDisplay), remarks],
      'B.2': [dateOrPeriod, first(details.publications, details.publication, details.publication_title, accomplishmentDisplay), first(details.granted_by, details.publisher_or_journal, details.granting_body, organizationDisplay), first(details.name_signature, details.signature)],
      'B.3': [dateOrPeriod, first(details.research, details.research_title, accomplishmentDisplay), first(details.granted_by, details.granting_body, organizationDisplay), first(details.name_signature, details.signature)],
      'B.4': [dateOrPeriod, first(details.recognition_awards, details.recognition_or_award, details.award_title, accomplishmentDisplay), first(details.granted_by, details.granting_body, organizationDisplay), first(details.name_signature, details.signature)],
      'B.5': [dateOrPeriod, first(details.materials, details.material, details.material_title, accomplishmentDisplay), first(details.granted_by, details.institution_program, organizationDisplay), first(details.name_signature, details.signature)],
      'B.6': [dateOrPeriod, first(details.creative_work, accomplishmentDisplay), first(details.granted_by, details.presenting_body, organizationDisplay), first(details.name_signature, details.signature)],
      'C.1.1': [dateOrPeriod, [details.organization, details.role].filter(Boolean).join(' · ') || accomplishmentDisplay, first(details.organizer, details.school_organization, organizationDisplay), remarks],
      'C.1.2': [dateOrPeriod, first(details.activity, accomplishmentDisplay), first(details.organizer, details.school_institution, organizationDisplay), remarks],
      'C.1.3': [dateOrPeriod, first(details.activity, accomplishmentDisplay), first(details.organizer, details.school_institution, organizationDisplay), remarks],
      'C.1.4': [dateOrPeriod, first(details.activity, accomplishmentDisplay), first(details.organizer, details.school_institution, organizationDisplay), remarks],
      'C.2.1': [dateOrPeriod, first(details.activity, accomplishmentDisplay), first(details.organizer, organizationDisplay), remarks],
      'C.2.2': [dateOrPeriod, first(details.activity, accomplishmentDisplay), first(details.organizer, organizationDisplay), remarks],
      'C.2.3': [dateOrPeriod, first(details.activity, accomplishmentDisplay), first(details.organizer, organizationDisplay), remarks],
      'C.3': [dateOrPeriod, remarks],
    }
    return [{
      accomplishmentId,
      criterionKey,
      subcategoryCode,
      date_or_period_display: dateOrPeriod,
      accomplishment_display: accomplishmentDisplay,
      organization_display: organizationDisplay,
      title: accomplishmentDisplay,
      institution: organizationDisplay,
      remarks_classification_display: classifications.filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(' · '),
      portfolio_cells: cellsByCriterion[criterionKey] || null,
      status: item.rating_status === 'rated' ? 'Dean evaluated' : item.verification_status || item.status || 'Pending review',
      evidence: evidenceId ? { id: evidenceId, original_filename: fileName, mime_type: evidence?.mime_type || item.mime_type || 'application/pdf', status: evidence?.status || 'active', previewable: evidence?.previewable !== false } : null,
      source: item
    }]
  })
  const serviceYearsValue = portfolio.tenure_years ?? portfolio.years_of_service ?? portfolio.service_completed_years
  const serviceYears = Number(serviceYearsValue)
  if (serviceYearsValue !== null && serviceYearsValue !== undefined && serviceYearsValue !== '' && Number.isFinite(serviceYears) && serviceYears >= 0) {
    const completedYears = Math.floor(serviceYears)
    const yearsLabel = `${completedYears} ${completedYears === 1 ? 'year' : 'years'}`
    normalized.push({
      accomplishmentId: 'derived-service-years-C3',
      criterionKey: 'C.3',
      date_or_period_display: yearsLabel,
      accomplishment_display: yearsLabel,
      organization_display: '',
      remarks_classification_display: '',
      portfolio_cells: [yearsLabel, ''],
      status: 'From HR employment record',
      evidence: null,
      source: null
    })
  }
  const counters = {}
  return normalized.map((item) => {
    const referencePrefix = item.criterionKey.replaceAll('.', '')
    counters[referencePrefix] = (counters[referencePrefix] || 0) + 1
    return { ...item, reference: `${referencePrefix}-${String(counters[referencePrefix]).padStart(3, '0')}` }
  })
}

/** Records which cannot be placed in the official faculty booklet must remain visible to reviewers. */
export function facultyBookletUnmappedItems(portfolio = {}, rows = []) {
  const source = Array.isArray(portfolio.items)
    ? portfolio.items
    : [...(portfolio.area_a_items || []), ...(portfolio.area_b_items || []), ...(portfolio.area_c_items || [])]
  const displayed = new Set(rows.map((row) => String(row.accomplishmentId)))
  return source.filter((item) => {
    const id = item?.accomplishment_id || item?.canonical_id || item?.id
    return id && resolveFacultyCriterion(item) !== 'C.3' && !displayed.has(String(id))
  }).map((item) => ({
    id: item.accomplishment_id || item.canonical_id || item.id,
    title: item.item_description || item.evidence_title || item.title || 'Untitled accomplishment'
  }))
}

export function facultyBookletIncompleteItems(rows = []) {
  return rows.filter((row) => row.source && (
    !String(row.date_or_period_display || '').trim() ||
    (row.criterionKey === 'A.1' && !String(row.organization_display || '').trim())
  ))
}

/** Flag an undergraduate certificate classified under a graduate degree or units criterion. */
export function facultyEducationClassificationConflicts(items = []) {
  return items.flatMap((item) => {
    const payload = parseObject(item?.scoring_payload)
    const metadata = facultyMetadata(item || {}, payload)
    const subcategory = String(item?.subcategory_code || metadata.subcategory_code || '').toUpperCase()
    const title = String(metadata.details?.degree_title || metadata.details?.program || item?.item_description || item?.title || '')
    if (resolveFacultyCriterion(item) !== 'A.1' || !/^A1_(PHD|MA)_(HOLDER|UNITS)$/.test(subcategory) || !/\bbachelor\b/i.test(title)) return []
    return [{ item, title, subcategory }]
  })
}

export function isFacultyAcademicFormat(user = {}, portfolio = {}) {
  return usesFacultyAcademicPortfolio(user, portfolio)
}
