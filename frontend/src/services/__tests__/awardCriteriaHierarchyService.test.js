import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../apiClient'
import {
  fetchAwardCriteriaHierarchy,
  saveAwardCriteriaHierarchy,
} from '../awardAdminService'

vi.mock('../apiClient', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
vi.mock('../authService', () => ({ getCurrentUser: () => ({ token: 'test-token' }) }))

describe('Award criteria hierarchy API response contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the current hierarchy without exposing criteria versions', async () => {
    const payload = { award: { id: 'award-1' }, hierarchy: { categories: [] } }
    apiClient.get.mockResolvedValue({ data: { data: payload } })

    await expect(fetchAwardCriteriaHierarchy('award-1')).resolves.toEqual(payload)
    expect(apiClient.get).toHaveBeenCalledWith('/osad/awards/award-1/criteria-hierarchy', {
      headers: { Authorization: 'Bearer test-token' },
    })
  })

  it('saves the current hierarchy directly without creating a version', async () => {
    const hierarchy = { categories: [{ id: 'cat-1', name: 'Character' }] }
    const payload = { award: { id: 'award-1' }, hierarchy }
    apiClient.put.mockResolvedValue({ data: { data: payload } })

    await expect(saveAwardCriteriaHierarchy('award-1', hierarchy)).resolves.toEqual(payload)
    expect(apiClient.put).toHaveBeenCalledWith('/osad/awards/award-1/criteria-hierarchy', { hierarchy }, {
      headers: { Authorization: 'Bearer test-token' },
    })
  })
})
