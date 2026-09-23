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
      recipient_name: data.recipient_name || data.student_name || 'JUAN DELA CRUZ',
      certificate_title: data.certificate_title || 'CERTIFICATE OF ATTAINMENT',
      activity_title: data.activity_title || 'Community Outreach 2026',
      activity_type: data.activity_type || 'Volunteer Service',
      activity_date: data.activity_date || 'September 20, 2026',
      date_range: data.date_range || 'September 20–21, 2026',
      organizer_name: data.organizer_name || 'NDMU Office of Student Affairs',
      student_role: data.student_role || 'Participant',
      contribution_role: data.contribution_role || 'Volunteer',
      recognition_title: data.recognition_title || 'Outstanding Student Achievement',
      placement: data.placement || 'Champion',
      scope: data.scope || 'University',
      granting_body: data.granting_body || 'Notre Dame of Marbel University',
      issuer_name: data.issuer_name || 'NDMU Office of Student Affairs',
      award_or_event_title: data.award_or_event_title || data.activity_title || 'Community Outreach 2026',
      award_category: data.award_category || 'Student Excellence',
      event_title: data.event_title || data.activity_title || 'Community Outreach 2026',
      event_date: data.event_date || data.activity_date || 'September 20, 2026',
      academic_year: data.academic_year || 'AY 2026-2027',
      organization_name: data.organization_name || data.organizer_name || 'NDMU Office of Student Affairs',
      college_name: data.college_name || 'NDMU College of Engineering',
      degree_program: data.degree_program || 'BS Computer Science',
      rank_or_distinction: data.rank_or_distinction || '1st Place Winner',
      certificate_number: data.certificate_number || 'AN-PREVIEW-000000',
      issued_date: data.issued_date || new Date().toISOString().split('T')[0],
      verification_url: data.verification_url || 'PREVIEW — NO PUBLIC VERIFICATION ID'
    }

    Object.entries(replacements).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, this.escapeText(val))
    })

    return rendered
  }
}

export default CertificateTemplateRenderer
