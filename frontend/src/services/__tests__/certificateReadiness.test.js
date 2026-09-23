import { describe, expect, it, vi } from 'vitest'
import {
  CERTIFICATE_BLOCKING_REASON_MESSAGES,
  certificateIssuanceError,
  getEventCertificateSources,
  loadCertificateReadinessForEvent,
  normalizeCertificateReadiness,
  normalizeIssuedCertificate
} from '../certificateReadiness'

const candidate = {
  source_record_id: 'source-1',
  student_id: 'student-1',
  student_name: 'Alexandria Very Long Student Name',
  student_number: '2026-0001',
  title: 'Verified Community Leadership Activity'
}

describe('certificate readiness presentation boundary', () => {
  it('normalizes official backend issuance identity without inventing fields', () => {
    expect(normalizeIssuedCertificate({ status: 'ISSUED', certificate: {
      id: 'certificate-1', certificate_number: 'AN-2026-000001', public_verification_id: 'public-1',
      verification_url: '/verify/certificate/public-1', certificate_purpose: 'APPRECIATION', issued_at: '2026-09-21 20:00:00'
    }})).toMatchObject({ certificateNumber: 'AN-2026-000001', publicVerificationId: 'public-1', verificationUrl: '/verify/certificate/public-1', alreadyIssued: false })
  })

  it('distinguishes ambiguous network outcomes so retries can reuse the same key', () => {
    expect(certificateIssuanceError({ code: 'ERR_NETWORK', isNetworkError: true })).toMatchObject({ ambiguous: true })
    expect(certificateIssuanceError({ error: { code: 'READINESS_CHANGED' } })).toMatchObject({ ambiguous: false, code: 'READINESS_CHANGED' })
  })
  it.each([
    ['ISSUABLE', 'Ready'],
    ['NOT_ELIGIBLE', 'No Certificate Applicable'],
    ['ELIGIBLE_NOT_ISSUABLE', 'Eligible — Not Ready']
  ])('preserves backend status %s without deriving eligibility', (status) => {
    const result = normalizeCertificateReadiness(candidate, {
      status,
      certificate_purpose: status === 'NOT_ELIGIBLE' ? null : 'COMPLETION',
      blocking_reasons: []
    })
    expect(result.readinessStatus).toBe(status)
  })

  it('maps multiple blockers while preserving their machine codes', () => {
    const result = normalizeCertificateReadiness(candidate, {
      status: 'ELIGIBLE_NOT_ISSUABLE',
      certificate_purpose: 'COMPLETION',
      blocking_reasons: ['MISSING_PUBLISHED_TEMPLATE', 'REQUIRED_SIGNATORY_UNAVAILABLE']
    })
    expect(result.blockingReasons).toEqual([
      { code: 'MISSING_PUBLISHED_TEMPLATE', message: CERTIFICATE_BLOCKING_REASON_MESSAGES.MISSING_PUBLISHED_TEMPLATE },
      { code: 'REQUIRED_SIGNATORY_UNAVAILABLE', message: CERTIFICATE_BLOCKING_REASON_MESSAGES.REQUIRED_SIGNATORY_UNAVAILABLE }
    ])
  })

  it('marks an existing certificate without treating it as a new candidate', () => {
    const result = normalizeCertificateReadiness(candidate, {
      status: 'ELIGIBLE_NOT_ISSUABLE',
      certificate_purpose: 'RECOGNITION',
      blocking_reasons: ['CURRENT_CERTIFICATE_ALREADY_EXISTS']
    })
    expect(result.existingCertificate).toEqual({ status: 'ISSUED' })
  })

  it('fails closed on malformed readiness instead of defaulting to issuable', () => {
    expect(() => normalizeCertificateReadiness(candidate, { certificate_purpose: 'COMPLETION' }))
      .toThrow('Certificate readiness response is malformed.')
  })

  it('accepts explicit event source records and returns an empty list when none exist', () => {
    expect(getEventCertificateSources({ certificate_candidates: [candidate] })).toEqual([candidate])
    expect(getEventCertificateSources({ id: 'event-without-sources' })).toEqual([])
  })

  it('uses backend readiness, purpose, and compatible templates for each source record', async () => {
    const service = {
      getEventCertificateCandidates: vi.fn().mockResolvedValue([candidate]),
      getReadiness: vi.fn()
        .mockResolvedValueOnce({ status: 'ELIGIBLE_NOT_ISSUABLE', certificate_purpose: 'COMPLETION', blocking_reasons: ['MISSING_PUBLISHED_TEMPLATE'] })
        .mockResolvedValueOnce({ status: 'ISSUABLE', certificate_purpose: 'COMPLETION', blocking_reasons: [] }),
      getTemplates: vi.fn().mockResolvedValue([{ id: 'template-version-1', name: 'Completion Template', certificate_purpose: 'COMPLETION' }])
    }

    const results = await loadCertificateReadinessForEvent({ id: 'event-1' }, { service })
    expect(results[0].readinessStatus).toBe('ISSUABLE')
    expect(results[0].certificatePurpose).toBe('COMPLETION')
    expect(results[0].template.versionId).toBe('template-version-1')
    expect(service.getReadiness).toHaveBeenCalledTimes(2)
    expect(service.getEventCertificateCandidates).toHaveBeenCalledWith('event-1', { signal: undefined })
  })

  it('never falls back to source records embedded in the event object', async () => {
    const service = { getEventCertificateCandidates: vi.fn().mockResolvedValue([]) }
    const results = await loadCertificateReadinessForEvent({ id: 'event-1', certificateCandidates: [candidate] }, { service })
    expect(results).toEqual([])
  })
})
