import apiClient from './apiClient'

/**
 * Service for Full-Time Faculty Initial Rank Seeding and Current-Rank Reconciliation (Plan E — Phase E4).
 * Enforces Non-Demotion, Non-Promotion, and server-authoritative qualification mapping.
 */
export const facultyInitialRankService = {
  SOURCE_DOCUMENT_ID: 'NDMU-DOC-ACAD-RANKS-2026-V1',
  SEED_VERSION: '2026.1',

  /**
   * Base Starting Ranks per Qualification Tier
   */
  BASE_RANKS: {
    DOCTORAL: {
      code: 'PROFESSOR_I',
      label: 'Professor I',
      tier: 'doctoral',
      reason_code: 'doctoral_initial_rank',
    },
    MASTERS: {
      code: 'ASSISTANT_PROFESSOR',
      label: 'Assistant Professor',
      tier: 'masters',
      reason_code: 'masters_initial_rank',
    },
    BOARD_LICENSURE: {
      code: 'SENIOR_INSTRUCTOR',
      label: 'Senior Instructor',
      tier: 'board_licensure',
      reason_code: 'licensed_professional_initial_rank',
    },
    BACCALAUREATE: {
      code: 'ASSISTANT_INSTRUCTOR',
      label: 'Assistant Instructor',
      tier: 'baccalaureate',
      reason_code: 'baccalaureate_initial_rank',
    },
  },

  /**
   * Reason codes for initial rank resolution & reconciliation
   */
  REASON_CODES: {
    CURRENT_RANK_VALID: 'current_rank_valid',
    EXISTING_RANK_PRESERVED: 'existing_rank_preserved',
    CURRENT_RANK_MISSING: 'current_rank_missing',
    DOCTORAL_INITIAL_RANK: 'doctoral_initial_rank',
    MASTERS_INITIAL_RANK: 'masters_initial_rank',
    LICENSED_PROFESSIONAL_INITIAL_RANK: 'licensed_professional_initial_rank',
    BACCALAUREATE_INITIAL_RANK: 'baccalaureate_initial_rank',
    QUALIFICATION_NOT_VERIFIED: 'qualification_not_verified',
    LICENSURE_NOT_VERIFIED: 'licensure_not_verified',
    RANK_NOT_IN_CATALOG: 'rank_not_in_catalog',
    RANK_RECONCILIATION_REQUIRED: 'rank_reconciliation_required',
    PART_TIME_NOT_APPLICABLE: 'part_time_not_applicable',
    NON_TEACHING_NOT_APPLICABLE: 'non_teaching_not_applicable',
    SEED_RULE_UNRESOLVED: 'seed_rule_unresolved',
  },

  /**
   * Resolves initial base rank from verified qualification and licensure context via API.
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async resolveInitialRank(context = {}) {
    const response = await apiClient.post('/faculty-ranks/resolve-initial', context)
    return response.data?.data || null
  },

  /**
   * Reconciles current Personnel rank against catalog with Non-Demotion and Non-Promotion safety via API.
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async reconcileCurrentRank(context = {}) {
    const response = await apiClient.post('/faculty-ranks/reconcile-current', context)
    return response.data?.data || null
  },

  /**
   * Fetches the rank resolution for a specific personnel member by ID.
   * @param {number|string} personnelId
   * @returns {Promise<Object>}
   */
  async fetchPersonnelRankResolution(personnelId) {
    const response = await apiClient.get(`/faculty-ranks/reconcile/${personnelId}`)
    return response.data?.data || null
  },

  /**
   * Synchronous local resolver for offline diagnostics or unit validation.
   * @param {Object} context
   * @returns {Object}
   */
  resolveInitialRankSync(context = {}) {
    const engagement = context.faculty_engagement || context.workload_status || 'full_time_faculty'
    if (engagement === 'part_time_faculty') {
      return {
        status: 'INELIGIBLE',
        seed_action: 'no_action',
        reason_code: this.REASON_CODES.PART_TIME_NOT_APPLICABLE,
        resolved_initial_rank_code: null,
        resolved_initial_rank_name: null,
      }
    }

    const group = context.personnel_group || 'faculty'
    if (group !== 'faculty') {
      return {
        status: 'INELIGIBLE',
        seed_action: 'no_action',
        reason_code: this.REASON_CODES.NON_TEACHING_NOT_APPLICABLE,
        resolved_initial_rank_code: null,
        resolved_initial_rank_name: null,
      }
    }

    const isQualVerified = !!(context.qualification_verified || context.has_verified_qualification)
    if (!isQualVerified) {
      return {
        status: 'UNRESOLVED',
        seed_action: 'no_action',
        reason_code: this.REASON_CODES.QUALIFICATION_NOT_VERIFIED,
        resolved_initial_rank_code: null,
        resolved_initial_rank_name: null,
      }
    }

    const qual = (context.qualification_code || context.qualification_title || context.qualification || '').toLowerCase()
    const isLicensureVerified = !!(context.licensure_verified || context.has_verified_licensure || context.board_passer)

    if (/\b(phd|ph\.d|edd|ed\.d|doctorate)\b/i.test(qual)) {
      return {
        status: 'OK',
        seed_action: 'seed_initial_rank',
        reason_code: this.REASON_CODES.DOCTORAL_INITIAL_RANK,
        resolved_initial_rank_code: this.BASE_RANKS.DOCTORAL.code,
        resolved_initial_rank_name: this.BASE_RANKS.DOCTORAL.label,
      }
    }

    if (/\b(ma|m\.a|ms|m\.s|mat|md|llb|ll\.b|master|priest)\b/i.test(qual)) {
      return {
        status: 'OK',
        seed_action: 'seed_initial_rank',
        reason_code: this.REASON_CODES.MASTERS_INITIAL_RANK,
        resolved_initial_rank_code: this.BASE_RANKS.MASTERS.code,
        resolved_initial_rank_name: this.BASE_RANKS.MASTERS.label,
      }
    }

    if (/\b(cpa|engr|engr\.|engineer|engineering|medtech|chemist|chemistry|nurse|nursing|rn|dvm|veterinary|architect|architecture|dmd|ddm|dentist|dentistry|social worker|rsw)\b/i.test(qual)) {
      if (!isLicensureVerified) {
        return {
          status: 'OK',
          seed_action: 'seed_initial_rank',
          reason_code: this.REASON_CODES.LICENSURE_NOT_VERIFIED,
          resolved_initial_rank_code: this.BASE_RANKS.BACCALAUREATE.code,
          resolved_initial_rank_name: this.BASE_RANKS.BACCALAUREATE.label,
        }
      }
      return {
        status: 'OK',
        seed_action: 'seed_initial_rank',
        reason_code: this.REASON_CODES.LICENSED_PROFESSIONAL_INITIAL_RANK,
        resolved_initial_rank_code: this.BASE_RANKS.BOARD_LICENSURE.code,
        resolved_initial_rank_name: this.BASE_RANKS.BOARD_LICENSURE.label,
      }
    }

    if (/\b(ab|bse|bs|bachelor)\b/i.test(qual)) {
      return {
        status: 'OK',
        seed_action: 'seed_initial_rank',
        reason_code: this.REASON_CODES.BACCALAUREATE_INITIAL_RANK,
        resolved_initial_rank_code: this.BASE_RANKS.BACCALAUREATE.code,
        resolved_initial_rank_name: this.BASE_RANKS.BACCALAUREATE.label,
      }
    }

    return {
      status: 'UNRESOLVED',
      seed_action: 'no_action',
      reason_code: this.REASON_CODES.SEED_RULE_UNRESOLVED,
      resolved_initial_rank_code: null,
      resolved_initial_rank_name: null,
    }
  },
}

export default facultyInitialRankService
