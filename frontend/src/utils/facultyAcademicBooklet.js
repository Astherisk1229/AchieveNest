import { resolvePersonnelEvidence } from './personnelEvidence'
import { usesFacultyAcademicPortfolio } from './personnelPortfolioFormat'
import { facultySubcategoryByCode, formatFacultyAccomplishmentInstitution, formatFacultyAccomplishmentTitle } from '../config/facultyAcademicAccomplishmentSchema'

export const FACULTY_ACADEMIC_CRITERIA = [
  { key: 'A.1', area: 'A', label: 'A.1 Education', columns: ['Date / Period', 'Course / Degree', 'School / University', 'Remarks / Classification'] },
  { key: 'A.2', area: 'A', label: 'A.2 Active Membership to Professional Organizations', columns: ['Date / Period', 'Organization', 'Organization / Institution', 'Remarks / Classification'] },
  { key: 'A.3', area: 'A', label: 'A.3 Attendance to Seminar-Workshop / Trainings', columns: ['Date / Period', 'Title', 'Organizer / Institution', 'Remarks / Classification'] },
  { key: 'B.1', area: 'B', label: 'B.1 Guest Lecturer / Consultant / Judge / Resource Person', columns: ['Date / Period', 'Activity', 'Organizer / Institution', 'Remarks / Classification'] },
  { key: 'B.2', area: 'B', label: 'B.2 Publication', columns: ['Date / Period', 'Publication', 'Publisher / Institution', 'Remarks / Classification'] },
  { key: 'B.3', area: 'B', label: 'B.3 Conduct of Research', columns: ['Date / Period', 'Research', 'Institution / Granting Body', 'Remarks / Classification'] },
  { key: 'B.4', area: 'B', label: 'B.4 Professional Recognition / Awards', columns: ['Date / Period', 'Recognition / Award', 'Granting Institution', 'Remarks / Classification'] },
  { key: 'B.5', area: 'B', label: 'B.5 Production of Instructional Materials', columns: ['Date / Period', 'Material', 'Institution / Context', 'Remarks / Classification'] },
  { key: 'B.6', area: 'B', label: 'B.6 Creative Work', columns: ['Date / Period', 'Creative Work', 'Institution / Context', 'Remarks / Classification'] },
  { key: 'C.1.1', area: 'C', label: 'C.1.a Moderator of Clubs / Organizations', columns: ['Date / Period', 'Organization / Role', 'School Organization', 'Remarks / Classification'] },
  { key: 'C.1.2', area: 'C', label: 'C.1.b Coach / Trainer', columns: ['Date / Period', 'Activity / Team', 'School / Institution', 'Remarks / Classification'] },
  { key: 'C.1.3', area: 'C', label: 'C.1.c Membership in Working Committees', columns: ['Date / Period', 'Committee / Assignment', 'School / Institution', 'Remarks / Classification'] },
  { key: 'C.1.4', area: 'C', label: 'C.1.d Rendered Service in School Activities', columns: ['Date / Period', 'Service / Activity', 'School / Institution', 'Remarks / Classification'] },
  { key: 'C.2.1', area: 'C', label: 'C.2.a Active Involvement in Church Activities', columns: ['Date / Period', 'Activity / Service', 'Church / Organization', 'Remarks / Classification'] },
  { key: 'C.2.2', area: 'C', label: 'C.2.b Active Involvement in Community / Civic Activities', columns: ['Date / Period', 'Activity / Service', 'Community / Organization', 'Remarks / Classification'] },
  { key: 'C.2.3', area: 'C', label: 'C.2.c Support to Charity and Community Projects', columns: ['Date / Period', 'Project / Support', 'Beneficiary / Organization', 'Remarks / Classification'] },
  { key: 'C.3', area: 'C', label: 'C.3 Years of Service at NDMU', columns: ['Inclusive Date / Service Period', 'Remarks'] }
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

// Submitted evaluation items keep the original accomplishment classification
// inside scoring_payload. Merge that frozen data with any top-level metadata so
// an empty API field cannot hide the submitted snapshot.
function facultyMetadata(item = {}, payload = null) {
  const scoringPayload = payload || parseObject(item.scoring_payload)
  const payloadMetadata = parseObject(scoringPayload.category_metadata)
  const itemMetadata = parseObject(item.category_metadata)
  const isSubmittedItem = item.item_description !== undefined || item.submission_order !== undefined || item.criterion_snapshot !== undefined
  if (isSubmittedItem && Object.keys(payloadMetadata).length) {
    return {
      ...itemMetadata,
      ...payloadMetadata,
      details: {
        ...parseObject(itemMetadata.details),
        ...parseObject(payloadMetadata.details)
      }
    }
  }
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
  const payloadMetadata = parseObject(payload.category_metadata)
  const snapshot = parseObject(item.criterion_snapshot || item.criterionSnapshot)
  const subcategory = String(
    payloadMetadata.subcategory_code || item.subcategory_code || metadata.subcategory_code || item.criterion_key || item.criterionKey ||
    snapshot.subcategory?.subcategory_code || snapshot.subcategory?.code ||
    snapshot.criterion?.code || snapshot.category?.subcategory_code || ''
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

  const educationDetails = parseObject(metadata.details)
  const educationText = [item.item_description, item.title, item.evidence_title, educationDetails.degree_title, educationDetails.program]
    .filter(Boolean).join(' ')
  if (/\bdoctor|ph\.?\s*d|master/i.test(educationText)
      && (educationDetails.units_completed !== undefined || /\bunits?\b/i.test(educationText))) return 'A.1'

  const explicit = String(
    item.criterion_code || item.criterion_key || item.criterionKey || item.category_code ||
    metadata.criterion_code || snapshot.category?.code || snapshot.criterion?.code || ''
  ).trim()
  const exact = FACULTY_ACADEMIC_CRITERIA.find((criterion) => explicit === criterion.key)
  if (exact) return exact.key
  if (item.is_unclassified || item.advisory_status === 'Needs Classification') return null
  const category = String(
    item.category || item.criterion_title || snapshot.subcategory?.name || snapshot.criterion?.name ||
    snapshot.category?.name || educationDetails.degree_title || educationDetails.program ||
    item.item_description || item.title || ''
  ).trim()
  return CATEGORY_ALIASES.find(([pattern]) => pattern.test(category))?.[1] || null
}

export function normalizeFacultyBookletItems(portfolio = {}) {
  const source = Array.isArray(portfolio.items)
    ? portfolio.items
    : [...(portfolio.area_a_items || []), ...(portfolio.area_b_items || []), ...(portfolio.area_c_items || [])]
  const seen = new Set()
  const normalized = source.flatMap((item) => {
    const payload = parseObject(item.scoring_payload)
    const metadata = facultyMetadata(item, payload)
    const accomplishmentId = item.accomplishment_id || item.canonical_id || item.id
    const criterionKey = resolveFacultyCriterion(item)
    if (!accomplishmentId || !criterionKey || seen.has(accomplishmentId)) return []
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
    if (['A1_PHD_UNITS', 'A1_MA_UNITS'].includes(subcategoryCode)) {
      classifications.push(
        details.semester,
        details.academic_year ? `AY ${details.academic_year}` : '',
        details.units_completed !== undefined && details.units_completed !== '' ? `${details.units_completed} units completed` : ''
      )
    }
    if (details.membership_role) classifications.push(details.membership_role, details.position)
    if (details.role && !classifications.includes(details.role)) classifications.push(details.role)
    classifications.push(details.recognition_status, details.publication_type, details.material_type, details.creative_work_type, details.scope, details.extent, details.support_type)
    const accomplishmentDisplay = formatFacultyAccomplishmentTitle(details, subcategoryCode) || item.evidence_title || item.title || item.item_description || ''
    const organizationDisplay = formatFacultyAccomplishmentInstitution(details, subcategoryCode) || item.organizer_or_publisher || item.issuer || item.location || payload.organizer || ''
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
      status: item.rating_status === 'rated' ? 'Dean evaluated' : item.verification_status || item.status || 'Pending review',
      evidence: evidenceId ? { id: evidenceId, original_filename: fileName, mime_type: evidence?.mime_type || item.mime_type || 'application/pdf', status: evidence?.status || 'active', previewable: evidence?.previewable !== false } : null,
      source: item
    }]
  })
  const counters = {}
  return normalized.map((item) => {
    const referencePrefix = item.criterionKey.replaceAll('.', '')
    counters[referencePrefix] = (counters[referencePrefix] || 0) + 1
    return { ...item, reference: `${referencePrefix}-${String(counters[referencePrefix]).padStart(3, '0')}` }
  })
}

export function isFacultyAcademicFormat(user = {}, portfolio = {}) {
  return usesFacultyAcademicPortfolio(user, portfolio)
}
