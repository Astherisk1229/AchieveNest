/**
 * RankingCriteriaModel.js
 * Encapsulates Notre Dame of Marbel University (NDMU) Ranking & Evaluation Point Schedules,
 * Area Ceiling Constants, Scope Multipliers, and Capping Calculation Logic.
 */

export default class RankingCriteriaModel {
  // AREA CEILING CONSTANTS (NDMU Standard)
  static AREA_CEILINGS = Object.freeze({
    AREA_A: 70, // Professional Development
    AREA_B: 50, // Productivity & Creative Work
    AREA_C: 40, // Service & Leadership
    MAX_TOTAL: 160
  })

  // OFFICIAL NDMU CATEGORIES & SUB-CATEGORIES HIERARCHY
  static CATEGORIES_HIERARCHY = Object.freeze({
    A: {
      name: 'Area A: Professional Development',
      maxPoints: 70,
      categories: {
        'A.1 Degree/s': {
          maxPoints: 40,
          subCategories: [
            { name: 'Ph.D. Degree Holder', defaultPoints: 40 },
            { name: 'Ph.D. Units Earned', defaultPoints: 10 },
            { name: 'MA Degree Holder', defaultPoints: 20 },
            { name: 'MA Units Earned', defaultPoints: 10 }
          ]
        },
        'A.2 Active Membership to Prof Orgs': {
          maxPoints: 10,
          subCategories: [
            { name: 'Regular Member', defaultPoints: 5 },
            { name: 'Officer / Board Position', defaultPoints: 10 }
          ]
        },
        'A.3 Attendance to Seminars/Trainings': {
          maxPoints: 20,
          subCategories: [
            { name: 'In-House Seminar (NDMU)', defaultPoints: 3 },
            { name: 'City / Provincial Seminar', defaultPoints: 4 },
            { name: 'Regional Seminar', defaultPoints: 6 },
            { name: 'National Seminar', defaultPoints: 8 },
            { name: 'International Seminar', defaultPoints: 10 }
          ]
        }
      }
    },
    B: {
      name: 'Area B: Productivity and Creative Work',
      maxPoints: 50,
      categories: {
        'B.1 Guest Lecturer / Consultant / Judge': {
          maxPoints: 40,
          subCategories: [
            { name: 'Keynote Speaker', defaultPoints: 10 },
            { name: 'Resource Person / Consultant', defaultPoints: 8 },
            { name: 'Facilitator / Event Organizer', defaultPoints: 6 },
            { name: 'Judge / Evaluator', defaultPoints: 5 },
            { name: 'Reactor / Panelist', defaultPoints: 3 }
          ]
        },
        'B.2 Publication': {
          maxPoints: 40,
          subCategories: [
            { name: 'Book', defaultPoints: 5 },
            { name: 'Research Output', defaultPoints: 5 },
            { name: 'Scholarly Paper', defaultPoints: 5 },
            { name: 'Article', defaultPoints: 4 },
            { name: 'Monograph', defaultPoints: 4 },
            { name: 'Compilation', defaultPoints: 5 },
            { name: 'Reviews', defaultPoints: 4 },
            { name: 'Commentary', defaultPoints: 2 }
          ]
        },
        'B.3 Conduct of Research': {
          maxPoints: 40,
          subCategories: [
            { name: 'Completed Institutional Research', defaultPoints: 15 },
            { name: 'Externally Funded Research Project', defaultPoints: 20 },
            { name: 'Ongoing Commissioned Research', defaultPoints: 10 }
          ]
        },
        'B.4 Professional Recognition or Awards': {
          maxPoints: 40,
          subCategories: [
            { name: 'Awardee (International / National)', defaultPoints: 40 },
            { name: 'Awardee (Regional / Provincial)', defaultPoints: 30 },
            { name: 'Awardee (Local)', defaultPoints: 10 },
            { name: 'Nominee (National / Regional)', defaultPoints: 20 }
          ]
        },
        'B.5 Production of Instructional Materials': {
          maxPoints: 40,
          subCategories: [
            { name: 'Workbook / Exercises / Lecture Notes (Bound)', defaultPoints: 20 },
            { name: 'Modules (Bound)', defaultPoints: 10 },
            { name: 'Reviewers (Bound)', defaultPoints: 10 },
            { name: 'Audio-Visual Aids / Software', defaultPoints: 10 }
          ]
        },
        'B.6 Creative Work': {
          maxPoints: 20,
          subCategories: [
            { name: 'Creative Exhibition / Performance', defaultPoints: 20 }
          ]
        }
      }
    },
    C: {
      name: 'Area C: Service and Leadership',
      maxPoints: 40,
      categories: {
        'C.1 Involvement in Extra-Curricular Activities': {
          maxPoints: 40,
          subCategories: [
            { name: 'C.1.1 Moderator of Clubs / Organizations', defaultPoints: 20 },
            { name: 'C.1.2 Coach / Trainer', defaultPoints: 20 },
            { name: 'C.1.3 Membership in Working Committees', defaultPoints: 20 },
            { name: 'C.1.4 Intramurals / Special School Service', defaultPoints: 20 }
          ]
        },
        'C.2 Community Involvement': {
          maxPoints: 30,
          subCategories: [
            { name: 'C.2.1 Active Church Involvement', defaultPoints: 25 },
            { name: 'C.2.2 Community / Civic Involvement', defaultPoints: 25 },
            { name: 'C.2.3 Support to Charity / Projects', defaultPoints: 5 }
          ]
        },
        'C.3 NDMU Service Credit': {
          maxPoints: 10,
          subCategories: [
            { name: 'Years of Service Credit (1 pt / 2 yrs)', defaultPoints: 10 }
          ]
        }
      }
    }
  })

  // SUB-CATEGORY CEILING CONSTANTS
  static SUB_CEILINGS = Object.freeze({
    A1_DEGREE: 40,
    A2_MEMBERSHIP: 10,
    A3_SEMINARS: 20,
    B1_LECTURER: 40,
    B2_PUBLICATIONS: 40,
    B3_RESEARCH: 40,
    B4_AWARDS: 40,
    B5_MATERIALS: 40,
    B6_CREATIVE: 20,
    C1_ACTIVITIES: 40,
    C2_COMMUNITY: 30,
    C3_SERVICE_YEARS: 10
  })

  // SCOPE / LEVEL POINT SCHEDULES
  static SEMINAR_POINTS = Object.freeze({
    'In-house': 3,
    'City/Provincial': 4,
    'Regional': 6,
    'National': 8,
    'International': 10
  })

  static MEMBERSHIP_POINTS = Object.freeze({
    'Member': 5,
    'Officer': 10
  })

  static DEGREE_POINTS = Object.freeze({
    'Ph.D. Degree Holder': 40,
    'Ph.D. Units': 2, // 2 pts per 3 units (max 10)
    'MA Degree Holder': 20,
    'MA Units': 1   // 1 pt per 3 units (max 10)
  })

  static AWARD_POINTS = Object.freeze({
    Nominee: {
      Local: 5,
      'Provincial/Regional': 15,
      National: 20,
      International: 20
    },
    Awardee: {
      Local: 10,
      'Provincial/Regional': 30,
      National: 40,
      International: 40
    }
  })

  static MATERIAL_POINTS = Object.freeze({
    'Audio-Visual Aids': 10,
    'Modules': 10,
    'Reviewers (Bound)': 10,
    'Workbook / Exercises / Lecture Notes': 20
  })

  /**
   * Calculates points for NDMU Years of Service.
   * Rule: 1 point for every 2 full years of service (Max 10 pts).
   * @param {number} years 
   * @returns {number}
   */
  static calculateServiceYearsPoints(years = 0) {
    const numericYears = Math.max(0, Number(years) || 0)
    const points = Math.floor(numericYears / 2)
    return Math.min(RankingCriteriaModel.SUB_CEILINGS.C3_SERVICE_YEARS, points)
  }

  /**
   * Computes MA or Ph.D. units points.
   * @param {'MA Units' | 'Ph.D. Units'} type 
   * @param {number} units 
   * @returns {number}
   */
  static calculateDegreeUnitsPoints(type, units = 0) {
    const u = Math.max(0, Number(units) || 0)
    if (type === 'Ph.D. Units') {
      // 2 pts per 3 units, max 10 pts
      return Math.min(10, Math.floor(u / 3) * 2)
    }
    if (type === 'MA Units') {
      // 1 pt per 3 units, max 10 pts
      return Math.min(10, Math.floor(u / 3) * 1)
    }
    return 0
  }

  /**
   * Applies Maximum Area Ceiling Caps to raw verified points.
   * @param {number} rawA 
   * @param {number} rawB 
   * @param {number} rawC 
   * @returns {{ acceptedA: number, acceptedB: number, acceptedC: number, acceptedTotal: number, overflowA: number, overflowB: number, overflowC: number }}
   */
  static applyAreaCeilings(rawA = 0, rawB = 0, rawC = 0) {
    const validA = Math.max(0, Number(rawA) || 0)
    const validB = Math.max(0, Number(rawB) || 0)
    const validC = Math.max(0, Number(rawC) || 0)

    const acceptedA = Math.min(RankingCriteriaModel.AREA_CEILINGS.AREA_A, validA)
    const acceptedB = Math.min(RankingCriteriaModel.AREA_CEILINGS.AREA_B, validB)
    const acceptedC = Math.min(RankingCriteriaModel.AREA_CEILINGS.AREA_C, validC)

    return {
      acceptedA,
      acceptedB,
      acceptedC,
      acceptedTotal: acceptedA + acceptedB + acceptedC,
      overflowA: Math.max(0, validA - acceptedA),
      overflowB: Math.max(0, validB - acceptedB),
      overflowC: Math.max(0, validC - acceptedC)
    }
  }

  /**
   * Returns the required verification proof document hint for a given category/subcategory.
   */
  static getRequiredProofType(areaKey, mainCat = '', subCat = '') {
    const text = `${mainCat} ${subCat}`.toLowerCase()
    if (text.includes('degree') || text.includes('ph.d.') || text.includes('ma degree')) {
      return 'Official Diploma / Transcript of Records (TOR)'
    }
    if (text.includes('unit')) {
      return 'Official Transcript of Records (TOR) / Units Certificate'
    }
    if (text.includes('membership') || text.includes('member')) {
      return 'Official Certificate of Membership / ID'
    }
    if (text.includes('officer') || text.includes('board')) {
      return 'Appointment Letter / Certificate of Incumbency'
    }
    if (text.includes('seminar') || text.includes('training')) {
      return 'Certificate of Attendance / Participation'
    }
    if (text.includes('speaker') || text.includes('lecturer') || text.includes('resource')) {
      return 'Invitation Letter & Certificate of Appreciation'
    }
    if (text.includes('publication') || text.includes('paper') || text.includes('book') || text.includes('article')) {
      return 'Published Journal Copy / DOI / ISBN Page'
    }
    if (text.includes('research')) {
      return 'Final Research Approval / URCO Certificate / Contract'
    }
    if (text.includes('award') || text.includes('recognition')) {
      return 'Award Plaque Photo / Official Certificate of Award'
    }
    if (text.includes('material') || text.includes('module') || text.includes('workbook')) {
      return 'Bound Material Copy / Dean Approval Sign-off'
    }
    if (text.includes('moderator') || text.includes('coach') || text.includes('committee')) {
      return 'Official Designation Letter / Special Order'
    }
    if (text.includes('church') || text.includes('community') || text.includes('civic')) {
      return 'Certificate of Service / Appreciation from Parish/LGU/NGO'
    }
    return 'Official Verification Document / Certificate'
  }
}
