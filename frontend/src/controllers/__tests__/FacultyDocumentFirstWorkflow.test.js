import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import OcrScanController from '../OcrScanController'
import { isTemporaryWorkflowError, mapOcrToForm, retryTemporaryOperation } from '../../pages/personnel/modals/FacultyAcademicSubmissionModal'

const here = path.dirname(fileURLToPath(import.meta.url))

describe('Faculty document-first accomplishment workflow', () => {
  it('keeps classification and dynamic fields independent from document upload', () => {
    const source = fs.readFileSync(path.resolve(here, '../../pages/personnel/modals/FacultyAcademicSubmissionModal.jsx'), 'utf8')
    expect(source.indexOf('Classification</h3>')).toBeLessThan(source.indexOf('Supporting Document</h3>'))
    expect(source.indexOf('Supporting Document</h3>')).toBeLessThan(source.indexOf('Accomplishment Details</h3>'))
    expect(source).toContain('beginEvidenceDraft')
    expect(source).toContain('extractPersisted')
    expect(source).toContain('Use Suggested Classification')
    expect(source).toContain('processFile(selectedFile, { reuseLocalPreview: true })')
    expect(source).toContain('Try Again')
    expect(source).toContain('Save Draft')
    expect(source).not.toContain('Continue Manually')
    expect(source).not.toContain('manualClassification')
  })

  it('uses immutable parent area context and scopes category options', () => {
    const modal = fs.readFileSync(path.resolve(here, '../../pages/personnel/modals/FacultyAcademicSubmissionModal.jsx'), 'utf8')
    const editPage = fs.readFileSync(path.resolve(here, '../../pages/personnel/PersonnelPortfolioEditPage.jsx'), 'utf8')
    expect(modal).toContain("areaCode = 'A'")
    expect(modal).toContain('item.area === effectiveAreaCode')
    expect(modal).toContain('Area {effectiveAreaCode} · {effectiveAreaName}')
    expect(modal).not.toContain('Select area')
    expect(editPage).toContain('areaCode={editingAccomplishment?.category_area?.replace')
    expect(editPage).toContain('|| activeArea}')
  })

  it('shows persisted evidence inline and keeps faculty-facing extraction language friendly', () => {
    const modal = fs.readFileSync(path.resolve(here, '../../pages/personnel/modals/FacultyAcademicSubmissionModal.jsx'), 'utf8')
    const viewer = fs.readFileSync(path.resolve(here, '../../pages/personnel/modals/FacultyDocumentViewer.jsx'), 'utf8')
    expect(modal).toContain('<FacultyDocumentViewer localFile={selectedFile}')
    expect(modal).toContain('URL.createObjectURL(file)')
    expect(modal).toContain('reuseLocalPreview: true')
    expect(modal).toContain('onPersistedReady={handlePersistedPreviewReady}')
    expect(modal).toContain('Reading document…')
    expect(modal).toContain("We couldn't read the text automatically.")
    expect(modal).not.toContain('Retry OCR')
    expect(viewer).toContain('getEvidenceBlobUrl(evidence.id)')
    expect(viewer).toContain("mimeType === 'application/pdf'")
    expect(viewer).toContain("mimeType.startsWith('image/')")
    expect(viewer).toContain('Unable to load the saved document preview.')
    expect(viewer).toContain('localPreviewUrl || persistedUrl')
    expect(viewer).toContain('onLoad={showingPersisted ? confirmPersistedRender : undefined}')
    expect(viewer).toContain('localPreviewUrl && persistedUrl')
    expect(viewer).toContain('Retry Preview')
  })

  it('preserves touched manual values, including intentional clears', () => {
    const form = { details: { title: '', organizer: 'Faculty-edited organizer', venue: '' }, date: '', startDate: '', endDate: '' }
    const result = mapOcrToForm(form, 'A.3', 'A3_ATTENDANCE', {
      title: 'Extracted seminar',
      issuer: 'Extracted organizer',
      date: '2026-09-01'
    }, { 'details.title': true, 'details.organizer': true, startDate: true })

    expect(result.details.title).toBe('')
    expect(result.details.organizer).toBe('Faculty-edited organizer')
    expect(result.startDate).toBe('')
  })

  it('fills untouched empty fields from a later document reading', () => {
    const form = { details: { title: '', organizer: '', venue: '' }, date: '', startDate: '', endDate: '' }
    const result = mapOcrToForm(form, 'A.3', 'A3_ATTENDANCE', {
      title: 'National Cybersecurity Seminar',
      issuer: 'NDMU',
      date: '2026-09-01'
    })

    expect(result.details.title).toBe('National Cybersecurity Seminar')
    expect(result.details.organizer).toBe('NDMU')
    expect(result.startDate).toBe('2026-09-01')
  })

  it('keeps recovery states independent and applies bounded temporary retries', () => {
    const source = fs.readFileSync(path.resolve(here, '../../pages/personnel/modals/FacultyAcademicSubmissionModal.jsx'), 'utf8')
    expect(source).toContain("setDocumentState('upload_failed')")
    expect(source).toContain("setDocumentState('ocr_failed')")
    expect(source).toContain("setDocumentState('classification_pending')")
    expect(source).toContain('retryTemporaryOperation')
  })

  it('retries a temporary failure and reconciles the successful response', async () => {
    let attempts = 0
    const result = await retryTemporaryOperation(async () => {
      attempts += 1
      if (attempts < 3) throw { response: { status: 503 } }
      return { evidence: { id: 'existing-evidence' }, idempotent_replay: true }
    }, [0, 0])
    expect(attempts).toBe(3)
    expect(result.evidence.id).toBe('existing-evidence')
  })

  it('does not retry validation, authorization, or malformed-file failures', async () => {
    let attempts = 0
    await expect(retryTemporaryOperation(async () => { attempts += 1; throw { response: { status: 422 } } }, [0, 0])).rejects.toBeTruthy()
    expect(attempts).toBe(1)
    expect(isTemporaryWorkflowError({ response: { status: 401 } })).toBe(false)
    expect(isTemporaryWorkflowError({ response: { status: 504 } })).toBe(true)
  })

  it.each([
    ['Doctor of Philosophy degree conferred by University', 'A.1 Degree/s'],
    ['Certificate of Participation National Seminar training', 'A.3 Attendance to Seminars/Trainings'],
    ['Certificate of Appreciation served as Resource Person', 'B.1 Guest Lecturer / Consultant / Judge'],
    ['Certificate of Recognition Awardee Outstanding Faculty', 'B.4 Professional Recognition or Awards']
  ])('classifies representative evidence without faculty scoring (%s)', (text, expected) => {
    expect(OcrScanController.classifyCategory(text).category).toBe(expected)
  })

  it('treats a generic recognition certificate as ambiguous and returns alternatives', () => {
    const result = OcrScanController.classifyCategory('Certificate of Recognition')
    expect(result.confidence).toBeLessThan(75)
    expect(result.alternatives.length).toBeGreaterThan(1)
  })
})
