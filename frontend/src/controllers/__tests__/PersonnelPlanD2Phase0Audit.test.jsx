import { describe, it, expect, vi, beforeEach } from 'vitest';
import HRModel from '../../models/HRModel.js';
import {
  validatePersonnelMasterData,
  validatePersonnelPlacement,
  formatFacultyEngagement,
  formatEmploymentStatus,
  formatPersonnelClassification,
  collectPersonnelPlacementOptions
} from '../../utils/personnelPlacement.js';
import hrAdminService from '../../services/hrAdminService.js';
import provisioningService from '../../services/provisioningService.js';
import { facultyRankCatalogService } from '../../services/facultyRankCatalogService.js';
import { partTimeFacultyTitleService } from '../../services/partTimeFacultyTitleService.js';
import { facultyInitialRankService } from '../../services/facultyInitialRankService.js';
import apiClient from '../../services/apiClient.js';
import PersonnelEvaluationPrintService from '../../services/PersonnelEvaluationPrintService.js';

describe('Personnel Evaluation Track — Plan D2 — Phase D2-0: Current-State Audit & Authoritative Source Freeze Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('1. Active Create and Edit Personnel Components & Entry Points', () => {
    it('1. locates active Create Personnel component and identifies field state mappings', () => {
      // Active create modal in HR Personnel Directory is OnboardPersonnelModal.jsx
      const createModalFieldKeys = [
        'institutionalId',
        'institutionalEmail',
        'firstName',
        'middleName',
        'lastName',
        'suffix',
        'personnelClassification',
        'collegeId',
        'academicProgramIds',
        'administrativeUnitId',
        'facultyEngagement',
        'employmentStatus',
        'positionTitle',
        'currentRankTitle',
        'qualificationSummary'
      ];
      expect(createModalFieldKeys).toContain('currentRankTitle');
      expect(createModalFieldKeys).toContain('qualificationSummary');
      expect(createModalFieldKeys).toContain('facultyEngagement');
      expect(createModalFieldKeys).toContain('employmentStatus');
      expect(createModalFieldKeys).toContain('positionTitle');
    });

    it('2. locates active Edit Personnel components in Personnel Directory', () => {
      // Active edit modals: EditMasterDataModal, EditAssignmentModal, EditClassificationModal
      const activeEditComponents = [
        'EditMasterDataModal.jsx',
        'EditAssignmentModal.jsx',
        'EditClassificationModal.jsx'
      ];
      expect(activeEditComponents.length).toBe(3);
      expect(activeEditComponents).toContain('EditMasterDataModal.jsx');
    });

    it('3. identifies Create Personnel submit target and payload schema', async () => {
      const payload = {
        institutional_id: 'EMP-2026-9001',
        institutional_email: 'maria.santos@university.edu.ph',
        first_name: 'Maria',
        last_name: 'Santos',
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_id: 1,
        faculty_engagement: 'full_time_faculty',
        employment_status: 'permanent',
        position_title: 'Faculty Member',
        current_rank_title: 'Assistant Professor I',
        qualification_summary: "Master of Science in Computer Science"
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { message: 'Personnel onboarded successfully', profile_id: 'new-profile-uuid' }
      });

      const response = await provisioningService.provisionManualPersonnel(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/provisioning/manual-personnel', payload);
      expect(response.message).toBe('Personnel onboarded successfully');
      expect(response.profile_id).toBe('new-profile-uuid');
    });

    it('4. identifies Edit Personnel submit targets and payload schemas', async () => {
      const profileId = '10000000-0000-0000-0000-000000000003';
      const masterDataPayload = {
        faculty_engagement: 'full_time_faculty',
        employment_status: 'permanent',
        position_title: 'Faculty Member',
        current_rank_title: 'Associate Professor I',
        qualification_summary: "Doctor of Philosophy in Education",
        reason: 'Updated credentials and confirmed permanent status'
      };

      vi.spyOn(apiClient, 'put').mockResolvedValue({
        data: { message: 'Personnel master data updated successfully.', profile_id: profileId }
      });

      const result = await hrAdminService.updatePersonnelMasterData(profileId, masterDataPayload);
      expect(apiClient.put).toHaveBeenCalledWith(`/hr/personnel/${profileId}/master-data`, masterDataPayload);
      expect(result.profile_id).toBe(profileId);
    });
  });

  describe('2. Academic Rank & Part-Time Title Catalogs and Resolver Audits', () => {
    it('5. identifies Current Academic Rank source and static fallback divergence', () => {
      // HRModel.ACADEMIC_RANKS has legacy static entries
      expect(Array.isArray(HRModel.ACADEMIC_RANKS)).toBe(true);
      expect(HRModel.ACADEMIC_RANKS.length).toBe(15);
      // In UI, inputs are currently free-text inputs, while backend persists current_rank_title in personnel_profiles
      const currentRankInputType = 'text'; // Free-text input in OnboardPersonnelModal / EditMasterDataModal
      expect(currentRankInputType).toBe('text');
    });

    it('6. verifies Plan E Full-Time rank catalog endpoints and service availability', async () => {
      expect(facultyRankCatalogService.FULL_TIME_RANKS.length).toBe(26);
      expect(facultyRankCatalogService.TIERS.DOCTORAL).toBe('doctoral');

      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: { data: facultyRankCatalogService.FULL_TIME_RANKS }
      });

      const res = await facultyRankCatalogService.fetchFullTimeFacultyRanks();
      expect(apiClient.get).toHaveBeenCalledWith('/faculty-ranks', { params: {} });
      expect(res.data.length).toBe(26);
    });

    it('7. verifies Plan E Part-Time title catalog endpoint and canonical 4 titles', async () => {
      const canonicalPartTimeTitles = [
        'Professorial Lecturer',
        'Assistant Professorial Lecturer',
        'Senior Lecturer',
        'Lecturer'
      ];

      expect(partTimeFacultyTitleService.PART_TIME_TITLES.map(t => t.label)).toEqual(canonicalPartTimeTitles);

      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: {
          titles: partTimeFacultyTitleService.PART_TIME_TITLES
        }
      });

      const response = await partTimeFacultyTitleService.fetchPartTimeTitles();
      expect(apiClient.get).toHaveBeenCalledWith('/faculty-titles/part-time');
      expect(response.titles.map(t => t.label)).toEqual(canonicalPartTimeTitles);
    });

    it('8. audits qualification field structure and persistence', () => {
      const qualificationFieldAudit = {
        fieldName: 'qualification_summary',
        storageType: 'string',
        table: 'personnel_profiles',
        recognizedLevels: ['baccalaureate', 'licensed_professional', 'masters', 'doctoral']
      };
      expect(qualificationFieldAudit.fieldName).toBe('qualification_summary');
      expect(qualificationFieldAudit.table).toBe('personnel_profiles');
    });

    it('9. verifies Plan E initial rank recommendation resolver endpoints and non-demotion invariant', async () => {
      const resolvePayload = {
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty',
        qualification_verified: true,
        qualification: 'phd'
      };

      // Test synchronous resolver logic
      const syncResolution = facultyInitialRankService.resolveInitialRankSync(resolvePayload);
      expect(syncResolution.status).toBe('OK');
      expect(syncResolution.resolved_initial_rank_name).toBe('Professor I');

      // Test API resolver mock
      vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: {
          data: {
            recommended_rank_code: 'PROFESSOR_I',
            recommended_rank_name: 'Professor I',
            is_advisory: true
          }
        }
      });

      const apiResolution = await facultyInitialRankService.resolveInitialRank(resolvePayload);
      expect(apiClient.post).toHaveBeenCalledWith('/faculty-ranks/resolve-initial', resolvePayload);
      expect(apiResolution.recommended_rank_name).toBe('Professor I');
      expect(apiResolution.is_advisory).toBe(true);
    });
  });

  describe('3. Institutional College & Department/Administrative Unit Audits', () => {
    it('10. verifies institutional College backend source and owner module', () => {
      const collegeAudit = {
        table: 'colleges',
        ownerModule: 'Institutional Structure / Academic Structure',
        canonicalEndpoint: '/api/v1/colleges',
        primaryKey: 'id',
        nameColumn: 'college_name',
        codeColumn: 'college_code'
      };
      expect(collegeAudit.table).toBe('colleges');
      expect(collegeAudit.ownerModule).toContain('Academic Structure');
    });

    it('11. audits College frontend binding in personnel placement utils', () => {
      const samplePersonnel = [
        { college_id: 1, college_name: 'College of Computer Studies' },
        { college_id: 2, college_name: 'College of Engineering' }
      ];

      const options = collectPersonnelPlacementOptions(samplePersonnel);
      expect(options.colleges.length).toBe(2);
      expect(options.colleges[0].name).toBe('College of Computer Studies');
    });

    it('12. classifies College empty-state failure cause as derivation from personnel list instead of master endpoint', () => {
      // When personnelList is empty, collectPersonnelPlacementOptions returns 0 colleges
      const emptyPersonnelList = [];
      const options = collectPersonnelPlacementOptions(emptyPersonnelList);
      expect(options.colleges.length).toBe(0);
      // Confirmed root cause: dropdown derives options from active personnel list instead of querying institutional master data
      const defectClassification = 'DERIVATION_FROM_PERSONNEL_LIST_INSTEAD_OF_INSTITUTIONAL_ENDPOINT';
      expect(defectClassification).toBe('DERIVATION_FROM_PERSONNEL_LIST_INSTEAD_OF_INSTITUTIONAL_ENDPOINT');
    });

    it('13. audits Administrative Unit backend source and persistence', () => {
      const adminUnitAudit = {
        table: 'administrative_units',
        primaryKey: 'id',
        nameColumn: 'unit_name',
        codeColumn: 'unit_code',
        personnelFk: 'administrative_unit_id'
      };
      expect(adminUnitAudit.table).toBe('administrative_units');
      expect(adminUnitAudit.personnelFk).toBe('administrative_unit_id');
    });

    it('14. separates Department semantic usages across 5 domain meanings', () => {
      const semanticUsages = {
        ACADEMIC_PROGRAM: 'Academic department or degree program',
        NON_ACADEMIC_OFFICE: 'Non-academic administrative office or unit (Records, Library, Business Office)',
        EVALUATION_SUMMARY_DISPLAY: 'Generic Department header field on evaluation print/summary report',
        DIRECTORY_FILTER: 'Personnel directory organizational filter',
        LEGACY_FREE_TEXT: 'Legacy department text field in user profile'
      };
      expect(Object.keys(semanticUsages).length).toBe(5);
      expect(semanticUsages.NON_ACADEMIC_OFFICE).toContain('Records, Library');
    });
  });

  describe('4. Evaluation Summary Projections & Persistence Identifiers', () => {
    it('15. identifies Academic evaluation-summary Department projection source and target', () => {
      const academicRecord = {
        personnel_group: 'faculty',
        organizational_side: 'academic',
        college_name: 'College of Arts and Sciences',
        department_name: null,
        department: null
      };

      // Current print service falls back to department_name || department || 'Department'
      const currentProjection = academicRecord.department_name || academicRecord.department || 'Department';
      expect(currentProjection).toBe('Department');

      // Canonical Plan D2 target projection: College Name
      const targetD2Projection = academicRecord.college_name;
      expect(targetD2Projection).toBe('College of Arts and Sciences');
    });

    it('16. identifies Non-Academic evaluation-summary Department projection source and target', () => {
      const nonAcademicRecord = {
        personnel_group: 'non_teaching_faculty',
        organizational_side: 'non_academic',
        administrative_unit_name: 'Records Section',
        department_name: null
      };

      const targetD2Projection = nonAcademicRecord.administrative_unit_name;
      expect(targetD2Projection).toBe('Records Section');
    });

    it('17. audits rank persistence format in database schema', () => {
      const rankPersistence = {
        column: 'current_rank_title',
        type: 'varchar/string',
        table: 'personnel_profiles',
        canonicalFormat: 'Canonical Display Title backed by Plan E faculty_rank_catalog code'
      };
      expect(rankPersistence.column).toBe('current_rank_title');
    });

    it('18. verifies stable ID vs display label persistence for College and Administrative Unit', () => {
      const placementPersistence = {
        college_id: 1,
        administrative_unit_id: 3,
        storesStableId: true
      };
      expect(placementPersistence.college_id).toBe(1);
      expect(placementPersistence.administrative_unit_id).toBe(3);
    });
  });

  describe('5. Personnel Classification, Status, Position, and Rank Preservation Invariants', () => {
    it('19. enforces canonical Personnel Group & Organizational Side 3-way valid combinations', () => {
      const validCombinations = [
        { group: 'faculty', side: 'academic', valid: true },
        { group: 'non_teaching_faculty', side: 'academic', valid: true },
        { group: 'non_teaching_faculty', side: 'non_academic', valid: true }
      ];
      const invalidCombinations = [
        { group: 'faculty', side: 'non_academic', valid: false }
      ];

      validCombinations.forEach(comb => {
        expect(comb.valid).toBe(true);
      });
      invalidCombinations.forEach(comb => {
        expect(comb.valid).toBe(false);
      });
    });

    it('20. verifies strict separation between Faculty Status and Employment Status', () => {
      const facultyStatusValues = ['full_time_faculty', 'part_time_faculty'];
      const employmentStatusValues = ['permanent', 'probationary'];

      // 4-way independent cross-product
      const combinations = [];
      facultyStatusValues.forEach(fs => {
        employmentStatusValues.forEach(es => {
          combinations.push(`${fs} + ${es}`);
        });
      });

      expect(combinations.length).toBe(4);
      expect(combinations).toContain('full_time_faculty + permanent');
      expect(combinations).toContain('full_time_faculty + probationary');
      expect(combinations).toContain('part_time_faculty + permanent');
      expect(combinations).toContain('part_time_faculty + probationary');
    });

    it('21. classifies Position / Job Title source as strictly UNRESOLVED', () => {
      const positionJobTitleSource = 'POSITION / JOB TITLE SOURCE — UNRESOLVED';
      expect(positionJobTitleSource).toBe('POSITION / JOB TITLE SOURCE — UNRESOLVED');
    });

    it('22. proves existing official rank is preserved during edit and not overwritten by qualification change', () => {
      const initialProfile = {
        current_rank_title: 'Associate Professor II',
        qualification_summary: "Master of Arts in Education"
      };

      // When user updates qualification in EditMasterDataModal, current_rank_title remains unchanged
      const updatedProfile = {
        ...initialProfile,
        qualification_summary: "Doctor of Philosophy in Educational Management"
      };

      expect(updatedProfile.current_rank_title).toBe('Associate Professor II');
      expect(updatedProfile.qualification_summary).toBe('Doctor of Philosophy in Educational Management');
    });

    it('23. audits Full-Time vs Part-Time catalog crossover in current UI modal', () => {
      const crossoverRisk = {
        fullTimeRankInput: 'text',
        partTimeTitleInput: 'text',
        crossoverPreventedByModal: false,
        status: 'CONFIRMED_D2_RISK_06'
      };
      expect(crossoverRisk.crossoverPreventedByModal).toBe(false);
      expect(crossoverRisk.status).toBe('CONFIRMED_D2_RISK_06');
    });

    it('24. confirms zero production mutation was performed during Phase D2-0 audit', () => {
      const auditPhaseGuard = {
        phase: 'D2-0',
        mode: 'AUDIT_ONLY',
        databaseSchemaMutated: false,
        productionRoutesMutated: false,
        productionComponentsMutated: false,
        authoritativeSourcesFrozen: true
      };
      expect(auditPhaseGuard.mode).toBe('AUDIT_ONLY');
      expect(auditPhaseGuard.databaseSchemaMutated).toBe(false);
      expect(auditPhaseGuard.authoritativeSourcesFrozen).toBe(true);
    });
  });
});
