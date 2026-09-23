const text = (name, label, min = 2, max = 255, extra = {}) => ({ name, label, type: 'text', min, max, ...extra })
const select = (name, label, options, extra = {}) => ({ name, label, type: 'select', options, ...extra })
const integer = (name, label) => ({ name, label, type: 'integer', min: 1 })
const subcategory = (code, label, dateMode, dateLabel, detailsLabel, fields, extra = {}) => ({ code, label, dateMode, dateLabel, detailsLabel, fields, evidenceRequired: true, ...extra })

export const FACULTY_ACADEMIC_AREAS = [
  { code: 'A', label: 'A. Professional Development' },
  { code: 'B', label: 'B. Productivity and Creative Work' },
  { code: 'C', label: 'C. Service and Leadership' }
]

const scope = select('scope', 'Level / Scope', ['In-House', 'City / Provincial', 'Regional', 'National', 'International'])

export const FACULTY_ACADEMIC_ENTRY_SCHEMA = [
  { code: 'A.1', area: 'A', label: 'Degrees & Advanced Units', subcategories: [
    subcategory('A1_PHD_HOLDER', 'Ph.D. Degree Holder', 'single', 'Date Conferred', 'Degree Details', [text('degree_title', 'Degree Title', 3), text('institution', 'Institution')]),
    subcategory('A1_PHD_UNITS', 'Ph.D. Units', 'range', 'Date / Period Completed', 'Advanced Units Details', [integer('units_completed', 'Units Completed'), text('program', 'Graduate Program', 3), text('institution', 'Institution / University')]),
    subcategory('A1_MA_HOLDER', 'MA Degree Holder', 'single', 'Date Conferred', 'Degree Details', [text('degree_title', 'Degree Title', 3), text('institution', 'Institution')]),
    subcategory('A1_MA_UNITS', 'MA Units', 'range', 'Date / Period Completed', 'Advanced Units Details', [integer('units_completed', 'Units Completed'), text('program', 'Graduate Program', 3), text('institution', 'Institution / University')])
  ] },
  { code: 'A.2', area: 'A', label: 'Active Membership to Professional Organizations', subcategories: [
    subcategory('A2_MEMBERSHIP', 'Professional Organization Membership', 'range_optional_end', 'Membership Period', 'Membership Details', [text('organization', 'Professional Organization'), select('membership_role', 'Membership Classification', ['Officer', 'Member']), text('position', 'Position / Office Held', 2, 255, { required: false, showWhen: { field: 'membership_role', equals: 'Officer' } })], { allowOngoing: true })
  ] },
  { code: 'A.3', area: 'A', label: 'Attendance to Seminar / Workshop / Training', subcategories: [subcategory('A3_ATTENDANCE', 'Seminar / Workshop / Training', 'range', 'Date / Training Period', 'Seminar / Training Details', [text('title', 'Seminar / Workshop / Training Title', 3), text('organizer', 'Organizer'), text('venue', 'Venue', 2, 255, { required: false }), scope])] },
  { code: 'B.1', area: 'B', label: 'Guest Lecturer / Consultant / Judge / Resource Person', subcategories: [subcategory('B1_ACTIVITY', 'Professional Engagement', 'range', 'Date / Activity Period', 'Activity Details', [text('activity_title', 'Activity / Engagement Title', 3), text('organizer', 'Sponsoring Organization'), select('role', 'Role', ['Guest Lecturer', 'Consultant', 'Judge', 'Resource Person']), select('extent', 'Extent / Duration', ['1 Hour', 'Half Day', '1 Day', '2 Days', 'More than 2 Days']), select('scope', 'Participant Level / Scope', ['Local', 'Regional', 'National', 'International']), integer('participants', 'Number of Participants')])] },
  { code: 'B.2', area: 'B', label: 'Publication', subcategories: [subcategory('B2_PUBLICATION', 'Publication', 'single', 'Publication Date', 'Publication Details', [text('publication_title', 'Publication Title', 3), select('publication_type', 'Publication Type', ['Review', 'Compilation', 'Article', 'Scholarly Paper', 'Monograph', 'Research Output', 'Book']), text('publisher_or_journal', 'Publisher / Journal / Publication Body'), select('scope', 'Scope / Location', ['Local', 'Regional', 'National', 'International'])])] },
  { code: 'B.3', area: 'B', label: 'Conduct of Research', subcategories: [subcategory('B3_RESEARCH', 'Research', 'range', 'Research Period', 'Research Details', [text('research_title', 'Research Title', 3), text('granting_body', 'Institution / Granting / Sponsoring Body'), text('research_role', 'Research Role / Status', 2, 255, { required: false }), text('research_classification', 'Research Classification / Scope', 2, 255, { required: false })])] },
  { code: 'B.4', area: 'B', label: 'Professional Recognition / Awards', subcategories: [subcategory('B4_AWARD', 'Professional Recognition / Award', 'single', 'Date Received / Nominated', 'Award Details', [text('award_title', 'Recognition / Award Title', 3), text('granting_body', 'Awarding Body'), select('recognition_status', 'Status', ['Nominee', 'Awardee']), select('scope', 'Level / Scope', ['Local', 'Regional', 'National', 'International'])])] },
  { code: 'B.5', area: 'B', label: 'Production of Instructional Materials', subcategories: [subcategory('B5_MATERIAL', 'Instructional Material', 'range', 'Date / Period', 'Instructional Material Details', [text('material_title', 'Instructional Material Title', 3), select('material_type', 'Material Type', ['Audio-Visual Aids', 'Modules', 'Printed / Bound', 'Other Bound Instructional Materials']), text('institution_program', 'Institution / Course / Program Used For', 2, 255, { required: false }), text('description', 'Description / Coverage', 2, 500, { required: false })])] },
  { code: 'B.6', area: 'B', label: 'Creative Work', subcategories: [subcategory('B6_CREATIVE_WORK', 'Creative Work', 'range', 'Date / Period', 'Creative Work Details', [text('creative_work', 'Creative Work Title', 3), text('creative_work_type', 'Creative Work Type'), text('presenting_body', 'Institution / Organization / Venue'), text('description', 'Description', 2, 500, { required: false })])] },
  { code: 'C.1.1', displayCode: 'C.1.a', area: 'C', label: 'Moderator / Officer', subcategories: [subcategory('C1_MODERATOR', 'Moderator / Officer', 'range_optional_end', 'Date / Period', 'Role / Activity Details', [text('organization', 'Club / Organization'), select('role', 'Role', ['Moderator', 'Officer'])], { allowOngoing: true })] },
  { code: 'C.1.2', displayCode: 'C.1.b', area: 'C', label: 'Coach / Trainer', subcategories: [subcategory('C1_COACH', 'Coach / Trainer', 'range_optional_end', 'Date / Period', 'Role / Activity Details', [text('activity', 'Activity', 3), select('role', 'Role', ['Coach', 'Trainer']), text('organizer', 'Conducted / Organized by')], { allowOngoing: true })] },
  { code: 'C.1.3', displayCode: 'C.1.c', area: 'C', label: 'Membership in Working Committees', subcategories: [subcategory('C1_COMMITTEE', 'Working Committee', 'range', 'Committee Period', 'Committee Details', [text('activity', 'Committee Name', 3), text('role', 'Role / Capacity'), text('organizer', 'Organizing Unit'), text('purpose', 'Activity / Purpose', 2, 500, { required: false })])] },
  { code: 'C.1.4', displayCode: 'C.1.d', area: 'C', label: 'Rendered Service in School Activities', subcategories: [subcategory('C1_SERVICE', 'School Activity Service', 'range', 'Date / Service Period', 'Service Details', [text('activity', 'School Activity', 3), text('role', 'Role / Contribution'), text('organizer', 'Organizing Unit')])] },
  { code: 'C.2.1', displayCode: 'C.2.a', area: 'C', label: 'Church Activities', subcategories: [subcategory('C2_CHURCH', 'Church Activity', 'range', 'Date / Period', 'Community Involvement Details', [text('activity', 'Church Activity', 3), text('organizer', 'Church / Organization'), text('role', 'Role / Contribution')])] },
  { code: 'C.2.2', displayCode: 'C.2.b', area: 'C', label: 'Community / Civic Activities', subcategories: [subcategory('C2_CIVIC', 'Community / Civic Activity', 'range', 'Date / Period', 'Community Involvement Details', [text('activity', 'Community / Civic Activity', 3), text('organizer', 'Community / Organization'), text('role', 'Role / Contribution')])] },
  { code: 'C.2.3', displayCode: 'C.2.c', area: 'C', label: 'Charity / Community Projects', subcategories: [subcategory('C2_CHARITY', 'Charity / Community Project', 'range', 'Date / Period', 'Community Involvement Details', [text('activity', 'Project / Charity Activity', 3), text('organizer', 'Community / Organization'), text('support_type', 'Type of Support / Contribution')])] },
  { code: 'C.3', area: 'C', label: 'Years of Service at NDMU', derived: true, subcategories: [] }
]

export const facultySchemaByCode = (code) => FACULTY_ACADEMIC_ENTRY_SCHEMA.find((item) => item.code === code)
export const facultySubcategoryByCode = (code) => FACULTY_ACADEMIC_ENTRY_SCHEMA.flatMap((item) => item.subcategories.map((sub) => ({ ...sub, categoryCode: item.code, area: item.area, categoryLabel: item.label }))).find((item) => item.code === code)

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
