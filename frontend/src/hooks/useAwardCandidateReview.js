import { useCallback, useEffect, useState } from 'react'
import AwardCandidateReviewController from '../controllers/AwardCandidateReviewController'
import AwardCandidateReviewModel from '../models/AwardCandidateReviewModel'

export default function useAwardCandidateReview({ award, awardId, studentId }) {
  const authorityPending = AwardCandidateReviewModel.authorityPending(award)
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(!authorityPending)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (authorityPending) {
      setModel(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setModel(await AwardCandidateReviewController.load(awardId, studentId))
    } catch (reason) {
      setError(reason?.message || "We couldn't load this candidate review.")
    } finally {
      setLoading(false)
    }
  }, [authorityPending, awardId, studentId])

  useEffect(() => { reload() }, [reload])
  return { model, loading, error, reload, authorityPending }
}
