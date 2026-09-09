import { describe, it, expect } from 'vitest'
import evaluationInstrumentRegistry, {
  EVALUATION_SCALE_CODES,
  EVALUATION_RULE_VERSION,
  EVALUATION_INSTRUMENTS
} from '../../services/evaluationInstrumentRegistry.js'
import RankingCriteriaModel from '../../models/RankingCriteriaModel.js'

describe('Personnel Evaluation Track — Plan F — Phase F3: Non-Teaching Personnel Ranking Scale Configuration Suite', () => {
  const scale = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.NON_TEACHING]

  // =========================================================================
  // 1. SCALE APPLICABILITY & LIMITS
  // =========================================================================
  describe('1. Scale Applicability & Canonical Limits', () => {
    it('applies strictly to Non-Teaching Faculty on the Non-Academic side', () => {
      const resolvedScale = evaluationInstrumentRegistry.resolveScaleCode('non_teaching_faculty', 'non_academic')
      expect(resolvedScale).toBe(EVALUATION_SCALE_CODES.NON_TEACHING)
      expect(resolvedScale).toBe('NON_TEACHING_PERSONNEL_RANKING_SCALE')
    })

    it('rejects other personnel combinations from resolving to Non-Teaching scale', () => {
      expect(evaluationInstrumentRegistry.resolveScaleCode('faculty', 'academic')).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
      expect(evaluationInstrumentRegistry.resolveScaleCode('non_teaching_faculty', 'academic')).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
    })

    it('freezes exact canonical limits: Total Max 150, Passing 75, Area A 90, Area B 60', () => {
      expect(scale.scale_code).toBe('NON_TEACHING_PERSONNEL_RANKING_SCALE')
      expect(scale.rule_version).toBe(EVALUATION_RULE_VERSION)
      expect(scale.rule_version).toBe('NDMU-PERSONNEL-RATING-V2')
      expect(scale.overall_max_points).toBe(150.0)
      expect(scale.passing_score).toBe(75.0)
      expect(scale.areas.AREA_A.max_points).toBe(90.0)
      expect(scale.areas.AREA_B.max_points).toBe(60.0)
      expect(scale.areas.AREA_C).toBeUndefined() // No Area C in Non-Teaching scale
    })
  })

  // =========================================================================
  // 2. AREA A — PERFORMANCE AND PERSONAL INDICATORS (EVALUATION-ONLY)
  // =========================================================================
  describe('2. Area A — Performance and Personal Indicators (Evaluation-Only)', () => {
    it('marks Area A as read-only / non-entry for personnel accomplishments', () => {
      expect(scale.areas.AREA_A.entry_policy).toBe('read_only_evaluation_area')
      expect(scale.areas.AREA_A.is_personnel_entry_allowed).toBe(false)
    })

    it('preserves official evaluation indicators: Job Performance (50), Personal Attitudes (10), Efficiency (30)', () => {
      const cats = scale.areas.AREA_A.categories
      expect(cats['A.1'].name).toBe('Job Performance')
      expect(cats['A.1'].max_points).toBe(50.0)
      expect(cats['A.1'].read_only).toBe(true)
      expect(cats['A.1'].rule_type).toBe('EVALUATOR_OFFICIAL_RATING')

      expect(cats['A.2'].name).toBe('Personal Attitudes and Qualities')
      expect(cats['A.2'].max_points).toBe(10.0)
      expect(cats['A.2'].read_only).toBe(true)

      expect(cats['A.3'].name).toBe('Efficiency')
      expect(cats['A.3'].max_points).toBe(30.0)
      expect(cats['A.3'].read_only).toBe(true)

      const totalWeight = cats['A.1'].max_points + cats['A.2'].max_points + cats['A.3'].max_points
      expect(totalWeight).toBe(90.0)
    })

    it('exposes official Area A weights in RankingCriteriaModel', () => {
      expect(RankingCriteriaModel.NON_TEACHING_AREA_A_WEIGHTS.A1_JOB_PERFORMANCE.weight).toBe(50)
      expect(RankingCriteriaModel.NON_TEACHING_AREA_A_WEIGHTS.A1_JOB_PERFORMANCE.percentage).toBe(0.50)
      expect(RankingCriteriaModel.NON_TEACHING_AREA_A_WEIGHTS.A2_PERSONAL_ATTITUDES.weight).toBe(10)
      expect(RankingCriteriaModel.NON_TEACHING_AREA_A_WEIGHTS.A2_PERSONAL_ATTITUDES.percentage).toBe(0.10)
      expect(RankingCriteriaModel.NON_TEACHING_AREA_A_WEIGHTS.A3_EFFICIENCY.weight).toBe(30)
      expect(RankingCriteriaModel.NON_TEACHING_AREA_A_WEIGHTS.A3_EFFICIENCY.percentage).toBe(0.30)
      expect(RankingCriteriaModel.NON_TEACHING_AREA_A_WEIGHTS.TOTAL).toBe(90)
    })
  })

  // =========================================================================
  // 3. AREA B — SERVICE AND LEADERSHIP
  // =========================================================================
  describe('3. Area B — Service and Leadership Configuration & Point Schedules', () => {
    it('marks Area B as the active personnel achievement submission area', () => {
      expect(scale.areas.AREA_B.entry_policy).toBe('personnel_entry_allowed')
      expect(scale.areas.AREA_B.is_personnel_entry_allowed).toBe(true)
      expect(scale.areas.AREA_B.max_points).toBe(60.0)
    })

    // B.1
    describe('B.1 Involvement in School Activities / Recognized School Organizations', () => {
      const b1 = scale.areas.AREA_B.categories['B.1']

      it('freezes exact subcategories, points, and max 30 ceiling', () => {
        expect(b1.max_points).toBe(30.0)
        expect(b1.evidence_required).toBe(true)
        const opts = Object.fromEntries(b1.options.map(o => [o.code, o.points]))
        expect(opts.moderator_officer).toBe(30.0)
        expect(opts.trainer_coach).toBe(20.0)
        expect(opts.working_committee).toBe(20.0)
        expect(opts.rendered_service).toBe(10.0)
      })

      it('calculates B.1 points accurately via RankingCriteriaModel', () => {
        expect(RankingCriteriaModel.calculateNonTeachingB1Points('moderator_officer')).toBe(30.0)
        expect(RankingCriteriaModel.calculateNonTeachingB1Points('trainer_coach')).toBe(20.0)
        expect(RankingCriteriaModel.calculateNonTeachingB1Points('working_committee')).toBe(20.0)
        expect(RankingCriteriaModel.calculateNonTeachingB1Points('rendered_service')).toBe(10.0)
      })
    })

    // B.2
    describe('B.2 Community Involvement', () => {
      const b2 = scale.areas.AREA_B.categories['B.2']

      it('freezes exact categories, points, and max 30 ceiling', () => {
        expect(b2.max_points).toBe(30.0)
        expect(b2.evidence_required).toBe(true)
        const opts = Object.fromEntries(b2.options.map(o => [o.code, o.points]))
        expect(opts.church_activities).toBe(25.0)
        expect(opts.community_civic).toBe(25.0)
        expect(opts.charity_projects).toBe(5.0)
      })

      it('calculates B.2 points accurately via RankingCriteriaModel', () => {
        expect(RankingCriteriaModel.calculateNonTeachingB2Points('church_activities')).toBe(25.0)
        expect(RankingCriteriaModel.calculateNonTeachingB2Points('community_civic')).toBe(25.0)
        expect(RankingCriteriaModel.calculateNonTeachingB2Points('charity_projects')).toBe(5.0)
      })
    })

    // B.3
    describe('B.3 Number of Years at NDMU', () => {
      const b3 = scale.areas.AREA_B.categories['B.3']

      it('configures B.3 as server-derived, 1 pt per 2 completed years, max 10', () => {
        expect(b3.max_points).toBe(10.0)
        expect(b3.server_derived).toBe(true)
        expect(b3.rule_type).toBe('SERVER_DERIVED')
        expect(b3.points_per_two_years).toBe(1.0)
        expect(b3.evidence_required).toBe(false)
      })

      it('calculates B.3 service years thresholds and caps accurately', () => {
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(0)).toBe(0.0)
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(1)).toBe(0.0)
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(2)).toBe(1.0)
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(3)).toBe(1.0)
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(4)).toBe(2.0)
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(10)).toBe(5.0)
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(20)).toBe(10.0)
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(25)).toBe(10.0) // Capped at 10
        expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(40)).toBe(10.0)
      })
    })

    // B.4
    describe('B.4 Invited as Judge, Lecturer, Resource Person', () => {
      const b4 = scale.areas.AREA_B.categories['B.4']

      it('freezes 5 points per qualifying invitation, max 30 pts ceiling', () => {
        expect(b4.max_points).toBe(30.0)
        expect(b4.points_per_occurrence).toBe(5.0)
        expect(b4.rule_type).toBe('POINTS_PER_OCCURRENCE')
        expect(b4.evidence_required).toBe(true)
      })

      it('calculates B.4 invitation points with capping at 30 pts (6 invitations)', () => {
        expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 0 })).toBe(0.0)
        expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 1 })).toBe(5.0)
        expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 2 })).toBe(10.0)
        expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 5 })).toBe(25.0)
        expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 6 })).toBe(30.0) // Reaches max
        expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 8 })).toBe(30.0) // Capped
      })
    })

    // B.5
    describe('B.5 Recognition / Meritorious Award', () => {
      const b5 = scale.areas.AREA_B.categories['B.5']

      it('enforces evaluator_judgment_required = true with max 30 ceiling and no auto-score formula', () => {
        expect(b5.max_points).toBe(30.0)
        expect(b5.evaluator_judgment_required).toBe(true)
        expect(b5.rule_type).toBe('EVALUATOR_JUDGMENT_MAX_ONLY')
        expect(b5.evidence_required).toBe(true)
      })
    })
  })

  // =========================================================================
  // 4. BOUNDARY & CEILING TESTS
  // =========================================================================
  describe('4. Boundary & Sub-Ceiling Tests', () => {
    it('B.3 Service Years: tests boundary sequence 0, 1, 2, 4, 10, 20, 25, 40 years', () => {
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(0)).toBe(0.0)
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(1)).toBe(0.0)
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(2)).toBe(1.0)
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(3)).toBe(1.0)
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(4)).toBe(2.0)
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(10)).toBe(5.0)
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(19)).toBe(9.0)
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(20)).toBe(10.0) // Ceiling reached
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(25)).toBe(10.0) // Capped
      expect(RankingCriteriaModel.calculateNonTeachingB3YearsPoints(50)).toBe(10.0) // Capped
    })

    it('B.4 Invitations: tests boundary sequence 0, 1, 5, 6, 7, 10 invitations', () => {
      expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 0 })).toBe(0.0)
      expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 1 })).toBe(5.0)
      expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 5 })).toBe(25.0)
      expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 6 })).toBe(30.0) // Ceiling reached
      expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 7 })).toBe(30.0) // Capped
      expect(RankingCriteriaModel.calculateNonTeachingB4Points({ invitationCount: 12 })).toBe(30.0) // Capped
    })

    it('Area B Category Allocation: preserves 60.0 allocation without summing individual category maxima', () => {
      expect(scale.areas.AREA_B.max_points).toBe(60.0)
      const subCeilings = [
        RankingCriteriaModel.NON_TEACHING_SUB_CEILINGS.B1_ACTIVITIES,
        RankingCriteriaModel.NON_TEACHING_SUB_CEILINGS.B2_COMMUNITY,
        RankingCriteriaModel.NON_TEACHING_SUB_CEILINGS.B3_YEARS,
        RankingCriteriaModel.NON_TEACHING_SUB_CEILINGS.B4_INVITED,
        RankingCriteriaModel.NON_TEACHING_SUB_CEILINGS.B5_AWARDS,
      ]
      expect(subCeilings).toEqual([30, 30, 10, 30, 30])
      // Individual sub-ceilings sum to 130, but official category allocation remains strictly 60.0
      expect(scale.areas.AREA_B.max_points).toBe(60.0)
    })
  })

  // =========================================================================
  // 5. WRONG-SCALE & MUTATION GUARD PROTECTION
  // =========================================================================
  describe('5. Wrong-Scale & Area A Mutation Protection', () => {
    it('returns only Area A (read-only) and Area B (editable) for Non-Teaching scale', () => {
      const areas = RankingCriteriaModel.getAreasForScale('NON_TEACHING_PERSONNEL_RANKING_SCALE')
      expect(areas.length).toBe(2)
      expect(areas[0].area_code).toBe('A')
      expect(areas[0].entry_policy).toBe('read_only_evaluation_area')
      expect(areas[0].is_personnel_entry_allowed).toBe(false)
      expect(areas[0].max_points).toBe(90.0)

      expect(areas[1].area_code).toBe('B')
      expect(areas[1].entry_policy).toBe('personnel_entry_allowed')
      expect(areas[1].is_personnel_entry_allowed).toBe(true)
      expect(areas[1].max_points).toBe(60.0)
    })

    it('does not expose Administrators Area C, publications, or instructional materials to Non-Teaching scale', () => {
      const areas = RankingCriteriaModel.getAreasForScale('NON_TEACHING_PERSONNEL_RANKING_SCALE')
      const areaCodes = areas.map(a => a.area_code)
      expect(areaCodes).not.toContain('C')
      expect(scale.areas.AREA_B.categories['B.2'].name).toBe('Community Involvement')
      expect(scale.areas.AREA_B.categories['B.2'].options).toBeDefined()
    })

    it('resolves correct required proof types for Non-Teaching accomplishments', () => {
      expect(RankingCriteriaModel.getRequiredProofType('B', 'B.1 School Activities', 'Moderator')).toContain('Designation Letter')
      expect(RankingCriteriaModel.getRequiredProofType('B', 'B.2 Community Involvement', 'Church')).toContain('Certificate of Service')
      expect(RankingCriteriaModel.getRequiredProofType('B', 'B.4 Invited as Judge', 'Resource Person')).toContain('Invitation Letter')
      expect(RankingCriteriaModel.getRequiredProofType('B', 'B.5 Recognition', 'Meritorious Award')).toContain('Award Plaque')
    })
  })
})

