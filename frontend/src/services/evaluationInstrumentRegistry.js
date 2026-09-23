/**
 * EvaluationInstrumentRegistry.js
 *
 * Canonical Authoritative Evaluation Instrument Freeze & Scoring Configuration Baseline.
 * Plan F — Phase F0.
 *
 * Official sources:
 * 1. NDMU-DOC-EVAL-ADMIN-2026-V1 (Rating Sheet for Administrators & Academic Personnel)
 * 2. NDMU-DOC-EVAL-NON-TEACHING-2026-V1 (Non-Teaching Personnel Rating Sheet for Ranking - Appendix N)
 */

export const EVALUATION_RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2'

export const EVALUATION_SCALE_CODES = Object.freeze({
  ADMINISTRATORS: 'ADMINISTRATORS_RANKING_SCALE',
  NON_TEACHING: 'NON_TEACHING_PERSONNEL_RANKING_SCALE',
})

export const EVALUATION_INSTRUMENTS = Object.freeze({
  [EVALUATION_SCALE_CODES.ADMINISTRATORS]: {
    scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
    title: 'Rating Sheet for Administrators & Academic Personnel',
    rule_version: EVALUATION_RULE_VERSION,
    source_document_id: 'NDMU-DOC-EVAL-ADMIN-2026-V1',
    overall_max_points: 160.0,
    passing_score: 120.0,
    applicability: [
      { personnel_group: 'faculty', organizational_side: 'academic' },
      { personnel_group: 'non_teaching_faculty', organizational_side: 'academic' },
    ],
    areas: {
      AREA_A: {
        area_code: 'AREA_A',
        name: 'Area A: Professional Development',
        max_points: 70.0,
        entry_policy: 'personnel_entry_allowed',
        is_personnel_entry_allowed: true,
        categories: {
          'A.1': {
            code: 'A.1',
            name: 'Degree/s',
            max_points: 40.0,
            rule_type: 'DEGREE_AND_UNITS',
            options: [
              { code: 'phd_degree', label: 'Ph.D. Degree Holder', points: 40.0, rule: 'fixed' },
              { code: 'phd_units', label: 'Ph.D. Units', points_per_block: 2.0, units_per_block: 3, max_points: 10.0, rule: 'units_derived' },
              { code: 'ma_degree', label: 'MA Degree Holder', points: 20.0, rule: 'fixed' },
              { code: 'ma_units', label: 'MA Units', points_per_block: 1.0, units_per_block: 3, max_points: 10.0, rule: 'units_derived' },
            ],
            required_fields: ['degree_type', 'degree_name_or_units', 'institution'],
            evidence_required: true,
          },
          'A.2': {
            code: 'A.2',
            name: 'Active Membership to Professional Organizations',
            max_points: 10.0,
            rule_type: 'POINTS_PER_ITEM',
            options: [
              { code: 'officer', label: 'Officer (per office/position held)', points: 10.0 },
              { code: 'member', label: 'Member (per active membership)', points: 5.0 },
            ],
            required_fields: ['organization_name', 'membership_role', 'period'],
            evidence_required: true,
          },
          'A.3': {
            code: 'A.3',
            name: 'Attendance to Seminars/Trainings for Professional Development',
            max_points: 20.0,
            rule_type: 'POINTS_PER_ITEM',
            options: [
              { code: 'international', label: 'International Level', points: 10.0 },
              { code: 'national', label: 'National Level', points: 8.0 },
              { code: 'regional', label: 'Regional Level', points: 6.0 },
              { code: 'city_provincial', label: 'City / Provincial Level', points: 4.0 },
              { code: 'in_house', label: 'In-House / Institutional Level', points: 3.0 },
            ],
            required_fields: ['seminar_title', 'scope', 'venue', 'date'],
            evidence_required: true,
          },
        },
      },
      AREA_B: {
        area_code: 'AREA_B',
        name: 'Area B: Productivity and Creative Work',
        max_points: 50.0,
        entry_policy: 'personnel_entry_allowed',
        is_personnel_entry_allowed: true,
        categories: {
          'B.1': {
            code: 'B.1',
            name: 'Guest Lecturer / Consultant / Judge / Resource Person',
            max_points: 40.0,
            rule_type: 'SUM_COMPONENTS',
            formula: 'sponsoring_organization + extent_of_talk + participant_reach + role',
            factors: {
              sponsoring_organization: [
                { code: 'external', label: 'External Agencies / Other Schools', points: 2.0 },
                { code: 'ndmu', label: 'NDMU', points: 1.0 },
              ],
              extent_of_talk: [
                { code: 'more_than_2_days', label: 'More than 2 Days (Comprehensive Series)', points: 5.0 },
                { code: '2_days', label: '2 Days Workshop / Seminar', points: 4.0 },
                { code: '1_day', label: '1 Full Day Session', points: 3.0 },
                { code: 'half_day', label: 'Half Day Session', points: 2.0 },
                { code: '1_hour', label: '1 Hour Lecture / Session', points: 1.0 },
              ],
              participant_reach: [
                { code: 'international', label: 'International Level', points: 4.0 },
                { code: 'national', label: 'National Level', points: 3.0 },
                { code: 'regional', label: 'Regional Level', points: 2.0 },
                { code: 'local', label: 'Local / Institutional Level', points: 1.0 },
              ],
              role: [
                { code: 'reactor', label: 'Reactor', points: 5.0 },
                { code: 'resource_person', label: 'Resource Person', points: 5.0 },
                { code: 'facilitator', label: 'Facilitator', points: 5.0 },
                { code: 'consultant', label: 'Consultant', points: 5.0 },
                { code: 'speaker', label: 'Speaker', points: 5.0 },
                { code: 'organizer', label: 'Organizer', points: 5.0 },
                { code: 'judge', label: 'Judge', points: 3.0 },
              ],
            },
            required_fields: ['activity_title', 'sponsoring_organization', 'extent_of_talk', 'participant_reach', 'role', 'date'],
            evidence_required: true,
          },
          'B.2': {
            code: 'B.2',
            name: 'Publication',
            max_points: 30.0,
            rule_type: 'SUM_COMPONENTS',
            formula: 'location_scope + publication_type',
            factors: {
              location_scope: [
                { code: 'international', label: 'International Level', points: 8.0 },
                { code: 'national', label: 'National Level', points: 6.0 },
                { code: 'regional', label: 'Regional Level', points: 4.0 },
                { code: 'local', label: 'Local Level', points: 3.0 },
              ],
              publication_type: [
                { code: 'book', label: 'Book', points: 10.0 },
                { code: 'research_output', label: 'Research Output', points: 10.0 },
                { code: 'scholarly_paper', label: 'Scholarly Paper', points: 8.0 },
                { code: 'monograph', label: 'Monograph', points: 8.0 },
                { code: 'article', label: 'Article', points: 5.0 },
                { code: 'compilation', label: 'Compilation', points: 5.0 },
                { code: 'reviews', label: 'Reviews', points: 4.0 },
                { code: 'commentary', label: 'Commentary', points: 2.0 },
              ],
            },
            required_fields: ['publication_title', 'location_scope', 'publication_type', 'date'],
            evidence_required: true,
          },
          'B.3': {
            code: 'B.3',
            name: 'Conduct of Research',
            max_points: 40.0,
            rule_type: 'EVALUATOR_JUDGMENT_MAX_ONLY',
            evaluator_judgment_required: true,
            required_fields: ['research_title', 'description'],
            evidence_required: true,
          },
          'B.4': {
            code: 'B.4',
            name: 'Professional Recognition or Awards',
            max_points: 40.0,
            rule_type: 'MATRIX_LOOKUP',
            matrix: {
              awardee: {
                international: 40.0,
                national: 40.0,
                regional: 30.0,
                local: 10.0,
              },
              nominee: {
                international: 20.0,
                national: 20.0,
                regional: 15.0,
                local: 5.0,
              },
            },
            required_fields: ['award_title', 'recognition_status', 'scope', 'date'],
            evidence_required: true,
          },
          'B.5': {
            code: 'B.5',
            name: 'Production of Instructional Materials',
            max_points: 20.0,
            rule_type: 'POINTS_PER_ITEM',
            options: [
              { code: 'others_bound', label: 'Others (Bound Workbook, Exercises, Lectures)', points: 20.0 },
              { code: 'audio_visual', label: 'Audio-Visual Aids', points: 10.0 },
              { code: 'modules', label: 'Modules', points: 10.0 },
              { code: 'reviewers_bound', label: 'Reviewers (Bound)', points: 10.0 },
            ],
            required_fields: ['material_title', 'material_type', 'date'],
            evidence_required: true,
          },
          'B.6': {
            code: 'B.6',
            name: 'Creative Work',
            max_points: 20.0,
            rule_type: 'EVALUATOR_JUDGMENT_MAX_ONLY',
            evaluator_judgment_required: true,
            required_fields: ['work_title', 'description'],
            evidence_required: true,
          },
        },
      },
      AREA_C: {
        area_code: 'AREA_C',
        name: 'Area C: Service to the School & Community',
        max_points: 40.0,
        entry_policy: 'personnel_entry_allowed',
        is_personnel_entry_allowed: true,
        categories: {
          'C.1': {
            code: 'C.1',
            name: 'Involvement in Extra-Curricular Activities / Recognized School Organizations',
            max_points: 30.0,
            rule_type: 'POINTS_PER_ITEM',
            options: [
              { code: 'moderator', label: 'Moderator of Clubs/Organizations', points: 20.0 },
              { code: 'coach_trainer', label: 'Coach/Trainer', points: 20.0 },
              { code: 'working_committee', label: 'Membership in Working Committees', points: 20.0 },
              { code: 'rendered_service', label: 'Rendered Service during intramurals, etc.', points: 10.0 },
            ],
            required_fields: ['activity_or_club', 'role', 'school_year'],
            evidence_required: true,
          },
          'C.2': {
            code: 'C.2',
            name: 'Community Involvement',
            max_points: 30.0,
            rule_type: 'POINTS_PER_ITEM',
            options: [
              { code: 'church_activities', label: 'Active involvement in church activities', points: 25.0 },
              { code: 'community_civic', label: 'Active involvement in community/civic activities', points: 25.0 },
              { code: 'charity_projects', label: 'Support to charity and community projects', points: 5.0 },
            ],
            required_fields: ['community_program', 'category', 'school_year'],
            evidence_required: true,
          },
          'C.3': {
            code: 'C.3',
            name: 'Number of Years of Service at NDMU',
            max_points: 10.0,
            rule_type: 'SERVER_DERIVED',
            server_derived: true,
            formula: '1 point per 2 completed years (max 10 points)',
            points_per_two_years: 1.0,
            required_fields: ['years_of_service'],
            evidence_required: false,
          },
        },
      },
    },
  },

  [EVALUATION_SCALE_CODES.NON_TEACHING]: {
    scale_code: EVALUATION_SCALE_CODES.NON_TEACHING,
    title: 'Non-Teaching Personnel Rating Sheet for Ranking (Appendix N)',
    rule_version: EVALUATION_RULE_VERSION,
    source_document_id: 'NDMU-DOC-EVAL-NON-TEACHING-2026-V1',
    overall_max_points: 150.0,
    passing_score: 75.0,
    applicability: [
      { personnel_group: 'non_teaching_faculty', organizational_side: 'non_academic' },
    ],
    areas: {
      AREA_A: {
        area_code: 'AREA_A',
        name: 'Area A: Performance and Personal Indicators',
        max_points: 90.0,
        entry_policy: 'read_only_evaluation_area',
        is_personnel_entry_allowed: false,
        categories: {
          'A.1': {
            code: 'A.1',
            name: 'Job Performance',
            max_points: 50.0,
            rule_type: 'EVALUATOR_OFFICIAL_RATING',
            read_only: true,
            evidence_required: false,
          },
          'A.2': {
            code: 'A.2',
            name: 'Personal Attitudes and Qualities',
            max_points: 10.0,
            rule_type: 'EVALUATOR_OFFICIAL_RATING',
            read_only: true,
            evidence_required: false,
          },
          'A.3': {
            code: 'A.3',
            name: 'Efficiency',
            max_points: 30.0,
            rule_type: 'EVALUATOR_OFFICIAL_RATING',
            read_only: true,
            evidence_required: false,
          },
        },
      },
      AREA_B: {
        area_code: 'AREA_B',
        name: 'Area B: Service to School and Community',
        max_points: 60.0,
        entry_policy: 'personnel_entry_allowed',
        is_personnel_entry_allowed: true,
        categories: {
          'B.1': {
            code: 'B.1',
            name: 'Involvement in School Activities / Recognized School Organizations',
            max_points: 30.0,
            rule_type: 'POINTS_PER_ITEM',
            options: [
              { code: 'moderator_officer', label: 'Moderator or Officer of Clubs', points: 30.0 },
              { code: 'trainer_coach', label: 'Trainer/Coach', points: 20.0 },
              { code: 'working_committee', label: 'Membership in Working Committees', points: 20.0 },
              { code: 'rendered_service', label: 'Rendered Service in School Activities', points: 10.0 },
            ],
            required_fields: ['activity_title', 'role', 'period'],
            evidence_required: true,
          },
          'B.2': {
            code: 'B.2',
            name: 'Community Involvement',
            max_points: 30.0,
            rule_type: 'POINTS_PER_ITEM',
            options: [
              { code: 'church_activities', label: 'Active Involvement in Church Activities', points: 25.0 },
              { code: 'community_civic', label: 'Active Involvement in Community/Civic Activities', points: 25.0 },
              { code: 'charity_projects', label: 'Support to Charity and Community Projects', points: 5.0 },
            ],
            required_fields: ['community_project', 'role', 'period'],
            evidence_required: true,
          },
          'B.3': {
            code: 'B.3',
            name: 'Number of Years at NDMU',
            max_points: 10.0,
            rule_type: 'SERVER_DERIVED',
            server_derived: true,
            formula: '1 point per 2 completed years (max 10 points)',
            points_per_two_years: 1.0,
            required_fields: ['years_of_service'],
            evidence_required: false,
          },
          'B.4': {
            code: 'B.4',
            name: 'Invited as Judge, Lecturer, Resource Person',
            max_points: 30.0,
            rule_type: 'POINTS_PER_OCCURRENCE',
            points_per_occurrence: 5.0,
            required_fields: ['event_title', 'invitation_role', 'organizer', 'date'],
            evidence_required: true,
          },
          'B.5': {
            code: 'B.5',
            name: 'Recognition / Meritorious Award',
            max_points: 30.0,
            rule_type: 'EVALUATOR_JUDGMENT_MAX_ONLY',
            evaluator_judgment_required: true,
            required_fields: ['award_title', 'issuing_body', 'date'],
            evidence_required: true,
          },
        },
      },
    },
  },
})

export const evaluationInstrumentRegistry = {
  RULE_VERSION: EVALUATION_RULE_VERSION,
  SCALE_CODES: EVALUATION_SCALE_CODES,
  INSTRUMENTS: EVALUATION_INSTRUMENTS,

  /**
   * Returns total count of frozen scales (2).
   */
  getScaleCount() {
    return Object.keys(this.INSTRUMENTS).length
  },

  /**
   * Resolves canonical scale code for a personnel combination.
   */
  resolveScaleCode(personnelGroup, organizationalSide) {
    const group = (personnelGroup || '').toLowerCase().trim()
    const side = (organizationalSide || '').toLowerCase().trim()

    if (group === 'faculty' && side === 'academic') {
      return this.SCALE_CODES.ADMINISTRATORS
    }
    if (group === 'non_teaching_faculty' && side === 'academic') {
      return this.SCALE_CODES.ADMINISTRATORS
    }
    if (group === 'non_teaching_faculty' && side === 'non_academic') {
      return this.SCALE_CODES.NON_TEACHING
    }

    throw new Error(`Invalid personnel classification combination: [${group} + ${side}]. No authoritative evaluation scale assigned.`)
  },

  /**
   * Retrieves scale configuration by code.
   */
  getInstrument(scaleCode) {
    return this.INSTRUMENTS[scaleCode] || null
  },
}

export default evaluationInstrumentRegistry
