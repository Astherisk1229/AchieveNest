/**
 * Presents the server's finalized-evaluation reuse decision.
 * Finalized evaluation history is authoritative. Draft, submitted, and returned versions do not
 * consume accomplishments, and Faculty education remains reusable across evaluations.
 */

export default class AchievementReuseEligibilityService {
  static evaluateReuseEligibility(accomplishmentOrUsage) {
    const reuse = accomplishmentOrUsage?.reuse || {}
    const isConsumed = reuse.is_consumed === true
    const lastUsedAY = reuse.last_used_academic_year || null

    return {
      isEligible: !isConsumed,
      lastUsedAY,
      eligibleAgainAY: null,
      displayLabel: isConsumed
        ? (lastUsedAY ? `Used in ${String(lastUsedAY).replace(/^AY\s*/i, '')} Evaluation` : 'Used in a finalized evaluation')
        : (/education/i.test(reuse.status_label || '') ? 'Reusable in evaluations' : 'Available for future evaluation'),
      statusLabel: isConsumed
        ? `Used in finalized evaluation${lastUsedAY ? ` (${lastUsedAY})` : ''}`
        : (reuse.status_label || 'Available for evaluation'),
      badgeType: isConsumed ? 'locked' : 'eligible'
    }
  }

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
