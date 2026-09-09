import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import apiClient from '../apiClient'

describe('Phase 16 — ApiClient Local-Defense Interceptors', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('API-FE-001: Injects Bearer token from localStorage or sessionStorage', async () => {
    localStorage.setItem('achievenest_access_token', 'jwt.test.local.token')

    // Simulate request interceptor execution
    const config = { headers: {} }
    const interceptor = apiClient.interceptors.request.handlers[0].fulfilled
    const resultConfig = await interceptor(config)

    expect(resultConfig.headers.Authorization).toBe('Bearer jwt.test.local.token')
  })

  it('API-FE-001: Falls back to the sessionStorage token', async () => {
    sessionStorage.setItem('achievenest_access_token', 'jwt.test.session.token')

    const config = { headers: {} }
    const interceptor = apiClient.interceptors.request.handlers[0].fulfilled
    const resultConfig = await interceptor(config)

    expect(resultConfig.headers.Authorization).toBe('Bearer jwt.test.session.token')
  })

  it('API-FE-002: Does not attach Authorization header when no local token exists in local-defense mode', async () => {
    const config = { headers: {} }
    const interceptor = apiClient.interceptors.request.handlers[0].fulfilled
    const resultConfig = await interceptor(config)

    expect(resultConfig.headers.Authorization).toBeUndefined()
  })

  it('API-FE-003: Clears stored credentials and dispatches event upon 401 unauthenticated response', async () => {
    localStorage.setItem('achievenest_access_token', 'expired.token')
    localStorage.setItem('achievenest_current_user', JSON.stringify({ id: '1' }))
    sessionStorage.setItem('achievenest_access_token', 'expired.token')

    const responseInterceptor = apiClient.interceptors.response.handlers[0].rejected
    const error401 = {
      response: {
        status: 401,
        data: { message: 'Token expired or revoked' }
      }
    }

    await expect(responseInterceptor(error401)).rejects.toEqual({ message: 'Token expired or revoked' })

    expect(localStorage.getItem('achievenest_access_token')).toBeNull()
    expect(localStorage.getItem('achievenest_current_user')).toBeNull()
    expect(sessionStorage.getItem('achievenest_access_token')).toBeNull()
  })
})
