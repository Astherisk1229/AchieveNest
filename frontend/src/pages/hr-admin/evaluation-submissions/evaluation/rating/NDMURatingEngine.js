/**
 * NDMURatingEngine.js
 * Single Source of Truth scoring engine based on NDMU_RATING_SHEET_FOR_RANKING_SPEC.md.
 */

export const NDMU_RATING_RULES = {
  areaA: {
    title: 'Area A: Professional Development',
    maxPoints: 70,
    criteria: {
      degrees: { title: 'A.1 Educational Degrees', maxPoints: 40 },
      memberships: { title: 'A.2 Professional Organization Memberships', maxPoints: 10 },
      seminars: { title: 'A.3 Seminars & Trainings', maxPoints: 20 },
    }
  },
  areaB: {
    title: 'Area B: Productivity & Creative Work',
    sectionCap: 50,
    criteria: {
      lectures: { title: 'B.1 Guest Lecturer / Resource Person', maxPoints: 40 },
      publications: { title: 'B.2 Publications (Papers, Articles, Books)', maxPoints: 40 },
      research: { title: 'B.3 Conduct of Research', maxPoints: 40 },
      awards: { title: 'B.4 Professional Recognition or Awards', maxPoints: 40 },
      instructional: { title: 'B.5 Production of Instructional Materials', maxPoints: 40 },
      creative: { title: 'B.6 Creative Work', maxPoints: 20 },
    }
  },
  areaC: {
    title: 'Area C: Service & Leadership',
    maxPoints: 40,
    criteria: {
      extracurricular: { title: 'C.1 Extracurricular / Club Moderation', maxPoints: 30 },
      community: { title: 'C.2 Community & Church Involvement', maxPoints: 30 },
      tenure: { title: 'C.3 Years of Service at NDMU (1 pt / 2 yrs)', maxPoints: 10 },
    }
  },
  grandTotalCap: 160
}

/**
 * Calculates raw and awarded capped scores for a faculty portfolio submission.
 */
export function calculateNDMUScores(verifiedItems = [], tenureYears = 7) {
  let areaA = { degrees: 0, memberships: 0, seminars: 0, total: 0 }
  let areaBRaw = { lectures: 0, publications: 0, research: 0, awards: 0, instructional: 0, creative: 0, total: 0 }
  let areaCRaw = { extracurricular: 0, community: 0, tenure: 0, total: 0 }

  // Tenure calculation: 1 pt per 2 years (Max 10 pts)
  areaCRaw.tenure = Math.min(10, Math.floor((tenureYears || 0) / 2))

  const itemsList = Array.isArray(verifiedItems) ? verifiedItems : []

  itemsList.forEach(item => {
    if (item.verificationStatus !== 'verified') return

    const pts = parseFloat(item.awardedPoints) || parseFloat(item.eligiblePoints) || 0

    switch (item.categoryArea) {
      case 'areaA':
        if (item.criterionKey && areaA[item.criterionKey] !== undefined) {
          areaA[item.criterionKey] += pts
        } else {
          areaA.seminars += pts
        }
        break

      case 'areaB':
        if (item.criterionKey && areaBRaw[item.criterionKey] !== undefined) {
          areaBRaw[item.criterionKey] += pts
        } else {
          areaBRaw.publications += pts
        }
        break

      case 'areaC':
        if (item.criterionKey && areaCRaw[item.criterionKey] !== undefined) {
          areaCRaw[item.criterionKey] += pts
        } else {
          areaCRaw.extracurricular += pts
        }
        break

      default:
        break
    }
  })

  // Apply Section Caps
  areaA.degrees = Math.min(NDMU_RATING_RULES.areaA.criteria.degrees.maxPoints, areaA.degrees)
  areaA.memberships = Math.min(NDMU_RATING_RULES.areaA.criteria.memberships.maxPoints, areaA.memberships)
  areaA.seminars = Math.min(NDMU_RATING_RULES.areaA.criteria.seminars.maxPoints, areaA.seminars)
  areaA.total = Math.min(NDMU_RATING_RULES.areaA.maxPoints, areaA.degrees + areaA.memberships + areaA.seminars)

  areaBRaw.total = areaBRaw.lectures + areaBRaw.publications + areaBRaw.research + areaBRaw.awards + areaBRaw.instructional + areaBRaw.creative
  const areaBAwarded = Math.min(NDMU_RATING_RULES.areaB.sectionCap, areaBRaw.total)

  areaCRaw.extracurricular = Math.min(NDMU_RATING_RULES.areaC.criteria.extracurricular.maxPoints, areaCRaw.extracurricular)
  areaCRaw.community = Math.min(NDMU_RATING_RULES.areaC.criteria.community.maxPoints, areaCRaw.community)
  areaCRaw.total = Math.min(NDMU_RATING_RULES.areaC.maxPoints, areaCRaw.extracurricular + areaCRaw.community + areaCRaw.tenure)

  const rawGrandTotal = areaA.total + areaBRaw.total + areaCRaw.total
  const grandTotalAwarded = Math.min(NDMU_RATING_RULES.grandTotalCap, areaA.total + areaBAwarded + areaCRaw.total)

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
    grandTotal: grandTotalAwarded
  }
}
