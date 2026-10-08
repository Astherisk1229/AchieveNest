import { FACULTY_ACADEMIC_CRITERIA, isFacultyAcademicFormat, normalizeFacultyBookletItems } from '../../utils/facultyAcademicBooklet'
import { NTP_AREAS, NTP_ENTRY_CRITERIA, NTP_YEARS_OF_SERVICE } from '../../config/nonTeachingPortfolioSchema'
import { NTP_OTHER_KEY, normalizeNonTeachingBookletItems } from '../../utils/nonTeachingBooklet'

/*
 * One booklet layout (A4 pages, NDMU header, emerald section bands, Supporting Evidence pages),
 * two formats. The format decides the title, header fields, areas and criteria; everything else
 * — the personnel view, the Dean / HR review view and the printed PDF — is identical.
 */

const ENGAGEMENT_LABELS = { full_time_faculty: 'Full-Time' }
const titleCase = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const formatSchoolYear = (value) => String(value || '').replace(/^\s*(AY|A\.Y\.|S\.?Y\.?)\s*/i, '')

const facultyStatus = (user = {}, portfolio = {}) => {
  const engagementKey = String(user.faculty_engagement || portfolio.faculty_engagement || '').toLowerCase()
  const status = titleCase(user.employment_status_label || portfolio.employment_status_label || user.employment_status || portfolio.employment_status || '')
  return [ENGAGEMENT_LABELS[engagementKey] || '', status].filter(Boolean).join(' - ')
}

const nameOf = (user = {}, portfolio = {}) => user.full_name || portfolio.personnel_name || portfolio.faculty_name || portfolio.full_name || ''

export const FACULTY_BOOKLET_FORMAT = Object.freeze({
  id: 'faculty_academic',
  documentTitle: 'FACULTY DEVELOPMENT PROGRAM',
  viewerTitle: 'Faculty Development Program Portfolio',
  areas: [
    { key: 'A', title: 'A. PROFESSIONAL DEVELOPMENT' },
    { key: 'B', title: 'B. PRODUCTIVITY AND CREATIVE WORK' },
    { key: 'C', title: 'C. SERVICE AND LEADERSHIP' }
  ],
  criteria: FACULTY_ACADEMIC_CRITERIA.map((criterion) => ({ ...criterion, kind: 'records' })),
  normalize: normalizeFacultyBookletItems,
  headerFields: (user, portfolio) => [
    ['Name', nameOf(user, portfolio)],
    ['Status', facultyStatus(user, portfolio)],
    ['School Year', formatSchoolYear(portfolio.academic_year)],
    ['Rank', user.current_rank_title || portfolio.current_rank_title || '']
  ]
})

const ntpLabel = (criterion) => `${criterion.code} ${criterion.title}`

export const NON_TEACHING_BOOKLET_FORMAT = Object.freeze({
  id: 'non_teaching',
  documentTitle: 'NON-TEACHING PERSONNEL PORTFOLIO',
  viewerTitle: 'Non-Teaching Personnel Portfolio',
  areas: NTP_AREAS.map(({ key, title }) => ({ key, title })),
  criteria: [
    { key: 'A', area: 'A', label: 'Performance and Personal Indicators', kind: 'hr_rating' },
    ...NTP_ENTRY_CRITERIA.filter((criterion) => criterion.group === 'B.1' || criterion.group === 'B.2')
      .map((criterion) => ({ key: criterion.code, area: 'B', label: ntpLabel(criterion), group: criterion.groupTitle, columns: criterion.columns, kind: 'records' })),
    { key: NTP_YEARS_OF_SERVICE.code, area: 'B', label: NTP_YEARS_OF_SERVICE.groupTitle, kind: 'service' },
    ...NTP_ENTRY_CRITERIA.filter((criterion) => criterion.group === 'B.4' || criterion.group === 'B.5')
      .map((criterion) => ({ key: criterion.code, area: 'B', label: ntpLabel(criterion), columns: criterion.columns, kind: 'records' })),
    { key: NTP_OTHER_KEY, area: 'B', label: 'Other accomplishments (previous categories)', columns: ['Date / Period', 'Accomplishment', 'Organizer / Details', 'Original category'], kind: 'records', hideWhenEmpty: true }
  ],
  normalize: normalizeNonTeachingBookletItems,
  headerFields: (user, portfolio) => [
    ['Name', nameOf(user, portfolio)],
    ['Specific Job', user.designation_title || user.position_title || user.designation || portfolio.designation || portfolio.position_title || ''],
    ['Office / Department', user.department_name || user.administrative_unit_name || user.personnel_affiliation?.administrative_unit_name || portfolio.administrative_unit_name || portfolio.department || portfolio.college || ''],
    ['School Year', formatSchoolYear(portfolio.academic_year)]
  ]
})

export function resolveBookletFormat(user = {}, portfolio = {}) {
  return isFacultyAcademicFormat(user, portfolio) ? FACULTY_BOOKLET_FORMAT : NON_TEACHING_BOOKLET_FORMAT
}
