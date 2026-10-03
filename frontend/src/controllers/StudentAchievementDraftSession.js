/**
 * StudentAchievementDraftSession
 *
 * Framework-free lifecycle for one student achievement entry backed by the single system of
 * record (student_portfolio_records via the /portfolio endpoints).
 *
 * Invariants:
 * - No backend record is created until it is needed (first evidence upload or first save).
 * - Evidence comes first: a draft may be created before a category is chosen (unclassified draft).
 * - Exactly one record per session: every later call reuses the same record id.
 * - A failed save stops submission; nothing reports success unless the backend accepted it.
 * - Status, reviewer, and scoring are never sent; the backend owns them.
 */

export const EDITABLE_STATUSES = ['draft', 'revision_requested']
export const ACCEPTED_EVIDENCE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const blankToNull = value => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

export function parseStructuredMetadata(value) {
  if (!value) return { schema_version: '1.0' }
  if (typeof value === 'object') return { schema_version: '1.0', ...value }
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? { schema_version: '1.0', ...parsed } : { schema_version: '1.0' }
  } catch {
    return { schema_version: '1.0' }
  }
}

/** Builds the /portfolio create/update payload using only real student_portfolio_records columns. */
export function buildRecordPayload({ formData = {}, categoryId, subcategoryId, structuredMetadata = {} }) {
  const startDate = blankToNull(formData.start_date)
  return {
    title: String(formData.title || '').trim(),
    organizer_or_body: blankToNull(formData.organizer_or_body),
    start_date: startDate,
    occurrence_date: startDate,
    end_date: blankToNull(formData.end_date),
    description: blankToNull(formData.description),
    category_id: blankToNull(categoryId),
    subcategory_id: blankToNull(subcategoryId),
    structured_metadata: { ...structuredMetadata, schema_version: '1.0' }
  }
}

/** Normalizes an API rejection ({ error: { code, message, errors } }) into a stable shape. */
export function toApiError(error, fallbackMessage = 'The request could not be completed.') {
  const body = error?.error || error?.data?.error || null
  const code = body?.code || error?.code || 'REQUEST_FAILED'
  const message = body?.message || error?.message || fallbackMessage
  const fieldErrors = {}
  const raw = body?.errors && typeof body.errors === 'object' ? body.errors : {}
  Object.entries(raw).forEach(([key, value]) => {
    const text = Array.isArray(value) ? value[0] : String(value)
    fieldErrors[key] = text
    if (key.startsWith('structured_metadata.')) fieldErrors[key.slice('structured_metadata.'.length)] = text
  })
  const normalized = new Error(message)
  normalized.code = code
  normalized.fieldErrors = fieldErrors
  return normalized
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

/**
 * Converts an OCR date to YYYY-MM-DD only when it is unambiguous:
 * "2026-05-28", "May 28, 2026", "28 May 2026" (full or 3-letter month names).
 * Numeric forms such as 05/06/2026 are ambiguous (day vs month) and return null.
 */
export function parseOcrDate(value) {
  const text = String(value || '').trim().replace(/\s+/g, ' ')
  if (DATE_PATTERN.test(text)) return text
  const monthIndex = name => MONTHS.findIndex(month => month === name.toLowerCase() || (name.length === 3 && month.startsWith(name.toLowerCase())))
  const build = (year, month, day) => {
    if (month < 0 || day < 1 || day > 31) return null
    const date = new Date(Date.UTC(year, month, day))
    if (date.getUTCMonth() !== month || date.getUTCDate() !== day) return null
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  let match = text.match(/^([A-Za-z]+)\.? (\d{1,2}), (\d{4})$/)
  if (match) return build(Number(match[3]), monthIndex(match[1]), Number(match[2]))
  match = text.match(/^(\d{1,2}) ([A-Za-z]+)\.?,? (\d{4})$/)
  if (match) return build(Number(match[3]), monthIndex(match[2]), Number(match[1]))
  return null
}

/**
 * Applies advisory OCR suggestions only to fields the student has not touched and that are empty.
 * start_date is filled only when the OCR date converts unambiguously (see parseOcrDate).
 */
export function applyOcrSuggestions(formData, suggestions = [], touched = {}) {
  const next = { ...formData }
  const applied = {}
  const map = { activity_title: 'title', organizer_granting_body: 'organizer_or_body', start_date_raw: 'start_date' }
  suggestions.forEach(item => {
    const field = map[item?.key]
    let value = String(item?.value || '').trim()
    if (!field || !value || touched[field] || String(next[field] || '').trim() !== '') return
    if (field === 'start_date') {
      value = parseOcrDate(value)
      if (!value) return
    }
    next[field] = value
    applied[field] = true
  })
  return { formData: next, applied }
}

const normalizeText = value => String(value ?? '').trim().replace(/[\u2012-\u2015]/g, '-').replace(/\s+/g, ' ').toLowerCase()

/**
 * Fills category-specific details from OCR suggestions whose key equals the field key
 * (organization_name, position_title, academic_year). Only empty fields are filled.
 * Dropdowns are never guessed: a select is filled only when the OCR text is exactly one of its
 * options (label or value, ignoring case, spacing and dash style). position_level is tried against
 * the certificate's role text with the same exact rule. Anything else stays blank for the student.
 */
export function applyOcrToDetails(metadata = {}, suggestions = [], fields = []) {
  const next = { ...metadata }
  const applied = {}
  const byKey = {}
  suggestions.forEach(item => { if (item?.key && item.value && byKey[item.key] === undefined) byKey[item.key] = String(item.value).trim() })
  fields.forEach(field => {
    if (!field?.key || ![undefined, null, ''].includes(next[field.key])) return
    const candidates = field.key === 'position_level' ? [byKey.position_level, byKey.position_title] : [byKey[field.key]]
    for (const candidate of candidates) {
      if (!candidate) continue
      if (field.type === 'select') {
        const option = (field.options || []).find(item => normalizeText(item.label) === normalizeText(candidate) || normalizeText(item.value) === normalizeText(candidate))
        if (!option) continue
        next[field.key] = option.value
      } else if (['text', 'textarea', undefined].includes(field.type)) {
        next[field.key] = candidate
      } else {
        continue
      }
      applied[field.key] = true
      break
    }
  })
  return { metadata: next, applied }
}

export function validateEvidenceFile(file) {
  if (!file) return 'Choose a file to upload.'
  if (!ACCEPTED_EVIDENCE_TYPES.includes(file.type)) return 'Only PDF, JPEG, or PNG files are accepted.'
  if (file.size > MAX_EVIDENCE_BYTES) return 'The file is larger than 10 MiB.'
  return null
}

/** Client-side completeness check mirroring resubmitRecord(); the backend remains authoritative. */
export function validateForSubmit({ formData = {}, categoryId, subcategoryId, structuredMetadata = {}, schemaFields = [], evidence = [] }) {
  const errors = {}
  if (String(formData.title || '').trim().length < 3) errors.title = 'Title is required (minimum 3 characters).'
  if (String(formData.organizer_or_body || '').trim().length < 2) errors.organizer_or_body = 'Organizer / Issuing Body is required.'
  if (!formData.start_date) errors.start_date = 'Start date is required.'
  if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) errors.end_date = 'End date cannot be before start date.'
  if (!categoryId) errors.category_id = 'Category is required.'
  if (!subcategoryId) errors.subcategory_id = 'Subcategory is required.'
  schemaFields.forEach(field => {
    const visible = !field.visibility || structuredMetadata[field.visibility.field] === field.visibility.equals
    if (visible && field.required && [undefined, null, ''].includes(structuredMetadata[field.key])) {
      errors[field.key] = `${field.label} is required.`
    }
  })
  const clean = evidence.some(item => item.status === 'active' && item.security_status === 'clean')
  if (!clean) errors.evidence = 'Upload at least one evidence file that passed the security check.'
  return errors
}

export class StudentAchievementDraftSession {
  constructor(service, { recordId = null, status = null } = {}) {
    if (!service) throw new Error('A portfolio service is required.')
    this.service = service
    this.recordId = recordId
    this.status = status
    this.creating = null
  }

  get isEditable() {
    return this.recordId === null || EDITABLE_STATUSES.includes(this.status)
  }

  async load(recordId) {
    try {
      const result = await this.service.fetchRecord(recordId)
      const record = result?.record || null
      if (!record) throw new Error('The achievement could not be loaded.')
      this.recordId = record.id
      this.status = record.status
      return { record, evidence: result.evidence || [], events: result.events || [] }
    } catch (error) {
      throw toApiError(error, 'The achievement could not be loaded.')
    }
  }

  /** Creates the draft on first need (a category is not required yet). Concurrent callers share one creation request. */
  async ensureDraft(payload) {
    if (this.recordId) return this.recordId
    if (!this.creating) {
      this.creating = this.service.createRecord({ ...payload, submit_now: false })
        .then(result => {
          const id = result?.id || result?.data?.id
          if (!id) throw new Error('The server did not return the new record id.')
          this.recordId = id
          this.status = result?.status || result?.data?.status || 'draft'
          return id
        })
        .catch(error => { throw toApiError(error, 'The draft could not be created.') })
        .finally(() => { this.creating = null })
    }
    return this.creating
  }

  async save(payload) {
    this.assertEditable()
    if (!this.recordId) return this.ensureDraft(payload)
    try {
      await this.service.updateRecord(this.recordId, payload)
      return this.recordId
    } catch (error) {
      throw toApiError(error, 'The draft could not be saved.')
    }
  }

  async uploadEvidence(file, payload) {
    this.assertEditable()
    const problem = validateEvidenceFile(file)
    if (problem) {
      const error = new Error(problem)
      error.code = 'INVALID_EVIDENCE_FILE'
      throw error
    }
    const id = await this.ensureDraft(payload)
    const form = new FormData()
    form.append('file', file)
    form.append('evidence_type', 'certificate')
    let uploaded
    try {
      uploaded = await this.service.addEvidence(id, form)
    } catch (error) {
      throw toApiError(error, 'Evidence could not be uploaded.')
    }
    const evidence = uploaded?.evidence || uploaded?.data?.evidence
    if (!evidence?.id) throw new Error('The server did not confirm the uploaded evidence.')
    return evidence
  }

  /** Scan failures are reported as data, never as upload failures. */
  async scanEvidence(evidenceId) {
    try {
      const result = await this.service.scanEvidence(this.recordId, evidenceId)
      return { ok: true, scan: result?.scan || null, evidence: result?.evidence || null }
    } catch (error) {
      return { ok: false, error: toApiError(error, 'The security check could not run.') }
    }
  }

  /** Advisory OCR for clean evidence. Failures are data; manual entry always remains possible. */
  async readEvidence(evidenceId) {
    try {
      const result = await this.service.readEvidence(this.recordId, evidenceId)
      return { ok: Boolean(result?.ocr), ocr: result?.ocr || null, ocrError: result?.ocr_error || null }
    } catch (error) {
      return { ok: false, ocr: null, error: toApiError(error, 'Reading the document was unavailable.') }
    }
  }

  async removeEvidence(evidenceId) {
    this.assertEditable()
    try {
      await this.service.removeEvidence(this.recordId, evidenceId)
    } catch (error) {
      throw toApiError(error, 'The evidence could not be removed.')
    }
  }

  async refreshEvidence() {
    if (!this.recordId) return []
    const { evidence } = await this.load(this.recordId)
    return evidence
  }

  /** Saves first; a failed save stops submission. */
  async submit(payload) {
    await this.save(payload)
    try {
      const result = await this.service.resubmitRecord(this.recordId)
      this.status = result?.status || result?.data?.status || 'submitted'
      return result
    } catch (error) {
      throw toApiError(error, 'The achievement could not be submitted.')
    }
  }

  assertEditable() {
    if (!this.isEditable) {
      const error = new Error('This achievement can no longer be edited.')
      error.code = 'RECORD_NOT_EDITABLE'
      throw error
    }
  }
}

export default StudentAchievementDraftSession
