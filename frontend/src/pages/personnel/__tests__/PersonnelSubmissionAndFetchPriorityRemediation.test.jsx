import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import * as personnelPortfolioService from '../../../services/personnelPortfolioService'
import apiClient from '../../../services/apiClient'

vi.mock('../../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('Personnel Submission API & React fetchPriority Remediation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. personnelPortfolioService Contract & Empty State Safety', () => {
    it('returns empty submission structure gracefully when server returns submission: null', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            submission: null,
            status: 'DRAFT',
            items_count: 0,
            items: []
          }
        }
      })

      const res = await personnelPortfolioService.getLatestSubmission()
      expect(res.data.submission).toBeNull()
      expect(res.data.status).toBe('DRAFT')
      expect(res.data.items_count).toBe(0)
      expect(res.data.items).toEqual([])
    })

    it('returns empty versions array when server returns no history', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            evaluation_root_id: null,
            versions: [],
            total_versions: 0,
            current_version_number: 0
          }
        }
      })

      const res = await personnelPortfolioService.getSubmissionHistory()
      expect(res.data.versions).toEqual([])
      expect(res.data.total_versions).toBe(0)
    })

    it('handles query parameters without errors', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            versions: [],
            total_versions: 0
          }
        }
      })

      const res = await personnelPortfolioService.getSubmissionHistory('mock-profile-id')
      expect(res.data.versions).toEqual([])
    })
  })

  describe('2. fetchPriority React DOM Attribute Invariant Verification', () => {
    const checkFileForFetchPriority = (filePath) => {
      const fullPath = path.resolve(__dirname, '../../../../', filePath)
      const content = fs.readFileSync(fullPath, 'utf8')
      const invalidMatches = content.match(/\bfetchpriority=/g)
      return {
        hasInvalid: Boolean(invalidMatches && invalidMatches.length > 0),
        invalidCount: invalidMatches ? invalidMatches.length : 0,
        content
      }
    }

    it('PersonnelPortfolioPage has no lowercase fetchpriority attribute', () => {
      const check = checkFileForFetchPriority('src/pages/personnel/PersonnelPortfolioPage.jsx')
      expect(check.hasInvalid).toBe(false)
      expect(check.content).toContain('fetchPriority="high"')
    })

    it('StudentPortfolioPage has no lowercase fetchpriority attribute', () => {
      const check = checkFileForFetchPriority('src/pages/student/StudentPortfolioPage.jsx')
      expect(check.hasInvalid).toBe(false)
      expect(check.content).toContain('fetchPriority="high"')
    })

    it('Topbar has no lowercase fetchpriority attribute', () => {
      const check = checkFileForFetchPriority('src/components/layout/Topbar.jsx')
      expect(check.hasInvalid).toBe(false)
      expect(check.content).toContain('fetchPriority="high"')
    })
  })

  describe('3. Hook Loop Prevention Guard Verification', () => {
    it('usePersonnelPortfolio defines stable profileKey memo and inFlightRef guards', () => {
      const hookPath = path.resolve(__dirname, '../../../hooks/usePersonnelPortfolio.js')
      const content = fs.readFileSync(hookPath, 'utf8')
      expect(content).toContain('profileKey')
      expect(content).toContain('inFlightRef')
    })
  })
})
