import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../apiClient'
import { lifecycleService } from '../lifecycleService'

vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('lifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resets an account password only after identity verification', async () => {
    const resetCredential = {
      action: 'administrative_reset',
      profile_id: 'student-uuid-001',
      owner_type: 'student',
      temporary_password: 'Ndmu#ServerGenerated123',
      account_lifecycle_status: 'pending_first_login',
      must_change_password: true,
      required_next_action: 'change_password'
    }
    apiClient.post.mockResolvedValueOnce({ data: resetCredential })

    const result = await lifecycleService.resetTemporaryPassword('student-uuid-001')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/accounts/student-uuid-001/reset-temporary-password',
      { verified_identity: true }
    )
    expect(result).toEqual(resetCredential)
  })
})
