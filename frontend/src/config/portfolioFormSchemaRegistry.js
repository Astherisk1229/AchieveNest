/**
 * portfolioFormSchemaRegistry.js
 * Authoritative Canonical Schema Registry for Student Achievement / Portfolio Entry.
 * Exhaustively defines Category-Specific Structured Fields for all 9 Categories and 57 Subcategories.
 * 
 * Invariants:
 * 1. Exactly 9 primary category families.
 * 2. Exactly 57 verified subcategory schemas.
 * 3. 0 Student award selectors, 0 scoring fields, 0 rubric weights.
 * 4. Placement/Result is structured metadata, never a category.
 * 5. Leadership/Sports/Socio-Cultural Development are strictly under Seminar / Training.
 */

export const CONTROLLED_VOCABULARIES = {
  event_level: [
    { value: 'institutional', label: 'Institutional / Campus-Wide' },
    { value: 'local', label: 'Local / City / Municipal' },
    { value: 'regional', label: 'Regional (Region XII)' },
    { value: 'national', label: 'National Level' },
    { value: 'international', label: 'International Level' }
  ],
  placement: [
    { value: 'champion', label: 'Champion / 1st Place' },
    { value: 'first_runner_up', label: '1st Runner-Up / 2nd Place' },
    { value: 'second_runner_up', label: '2nd Runner-Up / 3rd Place' },
    { value: 'finalist', label: 'Finalist / Qualifier' },
    { value: 'participant', label: 'Participant / Special Award' }
  ],
  publication_status: [
    { value: 'published', label: 'Published / Circulated' },
    { value: 'draft', label: 'Draft / Unpublished / In-Progress' }
  ],
  publication_type: [
    { value: 'news', label: 'News Item / Report' },
    { value: 'literary', label: 'Literary Piece (Poetry / Essay / Story)' },
    { value: 'column', label: 'Column / Opinion Article' },
    { value: 'editorial', label: 'Editorial Article' },
    { value: 'feature', label: 'Feature Article' }
  ],
  position_level: [
    { value: 'executive', label: 'Executive Officer (President / VP / Governor)' },
    { value: 'officer', label: 'Standard Officer (Secretary / Treasurer / Auditor)' },
    { value: 'committee_head', label: 'Committee Chairperson / Head' },
    { value: 'year_representative', label: 'Year-Level Representative' }
  ],
  membership_type: [
    { value: 'charter_member', label: 'Charter / Founding Member' },
    { value: 'regular_member', label: 'Regular Active Member' },
    { value: 'honorary_member', label: 'Honorary Member' }
  ],
  contribution_level: [
    { value: 'lead_organizer', label: 'Lead Project Organizer / Chairperson' },
    { value: 'committee_member', label: 'Active Committee Member / Facilitator' },
    { value: 'general_contributor', label: 'General Contributor / Member' }
  ],
  service_type: [
    { value: 'direct_outreach', label: 'Direct Community Outreach / Relief' },
    { value: 'advocacy', label: 'Social Advocacy / Awareness Campaign' },
    { value: 'environmental', label: 'Environmental / Tree Planting / Clean-up' },
    { value: 'educational', label: 'Educational / Literacy Extension' }
  ],
  ministry_context: [
    { value: 'campus_ministry', label: 'NDMU Campus Ministry' },
    { value: 'parish_ministry', label: 'Parish / Diocesan Ministry' },
    { value: 'church_organization', label: 'Religious / Church Youth Organization' }
  ],
  training_type: [
    { value: 'leadership_dev', label: 'Leadership Development' },
    { value: 'sports_dev', label: 'Sports Development / Clinic' },
    { value: 'socio_cultural_dev', label: 'Socio-Cultural / Performing Arts Workshop' },
    { value: 'journalism_dev', label: 'Campus Journalism Training' },
    { value: 'professional_dev', label: 'Personal / Professional Development' },
    { value: 'spiritual_dev', label: 'Spiritual / Faith Formation' },
    { value: 'community_dev', label: 'Community Service / Volunteer Training' },
    { value: 'other_dev', label: 'Other Special Training' }
  ],
  competition_type: [
    { value: 'tournament', label: 'Official Inter-School / Inter-Collegiate Tournament' },
    { value: 'league', label: 'Varsity League / Meet' },
    { value: 'meet', label: 'Athletic Meet / Sportsfest' },
    { value: 'invitational', label: 'Invitational / Friendly Exhibition' }
  ],
  individual_team: [
    { value: 'individual', label: 'Individual Competitor' },
    { value: 'team', label: 'Team / Group Squad' }
  ],
  individual_group: [
    { value: 'individual', label: 'Solo / Individual Performer' },
    { value: 'group', label: 'Ensemble / Troupe / Group' }
  ],
  performance_type: [
    { value: 'solo_performance', label: 'Solo Feature Performance' },
    { value: 'ensemble_lead', label: 'Ensemble Lead / Principal' },
    { value: 'ensemble_member', label: 'Ensemble Member / Cast' },
    { value: 'exhibition', label: 'Cultural Showcase / Exhibition' }
  ],
  authorship_role: [
    { value: 'lead_author', label: 'Lead Author / Byline Writer' },
    { value: 'co_author', label: 'Co-Author / Contributing Writer' },
    { value: 'editor', label: 'Section Editor / Chief Editor' },
    { value: 'illustrator_photographer', label: 'Photojournalist / Cartoonist / Illustrator' }
  ],
  academic_year: [
    { value: '2025-2026', label: 'AY 2025-2026' },
    { value: '2024-2025', label: 'AY 2024-2025' },
    { value: '2023-2024', label: 'AY 2023-2024' }
  ],
  semester: [
    { value: '1st_semester', label: '1st Semester' },
    { value: '2nd_semester', label: '2nd Semester' },
    { value: 'summer', label: 'Summer Term' }
  ]
}

/**
 * Standard Academic Term Fields common to all Category Schemas
 */
const ACADEMIC_TERM_FIELDS = [
  {
    key: 'academic_year',
    label: 'Academic Year',
    type: 'select',
    required: true,
    defaultValue: '2025-2026',
    options: CONTROLLED_VOCABULARIES.academic_year,
    helpText: 'Select the academic year in which this accomplishment occurred.'
  },
  {
    key: 'semester',
    label: 'Term / Semester',
    type: 'select',
    required: true,
    defaultValue: '1st_semester',
    options: CONTROLLED_VOCABULARIES.semester,
    helpText: 'Select the academic semester.'
  }
]

/**
 * 57 Subcategory Schemas keyed by subcategory_id / subcategory code
 */
export const SUB_CATEGORY_SCHEMAS = {
  // ================= 1. LEADERSHIP POSITION (4 subcategories) =================
  '40000001-0001-0000-0000-000000000001': {
    schema_id: 'SCHEMA_LEAD_SSG',
    category_id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
    category_name: 'Leadership Position',
    subcategory_name: 'SSG / University Student Government',
    fields: [
      {
        key: 'organization_name',
        label: 'Governing Body Name',
        type: 'text',
        required: true,
        defaultValue: 'Supreme Student Government (SSG)',
        helpText: 'Official name of the student government organization.'
      },
      {
        key: 'position_level',
        label: 'Leadership Officer Tier',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.position_level,
        helpText: 'Select the leadership tier corresponding to your elected or appointed office.'
      },
      {
        key: 'position_title',
        label: 'Official Position Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. SSG President / Senator / Committee Chairperson',
        helpText: 'Enter your specific official title.'
      },
      {
        key: 'tenure_start',
        label: 'Term Start Date',
        type: 'date',
        required: false,
        helpText: 'Official assumption of office date.'
      },
      {
        key: 'tenure_end',
        label: 'Term End Date',
        type: 'date',
        required: false,
        helpText: 'Official term conclusion date.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000001-0001-0000-0000-000000000002': {
    schema_id: 'SCHEMA_LEAD_COLLEGE',
    category_id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
    category_name: 'Leadership Position',
    subcategory_name: 'Collegiate / College Council',
    fields: [
      {
        key: 'organization_name',
        label: 'College Council Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. CEAC College Executive Council',
        helpText: 'Official name of the collegiate student council.'
      },
      {
        key: 'position_level',
        label: 'Leadership Officer Tier',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.position_level,
        helpText: 'Select your leadership rank.'
      },
      {
        key: 'position_title',
        label: 'Position Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. Council Governor / Vice Governor',
        helpText: 'Specific elected or appointed position.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000001-0001-0000-0000-000000000003': {
    schema_id: 'SCHEMA_LEAD_CLUB',
    category_id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
    category_name: 'Leadership Position',
    subcategory_name: 'Club / Organization',
    fields: [
      {
        key: 'organization_name',
        label: 'Club / Organization Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Junior Philippine Computer Society (JPCS)',
        helpText: 'Official registered club name.'
      },
      {
        key: 'position_level',
        label: 'Leadership Officer Tier',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.position_level,
        helpText: 'Select your officer tier.'
      },
      {
        key: 'position_title',
        label: 'Position Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. Club President / Vice President for Internal Affairs',
        helpText: 'Specific title within the organization.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000001-0001-0000-0000-000000000004': {
    schema_id: 'SCHEMA_LEAD_YEAR',
    category_id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646',
    category_name: 'Leadership Position',
    subcategory_name: 'Year-Level Leadership',
    fields: [
      {
        key: 'organization_name',
        label: 'Class / Program Cohort',
        type: 'text',
        required: true,
        placeholder: 'e.g. BSIT 3rd Year Cohort / Class Council',
        helpText: 'Program cohort or section.'
      },
      {
        key: 'position_level',
        label: 'Leadership Tier',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.position_level,
        helpText: 'Select rank.'
      },
      {
        key: 'position_title',
        label: 'Position Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. Class Mayor / Year-Level Representative',
        helpText: 'Official representation role.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },

  // ================= 2. ORGANIZATION MEMBERSHIP / PARTICIPATION (5 subcategories) =================
  '40000002-0001-0000-0000-000000000001': {
    schema_id: 'SCHEMA_ORG_MEMBER',
    category_id: 'c9a6d837-78f4-4516-b2db-d438ae717be5',
    category_name: 'Organization Membership / Participation',
    subcategory_name: 'General Member',
    fields: [
      {
        key: 'organization_name',
        label: 'Organization Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Red Cross Youth NDMU Chapter',
        helpText: 'Name of the accredited student organization.'
      },
      {
        key: 'membership_type',
        label: 'Membership Classification',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.membership_type,
        helpText: 'Type of registered membership.'
      },
      {
        key: 'contribution_level',
        label: 'Level of Contribution',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.contribution_level,
        helpText: 'Active participation level during the academic year.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000002-0001-0000-0000-000000000002': {
    schema_id: 'SCHEMA_ORG_COMMITTEE',
    category_id: 'c9a6d837-78f4-4516-b2db-d438ae717be5',
    category_name: 'Organization Membership / Participation',
    subcategory_name: 'Committee Member',
    fields: [
      {
        key: 'organization_name',
        label: 'Organization Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. NDMU Rotaract Club',
        helpText: 'Accredited student organization.'
      },
      {
        key: 'committee_name',
        label: 'Assigned Committee',
        type: 'text',
        required: true,
        placeholder: 'e.g. Logistics & Physical Arrangements Committee',
        helpText: 'Specific committee or working group.'
      },
      {
        key: 'contribution_level',
        label: 'Contribution Scope',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.contribution_level,
        helpText: 'Extent of active support rendered.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000002-0001-0000-0000-000000000003': {
    schema_id: 'SCHEMA_ORG_PARTICIPANT',
    category_id: 'c9a6d837-78f4-4516-b2db-d438ae717be5',
    category_name: 'Organization Membership / Participation',
    subcategory_name: 'Activity Participant',
    fields: [
      {
        key: 'organization_name',
        label: 'Host Organization',
        type: 'text',
        required: true,
        placeholder: 'e.g. Marist Youth Movement',
        helpText: 'Hosting body.'
      },
      {
        key: 'activity_name',
        label: 'Activity / Initiative Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. Annual Student Leadership Encounter',
        helpText: 'Official activity name.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000002-0001-0000-0000-000000000004': {
    schema_id: 'SCHEMA_ORG_FACILITATOR',
    category_id: 'c9a6d837-78f4-4516-b2db-d438ae717be5',
    category_name: 'Organization Membership / Participation',
    subcategory_name: 'Facilitator / Organizer',
    fields: [
      {
        key: 'organization_name',
        label: 'Organization / Working Committee',
        type: 'text',
        required: true,
        placeholder: 'e.g. NDMU Knights of the Altar',
        helpText: 'Organizing committee.'
      },
      {
        key: 'facilitation_role',
        label: 'Facilitation Responsibility',
        type: 'text',
        required: true,
        placeholder: 'e.g. Small Group Discussion Facilitator / Master of Ceremonies',
        helpText: 'Specific role assigned.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000002-0001-0000-0000-000000000005': {
    schema_id: 'SCHEMA_ORG_CONTRIBUTOR',
    category_id: 'c9a6d837-78f4-4516-b2db-d438ae717be5',
    category_name: 'Organization Membership / Participation',
    subcategory_name: 'Project Contributor',
    fields: [
      {
        key: 'organization_name',
        label: 'Organization Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Society of Computer Science Students',
        helpText: 'Organization name.'
      },
      {
        key: 'project_name',
        label: 'Project / Initiative Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Campus Wi-Fi Analytics Outreach',
        helpText: 'Name of the collaborative initiative.'
      },
      {
        key: 'contribution_level',
        label: 'Contribution Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.contribution_level,
        helpText: 'Level of participation.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },

  // ================= 3. COMMUNITY SERVICE / VOLUNTEERISM (5 subcategories) =================
  '40000003-0001-0000-0000-000000000001': {
    schema_id: 'SCHEMA_COMM_UNIV',
    category_id: 'ace24637-66f7-4329-9451-ccc61e18eab9',
    category_name: 'Community Service / Volunteerism',
    subcategory_name: 'University-Based Service',
    fields: [
      {
        key: 'service_type',
        label: 'Nature of Service',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.service_type,
        helpText: 'Select the primary service classification.'
      },
      {
        key: 'beneficiary_type',
        label: 'Target Beneficiary Community',
        type: 'text',
        required: true,
        placeholder: 'e.g. NDMU Maintenance Personnel / Campus Working Scholars',
        helpText: 'Specify recipient group.'
      },
      {
        key: 'service_scope',
        label: 'Scope of Service',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Geographic / institutional level of the service.'
      },
      {
        key: 'hours_rendered',
        label: 'Documented Hours Rendered',
        type: 'number',
        required: false,
        placeholder: 'e.g. 20',
        helpText: 'Total certified service hours.'
      },
      {
        key: 'leadership_role',
        label: 'Initiated / Led this community project?',
        type: 'boolean',
        required: true,
        defaultValue: false,
        helpText: 'Check if you were the principal project lead or initiator.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000003-0001-0000-0000-000000000002': {
    schema_id: 'SCHEMA_COMM_COMM',
    category_id: 'ace24637-66f7-4329-9451-ccc61e18eab9',
    category_name: 'Community Service / Volunteerism',
    subcategory_name: 'Community-Based Service',
    fields: [
      {
        key: 'service_type',
        label: 'Nature of Service',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.service_type,
        helpText: 'Classification of the community initiative.'
      },
      {
        key: 'beneficiary_type',
        label: 'Beneficiary Community / Barangay',
        type: 'text',
        required: true,
        placeholder: 'e.g. Barangay San Roque Out-of-School Youth',
        helpText: 'Target community served.'
      },
      {
        key: 'service_scope',
        label: 'Service Scope',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Geographic reach.'
      },
      {
        key: 'hours_rendered',
        label: 'Documented Hours Rendered',
        type: 'number',
        required: false,
        placeholder: 'e.g. 35',
        helpText: 'Total hours rendered.'
      },
      {
        key: 'leadership_role',
        label: 'Initiated / Led this project?',
        type: 'boolean',
        required: true,
        defaultValue: false,
        helpText: 'Check if you organized or led this initiative.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000003-0001-0000-0000-000000000003': {
    schema_id: 'SCHEMA_COMM_CHURCH',
    category_id: 'ace24637-66f7-4329-9451-ccc61e18eab9',
    category_name: 'Community Service / Volunteerism',
    subcategory_name: 'Church-Based Service',
    fields: [
      {
        key: 'service_type',
        label: 'Service Classification',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.service_type,
        helpText: 'Select service type.'
      },
      {
        key: 'beneficiary_type',
        label: 'Parish / Diocesan Beneficiaries',
        type: 'text',
        required: true,
        placeholder: 'e.g. Christ the King Parish Feeding Program',
        helpText: 'Parish outreach group.'
      },
      {
        key: 'service_scope',
        label: 'Scope',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'hours_rendered',
        label: 'Hours Rendered',
        type: 'number',
        required: false,
        helpText: 'Documented hours.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000003-0001-0000-0000-000000000004': {
    schema_id: 'SCHEMA_COMM_ENV',
    category_id: 'ace24637-66f7-4329-9451-ccc61e18eab9',
    category_name: 'Community Service / Volunteerism',
    subcategory_name: 'Environmental Service',
    fields: [
      {
        key: 'service_type',
        label: 'Environmental Initiative Type',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.service_type,
        defaultValue: 'environmental',
        helpText: 'Type of environmental activity.'
      },
      {
        key: 'beneficiary_type',
        label: 'Location / Environmental Area',
        type: 'text',
        required: true,
        placeholder: 'e.g. Mount Matutum Reforestation Site',
        helpText: 'Target ecological area.'
      },
      {
        key: 'service_scope',
        label: 'Scope',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'hours_rendered',
        label: 'Hours Rendered',
        type: 'number',
        required: false,
        helpText: 'Hours.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000003-0001-0000-0000-000000000005': {
    schema_id: 'SCHEMA_COMM_EDUC',
    category_id: 'ace24637-66f7-4329-9451-ccc61e18eab9',
    category_name: 'Community Service / Volunteerism',
    subcategory_name: 'People Development / Educational Service',
    fields: [
      {
        key: 'service_type',
        label: 'Educational Extension Focus',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.service_type,
        defaultValue: 'educational',
        helpText: 'Educational extension classification.'
      },
      {
        key: 'beneficiary_type',
        label: 'Learners / Community Group',
        type: 'text',
        required: true,
        placeholder: 'e.g. Daycare Literacy Tutors at Koronadal East',
        helpText: 'Learners served.'
      },
      {
        key: 'service_scope',
        label: 'Scope',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'hours_rendered',
        label: 'Hours Rendered',
        type: 'number',
        required: false,
        helpText: 'Hours.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },

  // ================= 4. CHURCH / MINISTRY INVOLVEMENT (4 subcategories) =================
  '40000004-0001-0000-0000-000000000001': {
    schema_id: 'SCHEMA_CHURCH_CAMPUS',
    category_id: '779a9653-d972-47ce-93dc-cb381150568b',
    category_name: 'Church / Ministry Involvement',
    subcategory_name: 'Campus Ministry',
    fields: [
      {
        key: 'ministry_context',
        label: 'Ministry Setting',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.ministry_context,
        defaultValue: 'campus_ministry',
        helpText: 'Context of church/ministry service.'
      },
      {
        key: 'involvement_type',
        label: 'Ministry Function / Role',
        type: 'text',
        required: true,
        placeholder: 'e.g. Liturgical Reader / Choir Psalmist / Youth Animator',
        helpText: 'Specific liturgical or formation role.'
      },
      {
        key: 'parish_or_org',
        label: 'Chapel / Ministry Body',
        type: 'text',
        required: true,
        defaultValue: 'NDMU Campus Ministry Office',
        helpText: 'Campus ministry unit.'
      },
      {
        key: 'leadership_role',
        label: 'Led / Facilitated Ministry Group?',
        type: 'boolean',
        required: true,
        defaultValue: false,
        helpText: 'Check if you held leadership responsibilities.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000004-0001-0000-0000-000000000002': {
    schema_id: 'SCHEMA_CHURCH_PARISH',
    category_id: '779a9653-d972-47ce-93dc-cb381150568b',
    category_name: 'Church / Ministry Involvement',
    subcategory_name: 'Parish / Church Ministry',
    fields: [
      {
        key: 'ministry_context',
        label: 'Ministry Setting',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.ministry_context,
        defaultValue: 'parish_ministry',
        helpText: 'Parish setting.'
      },
      {
        key: 'parish_or_org',
        label: 'Parish / Cathedral Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Christ the King Cathedral Parish, Koronadal',
        helpText: 'Name of the parish.'
      },
      {
        key: 'involvement_type',
        label: 'Ministry Role',
        type: 'text',
        required: true,
        placeholder: 'e.g. Extraordinary Minister / Catechist / Youth Leader',
        helpText: 'Parish service function.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000004-0001-0000-0000-000000000003': {
    schema_id: 'SCHEMA_CHURCH_ORG',
    category_id: '779a9653-d972-47ce-93dc-cb381150568b',
    category_name: 'Church / Ministry Involvement',
    subcategory_name: 'Church Organization',
    fields: [
      {
        key: 'ministry_context',
        label: 'Ministry Setting',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.ministry_context,
        defaultValue: 'church_organization',
        helpText: 'Setting.'
      },
      {
        key: 'parish_or_org',
        label: 'Church Organization Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Singles for Christ / Columbian Squires',
        helpText: 'Religious organization.'
      },
      {
        key: 'involvement_type',
        label: 'Role / Designation',
        type: 'text',
        required: true,
        placeholder: 'e.g. Chapter Head / Music Ministry Head',
        helpText: 'Designation.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000004-0001-0000-0000-000000000004': {
    schema_id: 'SCHEMA_CHURCH_INITIATIVE',
    category_id: '779a9653-d972-47ce-93dc-cb381150568b',
    category_name: 'Church / Ministry Involvement',
    subcategory_name: 'Initiated Church-Related Activity',
    fields: [
      {
        key: 'ministry_context',
        label: 'Ministry Setting',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.ministry_context,
        helpText: 'Context.'
      },
      {
        key: 'initiative_title',
        label: 'Initiative / Mission Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. Diocesan Youth Pilgrimage Formation Lead',
        helpText: 'Name of the initiated activity.'
      },
      {
        key: 'leadership_role',
        label: 'Lead Initiator?',
        type: 'boolean',
        required: true,
        defaultValue: true,
        helpText: 'Initiated flag.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },

  // ================= 5. SEMINAR / TRAINING (8 subcategories) =================
  '40000005-0001-0000-0000-000000000001': {
    schema_id: 'SCHEMA_SEM_LEAD',
    category_id: '802de57b-54d7-4d38-9433-052ca9636380',
    category_name: 'Seminar / Training',
    subcategory_name: 'Leadership Development',
    fields: [
      {
        key: 'training_type',
        label: 'Training Category',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.training_type,
        defaultValue: 'leadership_dev',
        helpText: 'Training classification.'
      },
      {
        key: 'event_level',
        label: 'Geographic Scope / Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope of the training program.'
      },
      {
        key: 'hours_duration',
        label: 'Training Duration (Hours)',
        type: 'number',
        required: false,
        placeholder: 'e.g. 16',
        helpText: 'Certified contact hours.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000005-0001-0000-0000-000000000002': {
    schema_id: 'SCHEMA_SEM_PROF',
    category_id: '802de57b-54d7-4d38-9433-052ca9636380',
    category_name: 'Seminar / Training',
    subcategory_name: 'Personal / Professional Development',
    fields: [
      {
        key: 'training_type',
        label: 'Training Category',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.training_type,
        defaultValue: 'professional_dev',
        helpText: 'Classification.'
      },
      {
        key: 'event_level',
        label: 'Scope / Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'hours_duration',
        label: 'Training Hours',
        type: 'number',
        required: false,
        helpText: 'Hours.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000005-0001-0000-0000-000000000003': {
    schema_id: 'SCHEMA_SEM_JOURN',
    category_id: '802de57b-54d7-4d38-9433-052ca9636380',
    category_name: 'Seminar / Training',
    subcategory_name: 'Campus Journalism Development',
    fields: [
      {
        key: 'training_type',
        label: 'Training Category',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.training_type,
        defaultValue: 'journalism_dev',
        helpText: 'Journalism workshop or press conference clinic.'
      },
      {
        key: 'event_level',
        label: 'Scope / Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'hours_duration',
        label: 'Duration (Hours)',
        type: 'number',
        required: false,
        helpText: 'Hours.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000005-0001-0000-0000-000000000004': {
    schema_id: 'SCHEMA_SEM_SPORT',
    category_id: '802de57b-54d7-4d38-9433-052ca9636380',
    category_name: 'Seminar / Training',
    subcategory_name: 'Sports Development',
    fields: [
      {
        key: 'training_type',
        label: 'Training Category',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.training_type,
        defaultValue: 'sports_dev',
        helpText: 'Sports clinic, coaching seminar, or athletic conditioning workshop.'
      },
      {
        key: 'event_level',
        label: 'Scope / Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'hours_duration',
        label: 'Duration (Hours)',
        type: 'number',
        required: false,
        helpText: 'Hours.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000005-0001-0000-0000-000000000005': {
    schema_id: 'SCHEMA_SEM_SOCIO',
    category_id: '802de57b-54d7-4d38-9433-052ca9636380',
    category_name: 'Seminar / Training',
    subcategory_name: 'Socio-Cultural / Performing Arts Development',
    fields: [
      {
        key: 'training_type',
        label: 'Training Category',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.training_type,
        defaultValue: 'socio_cultural_dev',
        helpText: 'Theater masterclass, vocal clinic, dance workshop, or visual arts training.'
      },
      {
        key: 'event_level',
        label: 'Scope / Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'hours_duration',
        label: 'Duration (Hours)',
        type: 'number',
        required: false,
        helpText: 'Hours.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000005-0001-0000-0000-000000000006': {
    schema_id: 'SCHEMA_SEM_COMM',
    category_id: '802de57b-54d7-4d38-9433-052ca9636380',
    category_name: 'Seminar / Training',
    subcategory_name: 'Community Service / Volunteer Development',
    fields: [
      {
        key: 'training_type',
        label: 'Training Category',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.training_type,
        defaultValue: 'community_dev',
        helpText: 'Volunteer management or disaster preparedness training.'
      },
      {
        key: 'event_level',
        label: 'Scope',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000005-0001-0000-0000-000000000007': {
    schema_id: 'SCHEMA_SEM_SPIRIT',
    category_id: '802de57b-54d7-4d38-9433-052ca9636380',
    category_name: 'Seminar / Training',
    subcategory_name: 'Spiritual / Formation Development',
    fields: [
      {
        key: 'training_type',
        label: 'Training Category',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.training_type,
        defaultValue: 'spiritual_dev',
        helpText: 'Retreat, recollection, or spiritual formation seminar.'
      },
      {
        key: 'event_level',
        label: 'Scope',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000005-0001-0000-0000-000000000008': {
    schema_id: 'SCHEMA_SEM_OTHER',
    category_id: '802de57b-54d7-4d38-9433-052ca9636380',
    category_name: 'Seminar / Training',
    subcategory_name: 'Other Seminar / Training',
    fields: [
      {
        key: 'training_type',
        label: 'Training Category',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.training_type,
        defaultValue: 'other_dev',
        helpText: 'Special seminar or symposium.'
      },
      {
        key: 'event_level',
        label: 'Scope',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },

  // ================= 6. CITATION / RECOGNITION (8 subcategories) =================
  '40000006-0001-0000-0000-000000000001': {
    schema_id: 'SCHEMA_CIT_LEAD',
    category_id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
    category_name: 'Citation / Recognition',
    subcategory_name: 'Leadership',
    fields: [
      {
        key: 'recognition_level',
        label: 'Scope / Level of Recognition',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Level at which the award was conferred.'
      },
      {
        key: 'granting_body',
        label: 'Granting Body / Institution',
        type: 'text',
        required: true,
        placeholder: 'e.g. National Youth Commission / Provincial Government',
        helpText: 'Awarding entity.'
      },
      {
        key: 'placement',
        label: 'Conferred Rank / Distinction',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.placement,
        helpText: 'Rank or distinction conferred.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000006-0001-0000-0000-000000000002': {
    schema_id: 'SCHEMA_CIT_ORG',
    category_id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
    category_name: 'Citation / Recognition',
    subcategory_name: 'Organization / Membership',
    fields: [
      {
        key: 'recognition_level',
        label: 'Level of Recognition',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'granting_body',
        label: 'Granting Body',
        type: 'text',
        required: true,
        placeholder: 'e.g. Philippine Red Cross National HQ',
        helpText: 'Awarding body.'
      },
      {
        key: 'placement',
        label: 'Conferred Rank',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.placement,
        helpText: 'Distinction.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000006-0001-0000-0000-000000000003': {
    schema_id: 'SCHEMA_CIT_COMM',
    category_id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
    category_name: 'Citation / Recognition',
    subcategory_name: 'Community Service / Volunteerism',
    fields: [
      {
        key: 'recognition_level',
        label: 'Level of Recognition',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'granting_body',
        label: 'Granting Body / LGU',
        type: 'text',
        required: true,
        placeholder: 'e.g. City Government of Koronadal',
        helpText: 'LGU or NGO.'
      },
      {
        key: 'placement',
        label: 'Conferred Rank',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.placement,
        helpText: 'Rank.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000006-0001-0000-0000-000000000004': {
    schema_id: 'SCHEMA_CIT_CHURCH',
    category_id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
    category_name: 'Citation / Recognition',
    subcategory_name: 'Church / Ministry',
    fields: [
      {
        key: 'recognition_level',
        label: 'Level of Recognition',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'granting_body',
        label: 'Diocese / Parish',
        type: 'text',
        required: true,
        placeholder: 'e.g. Diocese of Marbel Youth Commission',
        helpText: 'Ecclesiastical body.'
      },
      {
        key: 'placement',
        label: 'Distinction',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.placement,
        helpText: 'Distinction.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000006-0001-0000-0000-000000000005': {
    schema_id: 'SCHEMA_CIT_JOURN',
    category_id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
    category_name: 'Citation / Recognition',
    subcategory_name: 'Campus Journalism',
    fields: [
      {
        key: 'recognition_level',
        label: 'Press Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'granting_body',
        label: 'Press Association / Body',
        type: 'text',
        required: true,
        placeholder: 'e.g. College Editors Guild of the Philippines (CEGP)',
        helpText: 'Press guild.'
      },
      {
        key: 'placement',
        label: 'Conferred Award / Rank',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.placement,
        helpText: 'Placement.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000006-0001-0000-0000-000000000006': {
    schema_id: 'SCHEMA_CIT_SPORT',
    category_id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
    category_name: 'Citation / Recognition',
    subcategory_name: 'Sports',
    fields: [
      {
        key: 'recognition_level',
        label: 'Scope / Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'granting_body',
        label: 'Sports Association',
        type: 'text',
        required: true,
        placeholder: 'e.g. PRISAA National Board',
        helpText: 'Sports federation.'
      },
      {
        key: 'placement',
        label: 'Placement / Award',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.placement,
        helpText: 'Podium rank.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000006-0001-0000-0000-000000000007': {
    schema_id: 'SCHEMA_CIT_SOCIO',
    category_id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
    category_name: 'Citation / Recognition',
    subcategory_name: 'Socio-Cultural / Performing Arts',
    fields: [
      {
        key: 'recognition_level',
        label: 'Scope / Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'granting_body',
        label: 'Cultural Institution / NCCA',
        type: 'text',
        required: true,
        placeholder: 'e.g. National Commission for Culture and the Arts (NCCA)',
        helpText: 'Cultural body.'
      },
      {
        key: 'placement',
        label: 'Conferred Award',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.placement,
        helpText: 'Award tier.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000006-0001-0000-0000-000000000008': {
    schema_id: 'SCHEMA_CIT_OTHER',
    category_id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e',
    category_name: 'Citation / Recognition',
    subcategory_name: 'Other Non-Academic Recognition',
    fields: [
      {
        key: 'recognition_level',
        label: 'Scope / Level',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.event_level,
        helpText: 'Scope.'
      },
      {
        key: 'granting_body',
        label: 'Granting Body / Organization',
        type: 'text',
        required: true,
        placeholder: 'e.g. Rotary Club International',
        helpText: 'Awarding organization.'
      },
      {
        key: 'placement',
        label: 'Placement / Distinction',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.placement,
        helpText: 'Distinction.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },

  // ================= 7. SPORTS (10 subcategories) =================
  ...['Basketball', 'Volleyball', 'Athletics', 'Swimming', 'Badminton', 'Table Tennis', 'Chess', 'Football', 'Sepak Takraw', 'Other Approved Sport'].reduce((acc, sportName, idx) => {
    const subId = `40000007-0001-0000-0000-${String(idx + 1).padStart(12, '0')}`
    acc[subId] = {
      schema_id: `SCHEMA_SPORT_${sportName.replace(/\s+/g, '_').toUpperCase()}`,
      category_id: '2d20d412-bf34-46b4-a21d-d7131d4b514a',
      category_name: 'Sports',
      subcategory_name: sportName,
      fields: [
        {
          key: 'competition_type',
          label: 'Competition Format',
          type: 'select',
          required: true,
          options: CONTROLLED_VOCABULARIES.competition_type,
          helpText: 'Format of the competitive sporting event.'
        },
        {
          key: 'event_level',
          label: 'Geographic Scope / Level',
          type: 'select',
          required: true,
          options: CONTROLLED_VOCABULARIES.event_level,
          helpText: 'Level at which the tournament was sanctioned.'
        },
        {
          key: 'placement',
          label: 'Conferred Placement / Result',
          type: 'select',
          required: true,
          options: CONTROLLED_VOCABULARIES.placement,
          helpText: 'Final competitive placement achieved.'
        },
        {
          key: 'individual_team',
          label: 'Participation Format',
          type: 'select',
          required: true,
          options: CONTROLLED_VOCABULARIES.individual_team,
          defaultValue: sportName === 'Chess' || sportName === 'Athletics' || sportName === 'Swimming' ? 'individual' : 'team',
          helpText: 'Individual athlete vs team squad.'
        },
        {
          key: 'team_role',
          label: 'Team Role / Designation',
          type: 'text',
          required: false,
          placeholder: 'e.g. Team Captain / Point Guard / Core Spiker',
          visibility: { field: 'individual_team', equals: 'team' },
          helpText: 'Specific role within the team.'
        },
        ...ACADEMIC_TERM_FIELDS
      ]
    }
    return acc
  }, {}),

  // ================= 8. SOCIO-CULTURAL / PERFORMING ARTS (7 subcategories) =================
  ...['Dance', 'Vocal / Singing', 'Instrumental', 'Theater', 'Cultural Performance', 'Performing Arts', 'Other Approved Discipline'].reduce((acc, discName, idx) => {
    const subId = `40000008-0001-0000-0000-${String(idx + 1).padStart(12, '0')}`
    acc[subId] = {
      schema_id: `SCHEMA_SOCIO_${discName.replace(/[\s/]+/g, '_').toUpperCase()}`,
      category_id: '6514e620-b5a0-4ff2-9353-0ee8787b5ce6',
      category_name: 'Socio-Cultural / Performing Arts',
      subcategory_name: discName,
      fields: [
        {
          key: 'performance_type',
          label: 'Performance Nature',
          type: 'select',
          required: true,
          options: CONTROLLED_VOCABULARIES.performance_type,
          helpText: 'Nature of stage/artistic participation.'
        },
        {
          key: 'event_level',
          label: 'Event Scope / Level',
          type: 'select',
          required: true,
          options: CONTROLLED_VOCABULARIES.event_level,
          helpText: 'Level of the showcase or festival.'
        },
        {
          key: 'placement',
          label: 'Conferred Award / Rank',
          type: 'select',
          required: true,
          options: CONTROLLED_VOCABULARIES.placement,
          helpText: 'Competitive placement or exhibition distinction.'
        },
        {
          key: 'individual_group',
          label: 'Performance Grouping',
          type: 'select',
          required: true,
          options: CONTROLLED_VOCABULARIES.individual_group,
          defaultValue: 'group',
          helpText: 'Solo vs troupe performance.'
        },
        ...ACADEMIC_TERM_FIELDS
      ]
    }
    return acc
  }, {}),

  // ================= 9. CAMPUS JOURNALISM (6 subcategories) =================
  '40000009-0001-0000-0000-000000000001': {
    schema_id: 'SCHEMA_JOURN_NEWS',
    category_id: '2b09cd61-7a23-4466-be58-889398e8f201',
    category_name: 'Campus Journalism',
    subcategory_name: 'News Item',
    fields: [
      {
        key: 'publication_name',
        label: 'Official Publication Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. The Maroon and Gold / CITE Gazette',
        helpText: 'Official name of the campus student publication.'
      },
      {
        key: 'publication_type',
        label: 'Publication Format',
        type: 'select',
        required: true,
        defaultValue: 'news',
        options: CONTROLLED_VOCABULARIES.publication_type,
        helpText: 'Article format.'
      },
      {
        key: 'publication_status',
        label: 'Circulation Status',
        type: 'select',
        required: true,
        defaultValue: 'published',
        options: CONTROLLED_VOCABULARIES.publication_status,
        helpText: 'Must be officially Published/Circulated to count for award evaluation.'
      },
      {
        key: 'authorship_role',
        label: 'Byline / Authorship Role',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.authorship_role,
        helpText: 'Your role in the publication of this piece.'
      },
      {
        key: 'publication_date',
        label: 'Date of Circulation / Release',
        type: 'date',
        required: false,
        visibility: { field: 'publication_status', equals: 'published' },
        helpText: 'Official circulation date.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000009-0001-0000-0000-000000000002': {
    schema_id: 'SCHEMA_JOURN_LIT',
    category_id: '2b09cd61-7a23-4466-be58-889398e8f201',
    category_name: 'Campus Journalism',
    subcategory_name: 'Literary Work',
    fields: [
      {
        key: 'publication_name',
        label: 'Publication / Literary Folio Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. The Maroon and Gold Literary Folio',
        helpText: 'Publication folio.'
      },
      {
        key: 'publication_type',
        label: 'Format',
        type: 'select',
        required: true,
        defaultValue: 'literary',
        options: CONTROLLED_VOCABULARIES.publication_type,
        helpText: 'Format.'
      },
      {
        key: 'publication_status',
        label: 'Status',
        type: 'select',
        required: true,
        defaultValue: 'published',
        options: CONTROLLED_VOCABULARIES.publication_status,
        helpText: 'Status.'
      },
      {
        key: 'authorship_role',
        label: 'Role',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.authorship_role,
        helpText: 'Role.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000009-0001-0000-0000-000000000003': {
    schema_id: 'SCHEMA_JOURN_COL',
    category_id: '2b09cd61-7a23-4466-be58-889398e8f201',
    category_name: 'Campus Journalism',
    subcategory_name: 'Column',
    fields: [
      {
        key: 'publication_name',
        label: 'Publication Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. The Maroon and Gold',
        helpText: 'Publication.'
      },
      {
        key: 'publication_type',
        label: 'Format',
        type: 'select',
        required: true,
        defaultValue: 'column',
        options: CONTROLLED_VOCABULARIES.publication_type,
        helpText: 'Format.'
      },
      {
        key: 'publication_status',
        label: 'Status',
        type: 'select',
        required: true,
        defaultValue: 'published',
        options: CONTROLLED_VOCABULARIES.publication_status,
        helpText: 'Status.'
      },
      {
        key: 'authorship_role',
        label: 'Role',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.authorship_role,
        helpText: 'Role.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000009-0001-0000-0000-000000000004': {
    schema_id: 'SCHEMA_JOURN_ED',
    category_id: '2b09cd61-7a23-4466-be58-889398e8f201',
    category_name: 'Campus Journalism',
    subcategory_name: 'Editorial',
    fields: [
      {
        key: 'publication_name',
        label: 'Publication Title',
        type: 'text',
        required: true,
        placeholder: 'e.g. The Maroon and Gold',
        helpText: 'Publication.'
      },
      {
        key: 'publication_type',
        label: 'Format',
        type: 'select',
        required: true,
        defaultValue: 'editorial',
        options: CONTROLLED_VOCABULARIES.publication_type,
        helpText: 'Format.'
      },
      {
        key: 'publication_status',
        label: 'Status',
        type: 'select',
        required: true,
        defaultValue: 'published',
        options: CONTROLLED_VOCABULARIES.publication_status,
        helpText: 'Status.'
      },
      {
        key: 'authorship_role',
        label: 'Role',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.authorship_role,
        helpText: 'Role.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000009-0001-0000-0000-000000000005': {
    schema_id: 'SCHEMA_JOURN_MEMBER',
    category_id: '2b09cd61-7a23-4466-be58-889398e8f201',
    category_name: 'Campus Journalism',
    subcategory_name: 'Publication Member / Contributor',
    fields: [
      {
        key: 'publication_name',
        label: 'Publication Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. The Maroon and Gold Staff',
        helpText: 'Publication editorial board.'
      },
      {
        key: 'member_role',
        label: 'Editorial / Staff Role',
        type: 'text',
        required: true,
        placeholder: 'e.g. Staff Writer / Photojournalist',
        helpText: 'Staff designation.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  },
  '40000009-0001-0000-0000-000000000006': {
    schema_id: 'SCHEMA_JOURN_OFFICER',
    category_id: '2b09cd61-7a23-4466-be58-889398e8f201',
    category_name: 'Campus Journalism',
    subcategory_name: 'Publication Officer',
    fields: [
      {
        key: 'publication_name',
        label: 'Publication Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. The Maroon and Gold Editorial Board',
        helpText: 'Publication.'
      },
      {
        key: 'officer_title',
        label: 'Editorial Board Office',
        type: 'text',
        required: true,
        placeholder: 'e.g. Editor-in-Chief / Managing Editor / Associate Editor',
        helpText: 'Editorial leadership position.'
      },
      {
        key: 'position_level',
        label: 'Officer Tier',
        type: 'select',
        required: true,
        options: CONTROLLED_VOCABULARIES.position_level,
        helpText: 'Tier.'
      },
      ...ACADEMIC_TERM_FIELDS
    ]
  }
}

export const PRIMARY_CATEGORIES = [
  { id: '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', code: 'LEADERSHIP_POSITION', name: 'Leadership Position' },
  { id: 'c9a6d837-78f4-4516-b2db-d438ae717be5', code: 'ORG_MEMBERSHIP', name: 'Organization Membership / Participation' },
  { id: 'ace24637-66f7-4329-9451-ccc61e18eab9', code: 'COMMUNITY_SERVICE', name: 'Community Service / Volunteerism' },
  { id: '779a9653-d972-47ce-93dc-cb381150568b', code: 'CHURCH_MINISTRY', name: 'Church / Ministry Involvement' },
  { id: '802de57b-54d7-4d38-9433-052ca9636380', code: 'SEMINAR_TRAINING', name: 'Seminar / Training' },
  { id: '448beadb-a254-4cb6-84fb-a3d5f4f8822e', code: 'CITATION_RECOGNITION', name: 'Citation / Recognition' },
  { id: '2d20d412-bf34-46b4-a21d-d7131d4b514a', code: 'SPORTS', name: 'Sports' },
  { id: '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', code: 'SOCIO_CULTURAL', name: 'Socio-Cultural / Performing Arts' },
  { id: '2b09cd61-7a23-4466-be58-889398e8f201', code: 'CAMPUS_JOURNALISM', name: 'Campus Journalism' }
]

/**
 * Helper to resolve schema configuration by subcategory_id.
 */
export function getSubcategorySchema(subcategoryId) {
  if (!subcategoryId) return null
  return SUB_CATEGORY_SCHEMAS[subcategoryId] || null
}

/**
 * Helper to list subcategories for a given category_id.
 */
export function getSubcategoriesByCategory(categoryId) {
  if (!categoryId) return []
  return Object.entries(SUB_CATEGORY_SCHEMAS)
    .filter(([_, schema]) => schema.category_id === categoryId)
    .map(([subId, schema]) => ({
      id: subId,
      name: schema.subcategory_name,
      schema_id: schema.schema_id
    }))
}
