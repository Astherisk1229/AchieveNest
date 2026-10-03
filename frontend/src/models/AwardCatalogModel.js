export default class AwardCatalogModel {
  constructor(record = {}) {
    this.record = record
    this.id = record.id
    this.name = record.name || 'Unnamed award'
    this.description = record.description || null
    this.authorityStatus = record.authority_status || null
    this.sourceFidelityStatus = record.source_fidelity_status || null
    this.configurationStatus = record.configuration_status || 'CONFIGURATION_ERROR'
    this.configurationValid = record.configuration_valid === true
  }

  fieldIsAvailable(field) {
    return this.record?.field_availability?.[field]?.status === 'AVAILABLE'
  }

  eligibilityText() {
    const availability = this.record?.field_availability || {}
    if (availability.graduating_only?.status === 'AVAILABLE' && this.record.graduating_only === true) {
      return 'For graduating students'
    }
    if (availability.gender_restriction?.status === 'AVAILABLE') {
      const gender = String(this.record.gender_restriction || '').trim().toLowerCase()
      if (gender === 'female') return 'Female students'
      if (gender === 'male') return 'Male students'
    }
    return 'Eligibility details unavailable'
  }

  qualificationPresentation() {
    if (this.configurationStatus === 'AWARD_AUTHORITY_PENDING') {
      return { tone: 'pending', text: 'Candidate generation pending authority approval' }
    }
    if (['CONFIGURATION_ERROR', 'THRESHOLD_CONFIGURATION_ERROR'].includes(this.configurationStatus)) {
      return { tone: 'unavailable', text: 'Qualification configuration unavailable' }
    }
    if (this.configurationStatus === 'PARTIALLY_UNSCORABLE') {
      return { tone: 'warning', text: 'Some criteria cannot currently be scored automatically.' }
    }

    const required = this.record.raw_qualifying_score
    const maximum = this.record.computable_max_score
    const threshold = this.record.candidate_threshold_percent
    const valuesAvailable = this.fieldIsAvailable('computable_max_score')
      && this.fieldIsAvailable('candidate_threshold_percent')
      && Number.isFinite(Number(required))
      && Number.isFinite(Number(maximum))
      && Number.isFinite(Number(threshold))

    if (!this.configurationValid || !valuesAvailable) {
      return { tone: 'unavailable', text: 'Qualification details unavailable' }
    }

    const format = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
    return { tone: 'valid', text: `${format(required)} / ${format(maximum)} required · ${format(threshold)}% threshold` }
  }
}
