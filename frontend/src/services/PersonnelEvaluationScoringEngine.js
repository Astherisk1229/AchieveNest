/**
 * PersonnelEvaluationScoringEngine.js
 *
 * Canonical Authoritative Frontend Mirror & Calculation Engine for Plan F — Phase F4.
 * Computes deterministic scores, applies caps, enforces scale boundaries, and generates explainability traces.
 */

import evaluationInstrumentRegistry, {
  EVALUATION_SCALE_CODES,
  EVALUATION_RULE_VERSION,
  EVALUATION_INSTRUMENTS
} from './evaluationInstrumentRegistry.js'
import RankingCriteriaModel from '../models/RankingCriteriaModel.js'

export default class PersonnelEvaluationScoringEngine {
  static RULE_VERSION = EVALUATION_RULE_VERSION

  /**
   * Validates rule version string.
   */
  static validateRuleVersion(ruleVersion) {
    if (ruleVersion !== EVALUATION_RULE_VERSION) {
      throw new Error(`Invalid rule version [${ruleVersion}]. Must be [${EVALUATION_RULE_VERSION}].`)
    }
  }

  /**
   * Scores an accomplishment item, enforcing scale rules, factor calculations, caps, and evidence validation.
   * Client-entered scores are strictly ignored and recalculated.
   */
  static scoreItem({
    scaleCode = EVALUATION_SCALE_CODES.ADMINISTRATORS,
    ruleVersion = EVALUATION_RULE_VERSION,
    areaCode = 'A',
    category = '',
    subCategory = '',
    scope = '',
    entry = {},
    evidenceReference = null
  } = {}) {
    this.validateRuleVersion(ruleVersion)

    const area = String(areaCode).toUpperCase().trim()
    const cat = String(category).trim()
    const sub = String(subCategory).trim()
    const sc = String(scope).trim()
    const proofRef = evidenceReference || entry.proof_file_name || entry.proof || null

    // 1. Wrong-scale and Mutation Rejection
    if (scaleCode === EVALUATION_SCALE_CODES.NON_TEACHING) {
      if (area === 'A') {
        throw new Error('Portfolio Area [A: Performance and Personal Indicators] is an evaluation-only section and does not permit personnel accomplishment mutations.')
      }
      if (area === 'C') {
        throw new Error('Invalid Area [C] for Non-Teaching Personnel Ranking Scale.')
      }
      if (cat.toLowerCase().includes('publication') || cat.toLowerCase().includes('instructional material') || cat.toLowerCase().includes('creative work')) {
        throw new Error(`Invalid criterion [${category}] for Non-Teaching Personnel Ranking Scale.`)
      }
    } else if (scaleCode === EVALUATION_SCALE_CODES.ADMINISTRATORS) {
      if (!['A', 'B', 'C'].includes(area)) {
        throw new Error(`Invalid Area [${area}] for Administrators Ranking Scale.`)
      }
    } else {
      throw new Error(`Unknown scale code [${scaleCode}].`)
    }

    // 2. Validate Title
    const title = (entry.title || entry.activity_title || entry.event_title || entry.award_title || entry.publication_title || entry.research_title || '').trim()
    if (!title) {
      throw new Error('Accomplishment title is required.')
    }

    // 3. Compute Deterministic Rule
    const result = this.calculateRule({ scaleCode, areaCode: area, category: cat, subCategory: sub, scope: sc, entry })

    // 4. Validate Evidence
    if (result.evidence_required && !proofRef) {
      throw new Error(`Evidence proof attachment is required for [${category}].`)
    }

    // 5. Apply Criterion Cap
    const rawPoints = Number(result.raw_points) || 0.0
    const criterionCap = result.criterion_cap !== undefined && result.criterion_cap !== null ? Number(result.criterion_cap) : null
    const cappedPoints = criterionCap !== null ? Math.min(criterionCap, rawPoints) : rawPoints

    const isJudgmentRequired = Boolean(result.evaluator_judgment_required)
    const scoringStatus = isJudgmentRequired ? 'awaiting_evaluator' : 'calculated'
    const acceptedPoints = isJudgmentRequired ? null : cappedPoints

    // 6. Build Explanation
    const explanation = this.buildExplanation({
      ruleApplied: result.rule_applied,
      rawPoints,
      criterionCap,
      cappedPoints,
      isJudgment: isJudgmentRequired
    })

    return {
      scale_code: scaleCode,
      rule_version: ruleVersion,
      area_code: area,
      category: cat,
      sub_category: sub,
      scope: sc,
      raw_points: rawPoints,
      criterion_cap: criterionCap,
      criterion_capped_points: cappedPoints,
      scoring_status: scoringStatus,
      evaluator_judgment_required: isJudgmentRequired,
      accepted_points: acceptedPoints,
      evidence_reference: proofRef,
      explanation,
      point_trace: {
        rule_applied: result.rule_applied,
        source_ref: result.source_ref,
        formula_key: result.formula_key,
        factors: result.factors || null,
        capped: criterionCap !== null && rawPoints > criterionCap
      },
      calculated_at: new Date().toISOString()
    }
  }

  /**
   * Internal rule evaluator matching Phase F0/F2/F3 specs.
   */
  static calculateRule({ scaleCode, areaCode, category, subCategory, scope, entry }) {
    const cat = category.toLowerCase()
    const sub = subCategory.toLowerCase()
    const sc = scope.toLowerCase()

    if (scaleCode === EVALUATION_SCALE_CODES.NON_TEACHING) {
      if (cat.includes('school activities') || cat.includes('b.1') || cat.includes('b1')) {
        const pts = RankingCriteriaModel.calculateNonTeachingB1Points(subCategory || entry.b1_subcategory)
        return {
          raw_points: pts,
          criterion_cap: 30.0,
          rule_applied: `School Activities: ${subCategory || 'Role'} (${pts} pts)`,
          source_ref: 'Table B.1 (School Activities)',
          formula_key: 'NT_ACT_SCHEDULE',
          evidence_required: true
        }
      }

      if (cat.includes('community') || cat.includes('church') || cat.includes('b.2') || cat.includes('b2')) {
        const pts = RankingCriteriaModel.calculateNonTeachingB2Points(subCategory || entry.b2_subcategory)
        return {
          raw_points: pts,
          criterion_cap: 30.0,
          rule_applied: `Community Involvement: ${subCategory || 'Category'} (${pts} pts)`,
          source_ref: 'Table B.2 (Community Involvement)',
          formula_key: 'NT_COMM_SCHEDULE',
          evidence_required: true
        }
      }

      if (cat.includes('years at ndmu') || cat.includes('service credit') || cat.includes('b.3') || cat.includes('b3')) {
        const years = Math.max(0, Number(entry.years_of_service || entry.years || 0))
        const pts = Math.floor(years / 2) * 1.0
        return {
          raw_points: pts,
          criterion_cap: 10.0,
          rule_applied: `Number of Years at NDMU: ${years} completed years = ${pts} pts (Max 10)`,
          source_ref: 'Table B.3 (Years at NDMU)',
          formula_key: 'NT_SRV_CREDIT_SERVER_DERIVED',
          server_derived: true,
          evidence_required: false
        }
      }

      if (cat.includes('invited') || cat.includes('judge') || cat.includes('lecturer') || cat.includes('resource person') || cat.includes('b.4') || cat.includes('b4')) {
        const count = Math.max(1, Number(entry.invitation_count || entry.count || 1))
        const pts = count * 5.0
        return {
          raw_points: pts,
          criterion_cap: 30.0,
          rule_applied: `Invited as Judge/Lecturer: ${count} invitation(s) × 5 pts = ${pts} pts (Max 30)`,
          source_ref: 'Table B.4 (Invitations)',
          formula_key: 'NT_INVITED_PER_ITEM',
          evidence_required: true
        }
      }

      if (cat.includes('recognition') || cat.includes('meritorious award') || cat.includes('b.5') || cat.includes('b5')) {
        return {
          raw_points: 30.0,
          criterion_cap: 30.0,
          evaluator_judgment_required: true,
          rule_applied: 'Evaluator Judgment Required (Maximum 30.0 pts)',
          source_ref: 'Table B.5 (Recognition / Meritorious Award)',
          formula_key: 'NT_AWARD_JUDGMENT_MAX_30',
          evidence_required: true
        }
      }
    }

    // Administrators Scale Rules
    if (areaCode === 'A') {
      if (cat.includes('degree') || sub.includes('ph.d.') || sub.includes('ma degree') || cat.includes('a.1')) {
        if (sub.includes('ph.d. degree holder') || sub === 'phd_degree') {
          return { raw_points: 40.0, criterion_cap: null, rule_applied: 'Ph.D. Degree Holder (40 pts)', source_ref: 'Table A.1, Row 1', formula_key: 'DEGREE_PHD', evidence_required: true }
        }
        if (sub.includes('ma degree holder') || sub === 'ma_degree') {
          return { raw_points: 20.0, criterion_cap: null, rule_applied: "Master's Degree Holder (20 pts)", source_ref: 'Table A.1, Row 3', formula_key: 'DEGREE_MA', evidence_required: true }
        }
        if (sub.includes('ph.d. units') || sub === 'phd_units') {
          const u = Math.max(0, Number(entry.units_completed || entry.units_earned || entry.units || 0))
          const pts = Math.floor(u / 3) * 2.0
          return { raw_points: pts, criterion_cap: 10.0, rule_applied: `Ph.D. Units: ${u} units = ${Math.floor(u / 3)} groups of 3 × 2 pts = ${pts} pts (Max 10)`, source_ref: 'Table A.1, Row 2', formula_key: 'DEGREE_PHD_UNITS', evidence_required: true }
        }
        if (sub.includes('ma units') || sub === 'ma_units') {
          const u = Math.max(0, Number(entry.units_completed || entry.units_earned || entry.units || 0))
          const pts = Math.floor(u / 3) * 1.0
          return { raw_points: pts, criterion_cap: 10.0, rule_applied: `MA Units: ${u} units = ${Math.floor(u / 3)} groups of 3 × 1 pt = ${pts} pts (Max 10)`, source_ref: 'Table A.1, Row 4', formula_key: 'DEGREE_MA_UNITS', evidence_required: true }
        }
      }

      if (cat.includes('membership') || cat.includes('prof org') || cat.includes('a.2')) {
        const isOfficer = sub.includes('officer') || Boolean(entry.officer_position)
        if (isOfficer) {
          return { raw_points: 10.0, criterion_cap: null, rule_applied: 'Officer / Board Position (10 pts)', source_ref: 'Table A.2, Row 2', formula_key: 'MEMBERSHIP_OFFICER', evidence_required: true }
        }
        return { raw_points: 5.0, criterion_cap: null, rule_applied: 'Regular Member (5 pts)', source_ref: 'Table A.2, Row 1', formula_key: 'MEMBERSHIP_REGULAR', evidence_required: true }
      }

      if (cat.includes('seminar') || cat.includes('training') || cat.includes('a.3')) {
        let pts = 3.0
        let lbl = 'In-House Seminar (3 pts)'
        if (sc.includes('international') || sub.includes('international')) { pts = 10.0; lbl = 'International Level (10 pts)'; }
        else if (sc.includes('national') || sub.includes('national')) { pts = 8.0; lbl = 'National Level (8 pts)'; }
        else if (sc.includes('regional') || sub.includes('regional')) { pts = 6.0; lbl = 'Regional Level (6 pts)'; }
        else if (sc.includes('provincial') || sc.includes('city') || sub.includes('provincial')) { pts = 4.0; lbl = 'City / Provincial Level (4 pts)'; }
        return { raw_points: pts, criterion_cap: 20.0, rule_applied: lbl, source_ref: 'Table A.3', formula_key: 'SEMINAR_SCHEDULE', evidence_required: true }
      }
    }

    if (areaCode === 'B') {
      if (cat.includes('guest lecturer') || cat.includes('consultant') || cat.includes('judge') || cat.includes('b.1')) {
        const orgPts = (entry.sponsoring_organization === 'external' || entry.org_type === 'external') ? 2.0 : 1.0
        const extentMap = { '1_hour': 1.0, half_day: 2.0, '1_day': 3.0, '2_days': 4.0, more_than_2_days: 5.0 }
        const extPts = extentMap[entry.extent_of_talk] || 1.0
        const reachMap = { local: 1.0, regional: 2.0, national: 3.0, international: 4.0 }
        const reachPts = reachMap[entry.participant_reach || scope] || 1.0
        const rolePts = (entry.role === 'judge' || entry.activity_role === 'judge') ? 3.0 : 5.0
        const total = orgPts + extPts + reachPts + rolePts
        return {
          raw_points: total,
          criterion_cap: null,
          factors: { orgPts, extPts, reachPts, rolePts },
          rule_applied: `4-Factor Sum: Org(${orgPts}) + Extent(${extPts}) + Reach(${reachPts}) + Role(${rolePts}) = ${total} pts`,
          source_ref: 'Table B.1 (4-Factor Formula)',
          formula_key: 'LECTURER_4FACTOR_SUM',
          evidence_required: true
        }
      }

      if (cat.includes('publication') || cat.includes('b.2')) {
        const scopeMap = { local: 3.0, regional: 4.0, national: 6.0, international: 8.0 }
        const scopePts = scopeMap[entry.location_scope || entry.publication_scope || scope] || 3.0
        const typeMap = { commentary: 2.0, reviews: 4.0, compilation: 5.0, article: 5.0, scholarly_paper: 8.0, monograph: 8.0, research_output: 10.0, book: 10.0 }
        const typePts = typeMap[entry.publication_type || subCategory] || 5.0
        const total = scopePts + typePts
        return {
          raw_points: total,
          criterion_cap: null,
          factors: { scopePts, typePts },
          rule_applied: `Publication Sum: Scope(${scopePts}) + Type(${typePts}) = ${total} pts`,
          source_ref: 'Table B.2 (Scope + Type Formula)',
          formula_key: 'PUB_SCOPE_TYPE_SUM',
          evidence_required: true
        }
      }

      if (cat.includes('research') || cat.includes('b.3')) {
        return { raw_points: 40.0, criterion_cap: 40.0, evaluator_judgment_required: true, rule_applied: 'Evaluator Judgment Required (Maximum 40.0 pts)', source_ref: 'Table B.3 (Evaluator Judgment)', formula_key: 'RES_JUDGMENT_MAX_40', evidence_required: true }
      }

      if (cat.includes('award') || cat.includes('recognition') || cat.includes('b.4')) {
        const isNominee = (entry.recognition_status || '').toLowerCase().includes('nominee') || sub.includes('nominee')
        const scKey = (entry.award_scope || entry.scope || scope).toLowerCase()
        let pts = 10.0
        if (isNominee) {
          pts = (scKey.includes('international') || scKey.includes('national')) ? 20.0 : scKey.includes('regional') ? 15.0 : 5.0
        } else {
          pts = (scKey.includes('international') || scKey.includes('national')) ? 40.0 : scKey.includes('regional') ? 30.0 : 10.0
        }
        return { raw_points: pts, criterion_cap: 40.0, rule_applied: `${isNominee ? 'Nominee' : 'Awardee'} (${scKey}) = ${pts} pts`, source_ref: 'Table B.4 (Awards Matrix)', formula_key: 'AWARD_MATRIX', evidence_required: true }
      }

      if (cat.includes('instructional material') || cat.includes('materials') || cat.includes('b.5')) {
        const isWorkbook = (entry.material_type || sub).includes('workbook') || (entry.material_type || sub).includes('others')
        const pts = isWorkbook ? 20.0 : 10.0
        return { raw_points: pts, criterion_cap: 20.0, rule_applied: isWorkbook ? 'Others (Bound Workbook) (20 pts)' : 'Audio-Visual Aids / Modules (10 pts)', source_ref: 'Table B.5', formula_key: 'MAT_SCHEDULE', evidence_required: true }
      }

      if (cat.includes('creative work') || cat.includes('b.6')) {
        return { raw_points: 20.0, criterion_cap: 20.0, evaluator_judgment_required: true, rule_applied: 'Evaluator Judgment Required (Maximum 20.0 pts)', source_ref: 'Table B.6 (Evaluator Judgment)', formula_key: 'CREATIVE_JUDGMENT_MAX_20', evidence_required: true }
      }
    }

    if (areaCode === 'C') {
      if (cat.includes('extra-curricular') || cat.includes('activity') || cat.includes('c.1')) {
        const isService = sub.includes('rendered') || sub.includes('intramural')
        const pts = isService ? 10.0 : 20.0
        return { raw_points: pts, criterion_cap: 30.0, rule_applied: isService ? 'Rendered Service (10 pts)' : 'Moderator / Coach / Committee (20 pts)', source_ref: 'Table C.1', formula_key: 'ACT_SCHEDULE', evidence_required: true }
      }

      if (cat.includes('community') || cat.includes('church') || cat.includes('c.2')) {
        const isCharity = sub.includes('charity') || sub.includes('project')
        const pts = isCharity ? 5.0 : 25.0
        return { raw_points: pts, criterion_cap: 30.0, rule_applied: isCharity ? 'Support to Charity (5 pts)' : 'Active Church / Civic Involvement (25 pts)', source_ref: 'Table C.2', formula_key: 'COMM_SCHEDULE', evidence_required: true }
      }

      if (cat.includes('service credit') || cat.includes('years of service') || cat.includes('c.3')) {
        const years = Math.max(0, Number(entry.years_of_service || entry.years || 0))
        const pts = Math.floor(years / 2) * 1.0
        return { raw_points: pts, criterion_cap: 10.0, rule_applied: `Years of Service at NDMU: ${years} completed years = ${pts} pts (Max 10)`, source_ref: 'Table C.3', formula_key: 'SRV_CREDIT_SERVER_DERIVED', server_derived: true, evidence_required: false }
      }
    }

    return { raw_points: 5.0, criterion_cap: null, rule_applied: 'Standard Configured Points', source_ref: 'Manual', formula_key: 'STANDARD_POINT', evidence_required: true }
  }

  /**
   * Applies area ceiling caps across scored items.
   */
  static applyAreaCap(scoredItems = [], areaCap = 70.0) {
    let rawSum = 0.0
    let unresolvedCount = 0

    scoredItems.forEach(item => {
      if (item.evaluator_judgment_required && item.accepted_points === null) {
        unresolvedCount++
      } else {
        rawSum += Number(item.accepted_points ?? item.criterion_capped_points ?? 0.0)
      }
    })

    const cappedTotal = Math.min(areaCap, rawSum)
    const overflow = Math.max(0.0, rawSum - cappedTotal)

    return {
      raw_area_sum: rawSum,
      capped_area_total: cappedTotal,
      area_cap: areaCap,
      overflow,
      is_area_capped: rawSum > areaCap,
      unresolved_count: unresolvedCount
    }
  }

  /**
   * Calculates complete evaluation totals across all areas.
   */
  static calculateEvaluationTotals(scaleCode = EVALUATION_SCALE_CODES.ADMINISTRATORS, itemsByArea = {}) {
    const isNonTeaching = scaleCode === EVALUATION_SCALE_CODES.NON_TEACHING
    const scaleMax = isNonTeaching ? 150.0 : 160.0
    const passingScore = isNonTeaching ? 75.0 : 120.0
    const areaCaps = isNonTeaching ? { A: 90.0, B: 60.0 } : { A: 70.0, B: 50.0, C: 40.0 }

    let grandRawTotal = 0.0
    let grandCappedTotal = 0.0
    let totalUnresolved = 0
    const areas = {}

    Object.entries(areaCaps).forEach(([areaKey, cap]) => {
      const items = itemsByArea[areaKey] || []
      const res = this.applyAreaCap(items, cap)
      areas[areaKey] = res
      grandRawTotal += res.raw_area_sum
      grandCappedTotal += res.capped_area_total
      totalUnresolved += res.unresolved_count
    })

    const finalPoints = Math.min(scaleMax, grandCappedTotal)
    const isPassing = finalPoints >= passingScore
    const status = totalUnresolved > 0 ? 'provisional_pending_evaluator' : 'completed_scored'

    return {
      scale_code: scaleCode,
      rule_version: EVALUATION_RULE_VERSION,
      total_max_points: scaleMax,
      passing_score: passingScore,
      raw_total_points: grandRawTotal,
      capped_total_points: finalPoints,
      is_passing: isPassing,
      evaluation_status: status,
      has_unresolved_judgment_items: totalUnresolved > 0,
      unresolved_count: totalUnresolved,
      areas
    }
  }

  /**
   * Validates evaluator accepted score against criterion maximum ceiling.
   */
  static validateEvaluatorAcceptedScore(criterionCode, acceptedScore) {
    if (acceptedScore === null || acceptedScore === undefined) return
    const score = Number(acceptedScore)
    if (isNaN(score) || score < 0) {
      throw new Error('Evaluator accepted score cannot be negative.')
    }
    let max = 40.0
    if (criterionCode === 'B.6' || criterionCode.toLowerCase().includes('creative')) max = 20.0
    if (criterionCode === 'B.5' || criterionCode.toLowerCase().includes('award') || criterionCode.toLowerCase().includes('meritorious')) max = 30.0

    if (score > max) {
      throw new Error(`Evaluator accepted score [${score}] exceeds maximum ceiling [${max}] for criterion [${criterionCode}].`)
    }
  }

  /**
   * Generates human-readable calculation explanation.
   */
  static buildExplanation({ ruleApplied, rawPoints, criterionCap, cappedPoints, isJudgment }) {
    if (isJudgment) {
      return `Evaluator judgment required (Maximum accepted score: ${criterionCap} pts). Points pending official evaluator deliberation.`
    }
    if (criterionCap !== null && rawPoints > criterionCap) {
      return `${ruleApplied}. Raw score of ${rawPoints} pts capped at criterion maximum of ${criterionCap} pts.`
    }
    return `${ruleApplied} (Earned: ${cappedPoints} pts).`
  }
}
