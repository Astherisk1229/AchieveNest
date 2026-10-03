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

export function resolveFacultyCriterion(item = {}) {
  if (item.is_unclassified || item.advisory_status === 'Needs Classification') return null
  const explicit = String(item.criterion_code || item.criterion_key || item.category_code || '').trim()
  const exact = FACULTY_ACADEMIC_CRITERIA.find((criterion) => explicit === criterion.key)
  if (exact) return exact.key
  const category = String(item.category || item.criterion_title || '').trim()
  return CATEGORY_ALIASES.find(([pattern]) => pattern.test(category))?.[1] || null
}

export function normalizeFacultyBookletItems(portfolio = {}) {
  const source = Array.isArray(portfolio.items)
    ? portfolio.items
    : [...(portfolio.area_a_items || []), ...(portfolio.area_b_items || []), ...(portfolio.area_c_items || [])]
  const seen = new Set()
  const normalized = source.flatMap((item) => {
    let payload = item.scoring_payload || {}
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload || '{}') } catch { payload = {} }
    }
    let metadata = item.category_metadata || payload.category_metadata || {}
    if (typeof metadata === 'string') {
      try { metadata = JSON.parse(metadata || '{}') } catch { metadata = {} }
    }
    const accomplishmentId = item.accomplishment_id || item.canonical_id || item.id
    const criterionKey = resolveFacultyCriterion(item)
    if (!accomplishmentId || !criterionKey || seen.has(accomplishmentId)) return []
    seen.add(accomplishmentId)
    const evidence = resolvePersonnelEvidence(item)
    const evidenceId = item.evidence_id || evidence?.id || null
    const fileName = evidence?.original_filename || item.file_name || item.proof_file_name || ''
    const subcategoryCode = metadata.subcategory_code || ''
    const subcategory = facultySubcategoryByCode(subcategoryCode)
    const details = metadata.details && typeof metadata.details === 'object' ? metadata.details : metadata
    const start = metadata.start_date || ''
    const end = metadata.end_date || ''
    const dateOrPeriod = metadata.ongoing && start ? `${start} – Ongoing` : (start && end ? `${start} – ${end}` : (item.occurrence_date || item.date_achieved || item.date || payload.occurrence_date || ''))
    const classifications = [subcategory?.label]
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
