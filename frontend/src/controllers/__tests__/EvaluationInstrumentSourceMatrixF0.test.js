import { describe, it, expect } from 'vitest'
import evaluationInstrumentRegistry, {
  EVALUATION_RULE_VERSION,
  EVALUATION_SCALE_CODES,
  EVALUATION_INSTRUMENTS,
} from '../../services/evaluationInstrumentRegistry'

describe('Plan F — Phase F0: Authoritative Evaluation Instrument Freeze & Canonical Scoring Configuration Baseline', () => {
  describe('28.1 — Scale Count & Canonical Identification', () => {
    it('freezes exactly two canonical evaluation scales', () => {
      expect(evaluationInstrumentRegistry.getScaleCount()).toBe(2)
      expect(EVALUATION_SCALE_CODES.ADMINISTRATORS).toBe('ADMINISTRATORS_RANKING_SCALE')
      expect(EVALUATION_SCALE_CODES.NON_TEACHING).toBe('NON_TEACHING_PERSONNEL_RANKING_SCALE')
    })
  })

  describe('28.2 — Scale Applicability Matrix', () => {
    it('maps Faculty + Academic to ADMINISTRATORS_RANKING_SCALE', () => {
      const scale = evaluationInstrumentRegistry.resolveScaleCode('faculty', 'academic')
      expect(scale).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
    })

    it('maps Non-Teaching Faculty + Academic to ADMINISTRATORS_RANKING_SCALE', () => {
      const scale = evaluationInstrumentRegistry.resolveScaleCode('non_teaching_faculty', 'academic')
      expect(scale).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
    })

    it('maps Non-Teaching Faculty + Non-Academic to NON_TEACHING_PERSONNEL_RANKING_SCALE', () => {
      const scale = evaluationInstrumentRegistry.resolveScaleCode('non_teaching_faculty', 'non_academic')
      expect(scale).toBe(EVALUATION_SCALE_CODES.NON_TEACHING)
    })

    it('throws explicit error on unconfirmed Faculty + Non-Academic combination', () => {
      expect(() => {
        evaluationInstrumentRegistry.resolveScaleCode('faculty', 'non_academic')
      }).toThrow(/Invalid personnel classification combination/)
    })
  })

  describe('28.3 — Administrators Ranking Scale Maxima & Area Caps', () => {
    const adminScale = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS]

    it('verifies overall maximum of 160 and passing score of 120', () => {
      expect(adminScale.overall_max_points).toBe(160.0)
      expect(adminScale.passing_score).toBe(120.0)
    })

    it('verifies canonical area caps: Area A = 70, Area B = 50, Area C = 40', () => {
      expect(adminScale.areas.AREA_A.max_points).toBe(70.0)
      expect(adminScale.areas.AREA_B.max_points).toBe(50.0)
      expect(adminScale.areas.AREA_C.max_points).toBe(40.0)
    })
  })

  describe('28.4 — Non-Teaching Personnel Ranking Scale Maxima & Area Structure', () => {
    const nonTeachingScale = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.NON_TEACHING]

    it('verifies overall maximum of 150 and passing score of 75', () => {
      expect(nonTeachingScale.overall_max_points).toBe(150.0)
      expect(nonTeachingScale.passing_score).toBe(75.0)
    })

    it('verifies Area A total of 90 and Area B total of 60', () => {
      expect(nonTeachingScale.areas.AREA_A.max_points).toBe(90.0)
      expect(nonTeachingScale.areas.AREA_B.max_points).toBe(60.0)
    })
  })

  describe('28.5 — Administrators Area A.1: Degree/s Rule Freeze', () => {
    const a1 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_A.categories['A.1']

    it('freezes exact degree and units point schedules and maximum cap of 40', () => {
      expect(a1.max_points).toBe(40.0)
      expect(a1.rule_type).toBe('DEGREE_AND_UNITS')
      expect(a1.evidence_required).toBe(true)

      const phdDegree = a1.options.find((o) => o.code === 'phd_degree')
      expect(phdDegree.points).toBe(40.0)

      const phdUnits = a1.options.find((o) => o.code === 'phd_units')
      expect(phdUnits.points_per_block).toBe(2.0)
      expect(phdUnits.units_per_block).toBe(3)
      expect(phdUnits.max_points).toBe(10.0)

      const maDegree = a1.options.find((o) => o.code === 'ma_degree')
      expect(maDegree.points).toBe(20.0)

      const maUnits = a1.options.find((o) => o.code === 'ma_units')
      expect(maUnits.points_per_block).toBe(1.0)
      expect(maUnits.units_per_block).toBe(3)
      expect(maUnits.max_points).toBe(10.0)
    })
  })

  describe('28.6 — Administrators Area A.2: Professional Organizations', () => {
    const a2 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_A.categories['A.2']

    it('freezes exact Member (5 pts) and Officer (10 pts) options', () => {
      expect(a2.max_points).toBe(10.0)
      expect(a2.options.find((o) => o.code === 'officer').points).toBe(10.0)
      expect(a2.options.find((o) => o.code === 'member').points).toBe(5.0)
    })
  })

  describe('28.7 — Administrators Area A.3: Seminars & Trainings', () => {
    const a3 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_A.categories['A.3']

    it('freezes all 5 seminar scope tiers and the 20-point maximum cap', () => {
      expect(a3.max_points).toBe(20.0)
      expect(a3.options.find((o) => o.code === 'international').points).toBe(10.0)
      expect(a3.options.find((o) => o.code === 'national').points).toBe(8.0)
      expect(a3.options.find((o) => o.code === 'regional').points).toBe(6.0)
      expect(a3.options.find((o) => o.code === 'city_provincial').points).toBe(4.0)
      expect(a3.options.find((o) => o.code === 'in_house').points).toBe(3.0)
    })
  })

  describe('28.8 — Administrators Area B.1: Guest Lecturer Multi-Factor Formula', () => {
    const b1 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_B.categories['B.1']

    it('freezes 4-factor additive formula and factor weights', () => {
      expect(b1.formula).toBe('sponsoring_organization + extent_of_talk + participant_reach + role')
      expect(b1.factors.sponsoring_organization.find((f) => f.code === 'external').points).toBe(2.0)
      expect(b1.factors.sponsoring_organization.find((f) => f.code === 'ndmu').points).toBe(1.0)

      expect(b1.factors.extent_of_talk.find((f) => f.code === 'more_than_2_days').points).toBe(5.0)
      expect(b1.factors.extent_of_talk.find((f) => f.code === '1_hour').points).toBe(1.0)

      expect(b1.factors.participant_reach.find((f) => f.code === 'international').points).toBe(4.0)
      expect(b1.factors.participant_reach.find((f) => f.code === 'local').points).toBe(1.0)

      expect(b1.factors.role.find((f) => f.code === 'speaker').points).toBe(5.0)
      expect(b1.factors.role.find((f) => f.code === 'judge').points).toBe(3.0)
    })
  })

  describe('28.9 — Administrators Area B.2: Publication 2-Factor Formula', () => {
    const b2 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_B.categories['B.2']

    it('freezes location scope and publication type weights', () => {
      expect(b2.formula).toBe('location_scope + publication_type')
      expect(b2.factors.location_scope.find((f) => f.code === 'international').points).toBe(8.0)
      expect(b2.factors.location_scope.find((f) => f.code === 'local').points).toBe(3.0)

      expect(b2.factors.publication_type.find((f) => f.code === 'book').points).toBe(10.0)
      expect(b2.factors.publication_type.find((f) => f.code === 'scholarly_paper').points).toBe(8.0)
      expect(b2.factors.publication_type.find((f) => f.code === 'article').points).toBe(5.0)
      expect(b2.factors.publication_type.find((f) => f.code === 'commentary').points).toBe(2.0)
    })
  })

  describe('28.10 — Administrators Area B.3 & B.6: Evaluator Judgment Rules', () => {
    const b3 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_B.categories['B.3']
    const b6 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_B.categories['B.6']

    it('preserves maximum cap of 40 on Conduct of Research with evaluator_judgment_required = true', () => {
      expect(b3.max_points).toBe(40.0)
      expect(b3.rule_type).toBe('EVALUATOR_JUDGMENT_MAX_ONLY')
      expect(b3.evaluator_judgment_required).toBe(true)
    })

    it('preserves maximum cap of 20 on Creative Work with evaluator_judgment_required = true', () => {
      expect(b6.max_points).toBe(20.0)
      expect(b6.rule_type).toBe('EVALUATOR_JUDGMENT_MAX_ONLY')
      expect(b6.evaluator_judgment_required).toBe(true)
    })
  })

  describe('28.11 — Administrators Area B.4 & B.5: Recognition Matrix & Materials', () => {
    const b4 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_B.categories['B.4']
    const b5 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_B.categories['B.5']

    it('freezes 2x4 recognition awardee/nominee matrix', () => {
      expect(b4.matrix.awardee.international).toBe(40.0)
      expect(b4.matrix.awardee.regional).toBe(30.0)
      expect(b4.matrix.awardee.local).toBe(10.0)
      expect(b4.matrix.nominee.international).toBe(20.0)
      expect(b4.matrix.nominee.local).toBe(5.0)
    })

    it('freezes instructional material point schedule (10 to 20 pts)', () => {
      expect(b5.max_points).toBe(20.0)
      expect(b5.options.find((o) => o.code === 'others_bound').points).toBe(20.0)
      expect(b5.options.find((o) => o.code === 'modules').points).toBe(10.0)
    })
  })

  describe('28.12 — Administrators Area C: Community, Extra-Curricular & Years of Service', () => {
    const c1 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_C.categories['C.1']
    const c2 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_C.categories['C.2']
    const c3 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].areas.AREA_C.categories['C.3']

    it('freezes C.1 Extra-Curricular Activities (max 30 pts)', () => {
      expect(c1.max_points).toBe(30.0)
      expect(c1.options.find((o) => o.code === 'moderator').points).toBe(20.0)
      expect(c1.options.find((o) => o.code === 'rendered_service').points).toBe(10.0)
    })

    it('freezes C.2 Community Involvement (max 30 pts)', () => {
      expect(c2.max_points).toBe(30.0)
      expect(c2.options.find((o) => o.code === 'church_activities').points).toBe(25.0)
      expect(c2.options.find((o) => o.code === 'charity_projects').points).toBe(5.0)
    })

    it('freezes C.3 Years of Service as server-derived (1 pt / 2 years, max 10 pts)', () => {
      expect(c3.max_points).toBe(10.0)
      expect(c3.rule_type).toBe('SERVER_DERIVED')
      expect(c3.server_derived).toBe(true)
      expect(c3.points_per_two_years).toBe(1.0)
    })
  })

  describe('28.13 — Non-Teaching Area A: Read-Only Evaluation Area', () => {
    const nonTeachingAreaA = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.NON_TEACHING].areas.AREA_A

    it('configures Non-Teaching Area A as read-only with no personnel entry allowed', () => {
      expect(nonTeachingAreaA.entry_policy).toBe('read_only_evaluation_area')
      expect(nonTeachingAreaA.is_personnel_entry_allowed).toBe(false)
      expect(nonTeachingAreaA.max_points).toBe(90.0)

      expect(nonTeachingAreaA.categories['A.1'].max_points).toBe(50.0)
      expect(nonTeachingAreaA.categories['A.2'].max_points).toBe(10.0)
      expect(nonTeachingAreaA.categories['A.3'].max_points).toBe(30.0)
    })
  })

  describe('28.14 — Non-Teaching Area B: Subcategories B.1 to B.4', () => {
    const areaB = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.NON_TEACHING].areas.AREA_B

    it('freezes B.1 School Activities (max 30 pts)', () => {
      expect(areaB.categories['B.1'].max_points).toBe(30.0)
      expect(areaB.categories['B.1'].options.find((o) => o.code === 'moderator_officer').points).toBe(30.0)
      expect(areaB.categories['B.1'].options.find((o) => o.code === 'trainer_coach').points).toBe(20.0)
    })

    it('freezes B.2 Community Involvement (max 30 pts)', () => {
      expect(areaB.categories['B.2'].max_points).toBe(30.0)
      expect(areaB.categories['B.2'].options.find((o) => o.code === 'church_activities').points).toBe(25.0)
    })

    it('freezes B.3 Years of Service as server-derived (max 10 pts)', () => {
      expect(areaB.categories['B.3'].max_points).toBe(10.0)
      expect(areaB.categories['B.3'].server_derived).toBe(true)
    })

    it('freezes B.4 Invitations as Judge/Lecturer (5 pts per occurrence, max 30 pts)', () => {
      expect(areaB.categories['B.4'].max_points).toBe(30.0)
      expect(areaB.categories['B.4'].points_per_occurrence).toBe(5.0)
    })
  })

  describe('28.15 — Non-Teaching Area B.5: Recognition / Meritorious Award', () => {
    const b5 = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.NON_TEACHING].areas.AREA_B.categories['B.5']

    it('preserves maximum cap of 30 pts with evaluator_judgment_required = true', () => {
      expect(b5.max_points).toBe(30.0)
      expect(b5.rule_type).toBe('EVALUATOR_JUDGMENT_MAX_ONLY')
      expect(b5.evaluator_judgment_required).toBe(true)
    })
  })

  describe('28.16 — Versioning & Immutability', () => {
    it('verifies that all scales carry the canonical rule version NDMU-PERSONNEL-RATING-V2', () => {
      expect(EVALUATION_RULE_VERSION).toBe('NDMU-PERSONNEL-RATING-V2')
      expect(EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS].rule_version).toBe(EVALUATION_RULE_VERSION)
      expect(EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.NON_TEACHING].rule_version).toBe(EVALUATION_RULE_VERSION)
    })
  })
})
