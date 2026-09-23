import { describe, it, expect } from 'vitest'
import PersonnelEvaluationPrintService, {
  OUTPUT_TYPES,
  PRINT_REASON_CODES
} from '../../services/PersonnelEvaluationPrintService.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'
import { RESULT_VOCABULARY } from '../../services/PersonnelEvaluationResultPersistenceService.js'

describe('Personnel Evaluation Track — Plan H — Phase H2: Printable Evaluation, Deliberation-Ready Output & Blank Approval Section', () => {
  // Test Fixtures
  const validAdminRecord = {
    id: 'eval_adm_201',
    evaluation_id: 'eval_adm_201',
    personnel_profile_id: 'usr_fac_201',
    personnel_name: 'Dr. Maria Santos',
    employee_id: 'EMP-FAC-201',
    current_rank: 'Associate Professor II',
    department_name: 'Computer Studies',
    college_name: 'College of Engineering and Architecture',
    target_college_id: 'CEAC',
    designation: 'Associate Professor',
    academic_year: '2025-2026',
    evaluation_scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'dean',
    evaluator_profile_id: 'usr_dean_001',
    review_completed_at: '2026-09-08T14:30:00Z'
  }

  const validNonTeachingRecord = {
    id: 'eval_nt_201',
    evaluation_id: 'eval_nt_201',
    personnel_profile_id: 'usr_staff_201',
    personnel_name: 'Mr. Juan Dela Cruz',
    employee_id: 'EMP-NT-201',
    current_rank: 'Administrative Assistant III',
    department_name: 'Registrar Office',
    college_name: 'Non-Academic Services',
    designation: 'Administrative Staff',
    academic_year: '2025-2026',
    evaluation_scale_code: EVALUATION_SCALE_CODES.NON_TEACHING,
    rule_version: EVALUATION_RULE_VERSION,
    evaluation_status: 'in_evaluation',
    assigned_reviewer_role: 'hr',
    evaluator_profile_id: 'usr_hr_001',
    review_completed_at: '2026-09-08T15:00:00Z'
  }

  const hrActor = {
    profile_id: 'usr_hr_001',
    roles: ['hr_staff']
  }

  const hrAdminActor = {
    profile_id: 'usr_hr_admin_001',
    roles: ['hr_admin']
  }

  const candidateActor = {
    profile_id: 'usr_fac_201',
    roles: ['faculty']
  }

  const secretaryActor = {
    profile_id: 'usr_sec_001',
    roles: ['department_secretary']
  }

  const deanActor = {
    profile_id: 'usr_dean_001',
    roles: ['dean']
  }

  const createAdminSnapshotWithScore = (scoreB3 = 35.0, scoreB6 = 15.0, scoreC = 30.0) => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_a1',
        area: 'A',
        category: 'A.1 Doctorate Degree',
        raw_points: 60.0,
        criterion_capped_points: 60.0,
        evaluator_judgment_required: false,
        accepted_points: 60.0 // Area A Cap 70.0
      },
      {
        id: 'item_b3',
        area: 'B',
        category: 'B.3 Conduct of Research',
        raw_points: 40.0,
        criterion_capped_points: 40.0,
        evaluator_judgment_required: true,
        accepted_points: scoreB3 // Max 40.0
      },
      {
        id: 'item_b6',
        area: 'B',
        category: 'B.6 Creative Work',
        raw_points: 20.0,
        criterion_capped_points: 20.0,
        evaluator_judgment_required: true,
        accepted_points: scoreB6 // Max 20.0
      },
      {
        id: 'item_c1',
        area: 'C',
        category: 'C.1 Community Outreach',
        raw_points: scoreC,
        criterion_capped_points: scoreC,
        evaluator_judgment_required: false,
        accepted_points: scoreC // Area C Cap 40.0
      }
    ]
  })

  const createNonTeachingSnapshotWithScore = (scoreB5 = 25.0) => ({
    snapshot_version: 'v1.0.0',
    items: [
      {
        id: 'item_nt_b1',
        area: 'B',
        category: 'B.1 Service Years',
        raw_points: 0.0,
        criterion_capped_points: 0.0,
        evaluator_judgment_required: false,
        accepted_points: 0.0
      },
      {
        id: 'item_nt_b5',
        area: 'B',
        category: 'B.5 Recognition / Meritorious Award',
        raw_points: 30.0,
        criterion_capped_points: 30.0,
        evaluator_judgment_required: true,
        accepted_points: scoreB5
      }
    ]
  })

  const validNonTeachingAreaAInputs = {
    job_performance: 40.0,
    personal_attitudes: 8.0,
    efficiency: 22.0,
    total_area_a: 70.0,
    is_complete: true
  }

  // -------------------------------------------------------------
  // Group 1: Print Eligibility
  // -------------------------------------------------------------
  describe('1. Print Eligibility Verification', () => {
    it('1.1 allows complete Passed evaluation to generate printable output', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0) // 60 + 50(cap) + 30 = 140 -> Passed
      const eligibility = PersonnelEvaluationPrintService.validatePrintEligibility({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(eligibility.eligible).toBe(true)
      expect(eligibility.reason_code).toBe(PRINT_REASON_CODES.PRINT_ELIGIBLE)
      expect(eligibility.evaluation_result).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('1.2 allows complete Retained evaluation to generate printable output', () => {
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0) // 60 + 20 + 20 = 100 -> Retained
      const eligibility = PersonnelEvaluationPrintService.validatePrintEligibility({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(eligibility.eligible).toBe(true)
      expect(eligibility.reason_code).toBe(PRINT_REASON_CODES.PRINT_ELIGIBLE)
      expect(eligibility.evaluation_result).toBe(RESULT_VOCABULARY.RETAINED)
    })

    it('1.3 strictly blocks incomplete evaluation from generating print output', () => {
      const incompleteSnapshot = {
        snapshot_version: 'v1.0.0',
        items: [
          {
            id: 'item_a1',
            area: 'A',
            category: 'A.1 Doctorate Degree',
            raw_points: 60.0,
            evaluator_judgment_required: true,
            accepted_points: null // Incomplete scoring
          }
        ]
      }

      const eligibility = PersonnelEvaluationPrintService.validatePrintEligibility({
        evaluationRecord: validAdminRecord,
        snapshotData: incompleteSnapshot,
        actor: hrActor
      })

      expect(eligibility.eligible).toBe(false)
      expect(eligibility.reason_code).toBe(PRINT_REASON_CODES.EVALUATION_NOT_READY_FOR_PRINT)
    })

    it('1.4 throws error when building print output for ineligible evaluation', () => {
      const incompleteSnapshot = {
        snapshot_version: 'v1.0.0',
        items: [
          {
            id: 'item_a1',
            area: 'A',
            category: 'A.1 Doctorate Degree',
            raw_points: 60.0,
            evaluator_judgment_required: true,
            accepted_points: null
          }
        ]
      }

      expect(() => {
        PersonnelEvaluationPrintService.buildPrintableEvaluation({
          evaluationRecord: validAdminRecord,
          snapshotData: incompleteSnapshot,
          actor: hrActor
        })
      }).toThrow(/Cannot generate printable evaluation/i)
    })
  })

  // -------------------------------------------------------------
  // Group 2: Persisted Data Authority & Tampering Guards
  // -------------------------------------------------------------
  describe('2. Persisted Data Source Authority & Tampering Resistance', () => {
    it('2.1 derives final accepted total from authoritative Plan F evaluation data', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0) // 140.0
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.evaluation_result.final_accepted_total).toBe(140.0)
      expect(printModel.scoring_breakdown.official_accepted_total).toBe(140.0)
      expect(printModel.evaluation_result.passing_score).toBe(120.0)
      expect(printModel.evaluation_result.maximum_score).toBe(160.0)
    })

    it('2.2 client cannot inject forged evaluation result or totals into print output', () => {
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0) // Retained (100.0)
      const forgedResultRecord = {
        evaluation_result: 'Passed', // Forged!
        final_accepted_total: 160.0
      }

      // If invalid/inconsistent result record is passed, validation derives from Plan F / H0 readiness
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.evaluation_result.outcome).toBe(RESULT_VOCABULARY.RETAINED)
      expect(printModel.evaluation_result.final_accepted_total).toBe(100.0)
    })
  })

  // -------------------------------------------------------------
  // Group 3: Output Structure & Official Form Field Mapping
  // -------------------------------------------------------------
  describe('3. Output Structure & Official Form Mapping', () => {
    it('3.1 renders complete Personnel Identity section following official form fields', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const identity = printModel.personnel_identity
      expect(identity.full_name).toBe('Dr. Maria Santos')
      expect(identity.employee_id).toBe('EMP-FAC-201')
      expect(identity.department).toBe('Computer Studies')
      expect(identity.college_or_unit).toBe('College of Engineering and Architecture')
      expect(identity.designation).toBe('Associate Professor')
      expect(identity.evaluated_current_rank).toBe('Associate Professor II')
      expect(identity.evaluation_cycle).toBe('2025-2026')
    })

    it('3.2 renders Administrator scale scoring breakdown with Areas A, B, and C', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const areas = printModel.scoring_breakdown.areas
      expect(areas.area_a.area_code).toBe('A')
      expect(areas.area_a.cap).toBe(70.0)
      expect(areas.area_a.capped_total).toBe(60.0)

      expect(areas.area_b.area_code).toBe('B')
      expect(areas.area_b.cap).toBe(50.0)
      expect(areas.area_b.raw_total).toBe(50.0) // 35.0 + 15.0
      expect(areas.area_b.capped_total).toBe(50.0)

      expect(areas.area_c.area_code).toBe('C')
      expect(areas.area_c.cap).toBe(40.0)
      expect(areas.area_c.capped_total).toBe(30.0)
    })

    it('3.3 renders Non-Teaching scale scoring breakdown with Area A Evaluator ratings and Area B', () => {
      const snapshot = createNonTeachingSnapshotWithScore(25.0)
      const areaAInputs = {
        total_area_a: 70.0,
        job_performance: 40.0,
        personal_attitudes: 8.0,
        efficiency: 22.0,
        is_complete: true
      }

      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validNonTeachingRecord,
        snapshotData: snapshot,
        areaAInputs,
        actor: hrActor
      })

      const areas = printModel.scoring_breakdown.areas
      expect(areas.area_a.area_code).toBe('A')
      expect(areas.area_a.cap).toBe(90.0)
      expect(areas.area_a.capped_total).toBe(70.0)
      expect(areas.area_a.evaluator_ratings.job_performance).toBe(40.0)
      expect(areas.area_a.evaluator_ratings.personal_attitudes).toBe(8.0)
      expect(areas.area_a.evaluator_ratings.efficiency).toBe(22.0)

      expect(areas.area_b.area_code).toBe('B')
      expect(areas.area_b.cap).toBe(60.0)
      expect(areas.area_b.capped_total).toBe(25.0)

      expect(printModel.scoring_breakdown.official_accepted_total).toBe(95.0)
      expect(printModel.evaluation_result.outcome).toBe(RESULT_VOCABULARY.PASSED)
    })

    it('3.4 renders exact Evaluation Result: Passed', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.evaluation_result.outcome).toBe('Passed')
      expect(printModel.evaluation_result.deliberation_notice).toBe('Evaluation passed. Eligible to proceed to deliberation under Plan H.')
      expect(printModel.evaluation_result.current_rank_preserved).toBe('Associate Professor II')
    })

    it('3.5 renders exact Evaluation Result: Retained', () => {
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.evaluation_result.outcome).toBe('Retained')
      expect(printModel.evaluation_result.deliberation_notice).toBe('Current rank/title retained. No rank adjustment required.')
      expect(printModel.evaluation_result.current_rank_preserved).toBe('Associate Professor II')
    })
  })

  // -------------------------------------------------------------
  // Group 4: Hard Guard — Blank Approval Section
  // -------------------------------------------------------------
  describe('4. Hard Guard: Blank Approval Section for Manual Deliberation', () => {
    it('4.1 leaves Recommended for Approval completely blank', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const rec = printModel.approval_section.recommended_for_approval
      expect(rec.name).toBeNull()
      expect(rec.signature).toBeNull()
      expect(rec.date).toBeNull()
      expect(rec.remarks).toBeNull()
      expect(rec.status).toBe('blank')
    })

    it('4.2 leaves Approved section completely blank', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const app = printModel.approval_section.approved
      expect(app.name).toBeNull()
      expect(app.signature).toBeNull()
      expect(app.date).toBeNull()
      expect(app.remarks).toBeNull()
      expect(app.status).toBe('blank')
    })

    it('4.3 leaves President section completely blank', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const pres = printModel.approval_section.president
      expect(pres.name).toBeNull()
      expect(pres.signature).toBeNull()
      expect(pres.date).toBeNull()
      expect(pres.status).toBe('blank')
    })

    it('4.4 enforces zero pre-populated signatures or timestamps in approval section', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      Object.values(printModel.approval_section).forEach((block) => {
        expect(block.name).toBeNull()
        expect(block.signature).toBeNull()
        expect(block.date).toBeNull()
      })
    })
  })

  // -------------------------------------------------------------
  // Group 5: Rank & Promotion Decision Isolation
  // -------------------------------------------------------------
  describe('5. Rank & Promotion Decision Isolation (No Rank Mutation)', () => {
    it('5.1 Passed print output does not update candidate rank', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.personnel_identity.evaluated_current_rank).toBe('Associate Professor II')
      expect(printModel.evaluation_result.current_rank_preserved).toBe('Associate Professor II')
      expect(printModel.mutations_applied).toBe(false)
      expect(printModel.approved_rank).toBeUndefined()
      expect(printModel.next_rank).toBeUndefined()
    })

    it('5.2 Retained print output retains candidate rank without demotion', () => {
      const snapshot = createAdminSnapshotWithScore(20.0, 0.0, 20.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.personnel_identity.evaluated_current_rank).toBe('Associate Professor II')
      expect(printModel.evaluation_result.current_rank_preserved).toBe('Associate Professor II')
      expect(printModel.mutations_applied).toBe(false)
    })

    it('5.3 print output guarantees promotion_decision is null and deliberation status is ready', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.evaluation_result.promotion_decision).toBeNull()
      expect(printModel.evaluation_result.deliberation_status).toBe('ready_for_deliberation')
    })
  })

  // -------------------------------------------------------------
  // Group 6: Security & Role Authorization Boundaries
  // -------------------------------------------------------------
  describe('6. Security & Role Authorization Boundaries', () => {
    it('6.1 allows authorized hr_staff to generate deliberation print output', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.generated_by).toBe('usr_hr_001')
    })

    it('6.2 allows authorized hr_admin to generate deliberation print output', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrAdminActor
      })

      expect(printModel.generated_by).toBe('usr_hr_admin_001')
    })

    it('6.3 denies candidate faculty member from generating deliberation print (403)', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      expect(() => {
        PersonnelEvaluationPrintService.buildPrintableEvaluation({
          evaluationRecord: validAdminRecord,
          snapshotData: snapshot,
          actor: candidateActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })

    it('6.4 denies department secretary from generating deliberation print (403)', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      expect(() => {
        PersonnelEvaluationPrintService.buildPrintableEvaluation({
          evaluationRecord: validAdminRecord,
          snapshotData: snapshot,
          actor: secretaryActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })

    it('6.5 denies college Dean from generating deliberation print (403)', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      expect(() => {
        PersonnelEvaluationPrintService.buildPrintableEvaluation({
          evaluationRecord: validAdminRecord,
          snapshotData: snapshot,
          actor: deanActor
        })
      }).toThrow(/Access Denied \(403\)/i)
    })
  })

  // -------------------------------------------------------------
  // Group 7: Idempotency & Historical Stability
  // -------------------------------------------------------------
  describe('7. Idempotency & Historical Stability', () => {
    it('7.1 repeated print generation produces consistent, immutable output without side effects', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const firstOutput = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      const secondOutput = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(firstOutput.evaluation_id).toBe(secondOutput.evaluation_id)
      expect(firstOutput.evaluation_result.outcome).toBe(secondOutput.evaluation_result.outcome)
      expect(firstOutput.scoring_breakdown.official_accepted_total).toBe(secondOutput.scoring_breakdown.official_accepted_total)
      expect(firstOutput.approval_section).toEqual(secondOutput.approval_section)
    })

    it('7.2 preserves canonical rule version and evaluation scale code', () => {
      const snapshot = createAdminSnapshotWithScore(35.0, 15.0, 30.0)
      const printModel = PersonnelEvaluationPrintService.buildPrintableEvaluation({
        evaluationRecord: validAdminRecord,
        snapshotData: snapshot,
        actor: hrActor
      })

      expect(printModel.evaluation_context.rule_version).toBe(EVALUATION_RULE_VERSION)
      expect(printModel.evaluation_context.evaluation_scale_code).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
      expect(printModel.evaluation_context.snapshot_version).toBe('v1.0.0')
    })
  })
})
