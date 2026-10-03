import apiClient from './apiClient'

/**
 * Service for the official NDMU Faculty Rank Catalogue (Plan E — Phase E1).
 * Read-only reference service providing frozen Full-Time Academic Ranks.
 */
export const facultyRankCatalogService = {
  /**
   * Frozen source reference
   */
  SOURCE_DOCUMENT_ID: 'NDMU-DOC-ACAD-RANKS-2026-V1',
  SEED_VERSION: '2026.1',

  /**
   * Qualification tiers
   */
  TIERS: {
    DOCTORAL: 'doctoral',
    MASTERS: 'masters',
    BOARD_LICENSURE: 'board_licensure',
    BACCALAUREATE: 'baccalaureate',
  },

  /**
   * Canonical stable rank codes
   */
  FULL_TIME_RANKS: [
    // Doctoral
    { code: 'UNIVERSITY_PROFESSOR', label: 'University Professor', tier: 'doctoral', order: 1 },
    { code: 'UNIVERSITY_PROFESSOR_IV', label: 'University Professor IV', tier: 'doctoral', order: 2 },
    { code: 'UNIVERSITY_PROFESSOR_III', label: 'University Professor III', tier: 'doctoral', order: 3 },
    { code: 'UNIVERSITY_PROFESSOR_II', label: 'University Professor II', tier: 'doctoral', order: 4 },
    { code: 'UNIVERSITY_PROFESSOR_I', label: 'University Professor I', tier: 'doctoral', order: 5 },
    { code: 'PROFESSOR_IV', label: 'Professor IV', tier: 'doctoral', order: 6 },
    { code: 'PROFESSOR_III', label: 'Professor III', tier: 'doctoral', order: 7 },
    { code: 'PROFESSOR_II', label: 'Professor II', tier: 'doctoral', order: 8 },
    { code: 'PROFESSOR_I', label: 'Professor I', tier: 'doctoral', order: 9 },

    // Master's
    { code: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor', tier: 'masters', order: 10 },
    { code: 'ASSOCIATE_PROFESSOR_IV', label: 'Associate Professor IV', tier: 'masters', order: 11 },
    { code: 'ASSOCIATE_PROFESSOR_III', label: 'Associate Professor III', tier: 'masters', order: 12 },
    { code: 'ASSOCIATE_PROFESSOR_II', label: 'Associate Professor II', tier: 'masters', order: 13 },
    { code: 'ASSOCIATE_PROFESSOR_I', label: 'Associate Professor I', tier: 'masters', order: 14 },
    { code: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor', tier: 'masters', order: 15 },
    { code: 'ASSISTANT_PROFESSOR_IV', label: 'Assistant Professor IV', tier: 'masters', order: 16 },
    { code: 'ASSISTANT_PROFESSOR_III', label: 'Assistant Professor III', tier: 'masters', order: 17 },
    { code: 'ASSISTANT_PROFESSOR_II', label: 'Assistant Professor II', tier: 'masters', order: 18 },
    { code: 'ASSISTANT_PROFESSOR_I', label: 'Assistant Professor I', tier: 'masters', order: 19 },

    // Board Licensure
    { code: 'SENIOR_INSTRUCTOR', label: 'Senior Instructor', tier: 'board_licensure', order: 20 },
    { code: 'SENIOR_INSTRUCTOR_IV', label: 'Senior Instructor IV', tier: 'board_licensure', order: 21 },
    { code: 'SENIOR_INSTRUCTOR_III', label: 'Senior Instructor III', tier: 'board_licensure', order: 22 },
    { code: 'SENIOR_INSTRUCTOR_II', label: 'Senior Instructor II', tier: 'board_licensure', order: 23 },
    { code: 'SENIOR_INSTRUCTOR_I', label: 'Senior Instructor I', tier: 'board_licensure', order: 24 },

    // Baccalaureate
    { code: 'INSTRUCTOR_I', label: 'Instructor I', tier: 'baccalaureate', order: 25 },
    { code: 'ASSISTANT_INSTRUCTOR', label: 'Assistant Instructor', tier: 'baccalaureate', order: 26 },
  ],

  /**
   * Fetches the full list of active Full-Time faculty ranks from the API.
   * @param {string|null} tier
   * @returns {Promise<{ metadata: Object, data: Array }>}
   */
  async fetchFullTimeFacultyRanks(tier = null) {
    const params = tier ? { tier } : {}
    const response = await apiClient.get('/faculty-ranks', { params })
    return response.data || { data: [] }
  },

  /**
   * Fetches a single rank by stable code.
   * @param {string} code
   * @returns {Promise<Object>}
   */
  async fetchRankByCode(code) {
    const response = await apiClient.get(`/faculty-ranks/${code}`)
    return response.data?.data || null
  },

  /**
   * Fetches full structured hierarchy.
   * @returns {Promise<Object>}
   */
  async fetchRankHierarchy() {
    const response = await apiClient.get('/faculty-ranks/hierarchy')
    return response.data?.data || null
  },

  /**
   * Fetches the normal next sequential rank for a given rank code.
   * @param {string} code
   * @returns {Promise<Object>}
   */
  async fetchNextRank(code) {
    const response = await apiClient.get(`/faculty-ranks/${code}/next`)
    return response.data || null
  },

  /**
   * Fetches allowed progression transitions with optional context (e.g. { has_verified_phd: true }).
   * @param {string} code
   * @param {Object} context
   * @returns {Promise<Object>}
   */
  async fetchAllowedTransitions(code, context = {}) {
    const response = await apiClient.get(`/faculty-ranks/${code}/transitions`, { params: context })
    return response.data?.data || null
  },

  /**
   * Validates a proposed transition from one rank to another.
   * @param {string} fromRankCode
   * @param {string} toRankCode
   * @param {Object} context
   * @returns {Promise<{ allowed: boolean, reason_code?: string, message?: string }>}
   */
  async validateTransition(fromRankCode, toRankCode, context = {}) {
    const response = await apiClient.post('/faculty-ranks/validate-transition', {
      from_rank_code: fromRankCode,
      to_rank_code: toRankCode,
      context,
    })
    return response.data?.data || { allowed: false }
  },

  /**
   * Synchronous helper: resolves rank by code from static list.
   * @param {string} code
   * @returns {Object|undefined}
   */
  getRankByCodeSync(code) {
    return this.FULL_TIME_RANKS.find((r) => r.code === code)
  },

  /**
   * Synchronous helper: resolves rank by display label from static list.
   * @param {string} label
   * @returns {Object|undefined}
   */
  getRankByLabelSync(label) {
    return this.FULL_TIME_RANKS.find((r) => r.display_label === label || r.label === label)
  },

  /**
   * Validates if a label is in the official Full-Time catalogue.
   * @param {string} label
   * @returns {boolean}
   */
  isValidFullTimeRankLabel(label) {
    return this.FULL_TIME_RANKS.some((r) => r.label === label)
  },

  /**
   * Returns total count of frozen Full-Time ranks (26).
   * @returns {number}
   */
  getRankCount() {
    return this.FULL_TIME_RANKS.length
  },
}

export default facultyRankCatalogService
