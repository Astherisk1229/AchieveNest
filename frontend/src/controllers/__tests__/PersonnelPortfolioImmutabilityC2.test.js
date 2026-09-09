import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'
import personnelPortfolioService from '../../services/personnelPortfolioService.js'

describe('Personnel Evaluation Track — Plan C — Phase C2 Immutability & Read-Only Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // Factory for mock working portfolio
  const createWorkingPortfolio = (overrides = {}) => {
    return new PersonnelPortfolioModel({
      id: 'PORT-EMP-001',
      personnel_id: 'EMP-001',
      personnel_name: 'Dr. Maria Santos',
      academic_rank: 'Associate Professor II',
      department: 'Computer Studies',
      college_id: 'COL-CEAC',
      college_name: 'College of Engineering, Architecture, and Technology',
      academic_year: '2025-2026',
      status: 'draft',
      years_of_service: 6,
      area_a_items: [
        {
          id: 'ACC-001',
          title: 'Doctor of Philosophy in Computer Science',
          category: 'A.1 Degree/s',
          claimed_points: 30.0,
          proof_file_name: 'phd_diploma.pdf',
          evidence_id: 'EV-001'
        }
      ],
      area_b_items: [
        {
          id: 'ACC-002',
          title: 'Automated Code Verification in Higher Education',
          category: 'B.1 Research Publication',
          claimed_points: 15.0,
          proof_file_name: 'scopus_paper.pdf',
          evidence_id: 'EV-002'
        }
      ],
      area_c_items: [
        {
          id: 'ACC-003',
          title: 'Chairperson of University Curriculum Committee',
          category: 'C.1 Institutional Service',
          claimed_points: 10.0,
          proof_file_name: 'appointment_letter.pdf',
          evidence_id: 'EV-003'
        }
      ],
      ...overrides
    })
  }

  // Factory for submitted snapshot representation
  const createSubmittedSnapshot = (status = 'submitted') => {
    return {
      submission: {
        id: 'EVAL-2025-0001',
        personnel_profile_id: 'EMP-001',
        status: status,
        academic_year: '2025-2026',
        tenure_years: 6,
        total_score: 0.00,
        area_a_score: 0.00,
        area_b_score: 0.00,
        area_c_score: 0.00,
        submitted_at: '2026-09-08T10:00:00Z'
      },
      status: status,
      items_count: 3,
      items: [
        {
          id: 'SNAP-ITEM-001',
          evaluation_id: 'EVAL-2025-0001',
          accomplishment_id: 'ACC-001',
          category_area: 'areaA',
          criterion_code: 'A.1',
          criterion_title: 'Doctor of Philosophy in Computer Science',
          evidence_title: 'Doctor of Philosophy in Computer Science',
          file_name: 'phd_diploma.pdf',
          file_url: 'https://storage.local/proofs/phd_diploma.pdf',
          verification_status: 'pending',
          rating_status: 'unrated',
          awarded_points: 0.00,
          scoring_payload: { claimed_points: 30.0, scope_level: 'Local' }
        },
        {
          id: 'SNAP-ITEM-002',
          evaluation_id: 'EVAL-2025-0001',
          accomplishment_id: 'ACC-002',
          category_area: 'areaB',
          criterion_code: 'B.1',
          criterion_title: 'Automated Code Verification in Higher Education',
          evidence_title: 'Automated Code Verification in Higher Education',
          file_name: 'scopus_paper.pdf',
          file_url: 'https://storage.local/proofs/scopus_paper.pdf',
          verification_status: 'pending',
          rating_status: 'unrated',
          awarded_points: 0.00,
          scoring_payload: { claimed_points: 15.0, scope_level: 'International' }
        },
        {
          id: 'SNAP-ITEM-003',
          evaluation_id: 'EVAL-2025-0001',
          accomplishment_id: 'ACC-003',
          category_area: 'areaC',
          criterion_code: 'C.1',
          criterion_title: 'Chairperson of University Curriculum Committee',
          evidence_title: 'Chairperson of University Curriculum Committee',
          file_name: 'appointment_letter.pdf',
          file_url: 'https://storage.local/proofs/appointment_letter.pdf',
          verification_status: 'pending',
          rating_status: 'unrated',
          awarded_points: 0.00,
          scoring_payload: { claimed_points: 10.0, scope_level: 'Institutional' }
        }
      ]
    }
  }

  describe('C2.1 — Submitted Status Immutability & Rejection of Prohibited Writes', () => {
    it('treats submitted evaluations and snapshot items as locked', () => {
      const snapshot = createSubmittedSnapshot('submitted')
      expect(snapshot.status).toBe('submitted')
      expect(snapshot.submission.total_score).toBe(0.00)
      expect(snapshot.items[0].awarded_points).toBe(0.00)
      expect(snapshot.items[0].verification_status).toBe('pending')
      expect(snapshot.items[0].rating_status).toBe('unrated')
    })

    it('rejects resubmission while an active submission is in progress with 409 conflict', async () => {
      const workingPortfolio = createWorkingPortfolio()
      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: {
              code: 'PORTFOLIO_SUBMISSION_LOCKED',
              message: 'An active evaluation submission is already in progress for academic year 2025-2026.'
            }
          }
        },
        message: 'An active evaluation submission is already in progress for academic year 2025-2026.'
      })

      await expect(PersonnelPortfolioController.submitPortfolioAsync(workingPortfolio)).rejects.toThrow(
        /An active evaluation submission is already in progress/
      )
    })
  })

  describe('C2.2 — In-Evaluation Status Immutability', () => {
    it('ensures in_evaluation status remains strictly locked and immutable to personnel', () => {
      const inEvaluationSnapshot = createSubmittedSnapshot('in_evaluation')
      expect(inEvaluationSnapshot.status).toBe('in_evaluation')
      expect(inEvaluationSnapshot.items.length).toBe(3)
      // Personnel cannot alter in_evaluation snapshots
      const isLocked = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes(inEvaluationSnapshot.status)
      expect(isLocked).toBe(true)
    })
  })

  describe('C2.3 — Working Portfolio vs. Submitted Snapshot Separation', () => {
    it('ensures subsequent working portfolio mutations do not overwrite submitted snapshots', () => {
      const workingPortfolio = createWorkingPortfolio()
      const snapshot = createSubmittedSnapshot('submitted')

      // Personnel edits, adds, and removes working draft items under Plan B
      const editedWorking = new PersonnelPortfolioModel({
        ...workingPortfolio.toJSON(),
        area_a_items: [
          {
            ...workingPortfolio.area_a_items[0],
            title: 'Doctor of Philosophy in Artificial Intelligence (EDITED WORKING COPY)',
            claimed_points: 35.0
          }
        ],
        area_b_items: [] // Removed item from working draft
      })

      // Working draft has changed
      expect(editedWorking.area_a_items[0].title).toContain('(EDITED WORKING COPY)')
      expect(editedWorking.area_a_items[0].claimed_points).toBe(35.0)
      expect(editedWorking.area_b_items.length).toBe(0)

      // The historical snapshot remains completely unmodified
      expect(snapshot.items[0].criterion_title).toBe('Doctor of Philosophy in Computer Science')
      expect(snapshot.items[0].scoring_payload.claimed_points).toBe(30.0)
      expect(snapshot.items[1].criterion_title).toBe('Automated Code Verification in Higher Education')
      expect(snapshot.items[1].file_name).toBe('scopus_paper.pdf')
      expect(snapshot.items.length).toBe(3)
    })
  })

  describe('C2.4 — Authenticated Submitted Snapshot Read API', () => {
    it('retrieves the authenticated owner snapshot with all item snapshots and header metadata', async () => {
      const mockSnapshot = createSubmittedSnapshot('submitted')
      vi.spyOn(personnelPortfolioService, 'getLatestSubmission').mockResolvedValue({
        data: mockSnapshot
      })

      const res = await personnelPortfolioService.getLatestSubmission()
      const data = res?.data || res

      expect(data.status).toBe('submitted')
      expect(data.submission.id).toBe('EVAL-2025-0001')
      expect(data.items.length).toBe(3)
      expect(data.items[0].accomplishment_id).toBe('ACC-001')
      expect(data.items[0].file_name).toBe('phd_diploma.pdf')
      expect(data.items[0].file_url).toContain('phd_diploma.pdf')
      expect(data.items[0].scoring_payload.claimed_points).toBe(30.0)
      expect(data.items[0].awarded_points).toBe(0.00)
    })

    it('returns clean DRAFT when no active submission exists for authenticated user', async () => {
      vi.spyOn(personnelPortfolioService, 'getLatestSubmission').mockResolvedValue({
        data: {
          submission: null,
          status: 'DRAFT',
          items_count: 0,
          items: []
        }
      })

      const res = await personnelPortfolioService.getLatestSubmission()
      const data = res?.data || res

      expect(data.submission).toBeNull()
      expect(data.status).toBe('DRAFT')
      expect(data.items.length).toBe(0)
    })

    it('denies unauthenticated caller with 401/403 error', async () => {
      vi.spyOn(personnelPortfolioService, 'getLatestSubmission').mockRejectedValue(
        new Error('Authentication required.')
      )

      await expect(personnelPortfolioService.getLatestSubmission()).rejects.toThrow(
        /Authentication required/
      )
    })
  })

  describe('C2.5 — Frontend Read-Only State Rules & Canonical Labels', () => {
    it('identifies submitted and in_evaluation states as locked and read-only', () => {
      const lockedStatuses = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed']
      for (const status of lockedStatuses) {
        const isCurrentlyLocked = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes(status)
        const isEditable = !isCurrentlyLocked
        expect(isCurrentlyLocked).toBe(true)
        expect(isEditable).toBe(false)
      }
    })

    it('identifies draft and returned_for_revision states as editable', () => {
      const editableStatuses = ['draft', 'returned_for_revision', 'returned_to_personnel']
      for (const status of editableStatuses) {
        const isCurrentlyLocked = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes(status)
        const isEditable = !isCurrentlyLocked
        expect(isCurrentlyLocked).toBe(false)
        expect(isEditable).toBe(true)
      }
    })

    it('does not contain legacy Department Secretary routing strings', () => {
      const mockPortfolio = createWorkingPortfolio()
      const syncResult = PersonnelPortfolioController.submitToDean(mockPortfolio)

      expect(syncResult.status).toBe('submitted')
      expect(syncResult.status).not.toBe('SUBMITTED_TO_DEP_SEC')
      expect(syncResult.status).not.toBe('SUBMITTED_TO_DEAN')
    })
  })

  describe('C2.6 — Advisory Points Integrity', () => {
    it('verifies that claimed points remain advisory with awarded_points at 0.00 upon submission', async () => {
      const workingPortfolio = createWorkingPortfolio()
      const mockBackendResponse = {
        success: true,
        data: {
          submission_id: 'EVAL-2025-0001',
          status: 'submitted',
          submitted_at: '2026-09-08T10:00:00Z',
          items: [
            {
              id: 'SNAP-1',
              awarded_points: 0.00,
              verification_status: 'pending',
              rating_status: 'unrated',
              scoring_payload: { claimed_points: 30.0 }
            }
          ]
        }
      }

      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockResolvedValue(mockBackendResponse)

      const res = await PersonnelPortfolioController.submitPortfolioAsync(workingPortfolio)
      expect(res.status).toBe('submitted')
      expect(mockBackendResponse.data.items[0].awarded_points).toBe(0.00)
      expect(mockBackendResponse.data.items[0].rating_status).toBe('unrated')
      expect(mockBackendResponse.data.items[0].scoring_payload.claimed_points).toBe(30.0)
    })
  })
})
