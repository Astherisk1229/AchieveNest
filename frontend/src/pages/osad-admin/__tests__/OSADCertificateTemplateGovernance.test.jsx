import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pageSource = readFileSync(new URL('../OSADCertificateTemplatesPage.jsx', import.meta.url), 'utf8')
const editorSource = readFileSync(new URL('../../../components/osad/CertificateTemplateEditorModal.jsx', import.meta.url), 'utf8')
const panelsSource = readFileSync(new URL('../../../components/osad/certificate-studio/CertificateStudioPanels.jsx', import.meta.url), 'utf8')
const previewSource = readFileSync(new URL('../../../components/osad/certificate-studio/CertificateStudioPreview.jsx', import.meta.url), 'utf8')
const configSource = readFileSync(new URL('../../../components/osad/certificate-studio/certificateStudioConfig.js', import.meta.url), 'utf8')
const studioSource = `${editorSource}\n${panelsSource}\n${previewSource}`
const controllerSource = readFileSync(new URL('../../../controllers/CertificateTemplateController.js', import.meta.url), 'utf8')

describe('OSAD governed certificate template workflow', () => {
  it('loads governed purpose families and creates drafts instead of publishing on creation', () => {
    expect(pageSource).toContain('templates.createDraft')
    expect(pageSource).toContain('current_published_version')
    expect(pageSource).toContain('Version history')
    expect(pageSource).not.toContain('toggleStatus')
    expect(pageSource).not.toContain('Director Marcus Vance')
  })

  it('supports save, backend validation, publish confirmation, and optimistic concurrency', () => {
    expect(editorSource).toContain('expected_token: sourceDraft.concurrency_token')
    expect(editorSource).toContain('Save Draft')
    expect(studioSource).toContain('Check readiness')
    expect(editorSource).toContain('onValidate(sourceDraft.id, sourceDraft.concurrency_token)')
    expect(editorSource).toContain('Publish v')
    expect(editorSource).toContain("validation?.status === 'PASS'")
    expect(editorSource).toContain('Publish ${family.name} v')
    expect(editorSource).toContain('will remain in Version History')
    expect(editorSource).toContain('Existing certificates will not change.')
  })

  it('uses backend placeholder and signatory registries with a safe preview', () => {
    expect(panelsSource).toContain('registry.placeholders')
    expect(panelsSource).toContain('registry.signatory_roles')
    expect(previewSource).toContain('Synthetic data · no official identity')
    expect(previewSource).not.toContain('Prof. Grace Tan')
  })

  it('uses the simplified four-step shell without deleting hidden field and asset support', () => {
    expect(configSource).toContain("{ id: 'design', label: 'Design' }")
    expect(configSource).toContain("{ id: 'content', label: 'Content' }")
    expect(configSource).toContain("{ id: 'signatories', label: 'Signatories' }")
    expect(configSource).toContain("{ id: 'publishing', label: 'Review & Publish' }")
    expect(configSource).not.toContain("id: 'fields'")
    expect(configSource).not.toContain("id: 'assets'")
    expect(editorSource).toContain('Certificate Studio steps')
    expect(editorSource).toContain('md:grid-cols-[minmax(19rem,35%)_minmax(0,1fr)]')
    expect(panelsSource).toContain('function FieldsPanel')
    expect(panelsSource).toContain('function AssetsPanel')
  })

  it('progressively discloses design, content, signatory, and preview controls', () => {
    expect(panelsSource).toContain('Customize Design…')
    expect(panelsSource).toContain('Upload Background')
    expect(panelsSource).toContain('Upload Font')
    expect(panelsSource).toContain('showFriendlyTokens')
    expect(panelsSource).toContain('+ Insert information')
    expect(panelsSource).toContain('How many signers?')
    expect(panelsSource).toContain('More options')
    expect(panelsSource).toContain('Ready to publish')
    expect(panelsSource).toContain('Fix Design')
    expect(previewSource).toContain('Test Preview')
    expect(previewSource).toContain("showGuides && !reviewMode")
  })

  it('keeps final polish states accurate and mobile navigation scrollable', () => {
    expect(editorSource).toContain("saveState === 'Save failed' ? 'Save failed'")
    expect(editorSource).toContain('motion-reduce:animate-none')
    expect(editorSource).toContain('overflow-x-auto border-b')
    expect(editorSource).toContain('w-max min-w-full')
    expect(panelsSource).toContain("isBusy?'Checking…':'Check readiness'")
  })

  it('protects certificate composition zones and reports overflow without clipping bottom content', () => {
    expect(previewSource).toContain('grid-rows-[auto_auto_minmax(0,1fr)_auto_auto]')
    expect(previewSource).toContain('aria-label="Certificate title and recipient"')
    expect(previewSource).toContain('aria-label="Signatories"')
    expect(previewSource).toContain('grid-cols-[minmax(0,1fr)_auto]')
    expect(previewSource).toContain('longRecipient')
    expect(previewSource).toContain("zoom==='fit'?'80%'")
    expect(previewSource.match(/>Fit<\/button>/g)).toHaveLength(1)
    expect(previewSource).not.toContain('relative overflow-hidden bg-white')
    expect(configSource).toContain('SIGNATORY_LABEL_OVERFLOW')
    expect(configSource).toContain('ORGANIZER_OVERFLOW')
    expect(configSource).toContain('Certificate message is too long for the available space.')
  })

  it('keeps the compatibility controller as a backend-only adapter', () => {
    expect(controllerSource).toContain('certificateTemplateService.listFamilies')
    expect(controllerSource).toContain('certificateTemplateService.publishDraft')
    expect(controllerSource).not.toContain('seedFamilies')
    expect(controllerSource).not.toContain('localStorage')
  })

  it('stacks the editor before the large breakpoint and supports dark surfaces', () => {
    expect(editorSource).toContain('md:grid-cols-[minmax(19rem,35%)_minmax(0,1fr)]')
    expect(editorSource).toContain('dark:bg-[#131e2e]')
    expect(editorSource).toContain('dark:bg-[#0b1420]')
    expect(pageSource).toContain('dark:bg-[#131e2e]')
    expect(pageSource).toContain('dark:text-slate-300')
  })
})
