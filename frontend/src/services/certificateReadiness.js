import certificateService from './certificateService'

export const CERTIFICATE_PURPOSE_LABELS = {
  PARTICIPATION: 'Certificate of Participation',
  COMPLETION: 'Certificate of Completion',
  APPRECIATION: 'Certificate of Appreciation',
  RECOGNITION: 'Certificate of Recognition'
}

export const CERTIFICATE_BLOCKING_REASON_MESSAGES = {
  SOURCE_RECORD_NOT_FOUND: 'The source record could not be found.',
  SOURCE_RECORD_NOT_VERIFIED: 'The source record has not been verified.',
  PURPOSE_INCOMPATIBLE: 'This record does not qualify for the requested certificate purpose.',
  STRUCTURED_STATE_INCOMPATIBLE: 'The verified record does not contain the required certificate-eligible state.',
  REQUIRED_SEMANTIC_DATA_MISSING: 'Required verified achievement information is incomplete.',
  MISSING_PUBLISHED_TEMPLATE: 'A published compatible certificate template is not available.',
  TEMPLATE_PURPOSE_MISMATCH: 'The available template does not match the certificate purpose.',
  TEMPLATE_CAPABILITY_MISMATCH: 'The available template does not support the required certificate data.',
  UNKNOWN_TEMPLATE_PLACEHOLDER: 'The selected template contains an unsupported placeholder.',
  REQUIRED_CERTIFICATE_DATA_MISSING: 'Required certificate information is incomplete.',
  REQUIRED_PLACEHOLDER_UNRESOLVED: 'Required certificate content could not be resolved.',
  REQUIRED_SIGNATORY_UNAVAILABLE: 'A required authorized signatory is unavailable.',
  SIGNATORY_NOT_AUTHORIZED: 'A configured signatory is not authorized for this certificate.',
  SIGNATURE_ASSET_UNAVAILABLE: 'A required approved signature is unavailable.',
  CURRENT_CERTIFICATE_ALREADY_EXISTS: 'A current certificate has already been issued for this record.',
  REISSUE_REQUIRED: 'This certificate must use the controlled reissue workflow.'
}

export const CERTIFICATE_ISSUANCE_ERROR_MESSAGES = {
  READINESS_CHANGED: 'Certificate readiness changed. Review the updated status before trying again.',
  CURRENT_CERTIFICATE_ALREADY_EXISTS: 'A current certificate has already been issued for this record.',
  UNAUTHORIZED_CERTIFICATE_ISSUANCE: 'You are not authorized to issue this certificate for the source event.',
  FORBIDDEN: 'You do not have permission to issue this certificate.',
  SOURCE_RECORD_NOT_FOUND: 'The verified source record is no longer available.',
  SOURCE_RECORD_NOT_VERIFIED: 'The source record is no longer verified.',
  RECIPIENT_MUST_BE_STUDENT: 'Certificate issuance is limited to student recipients.',
  MISSING_PUBLISHED_TEMPLATE: 'A compatible published template is no longer available.',
  REQUIRED_CERTIFICATE_DATA_MISSING: 'Required certificate information is incomplete.',
  REQUIRED_SIGNATORY_UNAVAILABLE: 'A required authorized signatory is unavailable.',
  IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST: 'This issuance request conflicts with an earlier request. Refresh the certificate status.',
  IDEMPOTENCY_REQUEST_IN_PROGRESS: 'The original issuance request is still being processed. Retry safely in a moment.',
  ISSUANCE_TRANSACTION_FAILED: 'The certificate could not be issued. No partial issuance was saved.'
}

const VALID_READINESS = new Set(['NOT_ELIGIBLE', 'ELIGIBLE_NOT_ISSUABLE', 'ISSUABLE'])

export function createCertificateIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return `certificate-${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`
  }
  return `certificate-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function firstValue(record, keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== '') return record[key]
  }
  return null
}

export function getEventCertificateSources(event = {}) {
  const collections = [event.certificateCandidates, event.certificate_candidates, event.sourceRecords, event.source_records]
  const records = collections.find(Array.isArray)

  if (records) return records

  const ids = event.sourceRecordIds || event.source_record_ids
  if (Array.isArray(ids)) return ids.map(id => ({ sourceRecordId: id }))

  const singleId = firstValue(event, ['sourceRecordId', 'source_record_id'])
  return singleId ? [{ sourceRecordId: singleId }] : []
}

export function normalizeTemplate(template) {
  if (!template || typeof template !== 'object') return null
  const versionId = firstValue(template, ['template_version_id', 'versionId', 'id'])
  if (!versionId) return null

  return {
    id: firstValue(template, ['template_family_id', 'familyId', 'id']),
    versionId,
    name: firstValue(template, ['name', 'title', 'code']) || 'Compatible certificate template',
    code: firstValue(template, ['code']),
    version: firstValue(template, ['version_number', 'version']),
    certificatePurpose: firstValue(template, ['certificate_purpose', 'certificatePurpose']),
    placeholderContract: template.placeholder_contract || template.placeholderContract || [],
    signatorySlots: template.signatory_slots || template.signatorySlots || []
  }
}

export function normalizeCertificateReadiness(candidate, readiness, template = null) {
  if (!readiness || !VALID_READINESS.has(readiness.status) || !Array.isArray(readiness.blocking_reasons)) {
    throw new Error('Certificate readiness response is malformed.')
  }

  const sourceRecordId = firstValue(candidate, ['sourceRecordId', 'source_record_id', 'id'])
  const studentId = firstValue(candidate, ['studentId', 'student_id', 'studentProfileId', 'student_profile_id'])
  if (!sourceRecordId || !studentId) throw new Error('Certificate recipient context is incomplete.')

  const blockingReasons = readiness.blocking_reasons.map(code => ({
    code,
    message: CERTIFICATE_BLOCKING_REASON_MESSAGES[code] || 'This certificate is currently not ready for issuance.'
  }))
  const alreadyIssued = blockingReasons.some(reason => reason.code === 'CURRENT_CERTIFICATE_ALREADY_EXISTS')
  const backendCertificate = readiness.existing_certificate || candidate.existingCertificate || candidate.existing_certificate

  return {
    studentId,
    studentName: firstValue(candidate, ['studentName', 'student_name', 'fullName', 'full_name', 'name']) || 'Student recipient',
    studentNumber: firstValue(candidate, ['studentNumber', 'student_number', 'institutionalId', 'institutional_id']),
    program: firstValue(candidate, ['program', 'programName', 'program_name']),
    sourceRecord: {
      id: sourceRecordId,
      category: firstValue(candidate, ['category', 'categoryName', 'category_name']),
      subcategory: firstValue(candidate, ['subcategory', 'subcategoryName', 'subcategory_name']),
      title: firstValue(candidate, ['sourceTitle', 'source_title', 'title']) || 'Verified source record'
    },
    certificatePurpose: readiness.certificate_purpose || null,
    readinessStatus: readiness.status,
    blockingReasons,
    existingCertificate: alreadyIssued ? (backendCertificate || { status: 'ISSUED' }) : null,
    template: normalizeTemplate(template),
    compatibleTemplates: []
  }
}

export async function loadCertificateReadinessForEvent(event, { signal, service = certificateService } = {}) {
  if (!event?.id) throw new Error('Event identity is required to load certificate candidates.')
  const candidates = await service.getEventCertificateCandidates(event.id, { signal })

  return Promise.all(candidates.map(async candidate => {
    const sourceRecordId = firstValue(candidate, ['sourceRecordId', 'source_record_id', 'id'])
    const signatories = candidate.signatories || {}
    const initial = await service.getReadiness({ source_record_id: sourceRecordId, signatories }, { signal })
    let templates = []
    let selectedTemplate = null
    let readiness = initial

    if (initial?.certificate_purpose) {
      templates = (await service.getTemplates(initial.certificate_purpose, { signal })).map(normalizeTemplate).filter(Boolean)
      selectedTemplate = templates[0] || null
      if (selectedTemplate) {
        readiness = await service.getReadiness({
          source_record_id: sourceRecordId,
          template_version_id: selectedTemplate.versionId,
          signatories
        }, { signal })
      }
    }

    const normalized = normalizeCertificateReadiness(candidate, readiness, selectedTemplate)
    normalized.compatibleTemplates = templates
    normalized.signatories = signatories
    return normalized
  }))
}

export function certificateReadinessErrorMessage(error) {
  const code = error?.error?.code || error?.code
  if (code === 'UNAUTHORIZED') return 'Your session has expired. Sign in again to review certificate readiness.'
  if (code === 'FORBIDDEN') return 'You do not have permission to review certificate readiness for this event.'
  return 'Certificate eligibility could not be loaded.'
}

export function certificateIssuanceError(error) {
  const code = error?.error?.code || error?.code || 'ISSUANCE_TRANSACTION_FAILED'
  const ambiguous = Boolean(error?.isNetworkError || ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(code))
  return {
    code,
    ambiguous,
    message: ambiguous
      ? 'The issuance result could not be confirmed. Retry safely with the same request key.'
      : CERTIFICATE_ISSUANCE_ERROR_MESSAGES[code] || error?.error?.message || 'The certificate could not be issued. No partial issuance was saved.'
  }
}

export function normalizeIssuedCertificate(result) {
  const certificate = result?.certificate
  if (!certificate?.id || !certificate?.certificate_number || !certificate?.public_verification_id) {
    throw new Error('Certificate issuance response is malformed.')
  }
  return {
    id: certificate.id,
    certificateNumber: certificate.certificate_number,
    publicVerificationId: certificate.public_verification_id,
    verificationUrl: certificate.verification_url || null,
    certificatePurpose: certificate.certificate_purpose || null,
    issuedAt: certificate.issued_at || null,
    studentId: certificate.student_id || null,
    sourceRecordId: certificate.source_record_id || null,
    templateVersionId: certificate.template_version_id || null,
    status: certificate.status || result.status || 'ISSUED',
    alreadyIssued: result.status === 'ALREADY_ISSUED'
  }
}
