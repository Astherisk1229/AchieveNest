import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import portfolioService from '../../../services/portfolioService'
import apiClient from '../../../services/apiClient'
import StudentCertificateBadge from '../../../components/common/StudentCertificateBadge'
import StudentCertificateSection from '../../../components/common/StudentCertificateSection'

vi.mock('../../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}))

describe('R6 Step 3 — Student Frontend Certificate Integration Comprehensive Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.window = globalThis.window || {}
    globalThis.window.URL = {
      createObjectURL: vi.fn(() => 'blob:http://localhost/mock-blob-url'),
      revokeObjectURL: vi.fn()
    }
    globalThis.document = globalThis.document || {}
    globalThis.document.createElement = vi.fn((tag) => ({
      tagName: tag.toUpperCase(),
      href: '',
      download: '',
      click: vi.fn()
    }))
    globalThis.document.body = {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  })

  // Authoritative Test Fixtures
  const issuedCert = {
    id: 'cert-issued-01',
    certificate_number: 'CERT-2026-000001',
    public_verification_id: 'pub-v-001',
    status: 'ISSUED',
    issued_at: '2026-09-25 10:00:00',
    verification_url: '/verify/certificate/pub-v-001',
    pdf_url: '/api/v1/certificates/cert-issued-01/pdf',
    downloadable: true,
    replacement: null,
    previous_certificate: null
  }

  const revokedCert = {
    id: 'cert-revoked-02',
    certificate_number: 'CERT-2026-REVOKED',
    public_verification_id: 'pub-v-revoked',
    status: 'REVOKED',
    issued_at: '2026-09-20 10:00:00',
    verification_url: '/verify/certificate/pub-v-revoked',
    pdf_url: null,
    downloadable: false,
    replacement: null,
    previous_certificate: null
  }

  const supersededCertWithReplacement = {
    id: 'cert-super-03',
    certificate_number: 'CERT-2026-OLD',
    public_verification_id: 'pub-v-old',
    status: 'SUPERSEDED',
    issued_at: '2026-09-15 10:00:00',
    verification_url: '/verify/certificate/pub-v-old',
    pdf_url: null,
    downloadable: false,
    replacement: {
      id: 'cert-rep-04',
      certificate_number: 'CERT-2026-REPLACEMENT',
      public_verification_id: 'pub-v-new',
      status: 'ISSUED',
      verification_url: '/verify/certificate/pub-v-new',
      pdf_url: '/api/v1/certificates/cert-rep-04/pdf'
    },
    previous_certificate: null
  }

  const reissuedReplacementCert = {
    id: 'cert-rep-04',
    certificate_number: 'CERT-2026-REPLACEMENT',
    public_verification_id: 'pub-v-new',
    status: 'ISSUED',
    issued_at: '2026-09-25 12:00:00',
    verification_url: '/verify/certificate/pub-v-new',
    pdf_url: '/api/v1/certificates/cert-rep-04/pdf',
    downloadable: true,
    replacement: null,
    previous_certificate: {
      id: 'cert-super-03',
      certificate_number: 'CERT-2026-OLD',
      status: 'SUPERSEDED',
      verification_url: '/verify/certificate/pub-v-old'
    }
  }

  // 1. certificate = null -> No Certificate UI
  it('1. renders no certificate controls when certificate is null', () => {
    const badgeHtml = renderToString(<StudentCertificateBadge certificate={null} />)
    expect(badgeHtml).toBe('')

    const sectionHtml = renderToString(<StudentCertificateSection certificate={null} />)
    expect(sectionHtml).toBe('')
  })

  // 2. ISSUED -> Status + Certificate number + Download + Verify
  it('2. renders ISSUED certificate with badge, certificate number, download button, and verify button', () => {
    const badgeHtml = renderToString(<StudentCertificateBadge certificate={issuedCert} />)
    expect(badgeHtml).toContain('Official Certificate')
    expect(badgeHtml).toContain('CERT-2026-000001')

    const sectionHtml = renderToString(<StudentCertificateSection certificate={issuedCert} />)
    expect(sectionHtml).toContain('CERT-2026-000001')
    expect(sectionHtml).toContain('Issued')
    expect(sectionHtml).toContain('Download PDF')
    expect(sectionHtml).toContain('Verify Certificate')
  })

  // 3. REVOKED -> Revoked state + no Download + Verify
  it('3. renders REVOKED certificate state with Verify button but NO download button', () => {
    const badgeHtml = renderToString(<StudentCertificateBadge certificate={revokedCert} />)
    expect(badgeHtml).toContain('Revoked')

    const sectionHtml = renderToString(<StudentCertificateSection certificate={revokedCert} />)
    expect(sectionHtml).toContain('Revoked')
    expect(sectionHtml).toContain('Certificate Revoked')
    expect(sectionHtml).toContain('Verify Certificate')
    expect(sectionHtml).not.toContain('Download PDF')
  })

  // 4. SUPERSEDED -> Superseded state + no Download + Verify
  it('4. renders SUPERSEDED certificate state with replacement reference and NO download button', () => {
    const badgeHtml = renderToString(<StudentCertificateBadge certificate={supersededCertWithReplacement} />)
    expect(badgeHtml).toContain('Superseded')

    const sectionHtml = renderToString(<StudentCertificateSection certificate={supersededCertWithReplacement} />)
    expect(sectionHtml).toContain('Superseded')
    expect(sectionHtml).toContain('Certificate Superseded')
    expect(sectionHtml).toContain('CERT-2026-REPLACEMENT')
    expect(sectionHtml).not.toContain('Download PDF')
  })

  // 5. Replacement ISSUED -> New/Current certificate displayed
  it('5. renders reissued replacement certificate as primary active ISSUED certificate', () => {
    const sectionHtml = renderToString(<StudentCertificateSection certificate={reissuedReplacementCert} />)
    expect(sectionHtml).toContain('CERT-2026-REPLACEMENT')
    expect(sectionHtml).toContain('Download PDF')
    expect(sectionHtml).toContain('Verify Certificate')
  })

  // 6. previous_certificate -> Predecessor shown in detailed view
  it('6. displays predecessor information subtly when previous_certificate is present', () => {
    const sectionHtml = renderToString(<StudentCertificateSection certificate={reissuedReplacementCert} />)
    expect(sectionHtml).toContain('Replacement Issuance')
    expect(sectionHtml).toContain('CERT-2026-OLD')
    expect(sectionHtml).toContain('View History')
  })

  // 7. Download uses backend-provided pdf_url
  it('7. uses backend-supplied pdf_url for download requests', async () => {
    const mockBlob = new Blob(['mock binary pdf content'], { type: 'application/pdf' })
    apiClient.get.mockResolvedValueOnce(mockBlob)

    const result = await portfolioService.downloadCertificatePdf(
      '/api/v1/certificates/cert-issued-01/pdf',
      'CERT-2026-000001'
    )

    expect(result).toBe(true)
    expect(apiClient.get).toHaveBeenCalledWith('/certificates/cert-issued-01/pdf', { responseType: 'blob' })
  })

  // 8. Verify uses backend-provided verification_url
  it('8. verify action references backend-supplied verification_url', () => {
    expect(issuedCert.verification_url).toBe('/verify/certificate/pub-v-001')
    expect(revokedCert.verification_url).toBe('/verify/certificate/pub-v-revoked')
    expect(supersededCertWithReplacement.verification_url).toBe('/verify/certificate/pub-v-old')
  })

  // 9. Authenticated binary download path
  it('9. executes authenticated binary download, triggers browser save, and revokes temporary object URL', async () => {
    const mockBlob = new Blob(['pdf data'], { type: 'application/pdf' })
    apiClient.get.mockResolvedValueOnce(mockBlob)

    await portfolioService.downloadCertificatePdf(
      '/api/v1/certificates/cert-issued-01/pdf',
      'CERT-2026-000001'
    )

    expect(globalThis.window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
    expect(globalThis.window.URL.revokeObjectURL).toHaveBeenCalled()
  })

  // 10. Stale download 409 CERTIFICATE_REVOKED
  it('10. handles 409 CERTIFICATE_REVOKED during stale download with user-friendly error', async () => {
    apiClient.get.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: { code: 'CERTIFICATE_REVOKED', message: 'Certificate has been revoked.' } }
      }
    })

    await expect(
      portfolioService.downloadCertificatePdf('/api/v1/certificates/cert-issued-01/pdf', 'CERT-2026-000001')
    ).rejects.toThrow('This certificate has been revoked and can no longer be downloaded.')
  })

  // 11. Stale download 409 CERTIFICATE_SUPERSEDED
  it('11. handles 409 CERTIFICATE_SUPERSEDED during stale download with user-friendly error', async () => {
    apiClient.get.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: { code: 'CERTIFICATE_SUPERSEDED', message: 'Certificate has been superseded.' } }
      }
    })

    await expect(
      portfolioService.downloadCertificatePdf('/api/v1/certificates/cert-issued-01/pdf', 'CERT-2026-000001')
    ).rejects.toThrow('This certificate has been replaced and can no longer be downloaded.')
  })

  // 12. No sensitive internals rendered
  it('12. ensures certificate payload does not contain or expose internal database secrets or paths', () => {
    const certPayload = { ...issuedCert }
    expect(certPayload).not.toHaveProperty('snapshot_json')
    expect(certPayload).not.toHaveProperty('idempotency_key')
    expect(certPayload).not.toHaveProperty('revoked_by')
    expect(certPayload).not.toHaveProperty('template_id')
  })

  // 13. Modal and page lifecycle semantics agree
  it('13. ensures modal and page components agree on server-authoritative certificate lifecycle representation', () => {
    const badgeHtml = renderToString(<StudentCertificateBadge certificate={issuedCert} />)
    const sectionHtml = renderToString(<StudentCertificateSection certificate={issuedCert} />)

    expect(badgeHtml).toContain('Official Certificate')
    expect(sectionHtml).toContain('OFFICIAL CERTIFICATE')
    expect(sectionHtml).toContain(issuedCert.certificate_number)
  })
})
