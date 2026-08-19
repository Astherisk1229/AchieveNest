/**
 * CertificateTemplateRenderer.js
 * Safe placeholder evaluator and HTML/SVG renderer for certificate previews and issuance snapshots.
 */

export class CertificateTemplateRenderer {
  static escapeText(str) {
    if (!str || typeof str !== 'string') return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  static renderBody(bodyTemplate = '', data = {}) {
    if (!bodyTemplate) return ''
    
    let rendered = bodyTemplate
    const replacements = {
      recipient_name: data.recipient_name || data.student_name || 'STUDENT RECIPIENT',
      certificate_title: data.certificate_title || 'CERTIFICATE OF ATTAINMENT',
      award_or_event_title: data.award_or_event_title || data.event_title || data.award_title || 'NDMU Institutional Activity',
      award_category: data.award_category || 'Student Excellence',
      event_title: data.event_title || 'NDMU Campus Summit 2026',
      event_date: data.event_date || 'Academic Year 2025-2026',
      academic_year: data.academic_year || 'AY 2025-2026',
      organization_name: data.organization_name || 'NDMU Office of Student Affairs',
      college_name: data.college_name || 'NDMU College of Engineering',
      degree_program: data.degree_program || 'BS Computer Science',
      rank_or_distinction: data.rank_or_distinction || '1st Place Winner',
      certificate_number: data.certificate_number || 'NDMU-CERT-2026-PREVIEW',
      issued_date: data.issued_date || new Date().toISOString().split('T')[0],
      verification_url: data.verification_url || 'https://ndmu.edu.ph/verify'
    }

    Object.entries(replacements).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, this.escapeText(val))
    })

    return rendered
  }
}

export default CertificateTemplateRenderer
