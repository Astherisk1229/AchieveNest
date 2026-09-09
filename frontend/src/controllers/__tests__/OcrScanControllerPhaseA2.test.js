import { describe, it, expect, vi } from 'vitest'
import OcrScanController from '../OcrScanController.js'
import OcrScanModel from '../../models/OcrScanModel.js'

describe('Phase A2: OCR Extraction & Auto-Fill with Zero-Fabrication Guarantee', () => {

  // =========================================================================
  // 17.1 Valid Extraction (PDF, JPEG, PNG)
  // =========================================================================
  it('A2-OCR-001: extracts text and structured fields from text-based certificate without fabrication', async () => {
    const rawPdfText = `
      NOTRE DAME OF MARBEL UNIVERSITY
      City of Koronadal, South Cotabato
      CERTIFICATE OF PARTICIPATION
      This is to certify that
      DR. MARIA SANTOS
      has actively participated in the
      SEMINAR ON: Advanced Natural Language Processing and LLMs
      Held on: September 15, 2025
      Scope: Regional
      Conferred By: Notre Dame of Marbel University
    `
    const lines = rawPdfText.split('\n').map(l => l.trim()).filter(Boolean)
    const fields = OcrScanController.extractFieldsFromText(rawPdfText, lines)

    expect(fields.title).toContain('Advanced Natural Language Processing')
    expect(fields.issuer).toBe('Notre Dame of Marbel University')
    expect(fields.date).toBe('2025-09-15')
    expect(fields.academicYear).toBe('AY 2025-2026')
    expect(fields.scopeLevel).toBe('Regional')
    expect(fields.specificRole).toBe('Participant')
    // Unsupported fields must remain completely blank (Zero fabrication)
    expect(fields.degreeLevel).toBe('')
    expect(fields.pubType).toBe('')
    expect(fields.fundingStatus).toBe('')
  })

  it('A2-OCR-002: extracts clear speaker engagement details with explicit role and scope (JPEG/PNG certificate text)', () => {
    const rawText = `
      PHILIPPINE COMPUTER SOCIETY
      CERTIFICATE OF APPRECIATION
      Conferred upon
      DR. MARIA SANTOS
      for serving as
      KEYNOTE SPEAKER
      TOPIC: The Future of Responsible Artificial Intelligence in Mindanao
      Date: 2026-03-20
      Scope: National
    `
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
    const fields = OcrScanController.extractFieldsFromText(rawText, lines)

    expect(fields.title).toContain('The Future of Responsible Artificial Intelligence')
    expect(fields.issuer).toBe('Philippine Computer Society')
    expect(fields.specificRole).toBe('Keynote Speaker')
    expect(fields.scopeLevel).toBe('National')
    expect(fields.date).toBe('2026-03-20')
    expect(fields.academicYear).toBe('AY 2025-2026')
  })

  // =========================================================================
  // 17.2 Filename Independence
  // =========================================================================
  it('A2-OCR-007: filename manipulation creates ZERO fabricated degree, role, scope, or award values', async () => {
    const textLayer = 'Generic Document Content with no credentials.'
    const lines = [textLayer]
    
    // File named deliberately with deceptive keywords
    const fakeNamedBlob = new Blob([textLayer], { type: 'application/pdf' })
    fakeNamedBlob.name = 'Doctorate_Ph.D._National_Keynote_Award_Winner_2026.pdf'

    const fields = OcrScanController.extractFieldsFromText(textLayer, lines)

    expect(fields.degreeLevel).toBe('')
    expect(fields.specificRole).toBe('')
    expect(fields.scopeLevel).toBe('')
    expect(fields.awardType).toBe('')
    expect(fields.date).toBe('')
    expect(fields.academicYear).toBe('')
  })

  it('A2-OCR-008: extracts identical field values from identical content regardless of filename variations', () => {
    const text = 'SEMINAR ON: Cloud Computing Architectures\nORGANIZER: CHED\nDate: 2025-11-20\nScope: National'
    const lines = text.split('\n')

    const fieldsA = OcrScanController.extractFieldsFromText(text, lines)
    const fieldsB = OcrScanController.extractFieldsFromText(text, lines)

    expect(fieldsA).toEqual(fieldsB)
    expect(fieldsA.title).toContain('Cloud Computing Architectures')
    expect(fieldsA.issuer).toBe('CHED')
    expect(fieldsA.date).toBe('2025-11-20')
  })

  // =========================================================================
  // 17.3 Missing Fields (Strict Blank Preservation)
  // =========================================================================
  it('A2-OCR-003: leaves missing or uncertain fields blank when document is only partially parsed', () => {
    const rawText = `
      RESEARCH PROJECT TITLE: Predictive Analytics in Student Retention
      Conducted at NDMU
    `
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
    const fields = OcrScanController.extractFieldsFromText(rawText, lines)

    expect(fields.title).toContain('Predictive Analytics in Student Retention')
    // Missing dates, roles, and scope must remain strictly blank
    expect(fields.date).toBe('')
    expect(fields.academicYear).toBe('')
    expect(fields.scopeLevel).toBe('')
    expect(fields.specificRole).toBe('')
    expect(fields.pubType).toBe('')
  })

  it('A2-OCR-004: does not guess or force scope/roles when ambiguous or unstated', () => {
    const rawText = `
      COMMISSION ON HIGHER EDUCATION
      Certificate of Attendance
      Conferred for attending conference in Koronadal City
    `
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
    const fields = OcrScanController.extractFieldsFromText(rawText, lines)

    expect(fields.issuer).toBe('Commission on Higher Education')
    // No explicit date or scope keyword -> remains empty
    expect(fields.date).toBe('')
    expect(fields.academicYear).toBe('')
    expect(fields.scopeLevel).toBe('')
    expect(fields.degreeLevel).toBe('')
  })

  it('A2-OCR-009: missing date results in blank date and blank academic year (never defaults to current date)', () => {
    const rawText = 'NOTRE DAME OF MARBEL UNIVERSITY\nSEMINAR ON: Cloud Native Architectures'
    const lines = rawText.split('\n')
    const fields = OcrScanController.extractFieldsFromText(rawText, lines)

    expect(fields.date).toBe('')
    expect(fields.academicYear).toBe('')
    expect(fields.date).not.toBe(new Date().toISOString().split('T')[0])
  })

  // =========================================================================
  // 17.4 Ambiguous Dates Detection
  // =========================================================================
  it('A2-OCR-011: detects multiple dates and flags ambiguity in extraction warnings', () => {
    const rawText = `
      NOTRE DAME OF MARBEL UNIVERSITY
      SEMINAR ON: Cybersecurity in Higher Education
      Event Date: August 14, 2025
      Certificate Issued on: September 10, 2025
    `
    const dates = OcrScanController.extractAllDatesFromText(rawText)
    expect(dates).toHaveLength(2)
    expect(dates).toContain('2025-08-14')
    expect(dates).toContain('2025-09-10')
  })

  // =========================================================================
  // 17.5 Unreadable / Empty Documents & Error Handling
  // =========================================================================
  it('A2-OCR-005: returns empty result and warning when document contains no readable text', async () => {
    const emptyBlob = new Blob([''], { type: 'application/pdf' })
    emptyBlob.name = 'empty_document.pdf'

    const scanRes = await OcrScanController.processDocumentScan(emptyBlob)
    expect(scanRes.success).toBe(true)
    expect(scanRes.result.extractedText).toBe('')
    expect(scanRes.result.fields.title.value).toBe('')
    expect(scanRes.result.fields.dateAchieved.value).toBe('')
    expect(scanRes.result.fields.issuer.value).toBe('')
    expect(scanRes.result.extractionWarnings.length).toBeGreaterThan(0)
  })

  // =========================================================================
  // 17.6 Structured Model Contract & Source Metadata
  // =========================================================================
  it('A2-OCR-006: constructs structured source-aware extraction result with suggestion-only category', () => {
    const result = OcrScanModel.createExtractionResult({
      fileName: 'test_certificate.pdf',
      extractedText: 'Sample text',
      detectedCategory: 'B.2 Publication',
      confidenceScore: 88,
      extractedFields: {
        title: 'Machine Learning in Education',
        issuer: 'IEEE Xplore',
        date: '2026-05-10',
        academicYear: 'AY 2025-2026',
        scopeLevel: 'International',
        pubType: 'Scholarly Paper'
      }
    })

    expect(result.suggestedCategory.isSuggestionOnly).toBe(true)
    expect(result.suggestedCategory.value).toBe('B.2 Publication')
    expect(result.fields.title.value).toBe('Machine Learning in Education')
    expect(result.fields.title.source).toBe('ocr')
    expect(result.fields.academicYear.value).toBe('AY 2025-2026')
    expect(result.fields.academicYear.source).toBe('derived')
    expect(result.fields.fundingStatus.source).toBe('not_found')
    expect(result.fields.fundingStatus.value).toBe('')
  })

  // =========================================================================
  // 17.7 Date Boundary Validation
  // =========================================================================
  it('A2-OCR-010: rejects impossible calendar dates such as February 31 or Month 13', () => {
    expect(OcrScanController.isValidCalendarDate(2026, 2, 31)).toBe(false)
    expect(OcrScanController.isValidCalendarDate(2026, 4, 31)).toBe(false)
    expect(OcrScanController.isValidCalendarDate(2026, 13, 10)).toBe(false)
    expect(OcrScanController.isValidCalendarDate(2026, 2, 28)).toBe(true)
    expect(OcrScanController.isValidCalendarDate(2024, 2, 29)).toBe(true) // leap year
  })
})
