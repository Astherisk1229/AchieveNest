/**
 * AwardCycleModel.js
 * Domain model representing an NDMU Award Cycle lifecycle and state rules.
 * Lifecycle: draft -> calculating -> ready_for_review -> confirmed -> published -> archived
 */

export const AWARD_CYCLE_STATUS = {
  DRAFT: 'draft',
  CALCULATING: 'calculating',
  READY_FOR_REVIEW: 'ready_for_review',
  CONFIRMED: 'confirmed',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
}

export class AwardCycleModel {
  static canConfirm(status) {
    return status === AWARD_CYCLE_STATUS.READY_FOR_REVIEW || status === AWARD_CYCLE_STATUS.CONFIRMED
  }

  static canUndo(status) {
    return status === AWARD_CYCLE_STATUS.READY_FOR_REVIEW || status === AWARD_CYCLE_STATUS.CONFIRMED
  }

  static canPublish(status) {
    return status === AWARD_CYCLE_STATUS.READY_FOR_REVIEW || status === AWARD_CYCLE_STATUS.CONFIRMED
  }

  static canRevoke(status) {
    return status === AWARD_CYCLE_STATUS.PUBLISHED
  }

  static isOfficialOutputAllowed(status) {
    return status === AWARD_CYCLE_STATUS.PUBLISHED || status === AWARD_CYCLE_STATUS.ARCHIVED
  }

  static formatStatusLabel(status) {
    switch (status) {
      case AWARD_CYCLE_STATUS.DRAFT:
        return 'Draft Cycle'
      case AWARD_CYCLE_STATUS.CALCULATING:
        return 'Calculating Scores'
      case AWARD_CYCLE_STATUS.READY_FOR_REVIEW:
        return 'Ready for OSAD Review'
      case AWARD_CYCLE_STATUS.CONFIRMED:
        return 'OSAD Confirmed'
      case AWARD_CYCLE_STATUS.PUBLISHED:
        return 'Official Published'
      case AWARD_CYCLE_STATUS.ARCHIVED:
        return 'Archived Record'
      default:
        return 'Unknown Cycle State'
    }
  }
}

export default AwardCycleModel
