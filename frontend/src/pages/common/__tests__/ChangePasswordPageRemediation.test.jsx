import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import ChangePasswordPage from '../ChangePasswordPage'
import apiClient from '../../../services/apiClient'
import {
  submitPasswordChange,
  getCurrentUser,
  setStoredToken,
  getStoredToken,
  getAuthUser
} from '../../../services/authService'
import RouteAccessController from '../../../controllers/RouteAccessController'

vi.mock('../../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

vi.mock('../../../config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    }
  }
}))

describe('ChangePasswordPage & authService Remediation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('verifies setStoredToken and getStoredToken are properly defined and preserve storage medium', () => {
    expect(typeof setStoredToken).toBe('function')
    expect(typeof getStoredToken).toBe('function')

    // Test local storage
    setStoredToken('test-token-local', true)
    expect(localStorage.getItem('achievenest_access_token')).toBe('test-token-local')
    expect(getStoredToken()).toBe('test-token-local')

    // Test session storage
    setStoredToken('test-token-session', false)
    expect(sessionStorage.getItem('achievenest_access_token')).toBe('test-token-session')
  })

  it('submitPasswordChange executes without ReferenceError and handles token rotation & rehydration', async () => {
    const mockUser = {
      id: 'usr-student-1',
      institutional_id: '2026-0012',
      institutional_email: 'student.test@ndmu.edu.ph',
      account_type: 'student',
      assigned_roles: ['student'],
      active_role_context: 'student',
      must_change_password: true,
      token: 'old-temp-token'
    }
    localStorage.setItem('achievenest_current_user', JSON.stringify(mockUser))
    localStorage.setItem('achievenest_access_token', 'old-temp-token')

    apiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        access_token: 'new-permanent-token',
        must_change_password: false,
        account_lifecycle_status: 'active'
      }
    })

    apiClient.get.mockResolvedValueOnce({
      data: {
        authenticated: true,
        user: {
          id: 'usr-student-1',
          institutional_id: '2026-0012',
          institutional_email: 'student.test@ndmu.edu.ph',
          account_type: 'student',
          status: 'active',
          must_change_password: false,
          roles: ['student']
        }
      }
    })

    // Execute submitPasswordChange without any undefined reference error
    const result = await submitPasswordChange('MyNewPass123!', 'MyNewPass123!', 'OldTempPass123!')

    expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
      current_password: 'OldTempPass123!',
      new_password: 'MyNewPass123!',
      confirm_password: 'MyNewPass123!',
      new_password_confirmation: 'MyNewPass123!'
    }, {
      headers: { Authorization: 'Bearer old-temp-token' }
    })

    // Token should be updated to new-permanent-token
    expect(getStoredToken()).toBe('new-permanent-token')

    // Local user snapshot should reflect must_change_password = false
    const updatedUser = getCurrentUser()
    expect(updatedUser.must_change_password).toBe(false)
    expect(updatedUser.account_lifecycle_status).toBe('active')
  })

  it('renders ChangePasswordPage with all required UI inputs and policy rules', () => {
    const mockUser = {
      id: 'usr-pers-1',
      account_type: 'personnel',
      assigned_roles: ['personnel'],
      must_change_password: true,
      token: 'temp-token'
    }
    localStorage.setItem('achievenest_current_user', JSON.stringify(mockUser))

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
    expect(html).toContain('Passwords match')
    expect(html).toContain('Set New Password')
  })

  it('RouteAccessController resolves correct post-change routes across all account types', () => {
    // Student
    expect(RouteAccessController.resolveRedirect({ account_type: 'student', must_change_password: false })).toBe('/student/dashboard')
    // HR Admin
    expect(RouteAccessController.resolveRedirect({ account_type: 'hr_admin', must_change_password: false })).toBe('/hr/dashboard')
    // OSAD Admin
    expect(RouteAccessController.resolveRedirect({ account_type: 'osad_admin', must_change_password: false })).toBe('/osad/dashboard')
    // Personnel
    expect(RouteAccessController.resolveRedirect({ account_type: 'personnel', must_change_password: false })).toBe('/personnel/dashboard')

    // Traps when must_change_password is true
    expect(RouteAccessController.resolveRedirect({ account_type: 'student', must_change_password: true })).toBe('/change-password')
    expect(RouteAccessController.resolveRedirect({ account_type: 'personnel', must_change_password: true })).toBe('/change-password')
    expect(RouteAccessController.resolveRedirect({ account_type: 'hr_admin', must_change_password: true })).toBe('/change-password')
    expect(RouteAccessController.resolveRedirect({ account_type: 'osad_admin', must_change_password: true })).toBe('/change-password')
  })

  it('verifies getAuthUser rehydrates session correctly when token exists', async () => {
    localStorage.setItem('achievenest_access_token', 'rehydrate-token')
    localStorage.setItem('achievenest_current_user', JSON.stringify({
      id: 'usr-rehydrate',
      account_type: 'personnel',
      token: 'rehydrate-token'
    }))

    apiClient.get.mockResolvedValueOnce({
      data: {
        authenticated: true,
        user: {
          id: 'usr-rehydrate',
          account_type: 'personnel',
          status: 'active',
          must_change_password: false,
          roles: ['personnel']
        }
      }
    })

    const user = await getAuthUser()
    expect(user.id).toBe('usr-rehydrate')
    expect(user.must_change_password).toBe(false)
  })

  it('rejects password change immediately with descriptive error when token is absent', async () => {
    localStorage.clear()
    sessionStorage.clear()

    await expect(submitPasswordChange('NewSecurePass123!', 'NewSecurePass123!', 'TempPass123!'))
      .rejects
      .toThrow(/authentication session has expired or is invalid/i)

    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('retrieves token from getStoredToken when currentUser has no direct token attribute', async () => {
    localStorage.setItem('achievenest_access_token', 'stored-only-token')
    localStorage.setItem('achievenest_current_user', JSON.stringify({
      id: 'usr-pers-notoken',
      account_type: 'personnel',
      must_change_password: true
    }))

    apiClient.post.mockResolvedValueOnce({
      data: {
        success: true,
        access_token: 'rotated-token',
        must_change_password: false
      }
    })

    await submitPasswordChange('NewSecurePass123!', 'NewSecurePass123!', 'TempPass123!')

    expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
      current_password: 'TempPass123!',
      new_password: 'NewSecurePass123!',
      confirm_password: 'NewSecurePass123!',
      new_password_confirmation: 'NewSecurePass123!'
    }, {
      headers: { Authorization: 'Bearer stored-only-token' }
    })
  })
})
