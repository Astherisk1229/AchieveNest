export const isEvaluationItemReviewed = item => {
  const verification = item?.verificationStatus ?? item?.verification_status
  const rating = item?.ratingStatus ?? item?.rating_status
  return verification === 'ineligible' || verification === 'needs_revision' ||
    (verification === 'verified' && rating === 'rated')
}

export const nextUnreviewedEvaluationItem = (items, currentId) => {
  const currentIndex = items.findIndex(item => item.id === currentId)
  for (let step = 1; step < items.length; step += 1) {
    const candidate = items[(currentIndex + step) % items.length]
    if (!isEvaluationItemReviewed(candidate)) return candidate
  }
  return null
}
