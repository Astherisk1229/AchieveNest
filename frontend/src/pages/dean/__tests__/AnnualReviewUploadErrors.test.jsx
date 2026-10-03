import { describe, expect, it } from 'vitest'
import { annualReviewRequestError } from '../../../utils/annualReviewError'

describe('annual-review upload error messages', () => {
  it('preserves a structured backend error after the API interceptor unwraps it', () => {
    expect(annualReviewRequestError({ error: { code: 'UNSUPPORTED_TEMPLATE', message: 'Required worksheet is missing.' } })).toEqual({
      title: 'Unsupported annual review format',
      message: 'Required worksheet is missing.'
    })
  })

  it('uses connection guidance only for an actual network failure', () => {
    expect(annualReviewRequestError({ isNetworkError: true })).toEqual({
      title: 'Unable to reach the server',
      message: "We couldn't connect to AchieveNest. Check your connection and try again."
    })
  })

  it('reports the 10 MB application limit specifically', () => {
    expect(annualReviewRequestError({ error: { code: 'UPLOAD_TOO_LARGE', message: 'discarded' } })).toEqual({
      title: 'Workbook is too large',
      message: 'Maximum file size: 10 MB. Choose another file.'
    })
  })
})
