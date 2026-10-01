import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiClient } = vi.hoisted(() => ({ apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../apiClient', () => ({ default: apiClient }))

import studentAchievementLifecycleService from '../studentAchievementLifecycleService'

describe('studentAchievementLifecycleService evidence boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.post.mockResolvedValue({ data: { evidence_id: 'evidence-new' } })
    apiClient.delete.mockResolvedValue({ data: { achievement_record_id: 'record-1', evidence: [] } })
  })

  it('sends replacement selections as canonical FormData without a browser path', async () => {
    const file = new File(['certificate'], 'replacement.png', { type: 'image/png' })
    await studentAchievementLifecycleService.uploadEvidence('record-1', file)

    expect(apiClient.post).toHaveBeenCalledWith('/student/achievements/record-1/evidence', expect.any(FormData))
    const body = apiClient.post.mock.calls[0][1]
    expect(body.get('file')).toBe(file)
    expect([...body.keys()]).toEqual(['file'])
  })

  it('uses only the canonical attachment-delete endpoint after an uploaded replacement is ready', async () => {
    await studentAchievementLifecycleService.removeEvidence('record-1', 'evidence-old')
    expect(apiClient.delete).toHaveBeenCalledWith('/student/achievements/record-1/evidence/evidence-old')
  })
})
