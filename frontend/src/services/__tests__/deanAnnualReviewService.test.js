import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../apiClient'
import { fetchAnnualReviewHistory, previewAnnualReviewImports } from '../deanAnnualReviewService'

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}))

describe('deanAnnualReviewService annual-review upload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends browser-owned multipart data with the row-level target', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { imports: [] } })
    const file = new File(['xlsx'], 'annual-review.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    await previewAnnualReviewImports([file], 'period-1', 'person-1')

    const [url, body, config] = apiClient.post.mock.calls[0]
    expect(url).toBe('/annual-review-imports/preview')
    expect(body).toBeInstanceOf(FormData)
    expect(body.getAll('files[]')).toEqual([file])
    expect(body.get('evaluation_period_id')).toBe('period-1')
    expect(body.get('expected_personnel_profile_id')).toBe('person-1')
    expect(config).toEqual({ headers: { 'Content-Type': undefined } })
  })

  it('requests every confirmed version for the active evaluation period', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: [
      { id: 'current', superseded_at: null },
      { id: 'previous', superseded_at: '2026-09-14 10:00:00' }
    ] } })

    const history = await fetchAnnualReviewHistory('person-1', 'period-1')

    expect(apiClient.get).toHaveBeenCalledWith('/annual-review-imports/history/person-1', {
      params: { evaluation_period_id: 'period-1' }
    })
    expect(history.map(row => row.id)).toEqual(['current', 'previous'])
  })
})
