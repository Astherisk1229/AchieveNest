import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'

import {
  EVALUATION_SCALE_CODES,
  EVALUATION_RULE_VERSION,
  EVALUATION_INSTRUMENTS,
  evaluationInstrumentRegistry
} from '../../services/evaluationInstrumentRegistry.js'

import RankingCriteriaModel from '../../models/RankingCriteriaModel.js'

describe('Personnel Evaluation Track — Plan F — Phase F2: Administrators Ranking Scale Configuration Suite', () => {
  const adminInstrument = EVALUATION_INSTRUMENTS[EVALUATION_SCALE_CODES.ADMINISTRATORS]

  beforeEach(() => {
    expect(adminInstrument).toBeDefined()
  })

  // =========================================================================
  // 1. Scale Governance & Overall Ceiling Constraints
  // =========================================================================
  describe('1. Scale Governance & Overall Constraints', () => {
    it('locks canonical scale code to ADMINISTRATORS_RANKING_SCALE', () => {
      expect(adminInstrument.scale_code).toBe('ADMINISTRATORS_RANKING_SCALE')
    })

    it('locks rule version to NDMU-PERSONNEL-RATING-V2', () => {
      expect(adminInstrument.rule_version).toBe(EVALUATION_RULE_VERSION)
      expect(adminInstrument.rule_version).toBe('NDMU-PERSONNEL-RATING-V2')
    })

    it('locks overall maximum to 160.0 and passing score to 120.0', () => {
      expect(adminInstrument.overall_max_points).toBe(160.0)
      expect(adminInstrument.passing_score).toBe(120.0)
      expect(RankingCriteriaModel.AREA_CEILINGS.MAX_TOTAL).toBe(160)
    })

    it('locks area maximums: Area A = 70, Area B = 50, Area C = 40', () => {
      expect(adminInstrument.areas.AREA_A.max_points).toBe(70.0)
      expect(adminInstrument.areas.AREA_B.max_points).toBe(50.0)
      expect(adminInstrument.areas.AREA_C.max_points).toBe(40.0)
      expect(RankingCriteriaModel.AREA_CEILINGS.AREA_A).toBe(70)
      expect(RankingCriteriaModel.AREA_CEILINGS.AREA_B).toBe(50)
      expect(RankingCriteriaModel.AREA_CEILINGS.AREA_C).toBe(40)
    })

    it('applies strictly to Faculty + Academic and Non-Teaching Faculty + Academic', () => {
      expect(adminInstrument.applicability).toEqual([
        { personnel_group: 'faculty', organizational_side: 'academic' },
        { personnel_group: 'non_teaching_faculty', organizational_side: 'academic' }
      ])
      expect(evaluationInstrumentRegistry.resolveScaleCode('faculty', 'academic')).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
      expect(evaluationInstrumentRegistry.resolveScaleCode('non_teaching_faculty', 'academic')).toBe(EVALUATION_SCALE_CODES.ADMINISTRATORS)
    })
  })

  // =========================================================================
  // 2. Area A — Professional Development (Max 70 pts)
  // =========================================================================
  describe('2. Area A — Professional Development Criteria & Point Schedules', () => {
    const areaA = adminInstrument.areas.AREA_A

    it('2.1 A.1 Degree/s — Ph.D. Degree Holder awards exactly 40 points', () => {
      const phdOpt = areaA.categories['A.1'].options.find(o => o.code === 'phd_degree')
      expect(phdOpt.points).toBe(40.0)
      expect(phdOpt.rule).toBe('fixed')
    })

    it('2.2 A.1 Degree/s — Ph.D. Units formula (2 pts per 3 units, max 10 pts) and boundary thresholds', () => {
      const phdUnitsOpt = areaA.categories['A.1'].options.find(o => o.code === 'phd_units')
      expect(phdUnitsOpt.points_per_block).toBe(2.0)
      expect(phdUnitsOpt.units_per_block).toBe(3)
      expect(phdUnitsOpt.max_points).toBe(10.0)

      // Boundary tests
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 0)).toBe(0)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 1)).toBe(0)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 2)).toBe(0)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 3)).toBe(2)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 5)).toBe(2)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 6)).toBe(4)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 9)).toBe(6)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 12)).toBe(8)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 15)).toBe(10)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('Ph.D. Units', 24)).toBe(10) // capped
    })

    it('2.3 A.1 Degree/s — MA Degree Holder awards exactly 20 points', () => {
      const maOpt = areaA.categories['A.1'].options.find(o => o.code === 'ma_degree')
      expect(maOpt.points).toBe(20.0)
      expect(maOpt.rule).toBe('fixed')
    })

    it('2.4 A.1 Degree/s — MA Units formula (1 pt per 3 units, max 10 pts) and boundary thresholds', () => {
      const maUnitsOpt = areaA.categories['A.1'].options.find(o => o.code === 'ma_units')
      expect(maUnitsOpt.points_per_block).toBe(1.0)
      expect(maUnitsOpt.units_per_block).toBe(3)
      expect(maUnitsOpt.max_points).toBe(10.0)

      // Boundary tests
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('MA Units', 0)).toBe(0)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('MA Units', 2)).toBe(0)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('MA Units', 3)).toBe(1)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('MA Units', 6)).toBe(2)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('MA Units', 15)).toBe(5)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('MA Units', 30)).toBe(10)
      expect(RankingCriteriaModel.calculateDegreeUnitsPoints('MA Units', 45)).toBe(10) // capped
    })

    it('2.5 A.2 Active Membership — Member = 5 pts, Officer = 10 pts', () => {
      const catA2 = areaA.categories['A.2']
      const member = catA2.options.find(o => o.code === 'member')
      const officer = catA2.options.find(o => o.code === 'officer')

      expect(member.points).toBe(5.0)
      expect(officer.points).toBe(10.0)
      expect(catA2.required_fields).toEqual(['organization_name', 'membership_role', 'period'])
      expect(catA2.evidence_required).toBe(true)
    })

    it('2.6 A.3 Attendance to Seminars — all 5 scope levels and max 20 pts', () => {
      const catA3 = areaA.categories['A.3']
      expect(catA3.max_points).toBe(20.0)

      const scopeMap = Object.fromEntries(catA3.options.map(o => [o.code, o.points]))
      expect(scopeMap.in_house).toBe(3.0)
      expect(scopeMap.city_provincial).toBe(4.0)
      expect(scopeMap.regional).toBe(6.0)
      expect(scopeMap.national).toBe(8.0)
      expect(scopeMap.international).toBe(10.0)

      expect(catA3.required_fields).toEqual(['seminar_title', 'scope', 'venue', 'date'])
      expect(catA3.evidence_required).toBe(true)
    })
  })

  // =========================================================================
  // 3. Area B — Productivity and Creative Work (Max 50 pts)
  // =========================================================================
  describe('3. Area B — Productivity and Creative Work Criteria & Multi-Factor Rules', () => {
    const areaB = adminInstrument.areas.AREA_B

    it('3.1 B.1 Guest Lecturer / Consultant / Judge — all 4 factor options configured', () => {
      const catB1 = areaB.categories['B.1']
      expect(catB1.rule_type).toBe('SUM_COMPONENTS')
      expect(catB1.formula).toBe('sponsoring_organization + extent_of_talk + participant_reach + role')

      const orgMap = Object.fromEntries(catB1.factors.sponsoring_organization.map(f => [f.code, f.points]))
      expect(orgMap.ndmu).toBe(1.0)
      expect(orgMap.external).toBe(2.0)

      const extentMap = Object.fromEntries(catB1.factors.extent_of_talk.map(f => [f.code, f.points]))
      expect(extentMap['1_hour']).toBe(1.0)
      expect(extentMap.half_day).toBe(2.0)
      expect(extentMap['1_day']).toBe(3.0)
      expect(extentMap['2_days']).toBe(4.0)
      expect(extentMap.more_than_2_days).toBe(5.0)

      const reachMap = Object.fromEntries(catB1.factors.participant_reach.map(f => [f.code, f.points]))
      expect(reachMap.local).toBe(1.0)
      expect(reachMap.regional).toBe(2.0)
      expect(reachMap.national).toBe(3.0)
      expect(reachMap.international).toBe(4.0)

      const roleMap = Object.fromEntries(catB1.factors.role.map(f => [f.code, f.points]))
      expect(roleMap.judge).toBe(3.0)
      expect(roleMap.reactor).toBe(5.0)
      expect(roleMap.resource_person).toBe(5.0)
      expect(roleMap.facilitator).toBe(5.0)
      expect(roleMap.consultant).toBe(5.0)
      expect(roleMap.speaker).toBe(5.0)
      expect(roleMap.organizer).toBe(5.0)
    })

    it('3.2 B.1 Factor-Sum calculation produces exact deterministic totals', () => {
      // Base: NDMU (1) + 1_hour (1) + local (1) + judge (3) = 6 pts
      expect(RankingCriteriaModel.calculateB1Points({
        sponsoringOrganization: 'ndmu',
        extentOfTalk: '1_hour',
        participantReach: 'local',
        role: 'judge'
      })).toBe(6)

      // Comprehensive: External (2) + more_than_2_days (5) + international (4) + speaker (5) = 16 pts
      expect(RankingCriteriaModel.calculateB1Points({
        sponsoringOrganization: 'external',
        extentOfTalk: 'more_than_2_days',
        participantReach: 'international',
        role: 'speaker'
      })).toBe(16)
    })

    it('3.3 B.2 Publication — location scope and publication type 2-factor matrix', () => {
      const catB2 = areaB.categories['B.2']
      expect(catB2.rule_type).toBe('SUM_COMPONENTS')

      const scopeMap = Object.fromEntries(catB2.factors.location_scope.map(f => [f.code, f.points]))
      expect(scopeMap.local).toBe(3.0)
      expect(scopeMap.regional).toBe(4.0)
      expect(scopeMap.national).toBe(6.0)
      expect(scopeMap.international).toBe(8.0)

      const pubTypeMap = Object.fromEntries(catB2.factors.publication_type.map(f => [f.code, f.points]))
      expect(pubTypeMap.commentary).toBe(2.0)
      expect(pubTypeMap.reviews).toBe(4.0)
      expect(pubTypeMap.compilation).toBe(5.0)
      expect(pubTypeMap.article).toBe(5.0)
      expect(pubTypeMap.scholarly_paper).toBe(8.0)
      expect(pubTypeMap.monograph).toBe(8.0)
      expect(pubTypeMap.research_output).toBe(10.0)
      expect(pubTypeMap.book).toBe(10.0)

      // Calculation tests
      expect(RankingCriteriaModel.calculateB2Points({ locationScope: 'local', publicationType: 'commentary' })).toBe(5)
      expect(RankingCriteriaModel.calculateB2Points({ locationScope: 'international', publicationType: 'book' })).toBe(18)
    })

    it('3.4 B.3 Conduct of Research — locks max 40 pts and evaluator_judgment_required', () => {
      const catB3 = areaB.categories['B.3']
      expect(catB3.max_points).toBe(40.0)
      expect(catB3.rule_type).toBe('EVALUATOR_JUDGMENT_MAX_ONLY')
      expect(catB3.evaluator_judgment_required).toBe(true)
      expect(catB3.evidence_required).toBe(true)
    })

    it('3.5 B.4 Professional Recognition or Awards — all 8 Nominee & Awardee combinations', () => {
      const catB4 = areaB.categories['B.4']
      expect(catB4.rule_type).toBe('MATRIX_LOOKUP')
      const matrix = catB4.matrix

      // Nominee
      expect(matrix.nominee.local).toBe(5.0)
      expect(matrix.nominee.regional).toBe(15.0)
      expect(matrix.nominee.national).toBe(20.0)
      expect(matrix.nominee.international).toBe(20.0)

      // Awardee
      expect(matrix.awardee.local).toBe(10.0)
      expect(matrix.awardee.regional).toBe(30.0)
      expect(matrix.awardee.national).toBe(40.0)
      expect(matrix.awardee.international).toBe(40.0)

      expect(RankingCriteriaModel.AWARD_POINTS.Nominee.Local).toBe(5)
      expect(RankingCriteriaModel.AWARD_POINTS.Nominee['Provincial/Regional']).toBe(15)
      expect(RankingCriteriaModel.AWARD_POINTS.Nominee.National).toBe(20)
      expect(RankingCriteriaModel.AWARD_POINTS.Nominee.International).toBe(20)

      expect(RankingCriteriaModel.AWARD_POINTS.Awardee.Local).toBe(10)
      expect(RankingCriteriaModel.AWARD_POINTS.Awardee['Provincial/Regional']).toBe(30)
      expect(RankingCriteriaModel.AWARD_POINTS.Awardee.National).toBe(40)
      expect(RankingCriteriaModel.AWARD_POINTS.Awardee.International).toBe(40)
    })

    it('3.6 B.5 Production of Instructional Materials — all 4 official types configured', () => {
      const catB5 = areaB.categories['B.5']
      const typeMap = Object.fromEntries(catB5.options.map(o => [o.code, o.points]))

      expect(typeMap.audio_visual).toBe(10.0)
      expect(typeMap.modules).toBe(10.0)
      expect(typeMap.reviewers_bound).toBe(10.0)
      expect(typeMap.others_bound).toBe(20.0)
    })

    it('3.7 B.6 Creative Work — locks max 20 pts and evaluator_judgment_required', () => {
      const catB6 = areaB.categories['B.6']
      expect(catB6.max_points).toBe(20.0)
      expect(catB6.rule_type).toBe('EVALUATOR_JUDGMENT_MAX_ONLY')
      expect(catB6.evaluator_judgment_required).toBe(true)
      expect(catB6.evidence_required).toBe(true)
    })
  })

  // =========================================================================
  // 4. Area C — Service and Leadership (Max 40 pts)
  // =========================================================================
  describe('4. Area C — Service and Leadership Criteria', () => {
    const areaC = adminInstrument.areas.AREA_C

    it('4.1 C.1 Extra-Curricular Activities — all 4 subcategories and max 30 pts', () => {
      const catC1 = areaC.categories['C.1']
      expect(catC1.max_points).toBe(30.0)
      const optMap = Object.fromEntries(catC1.options.map(o => [o.code, o.points]))

      expect(optMap.moderator).toBe(20.0)
      expect(optMap.coach_trainer).toBe(20.0)
      expect(optMap.working_committee).toBe(20.0)
      expect(optMap.rendered_service).toBe(10.0)
    })

    it('4.2 C.2 Community Involvement — all 3 categories and max 30 pts', () => {
      const catC2 = areaC.categories['C.2']
      expect(catC2.max_points).toBe(30.0)
      const optMap = Object.fromEntries(catC2.options.map(o => [o.code, o.points]))

      expect(optMap.church_activities).toBe(25.0)
      expect(optMap.community_civic).toBe(25.0)
      expect(optMap.charity_projects).toBe(5.0)
    })

    it('4.3 C.3 Years of Service at NDMU — formula (1 pt per 2 completed yrs, max 10 pts) and server_derived = true', () => {
      const catC3 = areaC.categories['C.3']
      expect(catC3.max_points).toBe(10.0)
      expect(catC3.rule_type).toBe('SERVER_DERIVED')
      expect(catC3.server_derived).toBe(true)
      expect(catC3.points_per_two_years).toBe(1.0)
      expect(catC3.evidence_required).toBe(false)

      // Boundary tests
      expect(RankingCriteriaModel.calculateServiceYearsPoints(0)).toBe(0)
      expect(RankingCriteriaModel.calculateServiceYearsPoints(1)).toBe(0)
      expect(RankingCriteriaModel.calculateServiceYearsPoints(2)).toBe(1)
      expect(RankingCriteriaModel.calculateServiceYearsPoints(3)).toBe(1)
      expect(RankingCriteriaModel.calculateServiceYearsPoints(4)).toBe(2)
      expect(RankingCriteriaModel.calculateServiceYearsPoints(10)).toBe(5)
      expect(RankingCriteriaModel.calculateServiceYearsPoints(20)).toBe(10)
      expect(RankingCriteriaModel.calculateServiceYearsPoints(35)).toBe(10) // capped
    })
  })

  // =========================================================================
  // 5. Area Ceiling Enforcement Invariants (70 / 50 / 40)
  // =========================================================================
  describe('5. Area Ceiling & Overflow Calculations', () => {
    it('applies Area A (70), Area B (50), and Area C (40) ceilings without score leakage', () => {
      const normal = RankingCriteriaModel.applyAreaCeilings(40, 30, 20)
      expect(normal.acceptedA).toBe(40)
      expect(normal.acceptedB).toBe(30)
      expect(normal.acceptedC).toBe(20)
      expect(normal.acceptedTotal).toBe(90)
      expect(normal.overflowA).toBe(0)
      expect(normal.overflowB).toBe(0)
      expect(normal.overflowC).toBe(0)

      const overflow = RankingCriteriaModel.applyAreaCeilings(85, 65, 55)
      expect(overflow.acceptedA).toBe(70)
      expect(overflow.acceptedB).toBe(50)
      expect(overflow.acceptedC).toBe(40)
      expect(overflow.acceptedTotal).toBe(160)
      expect(overflow.overflowA).toBe(15)
      expect(overflow.overflowB).toBe(15)
      expect(overflow.overflowC).toBe(15)
    })
  })
})
