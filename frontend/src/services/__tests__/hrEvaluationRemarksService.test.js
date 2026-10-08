import { beforeEach, describe, expect, it, vi } from 'vitest'

const { patchRequest } = vi.hoisted(() => ({ patchRequest: vi.fn() }))
vi.mock('../apiClient', () => ({ default: { patch: (...args) => patchRequest(...args) } }))

import hrEvaluationService from '../hrEvaluationService'

describe('evaluator remarks API integration', () => {
  beforeEach(() => patchRequest.mockReset())

  it('saves editable remarks through the remarks-only route and unwraps the response', async () => {
    patchRequest.mockResolvedValue({ data: { data: { evaluator_remarks: 'Evidence verified.' } } })
    const result = await hrEvaluationService.saveItemRemarks('eval / 1', 'item-2', 'Evidence verified.')
    expect(patchRequest).toHaveBeenCalledWith('/reviewer/evaluations/eval%20%2F%201/items/item-2/remarks', { evaluator_remarks: 'Evidence verified.' })
    expect(result.data.evaluator_remarks).toBe('Evidence verified.')
  })

  it('only sends configured scoring values through the rating API when evaluator judgment is enabled', async () => {
    patchRequest.mockResolvedValue({ data: { data: { awarded_points: 8 } } })
    await hrEvaluationService.rateItem('eval-1', 'item-1', 'National level verified.')
    expect(patchRequest).toHaveBeenCalledWith('/reviewer/evaluations/eval-1/items/item-1/rate', { evaluator_remarks: 'National level verified.' })
  })
})
