/**
 * verificationMetrics.js
 * Pure utility functions for calculating Program Coordinator verification metrics:
 * - Unfiltered base counts (Pending, Verified, Returned)
 * - Average review time calculation from completed submission timestamps
 */

export function calculateAverageReviewTime(submissions = []) {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    return {
      minutes: null,
      displayValue: '—',
      subtext: 'No completed review data',
      sampleSize: 0
    }
  }

  const completedReviews = submissions.filter(sub => 
    (sub.status === 'Verified' || sub.status === 'Returned' || sub.status === 'Approved') &&
    sub.submitted_at &&
    sub.reviewed_at
  )

  if (completedReviews.length === 0) {
    return {
      minutes: null,
      displayValue: '—',
      subtext: 'No completed review data',
      sampleSize: 0
    }
  }

  let totalMinutes = 0
  let validCount = 0

  completedReviews.forEach(sub => {
    const submitted = new Date(sub.submitted_at).getTime()
    const reviewed = new Date(sub.reviewed_at).getTime()
    const diffMin = Math.floor((reviewed - submitted) / (1000 * 60))
    if (!isNaN(diffMin) && diffMin >= 0) {
      totalMinutes += diffMin
      validCount += 1
    }
  })

  if (validCount === 0) {
    return {
      minutes: null,
      displayValue: '—',
      subtext: 'No completed review data',
      sampleSize: 0
    }
  }

  const avgMin = Math.round(totalMinutes / validCount)
  const hours = Math.floor(avgMin / 60)
  const mins = avgMin % 60

  let displayValue = `${avgMin}m`
  if (hours > 0) {
    displayValue = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return {
    minutes: avgMin,
    displayValue,
    subtext: `Based on ${validCount} completed review${validCount > 1 ? 's' : ''}`,
    sampleSize: validCount
  }
}

export function getUnfilteredStatusCounts(submissions = []) {
  if (!Array.isArray(submissions)) {
    return { pending: 0, verified: 0, returned: 0 }
  }

  return {
    pending: submissions.filter(s => s.status === 'Pending').length,
    verified: submissions.filter(s => s.status === 'Verified' || s.status === 'Approved').length,
    returned: submissions.filter(s => s.status === 'Returned').length
  }
}
