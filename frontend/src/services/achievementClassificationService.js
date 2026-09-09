/**
 * achievementClassificationService.js
 * Service providing deterministic achievement classification and advisory suggested/claimed points
 * consuming the canonical NDMU Criteria rules (Plan F).
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. Plan A owns Achievement Classification & Advisory Suggested/Claimed Points.
 * 2. Plan D owns Personnel Classification (Faculty vs Non-Teaching Faculty; Academic vs Non-Academic).
 * 3. Plan F owns authoritative scoring rules, criteria definitions, and area ceilings.
 * 4. Plan G owns reviewer routing, evaluator authority, and accepted-point recording.
 * 5. Suggested points are strictly advisory and NEVER produce accepted points or final scores.
 */

import { NDMU_PERSONNEL_RATING_RULES, SOURCE_CONFIDENCE } from '../pages/hr-admin/evaluation-submissions/evaluation/rating/NDMURatingRules.js'

export const RULE_REFERENCE_VERSION = 'NDMU-PERSONNEL-RATING-V2'

export const AchievementClassificationService = {
  /**
   * Evaluates confirmed achievement fields and optional OCR attributes to produce
   * an advisory classification and claimed point suggestion.
   *
   * @param {object} fields Confirmed achievement attributes (title, category, degreeLevel, etc.)
   * @param {object|null} ocrResult Optional OCR diagnostic result (advisory only)
   * @returns {object} Structured advisory classification payload
   */
  classifyAchievement(fields = {}, ocrResult = null) {
    const rawCat = fields.category || ocrResult?.detectedCategory || ''
    const normalizedCat = this.normalizeCategoryCode(rawCat)

    if (!normalizedCat) {
      return {
        suggestedCategory: null,
        suggestedSubcategory: null,
        criterionCode: null,
        suggestedPoints: null,
        isAdvisory: true,
        isUnresolved: true,
        matchedReason: 'No category or criterion matched the provided achievement fields.',
        ruleReference: RULE_REFERENCE_VERSION
      }
    }

    const { criterionCode, subcategory, points, reason, confidence, isAmbiguous } = this.resolveCriterionDetails(normalizedCat, fields)

    return {
      suggestedCategory: normalizedCat,
      suggestedSubcategory: subcategory || null,
      criterionCode: criterionCode || null,
      suggestedPoints: points !== null && !isNaN(points) ? points : null,
      isAdvisory: true,
      isAmbiguous: Boolean(isAmbiguous),
      matchedReason: reason || 'Advisory criteria match',
      sourceConfidence: confidence || SOURCE_CONFIDENCE.EXPLICIT,
      ruleReference: RULE_REFERENCE_VERSION,
      classifiedAt: new Date().toISOString()
    }
  },

  /**
   * Normalizes category string or key into canonical category label.
   */
  normalizeCategoryCode(catStr = '') {
    const c = String(catStr).trim()
    if (c.startsWith('A.1') || c.includes('Degree')) return 'A.1 Degree/s'
    if (c.startsWith('A.2') || c.includes('Membership')) return 'A.2 Active Membership to Prof Orgs'
    if (c.startsWith('A.3') || c.includes('Seminar') || c.includes('Training')) return 'A.3 Attendance to Seminars/Trainings'
    if (c.startsWith('B.1') || c.includes('Lecturer') || c.includes('Speaker') || c.includes('Consultant')) return 'B.1 Guest Lecturer / Consultant / Judge'
    if (c.startsWith('B.2') || c.includes('Publication')) return 'B.2 Publication'
    if (c.startsWith('B.3') || c.includes('Conduct of Research')) return 'B.3 Conduct of Research'
    if (c.startsWith('B.4') || c.includes('Recognition') || c.includes('Award')) return 'B.4 Professional Recognition or Awards'
    if (c.startsWith('B.5') || c.includes('Instructional') || c.includes('Material')) return 'B.5 Production of Instructional Materials'
    if (c.startsWith('B.6') || c.includes('Creative Work')) return 'B.6 Creative Work'
    if (c.startsWith('C.1') || c.includes('Extra-Curricular') || c.includes('Extracurricular')) return 'C.1 Extra-Curricular Activities'
    if (c.startsWith('C.2') || c.includes('Community')) return 'C.2 Community Involvement'
    return c || null
  },

  /**
   * Resolves subcriterion details and advisory points based on Plan F NDMU rules.
   */
  resolveCriterionDetails(normalizedCat, fields) {
    // ---------------- Area A: Professional Development ----------------
    if (normalizedCat.startsWith('A.1')) {
      const deg = fields.degreeLevel || ''
      const units = parseInt(fields.unitsCompleted || fields.units || 0, 10)
      if (deg.includes('Ph.D. Degree Holder') || deg.includes('Doctoral Degree')) {
        return { criterionCode: 'A.1', subcategory: 'Ph.D. Degree Holder', points: 40, reason: 'Doctoral Degree Holder (40 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      }
      if (deg.includes("Master's Degree Holder") || deg.includes('MA Degree Holder')) {
        return { criterionCode: 'A.1', subcategory: "Master's Degree Holder", points: 20, reason: "Master's Degree Holder (20 pts canonical)", confidence: SOURCE_CONFIDENCE.EXPLICIT }
      }
      if (deg.includes('Ph.D. Units')) {
        const pts = Math.min(10, Math.floor(Math.max(0, units) / 3) * 2)
        return { criterionCode: 'A.1', subcategory: 'Ph.D. Units', points: pts, reason: `Ph.D. Units (${units} units = ${pts} pts, max 10)`, confidence: SOURCE_CONFIDENCE.EXPLICIT }
      }
      if (deg.includes("Master's Units") || deg.includes('MA Units')) {
        const pts = Math.min(10, Math.floor(Math.max(0, units) / 3) * 1)
        return { criterionCode: 'A.1', subcategory: "Master's Units", points: pts, reason: `Master's Units (${units} units = ${pts} pts, max 10)`, confidence: SOURCE_CONFIDENCE.EXPLICIT }
      }
      return { criterionCode: 'A.1', subcategory: deg || 'Unspecified Degree Level', points: null, reason: 'Degree level or units required for points calculation', confidence: SOURCE_CONFIDENCE.EXPLICIT }
    }

    if (normalizedCat.startsWith('A.2')) {
      const pos = fields.orgPosition || fields.position || ''
      if (pos === 'Officer' || pos.includes('Officer') || pos.includes('Board')) {
        return { criterionCode: 'A.2', subcategory: 'Officer / Board Position', points: 10, reason: 'Officer / Board position (10 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      }
      if (pos === 'Member' || pos.includes('Member')) {
        return { criterionCode: 'A.2', subcategory: 'Regular Member', points: 5, reason: 'Regular Active Member (5 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      }
      return { criterionCode: 'A.2', subcategory: null, points: 5, reason: 'Defaulting to regular member (5 pts advisory)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
    }

    if (normalizedCat.startsWith('A.3')) {
      const scope = (fields.scopeLevel || fields.scope || '').toLowerCase()
      if (scope.includes('international')) return { criterionCode: 'A.3', subcategory: 'International Level', points: 10, reason: 'International seminar attendance (10 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      if (scope.includes('national')) return { criterionCode: 'A.3', subcategory: 'National Level', points: 8, reason: 'National seminar attendance (8 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      if (scope.includes('regional')) return { criterionCode: 'A.3', subcategory: 'Regional Level', points: 6, reason: 'Regional seminar attendance (6 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      if (scope.includes('city') || scope.includes('local') || scope.includes('provincial')) return { criterionCode: 'A.3', subcategory: 'City / Provincial Level', points: 4, reason: 'City/Provincial seminar attendance (4 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      if (scope.includes('in-house') || scope.includes('institutional')) return { criterionCode: 'A.3', subcategory: 'In-House / Institutional Level', points: 3, reason: 'In-house seminar attendance (3 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      return { criterionCode: 'A.3', subcategory: null, points: 3, reason: 'Scope unstated; advisory minimum 3 pts', confidence: SOURCE_CONFIDENCE.EXPLICIT }
    }

    // ---------------- Area B: Productivity and Creative Work ----------------
    if (normalizedCat.startsWith('B.1')) {
      const role = fields.speakerRole || fields.role || ''
      if (role.includes('Keynote')) return { criterionCode: 'B.1', subcategory: 'Keynote Speaker', points: 10, reason: 'Keynote Speaker engagement (10 pts advisory)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      if (role.includes('Resource')) return { criterionCode: 'B.1', subcategory: 'Resource Person / Lecturer', points: 8, reason: 'Resource Person / Lecturer (8 pts advisory)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      if (role.includes('Facilitator') || role.includes('Trainer')) return { criterionCode: 'B.1', subcategory: 'Facilitator / Trainer', points: 6, reason: 'Facilitator / Trainer (6 pts advisory)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      if (role.includes('Judge') || role.includes('Panelist')) return { criterionCode: 'B.1', subcategory: 'Judge / Evaluator', points: 5, reason: 'Judge / Panelist (5 pts advisory)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      return { criterionCode: 'B.1', subcategory: 'Reactor / Speaker', points: 3, reason: 'Speaker engagement (3 pts advisory)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
    }

    if (normalizedCat.startsWith('B.2')) {
      const ptype = fields.pubType || ''
      if (ptype.includes('Book')) return { criterionCode: 'B.2', subcategory: 'Authored Book', points: 10, reason: 'Authored Book (10 pts canonical)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      if (ptype.includes('Refereed') || ptype.includes('Scholarly Paper')) return { criterionCode: 'B.2', subcategory: 'Scholarly Paper in Refereed Journal', points: 8, reason: 'Scholarly Paper in Refereed Journal (8 pts canonical)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      if (ptype.includes('Monograph')) return { criterionCode: 'B.2', subcategory: 'Monograph', points: 8, reason: 'Monograph (8 pts canonical)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      if (ptype.includes('Article') || ptype.includes('Journal') || ptype.includes('Compilation')) return { criterionCode: 'B.2', subcategory: 'Journal Article / Academic Essay', points: 5, reason: 'Journal Article / Essay (5 pts canonical)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      if (ptype.includes('Review')) return { criterionCode: 'B.2', subcategory: 'Reviews', points: 4, reason: 'Reviews (4 pts canonical)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      if (ptype.includes('Commentary')) return { criterionCode: 'B.2', subcategory: 'Commentary', points: 2, reason: 'Commentary (2 pts canonical)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
      return { criterionCode: 'B.2', subcategory: 'Publication Work', points: 5, reason: 'Publication work (5 pts advisory default)', confidence: SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED }
    }

    if (normalizedCat.startsWith('B.3')) {
      const fund = fields.fundingStatus || ''
      if (fund.includes('Externally')) return { criterionCode: 'B.3', subcategory: 'Externally Funded Research Project', points: 20, reason: 'Externally funded research project (20 pts advisory)', confidence: SOURCE_CONFIDENCE.UNDEFINED }
      if (fund.includes('Institutional')) return { criterionCode: 'B.3', subcategory: 'Completed Institutional Research', points: 15, reason: 'Completed institutional research (15 pts advisory)', confidence: SOURCE_CONFIDENCE.UNDEFINED }
      return { criterionCode: 'B.3', subcategory: 'Departmental Research', points: 10, reason: 'Departmental research project (10 pts advisory)', confidence: SOURCE_CONFIDENCE.UNDEFINED }
    }

    if (normalizedCat.startsWith('B.4')) {
      const isAwardee = fields.awardType === 'Awardee' || (fields.awardType || '').includes('Awardee')
      const scope = (fields.scopeLevel || fields.scope || '').toLowerCase()
      if (isAwardee) {
        if (scope.includes('national') || scope.includes('international')) return { criterionCode: 'B.4', subcategory: 'Awardee (National / International)', points: 40, reason: 'Awardee (National/International) = 40 pts canonical', confidence: SOURCE_CONFIDENCE.EXPLICIT }
        if (scope.includes('regional') || scope.includes('provincial')) return { criterionCode: 'B.4', subcategory: 'Awardee (Regional / Provincial)', points: 30, reason: 'Awardee (Regional/Provincial) = 30 pts canonical', confidence: SOURCE_CONFIDENCE.EXPLICIT }
        return { criterionCode: 'B.4', subcategory: 'Awardee (Local)', points: 10, reason: 'Awardee (Local) = 10 pts canonical', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      }
      // Nominee
      if (scope.includes('national') || scope.includes('international')) return { criterionCode: 'B.4', subcategory: 'Nominee (National / International)', points: 20, reason: 'Nominee (National/International) = 20 pts canonical', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      if (scope.includes('regional') || scope.includes('provincial')) return { criterionCode: 'B.4', subcategory: 'Nominee (Regional / Provincial)', points: 15, reason: 'Nominee (Regional/Provincial) = 15 pts canonical', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      return { criterionCode: 'B.4', subcategory: 'Nominee (Local)', points: 5, reason: 'Nominee (Local) = 5 pts canonical', confidence: SOURCE_CONFIDENCE.EXPLICIT }
    }

    if (normalizedCat.startsWith('B.5')) {
      const mat = fields.matType || ''
      if (mat.includes('Workbook') || mat.includes('Notes')) return { criterionCode: 'B.5', subcategory: 'Bound Workbook / Exercises / Notes', points: 20, reason: 'Bound workbook / notes (20 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
      return { criterionCode: 'B.5', subcategory: 'Modules / Audio-Visual Aids', points: 10, reason: 'Modules / Audio-Visual aids (10 pts canonical)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
    }

    if (normalizedCat.startsWith('B.6')) {
      return { criterionCode: 'B.6', subcategory: 'Creative Exhibition / Performance', points: 20, reason: 'Creative work / exhibition (20 pts advisory)', confidence: SOURCE_CONFIDENCE.UNDEFINED }
    }

    // ---------------- Area C: Service and Leadership ----------------
    if (normalizedCat.startsWith('C.1')) {
      return { criterionCode: 'C.1.1', subcategory: 'Moderator / Extracurricular Involvement', points: 20, reason: 'Extracurricular / organization leadership (20 pts advisory, max 30 subarea)', confidence: SOURCE_CONFIDENCE.UNDEFINED }
    }

    if (normalizedCat.startsWith('C.2')) {
      const sub = fields.subType || ''
      if (sub.includes('Charity')) return { criterionCode: 'C.2.3', subcategory: 'Support to Charity / Projects', points: 5, reason: 'Support to charity projects (5 pts canonical)', confidence: SOURCE_CONFIDENCE.UNDEFINED }
      return { criterionCode: 'C.2.1', subcategory: 'Community / Church Involvement', points: 25, reason: 'Active community / church service (25 pts advisory, max 30 subarea)', confidence: SOURCE_CONFIDENCE.UNDEFINED }
    }

    return { criterionCode: null, subcategory: null, points: 5, reason: 'General accomplishment baseline (5 pts advisory)', confidence: SOURCE_CONFIDENCE.EXPLICIT }
  },

  /**
   * Helper to evaluate advisory points for category and field payload.
   */
  calculateAdvisoryPoints(category = '', fields = {}) {
    const res = this.classifyAchievement({ ...fields, category })
    return res.suggestedPoints !== null ? res.suggestedPoints : 0
  }
}

export default AchievementClassificationService
