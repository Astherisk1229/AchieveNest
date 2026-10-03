import apiClient from './apiClient'

/**
 * Service for official NDMU Part-Time Faculty Titles (Plan E — Phase E3).
 * Read-only reference service providing 4 frozen Part-Time Faculty Titles and Qualification Mappings.
 *
 * Strict Non-Progression Rule:
 * Part-Time Faculty receive qualification-based titles but are not considered for Full-Time ranking or promotion.
 */
export const partTimeFacultyTitleService = {
  SOURCE_DOCUMENT_ID: 'NDMU-DOC-ACAD-RANKS-2026-V1',
  SEED_VERSION: '2026.1',

  /**
   * The 4 frozen canonical Part-Time Faculty Titles
   */
  PART_TIME_TITLES: [
    {
      code: 'PT_PROFESSORIAL_LECTURER',
      label: 'Professorial Lecturer',
      tier: 'doctoral',
      qualification_wording: 'Ph.D./Ed.D.',
      order: 1,
    },
    {
      code: 'PT_ASSISTANT_PROFESSORIAL_LECTURER',
      label: 'Assistant Professorial Lecturer',
      tier: 'masters',
      qualification_wording: 'MA/MS/MAT/MD/LL.B./Priests or Equivalent',
      order: 2,
    },
    {
      code: 'PT_SENIOR_LECTURER',
      label: 'Senior Lecturer',
      tier: 'board_licensure',
      qualification_wording: 'CPA/ENGR./MEDTECH/CHEMIST/NURSE/DVM/ARCHITECT/DMD',
      order: 3,
    },
    {
      code: 'PT_LECTURER',
      label: 'Lecturer',
      tier: 'baccalaureate',
      qualification_wording: 'AB/BSE/BS or Equivalent',
      order: 4,
    },
  ],

  /**
   * Fetches the full list of Part-Time Faculty Titles from the backend API.
   * @returns {Promise<{ metadata: Object, data: Array }>}
   */
  async fetchPartTimeTitles() {
    const response = await apiClient.get('/faculty-titles/part-time')
    return response.data || { data: [] }
  },

  /**
   * Fetches details of a specific Part-Time Title by code.
   * @param {string} code
   * @returns {Promise<Object|null>}
   */
  async fetchTitleByCode(code) {
    const response = await apiClient.get(`/faculty-titles/part-time/${code}`)
    return response.data?.data || null
  },

  /**
   * Resolves the canonical Part-Time Faculty Title from verified qualification context.
   * @param {Object} qualificationContext
   * @returns {Promise<{ resolved_title: Object|null, status: string, reason_code: string, message: string }>}
   */
  async resolveTitleFromQualification(qualificationContext) {
    const response = await apiClient.post('/faculty-titles/part-time/resolve', qualificationContext)
    return response.data?.data || { resolved_title: null, status: 'UNRESOLVED' }
  },

  /**
   * Synchronous helper for offline qualification resolution diagnostics.
   * @param {Object} context
   * @returns {Object}
   */
  resolveTitleSync(context = {}) {
    const engagement = context.faculty_engagement || context.workload_status || 'part_time_faculty'
    if (engagement !== 'part_time_faculty') {
      return {
        status: 'INELIGIBLE',
        reason_code: 'not_part_time_faculty',
        resolved_title_code: null,
        resolved_title_name: null,
      }
    }

    const group = context.personnel_group || 'faculty'
    if (group !== 'faculty') {
      return {
        status: 'INELIGIBLE',
        reason_code: 'unsupported_personnel_group',
        resolved_title_code: null,
        resolved_title_name: null,
      }
    }

    const isVerified = !!(context.qualification_verified || context.has_verified_qualification)
    if (!isVerified) {
      return {
        status: 'UNRESOLVED',
        reason_code: 'qualification_not_verified',
        resolved_title_code: null,
        resolved_title_name: null,
      }
    }

    const qual = (context.qualification_code || context.qualification_title || context.qualification || '').toLowerCase()

    if (/\b(phd|ph\.d|edd|ed\.d|doctor of philosophy|doctor of education|doctorate|doctor)\b/i.test(qual)) {
      return {
        status: 'OK',
        reason_code: 'resolved_doctoral',
        resolved_title_code: 'PT_PROFESSORIAL_LECTURER',
        resolved_title_name: 'Professorial Lecturer',
      }
    }

    if (/\b(ma|m\.a|ms|m\.s|mat|md|llb|ll\.b|master|priest|doctor of medicine|bachelor of laws)\b/i.test(qual)) {
      return {
        status: 'OK',
        reason_code: 'resolved_masters_professional',
        resolved_title_code: 'PT_ASSISTANT_PROFESSORIAL_LECTURER',
        resolved_title_name: 'Assistant Professorial Lecturer',
      }
    }

    if (/\b(cpa|engr|engr\.|engineer|engineering|medtech|chemist|chemistry|nurse|nursing|rn|dvm|veterinary|architect|architecture|dmd|ddm|dentist|dentistry|social worker|rsw|board passer|licensed)\b/i.test(qual)) {
      return {
        status: 'OK',
        reason_code: 'resolved_licensed_professional',
        resolved_title_code: 'PT_SENIOR_LECTURER',
        resolved_title_name: 'Senior Lecturer',
      }
    }

    if (/\b(ab|bse|bs|bachelor|baccalaureate|hotel|accountancy)\b/i.test(qual)) {
      return {
        status: 'OK',
        reason_code: 'resolved_baccalaureate',
        resolved_title_code: 'PT_LECTURER',
        resolved_title_name: 'Lecturer',
      }
    }

    return {
      status: 'UNRESOLVED',
      reason_code: 'qualification_unmapped',
      resolved_title_code: null,
      resolved_title_name: null,
    }
  },

  /**
   * Synchronous lookup: resolves title by code.
   * @param {string} code
   * @returns {Object|undefined}
   */
  getTitleByCodeSync(code) {
    return this.PART_TIME_TITLES.find((t) => t.code === code)
  },

  /**
   * Synchronous lookup: resolves title by label.
   * @param {string} label
   * @returns {Object|undefined}
   */
  getTitleByLabelSync(label) {
    return this.PART_TIME_TITLES.find((t) => t.label === label)
  },

  /**
   * Checks whether a label is an official Part-Time Faculty Title.
   * @param {string} label
   * @returns {boolean}
   */
  isValidPartTimeTitleLabel(label) {
    return this.PART_TIME_TITLES.some((t) => t.label === label)
  },

  /**
   * Returns total count of frozen Part-Time titles (4).
   * @returns {number}
   */
  getTitleCount() {
    return this.PART_TIME_TITLES.length
  },
}

export default partTimeFacultyTitleService
