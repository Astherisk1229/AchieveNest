/**
 * NDMURatingEngine.js
 * Authoritative scoring calculation engine for NDMU Personnel Ranking Evaluations (V2).
 */

import {
  NDMU_PERSONNEL_RATING_RULES,
  SOURCE_CONFIDENCE,
  SCORING_MODES,
  INSTITUTIONAL_CONFIRMATIONS
} from './NDMURatingRules'

export {
  NDMU_PERSONNEL_RATING_RULES,
  SOURCE_CONFIDENCE,
  SCORING_MODES,
  INSTITUTIONAL_CONFIRMATIONS
}

export const NDMU_RATING_RULES = NDMU_PERSONNEL_RATING_RULES

/**
 * Calculates score for a single criterion using authoritative V2 rules or validated payload.
 */
export function calculateCriterionScore(criterionCode, scoringMode, payload = {}) {
  switch (criterionCode) {
    case 'A.1': {
      const type = payload.type || payload.qualificationType || 'phd_degree'
      if (type === 'phd_degree' || (type === 'degree' && payload.degree === 'phd')) {
        return 40
      }
      if (type === 'ma_degree' || (type === 'degree' && payload.degree === 'masters')) {
        return 20
      }
      if (type === 'phd_units' || (type === 'units' && payload.programLevel === 'phd')) {
        const units = parseInt(payload.units ?? payload.verifiedUnits ?? 0, 10)
        return Math.min(10, Math.floor(Math.max(0, units) / 3) * 2)
      }
      if (type === 'ma_units' || (type === 'units' && payload.programLevel === 'masters')) {
        const units = parseInt(payload.units ?? payload.verifiedUnits ?? 0, 10)
        return Math.min(10, Math.floor(Math.max(0, units) / 3) * 1)
      }
      return 0
    }

    case 'A.2': {
      const role = payload.role || payload.selectedOption || 'member'
      return role === 'officer' ? 10 : 5
    }

    case 'A.3': {
      const level = payload.level || payload.selectedOption || 'in_house'
      const levelMap = {
        international: 10,
        national: 8,
        regional: 6,
        city_provincial: 4,
        in_house: 3
      }
      return levelMap[level] || 3
    }

    case 'B.1': {
      // Sponsoring: NDMU = 1, External = 2
      const orgPts = payload.sponsoringOrg === 'external' ? 2 : 1
      // Extent: 1 hr = 1, Half day = 2, 1 day = 3, 2 days = 4, >2 days = 5
      const extentMap = { '1_hour': 1, half_day: 2, '1_day': 3, '2_days': 4, more_than_2_days: 5 }
      const extentPts = extentMap[payload.extentOfTalk] || 1
      // Scope: Local = 1, Regional = 2, National = 3, International = 4
      const scopeMap = { local: 1, regional: 2, national: 3, international: 4 }
      const scopePts = scopeMap[payload.participantsScope] || 1
      // Role: Judge = 3, Speaker/Keynote/etc = 5
      const rolePts = payload.role === 'judge' ? 3 : 5

      return Math.min(40, orgPts + extentPts + scopePts + rolePts)
    }

    case 'B.2': {
      // Scope: Local = 3, Regional = 4, National = 6, International = 8
      const scopeMap = { local: 3, regional: 4, national: 6, international: 8 }
      const scopePts = scopeMap[payload.scope || payload.publicationScope] || 3
      // Type: Commentary 2, Reviews 4, Compilation 5, Article 5, Scholarly Paper 8, Monograph 8, Research Output 10, Book 10
      const typeMap = {
        book: 10,
        research_output: 10,
        scholarly_paper: 8,
        monograph: 8,
        compilation: 5,
        article: 5,
        reviews: 4,
        commentary: 2
      }
      const typePts = typeMap[payload.publicationType] || 5
      return Math.min(40, scopePts + typePts)
    }

    case 'B.4': {
      // Matrix: Nominee (5, 15, 20, 20) vs Awardee (10, 30, 40, 40)
      const status = payload.recognitionStatus || 'nominee'
      const scope = payload.awardScope || payload.scope || 'local'
      const matrix = NDMU_PERSONNEL_RATING_RULES.areaB.criteria.awards.matrix
      const result = matrix[status]?.[scope]
      if (result !== undefined) return result

      // Fallback
      if (status === 'awardee') {
        return scope === 'national' || scope === 'international' ? 40 : (scope === 'provincial_regional' || scope === 'regional' ? 30 : 10)
      }
      return scope === 'national' || scope === 'international' ? 20 : (scope === 'provincial_regional' || scope === 'regional' ? 15 : 5)
    }

    case 'B.5': {
      const mat = payload.materialType || payload.selectedOption || 'modules'
      const matMap = {
        workbook_notes: 20,
        audio_visual: 10,
        modules: 10,
        reviewers: 10
      }
      return matMap[mat] || 10
    }

    case 'B.3':
      return Math.min(40, Math.max(0, parseFloat(payload.manualPoints || payload.points || 0)))

    case 'B.6':
      return Math.min(20, Math.max(0, parseFloat(payload.manualPoints || payload.points || 0)))

    case 'C.1':
    case 'C.1.1':
    case 'C.1.2':
    case 'C.1.3':
    case 'C.1.4':
      return Math.min(20, Math.max(0, parseFloat(payload.manualPoints || payload.points || 0)))

    case 'C.2':
    case 'C.2.1':
    case 'C.2.2':
      return Math.min(25, Math.max(0, parseFloat(payload.manualPoints || payload.points || 0)))

    case 'C.2.3':
      return Math.min(5, Math.max(0, parseFloat(payload.manualPoints || payload.points || 0)))

    case 'C.3':
      return Math.min(10, Math.floor(Math.max(0, parseInt(payload.serviceYears || payload.tenureYears || 0, 10)) / 2))

    default:
      return Math.max(0, parseFloat(payload.manualPoints || payload.points || payload.awardedPoints || 0))
  }
}

/**
 * Calculates raw and awarded capped scores for a personnel ranking portfolio.
 * Preserves both raw and awarded scores at subcriterion, area, and grand total levels.
 */
export function calculateNDMUScores(evaluatedItems = [], tenureYears = 0) {
  let areaA = { degrees: 0, memberships: 0, seminars: 0, total: 0 }
  let areaBRaw = { lectures: 0, publications: 0, research: 0, awards: 0, instructional: 0, creative: 0, total: 0 }
  let areaCRaw = {
    c1_raw: 0,
    c2_raw: 0,
    c1_awarded: 0,
    c2_awarded: 0,
    extracurricular: 0,
    community: 0,
    tenure: Math.min(10, Math.floor(Math.max(0, parseInt(tenureYears || 0, 10)) / 2)),
    total: 0
  }

  const itemsList = Array.isArray(evaluatedItems) ? evaluatedItems : []

  itemsList.forEach((item) => {
    const isVerified = item.verificationStatus === 'verified' || item.verification_status === 'verified'
    const isRated = item.ratingStatus === 'rated' || item.rating_status === 'rated'
    if (!isVerified || !isRated) return

    const pts = parseFloat(item.awardedPoints ?? item.awarded_points ?? 0)
    if (isNaN(pts) || pts <= 0) return

    const categoryArea = item.categoryArea || item.category_area
    const criterionKey = item.criterionKey || item.criterion_key
    const criterionCode = item.criterionCode || item.criterion_code

    if (categoryArea === 'areaA') {
      if (criterionKey === 'degrees' || criterionCode === 'A.1') areaA.degrees += pts
      else if (criterionKey === 'memberships' || criterionCode === 'A.2') areaA.memberships += pts
      else if (criterionKey === 'seminars' || criterionCode === 'A.3') areaA.seminars += pts
    } else if (categoryArea === 'areaB') {
      if (criterionKey === 'lectures' || criterionCode === 'B.1') areaBRaw.lectures += pts
      else if (criterionKey === 'publications' || criterionCode === 'B.2') areaBRaw.publications += pts
      else if (criterionKey === 'research' || criterionCode === 'B.3') areaBRaw.research += pts
      else if (criterionKey === 'awards' || criterionCode === 'B.4') areaBRaw.awards += pts
      else if (criterionKey === 'instructional' || criterionCode === 'B.5') areaBRaw.instructional += pts
      else if (criterionKey === 'creative' || criterionCode === 'B.6') areaBRaw.creative += pts
      else areaBRaw.publications += pts
    } else if (categoryArea === 'areaC') {
      if (criterionCode?.startsWith('C.1') || criterionKey?.startsWith('c1_') || criterionKey === 'extracurricular') {
        areaCRaw.c1_raw += pts
      } else if (criterionCode?.startsWith('C.2') || criterionKey?.startsWith('c2_') || criterionKey === 'community') {
        areaCRaw.c2_raw += pts
      }
    }
  })

  // Apply Subcriterion Caps for Area A
  areaA.degrees = Math.min(40, areaA.degrees)
  areaA.memberships = Math.min(10, areaA.memberships)
  areaA.seminars = Math.min(20, areaA.seminars)
  areaA.total = Math.min(NDMU_PERSONNEL_RATING_RULES.areaA.maxPoints, areaA.degrees + areaA.memberships + areaA.seminars)

  // Apply Individual Maxima for Area B Subcriteria before Area B Cap (50)
  areaBRaw.lectures = Math.min(40, areaBRaw.lectures)
  areaBRaw.publications = Math.min(40, areaBRaw.publications)
  areaBRaw.research = Math.min(40, areaBRaw.research)
  areaBRaw.awards = Math.min(40, areaBRaw.awards)
  areaBRaw.instructional = Math.min(40, areaBRaw.instructional)
  areaBRaw.creative = Math.min(20, areaBRaw.creative)

  areaBRaw.total = areaBRaw.lectures + areaBRaw.publications + areaBRaw.research +
                   areaBRaw.awards + areaBRaw.instructional + areaBRaw.creative
  const areaBAwarded = Math.min(NDMU_PERSONNEL_RATING_RULES.areaB.sectionCap, areaBRaw.total)

  // Apply Area C Subarea Caps (C.1 max 30, C.2 max 30, C.3 max 10) & Area Cap (40)
  areaCRaw.c1_awarded = Math.min(30, areaCRaw.c1_raw)
  areaCRaw.c2_awarded = Math.min(30, areaCRaw.c2_raw)
  areaCRaw.extracurricular = areaCRaw.c1_awarded
  areaCRaw.community = areaCRaw.c2_awarded
  areaCRaw.total = Math.min(NDMU_PERSONNEL_RATING_RULES.areaC.maxPoints, areaCRaw.c1_awarded + areaCRaw.c2_awarded + areaCRaw.tenure)

  const rawGrandTotal = areaA.total + areaBRaw.total + (areaCRaw.c1_raw + areaCRaw.c2_raw + areaCRaw.tenure)
  const grandTotalAwarded = Math.min(NDMU_PERSONNEL_RATING_RULES.totalMax, areaA.total + areaBAwarded + areaCRaw.total)

  return {
    areaA,
    areaB: {
      ...areaBRaw,
      rawTotal: areaBRaw.total,
      awardedTotal: areaBAwarded,
      total: areaBAwarded,
      details: areaBRaw
    },
    areaC: areaCRaw,
    rawGrandTotal,
    grandTotalAwarded,
    grandTotal: grandTotalAwarded,
    totalScore: grandTotalAwarded
  }
}
