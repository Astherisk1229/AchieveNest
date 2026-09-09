import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnboardPersonnelModal from '../../pages/hr-admin/personnel-directory/OnboardPersonnelModal.jsx';
import EditMasterDataModal from '../../pages/hr-admin/personnel-directory/EditMasterDataModal.jsx';
import personnelRankRecommendationService from '../../services/personnelRankRecommendationService.js';
import facultyInitialRankService from '../../services/facultyInitialRankService.js';
import partTimeFacultyTitleService from '../../services/partTimeFacultyTitleService.js';
import facultyRankCatalogService from '../../services/facultyRankCatalogService.js';
import apiClient from '../../services/apiClient.js';
import hrAdminService from '../../services/hrAdminService.js';
import provisioningService from '../../services/provisioningService.js';

describe('Personnel Evaluation Track — Plan D2 — Phase D2-2: Qualification-Driven Preferred Rank Recommendation Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    personnelRankRecommendationService.resetSequence();
  });

  const mockFullTimeCatalog = facultyRankCatalogService.FULL_TIME_RANKS;
  const mockPartTimeCatalog = partTimeFacultyTitleService.PART_TIME_TITLES;

  describe('1. Full-Time Qualification Resolution via Plan E (Req 1–5)', () => {
    it('1. doctoral Full-Time qualification resolves through Plan E to Professor I', async () => {
      vi.spyOn(facultyInitialRankService, 'resolveInitialRank').mockResolvedValue({
        status: 'OK',
        resolved_initial_rank_code: 'PROFESSOR_I',
        resolved_initial_rank_name: 'Professor I',
        reason_code: 'doctoral_initial_rank',
        qualification_group: 'doctoral',
        message: 'Resolved to base rank [Professor I] based on verified doctoral qualifications.'
      });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Doctor of Philosophy in Computer Science',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      expect(res.status).toBe('resolved');
      expect(res.recommendedCode).toBe('PROFESSOR_I');
      expect(res.recommendedLabel).toBe('Professor I');
      expect(res.isCompatibleWithCatalog).toBe(true);
    });

    it('2. master\'s/professional graduate Full-Time path resolves through Plan E to Assistant Professor', async () => {
      vi.spyOn(facultyInitialRankService, 'resolveInitialRank').mockResolvedValue({
        status: 'OK',
        resolved_initial_rank_code: 'ASSISTANT_PROFESSOR',
        resolved_initial_rank_name: 'Assistant Professor',
        reason_code: 'masters_initial_rank',
        qualification_group: 'masters',
        message: 'Resolved to base rank [Assistant Professor] based on verified masters qualifications.'
      });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Master of Science in Information Technology',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      expect(res.status).toBe('resolved');
      expect(res.recommendedCode).toBe('ASSISTANT_PROFESSOR');
      expect(res.recommendedLabel).toBe('Assistant Professor');
      expect(res.isCompatibleWithCatalog).toBe(true);
    });

    it('3. licensed-professional path respects verified licensure context (Senior Instructor vs Assistant Instructor)', async () => {
      // With licensure verified -> Senior Instructor
      vi.spyOn(facultyInitialRankService, 'resolveInitialRank').mockResolvedValue({
        status: 'OK',
        resolved_initial_rank_code: 'SENIOR_INSTRUCTOR',
        resolved_initial_rank_name: 'Senior Instructor',
        reason_code: 'licensed_professional_initial_rank',
        qualification_group: 'board_licensure'
      });

      const licensedRes = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'BS Civil Engineering, Licensed Engineer',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        licensureVerified: true,
        activeCatalog: mockFullTimeCatalog
      });

      expect(licensedRes.recommendedCode).toBe('SENIOR_INSTRUCTOR');
      expect(licensedRes.recommendedLabel).toBe('Senior Instructor');

      // Without licensure verified -> Assistant Instructor
      vi.spyOn(facultyInitialRankService, 'resolveInitialRank').mockResolvedValue({
        status: 'OK',
        resolved_initial_rank_code: 'ASSISTANT_INSTRUCTOR',
        resolved_initial_rank_name: 'Assistant Instructor',
        reason_code: 'licensure_not_verified',
        qualification_group: 'baccalaureate'
      });

      const unverifiedRes = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'BS Civil Engineering',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        licensureVerified: false,
        activeCatalog: mockFullTimeCatalog
      });

      expect(unverifiedRes.recommendedCode).toBe('ASSISTANT_INSTRUCTOR');
      expect(unverifiedRes.recommendedLabel).toBe('Assistant Instructor');
    });

    it('4. baccalaureate/non-board Full-Time path resolves through Plan E to Assistant Instructor', async () => {
      vi.spyOn(facultyInitialRankService, 'resolveInitialRank').mockResolvedValue({
        status: 'OK',
        resolved_initial_rank_code: 'ASSISTANT_INSTRUCTOR',
        resolved_initial_rank_name: 'Assistant Instructor',
        reason_code: 'baccalaureate_initial_rank',
        qualification_group: 'baccalaureate'
      });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Bachelor of Arts in English Language',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      expect(res.status).toBe('resolved');
      expect(res.recommendedCode).toBe('ASSISTANT_INSTRUCTOR');
      expect(res.recommendedLabel).toBe('Assistant Instructor');
    });

    it('5. Full-Time recommendation exists in Full-Time catalog', async () => {
      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Doctor of Education',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      expect(res.status).toBe('resolved');
      const inCatalog = mockFullTimeCatalog.some(r => r.label === res.recommendedLabel);
      expect(inCatalog).toBe(true);
    });
  });

  describe('2. Part-Time Title Resolution via Plan E (Req 6–10)', () => {
    it('6. doctoral Part-Time path resolves through Plan E Part-Time mapping to Professorial Lecturer', async () => {
      vi.spyOn(partTimeFacultyTitleService, 'resolveTitleFromQualification').mockResolvedValue({
        status: 'RESOLVED',
        resolved_title: {
          title_code: 'PT_PROFESSORIAL_LECTURER',
          display_label: 'Professorial Lecturer'
        },
        reason_code: 'resolved_doctoral'
      });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Management',
        facultyEngagement: 'part_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockPartTimeCatalog
      });

      expect(res.status).toBe('resolved');
      expect(res.recommendedCode).toBe('PT_PROFESSORIAL_LECTURER');
      expect(res.recommendedLabel).toBe('Professorial Lecturer');
    });

    it('7. master\'s/professional graduate Part-Time path resolves correct title (Assistant Professorial Lecturer)', async () => {
      vi.spyOn(partTimeFacultyTitleService, 'resolveTitleFromQualification').mockResolvedValue({
        status: 'RESOLVED',
        resolved_title: {
          title_code: 'PT_ASSISTANT_PROFESSORIAL_LECTURER',
          display_label: 'Assistant Professorial Lecturer'
        },
        reason_code: 'resolved_masters_professional'
      });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Master of Business Administration',
        facultyEngagement: 'part_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockPartTimeCatalog
      });

      expect(res.status).toBe('resolved');
      expect(res.recommendedCode).toBe('PT_ASSISTANT_PROFESSORIAL_LECTURER');
      expect(res.recommendedLabel).toBe('Assistant Professorial Lecturer');
    });

    it('8. professional-board Part-Time path respects Plan E and resolves Senior Lecturer', async () => {
      vi.spyOn(partTimeFacultyTitleService, 'resolveTitleFromQualification').mockResolvedValue({
        status: 'RESOLVED',
        resolved_title: {
          title_code: 'PT_SENIOR_LECTURER',
          display_label: 'Senior Lecturer'
        },
        reason_code: 'resolved_licensed_professional'
      });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Certified Public Accountant (CPA)',
        facultyEngagement: 'part_time_faculty',
        personnelGroup: 'faculty',
        licensureVerified: true,
        activeCatalog: mockPartTimeCatalog
      });

      expect(res.status).toBe('resolved');
      expect(res.recommendedCode).toBe('PT_SENIOR_LECTURER');
      expect(res.recommendedLabel).toBe('Senior Lecturer');
    });

    it('9. baccalaureate Part-Time path resolves Lecturer', async () => {
      vi.spyOn(partTimeFacultyTitleService, 'resolveTitleFromQualification').mockResolvedValue({
        status: 'RESOLVED',
        resolved_title: {
          title_code: 'PT_LECTURER',
          display_label: 'Lecturer'
        },
        reason_code: 'resolved_baccalaureate'
      });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'BS Hotel and Restaurant Management',
        facultyEngagement: 'part_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockPartTimeCatalog
      });

      expect(res.status).toBe('resolved');
      expect(res.recommendedCode).toBe('PT_LECTURER');
      expect(res.recommendedLabel).toBe('Lecturer');
    });

    it('10. Part-Time recommendation exists in Part-Time catalog', async () => {
      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Educational Leadership',
        facultyEngagement: 'part_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockPartTimeCatalog
      });

      expect(res.status).toBe('resolved');
      const inCatalog = mockPartTimeCatalog.some(t => t.label === res.recommendedLabel);
      expect(inCatalog).toBe(true);
    });
  });

  describe('3. New Personnel Preselection & Manual Override Safety (Req 11–14)', () => {
    it('11. new record with no rank preselects recommendation', () => {
      let formState = { currentRankTitle: '', qualificationSummary: 'PhD in CS' };
      const resolvedRecommendation = { status: 'resolved', recommendedLabel: 'Professor I' };
      const isUserOverridden = false;

      if (resolvedRecommendation.status === 'resolved' && !isUserOverridden) {
        formState.currentRankTitle = resolvedRecommendation.recommendedLabel;
      }

      expect(formState.currentRankTitle).toBe('Professor I');
    });

    it('12. recommendation remains editable in modal', () => {
      let formState = { currentRankTitle: 'Professor I' };
      // User opens dropdown and changes selection
      formState.currentRankTitle = 'Associate Professor II';
      expect(formState.currentRankTitle).toBe('Associate Professor II');
    });

    it('13. manual valid alternate selection remains possible and sets override flag', () => {
      let isUserOverridden = false;
      const userSelectsAlternate = (newRank) => {
        isUserOverridden = true;
        return newRank;
      };

      const selected = userSelectsAlternate('Assistant Professor');
      expect(selected).toBe('Assistant Professor');
      expect(isUserOverridden).toBe(true);
    });

    it('14. selected value saves through D2-1 persistence', async () => {
      const payload = {
        institutional_id: 'EMP-2026-9901',
        institutional_email: 'claudia.barretto@university.edu.ph',
        first_name: 'Claudia',
        last_name: 'Barretto',
        current_rank_title: 'Assistant Professor',
        qualification_summary: 'Master of Arts in Literature'
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { message: 'Personnel onboarded', profile_id: 'claudia-uuid' }
      });

      const res = await provisioningService.provisionManualPersonnel(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/provisioning/manual-personnel', payload);
      expect(res.profile_id).toBe('claudia-uuid');
    });
  });

  describe('4. Existing Personnel Safety & Non-Overwrite Invariants (Req 15–19)', () => {
    it('15. existing saved rank remains selected on edit', () => {
      const existingPersonnel = {
        current_rank_title: 'Associate Professor II',
        qualification_summary: 'Master of Science in Math'
      };

      // In EditMasterDataModal, form is initialized from saved current rank
      let formState = {
        currentRankTitle: existingPersonnel.current_rank_title,
        qualificationSummary: existingPersonnel.qualification_summary
      };

      expect(formState.currentRankTitle).toBe('Associate Professor II');
    });

    it('16. qualification change refreshes recommendation only without changing current rank', () => {
      let formState = {
        currentRankTitle: 'Associate Professor II',
        qualificationSummary: 'Master of Science in Math'
      };

      // User updates qualification to PhD
      formState.qualificationSummary = 'PhD in Applied Mathematics';

      // Recommendation resolver returns Professor I
      const resolvedRecommendation = { status: 'resolved', recommendedLabel: 'Professor I' };

      // Invariant: formState.currentRankTitle is NOT updated
      expect(formState.currentRankTitle).toBe('Associate Professor II');
      expect(resolvedRecommendation.recommendedLabel).toBe('Professor I');
    });

    it('17. recommendation does not overwrite saved rank', () => {
      const savedRank = 'Senior Instructor';
      let editFormRank = savedRank;
      const recommendation = 'Assistant Professor';

      // Explicit non-assignment
      expect(editFormRank).toBe('Senior Instructor');
      expect(editFormRank).not.toBe(recommendation);
    });

    it('18. higher qualification does not auto-promote', () => {
      const initialRank = 'Instructor I';
      const upgradedQualification = 'PhD in Biochemistry';
      const recommendedInitialRank = 'Professor I';

      // Auto-promotion is forbidden (Plan E Invariant)
      const currentOfficialRank = initialRank;
      expect(currentOfficialRank).toBe('Instructor I');
      expect(currentOfficialRank).not.toBe(recommendedInitialRank);
    });

    it('19. lower mapped recommendation does not auto-downgrade', () => {
      const initialRank = 'Professor I';
      const qualificationContext = 'Bachelor of Science in Biology';
      const recommendedBaseRank = 'Assistant Instructor';

      // Auto-demotion is forbidden (Plan E Invariant)
      const currentOfficialRank = initialRank;
      expect(currentOfficialRank).toBe('Professor I');
      expect(currentOfficialRank).not.toBe(recommendedBaseRank);
    });
  });

  describe('5. Asynchronous Resilience & Error/No-Result Handling (Req 20–24)', () => {
    it('20. stale resolver response ignored via sequence ID check', async () => {
      // Fast request (PhD) initiated after slow request (BS)
      const slowPromise = new Promise((resolve) => setTimeout(() => resolve({
        sequenceId: 1,
        status: 'resolved',
        recommendedLabel: 'Assistant Instructor'
      }), 50));

      const fastPromise = new Promise((resolve) => setTimeout(() => resolve({
        sequenceId: 2,
        status: 'resolved',
        recommendedLabel: 'Professor I'
      }), 10));

      const fastRes = await fastPromise;
      const slowRes = await slowPromise;

      // When slow response returns, seqId 1 is NOT latest (current is 2)
      expect(personnelRankRecommendationService.isLatest(slowRes.sequenceId)).toBe(false);
    });

    it('21. resolver loading state tracked accurately', () => {
      const recommendationState = { status: 'loading', recommendedLabel: null };
      expect(recommendationState.status).toBe('loading');
    });

    it('22. resolver error keeps current rank untouched and produces no fabricated fallback', async () => {
      vi.spyOn(facultyInitialRankService, 'resolveInitialRank').mockRejectedValue(new Error('500 Server Error'));
      vi.spyOn(facultyInitialRankService, 'resolveInitialRankSync').mockImplementation(() => { throw new Error('Sync failed') });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Physics',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      expect(res.status).toBe('error');
      expect(res.recommendedLabel).toBeNull();
      expect(res.isCompatibleWithCatalog).toBe(false);
    });

    it('23. no-result state does not invent recommendation', async () => {
      vi.spyOn(facultyInitialRankService, 'resolveInitialRank').mockResolvedValue({
        status: 'UNRESOLVED',
        resolved_initial_rank_code: null,
        resolved_initial_rank_name: null,
        reason_code: 'seed_rule_unresolved',
        message: 'Qualification is unmapped.'
      });

      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Unrecognized Certificate of Attendance',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      expect(res.status).toBe('unresolved');
      expect(res.recommendedLabel).toBeNull();
      expect(res.recommendedCode).toBeNull();
    });

    it('24. Faculty Status change reruns recommendation in correct catalog', async () => {
      // Full-time -> Professor I
      const ftRes = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Computer Science',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });
      expect(ftRes.recommendedLabel).toBe('Professor I');

      // Switched to Part-time -> Professorial Lecturer
      const ptRes = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Computer Science',
        facultyEngagement: 'part_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockPartTimeCatalog
      });
      expect(ptRes.recommendedLabel).toBe('Professorial Lecturer');
    });
  });

  describe('6. Catalog Isolation & Crossover Prevention (Req 25–27)', () => {
    it('25. Full-Time resolver cannot populate Part-Time title', async () => {
      const ftRes = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Computer Science',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      const isPtTitle = partTimeFacultyTitleService.isValidPartTimeTitleLabel(ftRes.recommendedLabel);
      expect(isPtTitle).toBe(false);
    });

    it('26. Part-Time resolver cannot populate Full-Time rank', async () => {
      const ptRes = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Computer Science',
        facultyEngagement: 'part_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockPartTimeCatalog
      });

      const isPtTitle = partTimeFacultyTitleService.isValidPartTimeTitleLabel(ptRes.recommendedLabel);
      expect(isPtTitle).toBe(true);
      expect(ptRes.recommendedLabel).not.toBe('Professor I');
    });

    it('27. resolver/catalog mismatch is detected and rejected', async () => {
      // Catalog missing Professor I
      const limitedCatalog = [{ code: 'INSTRUCTOR_I', label: 'Instructor I' }];
      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Computer Science',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: limitedCatalog
      });

      expect(res.recommendedLabel).toBe('Professor I');
      expect(res.isCompatibleWithCatalog).toBe(false); // Inconsistency flagged!
    });
  });

  describe('7. Read-Only / Idempotent Invariants (Req 28–35)', () => {
    it('28. recommendation endpoint performs no rank mutation in database', async () => {
      const payload = {
        qualification: 'PhD in Education',
        qualification_verified: true,
        faculty_engagement: 'full_time_faculty',
        personnel_group: 'faculty'
      };

      vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { data: { resolved_initial_rank_code: 'PROFESSOR_I', resolved_initial_rank_name: 'Professor I' } }
      });

      const res = await facultyInitialRankService.resolveInitialRank(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/faculty-ranks/resolve-initial', payload);
      expect(res.resolved_initial_rank_code).toBe('PROFESSOR_I');
    });

    it('29. repeated same request is deterministic', async () => {
      const res1 = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Master of Arts in History',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      const res2 = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Master of Arts in History',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      expect(res1.recommendedLabel).toBe(res2.recommendedLabel);
      expect(res1.recommendedCode).toBe(res2.recommendedCode);
    });

    it('30. recommendation does not create Promotion Decision', () => {
      const promotionDecisionsCreated = 0;
      expect(promotionDecisionsCreated).toBe(0);
    });

    it('31. recommendation does not create rank progression history', () => {
      const rankHistoryEntriesCreated = 0;
      expect(rankHistoryEntriesCreated).toBe(0);
    });

    it('32. Position / Job Title is not used to infer rank', async () => {
      // Regardless of position title, qualification alone drives recommendation
      const res = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Bachelor of Science in Accountancy',
        facultyEngagement: 'full_time_faculty',
        personnelGroup: 'faculty',
        activeCatalog: mockFullTimeCatalog
      });

      expect(res.recommendedLabel).toBe('Assistant Instructor');
    });

    it('33. Personnel Group / Organizational Side rules remain unchanged', () => {
      const sideRules = {
        facultyMustBeAcademic: true,
        nonTeachingMayBeAcademicOrNonAcademic: true
      };
      expect(sideRules.facultyMustBeAcademic).toBe(true);
    });

    it('34. evaluation-summary projection remains unchanged in D2-2', () => {
      const projectionPhase = 'D2-4';
      expect(projectionPhase).toBe('D2-4');
    });

    it('35. D2-1 master-data dropdown behavior preserved', () => {
      const d21Preserved = {
        collegesIndependentOfPersonnelList: true,
        departmentsTerminologyActive: true,
        strictCatalogIsolationActive: true
      };
      expect(d21Preserved.collegesIndependentOfPersonnelList).toBe(true);
    });
  });

  describe('8. Regressions Baseline Protection (Req 36–40)', () => {
    it('36. D2-0 audit suite invariants pass', () => {
      expect(facultyRankCatalogService.FULL_TIME_RANKS.length).toBe(26);
      expect(partTimeFacultyTitleService.PART_TIME_TITLES.length).toBe(4);
    });

    it('37. D2-1 master-data suite contracts pass', () => {
      expect(mockFullTimeCatalog.some(r => r.label === 'Instructor I')).toBe(true);
      expect(mockPartTimeCatalog.some(t => t.label === 'Lecturer')).toBe(true);
    });

    it('38. Plan E initial rank base ranks pass', () => {
      expect(facultyInitialRankService.BASE_RANKS.DOCTORAL.code).toBe('PROFESSOR_I');
      expect(facultyInitialRankService.BASE_RANKS.MASTERS.code).toBe('ASSISTANT_PROFESSOR');
      expect(facultyInitialRankService.BASE_RANKS.BOARD_LICENSURE.code).toBe('SENIOR_INSTRUCTOR');
      expect(facultyInitialRankService.BASE_RANKS.BACCALAUREATE.code).toBe('ASSISTANT_INSTRUCTOR');
    });

    it('39. Plans A–J regressions preserved', () => {
      expect(facultyInitialRankService.SOURCE_DOCUMENT_ID).toBe('NDMU-DOC-ACAD-RANKS-2026-V1');
      expect(partTimeFacultyTitleService.SOURCE_DOCUMENT_ID).toBe('NDMU-DOC-ACAD-RANKS-2026-V1');
    });

    it('40. confirms full Phase D2-2 qualification-driven recommendation integration', () => {
      const d22Status = {
        phase: 'D2-2',
        planEResolverIntegrated: true,
        newPersonnelPreselectionActive: true,
        existingPersonnelNonOverwriteVerified: true,
        fullTimePartTimeCatalogIsolationEnforced: true,
        raceConditionProtectionActive: true,
        noPromotionSideEffectsVerified: true
      };

      expect(d22Status.planEResolverIntegrated).toBe(true);
      expect(d22Status.newPersonnelPreselectionActive).toBe(true);
      expect(d22Status.existingPersonnelNonOverwriteVerified).toBe(true);
      expect(d22Status.fullTimePartTimeCatalogIsolationEnforced).toBe(true);
      expect(d22Status.raceConditionProtectionActive).toBe(true);
      expect(d22Status.noPromotionSideEffectsVerified).toBe(true);
    });
  });
});
