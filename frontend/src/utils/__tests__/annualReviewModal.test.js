import { describe, expect, it } from 'vitest'
import { annualReviewModalState, annualReviewRatingResult } from '../annualReviewModal'

describe('annual review upload modal state', () => {
  it.each([
    ['outstanding', 'passed'],
    ['very_satisfactory', 'passed'],
    ['satisfactory', 'passed'],
    ['fair', 'not_passed'],
    ['poor', 'not_passed'],
    [null, 'pending'],
    ['very_good', 'pending']
  ])('maps %s to %s', (rating, result) => {
    expect(annualReviewRatingResult(rating)).toBe(result)
  })

  it('shows a matched complete preview as ready', () => {
    expect(annualReviewModalState({ id: 'import-1', state: 'ready', validation_status: 'valid', match_status: 'matched', review_1_rating: 'outstanding', review_2_rating: 'satisfactory' })).toBe('ready')
  })

  it('keeps a duplicate-name row preview ready when the backend matched the selected row', () => {
    const item = {
      id: 'import-jessa', state: 'ready', validation_status: 'valid', match_status: 'matched',
      personnel_match: true, matched_personnel_id: 'jessa-20239948',
      selected_personnel: { id: 'jessa-20239948', personnel_id: '20239948', name: 'Jessa Mae Morte' },
      workbook_personnel_name: 'Jessa Mae Morte', review_1_rating: 'outstanding', review_2_rating: 'outstanding',
      candidates: [{ id: 'duplicate-jessa', name: 'Jessa Mae Morte' }]
    }
    expect(annualReviewModalState(item)).toBe('ready')
  })

  it.each([
    [{ id: 'import-1', state: 'wrong_person', validation_status: 'valid', match_status: 'wrong_person', review_1_rating: 'outstanding', review_2_rating: 'outstanding' }],
    [{ id: 'import-1', state: 'ready', validation_status: 'invalid', match_status: 'matched', review_1_rating: 'outstanding', review_2_rating: 'outstanding' }],
    [{ id: 'import-1', state: 'ready', validation_status: 'valid', match_status: 'matched', review_1_rating: 'outstanding', review_2_rating: null }],
    [{ id: 'import-1', state: 'duplicate_upload', validation_status: 'valid', match_status: 'matched', review_1_rating: 'outstanding', review_2_rating: 'outstanding' }]
  ])('blocks an unsafe preview', item => {
    expect(annualReviewModalState(item)).toBe('requires_attention')
  })
})
