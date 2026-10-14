import { describe, expect, it } from 'vitest'
import { annualReviewRequestError } from '../annualReviewError'

describe('annualReviewRequestError', () => {
  it('preserves an API error after the shared client unwraps the Axios response', () => {
    const result = annualReviewRequestError({
      error: {
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'You must change your temporary password before accessing this resource.'
      }
    }, 'Annual reviews could not be loaded.')

    expect(result.message).toBe('You must change your temporary password before accessing this resource.')
  })

  it('preserves CodeIgniter server error messages', () => {
    const result = annualReviewRequestError({
      messages: { error: 'Unexpected error retrieving dean annual reviews.' }
    }, 'Annual reviews could not be loaded.')

    expect(result.message).toBe('Unexpected error retrieving dean annual reviews.')
  })

  it('uses the caller fallback when the response has no usable detail', () => {
    const result = annualReviewRequestError({}, 'Annual reviews could not be loaded.')

    expect(result.message).toBe('Annual reviews could not be loaded.')
  })
})
