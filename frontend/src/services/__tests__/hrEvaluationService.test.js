import { beforeEach, describe, expect, it, vi } from 'vitest'
import apiClient from '../apiClient'
import hrEvaluationService from '../hrEvaluationService'

vi.mock('../apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn() }
}))

describe('hrEvaluationService ranking-cycle workspace', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the selected cycle, personnel type, and stage projection', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { stage: 'submissions', rows: [] } })

    const result = await hrEvaluationService.workspace('cycle/2026', 'non-teaching-faculty', 'submissions')

    expect(apiClient.get).toHaveBeenCalledWith('/hr/ranking-cycles/cycle%2F2026/tracks/non-teaching-faculty/workspace/submissions')
    expect(result).toEqual({ stage: 'submissions', rows: [] })
  })
})
