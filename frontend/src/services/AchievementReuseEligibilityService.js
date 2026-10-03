/**
 * AchievementReuseEligibilityService.js
 *
 * Frontend service and business logic for Package D: 2-Year Achievement Reuse Eligibility.
 *
 * Rules:
 * 1. Achievements used in a submitted portfolio are locked from reuse for 2 academic years.
 *    Example: Used in AY 2025-2026 -> Locked in AY 2026-2027 -> Automatically eligible again in AY 2027-2028.
 * 2. Locked achievements remain visible in the repository, but cannot be re-added to the current draft.
 * 3. Prevents duplicate addition of the same achievement within the same submission.
 */

export const REUSE_LOCK_YEARS = 2

export default class AchievementReuseEligibilityService {
  /**
   * Calculates the academic year when an achievement becomes eligible again after a 2-year lock.
   * @param {string} academicYear e.g. "AY 2025-2026" or "2025-2026"
   * @param {number} lockYears Number of years to lock (default 2)
   * @returns {string} e.g. "AY 2027-2028"
   */
  static calculateEligibleAgainAcademicYear(academicYear, lockYears = REUSE_LOCK_YEARS) {
    if (!academicYear || typeof academicYear !== 'string') {
      const currentYear = new Date().getFullYear()
      return `AY ${currentYear + lockYears}-${currentYear + lockYears + 1}`
    }

    const matches = academicYear.match(/(\d{4})\s*-\s*(\d{4})/)
    if (matches) {
      const startYear = parseInt(matches[1], 10) + lockYears
      const endYear = parseInt(matches[2], 10) + lockYears
      return `AY ${startYear}-${endYear}`
    }

    const currentYear = new Date().getFullYear()
    return `AY ${currentYear + lockYears}-${currentYear + lockYears + 1}`
  }

  /**
   * Evaluates if an accomplishment or usage record is eligible for inclusion in the target academic year.
   * @param {Object} accomplishmentOrUsage
   * @param {string} targetAcademicYear e.g. "AY 2026-2027"
   * @returns {{ isEligible: boolean, lastUsedAY: string|null, eligibleAgainAY: string|null, statusLabel: string, badgeType: string }}
   */
  static evaluateReuseEligibility(accomplishmentOrUsage, targetAcademicYear = 'AY 2026-2027') {
    if (!accomplishmentOrUsage) {
      return {
        isEligible: true,
        lastUsedAY: null,
        eligibleAgainAY: null,
        statusLabel: 'Eligible for Portfolio',
        badgeType: 'eligible'
      }
    }

    // Check backend-provided reuse object or direct usage properties
    const reuse = accomplishmentOrUsage.reuse || {}
    const lastUsedAY = reuse.last_used_academic_year || accomplishmentOrUsage.last_used_academic_year || accomplishmentOrUsage.academic_year || null
    const eligibleAgainAY = reuse.eligible_again_academic_year ||
      accomplishmentOrUsage.eligible_again_academic_year ||
      (lastUsedAY ? this.calculateEligibleAgainAcademicYear(lastUsedAY) : null)

    if (!lastUsedAY) {
      return {
        isEligible: true,
        lastUsedAY: null,
        eligibleAgainAY: null,
        statusLabel: 'Eligible for Portfolio',
        badgeType: 'eligible'
      }
    }

    // Extract starting years for comparison
    const targetStartMatches = targetAcademicYear.match(/(\d{4})/)
    const targetStartYear = targetStartMatches ? parseInt(targetStartMatches[1], 10) : new Date().getFullYear()

    const eligibleStartMatches = eligibleAgainAY ? eligibleAgainAY.match(/(\d{4})/) : null
    const eligibleStartYear = eligibleStartMatches ? parseInt(eligibleStartMatches[1], 10) : 0

    const isEligible = targetStartYear >= eligibleStartYear

    return {
      isEligible,
      lastUsedAY,
      eligibleAgainAY,
      statusLabel: isEligible
        ? 'Eligible for Reuse'
        : `Previously Used in ${lastUsedAY} • Eligible Again: ${eligibleAgainAY}`,
      badgeType: isEligible ? 'eligible_reuse' : 'locked'
    }
  }

  /**
   * Checks if an accomplishment is already included in the portfolio model.
   * @param {Object} portfolio
   * @param {string} accomplishmentId
   * @returns {boolean}
   */
  static isAlreadyInPortfolio(portfolio, accomplishmentId) {
    if (!portfolio || !accomplishmentId) return false
    const allItems = [
      ...(portfolio.area_a_items || []),
      ...(portfolio.area_b_items || []),
      ...(portfolio.area_c_items || [])
    ]
    return allItems.some(
      item => item.id === accomplishmentId || item.accomplishment_id === accomplishmentId
    )
  }
}
