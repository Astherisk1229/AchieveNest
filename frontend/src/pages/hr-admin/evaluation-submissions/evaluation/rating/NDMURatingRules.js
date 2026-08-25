/**
 * NDMURatingRules.js
 * Authoritative Central Rules Registry based on the 5-Page Rating Sheet for Ranking (V2).
 * Distinguishes EXPLICIT, STRUCTURALLY_IMPLIED, and UNDEFINED scoring criteria.
 */

export const SOURCE_CONFIDENCE = Object.freeze({
  EXPLICIT: 'EXPLICIT',
  STRUCTURALLY_IMPLIED: 'STRUCTURALLY_IMPLIED',
  UNDEFINED: 'UNDEFINED'
})

export const SCORING_MODES = Object.freeze({
  FIXED_SCORE: 'FIXED_SCORE',
  QUANTITY_DERIVED: 'QUANTITY_DERIVED',
  SINGLE_CATEGORY: 'SINGLE_CATEGORY',
  MULTI_FACTOR: 'MULTI_FACTOR',
  MATRIX_LOOKUP: 'MATRIX_LOOKUP',
  MANUAL_BOUNDED: 'MANUAL_BOUNDED',
  AUTOMATIC_DERIVED: 'AUTOMATIC_DERIVED'
})

export const INSTITUTIONAL_CONFIRMATIONS = Object.freeze({
  a1QualificationStacking: false,
  b1AdditiveFormula: false,
  b2AdditiveFormula: false,
  b3DetailedRubricAvailable: false,
  b6DetailedRubricAvailable: false,
  c1DetailedRubricAvailable: false,
  c2DetailedRubricAvailable: false
})

export const NDMU_PERSONNEL_RATING_RULES = Object.freeze({
  version: 'PENDING_OFFICIAL_VERSION',
  totalMax: 160,

  areaA: {
    title: 'Area A: Professional Development',
    maxPoints: 70,
    criteria: {
      degrees: {
        code: 'A.1',
        title: 'Degree/s',
        maxPoints: 40,
        sourceConfidence: SOURCE_CONFIDENCE.EXPLICIT,
        scoringMode: SCORING_MODES.QUANTITY_DERIVED,
        options: {
          phd_degree: { label: 'Ph.D. Degree Holder', points: 40, mode: SCORING_MODES.FIXED_SCORE },
          phd_units: { label: 'Ph.D. Units (2 pts per 3 completed units, max 10)', pointsPerBlock: 2, unitsPerBlock: 3, maxPoints: 10, mode: SCORING_MODES.QUANTITY_DERIVED },
          ma_degree: { label: 'MA Degree Holder', points: 20, mode: SCORING_MODES.FIXED_SCORE },
          ma_units: { label: 'MA Units (1 pt per 3 completed units, max 10)', pointsPerBlock: 1, unitsPerBlock: 3, maxPoints: 10, mode: SCORING_MODES.QUANTITY_DERIVED }
        }
      },
      memberships: {
        code: 'A.2',
        title: 'Active Membership to Professional Organizations',
        maxPoints: 10,
        sourceConfidence: SOURCE_CONFIDENCE.EXPLICIT,
        scoringMode: SCORING_MODES.SINGLE_CATEGORY,
        options: [
          { label: 'Officer (per office/position held)', value: 'officer', points: 10 },
          { label: 'Member (per active membership)', value: 'member', points: 5 }
        ]
      },
      seminars: {
        code: 'A.3',
        title: 'Seminars / Trainings',
        maxPoints: 20,
        sourceConfidence: SOURCE_CONFIDENCE.EXPLICIT,
        scoringMode: SCORING_MODES.SINGLE_CATEGORY,
        options: [
          { label: 'International Level', value: 'international', points: 10 },
          { label: 'National Level', value: 'national', points: 8 },
          { label: 'Regional Level', value: 'regional', points: 6 },
          { label: 'City / Provincial Level', value: 'city_provincial', points: 4 },
          { label: 'In-House / Institutional Level', value: 'in_house', points: 3 }
        ]
      }
    }
  },

  areaB: {
    title: 'Area B: Productivity and Creative Work',
    sectionCap: 50,
    criteria: {
      lectures: {
        code: 'B.1',
        title: 'Guest Lecturer / Consultant / Judge / Resource Person',
        maxPoints: 40,
        sourceConfidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED,
        scoringMode: SCORING_MODES.MULTI_FACTOR,
        factors: {
          sponsoringOrg: [
            { label: 'External Agencies / Other Schools', value: 'external', points: 2 },
            { label: 'NDMU', value: 'ndmu', points: 1 }
          ],
          extentOfTalk: [
            { label: 'More than 2 Days (Comprehensive Series)', value: 'more_than_2_days', points: 5 },
            { label: '2 Days Workshop / Seminar', value: '2_days', points: 4 },
            { label: '1 Full Day Session', value: '1_day', points: 3 },
            { label: 'Half Day (3–4 Hours)', value: 'half_day', points: 2 },
            { label: '1 Hour Talk / Briefing', value: '1_hour', points: 1 }
          ],
          participantsScope: [
            { label: 'International Participants', value: 'international', points: 4 },
            { label: 'National Audience', value: 'national', points: 3 },
            { label: 'Regional Audience', value: 'regional', points: 2 },
            { label: 'Local Audience', value: 'local', points: 1 }
          ],
          role: [
            { label: 'Reactor / Keynote / Facilitator / Consultant / Speaker / Organizer', value: 'speaker', points: 5 },
            { label: 'Judge / Evaluator', value: 'judge', points: 3 }
          ]
        }
      },
      publications: {
        code: 'B.2',
        title: 'Publication of Scholarly Paper / Article / Research Output / Book',
        maxPoints: 40,
        sourceConfidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED,
        scoringMode: SCORING_MODES.MATRIX_LOOKUP,
        factors: {
          scope: [
            { label: 'International Publication', value: 'international', points: 8 },
            { label: 'National Publication', value: 'national', points: 6 },
            { label: 'Regional Publication', value: 'regional', points: 4 },
            { label: 'Local Publication', value: 'local', points: 3 }
          ],
          publicationType: [
            { label: 'Authored Book', value: 'book', points: 10 },
            { label: 'Research Output', value: 'research_output', points: 10 },
            { label: 'Scholarly Paper in Refereed Journal', value: 'scholarly_paper', points: 8 },
            { label: 'Monograph', value: 'monograph', points: 8 },
            { label: 'Research Compilation', value: 'compilation', points: 5 },
            { label: 'Journal Article / Academic Essay', value: 'article', points: 5 },
            { label: 'Reviews', value: 'reviews', points: 4 },
            { label: 'Commentary', value: 'commentary', points: 2 }
          ]
        }
      },
      research: {
        code: 'B.3',
        title: 'Conduct of Research',
        maxPoints: 40,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      },
      awards: {
        code: 'B.4',
        title: 'Professional Recognition or Awards',
        maxPoints: 40,
        sourceConfidence: SOURCE_CONFIDENCE.EXPLICIT,
        scoringMode: SCORING_MODES.MATRIX_LOOKUP,
        matrix: {
          nominee: {
            local: 5,
            provincial_regional: 15,
            national: 20,
            international: 20
          },
          awardee: {
            local: 10,
            provincial_regional: 30,
            national: 40,
            international: 40
          }
        }
      },
      instructional: {
        code: 'B.5',
        title: 'Production of Instructional Materials',
        maxPoints: 40,
        sourceConfidence: SOURCE_CONFIDENCE.EXPLICIT,
        scoringMode: SCORING_MODES.SINGLE_CATEGORY,
        options: [
          { label: 'Others — Bound Workbook / Exercises / Lecture Notes', value: 'workbook_notes', points: 20 },
          { label: 'Audio-Visual Aids', value: 'audio_visual', points: 10 },
          { label: 'Modules', value: 'modules', points: 10 },
          { label: 'Reviewers (Bound)', value: 'reviewers', points: 10 }
        ]
      },
      creative: {
        code: 'B.6',
        title: 'Creative Work',
        maxPoints: 20,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      }
    }
  },

  areaC: {
    title: 'Area C: Service and Leadership',
    maxPoints: 40,
    criteria: {
      c1_moderator: {
        code: 'C.1.1',
        title: 'Moderator of Clubs / Organizations',
        maxPoints: 20,
        subareaCap: 30,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      },
      c1_coach: {
        code: 'C.1.2',
        title: 'Coach / Trainer',
        maxPoints: 20,
        subareaCap: 30,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      },
      c1_committees: {
        code: 'C.1.3',
        title: 'Membership in Working Committees',
        maxPoints: 20,
        subareaCap: 30,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      },
      c1_intramurals: {
        code: 'C.1.4',
        title: 'Render Service During Intramurals / Etc. / Others',
        maxPoints: 20,
        subareaCap: 30,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      },
      c2_church: {
        code: 'C.2.1',
        title: 'Active Involvement in Church Activities',
        maxPoints: 25,
        subareaCap: 30,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      },
      c2_civic: {
        code: 'C.2.2',
        title: 'Active Involvement in Community / Civic Activities',
        maxPoints: 25,
        subareaCap: 30,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      },
      c2_charity: {
        code: 'C.2.3',
        title: 'Support to Charity and Community Projects',
        maxPoints: 5,
        subareaCap: 30,
        sourceConfidence: SOURCE_CONFIDENCE.UNDEFINED,
        scoringMode: SCORING_MODES.MANUAL_BOUNDED,
        requiresJustification: true
      },
      c3_tenure: {
        code: 'C.3',
        title: 'Number of Years of Service at NDMU (1 pt / 2 completed yrs)',
        maxPoints: 10,
        sourceConfidence: SOURCE_CONFIDENCE.EXPLICIT,
        scoringMode: SCORING_MODES.AUTOMATIC_DERIVED
      }
    }
  }
})
