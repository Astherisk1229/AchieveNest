/**
 * CertificateTemplateModel.js
 * Domain model for OSAD Certificate Template Families.
 * Represents the stable design identity (family) across multiple immutable published versions.
 */

export const ALLOWED_TEMPLATE_CONTEXTS = ['award', 'event']

export class CertificateTemplateModel {
  #id
  #code
  #name
  #allowedContexts
  #status // 'active' | 'retired'
  #currentPublishedVersionId
  #createdBy
  #createdAt
  #updatedAt

  constructor(data = {}) {
    this.#id = data.id || `tpl-fam-${Date.now()}`
    this.#code = data.code || `OSAD-TPL-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`
    this.#name = data.name || 'Untitled Certificate Template'
    this.#allowedContexts = Array.isArray(data.allowedContexts) && data.allowedContexts.length > 0 
      ? data.allowedContexts 
      : ['event']
    this.#status = data.status === 'retired' ? 'retired' : 'active'
    this.#currentPublishedVersionId = data.currentPublishedVersionId || null
    this.#createdBy = data.createdBy || 'OSAD Staff'
    this.#createdAt = data.createdAt || new Date().toISOString()
    this.#updatedAt = data.updatedAt || new Date().toISOString()
  }

  get id() { return this.#id }
  get code() { return this.#code }
  get name() { return this.#name }
  get allowedContexts() { return [...this.#allowedContexts] }
  get status() { return this.#status }
  get currentPublishedVersionId() { return this.#currentPublishedVersionId }
  get createdBy() { return this.#createdBy }
  get createdAt() { return this.#createdAt }
  get updatedAt() { return this.#updatedAt }

  isContextCompatible(context) {
    if (this.#status === 'retired') return false
    return this.#allowedContexts.includes(context)
  }

  static validate(data) {
    const errors = []
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Template family name is required.')
    }
    if (data.allowedContexts && Array.isArray(data.allowedContexts)) {
      const invalid = data.allowedContexts.filter(c => !ALLOWED_TEMPLATE_CONTEXTS.includes(c))
      if (invalid.length > 0) {
        errors.push(`Invalid template contexts: ${invalid.join(', ')}`)
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  toJSON() {
    return {
      id: this.#id,
      code: this.#code,
      name: this.#name,
      allowedContexts: this.#allowedContexts,
      status: this.#status,
      currentPublishedVersionId: this.#currentPublishedVersionId,
      createdBy: this.#createdBy,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt
    }
  }
}

export default CertificateTemplateModel
