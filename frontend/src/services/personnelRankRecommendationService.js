import apiClient from './apiClient'
import { facultyInitialRankService } from './facultyInitialRankService'
import { partTimeFacultyTitleService } from './partTimeFacultyTitleService'

/**
 * Service for Personnel Qualification-Driven Preferred Rank/Title Recommendation (Plan D2 — Phase D2-2).
 *
 * Integrates with existing authoritative Plan E backend resolvers:
 * - Full-Time: POST /api/v1/faculty-ranks/resolve-initial (FacultyInitialRankService)
 * - Part-Time: POST /api/v1/faculty-titles/part-time/resolve (PartTimeFacultyTitleService)
 *
 * Enforces:
 * 1. Non-demotion / non-promotion safety (recommendation is advisory, not promotion).
 * 2. Strict Full-Time vs Part-Time catalog isolation.
 * 3. Race-condition protection with request sequencing.
 * 4. Catalog validation of resolved recommendation against active master data.
 */
let currentSequenceId = 0

export const personnelRankRecommendationService = {
  /**
   * Resolves preferred initial rank/title recommendation based on qualification and engagement.
   *
   * @param {Object} params
   * @param {string} params.qualificationText - Free-text qualification summary (e.g. "MS in CS", "PhD in Education")
   * @param {string} params.facultyEngagement - 'full_time_faculty' | 'part_time_faculty'
   * @param {string} [params.personnelGroup] - 'faculty' | 'non_teaching_faculty'
   * @param {boolean} [params.licensureVerified] - Whether professional board licensure is verified
   * @param {Array} [params.activeCatalog] - Active catalog options to validate against
   * @returns {Promise<{ sequenceId: number, status: 'resolved'|'unresolved'|'ineligible'|'error', recommendedCode: string|null, recommendedLabel: string|null, reasonCode: string|null, message: string|null, source: string, isCompatibleWithCatalog: boolean }>}
   */
  async resolveRecommendation({
    qualificationText = '',
    facultyEngagement = 'full_time_faculty',
    personnelGroup = 'faculty',
    licensureVerified = false,
    activeCatalog = []
  }) {
    const seqId = ++currentSequenceId
    const trimmedQual = (qualificationText || '').trim()

    // If no qualification provided, return idle/unresolved cleanly
    if (!trimmedQual) {
      return {
        sequenceId: seqId,
        status: 'unresolved',
        recommendedCode: null,
        recommendedLabel: null,
        reasonCode: 'no_qualification_provided',
        message: 'Enter qualification to generate initial recommendation.',
        source: 'plan_e',
        isCompatibleWithCatalog: false
      }
    }

    // Non-teaching personnel check
    if (personnelGroup !== 'faculty') {
      return {
        sequenceId: seqId,
        status: 'ineligible',
        recommendedCode: null,
        recommendedLabel: null,
        reasonCode: 'non_teaching_not_applicable',
        message: 'Non-Teaching personnel are outside the academic faculty rank model.',
        source: 'plan_e',
        isCompatibleWithCatalog: false
      }
    }

    try {
      if (facultyEngagement === 'part_time_faculty') {
        // Part-Time Recommendation via Plan E Part-Time Title Resolver
        const payload = {
          qualification: trimmedQual,
          is_verified: true,
          verified: true,
          faculty_engagement: 'part_time_faculty',
          personnel_group: 'faculty',
          board_passer: Boolean(licensureVerified)
        }

        let ptRes = null
        try {
          ptRes = await partTimeFacultyTitleService.resolveTitleFromQualification(payload)
        } catch (apiErr) {
          // Fallback to synchronous local Plan E logic if network fails
        }
        if (!ptRes || (!ptRes.resolved_title && !ptRes.resolved_title_code)) {
          ptRes = partTimeFacultyTitleService.resolveTitleSync({
            ...payload,
            qualification_verified: true
          })
        }

        const resolvedTitle = ptRes?.resolved_title || {}
        const code = resolvedTitle.title_code || ptRes?.resolved_title_code || null
        const label = resolvedTitle.display_label || ptRes?.resolved_title_name || (code ? partTimeFacultyTitleService.getTitleByCodeSync(code)?.label : null)
        const isResolved = Boolean(code && label && (ptRes?.status === 'RESOLVED' || ptRes?.status === 'OK'))

        // Catalog compatibility check
        const isCompatible = Boolean(
          isResolved &&
          (!activeCatalog || activeCatalog.length === 0 || activeCatalog.some(c =>
            (c.code && c.code.toLowerCase() === code.toLowerCase()) ||
            (c.label && c.label.toLowerCase() === label.toLowerCase())
          ))
        )

        return {
          sequenceId: seqId,
          status: isResolved ? 'resolved' : 'unresolved',
          recommendedCode: code,
          recommendedLabel: label,
          reasonCode: ptRes?.reason_code || (isResolved ? 'part_time_qualification_mapped' : 'seed_rule_unresolved'),
          message: ptRes?.message || (isResolved ? `Suggested Part-Time Title: ${label}` : 'No preferred title could be determined from the current qualification data.'),
          source: 'plan_e',
          isCompatibleWithCatalog: isCompatible
        }
      } else {
        // Full-Time Recommendation via Plan E Initial Rank Resolver
        const payload = {
          qualification: trimmedQual,
          qualification_verified: true,
          licensure_verified: Boolean(licensureVerified),
          faculty_engagement: 'full_time_faculty',
          personnel_group: 'faculty'
        }

        let ftRes = null
        try {
          ftRes = await facultyInitialRankService.resolveInitialRank(payload)
        } catch (apiErr) {
          // Fallback to synchronous local Plan E logic if network fails
        }
        if (!ftRes || !ftRes.resolved_initial_rank_code) {
          ftRes = facultyInitialRankService.resolveInitialRankSync(payload)
        }

        const code = ftRes?.resolved_initial_rank_code || null
        const label = ftRes?.resolved_initial_rank_name || null
        const isResolved = Boolean(code && label && ftRes?.status === 'OK')

        // Catalog compatibility check
        const isCompatible = Boolean(
          isResolved &&
          (!activeCatalog || activeCatalog.length === 0 || activeCatalog.some(c =>
            (c.code && c.code.toLowerCase() === code.toLowerCase()) ||
            (c.label && c.label.toLowerCase() === label.toLowerCase())
          ))
        )

        return {
          sequenceId: seqId,
          status: isResolved ? 'resolved' : 'unresolved',
          recommendedCode: code,
          recommendedLabel: label,
          reasonCode: ftRes?.reason_code || (isResolved ? 'full_time_qualification_mapped' : 'seed_rule_unresolved'),
          message: ftRes?.message || (isResolved ? `Suggested Academic Rank: ${label}` : 'No preferred rank could be determined from the current qualification data.'),
          source: 'plan_e',
          isCompatibleWithCatalog: isCompatible
        }
      }
    } catch (err) {
      return {
        sequenceId: seqId,
        status: 'error',
        recommendedCode: null,
        recommendedLabel: null,
        reasonCode: 'resolver_error',
        message: 'Resolver error: Failed to calculate rank recommendation.',
        source: 'plan_e',
        isCompatibleWithCatalog: false
      }
    }
  },

  /**
   * Helper to check if a sequence ID is the latest active request.
   * @param {number} seqId
   * @returns {boolean}
   */
  isLatest(seqId) {
    return seqId === currentSequenceId
  },

  /**
   * Classifies the source of the currently selected rank/title:
   * - 'saved': Authoritative saved value from existing Personnel record
   * - 'recommended': System recommendation derived from qualification
   * - 'manual': Explicit HR override / selection
   * - 'legacy': Saved value not present in active catalog (reconciliation required)
   * - 'none': Empty / unselected
   *
   * @param {Object} params
   * @param {string} params.currentRank
   * @param {string} [params.savedOfficialRank]
   * @param {string} [params.recommendedRank]
   * @param {boolean} [params.isInCatalog]
   * @param {boolean} [params.wasManuallyChanged]
   * @returns {'saved'|'recommended'|'manual'|'legacy'|'none'}
   */
  getRankSelectionSource({
    currentRank = '',
    savedOfficialRank = '',
    recommendedRank = '',
    isInCatalog = true,
    wasManuallyChanged = false
  }) {
    if (!currentRank) return 'none'
    if (!isInCatalog) return 'legacy'
    if (wasManuallyChanged) {
      if (recommendedRank && currentRank.toLowerCase() === recommendedRank.toLowerCase()) {
        return 'recommended'
      }
      return 'manual'
    }
    if (savedOfficialRank && currentRank.toLowerCase() === savedOfficialRank.toLowerCase()) {
      return 'saved'
    }
    if (recommendedRank && currentRank.toLowerCase() === recommendedRank.toLowerCase()) {
      return 'recommended'
    }
    return 'manual'
  },

  /**
   * Validates if a rank/title string is compatible with the given faculty engagement catalog.
   *
   * @param {string} rankTitle
   * @param {'full_time_faculty'|'part_time_faculty'} facultyEngagement
   * @param {Array} catalog
   * @returns {boolean}
   */
  isRankCompatible({ rankTitle = '', facultyEngagement = 'full_time_faculty', catalog = [] }) {
    if (!rankTitle) return true
    const normalized = rankTitle.toLowerCase().trim()
    const ptTitles = [
      'professorial lecturer',
      'assistant professorial lecturer',
      'senior lecturer',
      'lecturer',
      'pt_professorial_lecturer',
      'pt_assistant_professorial_lecturer',
      'pt_senior_lecturer',
      'pt_lecturer'
    ]
    const isPt = ptTitles.includes(normalized)

    if (facultyEngagement === 'full_time_faculty' && isPt) {
      return false
    }
    if (facultyEngagement === 'part_time_faculty' && !isPt) {
      return false
    }

    if (catalog && catalog.length > 0) {
      return catalog.some(c =>
        (c.label && c.label.toLowerCase() === normalized) ||
        (c.code && c.code.toLowerCase() === normalized)
      )
    }

    return true
  },

  /**
   * Resets the sequence counter (useful for unit testing).
   */
  resetSequence() {
    currentSequenceId = 0
  }
}

export default personnelRankRecommendationService
