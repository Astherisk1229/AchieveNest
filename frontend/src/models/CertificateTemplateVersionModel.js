/**
 * CertificateTemplateVersionModel.js
 * Immutable Version entity for OSAD Certificate Templates.
 * Stores structured content schema, layout schema, signatory slots, and allowlisted placeholders.
 */

export const ALLOWLISTED_PLACEHOLDERS = [
  'recipient_name',
  'certificate_title',
  'award_or_event_title',
  'award_category',
  'event_title',
  'event_date',
  'academic_year',
  'organization_name',
  'college_name',
  'degree_program',
  'rank_or_distinction',
  'certificate_number',
  'issued_date',
  'verification_url'
]

export class CertificateTemplateVersionModel {
  #id
  #templateFamilyId
  #versionNumber
  #status // 'draft' | 'published' | 'superseded'
  #contentSchema
  #layoutSchema
  #signatorySlots
  #changeSummary
  #publishedBy
  #publishedAt

  constructor(data = {}) {
    this.#id = data.id || `tpl-ver-${Date.now()}`
    this.#templateFamilyId = data.templateFamilyId || ''
    this.#versionNumber = data.versionNumber || 1
    this.#status = ['draft', 'published', 'superseded'].includes(data.status) ? data.status : 'draft'
    
    this.#contentSchema = {
      heading: data.contentSchema?.heading || 'OFFICIAL CERTIFICATE OF ATTAINMENT',
      recipientLeadIn: data.contentSchema?.recipientLeadIn || 'This is proudly presented to',
      body: data.contentSchema?.body || 'For outstanding active participation and exemplary contribution to {{event_title}} hosted by {{organization_name}} on {{event_date}}.',
      footerNote: data.contentSchema?.footerNote || 'Notre Dame of Marbel University • Office of Student Affairs & Services'
    }

    this.#layoutSchema = {
      pageSize: data.layoutSchema?.pageSize || 'A4',
      orientation: data.layoutSchema?.orientation || 'landscape',
      themeId: data.layoutSchema?.themeId || 'emerald_gold',
      borderStyle: data.layoutSchema?.borderStyle || 'classic_ornate',
      watermarkAssetId: data.layoutSchema?.watermarkAssetId || 'ndmu_seal'
    }

    this.#signatorySlots = Array.isArray(data.signatorySlots) ? data.signatorySlots : [
      { slotId: 'sig-1', label: 'OSAD Director', required: true, title: 'OSAD Director', name: 'Director Marcus Vance' },
      { slotId: 'sig-2', label: 'Organization Moderator', required: true, title: 'Faculty Moderator', name: 'Prof. Grace Tan' }
    ]

    this.#changeSummary = data.changeSummary || 'Initial version configuration'
    this.#publishedBy = data.publishedBy || null
    this.#publishedAt = data.publishedAt || null
  }

  get id() { return this.#id }
  get templateFamilyId() { return this.#templateFamilyId }
  get versionNumber() { return this.#versionNumber }
  get status() { return this.#status }
  get contentSchema() { return { ...this.#contentSchema } }
  get layoutSchema() { return { ...this.#layoutSchema } }
  get signatorySlots() { return this.#signatorySlots.map(s => ({ ...s })) }
  get changeSummary() { return this.#changeSummary }
  get publishedBy() { return this.#publishedBy }
  get publishedAt() { return this.#publishedAt }

  extractPlaceholders() {
    const text = `${this.#contentSchema.heading} ${this.#contentSchema.recipientLeadIn} ${this.#contentSchema.body} ${this.#contentSchema.footerNote}`
    const matches = text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || []
    return Array.from(new Set(matches.map(m => m.replace(/[\{\}]/g, ''))))
  }

  validatePlaceholders() {
    const used = this.extractPlaceholders()
    const unknown = used.filter(p => !ALLOWLISTED_PLACEHOLDERS.includes(p))
    return {
      isValid: unknown.length === 0,
      unknownPlaceholders: unknown,
      usedPlaceholders: used
    }
  }

  static validate(data) {
    const errors = []
    if (!data.templateFamilyId) errors.push('Template family ID is required.')
    if (!data.contentSchema?.heading) errors.push('Certificate heading is required.')
    if (!data.contentSchema?.body) errors.push('Certificate body text is required.')
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  toJSON() {
    return {
      id: this.#id,
      templateFamilyId: this.#templateFamilyId,
      versionNumber: this.#versionNumber,
      status: this.#status,
      contentSchema: this.#contentSchema,
      layoutSchema: this.#layoutSchema,
      signatorySlots: this.#signatorySlots,
      changeSummary: this.#changeSummary,
      publishedBy: this.#publishedBy,
      publishedAt: this.#publishedAt
    }
  }
}

export default CertificateTemplateVersionModel
