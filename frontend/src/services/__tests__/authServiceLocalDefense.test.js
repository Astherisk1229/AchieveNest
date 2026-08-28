import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  authenticateUser,
  fetchProfileAndCreateSession,
  getCurrentUser,
  updateUserRoleContext,
  logoutUser,
  requestPasswordReset,
  submitPasswordChange
} from '../authService'
import apiClient from '../apiClient'
import { supabase } from '../../config/supabase'

vi.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn()
    }
  }
}))

vi.mock('../apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('Phase 16 — AuthService Local-Defense Test Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('AUTH-FE-001: Rejects non-institutional emails before backend dispatch', async () => {
    await expect(authenticateUser('student@gmail.com', 'password123')).rejects.toThrow(
      'Please enter a valid NDMU institutional email (@ndmu.edu.ph).'
    )
    await expect(authenticateUser('invalid-email', 'password123')).rejects.toThrow(
      'Please enter a valid NDMU institutional email (@ndmu.edu.ph).'
    )
    expect(apiClient.post).not.toHaveBeenCalled()
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it('AUTH-FE-002: In local-defense mode, login calls POST /auth/login and bypasses Supabase', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { access_token: 'mock.jwt.token' }
    })
    apiClient.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-001',
          institutional_id: '2024-0001',
          institutional_email: 'student.a@ndmu.edu.ph',
          account_type: 'student',
          status: 'active',
          roles: ['student'],
          must_change_password: false
        }
      }
    })

    const session = await authenticateUser('student.a@ndmu.edu.ph', 'Secret123!', true)

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      institutional_email: 'student.a@ndmu.edu.ph',
      password: 'Secret123!',
      remember_me: true
    })
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
    expect(session.account_type).toBe('student')
    expect(session.token).toBe('mock.jwt.token')
  })

  it('AUTH-FE-003: Throws descriptive error when login response lacks access_token', async () => {
    apiClient.post.mockResolvedValueOnce({ data: {} })

    await expect(authenticateUser('student.a@ndmu.edu.ph', 'Secret123!')).rejects.toThrow(
      'Login succeeded but no access token was returned.'
    )
  })

  it('AUTH-FE-004: /auth/me resolution sets authoritative account_type, roles, and context', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'dean-001',
          institutional_id: 'EMP-001',
          institutional_email: 'dean.cba@ndmu.edu.ph',
          account_type: 'personnel',
          status: 'active',
          roles: ['academic_personnel', 'dean'],
          must_change_password: true
        }
      }
    })

    const session = await fetchProfileAndCreateSession('token.dean', 'dean.cba@ndmu.edu.ph', true)

    expect(session.account_type).toBe('personnel')
    expect(session.assigned_roles).toContain('personnel')
    expect(session.assigned_roles).toContain('dean')
    expect(session.must_change_password).toBe(true)
  })

  it('AUTH-FE-005: Stores credentials in localStorage when rememberMe is true', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-001',
          institutional_email: 'demo@ndmu.edu.ph',
          account_type: 'student',
          status: 'active',
          roles: ['student']
        }
      }
    })

    await fetchProfileAndCreateSession('test.token.local', 'demo@ndmu.edu.ph', true)

    expect(localStorage.getItem('achievenest_access_token')).toBe('test.token.local')
    expect(localStorage.getItem('achievenest_current_user')).toBeTruthy()
    expect(sessionStorage.getItem('achievenest_access_token')).toBeNull()
  })

  it('AUTH-FE-006: Stores credentials only in sessionStorage when rememberMe is false', async () => {
    localStorage.setItem('achievenest_access_token', 'stale.persistent.token')
    localStorage.setItem('achievenest_current_user', JSON.stringify({ id: 'stale-user' }))
    apiClient.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-002',
          institutional_email: 'demo2@ndmu.edu.ph',
          account_type: 'student',
          status: 'active',
          roles: ['student']
        }
      }
    })

    await fetchProfileAndCreateSession('test.token.session', 'demo2@ndmu.edu.ph', false)

    expect(sessionStorage.getItem('achievenest_access_token')).toBe('test.token.session')
    expect(sessionStorage.getItem('achievenest_current_user')).toBeTruthy()
    expect(localStorage.getItem('achievenest_access_token')).toBeNull()
    expect(localStorage.getItem('achievenest_current_user')).toBeNull()
  })

  it('AUTH-FE-008: Clears the provisional token when /auth/me profile resolution fails', async () => {
    apiClient.get.mockResolvedValueOnce({ data: {} })

    await expect(
      fetchProfileAndCreateSession('unresolved.token', 'demo@ndmu.edu.ph', true)
    ).rejects.toThrow('backend profile could not be resolved')

    expect(localStorage.getItem('achievenest_access_token')).toBeNull()
    expect(sessionStorage.getItem('achievenest_access_token')).toBeNull()
  })

  it('AUTH-FE-007: getCurrentUser retrieves and validates session on browser refresh', () => {
    const mockUser = {
      id: 'stud-1',
      account_type: 'student',
      assigned_roles: ['student'],
      active_role_context: 'student',
      token: 'jwt.stored.token'
    }
    localStorage.setItem('achievenest_current_user', JSON.stringify(mockUser))

    const user = getCurrentUser()
    expect(user).toBeTruthy()
    expect(user.id).toBe('stud-1')
    expect(user.account_type).toBe('student')
    expect(user.active_role_context).toBe('student')
  })

  it('AUTH-FE-008: Suspended account throws descriptive error and clears session', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-susp',
          institutional_email: 'suspended@ndmu.edu.ph',
          account_type: 'student',
          status: 'suspended',
          roles: ['student']
        }
      }
    })

    await expect(fetchProfileAndCreateSession('token.susp', 'suspended@ndmu.edu.ph')).rejects.toThrow(
      'This account has been suspended. Please contact administrative support.'
    )
    expect(localStorage.getItem('achievenest_access_token')).toBeNull()
  })

  it('AUTH-FE-009: Archived account throws descriptive error and clears session', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-arch',
          institutional_email: 'archived@ndmu.edu.ph',
          account_type: 'student',
          status: 'archived',
          roles: ['student']
        }
      }
    })

    await expect(fetchProfileAndCreateSession('token.arch', 'archived@ndmu.edu.ph')).rejects.toThrow(
      'This account has been archived and cannot access application features.'
    )
    expect(localStorage.getItem('achievenest_access_token')).toBeNull()
  })

  it('AUTH-FE-010: Local logout sends POST /auth/logout, clears storage, and does not call Supabase', async () => {
    localStorage.setItem('achievenest_access_token', 'token')
    localStorage.setItem('achievenest_current_user', JSON.stringify({ id: '1' }))
    sessionStorage.setItem('achievenest_access_token', 'token')

    apiClient.post.mockResolvedValueOnce({ data: { message: 'Logged out' } })

    await logoutUser()

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
    expect(localStorage.getItem('achievenest_access_token')).toBeNull()
    expect(localStorage.getItem('achievenest_current_user')).toBeNull()
    expect(sessionStorage.getItem('achievenest_access_token')).toBeNull()
    expect(supabase.auth.signOut).not.toHaveBeenCalled()
  })

  it('AUTH-FE-011: submitPasswordChange clears must_change_password flag upon success', async () => {
    const mockUser = {
      id: 'pers-1',
      account_type: 'personnel',
      assigned_roles: ['academic_personnel'],
      active_role_context: 'academic_personnel',
      must_change_password: true,
      token: 'jwt.token'
    }
    localStorage.setItem('achievenest_current_user', JSON.stringify(mockUser))
    apiClient.post.mockResolvedValueOnce({ data: { success: true } })

    await submitPasswordChange('NewSecret123!', 'NewSecret123!')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/change-password',
      { new_password: 'NewSecret123!', confirm_password: 'NewSecret123!' },
      { headers: { Authorization: 'Bearer jwt.token' } }
    )

    const updatedUser = getCurrentUser()
    expect(updatedUser.must_change_password).toBe(false)
  })

  it('AUTH-FE-012: requestPasswordReset posts to /password-reset-requests with institutional email', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { message: 'Reset request received by office.' }
    })

    const res = await requestPasswordReset('student.a@ndmu.edu.ph')

    expect(apiClient.post).toHaveBeenCalledWith('/password-reset-requests', {
      institutional_email: 'student.a@ndmu.edu.ph'
    })
    expect(res.success).toBe(true)
  })

  it('AUTH-FE-013: Personnel role switching is permitted only for authorized assigned roles', () => {
    const mockUser = {
      id: 'faculty-dean',
      account_type: 'personnel',
      assigned_roles: ['academic_personnel', 'dean'],
      active_role_context: 'academic_personnel'
    }
    localStorage.setItem('achievenest_current_user', JSON.stringify(mockUser))

    // Valid switch to assigned Dean role
    const switched = updateUserRoleContext('dean')
    expect(switched.active_role_context).toBe('dean')

    // Invalid switch to unassigned role
    const rejected = updateUserRoleContext('program_coordinator')
    expect(rejected.active_role_context).toBe('dean') // stays dean
  })

  it('AUTH-FE-014: Student account role switching is rejected', () => {
    const mockStudent = {
      id: 'student-1',
      account_type: 'student',
      assigned_roles: ['student'],
      active_role_context: 'student'
    }
    localStorage.setItem('achievenest_current_user', JSON.stringify(mockStudent))

    const res = updateUserRoleContext('academic_personnel')
    expect(res.active_role_context).toBe('student')
  })
})
