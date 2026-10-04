import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../PublicCertificateVerificationPage.jsx', import.meta.url), 'utf8')

describe('Public certificate verification page (wiring remediation, Phase 3)', () => {
  it('verifies against the backend registry, not browser storage', () => {
    expect(source).toContain('certificateService')
    expect(source).toContain('.verify(publicId)')
    expect(source).not.toContain('CertificateIssuanceController')
    expect(source).not.toContain('getPublicCertificate')
    expect(source).not.toContain('localStorage')
  })

  it('renders every backend certificate status and never defaults to verified', () => {
    for (const status of ['ISSUED', 'REVOKED', 'SUPERSEDED']) expect(source).toContain(status)
    // an unknown status falls back to the invalid view, not the valid one
    expect(source).toContain('STATUS_VIEW[cert.status] || STATUS_VIEW.REVOKED')
  })

  it('has loading, not-found and registry-unreachable states tied to the request', () => {
    expect(source).toContain("phase === 'loading'")
    expect(source).toContain("phase === 'notFound'")
    expect(source).toContain("phase === 'error'")
    expect(source).toContain('CERTIFICATE_NOT_FOUND')
  })

  it('shows only fields the public endpoint returns and none it withholds', () => {
    for (const field of ['recipient_name', 'certificate_number', 'issuer_name', 'issued_at', 'certificate_purpose'])
      expect(source).toContain(`cert.${field}`)
    for (const withheld of ['student_id', 'studentId', 'cert.studentName', 'organizationName'])
      expect(source).not.toContain(withheld)
  })
})
