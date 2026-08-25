import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import {
  requestPasswordReset,
  submitPasswordChange,
  getCurrentUser
} from '../authService'

vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

vi.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    }
  }
}))

describe('authService - Password Reset & Mandatory Password Change', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('rejects invalid non-NDMU email for password reset request', async () => {
    await expect(requestPasswordReset('student@gmail.com'))
      .rejects
      .toThrow('Please enter a valid NDMU institutional email (@ndmu.edu.ph).')
  })

  it('submits valid institutional email to backend endpoint', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        message: 'If an eligible account exists, your password reset request has been submitted.'
      }
    })

    const res = await requestPasswordReset('student.user@ndmu.edu.ph')
    expect(apiClient.post).toHaveBeenCalledWith('/password-reset-requests', {
      institutional_email: 'student.user@ndmu.edu.ph'
    })
    expect(res.success).toBe(true)
    expect(res.message).toContain('If an eligible account exists')
  })

  it('submits mandatory password change and clears must_change_password flag', async () => {
    const mockSession = {
      id: 'usr-1',
      account_type: 'student',
      assigned_roles: ['student'],
      active_role_context: 'student',
      must_change_password: true,
      token: 'mock-access-token'
    }
    localStorage.setItem('achievenest_current_user', JSON.stringify(mockSession))

    apiClient.post.mockResolvedValueOnce({
      data: {
        message: 'Password updated successfully.',
        must_change_password: false
      }
    })

    const res = await submitPasswordChange('NewSecurePass123!', 'NewSecurePass123!')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
      new_password: 'NewSecurePass123!',
      confirm_password: 'NewSecurePass123!'
    }, {
      headers: { Authorization: 'Bearer mock-access-token' }
    })

    const updatedUser = getCurrentUser()
    expect(updatedUser.must_change_password).toBe(false)
  })
})
