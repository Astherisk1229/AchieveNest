import { describe, it, expect, vi, beforeEach } from 'vitest'
import PersonnelAchievementController from '../PersonnelAchievementController.js'
import SecurityController from '../SecurityController.js'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService.js'
import AchievementModel from '../../models/AchievementModel.js'

describe('Phase A1: Evidence Persistence Foundation', () => {

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  // =========================================================================
  // 18.1 Successful Upload & End-to-End Persistence
  // =========================================================================
  describe('18.1 Successful Upload & Real Persistence Flow', () => {
    it('persists a new achievement with valid PDF evidence and links backend record', async () => {
      const mockCreateRes = {
        data: { id: 'acc-uuid-101', status: 'draft' }
      }
      const mockUploadRes = {
        data: {
          message: 'Evidence uploaded and secured successfully.',
          evidence: {
            id: 'ev-uuid-201',
            accomplishment_id: 'acc-uuid-101',
            original_filename: 'phd_diploma.pdf',
            mime_type: 'application/pdf',
            detected_mime_type: 'application/pdf',
            byte_size: 1048576,
            sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            status: 'active'
          }
        }
      }

      vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockResolvedValue(mockCreateRes)
      vi.spyOn(personnelAccomplishmentService, 'uploadEvidence').mockResolvedValue(mockUploadRes)

      const fakePdfFile = new File(['%PDF-1.4 sample content'], 'phd_diploma.pdf', { type: 'application/pdf' })

      const newEntry = {
        title: 'Doctor of Philosophy in Computer Science',
        category: 'A.1 Degree/s',
        location: 'Notre Dame of Marbel University',
        date_achieved: '2025-09-15',
        claimed_points: 40,
        description: 'Completed doctoral degree with honors'
      }

      const resultModel = await PersonnelAchievementController.addAchievement(newEntry, fakePdfFile)

      expect(personnelAccomplishmentService.createAccomplishment).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Doctor of Philosophy in Computer Science',
        category: 'A.1 Degree/s',
        domain: 'professional_development',
        organizer_or_publisher: 'Notre Dame of Marbel University',
        occurrence_date: '2025-09-15',
        claimed_points: 40
      }))

      expect(personnelAccomplishmentService.uploadEvidence).toHaveBeenCalledWith('acc-uuid-101', fakePdfFile)

      expect(resultModel).toBeInstanceOf(AchievementModel)
      expect(resultModel.id).toBe('acc-uuid-101')
      expect(resultModel.evidence_id).toBe('ev-uuid-201')
      expect(resultModel.attached_file_name).toBe('phd_diploma.pdf')
      expect(resultModel.status).toBe('Pending Review')
    })

    it('persists a new achievement with valid JPG/PNG evidence and links backend record', async () => {
      const mockCreateRes = { data: { id: 'acc-uuid-102', status: 'draft' } }
      const mockUploadRes = {
        data: {
          evidence: {
            id: 'ev-uuid-202',
            accomplishment_id: 'acc-uuid-102',
            original_filename: 'speaker_certificate.png',
            mime_type: 'image/png',
            detected_mime_type: 'image/png',
            byte_size: 512000,
            sha256: 'abc123sha256hash',
            status: 'active'
          }
        }
      }

      vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockResolvedValue(mockCreateRes)
      vi.spyOn(personnelAccomplishmentService, 'uploadEvidence').mockResolvedValue(mockUploadRes)

      const fakePngFile = new File(['\x89PNG\r\n\x1a\n'], 'speaker_certificate.png', { type: 'image/png' })

      const newEntry = {
        title: 'Keynote Speaker on AI in Education',
        category: 'B.1 Guest Lecturer / Consultant / Judge',
        location: 'Philippine Computer Society',
        date_achieved: '2026-03-20',
        claimed_points: 10
      }

      const resultModel = await PersonnelAchievementController.addAchievement(newEntry, fakePngFile)

      expect(resultModel.id).toBe('acc-uuid-102')
      expect(resultModel.evidence_id).toBe('ev-uuid-202')
      expect(resultModel.attached_file_name).toBe('speaker_certificate.png')
    })
  })

  // =========================================================================
  // 18.2 File Validation (Client Pre-validation & Server Guard Contracts)
  // =========================================================================
  describe('18.2 File Validation & Security Guards', () => {
    it('rejects files exceeding the 10MB size limit', async () => {
      const oversizedBlob = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'application/pdf' })
      oversizedBlob.name = 'oversized_document.pdf'

      const validation = await SecurityController.validateFileUpload(oversizedBlob)
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('exceeds the maximum allowed limit of 10MB')
    })

    it('rejects unsupported file formats such as .docx, .zip, or .exe', async () => {
      const docxFile = new File(['PK...'], 'document.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const validation = await SecurityController.validateFileUpload(docxFile)
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('Only official PDF, JPG, or PNG supporting documents are accepted')
    })

    it('rejects empty / missing files', async () => {
      const validation = await SecurityController.validateFileUpload(null)
      expect(validation.isValid).toBe(false)
      expect(validation.error).toBe('No file selected.')
    })

    it('sanitizes malicious filenames to eliminate directory traversal paths', () => {
      expect(SecurityController.sanitizeFilename('../../etc/passwd')).toBe('passwd')
      expect(SecurityController.sanitizeFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe')
      expect(SecurityController.sanitizeFilename('certificate<script>.pdf')).toBe('certificate_script_.pdf')
    })
  })

  // =========================================================================
  // 18.3 Required Fields Validation
  // =========================================================================
  describe('18.3 Required Fields Validation', () => {
    it('requires title and date for achievement payload', async () => {
      const createSpy = vi.spyOn(personnelAccomplishmentService, 'createAccomplishment')
        .mockRejectedValue(new Error('Invalid accomplishment fields.'))

      const invalidEntry = {
        title: '',
        category: 'A.3 Attendance to Seminars/Trainings',
        date_achieved: ''
      }

      await expect(PersonnelAchievementController.addAchievement(invalidEntry, null))
        .rejects.toThrow('Invalid accomplishment fields.')
    })
  })

  // =========================================================================
  // 18.4 Failure Atomicity & Error Handling
  // =========================================================================
  describe('18.4 Failure Atomicity & Error Propagation', () => {
    it('propagates backend creation error without creating fake local success', async () => {
      vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockRejectedValue(
        new Error('Database connection failure.')
      )

      const newEntry = {
        title: 'Regional AI Conference',
        category: 'A.3 Attendance to Seminars/Trainings',
        date_achieved: '2025-10-10'
      }

      await expect(PersonnelAchievementController.addAchievement(newEntry, null))
        .rejects.toThrow('Database connection failure.')

      // Confirm nothing was persisted to localStorage
      expect(localStorage.getItem('achievenest_personnel_accomplishments')).toBeNull()
    })

    it('propagates evidence upload failure if physical storage fails', async () => {
      vi.spyOn(personnelAccomplishmentService, 'createAccomplishment').mockResolvedValue({
        data: { id: 'acc-uuid-103' }
      })
      vi.spyOn(personnelAccomplishmentService, 'uploadEvidence').mockRejectedValue(
        new Error('Failed to store uploaded file on server storage.')
      )

      const file = new File(['%PDF sample'], 'cert.pdf', { type: 'application/pdf' })
      const newEntry = {
        title: 'Regional AI Conference',
        category: 'A.3 Attendance to Seminars/Trainings',
        date_achieved: '2025-10-10'
      }

      await expect(PersonnelAchievementController.addAchievement(newEntry, file))
        .rejects.toThrow('Failed to store uploaded file on server storage.')
    })
  })

  // =========================================================================
  // 18.5 Real Evidence Streaming & Zero Placeholder Proof
  // =========================================================================
  describe('18.5 Real Evidence Streaming & Retrieval', () => {
    it('invokes authenticated evidence stream download endpoint with real blob', async () => {
      const mockBlob = new Blob(['%PDF real binary bytes'], { type: 'application/pdf' })
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: vi.fn().mockResolvedValue(mockBlob)
      })
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-uuid')
      global.URL.revokeObjectURL = vi.fn()

      const success = await personnelAccomplishmentService.downloadEvidenceBlob('ev-uuid-201', 'proof.pdf')
      expect(success).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evidence/personnel/ev-uuid-201/download'),
        expect.any(Object)
      )
    })

    it('throws error when evidence binary file is not found on server storage', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })

      await expect(personnelAccomplishmentService.downloadEvidenceBlob('missing-ev-id', 'proof.pdf'))
        .rejects.toThrow('Failed to download evidence file (Status 404)')
    })
  })

  // =========================================================================
  // 18.6 Authoritative Database Loading (Zero LocalStorage Dependency)
  // =========================================================================
  describe('18.6 Zero LocalStorage Authoritative Dependency', () => {
    it('loads achievements strictly from backend API service, ignoring empty localStorage', async () => {
      const mockAccomplishments = [
        {
          id: 'acc-1',
          title: 'Published Scopus Article',
          category: 'B.2 Publication',
          organizer_or_publisher: 'IEEE Access',
          occurrence_date: '2026-01-15',
          status: 'verified',
          claimed_points: 5,
          evidence: [
            { id: 'ev-1', original_filename: 'scopus_paper.pdf', mime_type: 'application/pdf' }
          ]
        }
      ]

      vi.spyOn(personnelAccomplishmentService, 'fetchAccomplishments').mockResolvedValue(mockAccomplishments)

      const loadedList = await PersonnelAchievementController.loadAchievements()

      expect(loadedList).toHaveLength(1)
      expect(loadedList[0]).toBeInstanceOf(AchievementModel)
      expect(loadedList[0].title).toBe('Published Scopus Article')
      expect(loadedList[0].status).toBe('Verified')
      expect(loadedList[0].evidence_id).toBe('ev-1')
      expect(loadedList[0].attached_file_name).toBe('scopus_paper.pdf')
    })

    it('deletes achievement authoritatively via backend service', async () => {
      const deleteSpy = vi.spyOn(personnelAccomplishmentService, 'deleteAccomplishment').mockResolvedValue({
        data: { message: 'Accomplishment and linked evidence deleted successfully.' }
      })

      const result = await PersonnelAchievementController.deleteAchievement('acc-1')
      expect(result).toBe(true)
      expect(deleteSpy).toHaveBeenCalledWith('acc-1')
    })
  })

  // =========================================================================
  // 18.7 Search Suggestions Indexing
  // =========================================================================
  describe('18.7 Search Suggestions Indexing', () => {
    it('computes autocomplete suggestions from active achievement models', () => {
      const mockList = [
        new AchievementModel({
          id: 'acc-1',
          title: 'Advanced Machine Learning Workshop',
          category: 'A.3 Attendance to Seminars/Trainings',
          location: 'NDMU CITE'
        }),
        new AchievementModel({
          id: 'acc-2',
          title: 'Doctor of Philosophy in Computer Science',
          category: 'A.1 Degree/s',
          location: 'Notre Dame of Marbel University'
        })
      ]

      const suggestions = PersonnelAchievementController.getSearchSuggestions('Machine', mockList)
      expect(suggestions.titles).toHaveLength(1)
      expect(suggestions.titles[0].title).toBe('Advanced Machine Learning Workshop')
      expect(suggestions.topMatch).toBe('Advanced Machine Learning Workshop')
    })
  })
})
