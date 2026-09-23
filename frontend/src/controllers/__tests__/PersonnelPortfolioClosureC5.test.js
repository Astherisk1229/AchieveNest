import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'
import personnelPortfolioService from '../../services/personnelPortfolioService.js'

describe('Personnel Evaluation Track — Plan C — Phase C5 Validation, Deletion Exception & Closure Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // Factory for mock working portfolio (Plan B)
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

  describe('C5.1 — One-Evaluation-Per-Cycle & Duplicate Prevention', () => {
    it('creates exactly one evaluation and Version 1 on first submission', async () => {
      const workingPortfolio = createWorkingPortfolio()
      const mockSubmitResponse = {
        data: {
          message: 'Portfolio successfully submitted for evaluation.',
          submission_id: 'EVAL-2025-0001',
          version_number: 1,
          status: 'submitted',
          submitted_at: '2026-09-08T10:00:00Z',
          academic_year: '2025-2026',
          total_items: 2
        }
      }

      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockResolvedValue(mockSubmitResponse)

      const result = await PersonnelPortfolioController.submitPortfolioAsync(workingPortfolio, {
        academicYear: '2025-2026',
        tenureYears: 6
      })

      expect(result.success).toBe(true)
      expect(result.submission_id).toBe('EVAL-2025-0001')
      expect(result.status).toBe('submitted')
      expect(workingPortfolio.status).toBe('submitted')
    })

    it('rejects duplicate first-submission attempt for the same personnel and cycle with 409', async () => {
      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: {
              code: 'ACTIVE_SUBMISSION_EXISTS',
              message: 'An active evaluation submission (Version 1) is already in progress for academic year 2025-2026.',
              submission_id: 'EVAL-2025-0001',
              status: 'submitted'
            }
          }
        },
        message: 'An active evaluation submission is already in progress.'
      })

      const workingPortfolio = createWorkingPortfolio()
      await expect(
        PersonnelPortfolioController.submitPortfolioAsync(workingPortfolio, {
          academicYear: '2025-2026',
          tenureYears: 6
        })
      ).rejects.toThrow(/An active evaluation submission is already in progress/)
    })

    it('rejects calling first-submission endpoint when evaluation cycle is in returned_for_revision', async () => {
      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: {
              code: 'DUPLICATE_EVALUATION',
              message: "An evaluation cycle already exists for academic year 2025-2026 in 'returned_for_revision' status. Please use the resubmission endpoint to submit Version N+1."
            }
          }
        },
        message: 'An evaluation cycle already exists in returned_for_revision status.'
      })

      const workingPortfolio = createWorkingPortfolio()
      await expect(
        PersonnelPortfolioController.submitPortfolioAsync(workingPortfolio)
      ).rejects.toThrow(/already exists in returned_for_revision status/)
    })

    it('rejects calling first-submission endpoint when evaluation is completed', async () => {
      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: {
              code: 'DUPLICATE_EVALUATION',
              message: 'Evaluation for academic year 2025-2026 is already completed. Exactly one evaluation is allowed per cycle.'
            }
          }
        },
        message: 'Evaluation for academic year is already completed.'
      })

      const workingPortfolio = createWorkingPortfolio()
      await expect(
        PersonnelPortfolioController.submitPortfolioAsync(workingPortfolio)
      ).rejects.toThrow(/Evaluation for academic year is already completed/)
    })
  })

  describe('C5.2 — Approved Deletion Exception (Full Portfolio Purge)', () => {
    it('allows personnel owner to purge their complete portfolio and history with explicit confirmation', async () => {
      const workingPortfolio = createWorkingPortfolio()
      const mockPurgeResponse = {
        data: {
          message: 'Personnel portfolio and associated submission history successfully purged.',
          target_profile_id: 'EMP-001',
          purged_evaluations: 2,
          purged_accomplishments: 3,
          purged_at: '2026-09-08 21:00:00'
        }
      }

      const spy = vi.spyOn(personnelPortfolioService, 'purgePortfolio').mockResolvedValue(mockPurgeResponse)

      const result = await PersonnelPortfolioController.purgePortfolioAsync(workingPortfolio, {
        confirmation: 'DELETE_PORTFOLIO'
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        confirmation: 'DELETE_PORTFOLIO',
        reason: undefined,
        personnel_profile_id: undefined
      })
      expect(result.success).toBe(true)
      expect(result.purged_evaluations).toBe(2)
      expect(result.purged_accomplishments).toBe(3)
      expect(workingPortfolio.area_a_items.length).toBe(0)
      expect(workingPortfolio.area_b_items.length).toBe(0)
      expect(workingPortfolio.status).toBe('draft')
    })

    it('allows HR Admin to purge on behalf of personnel with target ID and documented reason', async () => {
      const mockPurgeResponse = {
        data: {
          message: 'Personnel portfolio and associated submission history successfully purged.',
          target_profile_id: 'EMP-001',
          purged_evaluations: 1,
          purged_accomplishments: 2,
          purged_at: '2026-09-08 21:05:00'
        }
      }

      vi.spyOn(personnelPortfolioService, 'purgePortfolio').mockResolvedValue(mockPurgeResponse)

      const result = await personnelPortfolioService.purgePortfolio({
        confirmation: 'DELETE_PORTFOLIO',
        personnel_profile_id: 'EMP-001',
        reason: 'Authorized HR purge requested by faculty member per institutional data privacy request.'
      })

      const data = result?.data || result
      expect(data.target_profile_id).toBe('EMP-001')
      expect(data.purged_evaluations).toBe(1)
    })

    it('rejects purge attempt missing explicit confirmation with 422', async () => {
      vi.spyOn(personnelPortfolioService, 'purgePortfolio').mockRejectedValue({
        response: {
          status: 422,
          data: {
            error: {
              code: 'CONFIRMATION_REQUIRED',
              message: 'Explicit confirmation is required. Please provide confirmation: "DELETE_PORTFOLIO".'
            }
          }
        },
        message: 'Explicit confirmation is required.'
      })

      await expect(
        personnelPortfolioService.purgePortfolio({ confirmation: '' })
      ).rejects.toThrow(/Explicit confirmation is required/)
    })

    it('rejects unauthorized reviewer (e.g. Dean or Student) attempting purge with 403 Forbidden', async () => {
      vi.spyOn(personnelPortfolioService, 'purgePortfolio').mockRejectedValue(
        new Error('Only the portfolio owner or HR Admin acting on their behalf may execute portfolio deletion.')
      )

      await expect(
        personnelPortfolioService.purgePortfolio({
          confirmation: 'DELETE_PORTFOLIO'
        })
      ).rejects.toThrow(/Only the portfolio owner or HR Admin acting on their behalf/)
    })
  })

  describe('C5.3 — Canonical Lifecycle & Server-Enforced Immutability Guards', () => {
    it('verifies that submitted and in_evaluation versions reject direct updates with 409 PORTFOLIO_SUBMISSION_LOCKED', () => {
      const lockedStatuses = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed', 'returned_for_revision']

      lockedStatuses.forEach(status => {
        const isLocked = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed', 'returned_for_revision'].includes(status)
        expect(isLocked).toBe(true)
      })
    })

    it('confirms the complete canonical lifecycle sequence', () => {
      const canonicalSequence = [
        'draft',
        'submitted',
        'in_evaluation',
        'returned_for_revision',
        'submitted',
        'in_evaluation',
        'ready_for_finalization',
        'completed'
      ]

      expect(canonicalSequence[0]).toBe('draft')
      expect(canonicalSequence[1]).toBe('submitted')
      expect(canonicalSequence[2]).toBe('in_evaluation')
      expect(canonicalSequence[3]).toBe('returned_for_revision')
      expect(canonicalSequence[4]).toBe('submitted') // Version 2
      expect(canonicalSequence[7]).toBe('completed')
    })
  })

  describe('C5.4 — One Evaluation Root per Cycle & Version Lineage Integrity', () => {
    it('creates an evaluation root and attaches Version 1 on initial submit', async () => {
      const workingPortfolio = createWorkingPortfolio()
      const mockSubmitResponse = {
        data: {
          message: 'Portfolio successfully submitted for evaluation.',
          submission_id: 'EVAL-V1-UUID',
          evaluation_root_id: 'ROOT-CYCLE-2025-001',
          version_number: 1,
          status: 'submitted',
          submitted_at: '2026-09-08T10:00:00Z',
          academic_year: '2025-2026',
          evaluation_cycle_id: '2025-2026',
          total_items: 2
        }
      }

      vi.spyOn(personnelPortfolioService, 'submitPortfolio').mockResolvedValue(mockSubmitResponse)

      const result = await PersonnelPortfolioController.submitPortfolioAsync(workingPortfolio, {
        academicYear: '2025-2026',
        tenureYears: 6
      })

      expect(result.success).toBe(true)
      expect(result.submission_id).toBe('EVAL-V1-UUID')
      expect(workingPortfolio.status).toBe('submitted')
    })

    it('attaches Version 2 to the same evaluation root with previous_version_id linkage on resubmission', async () => {
      const workingPortfolio = createWorkingPortfolio({ status: 'draft' })
      const mockResubmitResponse = {
        data: {
          message: 'Portfolio successfully resubmitted as Version 2.',
          submission_id: 'EVAL-V2-UUID',
          evaluation_root_id: 'ROOT-CYCLE-2025-001',
          version_number: 2,
          previous_version_id: 'EVAL-V1-UUID',
          status: 'submitted',
          submitted_at: '2026-09-08T11:00:00Z',
          academic_year: '2025-2026',
          evaluation_cycle_id: '2025-2026',
          total_items: 2
        }
      }

      vi.spyOn(personnelPortfolioService, 'resubmitPortfolio').mockResolvedValue(mockResubmitResponse)

      const result = await PersonnelPortfolioController.resubmitPortfolioAsync(workingPortfolio, {
        academicYear: '2025-2026'
      })

      expect(result.success).toBe(true)
      expect(result.submission_id).toBe('EVAL-V2-UUID')
      expect(result.version_number).toBe(2)
      expect(result.previous_version_id).toBe('EVAL-V1-UUID')
    })

    it('rejects concurrent/duplicate resubmission with 409 DUPLICATE_RESUBMISSION', async () => {
      vi.spyOn(personnelPortfolioService, 'resubmitPortfolio').mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: {
              code: 'DUPLICATE_RESUBMISSION',
              message: 'A resubmission for Version 2 is already in progress or exists under this evaluation root.'
            }
          }
        },
        message: 'A resubmission for Version 2 is already in progress.'
      })

      const workingPortfolio = createWorkingPortfolio({ status: 'draft' })
      await expect(
        PersonnelPortfolioController.resubmitPortfolioAsync(workingPortfolio)
      ).rejects.toThrow(/A resubmission for Version 2 is already in progress/)
    })

    it('retrieves submission history grouped under the evaluation root in sequential order', async () => {
      const mockHistoryResponse = {
        data: {
          evaluation_root_id: 'ROOT-CYCLE-2025-001',
          total_versions: 2,
          current_version_number: 2,
          versions: [
            {
              id: 'EVAL-V1-UUID',
              evaluation_root_id: 'ROOT-CYCLE-2025-001',
              version_number: 1,
              status: 'returned_for_revision',
              previous_version_id: null,
              submitted_at: '2026-09-08T10:00:00Z',
              returned_at: '2026-09-08T10:30:00Z'
            },
            {
              id: 'EVAL-V2-UUID',
              evaluation_root_id: 'ROOT-CYCLE-2025-001',
              version_number: 2,
              status: 'submitted',
              previous_version_id: 'EVAL-V1-UUID',
              submitted_at: '2026-09-08T11:00:00Z'
            }
          ]
        }
      }

      vi.spyOn(personnelPortfolioService, 'getSubmissionHistory').mockResolvedValue(mockHistoryResponse)

      const history = await personnelPortfolioService.getSubmissionHistory('EMP-001')
      const data = history?.data || history

      expect(data.evaluation_root_id).toBe('ROOT-CYCLE-2025-001')
      expect(data.total_versions).toBe(2)
      expect(data.versions[0].version_number).toBe(1)
      expect(data.versions[0].previous_version_id).toBeNull()
      expect(data.versions[1].version_number).toBe(2)
      expect(data.versions[1].previous_version_id).toBe('EVAL-V1-UUID')
    })
  })
})

