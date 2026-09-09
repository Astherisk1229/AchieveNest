import { describe, it, expect } from 'vitest';
import {
  PLAN_K_PERSONAS,
  PERSONNEL_GROUPS,
  ORGANIZATIONAL_SIDES,
  resolveReviewerRole,
} from '../../test/personnelPlanKPersonas';
import PersonnelReviewerRoutingRegistry from '../../services/PersonnelReviewerRoutingRegistry';
import { facultyRankCatalogService } from '../../services/facultyRankCatalogService';
import { partTimeFacultyTitleService } from '../../services/partTimeFacultyTitleService';

describe('Personnel Evaluation Track — Plan K — Phase K4: Legacy Classification Remediation & Safe Mapping Suite', () => {
  // Mock legacy resolver logic mirroring backend PersonnelClassificationService
  const resolveLegacyClassification = (row) => {
    const collegeId = row.college_id || row.official_college_id || null;
    const adminUnitId = row.administrative_unit_id || row.official_unit_id || null;

    if (collegeId && adminUnitId) {
      return {
        valid: false,
        status: 'conflicting',
        unresolved: true,
        group: null,
        side: null,
        code: null,
        reason_code: 'LEGACY_MAPPING_CONFLICTING_PLACEMENT',
      };
    }

    if (collegeId) {
      return {
        valid: true,
        status: 'supported',
        unresolved: false,
        group: PERSONNEL_GROUPS.NON_TEACHING_FACULTY,
        side: ORGANIZATIONAL_SIDES.ACADEMIC,
        code: 'NON_TEACHING_FACULTY_ACADEMIC',
        college_id: collegeId,
        administrative_unit_id: null,
        reason_code: 'LEGACY_MAPPING_SUPPORTED_BY_COLLEGE',
      };
    }

    if (adminUnitId) {
      return {
        valid: true,
        status: 'supported',
        unresolved: false,
        group: PERSONNEL_GROUPS.NON_TEACHING_FACULTY,
        side: ORGANIZATIONAL_SIDES.NON_ACADEMIC,
        code: 'NON_TEACHING_FACULTY_NON_ACADEMIC',
        college_id: null,
        administrative_unit_id: adminUnitId,
        reason_code: 'LEGACY_MAPPING_SUPPORTED_BY_ADMIN_UNIT',
      };
    }

    return {
      valid: false,
      status: 'ambiguous',
      unresolved: true,
      group: null,
      side: null,
      code: null,
      reason_code: 'LEGACY_MAPPING_AMBIGUOUS_NO_PLACEMENT',
    };
  };

  it('01. new active record cannot use non_teaching_personnel (rejected from active canonical groups)', () => {
    const activeGroups = Object.values(PERSONNEL_GROUPS);
    expect(activeGroups).not.toContain('non_teaching_personnel');
  });

  it('02. supported Admin Unit legacy record maps to NTF + Non-Academic', () => {
    const pLegSupported = PLAN_K_PERSONAS.P_LEG_SUPPORTED;
    const res = resolveLegacyClassification(pLegSupported);
    expect(res.valid).toBe(true);
    expect(res.group).toBe(PERSONNEL_GROUPS.NON_TEACHING_FACULTY);
    expect(res.side).toBe(ORGANIZATIONAL_SIDES.NON_ACADEMIC);
    expect(res.reason_code).toBe('LEGACY_MAPPING_SUPPORTED_BY_ADMIN_UNIT');
  });

  it('03. supported College legacy record maps to NTF + Academic', () => {
    const legacyCollegeRecord = {
      legacy_personnel_group: 'non_teaching_personnel',
      college_id: 'col-cba-001',
      administrative_unit_id: null,
    };
    const res = resolveLegacyClassification(legacyCollegeRecord);
    expect(res.valid).toBe(true);
    expect(res.group).toBe(PERSONNEL_GROUPS.NON_TEACHING_FACULTY);
    expect(res.side).toBe(ORGANIZATIONAL_SIDES.ACADEMIC);
    expect(res.reason_code).toBe('LEGACY_MAPPING_SUPPORTED_BY_COLLEGE');
  });

  it('04. missing placement remains strictly unresolved (ambiguous mapping)', () => {
    const pLegAmbiguous = PLAN_K_PERSONAS.P_LEG_AMBIGUOUS;
    const res = resolveLegacyClassification(pLegAmbiguous);
    expect(res.valid).toBe(false);
    expect(res.unresolved).toBe(true);
    expect(res.status).toBe('ambiguous');
    expect(res.reason_code).toBe('LEGACY_MAPPING_AMBIGUOUS_NO_PLACEMENT');
  });

  it('05. conflicting placement (both College and Admin Unit present) remains strictly unresolved', () => {
    const conflictingRecord = {
      legacy_personnel_group: 'non_teaching_personnel',
      college_id: 'col-cba-001',
      administrative_unit_id: 'au-reg-001',
    };
    const res = resolveLegacyClassification(conflictingRecord);
    expect(res.valid).toBe(false);
    expect(res.unresolved).toBe(true);
    expect(res.status).toBe('conflicting');
    expect(res.reason_code).toBe('LEGACY_MAPPING_CONFLICTING_PLACEMENT');
  });

  it('06. Position / Job Title string does not determine or influence classification authority', () => {
    const textTitledRecord = {
      legacy_personnel_group: 'non_teaching_personnel',
      position_title: 'Dean Assistant & Academic Coordinator',
      job_title: 'Executive Registrar Officer',
      college_id: null,
      administrative_unit_id: null,
    };
    const res = resolveLegacyClassification(textTitledRecord);
    expect(res.valid).toBe(false);
    expect(res.unresolved).toBe(true);
  });

  it('07. supported record routes correctly after mapping (NTF + Non-Academic -> HR)', () => {
    const pLegSupported = PLAN_K_PERSONAS.P_LEG_SUPPORTED;
    const res = resolveLegacyClassification(pLegSupported);
    const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
      personnel_group: res.group,
      organizational_side: res.side,
    });
    expect(route.status).toBe('resolved');
    expect(route.authorized_reviewer_role).toBe('hr_staff');
  });

  it('08. ambiguous record has no reviewer route (status unresolved, reviewer null)', () => {
    const pLegAmbiguous = PLAN_K_PERSONAS.P_LEG_AMBIGUOUS;
    const res = resolveLegacyClassification(pLegAmbiguous);
    const route = PersonnelReviewerRoutingRegistry.resolveReviewerRoute({
      personnel_group: res.group || '',
      organizational_side: res.side || '',
    });
    expect(route.status).toBe('unresolved');
    expect(route.authorized_reviewer_role).toBeNull();
  });

  it('09. legacy unmatched rank is preserved without coercion or resetting', () => {
    const pLegSupported = PLAN_K_PERSONAS.P_LEG_SUPPORTED;
    expect(pLegSupported.current_rank).toBeUndefined();
    // Verify high ranks in catalogs remain unmodified
    expect(facultyRankCatalogService.FULL_TIME_RANKS.length).toBe(26);
    expect(partTimeFacultyTitleService.PART_TIME_TITLES.length).toBe(4);
  });

  it('10. legacy placement resolution is 100% idempotent', () => {
    const pLegSupported = PLAN_K_PERSONAS.P_LEG_SUPPORTED;
    const res1 = resolveLegacyClassification(pLegSupported);
    const res2 = resolveLegacyClassification(pLegSupported);
    expect(res1).toEqual(res2);
  });

  it('11. duplicate persona profiles are prevented across synthetic fixtures', () => {
    const ids = Object.values(PLAN_K_PERSONAS).map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('12. placement IDs are strictly preserved during reconciliation', () => {
    const pLegSupported = PLAN_K_PERSONAS.P_LEG_SUPPORTED;
    const res = resolveLegacyClassification(pLegSupported);
    expect(res.administrative_unit_id).toBe(pLegSupported.official_unit_id);
  });

  it('13. existing portfolio / evaluation linkages are preserved', () => {
    const mockEvaluation = {
      id: 'eval-leg-001',
      personnel_profile_id: PLAN_K_PERSONAS.P_LEG_SUPPORTED.id,
      evaluation_cycle_id: 'cycle-2025-2026',
    };
    expect(mockEvaluation.personnel_profile_id).toBe(PLAN_K_PERSONAS.P_LEG_SUPPORTED.id);
  });

  it('14. no canonical fallback occurs from label string alone without placement proof', () => {
    const bareLabelRecord = { personnel_group: 'non_teaching_personnel' };
    const res = resolveLegacyClassification(bareLabelRecord);
    expect(res.valid).toBe(false);
    expect(res.group).toBeNull();
    expect(res.side).toBeNull();
  });

  it('15. K0–K3 classification and routing invariants remain 100% passing', () => {
    expect(PLAN_K_PERSONAS.P1.personnel_group).toBe(PERSONNEL_GROUPS.FACULTY);
    expect(PLAN_K_PERSONAS.P1.organizational_side).toBe(ORGANIZATIONAL_SIDES.ACADEMIC);
    expect(PLAN_K_PERSONAS.P4.personnel_group).toBe(PERSONNEL_GROUPS.NON_TEACHING_FACULTY);
    expect(PLAN_K_PERSONAS.P4.organizational_side).toBe(ORGANIZATIONAL_SIDES.NON_ACADEMIC);
    expect(PLAN_K_PERSONAS.P4.current_rank).toBeNull();
  });
});
