const RATING_RESULTS = {
  outstanding: 'passed',
  very_satisfactory: 'passed',
  satisfactory: 'passed',
  fair: 'not_passed',
  poor: 'not_passed'
}

export const annualReviewRatingResult = rating => RATING_RESULTS[String(rating || '').toLowerCase()] || 'pending'

export const annualReviewModalState = item => (
  item?.id
  && item.match_status === 'matched'
  && item.validation_status !== 'invalid'
  && item.state !== 'duplicate_upload'
  && item.review_1_rating
  && item.review_2_rating
    ? 'ready'
    : 'requires_attention'
)
