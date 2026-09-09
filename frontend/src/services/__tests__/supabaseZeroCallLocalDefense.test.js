import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authenticateUser, logoutUser } from '../authService'
import apiClient from '../apiClient'
import { supabase } from '../../config/supabase'

vi.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}))

vi.mock('../apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { handlers: [{ fulfilled: vi.fn((c) => c) }] },
      response: { handlers: [{ fulfilled: vi.fn((r) => r), rejected: vi.fn((e) => e) }] }
    }
  }
}))

describe('Phase 16 — FE-LOCAL-SUPA-001: Supabase Zero-Call Local Defense Test', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('FE-LOCAL-SUPA-001: Guarantees ZERO calls to Supabase Auth methods throughout local authentication cycle', async () => {
    // 1. Local Login
    apiClient.post.mockResolvedValueOnce({
      data: { access_token: 'local.jwt.proof' }
    })
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

    await authenticateUser('demo@ndmu.edu.ph', 'SecretPass123!')

    // 2. Local Logout
    apiClient.post.mockResolvedValueOnce({ data: { message: 'ok' } })
    await logoutUser()

    // Assert absolute zero calls to Supabase
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(0)
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(0)
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(0)
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(0)
  })
})
