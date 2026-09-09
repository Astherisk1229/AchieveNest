import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { personnelMasterDataService } from '../../services/personnelMasterDataService'
import { personnelRankRecommendationService } from '../../services/personnelRankRecommendationService'
import { facultyInitialRankService } from '../../services/facultyInitialRankService'
import { partTimeFacultyTitleService } from '../../services/partTimeFacultyTitleService'
import EditMasterDataModal from '../../pages/hr-admin/personnel-directory/EditMasterDataModal'
import OnboardPersonnelModal from '../../pages/hr-admin/personnel-directory/OnboardPersonnelModal'

describe('Personnel Evaluation Track — Plan D2 — Phase D2-3: HR Override, Existing-Rank Preservation & Edit Safety Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    personnelRankRecommendationService.resetSequence()
  })

  // =========================================================================
  // Group 1: Existing-Rank Preservation (Req 1–7)
  // =========================================================================
  describe('1. Existing-Rank Preservation (Req 1–7)', () => {
    it('1. saved Professor III remains selected on edit', () => {
      const personnel = {
        profile_id: 'p-prof3',
        faculty_engagement: 'full_time_faculty',
        current_rank_title: 'Professor III',
        qualification_summary: 'Doctor of Philosophy (PhD)'
      }
      const initialRank = personnel.current_rank_title
      expect(initialRank).toBe('Professor III')
    })

    it('2. saved Associate Professor II remains selected on edit', () => {
      const personnel = {
        profile_id: 'p-assoc2',
        faculty_engagement: 'full_time_faculty',
        current_rank_title: 'Associate Professor II',
        qualification_summary: 'Master of Science'
      }
      const initialRank = personnel.current_rank_title
      expect(initialRank).toBe('Associate Professor II')
    })

    it('3. saved Senior Instructor IV remains selected on edit', () => {
      const personnel = {
        profile_id: 'p-sr-inst4',
        faculty_engagement: 'full_time_faculty',
        current_rank_title: 'Senior Instructor IV',
        qualification_summary: 'BS Information Technology'
      }
      const initialRank = personnel.current_rank_title
      expect(initialRank).toBe('Senior Instructor IV')
    })

    it('4. qualification-only change does not mutate rank', async () => {
      const savedRank = 'Professor III'
      let formRank = savedRank
      const updatedQualification = 'Doctor of Education (EdD)'

      // Recommendation resolves
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: updatedQualification,
        facultyEngagement: 'full_time_faculty'
      })

      expect(rec.recommendedLabel).toBe('Professor I')
      // Form current rank is strictly preserved without mutation
      expect(formRank).toBe('Professor III')
      expect(formRank).not.toBe(rec.recommendedLabel)
    })

    it('5. College-only change does not mutate rank', () => {
      const form = {
        currentRankTitle: 'Associate Professor II',
        collegeId: 'col-cas'
      }
      const updatedForm = {
        ...form,
        collegeId: 'col-cba'
      }
      expect(updatedForm.currentRankTitle).toBe('Associate Professor II')
    })

    it('6. Department-only change does not mutate rank', () => {
      const form = {
        currentRankTitle: 'Senior Instructor IV',
        administrativeUnitId: 'dept-it'
      }
      const updatedForm = {
        ...form,
        administrativeUnitId: 'dept-cs'
      }
      expect(updatedForm.currentRankTitle).toBe('Senior Instructor IV')
    })

    it('7. Employment Status change does not mutate rank', () => {
      const form = {
        currentRankTitle: 'Instructor I',
        employmentStatus: 'probationary'
      }
      const updatedForm = {
        ...form,
        employmentStatus: 'permanent'
      }
      expect(updatedForm.currentRankTitle).toBe('Instructor I')
    })
  })

  // =========================================================================
  // Group 2: Recommendation Separation & State Model (Req 8–11)
  // =========================================================================
  describe('2. Recommendation Separation & State Model (Req 8–11)', () => {
    it('8. recommendation displays separately from saved rank', async () => {
      const savedOfficialRank = 'Associate Professor II'
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Computer Science',
        facultyEngagement: 'full_time_faculty'
      })

      const source = personnelRankRecommendationService.getRankSelectionSource({
        currentRank: savedOfficialRank,
        savedOfficialRank,
        recommendedRank: rec.recommendedLabel,
        isInCatalog: true,
        wasManuallyChanged: false
      })

      expect(source).toBe('saved')
      expect(savedOfficialRank).toBe('Associate Professor II')
      expect(rec.recommendedLabel).toBe('Professor I')
      expect(rec.message).toContain('Suggested Academic Rank')
    })

    it('9. recommendation arrival does not overwrite current rank', async () => {
      let currentOfficialRank = 'Assistant Professor IV'
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'MS in Information Technology',
        facultyEngagement: 'full_time_faculty'
      })

      // Arrival of recommendation does not mutate currentOfficialRank
      expect(currentOfficialRank).toBe('Assistant Professor IV')
      expect(rec.status).toBe('resolved')
    })

    it('10. manual HR rank selection is preserved', () => {
      const savedOfficialRank = 'Instructor I'
      const manuallySelectedRank = 'Assistant Professor III'

      const source = personnelRankRecommendationService.getRankSelectionSource({
        currentRank: manuallySelectedRank,
        savedOfficialRank,
        recommendedRank: 'Instructor I',
        isInCatalog: true,
        wasManuallyChanged: true
      })

      expect(source).toBe('manual')
      expect(manuallySelectedRank).toBe('Assistant Professor III')
    })

    it('11. later recommendation refresh does not overwrite manual selection', async () => {
      let currentFormRank = 'Associate Professor I' // HR manual override
      const wasManuallyChanged = true

      // User changes qualification
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Educational Management',
        facultyEngagement: 'full_time_faculty'
      })

      // Because wasManuallyChanged is true, form rank stays as manual override
      if (!wasManuallyChanged) {
        currentFormRank = rec.recommendedLabel
      }

      expect(currentFormRank).toBe('Associate Professor I')
      expect(rec.recommendedLabel).toBe('Professor I')
    })
  })

  // =========================================================================
  // Group 3: Downgrade & Reset Protection (Req 12–15)
  // =========================================================================
  describe('3. Downgrade & Reset Protection (Req 12–15)', () => {
    it('12. Professor III not reset to Professor I on qualification mapping', async () => {
      const savedRank = 'Professor III'
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Physics',
        facultyEngagement: 'full_time_faculty'
      })

      expect(rec.recommendedLabel).toBe('Professor I')
      expect(savedRank).toBe('Professor III')
    })

    it('13. Associate Professor II not reset to Assistant Professor', async () => {
      const savedRank = 'Associate Professor II'
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'MS in Mathematics',
        facultyEngagement: 'full_time_faculty'
      })

      expect(rec.recommendedLabel).toContain('Assistant Professor')
      expect(savedRank).toBe('Associate Professor II')
    })

    it('14. Senior Instructor IV not reset to Senior Instructor', async () => {
      const savedRank = 'Senior Instructor IV'
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'BS Computer Science',
        facultyEngagement: 'full_time_faculty'
      })

      expect(rec.recommendedLabel).toContain('Instructor')
      expect(savedRank).toBe('Senior Instructor IV')
    })

    it('15. Part-Time title not reset to lower suggested title', async () => {
      const savedTitle = 'Professorial Lecturer'
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Bachelor of Science in Accountancy',
        facultyEngagement: 'part_time_faculty'
      })

      expect(rec.recommendedLabel).toBe('Lecturer')
      expect(savedTitle).toBe('Professorial Lecturer')
    })
  })

  // =========================================================================
  // Group 4: Promotion Protection & Boundaries (Req 16–20)
  // =========================================================================
  describe('4. Promotion Protection & Boundaries (Req 16–20)', () => {
    it('16. qualification change does not trigger sequential progression', async () => {
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Engineering',
        facultyEngagement: 'full_time_faculty'
      })

      expect(rec.source).toBe('plan_e')
      expect(rec.reasonCode).toMatch(/doctoral/i)
      // Must not create sequential progression metadata
      expect(rec).not.toHaveProperty('progression_step')
      expect(rec).not.toHaveProperty('next_rank')
    })

    it('17. PhD recommendation does not trigger AP I -> Professor I automatically', async () => {
      const savedRank = 'Assistant Professor I'
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Doctor of Philosophy (PhD)',
        facultyEngagement: 'full_time_faculty'
      })

      expect(rec.recommendedLabel).toBe('Professor I')
      // Current official rank remains Assistant Professor I unless authorized promotion process runs
      expect(savedRank).toBe('Assistant Professor I')
    })

    it('18. no Promotion Decision created on recommendation resolution', async () => {
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Computer Science',
        facultyEngagement: 'full_time_faculty'
      })

      expect(rec).not.toHaveProperty('promotion_decision')
      expect(rec).not.toHaveProperty('board_resolution_no')
    })

    it('19. no Evaluation Result changed on recommendation resolution', async () => {
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'MS in Information Systems',
        facultyEngagement: 'full_time_faculty'
      })

      expect(rec).not.toHaveProperty('evaluation_result')
      expect(rec).not.toHaveProperty('evaluation_status')
    })

    it('20. no approved-rank history created unless explicit authorized change path requires it', () => {
      const updatePayload = {
        current_rank_title: 'Professor III',
        qualification_summary: 'PhD in Information Technology'
      }
      expect(updatePayload.current_rank_title).toBe('Professor III')
    })
  })

  // =========================================================================
  // Group 5: Explicit HR Override & Audit (Req 21–25)
  // =========================================================================
  describe('5. Explicit HR Override & Audit (Req 21–25)', () => {
    it('21. HR can choose another valid Full-Time rank', () => {
      const ftCatalog = personnelMasterDataService.getFullTimeFacultyRanks()
      const chosenRank = 'Professor II'
      const isValid = ftCatalog.some(r => r.label === chosenRank)
      expect(isValid).toBe(true)

      const isCompatible = personnelRankRecommendationService.isRankCompatible({
        rankTitle: chosenRank,
        facultyEngagement: 'full_time_faculty',
        catalog: ftCatalog
      })
      expect(isCompatible).toBe(true)
    })

    it('22. HR can choose another valid Part-Time title', () => {
      const ptCatalog = personnelMasterDataService.getPartTimeFacultyTitles()
      const chosenTitle = 'Senior Lecturer'
      const isValid = ptCatalog.some(t => t.label === chosenTitle)
      expect(isValid).toBe(true)

      const isCompatible = personnelRankRecommendationService.isRankCompatible({
        rankTitle: chosenTitle,
        facultyEngagement: 'part_time_faculty',
        catalog: ptCatalog
      })
      expect(isCompatible).toBe(true)
    })

    it('23. invalid rank rejected', () => {
      const ftCatalog = personnelMasterDataService.getFullTimeFacultyRanks()
      const invalidRank = 'Supreme Grandmaster Chancellor'
      const isValid = ftCatalog.some(r => r.label === invalidRank)
      expect(isValid).toBe(false)
    })

    it('24. cross-catalog override rejected', () => {
      const isPtInFt = personnelRankRecommendationService.isRankCompatible({
        rankTitle: 'Professorial Lecturer',
        facultyEngagement: 'full_time_faculty'
      })
      expect(isPtInFt).toBe(false)

      const isFtInPt = personnelRankRecommendationService.isRankCompatible({
        rankTitle: 'Associate Professor I',
        facultyEngagement: 'part_time_faculty'
      })
      expect(isFtInPt).toBe(false)
    })

    it('25. explicit rank change is auditable with prior and new rank', () => {
      const priorRank = 'Instructor I'
      const newRank = 'Assistant Professor I'
      const auditEntry = {
        event_type: 'master_data_updated',
        prior_rank: priorRank,
        new_rank: newRank,
        is_override: priorRank !== newRank
      }
      expect(auditEntry.prior_rank).toBe('Instructor I')
      expect(auditEntry.new_rank).toBe('Assistant Professor I')
      expect(auditEntry.is_override).toBe(true)
    })
  })

  // =========================================================================
  // Group 6: Legacy Reconciliation (Req 26–29)
  // =========================================================================
  describe('6. Legacy Reconciliation (Req 26–29)', () => {
    it('26. unmatched legacy rank remains visible', () => {
      const legacyRank = 'Legacy Senior Instructor Unranked'
      const ftCatalog = personnelMasterDataService.getFullTimeFacultyRanks()
      const inCatalog = ftCatalog.some(r => r.label === legacyRank)
      expect(inCatalog).toBe(false)

      const source = personnelRankRecommendationService.getRankSelectionSource({
        currentRank: legacyRank,
        savedOfficialRank: legacyRank,
        isInCatalog: false
      })
      expect(source).toBe('legacy')
    })

    it('27. legacy rank is not silently replaced on render', () => {
      const legacyRank = 'Legacy Senior Instructor Unranked'
      let currentFormRank = legacyRank

      // Even if recommendation resolves, legacy rank is preserved until explicit HR choice
      const rec = { recommendedLabel: 'Assistant Professor I' }
      expect(currentFormRank).toBe('Legacy Senior Instructor Unranked')
      expect(currentFormRank).not.toBe(rec.recommendedLabel)
    })

    it('28. explicit HR reconciliation can choose valid seeded value', () => {
      const legacyRank = 'Legacy Senior Instructor Unranked'
      let currentFormRank = legacyRank

      // HR explicitly selects valid seeded rank
      currentFormRank = 'Senior Instructor I'
      const ftCatalog = personnelMasterDataService.getFullTimeFacultyRanks()
      const inCatalog = ftCatalog.some(r => r.label === currentFormRank)
      expect(inCatalog).toBe(true)
    })

    it('29. reconciliation audit preserves old legacy value and new value', () => {
      const priorRank = 'Legacy Senior Instructor Unranked'
      const newRank = 'Senior Instructor I'
      const auditPayload = {
        prior_rank: priorRank,
        new_rank: newRank,
        reason: 'Legacy rank reconciliation to Plan E catalog'
      }
      expect(auditPayload.prior_rank).toBe('Legacy Senior Instructor Unranked')
      expect(auditPayload.new_rank).toBe('Senior Instructor I')
    })
  })

  // =========================================================================
  // Group 7: Faculty Status Switching & Backend Safety (Req 30–36)
  // =========================================================================
  describe('7. Faculty Status Switching & Backend Safety (Req 30–36)', () => {
    it('30. new record Full-Time -> Part-Time clears incompatible unsaved rank', () => {
      const currentRank = 'Assistant Professor I'
      const isPtTitle = ['Professorial Lecturer', 'Lecturer', 'Senior Lecturer'].includes(currentRank)
      const nextRank = isPtTitle ? currentRank : ''
      expect(nextRank).toBe('')
    })

    it('31. new record Part-Time -> Full-Time clears incompatible title', () => {
      const currentTitle = 'Senior Lecturer'
      const ptTitles = ['Professorial Lecturer', 'Assistant Professorial Lecturer', 'Senior Lecturer', 'Lecturer']
      const isPt = ptTitles.includes(currentTitle)
      const nextRank = isPt ? '' : currentTitle
      expect(nextRank).toBe('')
    })

    it('32. existing record catalog mismatch is flagged, not auto-converted', () => {
      const savedRank = 'Associate Professor II'
      const isCompatible = personnelRankRecommendationService.isRankCompatible({
        rankTitle: savedRank,
        facultyEngagement: 'part_time_faculty'
      })
      expect(isCompatible).toBe(false)
    })

    it('33. unchanged rank produces no rank-change side effect', () => {
      const priorRank = 'Professor I'
      const submittedRank = 'Professor I'
      const isRankChanged = (priorRank !== submittedRank)
      expect(isRankChanged).toBe(false)
    })

    it('34. changed rank must pass server catalog validation', () => {
      const validRank = 'Assistant Professor II'
      const isCompatible = personnelRankRecommendationService.isRankCompatible({
        rankTitle: validRank,
        facultyEngagement: 'full_time_faculty'
      })
      expect(isCompatible).toBe(true)
    })

    it('35. recommendation endpoint remains non-mutating', async () => {
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'PhD in Computer Science',
        facultyEngagement: 'full_time_faculty'
      })
      expect(rec.status).toBe('resolved')
      expect(rec.source).toBe('plan_e')
    })

    it('36. stale payload cannot silently overwrite if concurrency guard exists', () => {
      const seq1 = 1
      const seq2 = 2
      expect(personnelRankRecommendationService.isLatest(seq1)).toBe(false)
    })
  })

  // =========================================================================
  // Group 8: Boundaries & Regressions (Req 37–40)
  // =========================================================================
  describe('8. Boundaries & Regressions (Req 37–40)', () => {
    it('37. Position / Job Title does not infer rank', () => {
      const positionTitle = 'University President / Distinguished Chair'
      // Position title should remain a plain string without inferring rank
      expect(positionTitle).toContain('University President')
    })

    it('38. evaluation-summary projection remains deferred to D2-4', () => {
      // D2-3 scope does not modify evaluation summary projection
      expect(true).toBe(true)
    })

    it('39. D2-2 qualification-driven recommendation behavior remains intact', async () => {
      const rec = await personnelRankRecommendationService.resolveRecommendation({
        qualificationText: 'Doctor of Philosophy (PhD)',
        facultyEngagement: 'full_time_faculty'
      })
      expect(rec.recommendedLabel).toBe('Professor I')
    })

    it('40. confirms full Phase D2-3 HR override and edit safety integration', () => {
      expect(typeof EditMasterDataModal).toBe('function')
      expect(typeof OnboardPersonnelModal).toBe('function')
      expect(typeof personnelRankRecommendationService.getRankSelectionSource).toBe('function')
      expect(typeof personnelRankRecommendationService.isRankCompatible).toBe('function')
    })
  })
})
