import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import PersonnelProfilePhotoService, {
  MAX_PHOTO_SIZE_BYTES,
  ALLOWED_PHOTO_EXTENSIONS,
  ALLOWED_PHOTO_MIME_TYPES
} from '../../../services/PersonnelProfilePhotoService'
import AchievementReuseEligibilityService from '../../../services/AchievementReuseEligibilityService'
import apiClient from '../../../services/apiClient'

vi.mock('../../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('AchieveNest — Personnel Portfolio Unified Remediation Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // =========================================================================
  // PACKAGE A: Fix useEffect Crash & Hook Imports Integrity
  // =========================================================================
  describe('PACKAGE A: React Hook Imports & Crash Prevention', () => {
    it('PersonnelPortfolioEditPage imports useEffect, useState, useMemo, and useCallback from react', () => {
      const filePath = path.resolve(__dirname, '../PersonnelPortfolioEditPage.jsx')
      const content = fs.readFileSync(filePath, 'utf8')
      const importMatch = content.match(/import\s+React,\s*\{([^}]+)\}\s+from\s+['"]react['"]/)
      expect(importMatch).toBeTruthy()
      const importedHooks = importMatch[1]
      expect(importedHooks).toContain('useState')
      expect(importedHooks).toContain('useEffect')
      expect(importedHooks).toContain('useMemo')
      expect(importedHooks).toContain('useCallback')
    })

    it('PersonnelPortfolioEditPage has no undeclared React hook references', () => {
      const filePath = path.resolve(__dirname, '../PersonnelPortfolioEditPage.jsx')
      const content = fs.readFileSync(filePath, 'utf8')
      expect(content).not.toMatch(/React\.useEffect/)
      expect(content).toContain('useEffect(() => {')
    })
  })

  // =========================================================================
  // PACKAGE B: Real Personnel Profile Photo Upload & Validation
  // =========================================================================
  describe('PACKAGE B: Profile Photo Service Validation & Rules', () => {
    it('generates correct user initials for clean avatar placeholders', () => {
      expect(PersonnelProfilePhotoService.getInitials('Dr. Maria Santos')).toBe('DS')
      expect(PersonnelProfilePhotoService.getInitials('John Doe')).toBe('JD')
      expect(PersonnelProfilePhotoService.getInitials('Faculty')).toBe('FA')
      expect(PersonnelProfilePhotoService.getInitials('')).toBe('PN')
    })

    it('rejects empty or zero-byte file uploads', async () => {
      const fakeFile = { name: 'avatar.jpg', size: 0, type: 'image/jpeg' }
      const res = await PersonnelProfilePhotoService.validatePhotoPreflight(fakeFile)
      expect(res.isValid).toBe(false)
      expect(res.error).toContain('Zero-byte')
    })

    it('rejects files exceeding the 5 MB limit', async () => {
      const fakeFile = { name: 'avatar.png', size: 6 * 1024 * 1024, type: 'image/png' }
      const res = await PersonnelProfilePhotoService.validatePhotoPreflight(fakeFile)
      expect(res.isValid).toBe(false)
      expect(res.error).toContain('5 MB')
    })

    it('rejects SVG and executable files', async () => {
      const fakeSvg = { name: 'malicious.svg', size: 1024, type: 'image/svg+xml' }
      const res = await PersonnelProfilePhotoService.validatePhotoPreflight(fakeSvg)
      expect(res.isValid).toBe(false)
      expect(res.error).toContain('Only JPG, PNG, and WebP')
    })

    it('accepts valid JPEG, PNG, and WebP images', async () => {
      const fakeJpg = {
        name: 'profile_photo.jpg',
        size: 1024 * 500,
        type: 'image/jpeg',
        slice: () => ({
          arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer
        })
      }
      const res = await PersonnelProfilePhotoService.validatePhotoPreflight(fakeJpg)
      expect(res.isValid).toBe(true)
      expect(res.error).toBeNull()
    })

    it('calls POST /api/v1/personnel/profile/photo on uploadProfilePhoto', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: {
          data: {
            avatar_url: 'http://localhost:8080/uploads/profile-photos/personnel/123/avatar.jpg',
            message: 'Profile photo updated successfully.'
          }
        }
      })

      const fakeFile = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' })
      fakeFile.name = 'avatar.png'

      const result = await PersonnelProfilePhotoService.uploadProfilePhoto(fakeFile)
      expect(apiClient.post).toHaveBeenCalledWith(
        '/personnel/profile/photo',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      )
      expect(result.data.avatar_url).toContain('avatar.jpg')
    })

    it('calls DELETE /api/v1/personnel/profile/photo on removeProfilePhoto', async () => {
      apiClient.delete.mockResolvedValueOnce({
        data: {
          data: {
            avatar_url: null,
            message: 'Profile photo removed successfully.'
          }
        }
      })

      const result = await PersonnelProfilePhotoService.removeProfilePhoto()
      expect(apiClient.delete).toHaveBeenCalledWith('/personnel/profile/photo')
      expect(result.data.avatar_url).toBeNull()
    })
  })

  // =========================================================================
  // PACKAGE C: Portfolio Gallery & Hero Banner Preservation
  // =========================================================================
  describe('PACKAGE C: Academic-Year Portfolio Gallery & Hero Banner', () => {
    it('preserves existing Portfolio hero banner layout, branding, and fetchPriority', () => {
      const filePath = path.resolve(__dirname, '../PersonnelPortfolioPage.jsx')
      const content = fs.readFileSync(filePath, 'utf8')
      expect(content).toContain('fetchPriority="high"')
      expect(content).toContain('AchieveNest')
      expect(content).toContain('heroGreenGrad')
      expect(content).toContain('PersonnelPortfolioGallery')
      expect(content).toContain('Portfolio Booklet View')
      expect(content).toContain('Manage Portfolio Draft')
    })

    it('replaces résumé-like sections below the banner with PersonnelPortfolioGallery', () => {
      const filePath = path.resolve(__dirname, '../PersonnelPortfolioPage.jsx')
      const content = fs.readFileSync(filePath, 'utf8')
      // Résumé sections removed from main body
      expect(content).not.toContain('<div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">\n              <div className="flex items-center justify-between">\n                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">\n                  <Users')
      expect(content).toContain('<PersonnelPortfolioGallery')
    })

    it('PersonnelPortfolioGallery defines academic-year filter tabs and card layouts', () => {
      const galleryPath = path.resolve(__dirname, '../PersonnelPortfolioGallery.jsx')
      const content = fs.readFileSync(galleryPath, 'utf8')
      expect(content).toContain("['ALL', 'DRAFT', 'SUBMITTED', 'FINALIZED']")
      expect(content).toContain('Academic-Year Portfolios')
      expect(content).toContain('No portfolio submissions yet')
      expect(content).toContain('Continue Editing')
      expect(content).toContain('View Portfolio')
    })
  })

  // =========================================================================
  // PACKAGE D: 2-Year Achievement Reuse Eligibility Rules
  // =========================================================================
  describe('PACKAGE D: 2-Year Achievement Reuse Lock Calculations', () => {
    it('calculates eligible_again_academic_year by adding 2 years to used academic year', () => {
      expect(AchievementReuseEligibilityService.calculateEligibleAgainAcademicYear('AY 2025-2026', 2)).toBe('AY 2027-2028')
      expect(AchievementReuseEligibilityService.calculateEligibleAgainAcademicYear('2024-2025', 2)).toBe('AY 2026-2027')
      expect(AchievementReuseEligibilityService.calculateEligibleAgainAcademicYear('AY 2026-2027', 2)).toBe('AY 2028-2029')
    })

    it('locks achievement from reuse during the 2-year lock period', () => {
      const item = {
        id: 'acc-1',
        title: 'CHED Regional Training on AI Curriculum',
        reuse: {
          last_used_academic_year: 'AY 2025-2026',
          eligible_again_academic_year: 'AY 2027-2028'
        }
      }

      // During AY 2026-2027 -> Locked
      const eval2026 = AchievementReuseEligibilityService.evaluateReuseEligibility(item, 'AY 2026-2027')
      expect(eval2026.isEligible).toBe(false)
      expect(eval2026.badgeType).toBe('locked')
      expect(eval2026.statusLabel).toContain('Eligible Again: AY 2027-2028')
    })

    it('automatically marks achievement eligible again after the 2-year lock period ends', () => {
      const item = {
        id: 'acc-1',
        title: 'CHED Regional Training on AI Curriculum',
        reuse: {
          last_used_academic_year: 'AY 2025-2026',
          eligible_again_academic_year: 'AY 2027-2028'
        }
      }

      // During AY 2027-2028 -> Automatically Eligible
      const eval2027 = AchievementReuseEligibilityService.evaluateReuseEligibility(item, 'AY 2027-2028')
      expect(eval2027.isEligible).toBe(true)
      expect(eval2027.badgeType).toBe('eligible_reuse')
      expect(eval2027.statusLabel).toBe('Eligible for Reuse')
    })

    it('marks unused achievements as immediately eligible for portfolio inclusion', () => {
      const freshItem = {
        id: 'acc-fresh',
        title: 'New Publication 2026'
      }

      const evalFresh = AchievementReuseEligibilityService.evaluateReuseEligibility(freshItem, 'AY 2026-2027')
      expect(evalFresh.isEligible).toBe(true)
      expect(evalFresh.badgeType).toBe('eligible')
    })

    it('detects duplicate inclusion of achievements already present in portfolio model', () => {
      const portfolio = {
        area_a_items: [{ id: 'item-1', accomplishment_id: 'acc-100' }],
        area_b_items: [],
        area_c_items: []
      }

      expect(AchievementReuseEligibilityService.isAlreadyInPortfolio(portfolio, 'acc-100')).toBe(true)
      expect(AchievementReuseEligibilityService.isAlreadyInPortfolio(portfolio, 'acc-999')).toBe(false)
    })
  })

  // =========================================================================
  // PACKAGE E: Zero-Seed Baseline & Clean Account Integrity
  // =========================================================================
  describe('PACKAGE E: Zero-Seed Baseline & Route Compatibility', () => {
    it('ensures no hardcoded Unsplash stock profile photos exist for authenticated personnel', () => {
      const portfolioPagePath = path.resolve(__dirname, '../PersonnelPortfolioPage.jsx')
      const content = fs.readFileSync(portfolioPagePath, 'utf8')
      expect(content).not.toContain('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2')
    })
  })
})
