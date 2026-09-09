import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import ChangePasswordPage from '../../common/ChangePasswordPage'
import RouteAccessController from '../../../controllers/RouteAccessController'
import * as authService from '../../../services/authService'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

vi.mock('../../../services/authService', () => ({
  submitPasswordChange: vi.fn().mockResolvedValue({ success: true }),
  logoutUser: vi.fn().mockResolvedValue(true),
  getCurrentUser: vi.fn().mockReturnValue({
    id: 'usr-001',
    account_type: 'student',
    must_change_password: true,
    account_lifecycle_status: 'pending_first_login',
    required_next_action: 'change_password'
  })
}))

describe('Plan 07 Phase 6 — Mandatory First-Login Password Change & Route Gate Test Suite', () => {
  describe('1. ChangePasswordPage Markup & Accessible Fields', () => {
    it('P6-UI-001: Renders mandatory change password heading and three labeled fields', () => {
      const html = renderToString(<ChangePasswordPage />)

      expect(html).toContain('Change Your Password')
      expect(html).toContain('Mandatory First-Login Setup')
      expect(html).toContain('Current Temporary Password')
      expect(html).toContain('New Personal Password')
      expect(html).toContain('Confirm New Password')
      expect(html).toContain('Minimum 8 characters')
      expect(html).toContain('Uppercase and lowercase letters')
      expect(html).toContain('At least one number')
      expect(html).toContain('At least one special character')
      expect(html).toContain('Set New Password')
    })
  })

  describe('2. RouteAccessController & Lifecycle Gate Enforcement', () => {
    it('P6-ROUTE-001: Denies protected portal access when user has must_change_password = true', () => {
      const pendingStudent = {
        id: 'usr-student-001',
        account_type: 'student',
        must_change_password: true,
        account_lifecycle_status: 'pending_first_login',
        required_next_action: 'change_password'
      }

      // RouteAccessController redirects pending users to /change-password
      const redirect = RouteAccessController.resolveRedirect(pendingStudent)
      expect(redirect).toBe('/change-password')
    })

    it('P6-ROUTE-002: Denies protected portal access for personnel with must_change_password = true', () => {
      const pendingPersonnel = {
        id: 'usr-pers-001',
        account_type: 'personnel',
        must_change_password: true,
        account_lifecycle_status: 'pending_first_login',
        required_next_action: 'change_password'
      }

      const redirect = RouteAccessController.resolveRedirect(pendingPersonnel)
      expect(redirect).toBe('/change-password')
    })

    it('P6-ROUTE-003: Releases active student to /student/dashboard after must_change_password = false', () => {
      const activeStudent = {
        id: 'usr-student-001',
        account_type: 'student',
        must_change_password: false,
        account_lifecycle_status: 'active',
        required_next_action: 'none'
      }

      const redirect = RouteAccessController.resolveRedirect(activeStudent)
      expect(redirect).toBe('/student/dashboard')
    })
  })
})
