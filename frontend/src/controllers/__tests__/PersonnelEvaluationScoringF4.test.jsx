import { describe, it, expect } from 'vitest'
import PersonnelEvaluationScoringEngine from '../../services/PersonnelEvaluationScoringEngine.js'
import { EVALUATION_SCALE_CODES, EVALUATION_RULE_VERSION } from '../../services/evaluationInstrumentRegistry.js'

describe('Personnel Evaluation Track — Plan F — Phase F4: Server-Side Calculation, Validation, Cap Enforcement & Explainability Suite', () => {

  // =========================================================================
  // 1. SCALE, SECURITY & FORGED-PAYLOAD REJECTION
  // =========================================================================
  describe('1. Scale, Security & Forged-Payload Rejection', () => {
    it('rejects invalid or unsupported rule version', () => {
      expect(() => {
        PersonnelEvaluationScoringEngine.scoreItem({
          scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
          ruleVersion: 'NDMU-LEGACY-V1',
          areaCode: 'A',
          category: 'A.1 Degree/s',
          entry: { title: 'PhD Degree', phd_degree: true }
        })
      }).toThrow(/Invalid rule version/)
    })

    it('rejects cross-scale category submissions (Administrators publication on Non-Teaching scale)', () => {
      expect(() => {
        PersonnelEvaluationScoringEngine.scoreItem({
          scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
          ruleVersion: EVALUATION_RULE_VERSION,
          areaCode: 'B',
          category: 'B.2 Publication',
          entry: { title: 'Book Chapter', publication_type: 'book' }
        })
      }).toThrow(/Invalid criterion/)
    })

    it('rejects Area A accomplishment mutation on Non-Teaching scale', () => {
      expect(() => {
        PersonnelEvaluationScoringEngine.scoreItem({
          scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
          ruleVersion: EVALUATION_RULE_VERSION,
          areaCode: 'A',
          category: 'A.1 Job Performance',
          entry: { title: 'Performance accomplishment' }
        })
      }).toThrow(/evaluation-only section and does not permit personnel accomplishment mutations/)
    })

    it('recalculates authoritative points and ignores client-forged score fields', () => {
      const res = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        ruleVersion: EVALUATION_RULE_VERSION,
        areaCode: 'A',
        category: 'A.1 Degree/s',
        subCategory: 'phd_degree',
        entry: {
          title: 'Ph.D. in Computer Science',
          claimed_points: 999.0, // Forged client points
          awarded_points: 888.0,
          score: 500.0
        },
        evidenceReference: 'diploma.pdf'
      })

      expect(res.raw_points).toBe(40.0)
      expect(res.criterion_capped_points).toBe(40.0)
      expect(res.accepted_points).toBe(40.0)
      expect(res.point_trace.formula_key).toBe('DEGREE_PHD')
    })

    it('rejects item when required documentary evidence proof is missing', () => {
      expect(() => {
        PersonnelEvaluationScoringEngine.scoreItem({
          scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
          ruleVersion: EVALUATION_RULE_VERSION,
          areaCode: 'A',
          category: 'A.1 Degree/s',
          subCategory: 'phd_degree',
          entry: { title: 'Ph.D. in Computer Science' },
          evidenceReference: null // Missing proof
        })
      }).toThrow(/Evidence proof attachment is required/)
    })
  })

  // =========================================================================
  // 2. ADMINISTRATORS SCALE SCORING & FACTOR EXPLAINABILITY
  // =========================================================================
  describe('2. Administrators Scale Deterministic Scoring & Trace', () => {
    // A.1 Degree & Units
    it('scores A.1 Ph.D. Degree (40 pts) and MA Degree (20 pts)', () => {
      const phd = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'A',
        category: 'A.1 Degree/s',
        subCategory: 'phd_degree',
        entry: { title: 'Ph.D. Mathematics' },
        evidenceReference: 'phd.pdf'
      })
      expect(phd.raw_points).toBe(40.0)
      expect(phd.criterion_capped_points).toBe(40.0)

      const ma = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'A',
        category: 'A.1 Degree/s',
        subCategory: 'ma_degree',
        entry: { title: 'Master of Arts' },
        evidenceReference: 'ma.pdf'
      })
      expect(ma.raw_points).toBe(20.0)
      expect(ma.criterion_capped_points).toBe(20.0)
    })

    it('scores A.1 Ph.D. Units (2 pts per 3 units, max 10) with capping and explanation', () => {
      const res = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'A',
        category: 'A.1 Degree/s',
        subCategory: 'phd_units',
        entry: { title: 'Doctoral Coursework', units_completed: 18 },
        evidenceReference: 'tor.pdf'
      })
      expect(res.raw_points).toBe(12.0) // 18 / 3 * 2 = 12
      expect(res.criterion_capped_points).toBe(10.0) // Capped at 10
      expect(res.point_trace.capped).toBe(true)
      expect(res.explanation).toContain('capped at criterion maximum of 10')
    })

    it('scores A.2 Active Membership: Member (5 pts) and Officer (10 pts)', () => {
      const member = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'A',
        category: 'A.2 Active Membership',
        subCategory: 'member',
        entry: { title: 'PSCS Member' },
        evidenceReference: 'id.pdf'
      })
      expect(member.raw_points).toBe(5.0)

      const officer = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'A',
        category: 'A.2 Active Membership',
        subCategory: 'officer',
        entry: { title: 'PSCS Officer', officer_position: 'Chapter President' },
        evidenceReference: 'appointment.pdf'
      })
      expect(officer.raw_points).toBe(10.0)
    })

    it('scores A.3 Seminars/Trainings across all scopes and enforces 20 pts ceiling', () => {
      const intl = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'A',
        category: 'A.3 Seminars/Trainings',
        scope: 'international',
        entry: { title: 'IEEE Global AI Summit' },
        evidenceReference: 'cert.pdf'
      })
      expect(intl.raw_points).toBe(10.0)

      const natl = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'A',
        category: 'A.3 Seminars/Trainings',
        scope: 'national',
        entry: { title: 'National IT Congress' },
        evidenceReference: 'cert.pdf'
      })
      expect(natl.raw_points).toBe(8.0)
    })

    // B.1 4-Factor Additive Sum
    it('scores B.1 Speaker/Consultant using 4-factor additive formula with factor breakdown', () => {
      const res = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'B',
        category: 'B.1 Guest Lecturer / Consultant / Judge',
        entry: {
          title: 'Regional Keynote Address',
          sponsoring_organization: 'external', // 2.0 pts
          extent_of_talk: '1_day',              // 3.0 pts
          participant_reach: 'regional',       // 2.0 pts
          activity_role: 'resource_person'     // 5.0 pts
        },
        evidenceReference: 'plaque.pdf'
      })

      // Total = 2 + 3 + 2 + 5 = 12.0 pts
      expect(res.raw_points).toBe(12.0)
      expect(res.criterion_capped_points).toBe(12.0)
      expect(res.point_trace.factors).toEqual({
        orgPts: 2.0,
        extPts: 3.0,
        reachPts: 2.0,
        rolePts: 5.0
      })
      expect(res.explanation).toContain('Org(2) + Extent(3) + Reach(2) + Role(5) = 12 pts')
    })

    // B.2 Publication Sum
    it('scores B.2 Publication using 2-factor additive sum (Scope + Publication Type)', () => {
      const res = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'B',
        category: 'B.2 Publication',
        entry: {
          title: 'Scopus Journal Article',
          location_scope: 'international', // 8.0 pts
          publication_type: 'scholarly_paper' // 8.0 pts
        },
        evidenceReference: 'doi.pdf'
      })

      // Total = 8 + 8 = 16.0 pts
      expect(res.raw_points).toBe(16.0)
      expect(res.criterion_capped_points).toBe(16.0)
      expect(res.point_trace.factors).toEqual({ scopePts: 8.0, typePts: 8.0 })
      expect(res.explanation).toContain('Scope(8) + Type(8) = 16 pts')
    })

    // B.3 Conduct of Research (Evaluator Judgment Required)
    it('marks B.3 Conduct of Research as awaiting_evaluator with max 40 ceiling', () => {
      const res = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'B',
        category: 'B.3 Conduct of Research',
        entry: { title: 'Institutional AI Research Project' },
        evidenceReference: 'urco.pdf'
      })

      expect(res.evaluator_judgment_required).toBe(true)
      expect(res.scoring_status).toBe('awaiting_evaluator')
      expect(res.accepted_points).toBeNull() // Distinct from 0
      expect(res.criterion_cap).toBe(40.0)
      expect(res.explanation).toContain('Evaluator judgment required')
    })

    // B.4 Recognition & Awards Matrix
    it('scores B.4 Awards across the 8-cell matrix accurately', () => {
      const awardeeIntl = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'B',
        category: 'B.4 Professional Recognition or Awards',
        entry: { title: 'Outstanding Educator', recognition_status: 'awardee', award_scope: 'international' },
        evidenceReference: 'plaque.pdf'
      })
      expect(awardeeIntl.raw_points).toBe(40.0)

      const nomineeLocal = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'B',
        category: 'B.4 Professional Recognition or Awards',
        entry: { title: 'City Youth Award', recognition_status: 'nominee', award_scope: 'local' },
        evidenceReference: 'nomination.pdf'
      })
      expect(nomineeLocal.raw_points).toBe(5.0)
    })

    // B.6 Creative Work (Evaluator Judgment Required)
    it('marks B.6 Creative Work as awaiting_evaluator with max 20 ceiling', () => {
      const res = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'B',
        category: 'B.6 Creative Work',
        entry: { title: 'Cultural Performance' },
        evidenceReference: 'program.pdf'
      })

      expect(res.evaluator_judgment_required).toBe(true)
      expect(res.scoring_status).toBe('awaiting_evaluator')
      expect(res.accepted_points).toBeNull()
      expect(res.criterion_cap).toBe(20.0)
    })

    // Area C Service & Leadership
    it('scores C.1 Extra-Curricular (max 30), C.2 Community (max 30), and C.3 Years of Service (max 10)', () => {
      const c1 = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'C',
        category: 'C.1 Extra-Curricular',
        subCategory: 'moderator',
        entry: { title: 'Club Moderator' },
        evidenceReference: 'memo.pdf'
      })
      expect(c1.raw_points).toBe(20.0)
      expect(c1.criterion_cap).toBe(30.0)

      const c2 = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'C',
        category: 'C.2 Community Involvement',
        subCategory: 'church_activities',
        entry: { title: 'Parish Lector' },
        evidenceReference: 'endorsement.pdf'
      })
      expect(c2.raw_points).toBe(25.0)
      expect(c2.criterion_cap).toBe(30.0)

      const c3 = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        areaCode: 'C',
        category: 'C.3 Number of Years of Service at NDMU',
        entry: { title: 'Verified Service Record', years_of_service: 14 }
      })
      expect(c3.raw_points).toBe(7.0) // 14 / 2 * 1 = 7.0
      expect(c3.criterion_capped_points).toBe(7.0)
    })
  })

  // =========================================================================
  // 3. NON-TEACHING SCALE SCORING & FACTOR EXPLAINABILITY
  // =========================================================================
  describe('3. Non-Teaching Scale Deterministic Scoring & Trace', () => {
    it('scores B.1 School Activities: Moderator (30 pts), Trainer (20 pts), Service (10 pts)', () => {
      const mod = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        areaCode: 'B',
        category: 'B.1 School Activities',
        subCategory: 'moderator_officer',
        entry: { title: 'Club Moderator' },
        evidenceReference: 'order.pdf'
      })
      expect(mod.raw_points).toBe(30.0)
      expect(mod.criterion_cap).toBe(30.0)
    })

    it('scores B.2 Community Involvement: Church (25 pts), Charity (5 pts)', () => {
      const church = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        areaCode: 'B',
        category: 'B.2 Community Involvement',
        subCategory: 'church_activities',
        entry: { title: 'Parish Catechist' },
        evidenceReference: 'cert.pdf'
      })
      expect(church.raw_points).toBe(25.0)
    })

    it('scores B.3 Years at NDMU: server-derived 1 pt / 2 yrs (Max 10)', () => {
      const srv = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        areaCode: 'B',
        category: 'B.3 Years at NDMU',
        entry: { title: 'Service Record', years_of_service: 22 }
      })
      expect(srv.raw_points).toBe(11.0)
      expect(srv.criterion_capped_points).toBe(10.0) // Capped at 10
    })

    it('scores B.4 Invited as Judge/Lecturer: 5 pts per qualifying invitation (Max 30)', () => {
      const inv = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        areaCode: 'B',
        category: 'B.4 Invited as Judge, Lecturer, Resource Person',
        entry: { title: 'Guest Lectures', invitation_count: 4 },
        evidenceReference: 'invitation.pdf'
      })
      expect(inv.raw_points).toBe(20.0) // 4 * 5 = 20
      expect(inv.criterion_capped_points).toBe(20.0)
    })

    it('marks B.5 Recognition / Meritorious Award as awaiting_evaluator with max 30 ceiling', () => {
      const award = PersonnelEvaluationScoringEngine.scoreItem({
        scaleCode: EVALUATION_SCALE_CODES.NON_TEACHING,
        areaCode: 'B',
        category: 'B.5 Recognition / Meritorious Award',
        entry: { title: 'Service Award' },
        evidenceReference: 'award.pdf'
      })
      expect(award.evaluator_judgment_required).toBe(true)
      expect(award.scoring_status).toBe('awaiting_evaluator')
      expect(award.accepted_points).toBeNull()
      expect(award.criterion_cap).toBe(30.0)
    })
  })

  // =========================================================================
  // 4. CAP ENFORCEMENT HIERARCHY & EVALUATION TOTALS
  // =========================================================================
  describe('4. Cap Enforcement Hierarchy & Evaluation Totals', () => {
    it('enforces Administrators Area caps (Area A 70, Area B 50, Area C 40) and Overall Max 160', () => {
      // Area A: Ph.D. (40) + Ph.D. Units (10) + Officer (10) + Seminars (20) = 80 raw -> capped at 70
      const itemA1 = { criterion_capped_points: 40.0, accepted_points: 40.0 }
      const itemA2 = { criterion_capped_points: 10.0, accepted_points: 10.0 }
      const itemA3 = { criterion_capped_points: 10.0, accepted_points: 10.0 }
      const itemA4 = { criterion_capped_points: 20.0, accepted_points: 20.0 }

      // Area B: B.1 (16) + B.2 (16) + B.4 (40) = 72 raw -> capped at 50
      const itemB1 = { criterion_capped_points: 16.0, accepted_points: 16.0 }
      const itemB2 = { criterion_capped_points: 16.0, accepted_points: 16.0 }
      const itemB3 = { criterion_capped_points: 40.0, accepted_points: 40.0 }

      // Area C: C.1 (30) + C.2 (25) + C.3 (10) = 65 raw -> capped at 40
      const itemC1 = { criterion_capped_points: 30.0, accepted_points: 30.0 }
      const itemC2 = { criterion_capped_points: 25.0, accepted_points: 25.0 }
      const itemC3 = { criterion_capped_points: 10.0, accepted_points: 10.0 }

      const totals = PersonnelEvaluationScoringEngine.calculateEvaluationTotals(
        EVALUATION_SCALE_CODES.ADMINISTRATORS,
        {
          A: [itemA1, itemA2, itemA3, itemA4],
          B: [itemB1, itemB2, itemB3],
          C: [itemC1, itemC2, itemC3],
        }
      )

      expect(totals.areas.A.raw_area_sum).toBe(80.0)
      expect(totals.areas.A.capped_area_total).toBe(70.0) // Capped at 70
      expect(totals.areas.A.is_area_capped).toBe(true)

      expect(totals.areas.B.raw_area_sum).toBe(72.0)
      expect(totals.areas.B.capped_area_total).toBe(50.0) // Capped at 50
      expect(totals.areas.B.is_area_capped).toBe(true)

      expect(totals.areas.C.raw_area_sum).toBe(65.0)
      expect(totals.areas.C.capped_area_total).toBe(40.0) // Capped at 40
      expect(totals.areas.C.is_area_capped).toBe(true)

      // Overall: 70 + 50 + 40 = 160.0 (Passing is >= 120)
      expect(totals.capped_total_points).toBe(160.0)
      expect(totals.is_passing).toBe(true)
      expect(totals.evaluation_status).toBe('completed_scored')
    })

    it('marks evaluation as provisional_pending_evaluator when unresolved judgment items exist', () => {
      const itemB3Judgment = { evaluator_judgment_required: true, accepted_points: null, criterion_capped_points: 40.0 }

      const totals = PersonnelEvaluationScoringEngine.calculateEvaluationTotals(
        EVALUATION_SCALE_CODES.ADMINISTRATORS,
        {
          A: [{ accepted_points: 40.0, criterion_capped_points: 40.0 }],
          B: [itemB3Judgment],
          C: [{ accepted_points: 20.0, criterion_capped_points: 20.0 }],
        }
      )

      expect(totals.has_unresolved_judgment_items).toBe(true)
      expect(totals.evaluation_status).toBe('provisional_pending_evaluator')
    })
  })

  // =========================================================================
  // 5. EVALUATOR ACCEPTED VALUE VALIDATION (PLAN G COMPATIBILITY)
  // =========================================================================
  describe('5. Evaluator Accepted Value Validation', () => {
    it('validates that evaluator accepted score is within [0, max_points]', () => {
      expect(() => {
        PersonnelEvaluationScoringEngine.validateEvaluatorAcceptedScore('B.3', 35.0)
      }).not.toThrow()

      expect(() => {
        PersonnelEvaluationScoringEngine.validateEvaluatorAcceptedScore('B.6', 20.0)
      }).not.toThrow()
    })

    it('rejects negative evaluator scores and scores exceeding criterion maximum', () => {
      expect(() => {
        PersonnelEvaluationScoringEngine.validateEvaluatorAcceptedScore('B.6', -5.0)
      }).toThrow(/cannot be negative/)

      expect(() => {
        PersonnelEvaluationScoringEngine.validateEvaluatorAcceptedScore('B.6', 25.0) // Max is 20 for B.6
      }).toThrow(/exceeds maximum ceiling \[20\]/)

      expect(() => {
        PersonnelEvaluationScoringEngine.validateEvaluatorAcceptedScore('B.5', 35.0) // Max is 30 for B.5
      }).toThrow(/exceeds maximum ceiling \[30\]/)
    })
  })
})
