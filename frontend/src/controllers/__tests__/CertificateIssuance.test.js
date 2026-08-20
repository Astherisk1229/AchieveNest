/**
 * CertificateIssuance.test.js
 * Unit Test Suite for CertificateIssuanceController.
 */

import { describe, it, expect } from 'vitest'
import CertificateIssuanceController from '../CertificateIssuanceController'

describe('CertificateIssuanceController', () => {

  it('fetches published OSAD templates and approved signatories', () => {
    const templates = CertificateIssuanceController.getPublishedTemplates()
    const signatories = CertificateIssuanceController.getApprovedSignatories()

    expect(templates.length).toBeGreaterThan(0)
    expect(templates[0].status).toBe('published')
    expect(signatories.length).toBeGreaterThan(0)
  })

  it('resolves recipient eligibility for an event (separating eligible vs excluded)', () => {
    const eligibility = CertificateIssuanceController.getRecipientEligibility('evt-1')

    expect(eligibility.eventId).toBe('evt-1')
    expect(eligibility.eligibleCount).toBeGreaterThan(0)
    expect(eligibility.excludedCount).toBeGreaterThan(0)
    expect(eligibility.totalCount).toBe(eligibility.eligibleCount + eligibility.excludedCount)
  })

  it('executes bulk certificate issuance and enforces idempotency key', () => {
    const idempotencyKey = `test_key_${Date.now()}`
    const recipients = [
      { id: 'std-01', studentId: '2022-0142', name: 'Alex Rivera' },
      { id: 'std-02', studentId: '2022-0189', name: 'Samantha Gomez' }
    ]

    // 1st Issuance Request
    const res1 = CertificateIssuanceController.issueCertificateBatch({
      eventId: 'evt-1',
      eventTitle: 'Computer Society Tech Summit 2026',
      organizationId: 'org-cs',
      organizationName: 'Computer Society NDMU',
      templateId: 'tpl-workshop-01',
      signatories: {},
      recipients,
      idempotencyKey,
      issuedBy: 'Dr. Maria Santos'
    })

    expect(res1.success).toBe(true)
    expect(res1.isIdempotent).toBe(false)
    expect(res1.batch.recipientCount).toBe(2)
    expect(res1.issuedCertificates.length).toBe(2)

    // 2nd Duplicate Request (same idempotencyKey)
    const res2 = CertificateIssuanceController.issueCertificateBatch({
      eventId: 'evt-1',
      eventTitle: 'Computer Society Tech Summit 2026',
      organizationId: 'org-cs',
      organizationName: 'Computer Society NDMU',
      templateId: 'tpl-workshop-01',
      signatories: {},
      recipients,
      idempotencyKey,
      issuedBy: 'Dr. Maria Santos'
    })

    expect(res2.success).toBe(true)
    expect(res2.isIdempotent).toBe(true)
    expect(res2.batch.id).toBe(res1.batch.id)
  })

  it('retrieves public certificate verification records and supports revocation', () => {
    // Fetch initial sample certificate
    const cert = CertificateIssuanceController.getPublicCertificate('VER-NDMU-2026-849201')
    expect(cert).not.toBeNull()
    expect(cert.status).toBe('ACTIVE')

    // Revoke certificate
    const revokeRes = CertificateIssuanceController.revokeCertificate('VER-NDMU-2026-849201', 'Test administrative revocation')
    expect(revokeRes.success).toBe(true)
    expect(revokeRes.certificate.status).toBe('REVOKED')
  })

})
