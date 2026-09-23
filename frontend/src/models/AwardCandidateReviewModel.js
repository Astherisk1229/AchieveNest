const STATUS_LABELS = Object.freeze({
  NOT_REVIEWED: 'Ready for Review',
  IN_PROGRESS: 'Under Review',
  EVALUATED: 'Reviewed'
})

const isAvailable = (availability, field) => availability?.[field]?.status === 'AVAILABLE'

export default class AwardCandidateReviewModel {
  constructor(payload = {}) {
    this.payload = payload
    this.award = payload.award || {}
    this.student = payload.student || {}
    this.score = payload.portfolio_scoring || {}
    this.reviewStatus = payload.evaluation_status || 'STATUS_UNAVAILABLE'
    this.reviewStatusLabel = STATUS_LABELS[this.reviewStatus]
      || String(this.reviewStatus).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    this.evidence = Array.isArray(payload.all_relevant_records) ? payload.all_relevant_records : []
    this.criteria = Array.isArray(this.score.criteria)
      ? this.score.criteria.map((criterion) => this.#criterion(criterion))
      : []
    this.humanOnlyCriteria = Array.isArray(payload.human_only_criteria)
      ? payload.human_only_criteria
      : []
  }

  #criterion(criterion) {
    const evidenceIds = Array.isArray(criterion.evidence_ids) ? criterion.evidence_ids : []
    return Object.freeze({
      ...criterion,
      achievedPointsAvailable: criterion.achieved_points !== null && criterion.achieved_points !== undefined,
      maxPointsAvailable: criterion.max_points !== null && criterion.max_points !== undefined,
      evidenceRecords: this.evidence.filter((record) => evidenceIds.includes(record.record_id || record.id)),
      warnings: Array.isArray(criterion.scoring_warnings) ? criterion.scoring_warnings : []
    })
  }

  static authorityPending(award) {
    return award?.authority_status === 'PROPOSED' || award?.configuration_status === 'AWARD_AUTHORITY_PENDING'
  }

  scorePresentation() {
    const availability = this.score.field_availability || {}
    return {
      rawAvailable: isAvailable(availability, 'raw_portfolio_score') && isAvailable(availability, 'computable_max_score'),
      potentialAvailable: isAvailable(availability, 'portfolio_potential_score'),
      requiredAvailable: isAvailable(availability, 'raw_qualifying_score') && isAvailable(availability, 'computable_max_score'),
      thresholdAvailable: isAvailable(availability, 'candidate_threshold_percent')
    }
  }
}
