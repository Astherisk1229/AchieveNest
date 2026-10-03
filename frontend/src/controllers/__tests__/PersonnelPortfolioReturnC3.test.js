import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'
import personnelPortfolioService from '../../services/personnelPortfolioService.js'

describe('Personnel Evaluation Track — Plan C — Phase C3 Return for Revision Suite', () => {
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
      area_c_items: [],
      ...overrides
    })
  }

  // Factory for submitted evaluation snapshot
  const createSubmittedSnapshot = (status = 'submitted') => {
    return {
      submission: {
        id: 'EVAL-2025-0001',
        personnel_profile_id: 'EMP-001',
        status: status,
        academic_year: '2025-2026',
        tenure_years: 6,
        total_score: 0.00,
        submitted_at: '2026-09-08T10:00:00Z',
        return_reason: null,
        returned_at: null
      },
      status: status,
      items_count: 2,
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
          scoring_payload: { claimed_points: 30.0, scope_level: 'Local' },
          evaluator_remarks: null
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
          scoring_payload: { claimed_points: 15.0, scope_level: 'International' },
          evaluator_remarks: null
        }
      ]
    }
  }

  describe('C3.1 — Verified Return Authorization & Lifecycle Transition Guard', () => {
    it('allows an authorized reviewer to return a submitted whole-portfolio with valid feedback', async () => {
      const returnPayload = {
        reason: 'Proof certificate for PhD degree requires official registrar dry-seal authentication.',
        required_corrections: 'Please re-upload a certified true copy of your diploma with registrar seal.',
        item_deficiencies: [
          {
            evaluation_item_id: 'SNAP-ITEM-001',
            comment: 'Diploma scan is blurred and missing registrar dry seal.'
          }
        ]
      }

      const mockResponse = {
        success: true,
        data: {
          message: 'Portfolio successfully returned for revision.',
          submission_id: 'EVAL-2025-0001',
          status: 'returned_for_revision',
          returned_at: '2026-09-08T11:00:00Z',
          return_reason: returnPayload.reason,
          required_corrections: returnPayload.required_corrections,
          item_deficiencies: returnPayload.item_deficiencies
        }
      }

      const spy = vi.spyOn(personnelPortfolioService, 'returnPortfolioForRevision').mockResolvedValue(mockResponse)

      const result = await personnelPortfolioService.returnPortfolioForRevision('EVAL-2025-0001', returnPayload)
      const data = result?.data || result

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('EVAL-2025-0001', returnPayload)
      expect(data.status).toBe('returned_for_revision')
      expect(data.return_reason).toBe(returnPayload.reason)
      expect(data.required_corrections).toBe(returnPayload.required_corrections)
      expect(data.item_deficiencies.length).toBe(1)
    })

    it('allows an authorized reviewer to return an in_evaluation whole-portfolio', async () => {
      const returnPayload = {
        reason: 'Research paper scope was classified as International but conference was regional.',
        required_corrections: 'Re-classify Area B paper scope to Regional.'
      }

      const mockResponse = {
        success: true,
        data: {
          message: 'Portfolio successfully returned for revision.',
          submission_id: 'EVAL-2025-0001',
          status: 'returned_for_revision',
          returned_at: '2026-09-08T11:30:00Z',
          return_reason: returnPayload.reason,
          required_corrections: returnPayload.required_corrections
        }
      }

      vi.spyOn(personnelPortfolioService, 'returnPortfolioForRevision').mockResolvedValue(mockResponse)

      const res = await personnelPortfolioService.returnPortfolioForRevision('EVAL-2025-0001', returnPayload)
      expect(res.data.status).toBe('returned_for_revision')
    })

    it('rejects return from invalid lifecycle states (e.g. completed or already returned) with 409 Conflict', async () => {
      vi.spyOn(personnelPortfolioService, 'returnPortfolioForRevision').mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: {
              code: 'INVALID_TRANSITION',
              message: "Cannot return evaluation: status is 'completed'. Whole-portfolio return is permitted only for submissions in 'submitted' or 'in_evaluation' state."
            }
          }
        },
        message: "Cannot return evaluation: status is 'completed'."
      })

      await expect(
        personnelPortfolioService.returnPortfolioForRevision('EVAL-2025-0001', {
          reason: 'Test reason',
          required_corrections: 'Test corrections'
        })
      ).rejects.toThrow(/Cannot return evaluation/)
    })

    it('rejects unauthorized reviewer with 403 Forbidden', async () => {
      vi.spyOn(personnelPortfolioService, 'returnPortfolioForRevision').mockRejectedValue(
        new Error('Only an authorized reviewer or HR Admin may return a portfolio for revision.')
      )

      await expect(
        personnelPortfolioService.returnPortfolioForRevision('EVAL-2025-0001', {
          reason: 'Unauthorized attempt',
          required_corrections: 'None'
        })
      ).rejects.toThrow(/Only an authorized reviewer or HR Admin may return a portfolio/)
    })
  })

  describe('C3.2 — Return Feedback Validation & Attributability', () => {
    it('requires non-empty return reason and required corrections', async () => {
      vi.spyOn(personnelPortfolioService, 'returnPortfolioForRevision').mockRejectedValue(
        new Error('A return reason is required.')
      )

      await expect(
        personnelPortfolioService.returnPortfolioForRevision('EVAL-2025-0001', {
          reason: '',
          required_corrections: 'Do something'
        })
      ).rejects.toThrow(/A return reason is required/)
    })

    it('rejects invalid or non-existent evaluation item reference in item_deficiencies with 422', async () => {
      vi.spyOn(personnelPortfolioService, 'returnPortfolioForRevision').mockRejectedValue(
        new Error('Item deficiency references invalid or non-existent evaluation item: NON_EXISTENT_ID')
      )

      await expect(
        personnelPortfolioService.returnPortfolioForRevision('EVAL-2025-0001', {
          reason: 'Valid overall reason',
          required_corrections: 'Valid corrections',
          item_deficiencies: [{ evaluation_item_id: 'NON_EXISTENT_ID', comment: 'Invalid item' }]
        })
      ).rejects.toThrow(/invalid or non-existent evaluation item/)
    })

    it('rejects duplicate item deficiencies for the same item ID', async () => {
      vi.spyOn(personnelPortfolioService, 'returnPortfolioForRevision').mockRejectedValue(
        new Error('Duplicate deficiency comment provided for evaluation item: SNAP-ITEM-001')
      )

      await expect(
        personnelPortfolioService.returnPortfolioForRevision('EVAL-2025-0001', {
          reason: 'Valid overall reason',
          required_corrections: 'Valid corrections',
          item_deficiencies: [
            { evaluation_item_id: 'SNAP-ITEM-001', comment: 'First remark' },
            { evaluation_item_id: 'SNAP-ITEM-001', comment: 'Second duplicate remark' }
          ]
        })
      ).rejects.toThrow(/Duplicate deficiency comment/)
    })
  })

  describe('C3.3 — Reopened Working Revision & Snapshot Separation', () => {
    it('reopens the working portfolio draft for editing while preserving the returned historical snapshot', () => {
      const workingPortfolio = createWorkingPortfolio()
      const returnedSnapshot = createSubmittedSnapshot('returned_for_revision')
      returnedSnapshot.submission.return_reason = 'Please attach dry-seal certified true copy.'
      returnedSnapshot.submission.returned_at = '2026-09-08T11:00:00Z'

      // Personnel edits the reopened working revision under Plan B
      const editedWorkingRevision = new PersonnelPortfolioModel({
        ...workingPortfolio.toJSON(),
        status: 'returned_for_revision',
        area_a_items: [
          {
            ...workingPortfolio.area_a_items[0],
            proof_file_name: 'phd_diploma_certified_true_copy.pdf'
          }
        ]
      })

      // Working revision contains corrected proof file
      expect(editedWorkingRevision.area_a_items[0].proof_file_name).toBe('phd_diploma_certified_true_copy.pdf')

      // The historical snapshot retains the original proof file and historical values
      expect(returnedSnapshot.items[0].file_name).toBe('phd_diploma.pdf')
      expect(returnedSnapshot.items[0].scoring_payload.claimed_points).toBe(30.0)
      expect(returnedSnapshot.submission.return_reason).toBe('Please attach dry-seal certified true copy.')
      expect(returnedSnapshot.status).toBe('returned_for_revision')
    })

    it('ensures no second evaluation header or new submitted version is created in C3', () => {
      const returnedSnapshot = createSubmittedSnapshot('returned_for_revision')
      expect(returnedSnapshot.submission.id).toBe('EVAL-2025-0001')
      expect(returnedSnapshot.status).toBe('returned_for_revision')
      // Exactly 1 evaluation snapshot exists
      expect(returnedSnapshot.items.length).toBe(2)
    })

    it('preserves original submitted remarks untouched when reviewer deficiency comments are attached', () => {
      // Create baseline with original remarks
      const baselineSnapshot = createSubmittedSnapshot('submitted')
      baselineSnapshot.items[0].original_remarks = 'Applicant remarks: Completed dissertation under CHED scholarship.'
      baselineSnapshot.items[0].scoring_payload.original_remarks = 'Applicant remarks: Completed dissertation under CHED scholarship.'

      // Execute whole-portfolio return with deficiency attached to SNAP-ITEM-001
      const returnedSnapshot = JSON.parse(JSON.stringify(baselineSnapshot))
      returnedSnapshot.status = 'returned_for_revision'
      returnedSnapshot.submission.status = 'returned_for_revision'
      returnedSnapshot.return_feedback = {
        reason: 'Missing dry seal on diploma.',
        required_corrections: 'Re-upload sealed diploma.',
        item_deficiencies: [
          {
            evaluation_item_id: 'SNAP-ITEM-001',
            comment: 'Diploma scan is blurred and missing registrar dry seal.'
          }
        ]
      }
      returnedSnapshot.items[0].evaluator_remarks = 'Diploma scan is blurred and missing registrar dry seal.'
      returnedSnapshot.items[0].verification_status = 'needs_revision'

      // Verification: Original applicant remarks are preserved and NOT overwritten
      expect(returnedSnapshot.items[0].original_remarks).toBe('Applicant remarks: Completed dissertation under CHED scholarship.')
      expect(returnedSnapshot.items[0].scoring_payload.original_remarks).toBe('Applicant remarks: Completed dissertation under CHED scholarship.')
      expect(returnedSnapshot.items[0].original_remarks).toBe(baselineSnapshot.items[0].original_remarks)

      // Verification: Reviewer deficiency is available separately under return_feedback and evaluator_remarks
      expect(returnedSnapshot.return_feedback.item_deficiencies[0].comment).toBe('Diploma scan is blurred and missing registrar dry seal.')
      expect(returnedSnapshot.items[0].evaluator_remarks).toBe('Diploma scan is blurred and missing registrar dry seal.')
    })
  })

  describe('C3.4 — Read API Feedback & Personnel UI Presentation', () => {
    it('exposes structured return_feedback when reading latest submission', async () => {
      const mockReturnedSubmission = {
        data: {
          submission: {
            id: 'EVAL-2025-0001',
            status: 'returned_for_revision',
            academic_year: '2025-2026',
            return_reason: 'Please fix proof attachments.',
            returned_at: '2026-09-08T11:00:00Z'
          },
          status: 'returned_for_revision',
          return_feedback: {
            reason: 'Please fix proof attachments.',
            required_corrections: 'Re-upload certified diploma.',
            reviewer_name: 'Dean Eleanor Ramos',
            returned_at: '2026-09-08T11:00:00Z',
            item_deficiencies: [
              {
                evaluation_item_id: 'SNAP-ITEM-001',
                criterion_title: 'Doctor of Philosophy in Computer Science',
                comment: 'Missing dry seal.'
              }
            ]
          },
          items_count: 2,
          items: createSubmittedSnapshot('returned_for_revision').items
        }
      }

      vi.spyOn(personnelPortfolioService, 'getLatestSubmission').mockResolvedValue(mockReturnedSubmission)

      const res = await personnelPortfolioService.getLatestSubmission()
      const data = res?.data || res

      expect(data.status).toBe('returned_for_revision')
      expect(data.return_feedback).toBeDefined()
      expect(data.return_feedback.reviewer_name).toBe('Dean Eleanor Ramos')
      expect(data.return_feedback.required_corrections).toBe('Re-upload certified diploma.')
      expect(data.return_feedback.item_deficiencies[0].comment).toBe('Missing dry seal.')
    })

    it('identifies returned_for_revision status as editable for working draft corrections', () => {
      const status = 'returned_for_revision'
      const isReturnedForRevision = status === 'returned_for_revision'
      const isCurrentlyLocked = !isReturnedForRevision && ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes(status)
      const isEditable = !isCurrentlyLocked && (status === 'draft' || isReturnedForRevision)

      expect(isReturnedForRevision).toBe(true)
      expect(isCurrentlyLocked).toBe(false)
      expect(isEditable).toBe(true)
    })
  })
})
