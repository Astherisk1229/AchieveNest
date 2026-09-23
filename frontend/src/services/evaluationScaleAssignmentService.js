import apiClient from './apiClient'
import evaluationInstrumentRegistry, {
  EVALUATION_SCALE_CODES,
  EVALUATION_RULE_VERSION,
} from './evaluationInstrumentRegistry'

/**
 * Service for Server-Authoritative Evaluation Scale Assignment & Dynamic Workspace Configuration.
 * Plan F — Phase F1.
 */
export const evaluationScaleAssignmentService = {
  RULE_VERSION: EVALUATION_RULE_VERSION,
  SCALE_CODES: EVALUATION_SCALE_CODES,

  /**
   * Fetches the server-authoritative scale assignment DTO for the current authenticated personnel.
   * @param {string} evaluationCycleId
   * @returns {Promise<Object>}
   */
  async fetchAssignedScale(evaluationCycleId = '2025-2026') {
    const response = await apiClient.get('/personnel/evaluation-scale', {
      params: { evaluation_cycle_id: evaluationCycleId },
    })
    return response.data?.data || null
  },

  /**
   * Fetches the scale assignment for a specific personnel member by ID.
   * @param {string|number} personnelId
   * @param {string} evaluationCycleId
   * @returns {Promise<Object>}
   */
  async fetchPersonnelAssignedScale(personnelId, evaluationCycleId = '2025-2026') {
    const response = await apiClient.get(`/personnel/${personnelId}/evaluation-scale`, {
      params: { evaluation_cycle_id: evaluationCycleId },
    })
    return response.data?.data || null
  },

  /**
   * Synchronous helper for resolving scale from context.
   * @param {Object} context
   * @returns {Object}
   */
  resolveScaleFromContextSync(context = {}) {
    const group = (context.personnel_group || '').toLowerCase().trim()
    const side = (context.organizational_side || '').toLowerCase().trim()

    if (group === 'faculty' && side === 'academic') {
      return {
        scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        scale_title: 'Rating Sheet for Administrators & Academic Personnel',
        rule_version: EVALUATION_RULE_VERSION,
        assignment_status: 'assigned',
        reason_code: 'scale_assigned_successfully',
      }
    }

    if (group === 'non_teaching_faculty' && side === 'academic') {
      return {
        scale_code: EVALUATION_SCALE_CODES.ADMINISTRATORS,
        scale_title: 'Rating Sheet for Administrators & Academic Personnel',
        rule_version: EVALUATION_RULE_VERSION,
        assignment_status: 'assigned',
        reason_code: 'scale_assigned_successfully',
      }
    }

    if (group === 'non_teaching_faculty' && side === 'non_academic') {
      return {
        scale_code: EVALUATION_SCALE_CODES.NON_TEACHING,
        scale_title: 'Non-Teaching Personnel Rating Sheet for Ranking (Appendix N)',
        rule_version: EVALUATION_RULE_VERSION,
        assignment_status: 'assigned',
        reason_code: 'scale_assigned_successfully',
      }
    }

    return {
      scale_code: null,
      scale_title: null,
      rule_version: EVALUATION_RULE_VERSION,
      assignment_status: 'rejected',
      reason_code: 'unsupported_personnel_combination',
    }
  },

  /**
   * Retrieves the full instrument configuration for an assigned scale code.
   * @param {string} scaleCode
   * @returns {Object|null}
   */
  getInstrument(scaleCode) {
    return evaluationInstrumentRegistry.getInstrument(scaleCode)
  },
}

export default evaluationScaleAssignmentService
