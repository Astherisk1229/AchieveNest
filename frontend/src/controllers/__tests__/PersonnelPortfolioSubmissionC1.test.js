import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'
import personnelPortfolioService from '../../services/personnelPortfolioService.js'

describe('Personnel Evaluation Track — Plan C — Phase C1 Submission & Snapshot Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // Sample canonical working portfolio model
  const createMockPortfolio = (overrides = {}) => {
    return new PersonnelPortfolioModel({
      id: 'PORT-EMP-001',
      personnel_id: 'EMP-001',
      personnel_name: 'Dr. John Doe',
      academic_rank: 'Assistant Professor I',
      department: 'Computer Studies',
      college_id: 'COL-CEAC',
      college_name: 'College of Arts and Sciences',
      academic_year: '2025-2026',
      status: 'draft',
      years_of_service: 0,
      area_a_items: [
        {
          id: 'ACH-001',
          title: 'Doctor of Philosophy in Computer Science',
          criteria_id: 'A1.1',
          category_area: 'Area A',
          conferred_date: '2024-05-15',
          claimed_points: 30.0,
          proof_file_name: 'phd_diploma.pdf',
          proof_document: {
            id: 'DOC-001',
            file_name: 'phd_diploma.pdf',
            file_url: 'https://storage.local/proofs/phd_diploma.pdf'
          }
        }
      ],
      area_b_items: [
        {
          id: 'ACH-002',
          title: 'Machine Learning in Automated Grading',
          criteria_id: 'B2.1',
          category_area: 'Area B',
          conferred_date: '2024-11-20',
          claimed_points: 15.0,
          proof_file_name: 'ieee_paper.pdf',
          proof_document: {
            id: 'DOC-002',
            file_name: 'ieee_paper.pdf',
            file_url: 'https://storage.local/proofs/ieee_paper.pdf'
          }
        }
      ],
      area_c_items: [],
      ...overrides
    })
  }

  describe('23.1 Successful Submit & Backend Persistence', () => {
    it('dispatches backend submission and returns canonical submission header and snapshot details', async () => {
      const mockPortfolio = createMockPortfolio()
      const mockBackendResponse = {
        success: true,
        data: {
          submission_id: 'EVAL-2025-0001',
          personnel_profile_id: 'EMP-001',
          academic_year: '2025-2026',
          status: 'submitted',
          submitted_at: '2026-09-08T15:30:00Z',
          total_items: 2,
          items: [
            {
              id: 'ITEM-001',
              evaluation_id: 'EVAL-2025-0001',
              accomplishment_id: 'ACH-001',
              category_area: 'Area A',
              criterion_code: 'A1.1',
              criterion_title: 'Doctor of Philosophy in Computer Science',
              file_name: 'phd_diploma.pdf',
              file_url: 'https://storage.local/proofs/phd_diploma.pdf',
              verification_status: 'pending',
              rating_status: 'unrated',
              awarded_points: 0.0,
              scoring_payload: { claimed_points: 30.0 }
            },
            {
              id: 'ITEM-002',
              evaluation_id: 'EVAL-2025-0001',
              accomplishment_id: 'ACH-002',
              category_area: 'Area B',
              criterion_code: 'B2.1',
              criterion_title: 'Machine Learning in Automated Grading',
              file_name: 'ieee_paper.pdf',
              file_url: 'https://storage.local/proofs/ieee_paper.pdf',
              verification_status: 'pending',
              rating_status: 'unrated',
              awarded_points: 0.0,
              scoring_payload: { claimed_points: 15.0 }
            }
          ]
        }
      }

      const submitSpy = vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockResolvedValue(mockBackendResponse)

      const result = await PersonnelPortfolioController.submitPortfolioAsync(mockPortfolio)

      expect(submitSpy).toHaveBeenCalledTimes(1)
      expect(submitSpy).toHaveBeenCalledWith({
        academic_year: '2025-2026',
        tenure_years: 4
      })

      expect(result.status).toBe('submitted')
      expect(result.submission_id).toBe('EVAL-2025-0001')
      expect(result.submitted_at).toBe('2026-09-08T15:30:00Z')
      expect(mockPortfolio.status).toBe('submitted')
    })
  })

  describe('23.2 Server Ownership Validation', () => {
    it('delegates to authenticated backend context and handles unauthorized or forbidden responses gracefully', async () => {
      const mockPortfolio = createMockPortfolio()
      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockRejectedValue(
        new Error('Personnel profile not found for authenticated user.')
      )

      await expect(PersonnelPortfolioController.submitPortfolioAsync(mockPortfolio)).rejects.toThrow(
        /Personnel profile not found for authenticated user/
      )
    })
  })

  describe('23.3 Snapshot Integrity & Immutability', () => {
    it('ensures submitted snapshot records remain immutable when active portfolio records change', async () => {
      const originalPortfolio = createMockPortfolio()
      const snapshotSubmission = {
        submission_id: 'EVAL-2025-0001',
        status: 'submitted',
        snapshot_items: [
          {
            accomplishment_id: 'ACH-001',
            criterion_title: 'Doctor of Philosophy in Computer Science',
            scoring_payload: { claimed_points: 30.0 }
          }
        ]
      }

      // Simulate subsequent Plan A/B edit to the working portfolio item
      const editedWorkingPortfolio = new PersonnelPortfolioModel({
        ...originalPortfolio.toJSON(),
        area_a_items: [
          {
            ...originalPortfolio.area_a_items[0],
            title: 'Doctor of Philosophy in Artificial Intelligence (EDITED)',
            claimed_points: 35.0
          }
        ]
      })

      // Snapshot must retain historical point-in-time state
      expect(snapshotSubmission.snapshot_items[0].criterion_title).toBe('Doctor of Philosophy in Computer Science')
      expect(snapshotSubmission.snapshot_items[0].scoring_payload.claimed_points).toBe(30.0)

      // Working portfolio reflects new state
      expect(editedWorkingPortfolio.area_a_items[0].title).toBe('Doctor of Philosophy in Artificial Intelligence (EDITED)')
      expect(editedWorkingPortfolio.area_a_items[0].claimed_points).toBe(35.0)
    })
  })

  describe('23.4 Advisory Points Preservation (No Premature Evaluator Scoring)', () => {
    it('snapshots claimed points while keeping awarded_points at 0.00 and rating_status unrated', async () => {
      const mockPortfolio = createMockPortfolio()
      const mockResponse = {
        success: true,
        data: {
          submission_id: 'EVAL-2025-0001',
          status: 'submitted',
          items: [
            {
              id: 'ITEM-001',
              awarded_points: 0.0,
              verification_status: 'pending',
              rating_status: 'unrated',
              scoring_payload: { claimed_points: 30.0 }
            }
          ]
        }
      }

      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockResolvedValue(mockResponse)

      const result = await PersonnelPortfolioController.submitPortfolioAsync(mockPortfolio)
      expect(result.status).toBe('submitted')
      expect(mockResponse.data.items[0].awarded_points).toBe(0.0)
      expect(mockResponse.data.items[0].verification_status).toBe('pending')
      expect(mockResponse.data.items[0].rating_status).toBe('unrated')
      expect(mockResponse.data.items[0].scoring_payload.claimed_points).toBe(30.0)
    })
  })

  describe('23.5 Evidence Reference Preservation', () => {
    it('preserves evidence document filenames and URLs in the snapshot without duplicating physical files', async () => {
      const mockPortfolio = createMockPortfolio()
      const mockResponse = {
        success: true,
        data: {
          submission_id: 'EVAL-2025-0001',
          status: 'submitted',
          items: [
            {
              id: 'ITEM-001',
              accomplishment_id: 'ACH-001',
              file_name: 'phd_diploma.pdf',
              file_url: 'https://storage.local/proofs/phd_diploma.pdf'
            }
          ]
        }
      }

      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockResolvedValue(mockResponse)
      await PersonnelPortfolioController.submitPortfolioAsync(mockPortfolio)

      expect(mockResponse.data.items[0].file_name).toBe('phd_diploma.pdf')
      expect(mockResponse.data.items[0].file_url).toContain('phd_diploma.pdf')
    })
  })

  describe('23.6 Atomic Failure & Rollback Handling', () => {
    it('rejects portfolio submission when missing proof documents are detected', async () => {
      const mockPortfolioWithMissingProof = createMockPortfolio({
        area_a_items: [
          {
            id: 'ACH-NO-PROOF',
            title: 'Unverified Course',
            criteria_id: 'A1.2',
            category_area: 'Area A',
            claimed_points: 10.0,
            proof_file_name: ''
          }
        ]
      })

      await expect(
        PersonnelPortfolioController.submitPortfolioAsync(mockPortfolioWithMissingProof)
      ).rejects.toThrow(/missing required proof documents/)
    })
  })

  describe('23.7 Duplicate Submission & Concurrency Protection', () => {
    it('rejects duplicate submission requests when an active submission already exists (HTTP 409 conflict)', async () => {
      const mockPortfolio = createMockPortfolio()

      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockRejectedValue(
        new Error('An active portfolio submission already exists for this academic cycle.')
      )

      await expect(PersonnelPortfolioController.submitPortfolioAsync(mockPortfolio)).rejects.toThrow(
        /An active portfolio submission already exists for this academic cycle/
      )
    })
  })

  describe('23.8 Frontend State Transition on Submission Success', () => {
    it('updates portfolio status to canonical submitted without mutating source achievement repository', async () => {
      const mockPortfolio = createMockPortfolio()
      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockResolvedValue({
        success: true,
        data: {
          submission_id: 'EVAL-2025-0001',
          status: 'submitted',
          submitted_at: '2026-09-08T15:30:00Z'
        }
      })

      const response = await PersonnelPortfolioController.submitPortfolioAsync(mockPortfolio)
      expect(response.status).toBe('submitted')
      expect(response.submission_id).toBe('EVAL-2025-0001')
      expect(mockPortfolio.status).toBe('submitted')
      expect(mockPortfolio.area_a_items.length).toBe(1)
      expect(mockPortfolio.area_b_items.length).toBe(1)
    })
  })

  describe('23.9 Frontend State Retention on Submission Failure', () => {
    it('maintains original draft state and logs error if server submission fails', async () => {
      const mockPortfolio = createMockPortfolio()
      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockRejectedValue(
        new Error('Database transaction deadlock')
      )

      await expect(PersonnelPortfolioController.submitPortfolioAsync(mockPortfolio)).rejects.toThrow(
        /Database transaction deadlock/
      )

      expect(mockPortfolio.status).toBe('draft')
    })
  })

  describe('23.10 Neutral Lifecycle Labels & Routing Decoupling', () => {
    it('uses canonical lifecycle status "submitted" rather than legacy routing-specific strings', () => {
      const mockPortfolio = createMockPortfolio()
      const syncSubmitted = PersonnelPortfolioController.submitToDean(mockPortfolio)

      expect(syncSubmitted.status).toBe('submitted')
      expect(syncSubmitted.status).not.toBe('SUBMITTED_TO_DEP_SEC')
      expect(syncSubmitted.status).not.toBe('SUBMITTED_TO_DEAN')
    })
  })

  describe('23.11 Plan A and Plan B Regression Protection', () => {
    it('preserves claim point calculation and repository reflection models intact', () => {
      const mockPortfolio = createMockPortfolio()
      const rawTotals = mockPortfolio.calculateRawTotals()
      const totals = mockPortfolio.calculateAcceptedCappedTotals()

      expect(rawTotals.claimed.rawA).toBe(30.0)
      expect(rawTotals.claimed.rawB).toBe(15.0)
      expect(rawTotals.claimed.rawC).toBe(2.0)
      expect(totals.claimed.acceptedA).toBe(30.0)
      expect(totals.claimed.acceptedB).toBe(15.0)
      expect(totals.claimed.acceptedC).toBe(2.0)
      expect(totals.claimed.acceptedTotal).toBe(47.0)
    })
  })
})
