import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import OcrScanController from '../OcrScanController'
import { detectDegreeMismatch, isTemporaryWorkflowError, mapOcrToForm, ocrCandidates, retryTemporaryOperation } from '../../pages/personnel/modals/FacultyAcademicSubmissionModal'
import { facultyCategoryDisplayLabel, facultySubcategoryByCode } from '../../config/facultyAcademicAccomplishmentSchema'

const here = path.dirname(fileURLToPath(import.meta.url))

describe('Faculty document-first accomplishment workflow', () => {
  it('orders the review cards document → classification → details (document drives classification)', () => {
    const source = fs.readFileSync(path.resolve(here, '../../pages/personnel/modals/FacultyAcademicSubmissionModal.jsx'), 'utf8')
    expect(source.indexOf('title="Supporting document"')).toBeLessThan(source.indexOf('title="Classification"'))
    expect(source.indexOf('title="Classification"')).toBeLessThan(source.indexOf('title="Accomplishment details"'))
    expect(source).toContain('Add Accomplishment')
    expect(source).toContain('Add Accomplishment')
    expect(source).toContain('Re-scan')
    expect(source).not.toContain('Replace Document')
    expect(source).not.toContain('Log New Accomplishment')
    expect(source).toContain('beginEvidenceDraft')
    expect(source).toContain('extractPersisted')
    expect(source).toContain('await runOcr(evidence.id) // scan starts automatically after upload')
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
    expect(editPage).toContain("const submissionAreaCode = editingAccomplishment?.category_area?.replace('area', '') || activeArea")
    expect(editPage).toContain('areaCode={submissionAreaCode}')
  })

  it('shows persisted evidence inline and keeps faculty-facing extraction language friendly', () => {
    const modal = fs.readFileSync(path.resolve(here, '../../pages/personnel/modals/FacultyAcademicSubmissionModal.jsx'), 'utf8')
    const viewer = fs.readFileSync(path.resolve(here, '../../pages/personnel/modals/FacultyDocumentViewer.jsx'), 'utf8')
    expect(modal).toContain('<FacultyDocumentViewer fill scanning={scanning}')
    expect(modal).toContain('URL.createObjectURL(file)')
    expect(modal).toContain('reuseLocalPreview: true')
    expect(modal).toContain('onPersistedReady={handlePersistedPreviewReady}')
    expect(modal).toContain('Reading document…')
    expect(modal).toContain("We couldn't read this document. Fill in the details manually or try a clearer scan.")
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

  describe('A.1 sample: 01_A1_Education_OCR_Sample.jpg', () => {
    const text = [
      'ST. GABRIEL METROPOLITAN UNIVERSITY',
      'Certificate of Graduation',
      'Name: Juan D. Santos',
      'Course/Degree: Master of Information Technology',
      'School/University: St. Gabriel Metropolitan University',
      'Academic Period: 2022 - 2025',
      'Date of Certification: June 20, 2025'
    ].join('\n')
    const lines = text.split('\n')
    const classification = OcrScanController.classifyCategory(text)
    const fields = OcrScanController.extractFieldsFromText(text, lines, classification.category)

    it('classifies as A.1 and uses the dropdown label everywhere', () => {
      expect(classification.category).toBe('A.1 Degree/s')
      expect(facultyCategoryDisplayLabel('A.1')).toBe('A.1 — Degrees & Advanced Units')
    })

    it('maps all four labeled fields into the form', () => {
      const empty = { details: {}, date: '', startDate: '', endDate: '' }
      const result = mapOcrToForm(empty, 'A.1', 'A1_MA_HOLDER', fields)
      expect(result.details.degree_title).toBe('Master of Information Technology')
      expect(result.details.institution).toBe('St. Gabriel Metropolitan University')
      expect(result.details.academic_period).toBe('2022–2025')
      expect(result.date).toBe('2025-06-20')
      expect(fields.degreeLevel).toBe("Master's Degree Holder")
      expect(fields.fieldMetadata.date.inferred).toBe(true)
      expect(fields.fieldMetadata.date.label).toBe('Date of Certification')
    })

    it('flags a Ph.D. selection as a mismatch and offers the Master\'s subcategory', () => {
      const phd = facultySubcategoryByCode('A1_PHD_HOLDER')
      const mismatch = detectDegreeMismatch(phd, 'Master of Information Technology')
      expect(mismatch).toEqual({ documentLevel: 'masters', documentLabel: "Master's", fixCode: 'A1_MA_HOLDER' })
      expect(detectDegreeMismatch(facultySubcategoryByCode('A1_MA_HOLDER'), 'Master of Information Technology')).toBeNull()
    })

    it('fills the same values into the Ph.D. subcategory before the fix (no silent loss)', () => {
      expect(ocrCandidates(facultySubcategoryByCode('A1_PHD_HOLDER'), fields)['details.degree_title']).toBe('Master of Information Technology')
    })

    it('never overwrites edited fields unless Re-scan is used', () => {
      const edited = { details: { degree_title: 'MIT (edited)' }, date: '', startDate: '', endDate: '' }
      const touched = { 'details.degree_title': true }
      expect(mapOcrToForm(edited, 'A.1', 'A1_MA_HOLDER', fields, touched).details.degree_title).toBe('MIT (edited)')
      expect(mapOcrToForm(edited, 'A.1', 'A1_MA_HOLDER', fields, {}, { overwrite: true }).details.degree_title).toBe('Master of Information Technology')
    })
  })
})
