const text = (name, label, min = 2, max = 255, extra = {}) => ({ name, label, type: 'text', min, max, ...extra })
const select = (name, label, options, extra = {}) => ({ name, label, type: 'select', options, ...extra })
const integer = (name, label) => ({ name, label, type: 'integer', min: 1 })
const subcategory = (code, label, dateMode, dateLabel, detailsLabel, fields, extra = {}) => ({ code, label, dateMode, dateLabel, detailsLabel, fields, evidenceRequired: true, ...extra })

export const FACULTY_ACADEMIC_AREAS = [
  { code: 'A', label: 'A. Professional Development' },
  { code: 'B', label: 'B. Productivity and Creative Work' },
  { code: 'C', label: 'C. Service and Leadership' }
]

// OCR → form mapping, configurable per subcategory. Keys are form field names
// (`date`/`startDate` for the date inputs); values are OcrScanController field keys.
const DEGREE_HOLDER_OCR_MAP = Object.freeze({ degree_title: 'title', institution: 'issuer', date: 'date', academic_period: 'academicPeriod' })
const DEGREE_UNITS_OCR_MAP = Object.freeze({ program: 'title', institution: 'issuer', units_completed: 'unitsCompleted', startDate: 'date' })
// Graduate units are recorded one semester per record; the units of eligible records are summed for scoring.
const graduateUnitPeriodFields = [select('semester', 'Semester', ['First Semester', 'Second Semester', 'Summer']), text('academic_year', 'Academic Year', 9, 9, { placeholder: 'e.g., 2025-2026', academicYear: true })]
const grantFields = () => [text('granted_by', 'Granted by', 2, 255, { required: false }), text('name_signature', 'Name / Signature', 2, 255, { required: false })]
const degreeHolderFields = [text('degree_title', 'Course / Degree', 3), text('institution', 'School / University'), text('academic_period', 'Academic Period', 4, 60, { required: false, placeholder: 'e.g., 2022–2025' })]

export const DEGREE_LEVEL_LABELS = Object.freeze({ phd: 'Ph.D.', masters: "Master's" })

const scope = select('scope', 'Level / Scope', ['In-House', 'City / Provincial', 'Regional', 'National', 'International'])

export const FACULTY_ACADEMIC_ENTRY_SCHEMA = [
  { code: 'A.1', area: 'A', label: 'Degrees & Advanced Units', subcategories: [
    subcategory('A1_PHD_HOLDER', 'Ph.D. Degree Holder', 'single', 'Date(s)', 'Education', degreeHolderFields, { degreeLevel: 'phd', ocrMap: DEGREE_HOLDER_OCR_MAP }),
    subcategory('A1_PHD_UNITS', 'Ph.D. Units', 'range', 'Date(s)', 'Education', [integer('units_completed', 'Units Completed'), text('program', 'Course / Degree', 3), text('institution', 'School / University'), ...graduateUnitPeriodFields], { degreeLevel: 'phd', ocrMap: DEGREE_UNITS_OCR_MAP }),
    subcategory('A1_MA_HOLDER', 'MA Degree Holder', 'single', 'Date(s)', 'Education', degreeHolderFields, { degreeLevel: 'masters', ocrMap: DEGREE_HOLDER_OCR_MAP }),
    subcategory('A1_MA_UNITS', 'MA Units', 'range', 'Date(s)', 'Education', [integer('units_completed', 'Units Completed'), text('program', 'Course / Degree', 3), text('institution', 'School / University'), ...graduateUnitPeriodFields], { degreeLevel: 'masters', ocrMap: DEGREE_UNITS_OCR_MAP })
  ] },
  { code: 'A.2', area: 'A', label: 'Active Membership to Professional Organizations', subcategories: [
    subcategory('A2_MEMBERSHIP', 'Professional Organization Membership', 'range_optional_end', 'Date(s)', 'Professional Organization Membership', [text('organization', 'Organization'), text('organizer', 'Conducted or Organized by'), select('membership_role', 'Membership Classification', ['Officer', 'Member']), text('position', 'Position / Office Held', 2, 255, { required: false, showWhen: { field: 'membership_role', equals: 'Officer' } })], { allowOngoing: true })
  ] },
  { code: 'A.3', area: 'A', label: 'Attendance to Seminar / Workshop / Training', subcategories: [subcategory('A3_ATTENDANCE', 'Seminar / Workshop / Training', 'range', 'Date(s)', 'Seminar / Workshop / Training', [text('title', 'Title', 3), text('organizer', 'Conducted or Organized by'), text('venue', 'Venue', 2, 255, { required: false }), scope])] },
  { code: 'B.1', area: 'B', label: 'Guest Lecturer / Consultant / Judge / Resource Person', subcategories: [subcategory('B1_ACTIVITY', 'Professional Engagement', 'range', 'Date(s)', 'Guest Lecturer / Consultant / Judge / Resource Person', [text('activity_title', 'Activity', 3), text('organizer', 'Conducted or Organized by'), select('role', 'Role', ['Guest Lecturer', 'Consultant', 'Judge', 'Resource Person']), select('extent', 'Extent / Duration', ['1 Hour', 'Half Day', '1 Day', '2 Days', 'More than 2 Days']), select('scope', 'Participant Level / Scope', ['Local', 'Regional', 'National', 'International'])])] },
  { code: 'B.2', area: 'B', label: 'Publication', subcategories: [subcategory('B2_PUBLICATION', 'Publication', 'single', 'Date(s)', 'Publication', [text('publication_title', 'Publications', 3), text('granted_by', 'Granted by', 2, 255, { required: false }), text('name_signature', 'Name / Signature', 2, 255, { required: false }), select('publication_type', 'Publication Type', ['Review', 'Compilation', 'Article', 'Scholarly Paper', 'Monograph', 'Research Output', 'Book']), text('publisher_or_journal', 'Publisher / Journal', 2, 255, { required: false }), select('scope', 'Scope / Location', ['Local', 'Regional', 'National', 'International'])])] },
  { code: 'B.3', area: 'B', label: 'Conduct of Research', subcategories: [subcategory('B3_RESEARCH', 'Research', 'range', 'Date(s)', 'Conduct of Research', [text('research_title', 'Research', 3), ...grantFields(), text('granting_body', 'Institution / Granting / Sponsoring Body', 2, 255, { required: false }), text('research_role', 'Research Role / Status', 2, 255, { required: false }), text('research_classification', 'Research Classification / Scope', 2, 255, { required: false })], { allowSingleDay: true })] },
  { code: 'B.4', area: 'B', label: 'Professional Recognition / Awards', subcategories: [subcategory('B4_AWARD', 'Professional Recognition / Award', 'single', 'Date(s)', 'Recognition / Awards', [text('award_title', 'Recognition / Awards', 3), ...grantFields(), text('granting_body', 'Awarding Body', 2, 255, { required: false }), select('recognition_status', 'Status', ['Nominee', 'Awardee']), select('scope', 'Level / Scope', ['Local', 'Regional', 'National', 'International'])])] },
  { code: 'B.5', area: 'B', label: 'Production of Instructional Materials', subcategories: [subcategory('B5_MATERIAL', 'Instructional Material', 'range', 'Date(s)', 'Production of Instructional Materials', [text('material_title', 'Materials', 3), ...grantFields(), select('material_type', 'Material Type', ['Audio-Visual Aids', 'Modules', 'Printed / Bound', 'Other Bound Instructional Materials']), text('institution_program', 'Institution / Course / Program Used For', 2, 255, { required: false }), text('description', 'Description / Coverage', 2, 500, { required: false })], { allowSingleDay: true })] },
  { code: 'B.6', area: 'B', label: 'Creative Work', subcategories: [subcategory('B6_CREATIVE_WORK', 'Creative Work', 'range', 'Date(s)', 'Creative Work', [text('creative_work', 'Creative Work', 3), ...grantFields(), text('creative_work_type', 'Creative Work Type'), text('presenting_body', 'Institution / Organization / Venue'), text('description', 'Description', 2, 500, { required: false })])] },
  { code: 'C.1.1', displayCode: 'C.1.a', area: 'C', label: 'Moderator / Officer', subcategories: [subcategory('C1_MODERATOR', 'Moderator / Officer', 'range_optional_end', 'Date(s)', 'School Involvement', [text('organization', 'Organization / Role'), select('role', 'Role', ['Moderator', 'Officer']), text('organizer', 'School Organization')], { allowOngoing: true })] },
  { code: 'C.1.2', displayCode: 'C.1.b', area: 'C', label: 'Coach / Trainer', subcategories: [subcategory('C1_COACH', 'Coach / Trainer', 'range_optional_end', 'Date(s)', 'School Involvement', [text('activity', 'Activity / Team', 3), select('role', 'Role', ['Coach', 'Trainer']), text('organizer', 'School / Institution')], { allowOngoing: true })] },
  { code: 'C.1.3', displayCode: 'C.1.c', area: 'C', label: 'Membership in Working Committees', subcategories: [subcategory('C1_COMMITTEE', 'Working Committee', 'range', 'Date(s)', 'School Involvement', [text('activity', 'Committee / Assignment', 3), text('role', 'Role / Capacity'), text('organizer', 'School / Institution'), text('purpose', 'Activity / Purpose', 2, 500, { required: false })])] },
  { code: 'C.1.4', displayCode: 'C.1.d', area: 'C', label: 'Rendered Service in School Activities', subcategories: [subcategory('C1_SERVICE', 'School Activity Service', 'range', 'Date(s)', 'School Involvement', [text('activity', 'Service / Activity', 3), text('role', 'Role / Contribution'), text('organizer', 'School / Institution')])] },
  { code: 'C.2.1', displayCode: 'C.2.a', area: 'C', label: 'Church Activities', subcategories: [subcategory('C2_CHURCH', 'Church Activity', 'range', 'Date(s)', 'Community Involvement', [text('activity', 'Activity / Service', 3), text('organizer', 'Church / Organization'), text('role', 'Role / Contribution')])] },
  { code: 'C.2.2', displayCode: 'C.2.b', area: 'C', label: 'Community / Civic Activities', subcategories: [subcategory('C2_CIVIC', 'Community / Civic Activity', 'range', 'Date(s)', 'Community Involvement', [text('activity', 'Activity / Service', 3), text('organizer', 'Community / Organization'), text('role', 'Role / Contribution')])] },
  { code: 'C.2.3', displayCode: 'C.2.c', area: 'C', label: 'Charity / Community Projects', subcategories: [subcategory('C2_CHARITY', 'Charity / Community Project', 'range', 'Date(s)', 'Community Involvement', [text('activity', 'Project / Support', 3), text('organizer', 'Beneficiary / Organization'), text('support_type', 'Type of Support / Contribution')])] },
  { code: 'C.3', area: 'C', label: 'Years of Service at NDMU', derived: true, subcategories: [] }
]

export const facultySchemaByCode = (code) => FACULTY_ACADEMIC_ENTRY_SCHEMA.find((item) => item.code === code)
export const facultySubcategoryByCode = (code) => FACULTY_ACADEMIC_ENTRY_SCHEMA.flatMap((item) => item.subcategories.map((sub) => ({ ...sub, categoryCode: item.code, area: item.area, categoryLabel: item.label }))).find((item) => item.code === code)

/** Resolve published numeric HR leaf codes to the matching official portfolio row schema. */
export function facultySubcategoryForHrCriterion(categoryCode, criterionCode, criterionName = '') {
  const direct = facultySubcategoryByCode(criterionCode)
  if (direct) return direct
  const category = String(categoryCode || '').trim().toUpperCase()
  const code = String(criterionCode || '').trim().toUpperCase().replaceAll('_', '.')
  const numericAliases = {
    'A.1.1': 'A1_PHD_HOLDER', 'A.1.2': 'A1_PHD_UNITS', 'A.1.3': 'A1_MA_HOLDER', 'A.1.4': 'A1_MA_UNITS',
    'A.2.1': 'A2_MEMBERSHIP', 'A.2.2': 'A2_MEMBERSHIP', 'A.3.1': 'A3_ATTENDANCE',
    'B.1.1': 'B1_ACTIVITY', 'B.2.1': 'B2_PUBLICATION', 'B.3.1': 'B3_RESEARCH',
    'B.4.1': 'B4_AWARD', 'B.5.1': 'B5_MATERIAL', 'B.6.1': 'B6_CREATIVE_WORK',
    'C.1.1': 'C1_MODERATOR', 'C.1.2': 'C1_COACH', 'C.1.3': 'C1_COMMITTEE', 'C.1.4': 'C1_SERVICE',
    'C.1.A': 'C1_MODERATOR', 'C.1.B': 'C1_COACH', 'C.1.C': 'C1_COMMITTEE', 'C.1.D': 'C1_SERVICE',
    'C.2.1': 'C2_CHURCH', 'C.2.2': 'C2_CIVIC', 'C.2.3': 'C2_CHARITY',
    'C.2.A': 'C2_CHURCH', 'C.2.B': 'C2_CIVIC', 'C.2.C': 'C2_CHARITY'
  }
  const alias = numericAliases[code]
  if (alias) return facultySubcategoryByCode(alias)
  const name = String(criterionName || '').toLowerCase()
  const fallbackByCategory = {
    'A.1': /ph\.?\s*d|doctor/i.test(name) ? (/unit/i.test(name) ? 'A1_PHD_UNITS' : 'A1_PHD_HOLDER') : /ma|master/i.test(name) ? (/unit/i.test(name) ? 'A1_MA_UNITS' : 'A1_MA_HOLDER') : '',
    'A.2': 'A2_MEMBERSHIP', 'A.3': 'A3_ATTENDANCE', 'B.1': 'B1_ACTIVITY', 'B.2': 'B2_PUBLICATION',
    'B.3': 'B3_RESEARCH', 'B.4': 'B4_AWARD', 'B.5': 'B5_MATERIAL', 'B.6': 'B6_CREATIVE_WORK',
    'C.1.1': 'C1_MODERATOR', 'C.1.2': 'C1_COACH', 'C.1.3': 'C1_COMMITTEE', 'C.1.4': 'C1_SERVICE',
    'C.2.1': 'C2_CHURCH', 'C.2.2': 'C2_CIVIC', 'C.2.3': 'C2_CHARITY'
  }
  return facultySubcategoryByCode(fallbackByCategory[category] || '')
}

// Taxonomy tree for tests & navigation
export const FACULTY_ACADEMIC_CATEGORIES = [
  {
    code: 'A',
    name: 'A. PROFESSIONAL DEVELOPMENT',
    subcategories: [
      { key: 'A.1', label: 'Degrees & Advanced Units' },
      { key: 'A.2', label: 'Active Membership to Professional Organizations' },
      { key: 'A.3', label: 'Attendance to Seminar-Workshop/Trainings' }
    ]
  },
  {
    code: 'B',
    name: 'B. PRODUCTIVITY AND CREATIVE WORK',
    subcategories: [
      { key: 'B.1', label: 'Guest Lecturer / Consultant / Judge / Resource Person' },
      { key: 'B.2', label: 'Publication' },
      { key: 'B.3', label: 'Conduct of Research' },
      { key: 'B.4', label: 'Professional Recognition / Awards' },
      { key: 'B.5', label: 'Production of Instructional Materials' },
      { key: 'B.6', label: 'Creative Work' }
    ]
  },
  {
    code: 'C',
    name: 'C. SERVICE AND LEADERSHIP',
    subcategories: [
      { key: 'C.1.a', label: 'Moderator of Clubs / Organizations' },
      { key: 'C.1.b', label: 'Coach / Trainer' },
      { key: 'C.1.c', label: 'Membership in Working Committees' },
      { key: 'C.1.d', label: 'Rendered Service in School Activities' },
      { key: 'C.2.a', label: 'Church Activities' },
      { key: 'C.2.b', label: 'Community / Civic Activities' },
      { key: 'C.2.c', label: 'Charity / Community Projects' },
      { key: 'C.3', label: 'Years of Service at NDMU' }
    ]
  }
]

export function getFacultyAcademicAccomplishmentSchema(code = '') {
  const norm = String(code || '').trim()
  if (norm === 'A.1' || norm.startsWith('A1_')) {
    return {
      subcategoryKey: 'A.1',
      primaryField: { key: 'course_or_degree', label: 'Course / Degree' },
      organizationField: { key: 'school_or_university', label: 'School / University' }
    }
  }
  if (norm === 'A.2' || norm.startsWith('A2_')) {
    return {
      subcategoryKey: 'A.2',
      primaryField: { key: 'organization', label: 'Organization' },
      organizationField: { key: 'conducted_or_organized_by', label: 'Conducted or Organized by' }
    }
  }
  if (norm === 'A.3' || norm.startsWith('A3_')) {
    return {
      subcategoryKey: 'A.3',
      primaryField: { key: 'activity_title', label: 'Title' },
      organizationField: { key: 'conducted_or_organized_by', label: 'Conducted or Organized by' }
    }
  }
  if (norm === 'B.1' || norm.startsWith('B1_')) {
    return {
      subcategoryKey: 'B.1',
      primaryField: { key: 'activity', label: 'Activity' },
      organizationField: { key: 'conducted_or_organized_by', label: 'Conducted or Organized by' }
    }
  }
  if (norm === 'B.2' || norm.startsWith('B2_')) {
    return {
      subcategoryKey: 'B.2',
      primaryField: { key: 'publication', label: 'Publication' },
      organizationField: { key: 'granted_by', label: 'Granted by' }
    }
  }
  if (norm === 'B.3' || norm.startsWith('B3_')) {
    return {
      subcategoryKey: 'B.3',
      primaryField: { key: 'research', label: 'Research' },
      organizationField: { key: 'granted_by', label: 'Granted by' }
    }
  }
  if (norm === 'B.4' || norm.startsWith('B4_')) {
    return {
      subcategoryKey: 'B.4',
      primaryField: { key: 'recognition_or_award', label: 'Recognition / Award' },
      organizationField: { key: 'granted_by', label: 'Granted by' }
    }
  }
  if (norm === 'B.5' || norm.startsWith('B5_')) {
    return {
      subcategoryKey: 'B.5',
      primaryField: { key: 'material', label: 'Material' },
      organizationField: { key: 'granted_by', label: 'Granted by' }
    }
  }
  if (norm === 'B.6' || norm.startsWith('B6_')) {
    return {
      subcategoryKey: 'B.6',
      primaryField: { key: 'creative_work', label: 'Creative Work' },
      organizationField: { key: 'granted_by', label: 'Granted by' }
    }
  }
  if (norm === 'C.1.a' || norm === 'C.1.1' || norm.startsWith('C1_MODERATOR')) {
    return {
      subcategoryKey: 'C.1.a',
      primaryField: { key: 'club_or_organization', label: 'Club / Organization' },
      organizationField: { key: 'conducted_or_organized_by', label: 'Conducted or Organized by' }
    }
  }
  if (norm.startsWith('C.1') || norm.startsWith('C1_')) {
    return {
      subcategoryKey: norm,
      primaryField: { key: 'activity', label: 'Activity' },
      organizationField: { key: 'conducted_or_organized_by', label: 'Conducted or Organized by' }
    }
  }
  if (norm.startsWith('C.2') || norm.startsWith('C2_')) {
    return {
      subcategoryKey: norm,
      primaryField: { key: 'activity', label: 'Activity' },
      organizationField: { key: 'conducted_or_organized_by', label: 'Conducted or Organized by' }
    }
  }
  if (norm === 'C.3') {
    return {
      subcategoryKey: 'C.3',
      primaryField: { key: 'years_or_service_detail', label: 'Inclusive Dates / Service Detail' },
      organizationField: { key: 'institution', label: 'Institution' }
    }
  }
  return {
    subcategoryKey: norm,
    primaryField: { key: 'title', label: 'Title / Description' },
    organizationField: { key: 'institution', label: 'Institution / Organizer' }
  }
}

export function formatFacultyAccomplishmentTitle(metadata = {}, subcategoryCode = '') {
  return metadata.course_or_degree ||
    metadata.degree_title ||
    metadata.program ||
    metadata.activity_title ||
    metadata.publication ||
    metadata.publication_title ||
    metadata.research ||
    metadata.research_title ||
    metadata.recognition_or_award ||
    metadata.award_title ||
    metadata.material ||
    metadata.material_title ||
    metadata.creative_work ||
    metadata.club_or_organization ||
    metadata.organization ||
    metadata.activity ||
    metadata.title ||
    ''
}

export function formatFacultyAccomplishmentInstitution(metadata = {}, subcategoryCode = '') {
  return metadata.school_or_university ||
    metadata.institution ||
    metadata.organization ||
    metadata.publisher_or_journal ||
    metadata.granting_body ||
    metadata.granted_by ||
    metadata.approving_body ||
    metadata.presenting_body ||
    metadata.institution_program ||
    metadata.conducted_or_organized_by ||
    metadata.organizer ||
    ''
}

/** Single display label for a criterion, used by the dropdown and by OCR suggestions alike. */
export const facultyCategoryDisplayLabel = (code) => {
  const item = facultySchemaByCode(code)
  return item ? `${item.displayCode || item.code} — ${item.label}` : ''
}
