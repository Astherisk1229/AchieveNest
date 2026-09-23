const STATUS_LABELS = Object.freeze({
  READY_FOR_REVIEW: 'Ready for Review',
  UNDER_REVIEW: 'Under Review',
  REVIEWED: 'Reviewed',
  EVALUATED: 'Reviewed'
})

function available(fieldAvailability, field) {
  const entry = fieldAvailability?.[field]
  return entry === true || entry?.available === true || entry?.status === 'AVAILABLE'
}

export default class AwardPotentialCandidatesModel {
  constructor(payload = {}) {
    this.award = payload.award || null
    this.candidates = Array.isArray(payload.potential_candidates)
      ? payload.potential_candidates.map((candidate) => this.#normalize(candidate))
      : []
  }

  #normalize(candidate) {
    const availability = candidate.field_availability || {}
    const reviewStatus = candidate.review_status || candidate.candidate_status || 'STATUS_UNAVAILABLE'
    return Object.freeze({
      ...candidate,
      id: candidate.student_id || candidate.student_profile_id || null,
      reviewStatus,
      reviewStatusLabel: STATUS_LABELS[reviewStatus] || String(reviewStatus).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
      rawScoreAvailable: available(availability, 'raw_portfolio_score') && available(availability, 'computable_max_score'),
      potentialScoreAvailable: available(availability, 'portfolio_potential_score'),
      identifiedAt: candidate.identified_at || candidate.classified_at || null
    })
  }

  static authorityPending(award) {
    return award?.authority_status === 'PROPOSED' || award?.configuration_status === 'AWARD_AUTHORITY_PENDING'
  }

  static filterAndSort(candidates, { search = '', status = 'ALL', sort = 'SCORE_DESC' } = {}) {
    const query = search.trim().toLocaleLowerCase()
    const filtered = candidates.filter((candidate) => {
      const matchesSearch = !query || [candidate.student_name, candidate.program]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query))
      return matchesSearch && (status === 'ALL' || candidate.reviewStatus === status)
    })

    return [...filtered].sort((left, right) => {
      if (sort === 'NAME') return String(left.student_name || '').localeCompare(String(right.student_name || ''))
      if (sort === 'RECENT') return String(right.identifiedAt || '').localeCompare(String(left.identifiedAt || ''))
      const a = left.potentialScoreAvailable ? Number(left.portfolio_potential_score) : null
      const b = right.potentialScoreAvailable ? Number(right.portfolio_potential_score) : null
      if (a === null && b === null) return String(left.student_name || '').localeCompare(String(right.student_name || ''))
      if (a === null) return 1
      if (b === null) return -1
      return sort === 'SCORE_ASC' ? a - b : b - a
    })
  }

  static statusOptions(candidates) {
    const values = [...new Set(candidates.map((candidate) => candidate.reviewStatus))]
    return [{ value: 'ALL', label: 'All' }, ...values.map((value) => ({
      value,
      label: STATUS_LABELS[value] || String(value).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
    }))]
  }
}
