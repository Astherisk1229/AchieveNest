import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import {
  fetchPasswordResetRequests,
  executePasswordReset,
  rejectPasswordReset
} from '../passwordResetAdminService'

vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('passwordResetAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('fetches password reset requests with status filter', async () => {
    const mockRequests = [
      { id: 'req-1', full_name: 'Juan Dela Cruz', status: 'pending' }
    ]
    apiClient.get.mockResolvedValueOnce({
      data: { requests: mockRequests }
    })

    const result = await fetchPasswordResetRequests('pending')
    expect(apiClient.get).toHaveBeenCalledWith('/password-reset-requests', {
      params: { status: 'pending' },
      headers: {}
    })
    expect(result).toEqual(mockRequests)
  })

  it('executes password reset and returns temporary password data', async () => {
    const mockResponse = {
      message: 'Password reset executed successfully.',
      temporary_password: 'Ndmu#mockpass123',
      request_id: 'req-1'
    }
    apiClient.post.mockResolvedValueOnce({
      data: mockResponse
    })

    const result = await executePasswordReset('req-1')
    expect(apiClient.post).toHaveBeenCalledWith('/password-reset-requests/req-1/reset', {}, {
      headers: {}
    })
    expect(result.temporary_password).toBe('Ndmu#mockpass123')
  })

  it('rejects password reset with optional reason', async () => {
    const mockResponse = {
      message: 'Password reset request has been rejected.',
      request_id: 'req-2'
    }
    apiClient.post.mockResolvedValueOnce({
      data: mockResponse
    })

    const result = await rejectPasswordReset('req-2', 'In-person verification failed')
    expect(apiClient.post).toHaveBeenCalledWith('/password-reset-requests/req-2/reject', {
      reason: 'In-person verification failed'
    }, {
      headers: {}
    })
    expect(result.message).toBe('Password reset request has been rejected.')
  })
})
