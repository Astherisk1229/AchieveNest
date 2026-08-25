import { describe, it, expect } from 'vitest'
import {
  calculateNDMUScores,
  calculateCriterionScore,
  NDMU_PERSONNEL_RATING_RULES,
  SOURCE_CONFIDENCE,
  SCORING_MODES,
  INSTITUTIONAL_CONFIRMATIONS
} from '../NDMURatingEngine'

describe('NDMURatingEngine V2 (Rating Sheet for Ranking Alignment)', () => {
  describe('Rule Configuration & Source Confidence', () => {
    it('defines authoritative V2 rules structure, confidence, and caps', () => {
      expect(NDMU_PERSONNEL_RATING_RULES.areaA.maxPoints).toBe(70)
      expect(NDMU_PERSONNEL_RATING_RULES.areaB.sectionCap).toBe(50)
      expect(NDMU_PERSONNEL_RATING_RULES.areaC.maxPoints).toBe(40)
      expect(NDMU_PERSONNEL_RATING_RULES.totalMax).toBe(160)

      expect(NDMU_PERSONNEL_RATING_RULES.areaA.criteria.degrees.sourceConfidence).toBe(SOURCE_CONFIDENCE.EXPLICIT)
      expect(NDMU_PERSONNEL_RATING_RULES.areaB.criteria.lectures.sourceConfidence).toBe(SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED)
      expect(NDMU_PERSONNEL_RATING_RULES.areaB.criteria.research.sourceConfidence).toBe(SOURCE_CONFIDENCE.UNDEFINED)
      expect(NDMU_PERSONNEL_RATING_RULES.areaC.criteria.c3_tenure.sourceConfidence).toBe(SOURCE_CONFIDENCE.EXPLICIT)

      expect(INSTITUTIONAL_CONFIRMATIONS.b1AdditiveFormula).toBe(false)
    })
  })

  describe('Area A Scoring Rules', () => {
    it('A.1: Ph.D. degree holder = 40, MA degree holder = 20', () => {
      expect(calculateCriterionScore('A.1', SCORING_MODES.FIXED_SCORE, { qualificationType: 'phd_degree' })).toBe(40)
      expect(calculateCriterionScore('A.1', SCORING_MODES.FIXED_SCORE, { qualificationType: 'ma_degree' })).toBe(20)
    })

    it('A.1: Ph.D. Units (2 pts per 3 completed units, max 10)', () => {
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'phd_units', verifiedUnits: 0 })).toBe(0)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'phd_units', verifiedUnits: 2 })).toBe(0)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'phd_units', verifiedUnits: 3 })).toBe(2)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'phd_units', verifiedUnits: 6 })).toBe(4)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'phd_units', verifiedUnits: 9 })).toBe(6)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'phd_units', verifiedUnits: 12 })).toBe(8)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'phd_units', verifiedUnits: 15 })).toBe(10)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'phd_units', verifiedUnits: 30 })).toBe(10) // capped at 10
    })

    it('A.1: MA Units (1 pt per 3 completed units, max 10)', () => {
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'ma_units', verifiedUnits: 3 })).toBe(1)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'ma_units', verifiedUnits: 6 })).toBe(2)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'ma_units', verifiedUnits: 9 })).toBe(3)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'ma_units', verifiedUnits: 15 })).toBe(5)
      expect(calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, { qualificationType: 'ma_units', verifiedUnits: 30 })).toBe(10) // capped at 10
    })

    it('A.2: Active Membership (Officer = 10, Member = 5)', () => {
      expect(calculateCriterionScore('A.2', SCORING_MODES.SINGLE_CATEGORY, { role: 'officer' })).toBe(10)
      expect(calculateCriterionScore('A.2', SCORING_MODES.SINGLE_CATEGORY, { role: 'member' })).toBe(5)
    })

    it('A.3: Seminars (In-house = 3, City/Prov = 4, Reg = 6, Nat = 8, Intl = 10)', () => {
      expect(calculateCriterionScore('A.3', SCORING_MODES.SINGLE_CATEGORY, { level: 'in_house' })).toBe(3)
      expect(calculateCriterionScore('A.3', SCORING_MODES.SINGLE_CATEGORY, { level: 'city_provincial' })).toBe(4)
      expect(calculateCriterionScore('A.3', SCORING_MODES.SINGLE_CATEGORY, { level: 'regional' })).toBe(6)
      expect(calculateCriterionScore('A.3', SCORING_MODES.SINGLE_CATEGORY, { level: 'national' })).toBe(8)
      expect(calculateCriterionScore('A.3', SCORING_MODES.SINGLE_CATEGORY, { level: 'international' })).toBe(10)
    })
  })

  describe('Area B Scoring Rules', () => {
    it('B.1: Multi-Factor Guest Lecture formula (Sponsor + Extent + Scope + Role)', () => {
      // External agency (2) + 1 day (3) + National (3) + Speaker (5) = 13
      const payload1 = {
        sponsoringOrg: 'external',
        extentOfTalk: '1_day',
        participantsScope: 'national',
        role: 'speaker'
      }
      expect(calculateCriterionScore('B.1', SCORING_MODES.MULTI_FACTOR, payload1)).toBe(13)

      // NDMU (1) + >2 days (5) + International (4) + Speaker (5) = 15
      const payload2 = {
        sponsoringOrg: 'ndmu',
        extentOfTalk: 'more_than_2_days',
        participantsScope: 'international',
        role: 'speaker'
      }
      expect(calculateCriterionScore('B.1', SCORING_MODES.MULTI_FACTOR, payload2)).toBe(15)
    })

    it('B.2: Publication (Scope + Type sum)', () => {
      // International (8) + Book (10) = 18
      expect(calculateCriterionScore('B.2', SCORING_MODES.MATRIX_LOOKUP, {
        scope: 'international',
        publicationType: 'book'
      })).toBe(18)

      // National (6) + Scholarly Paper (8) = 14
      expect(calculateCriterionScore('B.2', SCORING_MODES.MATRIX_LOOKUP, {
        scope: 'national',
        publicationType: 'scholarly_paper'
      })).toBe(14)

      // Local (3) + Commentary (2) = 5
      expect(calculateCriterionScore('B.2', SCORING_MODES.MATRIX_LOOKUP, {
        scope: 'local',
        publicationType: 'commentary'
      })).toBe(5)
    })

    it('B.4: Professional Awards 2D matrix lookup', () => {
      expect(calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: 'nominee', awardScope: 'local' })).toBe(5)
      expect(calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: 'nominee', awardScope: 'provincial_regional' })).toBe(15)
      expect(calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: 'nominee', awardScope: 'national' })).toBe(20)
      expect(calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: 'nominee', awardScope: 'international' })).toBe(20)

      expect(calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: 'awardee', awardScope: 'local' })).toBe(10)
      expect(calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: 'awardee', awardScope: 'provincial_regional' })).toBe(30)
      expect(calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: 'awardee', awardScope: 'national' })).toBe(40)
      expect(calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: 'awardee', awardScope: 'international' })).toBe(40)
    })

    it('B.5: Instructional Materials explicit values', () => {
      expect(calculateCriterionScore('B.5', SCORING_MODES.SINGLE_CATEGORY, { materialType: 'workbook_notes' })).toBe(20)
      expect(calculateCriterionScore('B.5', SCORING_MODES.SINGLE_CATEGORY, { materialType: 'audio_visual' })).toBe(10)
      expect(calculateCriterionScore('B.5', SCORING_MODES.SINGLE_CATEGORY, { materialType: 'modules' })).toBe(10)
      expect(calculateCriterionScore('B.5', SCORING_MODES.SINGLE_CATEGORY, { materialType: 'reviewers' })).toBe(10)
    })

    it('B.3 and B.6: Bounded Manual Scoring', () => {
      expect(calculateCriterionScore('B.3', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 35 })).toBe(35)
      expect(calculateCriterionScore('B.3', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 50 })).toBe(40) // capped at 40
      expect(calculateCriterionScore('B.6', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 15 })).toBe(15)
      expect(calculateCriterionScore('B.6', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 25 })).toBe(20) // capped at 20
    })
  })

  describe('Area C Scoring Rules & Service Years', () => {
    it('C.1: Subcriteria capped at 20 each', () => {
      expect(calculateCriterionScore('C.1.1', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 18 })).toBe(18)
      expect(calculateCriterionScore('C.1.1', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 25 })).toBe(20) // capped at 20
    })

    it('C.2: Subcriteria maxima (C.2.1 max 25, C.2.2 max 25, C.2.3 max 5)', () => {
      expect(calculateCriterionScore('C.2.1', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 22 })).toBe(22)
      expect(calculateCriterionScore('C.2.1', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 30 })).toBe(25) // capped at 25
      expect(calculateCriterionScore('C.2.3', SCORING_MODES.MANUAL_BOUNDED, { manualPoints: 8 })).toBe(5) // capped at 5
    })

    it('C.3: Number of Years of Service at NDMU (1 pt per 2 completed years, max 10)', () => {
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 0 })).toBe(0)
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 1 })).toBe(0)
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 2 })).toBe(1)
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 3 })).toBe(1)
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 4 })).toBe(2)
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 7 })).toBe(3)
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 10 })).toBe(5)
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 20 })).toBe(10)
      expect(calculateCriterionScore('C.3', SCORING_MODES.AUTOMATIC_DERIVED, { serviceYears: 30 })).toBe(10) // capped at 10
    })
  })

  describe('Area Totals, Subarea Caps & Grand Total Capping', () => {
    it('calculates comprehensive portfolio score enforcing Area A (70), Area B (50), Area C (40), and Grand Total (160)', () => {
      const items = [
        { categoryArea: 'areaA', criterionCode: 'A.1', criterionKey: 'degrees', awardedPoints: 40, verificationStatus: 'verified', ratingStatus: 'rated' },
        { categoryArea: 'areaA', criterionCode: 'A.2', criterionKey: 'memberships', awardedPoints: 10, verificationStatus: 'verified', ratingStatus: 'rated' },
        { categoryArea: 'areaA', criterionCode: 'A.3', criterionKey: 'seminars', awardedPoints: 20, verificationStatus: 'verified', ratingStatus: 'rated' },

        { categoryArea: 'areaB', criterionCode: 'B.1', criterionKey: 'lectures', awardedPoints: 25, verificationStatus: 'verified', ratingStatus: 'rated' },
        { categoryArea: 'areaB', criterionCode: 'B.2', criterionKey: 'publications', awardedPoints: 30, verificationStatus: 'verified', ratingStatus: 'rated' },
        { categoryArea: 'areaB', criterionCode: 'B.4', criterionKey: 'awards', awardedPoints: 40, verificationStatus: 'verified', ratingStatus: 'rated' }, // Area B raw = 95, capped at 50

        { categoryArea: 'areaC', criterionCode: 'C.1.1', criterionKey: 'c1_moderator', awardedPoints: 20, verificationStatus: 'verified', ratingStatus: 'rated' },
        { categoryArea: 'areaC', criterionCode: 'C.1.2', criterionKey: 'c1_coach', awardedPoints: 20, verificationStatus: 'verified', ratingStatus: 'rated' }, // C.1 raw = 40, capped at 30
        { categoryArea: 'areaC', criterionCode: 'C.2.1', criterionKey: 'c2_church', awardedPoints: 25, verificationStatus: 'verified', ratingStatus: 'rated' }, // C.2 raw = 25, capped at 30
      ]

      const result = calculateNDMUScores(items, 10) // 10 years = 5 pts

      expect(result.areaA.total).toBe(70) // 40 + 10 + 20 = 70
      expect(result.areaB.rawTotal).toBe(95)
      expect(result.areaB.awardedTotal).toBe(50) // capped at 50
      expect(result.areaC.c1_awarded).toBe(30) // capped at 30
      expect(result.areaC.c2_awarded).toBe(25)
      expect(result.areaC.tenure).toBe(5)
      expect(result.areaC.total).toBe(40) // 30 + 25 + 5 = 60, capped at 40

      expect(result.grandTotalAwarded).toBe(160) // 70 + 50 + 40 = 160
    })
  })
})
