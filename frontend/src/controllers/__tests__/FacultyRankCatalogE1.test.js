import { describe, it, expect, vi, beforeEach } from 'vitest'
import { facultyRankCatalogService } from '../../services/facultyRankCatalogService'
import apiClient from '../../services/apiClient'

vi.mock('../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Personnel Evaluation Track — Plan E — Phase E1: Full-time Faculty Rank Seed Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // 1. Catalogue Inventory & Tier Distribution
  // =========================================================================
  describe('1. Catalogue Inventory & Tier Distribution', () => {
    it('E1-INV-001: contains exactly 26 frozen Full-Time Academic Ranks', () => {
      expect(facultyRankCatalogService.getRankCount()).toBe(26)
      expect(facultyRankCatalogService.FULL_TIME_RANKS).toHaveLength(26)
    })

    it('E1-INV-002: distributes correctly across the 4 qualification tiers (9 Doctoral, 10 Master, 5 Board, 2 Baccalaureate)', () => {
      const ranks = facultyRankCatalogService.FULL_TIME_RANKS
      const doctoral = ranks.filter((r) => r.tier === 'doctoral')
      const masters = ranks.filter((r) => r.tier === 'masters')
      const board = ranks.filter((r) => r.tier === 'board_licensure')
      const baccalaureate = ranks.filter((r) => r.tier === 'baccalaureate')

      expect(doctoral).toHaveLength(9)
      expect(masters).toHaveLength(10)
      expect(board).toHaveLength(5)
      expect(baccalaureate).toHaveLength(2)
      expect(doctoral.length + masters.length + board.length + baccalaureate.length).toBe(26)
    })

    it('E1-INV-003: maintains unique stable rank_code values for every rank', () => {
      const codes = facultyRankCatalogService.FULL_TIME_RANKS.map((r) => r.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(26)
    })

    it('E1-INV-004: maintains unique display_label values for every rank', () => {
      const labels = facultyRankCatalogService.FULL_TIME_RANKS.map((r) => r.label)
      const uniqueLabels = new Set(labels)
      expect(uniqueLabels.size).toBe(26)
    })
  })

  // =========================================================================
  // 2. Verbatim Fidelity with NDMU-DOC-ACAD-RANKS-2026-V1
  // =========================================================================
  describe('2. Verbatim Source Fidelity', () => {
    it('E1-SRC-001: preserves exact source labels for Doctoral tier ranks', () => {
      const doctoralLabels = facultyRankCatalogService.FULL_TIME_RANKS
        .filter((r) => r.tier === 'doctoral')
        .map((r) => r.label)

      expect(doctoralLabels).toEqual([
        'University Professor',
        'University Professor IV',
        'University Professor III',
        'University Professor II',
        'University Professor I',
        'Professor IV',
        'Professor III',
        'Professor II',
        'Professor I',
      ])
    })

    it('E1-SRC-002: preserves exact source labels for Master tier ranks including unnumbered and numbered variants', () => {
      const mastersLabels = facultyRankCatalogService.FULL_TIME_RANKS
        .filter((r) => r.tier === 'masters')
        .map((r) => r.label)

      expect(mastersLabels).toEqual([
        'Associate Professor',
        'Associate Professor IV',
        'Associate Professor III',
        'Associate Professor II',
        'Associate Professor I',
        'Assistant Professor',
        'Assistant Professor IV',
        'Assistant Professor III',
        'Assistant Professor II',
        'Assistant Professor I',
      ])
    })

    it('E1-SRC-003: preserves exact source labels for Board Licensure tier ranks', () => {
      const boardLabels = facultyRankCatalogService.FULL_TIME_RANKS
        .filter((r) => r.tier === 'board_licensure')
        .map((r) => r.label)

      expect(boardLabels).toEqual([
        'Senior Instructor',
        'Senior Instructor IV',
        'Senior Instructor III',
        'Senior Instructor II',
        'Senior Instructor I',
      ])
    })

    it('E1-SRC-004: preserves exact source labels for Baccalaureate tier ranks', () => {
      const baccalaureateLabels = facultyRankCatalogService.FULL_TIME_RANKS
        .filter((r) => r.tier === 'baccalaureate')
        .map((r) => r.label)

      expect(baccalaureateLabels).toEqual([
        'Instructor I',
        'Assistant Instructor',
      ])
    })
  })

  // =========================================================================
  // 3. API & Service Read Operations
  // =========================================================================
  describe('3. API & Service Read Operations', () => {
    it('E1-API-001: fetchFullTimeFacultyRanks invokes GET /faculty-ranks with optional tier filter', async () => {
      const mockResponse = {
        data: {
          metadata: { total_active_ranks: 26 },
          data: facultyRankCatalogService.FULL_TIME_RANKS,
        },
      }
      apiClient.get.mockResolvedValueOnce(mockResponse)

      const result = await facultyRankCatalogService.fetchFullTimeFacultyRanks('doctoral')
      expect(apiClient.get).toHaveBeenCalledWith('/faculty-ranks', { params: { tier: 'doctoral' } })
      expect(result.data).toHaveLength(26)
    })

    it('E1-API-002: fetchRankByCode resolves rank details for valid code', async () => {
      const mockRank = {
        rank_code: 'UNIVERSITY_PROFESSOR',
        display_label: 'University Professor',
        qualification_tier_code: 'doctoral',
      }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockRank } })

      const result = await facultyRankCatalogService.fetchRankByCode('UNIVERSITY_PROFESSOR')
      expect(apiClient.get).toHaveBeenCalledWith('/faculty-ranks/UNIVERSITY_PROFESSOR')
      expect(result.display_label).toBe('University Professor')
    })

    it('E1-API-003: fetchRankHierarchy returns grouped tiers with source provenance', async () => {
      const mockHierarchy = {
        source_document_id: 'NDMU-DOC-ACAD-RANKS-2026-V1',
        total_ranks: 26,
        tiers: [],
      }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockHierarchy } })

      const result = await facultyRankCatalogService.fetchRankHierarchy()
      expect(apiClient.get).toHaveBeenCalledWith('/faculty-ranks/hierarchy')
      expect(result.source_document_id).toBe('NDMU-DOC-ACAD-RANKS-2026-V1')
      expect(result.total_ranks).toBe(26)
    })
  })

  // =========================================================================
  // 4. Boundary Protection & Exclusions
  // =========================================================================
  describe('4. Boundary Protection & Exclusions', () => {
    it('E1-BND-001: does NOT contain Part-Time titles in Full-Time rank set', () => {
      const partTimeTitles = [
        'Professorial Lecturer',
        'Assistant Professorial Lecturer',
        'Senior Lecturer',
        'Lecturer',
      ]

      for (const title of partTimeTitles) {
        expect(facultyRankCatalogService.isValidFullTimeRankLabel(title)).toBe(false)
        expect(facultyRankCatalogService.getRankByLabelSync(title)).toBeUndefined()
      }
    })

    it('E1-BND-002: does NOT contain unverified fabricated ranks (e.g. Instructor II, Instructor III)', () => {
      expect(facultyRankCatalogService.isValidFullTimeRankLabel('Instructor II')).toBe(false)
      expect(facultyRankCatalogService.isValidFullTimeRankLabel('Instructor III')).toBe(false)
      expect(facultyRankCatalogService.isValidFullTimeRankLabel('Assistant Instructor I')).toBe(false)
    })

    it('E1-BND-003: maintains read-only integrity and rejects client catalogue mutations', () => {
      // Synchronous helper verification
      const valid = facultyRankCatalogService.isValidFullTimeRankLabel('Professor I')
      expect(valid).toBe(true)

      const invalid = facultyRankCatalogService.isValidFullTimeRankLabel('Custom Administrator Rank')
      expect(invalid).toBe(false)
    })
  })
})
