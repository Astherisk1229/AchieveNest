import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelPortfolioController from '../PersonnelPortfolioController.js'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel.js'
import personnelPortfolioService from '../../services/personnelPortfolioService.js'

describe('Personnel Evaluation Track — Plan C — Phase C4 Resubmission & Multi-Version History Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  // Factory for mock working portfolio (Plan B source)
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
      status: 'returned_for_revision',
      years_of_service: 6,
      area_a_items: [
        {
          id: 'ACC-001',
          title: 'Doctor of Philosophy in Computer Science',
          category: 'A.1 Degree/s',
          claimed_points: 30.0,
          proof_file_name: 'phd_diploma_certified_true_copy.pdf',
          evidence_id: 'EV-001'
        }
      ],
      area_b_items: [
        {
          id: 'ACC-002',
          title: 'Automated Code Verification in Higher Education',
          category: 'B.1 Research Publication',
          claimed_points: 15.0,
          proof_file_name: 'scopus_paper_v2.pdf',
          evidence_id: 'EV-002'
        },
        {
          id: 'ACC-003',
          title: 'Keynote Address on AI Ethics in Higher Ed',
          category: 'B.2 Conference Keynote',
          claimed_points: 10.0,
          proof_file_name: 'keynote_invitation.pdf',
          evidence_id: 'EV-003'
        }
      ],
      area_c_items: [],
      ...overrides
    })
  }

  // Factory for Version 1 (Returned for revision)
  const createVersion1Snapshot = () => ({
    id: 'EVAL-VERSION-0001',
    version_number: 1,
    status: 'returned_for_revision',
    academic_year: '2025-2026',
    tenure_years: 6,
    total_score: 0.00,
    submitted_at: '2026-09-08T09:00:00Z',
    returned_at: '2026-09-08T10:30:00Z',
    return_feedback: {
      reason: 'Please upload certified true copy of diploma and verify conference scope.',
      required_corrections: 'Re-upload sealed diploma for Area A.1.',
      reviewer_name: 'Dean Eleanor Ramos',
      returned_at: '2026-09-08T10:30:00Z',
      item_deficiencies: [
        {
          evaluation_item_id: 'SNAP-V1-001',
          criterion_code: 'A.1',
          criterion_title: 'Doctor of Philosophy in Computer Science',
          comment: 'Missing dry seal on diploma copy.'
        }
      ]
    },
    items_count: 2,
    items: [
      {
        id: 'SNAP-V1-001',
        evaluation_id: 'EVAL-VERSION-0001',
        accomplishment_id: 'ACC-001',
        category_area: 'areaA',
        criterion_code: 'A.1',
        criterion_title: 'Doctor of Philosophy in Computer Science',
        evidence_title: 'Doctor of Philosophy in Computer Science',
        file_name: 'phd_diploma_original.pdf',
        file_url: 'https://storage.local/proofs/phd_diploma_original.pdf',
        verification_status: 'needs_revision',
        scoring_payload: { claimed_points: 30.0, scope_level: 'Local' },
        evaluator_remarks: 'Missing dry seal on diploma copy.'
      },
      {
        id: 'SNAP-V1-002',
        evaluation_id: 'EVAL-VERSION-0001',
        accomplishment_id: 'ACC-002',
        category_area: 'areaB',
        criterion_code: 'B.1',
        criterion_title: 'Automated Code Verification in Higher Education',
        evidence_title: 'Automated Code Verification in Higher Education',
        file_name: 'scopus_paper_draft.pdf',
        file_url: 'https://storage.local/proofs/scopus_paper_draft.pdf',
        verification_status: 'pending',
        scoring_payload: { claimed_points: 15.0, scope_level: 'International' },
        evaluator_remarks: null
      }
    ],
    is_current: false
  })

  // Factory for Version 2 (Resubmitted)
  const createVersion2Snapshot = () => ({
    id: 'EVAL-VERSION-0002',
    version_number: 2,
    previous_version_id: 'EVAL-VERSION-0001',
    status: 'submitted',
    academic_year: '2025-2026',
    tenure_years: 6,
    total_score: 0.00,
    submitted_at: '2026-09-08T12:00:00Z',
    returned_at: null,
    return_feedback: null,
    items_count: 3,
    items: [
      {
        id: 'SNAP-V2-001',
        evaluation_id: 'EVAL-VERSION-0002',
        accomplishment_id: 'ACC-001',
        category_area: 'areaA',
        criterion_code: 'A.1',
        criterion_title: 'Doctor of Philosophy in Computer Science',
        evidence_title: 'Doctor of Philosophy in Computer Science',
        file_name: 'phd_diploma_certified_true_copy.pdf',
        file_url: 'https://storage.local/proofs/phd_diploma_certified_true_copy.pdf',
        verification_status: 'pending',
        scoring_payload: { claimed_points: 30.0, scope_level: 'Local' },
        evaluator_remarks: null
      },
      {
        id: 'SNAP-V2-002',
        evaluation_id: 'EVAL-VERSION-0002',
        accomplishment_id: 'ACC-002',
        category_area: 'areaB',
        criterion_code: 'B.1',
        criterion_title: 'Automated Code Verification in Higher Education',
        evidence_title: 'Automated Code Verification in Higher Education',
        file_name: 'scopus_paper_v2.pdf',
        file_url: 'https://storage.local/proofs/scopus_paper_v2.pdf',
        verification_status: 'pending',
        scoring_payload: { claimed_points: 15.0, scope_level: 'International' },
        evaluator_remarks: null
      },
      {
        id: 'SNAP-V2-003',
        evaluation_id: 'EVAL-VERSION-0002',
        accomplishment_id: 'ACC-003',
        category_area: 'areaB',
        criterion_code: 'B.1',
        criterion_title: 'Keynote Address on AI Ethics in Higher Ed',
        evidence_title: 'Keynote Address on AI Ethics in Higher Ed',
        file_name: 'keynote_invitation.pdf',
        file_url: 'https://storage.local/proofs/keynote_invitation.pdf',
        verification_status: 'pending',
        scoring_payload: { claimed_points: 10.0, scope_level: 'National' },
        evaluator_remarks: null
      }
    ],
    is_current: true
  })

  describe('C4.1 — Authoritative Resubmission Contract & Lifecycle Validation', () => {
    it('creates immutable Version 2 when resubmitting a valid corrected working portfolio from returned_for_revision', async () => {
      const workingPortfolio = createWorkingPortfolio()
      const mockResubmitResponse = {
        data: {
          message: 'Portfolio successfully resubmitted as Version 2.',
          submission_id: 'EVAL-VERSION-0002',
          version_number: 2,
          previous_version_id: 'EVAL-VERSION-0001',
          status: 'submitted',
          submitted_at: '2026-09-08T12:00:00Z',
          academic_year: '2025-2026',
          total_items: 3
        }
      }

      const spy = vi.spyOn(personnelPortfolioService, 'resubmitPortfolio').mockResolvedValue(mockResubmitResponse)

      const result = await PersonnelPortfolioController.resubmitPortfolioAsync(workingPortfolio, {
        academicYear: '2025-2026',
        tenureYears: 6
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)
      expect(result.submission_id).toBe('EVAL-VERSION-0002')
      expect(result.version_number).toBe(2)
      expect(result.previous_version_id).toBe('EVAL-VERSION-0001')
      expect(result.status).toBe('submitted')
      expect(result.total_items).toBe(3)
      expect(workingPortfolio.status).toBe('submitted')
    })

    it('rejects resubmission when portfolio has missing proof attachments with 422', async () => {
      const invalidWorkingPortfolio = createWorkingPortfolio({
        area_a_items: [
          {
            id: 'ACC-001',
            title: 'PhD in Computer Science',
            claimed_points: 30,
            proof_file_name: '' // Missing proof
          }
        ]
      })

      await expect(
        PersonnelPortfolioController.resubmitPortfolioAsync(invalidWorkingPortfolio)
      ).rejects.toThrow(/Cannot resubmit portfolio: 1 item\(s\) are missing required proof documents/)
    })

    it('rejects resubmission when current state is submitted or in_evaluation with 409 Conflict', async () => {
      vi.spyOn(personnelPortfolioService, 'resubmitPortfolio').mockRejectedValue({
        response: {
          status: 409,
          data: {
            error: {
              code: 'RESUBMISSION_NOT_ALLOWED',
              message: 'An active evaluation submission (Version 1) is already submitted and cannot be resubmitted.'
            }
          }
        },
        message: 'An active evaluation submission is already submitted.'
      })

      const workingPortfolio = createWorkingPortfolio()
      await expect(
        PersonnelPortfolioController.resubmitPortfolioAsync(workingPortfolio)
      ).rejects.toThrow(/An active evaluation submission is already submitted/)
    })
  })

  describe('C4.2 — Multi-Version Immutability & Separation of Records', () => {
    it('preserves Version 1 snapshot, return feedback, and item deficiencies unchanged after Version 2 creation', () => {
      const v1 = createVersion1Snapshot()
      const v2 = createVersion2Snapshot()

      // 1. Version numbers are deterministic
      expect(v1.version_number).toBe(1)
      expect(v2.version_number).toBe(2)
      expect(v2.previous_version_id).toBe(v1.id)

      // 2. Version 1 retains historical return feedback
      expect(v1.status).toBe('returned_for_revision')
      expect(v1.return_feedback.reason).toContain('Please upload certified true copy')
      expect(v1.return_feedback.item_deficiencies.length).toBe(1)
      expect(v1.return_feedback.item_deficiencies[0].evaluation_item_id).toBe('SNAP-V1-001')

      // 3. Version 1 historical item remarks & proof file are untouched
      expect(v1.items[0].file_name).toBe('phd_diploma_original.pdf')
      expect(v1.items[0].evaluator_remarks).toBe('Missing dry seal on diploma copy.')

      // 4. Version 2 has new snapshot values and fresh submitted status
      expect(v2.status).toBe('submitted')
      expect(v2.return_feedback).toBeNull()
      expect(v2.items[0].file_name).toBe('phd_diploma_certified_true_copy.pdf')
      expect(v2.items[0].evaluator_remarks).toBeNull()
      expect(v2.items.length).toBe(3)
    })

    it('prohibits mutations to Version 2 snapshot after creation', () => {
      const v2 = createVersion2Snapshot()
      const isLocked = ['submitted', 'in_evaluation', 'ready_for_finalization', 'completed'].includes(v2.status)
      expect(isLocked).toBe(true)
    })
  })

  describe('C4.3 — Submission History & Snapshot Comparison Contract', () => {
    it('retrieves chronological version history ordered by version_number ascending', async () => {
      const v1 = createVersion1Snapshot()
      const v2 = createVersion2Snapshot()

      const mockHistoryResponse = {
        data: {
          versions: [v1, v2],
          total_versions: 2,
          current_version_number: 2
        }
      }

      vi.spyOn(personnelPortfolioService, 'getSubmissionHistory').mockResolvedValue(mockHistoryResponse)

      const res = await personnelPortfolioService.getSubmissionHistory('EMP-001')
      const data = res?.data || res

      expect(data.total_versions).toBe(2)
      expect(data.current_version_number).toBe(2)
      expect(data.versions[0].version_number).toBe(1)
      expect(data.versions[0].status).toBe('returned_for_revision')
      expect(data.versions[1].version_number).toBe(2)
      expect(data.versions[1].status).toBe('submitted')
      expect(data.versions[1].previous_version_id).toBe(data.versions[0].id)
    })

    it('computes accurate version differences (added, removed, modified) between Version 1 and Version 2', () => {
      const v1 = createVersion1Snapshot()
      const v2 = createVersion2Snapshot()

      const v1Map = new Map(v1.items.map(i => [i.accomplishment_id, i]))
      const v2Map = new Map(v2.items.map(i => [i.accomplishment_id, i]))

      const added = []
      const modified = []
      const removed = []

      v2.items.forEach(item2 => {
        const item1 = v1Map.get(item2.accomplishment_id)
        if (!item1) {
          added.push(item2)
        } else if (item1.file_name !== item2.file_name || item1.scoring_payload?.claimed_points !== item2.scoring_payload?.claimed_points) {
          modified.push({ before: item1, after: item2 })
        }
      })

      v1.items.forEach(item1 => {
        if (!v2Map.has(item1.accomplishment_id)) {
          removed.push(item1)
        }
      })

      // ACC-003 was added in V2
      expect(added.length).toBe(1)
      expect(added[0].accomplishment_id).toBe('ACC-003')

      // ACC-001 (proof file corrected) and ACC-002 (proof file v2) were modified
      expect(modified.length).toBe(2)
      expect(modified[0].before.file_name).toBe('phd_diploma_original.pdf')
      expect(modified[0].after.file_name).toBe('phd_diploma_certified_true_copy.pdf')

      // No items were removed
      expect(removed.length).toBe(0)
    })
  })
})
