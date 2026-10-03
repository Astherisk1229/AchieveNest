import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { governPlaceholderContract, stepForIssue } from '../certificateStudioConfig'

const editor = readFileSync(new URL('../../CertificateTemplateEditorModal.jsx', import.meta.url), 'utf8')

describe('certificate template publishing', () => {
  it('completes the placeholder contract the server requires before publishing', () => {
    const contract = governPlaceholderContract(
      [{ name: 'recipient_name', requirement_type: 'OPTIONAL' }, { name: 'activity_title', requirement_type: 'REQUIRED' }],
      { body: 'For {{activity_title}} at {{organizer_name}}', footer_note: 'No. {{certificate_number}}' }
    )
    const type = Object.fromEntries(contract.map(item => [item.name, item.requirement_type]))
    expect(type.recipient_name).toBe('REQUIRED')
    expect(type.activity_title).toBe('REQUIRED')
    expect(type.issuer_name).toBe('REQUIRED')
    expect(type.issued_date).toBe('RESOLVED_AT_ISSUANCE')
    expect(type.certificate_number).toBe('RESOLVED_AT_ISSUANCE')
    expect(type.verification_url).toBe('RESOLVED_AT_ISSUANCE')
    expect(type.organizer_name).toBe('OPTIONAL')
  })

  it('never declares placeholders the registry does not know', () => {
    const contract = governPlaceholderContract([], { body: '{{made_up_field}}' }, new Set(['recipient_name']))
    expect(contract.some(item => item.name === 'made_up_field')).toBe(false)
  })

  it('sends each blocking issue to the step where it can be fixed', () => {
    expect(stepForIssue({ field: 'content_schema.footer_note' })).toBe('content')
    expect(stepForIssue({ field: 'signatory_slots.0' })).toBe('signatories')
    expect(stepForIssue({ field: 'layout_schema.theme_id' })).toBe('design')
  })

  it('lets Publish save, validate and then confirm instead of staying disabled', () => {
    expect(editor).toContain('onClick={validationPassed ? () => { setPublishToken(null); setPublishOpen(true) } : startPublish}')
    expect(editor).not.toContain('disabled={isBusy || !validationPassed}')
    expect(editor).not.toContain('Server unavailable.')
  })

  it('renders as a full-screen workspace so the app header and footer cannot overlap it', () => {
    expect(editor).toContain('fixed inset-0 z-40 flex flex-col overflow-hidden')
    expect(editor).not.toContain('sticky top-0')
  })
})
