import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const modal = readFileSync(new URL('../../pages/personnel/organization-moderator/certificates/modals/IssueCertificatesModal.jsx', import.meta.url), 'utf8')
const recipientReview = readFileSync(new URL('../../pages/personnel/organization-moderator/certificates/modals/CertificateRecipientReview.jsx', import.meta.url), 'utf8')
const preview = readFileSync(new URL('../../pages/personnel/organization-moderator/certificates/modals/CertificateIssuancePreview.jsx', import.meta.url), 'utf8')

describe('organization moderator certificate readiness integration', () => {
  it('uses the backend integration and never the legacy mock eligibility method', () => {
    expect(modal).toContain('loadCertificateReadinessForEvent')
    expect(modal).not.toContain('getRecipientEligibility')
    expect(modal).not.toContain('issueCertificateBatch')
  })

  it('guards against stale requests and exposes loading, error, retry, and empty states', () => {
    expect(modal).toContain('new AbortController()')
    expect(modal).toContain('activeVersion !== requestVersion.current')
    expect(modal).toContain('Evaluating certificate eligibility…')
    expect(modal).toContain('No mock eligibility data has been substituted.')
    expect(modal).toContain('Retry')
    expect(modal).toContain('No certificate candidates were found for this event.')
  })

  it('renders all authoritative readiness states and existing-certificate handling', () => {
    expect(recipientReview).toContain('No Certificate Applicable')
    expect(recipientReview).toContain('Eligible — Not Ready')
    expect(recipientReview).toContain("label: 'Ready'")
    expect(recipientReview).toContain('Already issued.')
  })

  it('keeps preview unofficial until backend issuance succeeds', () => {
    expect(preview).toContain('UNOFFICIAL PREVIEW')
    expect(preview).not.toContain('Math.random')
    expect(modal).toContain('certificateService.issueCertificate')
    expect(modal).toContain("selectedRecipient?.readinessStatus !== 'ISSUABLE'")
    expect(modal).toContain('Issuing certificate…')
    expect(modal).toContain('Retry safely')
    expect(preview).toContain('Certificate issued')
    expect(preview).toContain('issuedCertificate.verificationUrl')
  })

  it('keeps migrated issuance backend-only and guards stale request results', () => {
    expect(modal).not.toContain('issueCertificateBatch')
    expect(modal).not.toContain('localStorage')
    expect(modal).toContain('activeVersion !== issuanceRequestVersion.current')
    expect(modal).toContain('issuanceAttempt.current.idempotencyKey')
    expect(modal).toContain('refreshReadiness()')
  })
})
