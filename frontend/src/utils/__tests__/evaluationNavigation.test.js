import { describe, expect, it } from 'vitest'
import { isEvaluationItemReviewed, nextUnreviewedEvaluationItem } from '../evaluationNavigation'

describe('evaluation decision navigation', () => {
  const items = [
    { id: 'a', verification_status: 'pending' },
    { id: 'b', verificationStatus: 'ineligible', ratingStatus: 'not_applicable' },
    { id: 'c', verification_status: 'verified', rating_status: 'rated' },
    { id: 'd', verificationStatus: 'verified', ratingStatus: 'unrated' },
  ]

  it('counts saved approvals and rejections but keeps incomplete ratings unresolved', () => {
    expect(items.map(isEvaluationItemReviewed)).toEqual([false, true, true, false])
  })

  it('skips reviewed items and wraps to the next unresolved item', () => {
    expect(nextUnreviewedEvaluationItem(items, 'a')?.id).toBe('d')
    expect(nextUnreviewedEvaluationItem(items, 'd')?.id).toBe('a')
  })

  it('stays on the current item when every other decision is complete', () => {
    expect(nextUnreviewedEvaluationItem(items.slice(0, 3), 'a')).toBeNull()
  })
})
