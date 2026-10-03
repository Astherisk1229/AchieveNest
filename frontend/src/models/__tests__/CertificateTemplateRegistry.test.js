import { describe, it, expect } from 'vitest'
import { CertificateTemplateModel } from '../CertificateTemplateModel'
import { CertificateTemplateVersionModel } from '../CertificateTemplateVersionModel'
import { IssuedCertificateModel } from '../IssuedCertificateModel'
import CertificateTemplateRenderer from '../../services/CertificateTemplateRenderer'

describe('Certificate Template Registry & Issuance Domain', () => {
  describe('CertificateTemplateModel', () => {
    it('validates template family attributes', () => {
      const valid = CertificateTemplateModel.validate({ name: 'Leadership Award' })
      expect(valid.isValid).toBe(true)

      const invalid = CertificateTemplateModel.validate({ name: '' })
      expect(invalid.isValid).toBe(false)
      expect(invalid.errors.length).toBeGreaterThan(0)
    })

    it('checks context compatibility correctly', () => {
      const model = new CertificateTemplateModel({
        allowedContexts: ['award'],
        status: 'active'
      })
      expect(model.isContextCompatible('award')).toBe(true)
      expect(model.isContextCompatible('event')).toBe(false)
    })
  })

  describe('CertificateTemplateVersionModel & Renderer', () => {
    it('validates allowlisted placeholders', () => {
      const ver = new CertificateTemplateVersionModel({
        templateFamilyId: 'fam-1',
        contentSchema: {
          heading: 'CERTIFICATE',
          body: 'Presented to {{recipient_name}} for {{activity_title}} on {{activity_date}}.'
        }
      })
      const check = ver.validatePlaceholders()
      expect(check.isValid).toBe(true)
      expect(check.usedPlaceholders).toContain('recipient_name')
      expect(check.usedPlaceholders).toContain('activity_title')
    })

    it('escapes text values cleanly during placeholder replacement', () => {
      const bodyTemplate = 'Presented to {{recipient_name}} for {{activity_title}}.'
      const rendered = CertificateTemplateRenderer.renderBody(bodyTemplate, {
        recipient_name: 'Juan Dela Cruz <Admin>',
        activity_title: 'Hackathon & AI Challenge'
      })
      expect(rendered).toContain('Juan Dela Cruz &lt;Admin&gt;')
      expect(rendered).toContain('Hackathon &amp; AI Challenge')
    })
  })

  describe('IssuedCertificateModel', () => {
    it('generates unique certificate numbers and supports audited revocation', () => {
      const cert = new IssuedCertificateModel({
        recipientName: 'Maria Clara Santos',
        sourceType: 'award'
      })
      expect(cert.certificateNumber).toMatch(/^NDMU-CERT-2026-\d{5}$/)
      expect(cert.status).toBe('issued')

      cert.revoke('Director Marcus Vance', 'Issued in error')
      expect(cert.status).toBe('revoked')
    })
  })
})
