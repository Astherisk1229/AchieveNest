/**
 * IssuedCertificateModel.js
 * Domain model for Issued Certificates.
 * Stores immutable render snapshots, signatory snapshots, unique certificate numbers, and status.
 */

export class IssuedCertificateModel {
  #id
  #certificateNumber
  #recipientId
  #recipientName
  #sourceType // 'award' | 'event'
  #sourceId
  #sourceTitle
  #templateFamilyId
  #templateVersionId
  #renderSnapshot
  #signatorySnapshot
  #issuedBy
  #issuedAt
  #status // 'issued' | 'revoked' | 'superseded'
  #verificationCode
  #verificationUrl
  #revokedAt
  #revokedBy
  #revocationReason

  constructor(data = {}) {
    this.#id = data.id || `cert-inst-${Date.now()}`
    this.#certificateNumber = data.certificateNumber || `NDMU-CERT-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`
    this.#recipientId = data.recipientId || ''
    this.#recipientName = data.recipientName || 'Student Recipient'
    this.#sourceType = data.sourceType === 'award' ? 'award' : 'event'
    this.#sourceId = data.sourceId || ''
    this.#sourceTitle = data.sourceTitle || 'NDMU Institutional Activity'
    this.#templateFamilyId = data.templateFamilyId || ''
    this.#templateVersionId = data.templateVersionId || ''
    
    this.#renderSnapshot = data.renderSnapshot || {
      heading: 'OFFICIAL CERTIFICATE',
      body: 'Presented for outstanding merit.',
      recipientName: this.#recipientName
    }

    this.#signatorySnapshot = Array.isArray(data.signatorySnapshot) ? data.signatorySnapshot : []
    this.#issuedBy = data.issuedBy || 'OSAD System'
    this.#issuedAt = data.issuedAt || new Date().toISOString()
    this.#status = ['issued', 'revoked', 'superseded'].includes(data.status) ? data.status : 'issued'
    this.#verificationCode = data.verificationCode || `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    this.#verificationUrl = data.verificationUrl || `https://ndmu.edu.ph/verify/${this.#verificationCode}`
    this.#revokedAt = data.revokedAt || null
    this.#revokedBy = data.revokedBy || null
    this.#revocationReason = data.revocationReason || null
  }

  get id() { return this.#id }
  get certificateNumber() { return this.#certificateNumber }
  get recipientId() { return this.#recipientId }
  get recipientName() { return this.#recipientName }
  get sourceType() { return this.#sourceType }
  get sourceId() { return this.#sourceId }
  get sourceTitle() { return this.#sourceTitle }
  get templateFamilyId() { return this.#templateFamilyId }
  get templateVersionId() { return this.#templateVersionId }
  get renderSnapshot() { return { ...this.#renderSnapshot } }
  get signatorySnapshot() { return [...this.#signatorySnapshot] }
  get issuedBy() { return this.#issuedBy }
  get issuedAt() { return this.#issuedAt }
  get status() { return this.#status }
  get verificationCode() { return this.#verificationCode }
  get verificationUrl() { return this.#verificationUrl }

  revoke(revokedBy, reason) {
    if (this.#status === 'revoked') return
    this.#status = 'revoked'
    this.#revokedAt = new Date().toISOString()
    this.#revokedBy = revokedBy
    this.#revocationReason = reason
  }

  toJSON() {
    return {
      id: this.#id,
      certificateNumber: this.#certificateNumber,
      recipientId: this.#recipientId,
      recipientName: this.#recipientName,
      sourceType: this.#sourceType,
      sourceId: this.#sourceId,
      sourceTitle: this.#sourceTitle,
      templateFamilyId: this.#templateFamilyId,
      templateVersionId: this.#templateVersionId,
      renderSnapshot: this.#renderSnapshot,
      signatorySnapshot: this.#signatorySnapshot,
      issuedBy: this.#issuedBy,
      issuedAt: this.#issuedAt,
      status: this.#status,
      verificationCode: this.#verificationCode,
      verificationUrl: this.#verificationUrl,
      revokedAt: this.#revokedAt,
      revokedBy: this.#revokedBy,
      revocationReason: this.#revocationReason
    }
  }
}

export default IssuedCertificateModel
