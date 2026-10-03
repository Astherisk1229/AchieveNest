const AVAILABLE = 'AVAILABLE'

function number(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseStructured(value) {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string' || value.trim() === '') return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export class AwardCriterionModel {
  constructor(record = {}, fallbackName = 'Unnamed criterion') {
    this.record = record
    this.fallbackName = fallbackName
  }

  get id() { return this.record.criterion_id || this.record.id || this.record.criterion_code }
  get name() { return this.record.criterion_name || this.record.name || this.fallbackName }
  get type() { return String(this.record.criterion_type || '').toUpperCase() || null }
  get maxPoints() { return number(this.record.max_points) }
  get cap() { return number(this.record.cap) }
  get components() { return Array.isArray(this.record.components) ? this.record.components : [] }
  get componentModels() { return this.components.map((component) => new AwardCriterionModel(component, 'Component label unavailable')) }
  get warnings() { return Array.isArray(this.record.scoring_warnings) ? this.record.scoring_warnings : [] }
  get scoringStatus() { return this.record.scoring_status || null }
  get aggregationMode() { return this.record.aggregation_mode || null }
  get duplicateRule() { return this.record.duplicate_rule || null }
  get evidenceRequirement() { return this.record.evidence_requirement || null }
  get humanOnly() { return this.type === 'HUMAN_ONLY' || this.record.human_only === true }

  fieldAvailable(field) {
    return this.record.field_availability?.[field]?.status === AVAILABLE
  }

  get pointMapping() {
    return this.fieldAvailable('point_mapping') ? parseStructured(this.record.point_mapping) : null
  }
}

export default class AwardCriteriaModel {
  constructor(record = {}) {
    this.record = record
    this.criteria = (Array.isArray(record.criteria) ? record.criteria : []).map((criterion) => new AwardCriterionModel(criterion))
  }

  fieldAvailable(field) {
    return this.record.field_availability?.[field]?.status === AVAILABLE
  }

  get computableCriteria() { return this.criteria.filter((criterion) => !criterion.humanOnly) }
  get renderableCriteria() {
    return this.computableCriteria.flatMap((criterion) => criterion.componentModels.length > 0 ? criterion.componentModels : [criterion])
  }
  get humanCriteria() { return this.criteria.filter((criterion) => criterion.humanOnly) }
  get isProposed() { return String(this.record.authority_status || '').toUpperCase() === 'PROPOSED' }
  get authorityPending() { return this.isProposed || this.record.configuration_status === 'AWARD_AUTHORITY_PENDING' }

  get qualification() {
    return {
      required: this.fieldAvailable('raw_qualifying_score') ? number(this.record.raw_qualifying_score) : null,
      threshold: this.fieldAvailable('candidate_threshold_percent') ? number(this.record.candidate_threshold_percent) : null,
      maximum: this.fieldAvailable('computable_max_score') ? number(this.record.computable_max_score) : null,
      purpose: this.record.threshold_purpose || null
    }
  }

  get thresholds() {
    const source = this.record.thresholds || {}
    return Object.values(source).filter((item) => item?.availability?.status === AVAILABLE && number(item.value) !== null)
  }

  get metadata() {
    return [
      ['Authority', this.record.authority_status],
      ['Source fidelity', this.record.source_fidelity_status],
      ['Scoring version', this.fieldAvailable('scoring_version') ? this.record.scoring_version_label : null],
      ['Source document', this.fieldAvailable('source_document') ? this.record.source_document_label : null],
      ['Effective date', this.record.source_effective_date],
      ['Configuration', this.record.configuration_status]
    ].filter(([, value]) => value !== null && value !== undefined && value !== '')
  }
}
