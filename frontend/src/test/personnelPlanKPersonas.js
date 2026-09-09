/**
 * AchieveNest — Personnel Evaluation Track — Plan K — Phase K1
 * Authoritative Synthetic Test Personas & Fixtures for End-to-End Validation
 *
 * Implements the minimum synthetic test accounts frozen in Phase K0:
 * - P1: Full-Time Faculty Candidate (Dean-routed, Subject-to-Evaluation states)
 * - P2: Part-Time Faculty Candidate (Part-Time title, ranking eligibility blocked)
 * - P3: Academic Non-Teaching Candidate (College 2, Dean-routed, cross-college denial)
 * - P4: Non-Academic Non-Teaching Candidate (Registrar Unit, HR-routed, no guessed rank)
 * - P5: College Dean Reviewer (College 1 scope, cross-college denied, HR-routed for own eval)
 * - P6: HR Administrator (Institutional scope, finalization & promotion decision authority)
 * - P7: Vice President (VP context, HR-routed)
 * - P-SEC: Department Secretary (Negative authorization case, not an evaluator)
 * - P-LEG: Legacy Migration Fixtures (Supported official unit vs ambiguous)
 */

export const PERSONNEL_GROUPS = {
  FACULTY: 'faculty',
  NON_TEACHING_FACULTY: 'non_teaching_faculty',
};

export const ORGANIZATIONAL_SIDES = {
  ACADEMIC: 'academic',
  NON_ACADEMIC: 'non_academic',
};

export const FACULTY_STATUSES = {
  FULL_TIME: 'full_time_faculty',
  PART_TIME: 'part_time_faculty',
};

export const EMPLOYMENT_STATUSES = {
  PERMANENT: 'permanent',
  PROBATIONARY: 'probationary',
};

export function isRankingEligible(facultyStatus, employmentStatus) {
  if (!facultyStatus) return false;
  return facultyStatus.toLowerCase() === FACULTY_STATUSES.FULL_TIME;
}

export function resolveReviewerRole(personnelGroup, organizationalSide) {
  const side = (organizationalSide || '').toLowerCase();
  const group = (personnelGroup || '').toLowerCase();

  if (side === ORGANIZATIONAL_SIDES.NON_ACADEMIC) {
    return 'hr';
  }
  if (side === ORGANIZATIONAL_SIDES.ACADEMIC) {
    return 'dean';
  }
  return 'unresolved';
}

export const INSTITUTIONAL_COLLEGES = {
  COLLEGE_1: {
    id: 'col-cba-001',
    code: 'CBA',
    name: 'College of Business Administration',
  },
  COLLEGE_2: {
    id: 'col-cte-002',
    code: 'CTE',
    name: 'College of Teacher Education',
  },
};

export const ADMINISTRATIVE_UNITS = {
  REGISTRAR: {
    id: 'unit-reg-001',
    code: 'REG',
    name: 'Office of the University Registrar',
  },
  FINANCE: {
    id: 'unit-fin-002',
    code: 'FIN',
    name: 'Finance and Accounting Office',
  },
};

export const PLAN_K_PERSONAS = {
  // P1: Full-Time Faculty Candidate
  P1: {
    id: 'k1-p1-fac-uuid-001',
    institutional_id: 'K1-P1-FAC-001',
    name: 'Dr. Katherine First (P1 Full-Time Faculty)',
    email: 'k1.p1.faculty@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel'],
    personnel_group: PERSONNEL_GROUPS.FACULTY,
    organizational_side: ORGANIZATIONAL_SIDES.ACADEMIC,
    faculty_status: FACULTY_STATUSES.FULL_TIME,
    employment_status: EMPLOYMENT_STATUSES.PERMANENT,
    college_id: INSTITUTIONAL_COLLEGES.COLLEGE_1.id,
    administrative_unit_id: null,
    current_rank: 'AP_I',
    current_rank_title: 'Assistant Professor I',
    qualification_code: 'DOCTORATE',
    qualification_title: 'Doctor of Philosophy in Business Administration',
    is_licensed_board_passer: true,
    subject_to_evaluation: true, // Configurable in fixture
    expected_reviewer_route: 'dean',
    expected_reviewer_college_id: INSTITUTIONAL_COLLEGES.COLLEGE_1.id,
    ranking_eligible: true,
  },

  // P2: Part-Time Faculty Candidate
  P2: {
    id: 'k1-p2-pt-uuid-002',
    institutional_id: 'K1-P2-PT-002',
    name: 'Prof. Paul Second (P2 Part-Time Faculty)',
    email: 'k1.p2.parttime@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel'],
    personnel_group: PERSONNEL_GROUPS.FACULTY,
    organizational_side: ORGANIZATIONAL_SIDES.ACADEMIC,
    faculty_status: FACULTY_STATUSES.PART_TIME,
    employment_status: EMPLOYMENT_STATUSES.PROBATIONARY,
    college_id: INSTITUTIONAL_COLLEGES.COLLEGE_1.id,
    administrative_unit_id: null,
    current_rank: null,
    current_title: 'PT_LECTURER',
    current_title_label: 'Lecturer',
    qualification_code: 'MASTERS',
    qualification_title: 'Master in Management',
    is_licensed_board_passer: false,
    subject_to_evaluation: false,
    expected_reviewer_route: 'dean',
    ranking_eligible: false, // Core ranking exclusion rule
  },

  // P3: Academic Non-Teaching Candidate
  P3: {
    id: 'k1-p3-ntfa-uuid-003',
    institutional_id: 'K1-P3-NTFA-003',
    name: 'Arthur Third (P3 Academic Non-Teaching)',
    email: 'k1.p3.ntf.academic@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel'],
    personnel_group: PERSONNEL_GROUPS.NON_TEACHING_FACULTY,
    organizational_side: ORGANIZATIONAL_SIDES.ACADEMIC,
    faculty_status: FACULTY_STATUSES.FULL_TIME,
    employment_status: EMPLOYMENT_STATUSES.PERMANENT,
    college_id: INSTITUTIONAL_COLLEGES.COLLEGE_2.id,
    administrative_unit_id: null,
    current_rank: 'INST_I',
    current_rank_title: 'Instructor I',
    qualification_code: 'BACHELORS',
    qualification_title: 'Bachelor of Secondary Education',
    is_licensed_board_passer: true,
    subject_to_evaluation: true,
    expected_reviewer_route: 'dean',
    expected_reviewer_college_id: INSTITUTIONAL_COLLEGES.COLLEGE_2.id,
    ranking_eligible: true,
  },

  // P4: Non-Academic Non-Teaching Candidate
  P4: {
    id: 'k1-p4-ntfna-uuid-004',
    institutional_id: 'K1-P4-NTFNA-004',
    name: 'Nora Fourth (P4 Non-Academic Non-Teaching)',
    email: 'k1.p4.ntf.nonacademic@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel'],
    personnel_group: PERSONNEL_GROUPS.NON_TEACHING_FACULTY,
    organizational_side: ORGANIZATIONAL_SIDES.NON_ACADEMIC,
    faculty_status: FACULTY_STATUSES.FULL_TIME,
    employment_status: EMPLOYMENT_STATUSES.PERMANENT,
    college_id: null,
    administrative_unit_id: ADMINISTRATIVE_UNITS.REGISTRAR.id,
    current_rank: null, // UNRESOLVED — NO GUESSED ACADEMIC-RANK
    current_title: null,
    qualification_code: 'BACHELORS',
    qualification_title: 'Bachelor of Science in Information Technology',
    is_licensed_board_passer: false,
    subject_to_evaluation: true,
    expected_reviewer_route: 'hr',
    expected_reviewer_college_id: null,
    ranking_eligible: true,
  },

  // P5: College Dean Reviewer
  P5: {
    id: 'k1-p5-dean-uuid-005',
    institutional_id: 'K1-P5-DEAN-005',
    name: 'Dean David Fifth (P5 College Dean)',
    email: 'k1.p5.dean@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel', 'dean'],
    personnel_group: PERSONNEL_GROUPS.FACULTY,
    organizational_side: ORGANIZATIONAL_SIDES.ACADEMIC,
    faculty_status: FACULTY_STATUSES.FULL_TIME,
    employment_status: EMPLOYMENT_STATUSES.PERMANENT,
    college_id: INSTITUTIONAL_COLLEGES.COLLEGE_1.id,
    administrative_unit_id: null,
    current_rank: 'PROF_I',
    current_rank_title: 'Professor I',
    assigned_dean_college_id: INSTITUTIONAL_COLLEGES.COLLEGE_1.id,
    reviewer_authority_scope: 'college_scoped',
    expected_self_evaluation_route: 'hr', // Deans are evaluated by HR
  },

  // P6: HR Administrator
  P6: {
    id: 'k1-p6-hr-uuid-006',
    institutional_id: 'K1-P6-HR-006',
    name: 'Helen Sixth (P6 HR Administrator)',
    email: 'k1.p6.hr@ndmu.edu.ph',
    account_type: 'admin',
    roles: ['hr_admin', 'hr_staff'],
    personnel_group: PERSONNEL_GROUPS.NON_TEACHING_FACULTY,
    organizational_side: ORGANIZATIONAL_SIDES.NON_ACADEMIC,
    faculty_status: FACULTY_STATUSES.FULL_TIME,
    employment_status: EMPLOYMENT_STATUSES.PERMANENT,
    college_id: null,
    administrative_unit_id: ADMINISTRATIVE_UNITS.FINANCE.id,
    reviewer_authority_scope: 'institutional',
    has_finalization_authority: true,
    has_promotion_decision_authority: true,
  },

  // P7: Vice President
  P7: {
    id: 'k1-p7-vp-uuid-007',
    institutional_id: 'K1-P7-VP-007',
    name: 'Dr. Vincent Seventh (P7 Vice President)',
    email: 'k1.p7.vp@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel', 'vice_president'],
    personnel_group: PERSONNEL_GROUPS.FACULTY,
    organizational_side: ORGANIZATIONAL_SIDES.ACADEMIC,
    faculty_status: FACULTY_STATUSES.FULL_TIME,
    employment_status: EMPLOYMENT_STATUSES.PERMANENT,
    college_id: INSTITUTIONAL_COLLEGES.COLLEGE_1.id,
    administrative_unit_id: null,
    current_rank: 'PROF_III',
    current_rank_title: 'Professor III',
    expected_reviewer_route: 'hr', // VP routes to HR
  },

  // P-SEC: Department Secretary (Negative authorization)
  P_SEC: {
    id: 'k1-psec-uuid-008',
    institutional_id: 'K1-PSEC-008',
    name: 'Sara Secretary (P-SEC Negative Authorization)',
    email: 'k1.psec.secretary@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel', 'department_secretary'],
    personnel_group: PERSONNEL_GROUPS.NON_TEACHING_FACULTY,
    organizational_side: ORGANIZATIONAL_SIDES.ACADEMIC,
    faculty_status: FACULTY_STATUSES.FULL_TIME,
    employment_status: EMPLOYMENT_STATUSES.PERMANENT,
    college_id: INSTITUTIONAL_COLLEGES.COLLEGE_1.id,
    administrative_unit_id: null,
    is_evaluator: false, // Strictly false
    expected_reviewer_route: 'dean', // Own route derived from NTF + Academic
  },

  // P-LEG: Legacy Migration Fixtures
  P_LEG_SUPPORTED: {
    id: 'k1-pleg-supp-uuid-009',
    institutional_id: 'K1-PLEG-SUPP-009',
    name: 'Leo Legacy (P-LEG Supported Unit)',
    email: 'k1.pleg.supported@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel'],
    legacy_personnel_group: 'non_teaching_personnel', // Legacy 3rd group
    official_unit_id: ADMINISTRATIVE_UNITS.REGISTRAR.id,
    expected_resolved_group: PERSONNEL_GROUPS.NON_TEACHING_FACULTY,
    expected_resolved_side: ORGANIZATIONAL_SIDES.NON_ACADEMIC,
  },

  P_LEG_AMBIGUOUS: {
    id: 'k1-pleg-amb-uuid-010',
    institutional_id: 'K1-PLEG-AMB-010',
    name: 'Alex Ambiguous (P-LEG Ambiguous Legacy)',
    email: 'k1.pleg.ambiguous@ndmu.edu.ph',
    account_type: 'personnel',
    roles: ['personnel'],
    legacy_personnel_group: 'non_teaching_personnel',
    official_unit_id: null,
    official_college_id: null,
    expected_resolved_group: 'UNRESOLVED',
    expected_resolved_side: 'UNRESOLVED',
  },
};

/**
 * Creates a synthetic authenticated session for any Plan K persona.
 *
 * @param {keyof typeof PLAN_K_PERSONAS} personaKey
 * @param {Object} [overrides={}]
 * @returns {Object} Synthetic session payload
 */
export function createSyntheticSession(personaKey, overrides = {}) {
  const base = PLAN_K_PERSONAS[personaKey];
  if (!base) {
    throw new Error(`Unknown Plan K persona key: ${personaKey}`);
  }

  const persona = { ...base, ...overrides };

  return {
    user: {
      id: persona.id,
      institutional_id: persona.institutional_id,
      email: persona.email,
      name: persona.name,
      account_type: persona.account_type,
      roles: [...persona.roles],
      college_id: persona.college_id,
      administrative_unit_id: persona.administrative_unit_id,
    },
    token: `synthetic-jwt-k1-${persona.institutional_id}`,
    claims: {
      sub: persona.id,
      roles: [...persona.roles],
      group: persona.personnel_group,
      side: persona.organizational_side,
      status: persona.faculty_status,
      college: persona.college_id,
      unit: persona.administrative_unit_id,
    },
  };
}

export default {
  PERSONNEL_GROUPS,
  ORGANIZATIONAL_SIDES,
  FACULTY_STATUSES,
  EMPLOYMENT_STATUSES,
  isRankingEligible,
  resolveReviewerRole,
  INSTITUTIONAL_COLLEGES,
  ADMINISTRATIVE_UNITS,
  PLAN_K_PERSONAS,
  createSyntheticSession,
};
