import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../apiClient'
import {
  fetchAwardCriteriaHierarchy,
  validateAwardCriteriaHierarchyDraft,
} from '../awardAdminService'

vi.mock('../apiClient', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../authService', () => ({ getCurrentUser: () => ({ token: 'test-token' }) }))

describe('Award criteria hierarchy API response contract', () => {
  beforeEach(() => vi.clearAllMocks())

  it('unwraps the backend data envelope when loading versions and hierarchy', async () => {
    const payload = { award: { id: 'award-1' }, active_version_id: 'v1', versions: [{ id: 'v1', hierarchy: { categories: [] } }] }
    apiClient.get.mockResolvedValue({ data: { data: payload } })

    await expect(fetchAwardCriteriaHierarchy('award-1')).resolves.toEqual(payload)
    expect(apiClient.get).toHaveBeenCalledWith('/osad/awards/award-1/criteria-hierarchy', {
      headers: { Authorization: 'Bearer test-token' },
    })
  })

  it('unwraps validation results so the editor can render validation errors', async () => {
    const payload = { valid: false, errors: ['Add at least one Category.'] }
    apiClient.post.mockResolvedValue({ data: { data: payload } })

    await expect(validateAwardCriteriaHierarchyDraft('award-1', 'draft-1')).resolves.toEqual(payload)
  })
})
