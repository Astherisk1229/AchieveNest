/**
 * Presents the server's finalized-evaluation reuse decision.
 * Finalized evaluation history is authoritative. Draft, submitted, and returned versions do not
 * consume accomplishments, and Faculty education remains reusable across evaluations.
 */

export default class AchievementReuseEligibilityService {
  static evaluateReuseEligibility(accomplishmentOrUsage) {
    const reuse = accomplishmentOrUsage?.reuse || {}
    const isConsumed = reuse.is_consumed === true
    const isInActiveEvaluation = reuse.is_in_active_evaluation === true
    const lastUsedAY = reuse.last_used_academic_year || null
    const activeEvaluationAY = reuse.active_evaluation_academic_year || null

    return {
      isEligible: !isConsumed,
      lastUsedAY,
      activeEvaluationAY,
      eligibleAgainAY: null,
      displayLabel: isConsumed
        ? (lastUsedAY ? `Used in ${String(lastUsedAY).replace(/^AY\s*/i, '')} Evaluation` : 'Used in a finalized evaluation')
        : isInActiveEvaluation
          ? `Included in ${String(activeEvaluationAY || '').replace(/^AY\s*/i, '') || 'active'} Evaluation`
          : (/education/i.test(reuse.status_label || '') ? 'Reusable in evaluations' : 'Available for future evaluation'),
      statusLabel: isConsumed
        ? `Used in finalized evaluation${lastUsedAY ? ` (${lastUsedAY})` : ''}`
        : isInActiveEvaluation
          ? `Included in an active evaluation${activeEvaluationAY ? ` (${activeEvaluationAY})` : ''}`
          : (reuse.status_label || 'Available for evaluation'),
      badgeType: isConsumed ? 'locked' : isInActiveEvaluation ? 'in_evaluation' : 'eligible'
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
