import { describe, it, expect } from 'vitest'
import { AchievementClassificationService, RULE_REFERENCE_VERSION } from '../../services/achievementClassificationService.js'

describe('AchievementClassificationService — Phase A3 Unit & Boundary Tests', () => {

  // =========================================================================
  // 18.1 & 18.2: Exact Category Match & Canonical Advisory Points Calculation
  // =========================================================================
  describe('Area A: Professional Development Suggestions', () => {
    it('suggests 40 points for Ph.D. Degree Holder under Criterion A.1', () => {
      const result = AchievementClassificationService.classifyAchievement({
        category: 'A.1 Degree/s',
        degreeLevel: 'Ph.D. Degree Holder'
      })

      expect(result.suggestedCategory).toBe('A.1 Degree/s')
      expect(result.suggestedSubcategory).toBe('Ph.D. Degree Holder')
      expect(result.criterionCode).toBe('A.1')
      expect(result.suggestedPoints).toBe(40)
      expect(result.isAdvisory).toBe(true)
      expect(result.ruleReference).toBe(RULE_REFERENCE_VERSION)
    })

    it('suggests 20 points for Master\'s Degree Holder under Criterion A.1', () => {
      const result = AchievementClassificationService.classifyAchievement({
        category: 'A.1 Degree/s',
        degreeLevel: "Master's Degree Holder"
      })

      expect(result.suggestedCategory).toBe('A.1 Degree/s')
      expect(result.suggestedSubcategory).toBe("Master's Degree Holder")
      expect(result.criterionCode).toBe('A.1')
      expect(result.suggestedPoints).toBe(20)
      expect(result.isAdvisory).toBe(true)
    })

    it('calculates 6 points for 9 completed Ph.D. units (2 pts per 3 units, max 10)', () => {
      const result = AchievementClassificationService.classifyAchievement({
        category: 'A.1 Degree/s',
        degreeLevel: 'Ph.D. Units',
        unitsCompleted: 9
      })

      expect(result.criterionCode).toBe('A.1')
      expect(result.suggestedSubcategory).toBe('Ph.D. Units')
      expect(result.suggestedPoints).toBe(6)
    })

    it('caps Ph.D. units points at 10 for 24 completed units', () => {
      const result = AchievementClassificationService.classifyAchievement({
        category: 'A.1 Degree/s',
        degreeLevel: 'Ph.D. Units',
        unitsCompleted: 24
      })

      expect(result.suggestedPoints).toBe(10)
    })

    it('calculates 3 points for 9 completed Master\'s units (1 pt per 3 units, max 10)', () => {
      const result = AchievementClassificationService.classifyAchievement({
        category: 'A.1 Degree/s',
        degreeLevel: "Master's Units",
        unitsCompleted: 9
      })

      expect(result.criterionCode).toBe('A.1')
      expect(result.suggestedSubcategory).toBe("Master's Units")
      expect(result.suggestedPoints).toBe(3)
    })

    it('suggests 10 points for Officer and 5 points for Member in Criterion A.2', () => {
      const officerRes = AchievementClassificationService.classifyAchievement({
        category: 'A.2 Active Membership to Prof Orgs',
        orgPosition: 'Officer'
      })
      expect(officerRes.criterionCode).toBe('A.2')
      expect(officerRes.suggestedPoints).toBe(10)

      const memberRes = AchievementClassificationService.classifyAchievement({
        category: 'A.2 Active Membership to Prof Orgs',
        orgPosition: 'Member'
      })
      expect(memberRes.criterionCode).toBe('A.2')
      expect(memberRes.suggestedPoints).toBe(5)
    })

    it('calculates correct points for Seminar Attendance across all scope levels in Criterion A.3', () => {
      const scopes = [
        { scopeLevel: 'International', expectedPts: 10 },
        { scopeLevel: 'National', expectedPts: 8 },
        { scopeLevel: 'Regional', expectedPts: 6 },
        { scopeLevel: 'City / Provincial', expectedPts: 4 },
        { scopeLevel: 'In-House', expectedPts: 3 }
      ]

      for (const { scopeLevel, expectedPts } of scopes) {
        const res = AchievementClassificationService.classifyAchievement({
          category: 'A.3 Attendance to Seminars/Trainings',
          scopeLevel
        })
        expect(res.criterionCode).toBe('A.3')
        expect(res.suggestedPoints).toBe(expectedPts)
        expect(res.isAdvisory).toBe(true)
      }
    })
  })

  describe('Area B: Productivity and Creative Work Suggestions', () => {
    it('suggests correct points for Guest Lecturer & Speaker roles in Criterion B.1', () => {
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.1 Guest Lecturer / Consultant / Judge', { speakerRole: 'Keynote Speaker' })).toBe(10)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.1 Guest Lecturer / Consultant / Judge', { speakerRole: 'Resource Person' })).toBe(8)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.1 Guest Lecturer / Consultant / Judge', { speakerRole: 'Facilitator' })).toBe(6)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.1 Guest Lecturer / Consultant / Judge', { speakerRole: 'Judge' })).toBe(5)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.1 Guest Lecturer / Consultant / Judge', { speakerRole: 'Reactor' })).toBe(3)
    })

    it('suggests correct points for Publications under Criterion B.2', () => {
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.2 Publication', { pubType: 'Book' })).toBe(10)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.2 Publication', { pubType: 'Scholarly Paper in Refereed Journal' })).toBe(8)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.2 Publication', { pubType: 'Journal Article' })).toBe(5)
    })

    it('suggests correct points for Research Projects under Criterion B.3', () => {
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.3 Conduct of Research', { fundingStatus: 'Externally Funded Research Project' })).toBe(20)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.3 Conduct of Research', { fundingStatus: 'Completed Institutional Research' })).toBe(15)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.3 Conduct of Research', { fundingStatus: 'Departmental Research' })).toBe(10)
    })

    it('suggests correct points for Awardee and Nominee across scopes under Criterion B.4', () => {
      // Awardee
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.4 Professional Recognition or Awards', { awardType: 'Awardee', scopeLevel: 'National' })).toBe(40)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.4 Professional Recognition or Awards', { awardType: 'Awardee', scopeLevel: 'Regional' })).toBe(30)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.4 Professional Recognition or Awards', { awardType: 'Awardee', scopeLevel: 'Local' })).toBe(10)

      // Nominee
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.4 Professional Recognition or Awards', { awardType: 'Nominee', scopeLevel: 'National' })).toBe(20)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.4 Professional Recognition or Awards', { awardType: 'Nominee', scopeLevel: 'Regional' })).toBe(15)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.4 Professional Recognition or Awards', { awardType: 'Nominee', scopeLevel: 'Local' })).toBe(5)
    })

    it('suggests correct points for Instructional Materials under Criterion B.5', () => {
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.5 Production of Instructional Materials', { matType: 'Bound Workbook / Exercises' })).toBe(20)
      expect(AchievementClassificationService.calculateAdvisoryPoints('B.5 Production of Instructional Materials', { matType: 'Modules' })).toBe(10)
    })
  })

  describe('Area C: Service & Leadership Suggestions', () => {
    it('suggests 20 points for Extra-Curricular / Institutional Leadership under C.1', () => {
      const res = AchievementClassificationService.classifyAchievement({
        category: 'C.1 Extra-Curricular Activities'
      })
      expect(res.criterionCode).toBe('C.1.1')
      expect(res.suggestedPoints).toBe(20)
    })

    it('suggests 25 points for Community/Church and 5 points for Charity support under C.2', () => {
      const churchRes = AchievementClassificationService.classifyAchievement({
        category: 'C.2 Community Involvement',
        subType: 'Community / Church Involvement'
      })
      expect(churchRes.criterionCode).toBe('C.2.1')
      expect(churchRes.suggestedPoints).toBe(25)

      const charityRes = AchievementClassificationService.classifyAchievement({
        category: 'C.2 Community Involvement',
        subType: 'Support to Charity / Projects'
      })
      expect(charityRes.criterionCode).toBe('C.2.3')
      expect(charityRes.suggestedPoints).toBe(5)
    })
  })

  // =========================================================================
  // 18.3, 18.4, 18.5: Missing Required Attributes, Ambiguity & No-Match Handling
  // =========================================================================
  describe('Missing Fields and Unresolved Cases Handling', () => {
    it('returns unresolved state with null points when category is completely empty', () => {
      const result = AchievementClassificationService.classifyAchievement({})

      expect(result.suggestedCategory).toBeNull()
      expect(result.suggestedSubcategory).toBeNull()
      expect(result.criterionCode).toBeNull()
      expect(result.suggestedPoints).toBeNull()
      expect(result.isUnresolved).toBe(true)
      expect(result.isAdvisory).toBe(true)
      expect(result.ruleReference).toBe(RULE_REFERENCE_VERSION)
    })

    it('returns null points for A.1 when degree level is unspecified and units are missing', () => {
      const result = AchievementClassificationService.classifyAchievement({
        category: 'A.1 Degree/s'
      })

      expect(result.suggestedCategory).toBe('A.1 Degree/s')
      expect(result.suggestedPoints).toBeNull()
      expect(result.matchedReason).toContain('required')
    })
  })

  // =========================================================================
  // 18.8: Separation of Concerns & Personnel Model Invariants
  // =========================================================================
  describe('Strict Separation of Concerns & System Boundaries', () => {
    it('never produces evaluator-accepted points or final evaluation scores in Plan A output', () => {
      const result = AchievementClassificationService.classifyAchievement({
        category: 'A.1 Degree/s',
        degreeLevel: 'Ph.D. Degree Holder'
      })

      expect(result.acceptedPoints).toBeUndefined()
      expect(result.finalScore).toBeUndefined()
      expect(result.evaluationStatus).toBeUndefined()
      expect(result.passedRetained).toBeUndefined()
      expect(result.isAdvisory).toBe(true)
    })

    it('does not mutate or produce Personnel Group (Plan D) or Reviewer Route (Plan G)', () => {
      const result = AchievementClassificationService.classifyAchievement({
        category: 'A.3 Attendance to Seminars/Trainings',
        scopeLevel: 'National'
      })

      expect(result.personnelGroup).toBeUndefined()
      expect(result.organizationalSide).toBeUndefined()
      expect(result.facultyStatus).toBeUndefined()
      expect(result.reviewerRoute).toBeUndefined()
      expect(result.rankProgression).toBeUndefined()
    })
  })
})
