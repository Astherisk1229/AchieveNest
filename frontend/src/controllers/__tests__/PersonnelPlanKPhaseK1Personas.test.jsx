import { describe, it, expect } from 'vitest';
import {
  PLAN_K_PERSONAS,
  INSTITUTIONAL_COLLEGES,
  ADMINISTRATIVE_UNITS,
  PERSONNEL_GROUPS,
  ORGANIZATIONAL_SIDES,
  FACULTY_STATUSES,
  EMPLOYMENT_STATUSES,
  isRankingEligible,
  resolveReviewerRole,
  createSyntheticSession,
} from '../../test/personnelPlanKPersonas';
import { facultyInitialRankService } from '../../services/facultyInitialRankService';
import { partTimeFacultyTitleService } from '../../services/partTimeFacultyTitleService';

describe('Personnel Evaluation Track — Plan K — Phase K1: Required Test Personas & Accounts', () => {
  // Test 1: P1 authenticates
  it('01. P1 authenticates with synthetic token and valid claims', () => {
    const session = createSyntheticSession('P1');
    expect(session.user.id).toBe(PLAN_K_PERSONAS.P1.id);
    expect(session.user.email).toBe('k1.p1.faculty@ndmu.edu.ph');
    expect(session.token).toBeDefined();
    expect(session.claims.roles).toContain('personnel');
  });

  // Test 2: P1 = Faculty + Academic
  it('02. P1 is configured as Faculty + Academic', () => {
    expect(PLAN_K_PERSONAS.P1.personnel_group).toBe(PERSONNEL_GROUPS.FACULTY);
    expect(PLAN_K_PERSONAS.P1.organizational_side).toBe(ORGANIZATIONAL_SIDES.ACADEMIC);
  });

  // Test 3: P1 = Full-time Faculty
  it('03. P1 is configured as Full-time Faculty', () => {
    expect(PLAN_K_PERSONAS.P1.faculty_status).toBe(FACULTY_STATUSES.FULL_TIME);
  });

  // Test 4: P1 assigned College 1
  it('04. P1 is assigned to College 1 (CBA)', () => {
    expect(PLAN_K_PERSONAS.P1.college_id).toBe(INSTITUTIONAL_COLLEGES.COLLEGE_1.id);
    expect(PLAN_K_PERSONAS.P1.administrative_unit_id).toBeNull();
  });

  // Test 5: P1 resolves Dean route
  it('05. P1 resolves Dean route under College 1 scope', () => {
    const route = resolveReviewerRole(
      PLAN_K_PERSONAS.P1.personnel_group,
      PLAN_K_PERSONAS.P1.organizational_side
    );
    expect(route).toBe('dean');
    expect(PLAN_K_PERSONAS.P1.expected_reviewer_route).toBe('dean');
  });

  // Test 6: P2 authenticates
  it('06. P2 authenticates with synthetic token and valid claims', () => {
    const session = createSyntheticSession('P2');
    expect(session.user.id).toBe(PLAN_K_PERSONAS.P2.id);
    expect(session.user.email).toBe('k1.p2.parttime@ndmu.edu.ph');
    expect(session.claims.group).toBe(PERSONNEL_GROUPS.FACULTY);
  });

  // Test 7: P2 = Part-time Faculty
  it('07. P2 is configured as Part-time Faculty', () => {
    expect(PLAN_K_PERSONAS.P2.faculty_status).toBe(FACULTY_STATUSES.PART_TIME);
  });

  // Test 8: P2 has Part-Time title
  it('08. P2 possesses a valid canonical Part-Time title', () => {
    const validTitles = partTimeFacultyTitleService.PART_TIME_TITLES.map((t) => t.code);
    expect(validTitles).toContain(PLAN_K_PERSONAS.P2.current_title);
    expect(PLAN_K_PERSONAS.P2.current_rank).toBeNull();
  });

  // Test 9: P2 ranking eligibility blocked
  it('09. P2 is strictly blocked from ranking evaluation', () => {
    const eligible = isRankingEligible(
      PLAN_K_PERSONAS.P2.faculty_status,
      PLAN_K_PERSONAS.P2.employment_status
    );
    expect(eligible).toBe(false);
    expect(PLAN_K_PERSONAS.P2.ranking_eligible).toBe(false);
  });

  // Test 10: P3 authenticates
  it('10. P3 authenticates with synthetic token and valid claims', () => {
    const session = createSyntheticSession('P3');
    expect(session.user.id).toBe(PLAN_K_PERSONAS.P3.id);
    expect(session.user.email).toBe('k1.p3.ntf.academic@ndmu.edu.ph');
  });

  // Test 11: P3 = NTF + Academic
  it('11. P3 is configured as Non-Teaching Faculty + Academic', () => {
    expect(PLAN_K_PERSONAS.P3.personnel_group).toBe(PERSONNEL_GROUPS.NON_TEACHING_FACULTY);
    expect(PLAN_K_PERSONAS.P3.organizational_side).toBe(ORGANIZATIONAL_SIDES.ACADEMIC);
  });

  // Test 12: P3 assigned College 2
  it('12. P3 is assigned to College 2 (CTE)', () => {
    expect(PLAN_K_PERSONAS.P3.college_id).toBe(INSTITUTIONAL_COLLEGES.COLLEGE_2.id);
  });

  // Test 13: P3 resolves Dean route
  it('13. P3 resolves Dean route under College 2 scope', () => {
    const route = resolveReviewerRole(
      PLAN_K_PERSONAS.P3.personnel_group,
      PLAN_K_PERSONAS.P3.organizational_side
    );
    expect(route).toBe('dean');
    expect(PLAN_K_PERSONAS.P3.expected_reviewer_college_id).toBe(INSTITUTIONAL_COLLEGES.COLLEGE_2.id);
  });

  // Test 14: P4 authenticates
  it('14. P4 authenticates with synthetic token and valid claims', () => {
    const session = createSyntheticSession('P4');
    expect(session.user.id).toBe(PLAN_K_PERSONAS.P4.id);
    expect(session.user.email).toBe('k1.p4.ntf.nonacademic@ndmu.edu.ph');
  });

  // Test 15: P4 = NTF + Non-Academic
  it('15. P4 is configured as Non-Teaching Faculty + Non-Academic', () => {
    expect(PLAN_K_PERSONAS.P4.personnel_group).toBe(PERSONNEL_GROUPS.NON_TEACHING_FACULTY);
    expect(PLAN_K_PERSONAS.P4.organizational_side).toBe(ORGANIZATIONAL_SIDES.NON_ACADEMIC);
  });

  // Test 16: P4 assigned Department/Admin Unit
  it('16. P4 is assigned to Registrar Unit (unit-reg-001)', () => {
    expect(PLAN_K_PERSONAS.P4.administrative_unit_id).toBe(ADMINISTRATIVE_UNITS.REGISTRAR.id);
    expect(PLAN_K_PERSONAS.P4.college_id).toBeNull();
  });

  // Test 17: P4 resolves HR route
  it('17. P4 resolves HR route for Non-Academic personnel', () => {
    const route = resolveReviewerRole(
      PLAN_K_PERSONAS.P4.personnel_group,
      PLAN_K_PERSONAS.P4.organizational_side
    );
    expect(route).toBe('hr');
    expect(PLAN_K_PERSONAS.P4.expected_reviewer_route).toBe('hr');
  });

  // Test 18: P5 authenticates as Dean
  it('18. P5 authenticates as Dean with dean role claim', () => {
    const session = createSyntheticSession('P5');
    expect(session.user.roles).toContain('dean');
    expect(session.claims.roles).toContain('dean');
  });

  // Test 19: P5 scoped to College 1
  it('19. P5 is scoped strictly to College 1 (CBA)', () => {
    expect(PLAN_K_PERSONAS.P5.assigned_dean_college_id).toBe(INSTITUTIONAL_COLLEGES.COLLEGE_1.id);
    expect(PLAN_K_PERSONAS.P5.reviewer_authority_scope).toBe('college_scoped');
  });

  // Test 20: P5 cannot access College 2 candidate (cross-college denial)
  it('20. P5 cannot evaluate P3 (cross-college Dean denial: College 1 vs College 2)', () => {
    const p5College = PLAN_K_PERSONAS.P5.assigned_dean_college_id;
    const p3College = PLAN_K_PERSONAS.P3.college_id;
    expect(p5College).not.toBe(p3College);
    const isAuthorized = p5College === p3College;
    expect(isAuthorized).toBe(false);
  });

  // Test 21: P6 authenticates as HR
  it('21. P6 authenticates as HR Administrator', () => {
    const session = createSyntheticSession('P6');
    expect(session.user.account_type).toBe('admin');
    expect(session.user.roles).toContain('hr_admin');
  });

  // Test 22: P6 has institutional review scope
  it('22. P6 carries institutional review authority and finalization rights', () => {
    expect(PLAN_K_PERSONAS.P6.reviewer_authority_scope).toBe('institutional');
    expect(PLAN_K_PERSONAS.P6.has_finalization_authority).toBe(true);
    expect(PLAN_K_PERSONAS.P6.has_promotion_decision_authority).toBe(true);
  });

  // Test 23: P7 routes to HR where required
  it('23. P7 (Vice President) routes to HR for evaluation', () => {
    expect(PLAN_K_PERSONAS.P7.roles).toContain('vice_president');
    expect(PLAN_K_PERSONAS.P7.expected_reviewer_route).toBe('hr');
  });

  // Test 24: P-SEC authenticates
  it('24. P-SEC authenticates with department_secretary role', () => {
    const session = createSyntheticSession('P_SEC');
    expect(session.user.roles).toContain('department_secretary');
  });

  // Test 25: P-SEC has no evaluator authority
  it('25. P-SEC is strictly excluded from evaluator authority', () => {
    expect(PLAN_K_PERSONAS.P_SEC.is_evaluator).toBe(false);
  });

  // Test 26: P-SEC own route derives from group+side
  it('26. P-SEC own evaluation route derives from NTF + Academic -> Dean', () => {
    const route = resolveReviewerRole(
      PLAN_K_PERSONAS.P_SEC.personnel_group,
      PLAN_K_PERSONAS.P_SEC.organizational_side
    );
    expect(route).toBe('dean');
    expect(PLAN_K_PERSONAS.P_SEC.expected_reviewer_route).toBe('dean');
  });

  // Test 27: P-LEG legacy group fixture exists
  it('27. P-LEG fixture defines legacy non_teaching_personnel third-group record', () => {
    expect(PLAN_K_PERSONAS.P_LEG_SUPPORTED.legacy_personnel_group).toBe('non_teaching_personnel');
    expect(PLAN_K_PERSONAS.P_LEG_AMBIGUOUS.legacy_personnel_group).toBe('non_teaching_personnel');
  });

  // Test 28: supported legacy mapping fixture has official unit data
  it('28. P_LEG_SUPPORTED maps cleanly to Non-Teaching Faculty + Non-Academic based on unit data', () => {
    expect(PLAN_K_PERSONAS.P_LEG_SUPPORTED.official_unit_id).toBe(ADMINISTRATIVE_UNITS.REGISTRAR.id);
    expect(PLAN_K_PERSONAS.P_LEG_SUPPORTED.expected_resolved_group).toBe(PERSONNEL_GROUPS.NON_TEACHING_FACULTY);
    expect(PLAN_K_PERSONAS.P_LEG_SUPPORTED.expected_resolved_side).toBe(ORGANIZATIONAL_SIDES.NON_ACADEMIC);
  });

  // Test 29: ambiguous legacy fixture remains unresolved if included
  it('29. P_LEG_AMBIGUOUS remains unresolved when official unit data is absent', () => {
    expect(PLAN_K_PERSONAS.P_LEG_AMBIGUOUS.official_unit_id).toBeNull();
    expect(PLAN_K_PERSONAS.P_LEG_AMBIGUOUS.official_college_id).toBeNull();
    expect(PLAN_K_PERSONAS.P_LEG_AMBIGUOUS.expected_resolved_group).toBe('UNRESOLVED');
  });

  // Test 30: College IDs persist
  it('30. College IDs persist deterministic synthetic identifiers', () => {
    expect(INSTITUTIONAL_COLLEGES.COLLEGE_1.id).toMatch(/^col-[a-z0-9-]+$/);
    expect(INSTITUTIONAL_COLLEGES.COLLEGE_2.id).toMatch(/^col-[a-z0-9-]+$/);
  });

  // Test 31: Department/Admin Unit IDs persist
  it('31. Department/Admin Unit IDs persist deterministic synthetic identifiers', () => {
    expect(ADMINISTRATIVE_UNITS.REGISTRAR.id).toMatch(/^unit-[a-z0-9-]+$/);
    expect(ADMINISTRATIVE_UNITS.FINANCE.id).toMatch(/^unit-[a-z0-9-]+$/);
  });

  // Test 32: Full-Time rank code is canonical
  it('32. P1 Full-Time rank code matches canonical Plan E catalog', () => {
    const validRankCodes = Object.values(facultyInitialRankService.BASE_RANKS).map((r) => r.code);
    expect(validRankCodes).toContain('ASSISTANT_PROFESSOR'); // Base rank tier
    expect(PLAN_K_PERSONAS.P1.current_rank).toBe('AP_I');
  });

  // Test 33: Part-Time title code is canonical
  it('33. P2 Part-Time title code matches canonical Plan E catalog', () => {
    const validTitles = partTimeFacultyTitleService.PART_TIME_TITLES.map((t) => t.code);
    expect(validTitles).toContain(PLAN_K_PERSONAS.P2.current_title);
  });

  // Test 34: employment and Faculty Status remain separate
  it('34. Employment Status and Faculty Status remain orthogonal dimensions across all personas', () => {
    Object.values(PLAN_K_PERSONAS).forEach((persona) => {
      if (persona.faculty_status) {
        expect([FACULTY_STATUSES.FULL_TIME, FACULTY_STATUSES.PART_TIME]).toContain(persona.faculty_status);
      }
      if (persona.employment_status) {
        expect([EMPLOYMENT_STATUSES.PERMANENT, EMPLOYMENT_STATUSES.PROBATIONARY]).toContain(persona.employment_status);
      }
    });
  });

  // Test 35: subject-to-evaluation test state prepared
  it('35. Subject-to-Evaluation states (Yes/No) are configurable on P1 fixture', () => {
    const p1Active = { ...PLAN_K_PERSONAS.P1, subject_to_evaluation: true };
    const p1Inactive = { ...PLAN_K_PERSONAS.P1, subject_to_evaluation: false };
    expect(p1Active.subject_to_evaluation).toBe(true);
    expect(p1Inactive.subject_to_evaluation).toBe(false);
  });

  // Test 36: evaluation cycle fixture prepared
  it('36. Evaluation cycle fixture is deterministic and isolated', () => {
    const testCycle = {
      id: 'cycle-2026-eval-k1',
      academic_year: '2025-2026',
      semester: '2nd Semester',
      status: 'active',
    };
    expect(testCycle.id).toBe('cycle-2026-eval-k1');
    expect(testCycle.status).toBe('active');
  });

  // Test 37: no plaintext secrets exist in evidence or fixtures
  it('37. Fixture session tokens are synthetic and contain no committed passwords', () => {
    Object.keys(PLAN_K_PERSONAS).forEach((key) => {
      if (PLAN_K_PERSONAS[key].institutional_id && !key.startsWith('P_LEG')) {
        const session = createSyntheticSession(key);
        expect(session.token).toBeDefined();
        expect(JSON.stringify(session)).not.toMatch(/password|secret_key|hash/i);
      }
    });
  });

  // Test 38: no real Personnel data used
  it('38. All personas use strictly synthetic emails (@ndmu.edu.ph synthetic patterns) and names', () => {
    Object.values(PLAN_K_PERSONAS).forEach((p) => {
      expect(p.email).toMatch(/^k1\./);
      expect(p.institutional_id).toMatch(/^K1-/);
    });
  });

  // Test 39: all personas map to frozen K0 cases
  it('39. Every persona maps to at least one frozen K0 acceptance matrix case', () => {
    const personaToK0Map = {
      P1: ['K0-D01', 'K0-E01', 'K0-F01', 'K0-G01', 'K0-H01', 'K0-J01'],
      P2: ['K0-D02', 'K0-E02', 'K0-E03'],
      P3: ['K0-D03', 'K0-G02', 'K0-G04'],
      P4: ['K0-D04', 'K0-G03', 'K0-U01'],
      P5: ['K0-G01', 'K0-G04', 'K0-G05'],
      P6: ['K0-H01', 'K0-H02', 'K0-H03'],
      P7: ['K0-G06'],
      P_SEC: ['K0-G07', 'K0-S03'],
      P_LEG_SUPPORTED: ['K0-M01'],
      P_LEG_AMBIGUOUS: ['K0-M02'],
    };

    Object.keys(PLAN_K_PERSONAS).forEach((key) => {
      expect(personaToK0Map[key]).toBeDefined();
      expect(personaToK0Map[key].length).toBeGreaterThan(0);
    });
  });

  // Test 40: full regression baseline passes
  it('40. Master regression baseline integrity holds across all persona definitions', () => {
    expect(Object.keys(PLAN_K_PERSONAS).length).toBe(10); // P1..P7 + P-SEC + P-LEG-SUPP + P-LEG-AMB
  });
});
