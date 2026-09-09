import { describe, it, expect, vi, beforeEach } from 'vitest'
import SecurityController from '../SecurityController.js'
import OcrScanController from '../OcrScanController.js'
import { AchievementClassificationService, RULE_REFERENCE_VERSION } from '../../services/achievementClassificationService.js'
import PersonnelAchievementController from '../PersonnelAchievementController.js'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService.js'
import AchievementModel from '../../models/AchievementModel.js'

describe('Personnel Evaluation Track — Plan A End-to-End Integration & Regression Suite (Phase A5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // =========================================================================
  // Section 3: End-to-End Happy Path Workflow (A1 -> A2 -> A3 -> A4)
  // =========================================================================
  it('executes the full end-to-end flow from evidence upload to structured persistence and reopening', async () => {
    // 1. File validation via SecurityController
    const validFile = new File(['%PDF-1.4 authentic certificate content'], 'seminar_cert.pdf', {
      type: 'application/pdf'
    })
    const fileValidation = await SecurityController.validateFileUpload(validFile)
    expect(fileValidation.isValid).toBe(true)

    // 2. OCR Scan with Zero-Fabrication Guarantees
    const ocrResponse = await OcrScanController.processDocumentScan(validFile)
    expect(ocrResponse.success).toBe(true)
    expect(ocrResponse.result.confidenceScore).toBeGreaterThanOrEqual(0)
    expect(ocrResponse.result.extractionWarnings).toBeDefined()

    // 3. User manual confirmation & Advisory Classification (Phase A3)
    const confirmedFields = {
      title: 'National AI in Higher Education Summit 2025',
      category: 'A.3 Attendance to Seminars/Trainings',
      scopeLevel: 'National',
      dateAchieved: '2025-06-18',
      issuer: 'Commission on Higher Education (CHED)'
    }

    const advisory = AchievementClassificationService.classifyAchievement(confirmedFields, ocrResponse.result)
    expect(advisory.suggestedCategory).toBe('A.3 Attendance to Seminars/Trainings')
    expect(advisory.criterionCode).toBe('A.3')
    expect(advisory.suggestedPoints).toBe(8)
    expect(advisory.isAdvisory).toBe(true)
    expect(advisory.ruleReference).toBe(RULE_REFERENCE_VERSION)

    // 4. Backend-backed persistence (Phase A1 & Phase A4)
    const mockAccId = 'acc_e2e_001'
    const mockEvId = 'ev_e2e_001'

    vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockResolvedValue({
      data: { id: mockAccId, status: 'draft' }
    })

    vi.spyOn(personnelAccomplishmentService, 'uploadEvidence').mockResolvedValue({
      data: {
        evidence: {
          id: mockEvId,
          original_filename: 'seminar_cert.pdf',
          byte_size: 1024,
          mime_type: 'application/pdf',
          checksum: 'sha256_mock_hash'
        }
      }
    })

    const payload = {
      title: confirmedFields.title,
      category: confirmedFields.category,
      category_area: 'areaA',
      domain: 'professional_development',
      issuer: confirmedFields.issuer,
      location: confirmedFields.issuer,
      date_achieved: confirmedFields.dateAchieved,
      academic_year: 'AY 2025-2026',
      scope_level: confirmedFields.scopeLevel,
      claimed_points: advisory.suggestedPoints,
      advisory_classification: advisory,
      ocr_metadata: ocrResponse.result
    }

    const createdRecord = await PersonnelAchievementController.addAchievement(payload, validFile)    
    expect(createdRecord).toBeInstanceOf(AchievementModel)
    expect(createdRecord.id).toBe(mockAccId)
    expect(createdRecord.evidence_id).toBe(mockEvId)
    expect(createdRecord.claimed_points).toBe(8)
    expect(createdRecord.advisory_classification.isAdvisory).toBe(true)

    // 5. Backend Reload / Rehydration (survives browser refresh/login)
    vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue([
      {
        id: mockAccId,
        title: confirmedFields.title,
        domain: 'professional_development',
        organizer_or_publisher: confirmedFields.issuer,
        occurrence_date: confirmedFields.dateAchieved,
        claimed_points: 8,
        status: 'draft',
        evidence: [
          { id: mockEvId, original_filename: 'seminar_cert.pdf' }
        ]
      }
    ])

    const reloadedList = await PersonnelAchievementController.loadAchievements()
    expect(reloadedList).toHaveLength(1)
    expect(reloadedList[0].id).toBe(mockAccId)
    expect(reloadedList[0].evidence_id).toBe(mockEvId)

    // 6. Evidence download / stream invocation
    const mockBlob = new Blob(['dummy pdf'], { type: 'application/pdf' })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(mockBlob)
    })

    const downloadSuccess = await personnelAccomplishmentService.downloadEvidenceBlob(mockEvId, 'downloaded_cert.pdf')
    expect(downloadSuccess).toBe(true)
  })

  // =========================================================================
  // Section 4 & 5: File-Type Validation Matrix & Security Boundaries
  // =========================================================================
  describe('File-Type Validation Matrix', () => {
    it('accepts valid PDF, JPEG, and PNG files under 10MB', async () => {
      const pdf = new File(['%PDF-content'], 'cert.pdf', { type: 'application/pdf' })
      const jpg = new File(['\xFF\xD8\xFFimage'], 'photo.jpg', { type: 'image/jpeg' })
      const png = new File(['\x89PNGimage'], 'scan.png', { type: 'image/png' })

      expect((await SecurityController.validateFileUpload(pdf)).isValid).toBe(true)
      expect((await SecurityController.validateFileUpload(jpg)).isValid).toBe(true)
      expect((await SecurityController.validateFileUpload(png)).isValid).toBe(true)
    })

    it('rejects unsupported extensions (e.g. .exe, .sh, .docx, .zip)', async () => {
      const exe = new File(['binary'], 'virus.exe', { type: 'application/x-msdownload' })
      const docx = new File(['doc content'], 'doc.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const zip = new File(['zip content'], 'archive.zip', { type: 'application/zip' })

      expect((await SecurityController.validateFileUpload(exe)).isValid).toBe(false)
      expect((await SecurityController.validateFileUpload(docx)).isValid).toBe(false)
      expect((await SecurityController.validateFileUpload(zip)).isValid).toBe(false)
    })

    it('rejects oversized files exceeding 10MB', async () => {
      const largeFile = new File([''], 'huge.pdf', { type: 'application/pdf' })
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 })

      const res = await SecurityController.validateFileUpload(largeFile)
      expect(res.isValid).toBe(false)
      expect(res.error).toContain('10MB')
    })
  })

  // =========================================================================
  // Section 6 & 7: OCR Zero-Fabrication & Manual Override
  // =========================================================================
  describe('OCR Zero-Fabrication & Manual Precedence', () => {
    it('never guesses missing dates, scope levels, or issuers from filename cues', () => {
      const text = 'This is just general text with no metadata.'
      const lines = [text]
      const extracted = OcrScanController.extractFieldsFromText(text, lines)

      expect(extracted.date).toBe('')
      expect(extracted.academicYear).toBe('')
      expect(extracted.scopeLevel).toBe('')
      expect(extracted.specificRole).toBe('')
      expect(extracted.degreeLevel).toBe('')
    })

    it('detects and flags multiple conflicting dates in text', () => {
      const multiDateText = 'Event occurred on 2024-03-15 but diploma was dated 2025-06-20.'
      const allDates = OcrScanController.extractAllDatesFromText(multiDateText)

      expect(allDates.length).toBeGreaterThanOrEqual(2)
      expect(allDates).toContain('2024-03-15')
      expect(allDates).toContain('2025-06-20')
    })
  })

  // =========================================================================
  // Section 9 & 16: Strict Architectural Separation of Concerns
  // =========================================================================
  describe('Architectural Boundaries & Separation of Concerns', () => {
    it('Plan A outputs strictly advisory claimed points and never produces evaluator-accepted points (Plan G)', () => {
      const advisory = AchievementClassificationService.classifyAchievement({
        category: 'B.4 Professional Recognition or Awards',
        awardType: 'Awardee',
        scopeLevel: 'National'
      })

      expect(advisory.suggestedPoints).toBe(40)
      expect(advisory.isAdvisory).toBe(true)
      expect(advisory.accepted_points).toBeUndefined()
      expect(advisory.final_score).toBeUndefined()
      expect(advisory.passed_retained).toBeUndefined()
    })

    it('Plan A does not classify or mutate Personnel Group or Organizational Side (Plan D)', () => {
      const model = new AchievementModel({
        title: 'Curriculum Workshop',
        category: 'A.3 Attendance to Seminars/Trainings'
      })

      const json = model.toJSON()
      expect(json.personnel_group).toBeUndefined()
      expect(json.organizational_side).toBeUndefined()
      expect(json.faculty_status).toBeUndefined()
      expect(json.reviewer_route).toBeUndefined()
      expect(json.promotion_decision).toBeUndefined()
    })
  })

  // =========================================================================
  // Section 12: Non-Blocking Duplicate Warning
  // =========================================================================
  describe('Advisory Duplicate Detection', () => {
    it('identifies exact title, date, and issuer collision and surfaces advisory warning without throwing', () => {
      const existing = [
        new AchievementModel({
          id: 'acc_existing_99',
          title: 'Regional Research Colloquium',
          date: '2025-10-15',
          issuer: 'NDMU URCO'
        })
      ]

      const check = PersonnelAchievementController.checkDuplicateWarning({
        title: 'Regional Research Colloquium',
        date_achieved: '2025-10-15',
        issuer: 'NDMU URCO'
      }, existing)

      expect(check.isDuplicate).toBe(true)
      expect(check.warningMessage).toContain('already recorded')
      expect(check.collidingAchievement.id).toBe('acc_existing_99')
    })
  })

  // =========================================================================
  // Section 13: Failure State Safety
  // =========================================================================
  describe('Failure State Safety', () => {
    it('handles evidence upload failure by throwing without committing fake local success', async () => {
      vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockResolvedValue({
        data: { id: 'acc_fail_01', status: 'draft' }
      })

      vi.spyOn(personnelAccomplishmentService, 'uploadEvidence').mockRejectedValue(
        new Error('Storage disk full error.')
      )

      const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })

      await expect(PersonnelAchievementController.addAchievement({
        title: 'Failed Upload Test'
      }, file)).rejects.toThrow('Storage disk full error.')
    })
  })
})
