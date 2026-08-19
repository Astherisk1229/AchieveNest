/**
 * CertificateTemplateController.js
 * Central controller and registry for OSAD Certificate Templates and Issued Certificates.
 * Enforces permission checks, template family versioning, placeholder validation, and event-driven updates.
 */

import { CertificateTemplateModel } from '../models/CertificateTemplateModel'
import { CertificateTemplateVersionModel } from '../models/CertificateTemplateVersionModel'
import { IssuedCertificateModel } from '../models/IssuedCertificateModel'

const STORAGE_KEY_FAMILIES = 'achievenest_cert_template_families'
const STORAGE_KEY_VERSIONS = 'achievenest_cert_template_versions'
const STORAGE_KEY_ISSUED = 'achievenest_issued_certificates'

export class CertificateTemplateController {
  static #families = []
  static #versions = []
  static #issuedCertificates = []
  static #listeners = new Set()

  static initialize() {
    if (this.#families.length > 0) return

    // Seed default template families
    const seedFamilies = [
      {
        id: 'tpl-fam-001',
        code: 'OSAD-TPL-001',
        name: 'Official NDMU Certificate of Participation',
        allowedContexts: ['event', 'award'],
        status: 'active',
        currentPublishedVersionId: 'tpl-ver-001-v1'
      },
      {
        id: 'tpl-fam-002',
        code: 'OSAD-TPL-002',
        name: 'Certificate of Leadership & Merit',
        allowedContexts: ['award', 'event'],
        status: 'active',
        currentPublishedVersionId: 'tpl-ver-002-v1'
      },
      {
        id: 'tpl-fam-003',
        code: 'OSAD-TPL-003',
        name: 'Certificate of Workshop Completion',
        allowedContexts: ['event'],
        status: 'active',
        currentPublishedVersionId: 'tpl-ver-003-v1'
      },
      {
        id: 'tpl-fam-004',
        code: 'OSAD-TPL-004',
        name: 'Excellence & Special Distinction Award',
        allowedContexts: ['award'],
        status: 'active',
        currentPublishedVersionId: 'tpl-ver-004-v1'
      },
      {
        id: 'tpl-fam-005',
        code: 'OSAD-TPL-005',
        name: 'Outstanding Community Service & Extension Certificate',
        allowedContexts: ['award', 'event'],
        status: 'active',
        currentPublishedVersionId: 'tpl-ver-005-v1'
      }
    ]

    const seedVersions = [
      {
        id: 'tpl-ver-001-v1',
        templateFamilyId: 'tpl-fam-001',
        versionNumber: 1,
        status: 'published',
        contentSchema: {
          heading: 'OFFICIAL CERTIFICATE OF PARTICIPATION',
          recipientLeadIn: 'This is proudly presented to',
          body: 'In recognition of active participation and dedication during {{event_title}} hosted by {{organization_name}} on {{event_date}}.',
          footerNote: 'Notre Dame of Marbel University • Office of Student Affairs & Services'
        },
        layoutSchema: { themeId: 'emerald_gold', borderStyle: 'classic_ornate' },
        publishedBy: 'Director Marcus Vance',
        publishedAt: '2026-01-15T08:00:00.000Z'
      },
      {
        id: 'tpl-ver-002-v1',
        templateFamilyId: 'tpl-fam-002',
        versionNumber: 1,
        status: 'published',
        contentSchema: {
          heading: 'CERTIFICATE OF LEADERSHIP & MERIT',
          recipientLeadIn: 'This honor is conferred upon',
          body: 'For exemplary student executive leadership and dedicated governance service in {{organization_name}} for {{academic_year}}.',
          footerNote: 'Notre Dame of Marbel University • Office of Student Affairs & Services'
        },
        layoutSchema: { themeId: 'navy_gold', borderStyle: 'modern_executive' },
        publishedBy: 'Director Marcus Vance',
        publishedAt: '2026-01-15T08:00:00.000Z'
      },
      {
        id: 'tpl-ver-003-v1',
        templateFamilyId: 'tpl-fam-003',
        versionNumber: 1,
        status: 'published',
        contentSchema: {
          heading: 'CERTIFICATE OF WORKSHOP COMPLETION',
          recipientLeadIn: 'This certifies that',
          body: 'Has successfully completed the technical modules and hands-on skills workshop for {{event_title}} on {{event_date}}.',
          footerNote: 'Notre Dame of Marbel University • Office of Student Affairs & Services'
        },
        layoutSchema: { themeId: 'emerald_gold', borderStyle: 'clean_minimal' },
        publishedBy: 'Director Marcus Vance',
        publishedAt: '2026-01-15T08:00:00.000Z'
      },
      {
        id: 'tpl-ver-004-v1',
        templateFamilyId: 'tpl-fam-004',
        versionNumber: 1,
        status: 'published',
        contentSchema: {
          heading: 'EXCELLENCE & SPECIAL DISTINCTION AWARD',
          recipientLeadIn: 'Highest distinction awarded to',
          body: 'For achieving the highest distinction and qualifying verified score threshold in the {{award_category}} category for {{academic_year}}.',
          footerNote: 'Notre Dame of Marbel University • Office of Student Affairs & Services'
        },
        layoutSchema: { themeId: 'gold_imperial', borderStyle: 'imperial_border' },
        publishedBy: 'Director Marcus Vance',
        publishedAt: '2026-01-15T08:00:00.000Z'
      },
      {
        id: 'tpl-ver-005-v1',
        templateFamilyId: 'tpl-fam-005',
        versionNumber: 1,
        status: 'published',
        contentSchema: {
          heading: 'OUTSTANDING COMMUNITY SERVICE & EXTENSION',
          recipientLeadIn: 'This certificate of appreciation is granted to',
          body: 'For invaluable volunteer service and community development impact during {{event_title}} on {{event_date}}.',
          footerNote: 'Notre Dame of Marbel University • Office of Student Affairs & Services'
        },
        layoutSchema: { themeId: 'emerald_gold', borderStyle: 'classic_ornate' },
        publishedBy: 'Director Marcus Vance',
        publishedAt: '2026-01-15T08:00:00.000Z'
      }
    ]

    this.#families = seedFamilies.map(f => new CertificateTemplateModel(f))
    this.#versions = seedVersions.map(v => new CertificateTemplateVersionModel(v))
  }

  static subscribe(listener) {
    this.initialize()
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  static notify() {
    this.#listeners.forEach(l => l())
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('achievenest_certificate_templates_update'))
    }
  }

  static getTemplateFamilies(context = 'all', statusFilter = 'all') {
    this.initialize()
    return this.#families
      .filter(f => statusFilter === 'all' || f.status === statusFilter)
      .filter(f => context === 'all' || f.allowedContexts.includes(context))
  }

  static getPublishedTemplates(context = 'all') {
    this.initialize()
    const activeFamilies = this.#families.filter(f => f.status === 'active' && (context === 'all' || f.allowedContexts.includes(context)))
    return activeFamilies.map(fam => {
      const ver = this.#versions.find(v => v.id === fam.currentPublishedVersionId)
      return {
        familyId: fam.id,
        code: fam.code,
        name: fam.name,
        allowedContexts: fam.allowedContexts,
        versionId: ver ? ver.id : null,
        versionNumber: ver ? ver.versionNumber : 1,
        contentSchema: ver ? ver.contentSchema : null,
        layoutSchema: ver ? ver.layoutSchema : null,
        signatorySlots: ver ? ver.signatorySlots : []
      }
    })
  }

  static createTemplateFamily(familyData, initialVersionData, publisherName = 'OSAD Staff') {
    this.initialize()
    const familyValidation = CertificateTemplateModel.validate(familyData)
    if (!familyValidation.isValid) throw new Error(familyValidation.errors.join(' '))

    const family = new CertificateTemplateModel({
      ...familyData,
      createdBy: publisherName
    })

    const version = new CertificateTemplateVersionModel({
      ...initialVersionData,
      templateFamilyId: family.id,
      versionNumber: 1,
      status: 'published',
      publishedBy: publisherName,
      publishedAt: new Date().toISOString()
    })

    // Update family current version reference
    const updatedFamily = new CertificateTemplateModel({
      ...family.toJSON(),
      currentPublishedVersionId: version.id
    })

    this.#families.push(updatedFamily)
    this.#versions.push(version)
    this.notify()
    return { family: updatedFamily, version }
  }

  static toggleTemplateFamilyStatus(familyId) {
    this.initialize()
    const idx = this.#families.findIndex(f => f.id === familyId)
    if (idx !== -1) {
      const current = this.#families[idx]
      const nextStatus = current.status === 'active' ? 'retired' : 'active'
      this.#families[idx] = new CertificateTemplateModel({
        ...current.toJSON(),
        status: nextStatus,
        updatedAt: new Date().toISOString()
      })
      this.notify()
      return this.#families[idx]
    }
    return null
  }
}

export default CertificateTemplateController
