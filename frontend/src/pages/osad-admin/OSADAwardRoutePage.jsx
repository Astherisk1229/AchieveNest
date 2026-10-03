import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { fetchAwards } from '../../services/awardAdminService'
import { OSADErrorState, OSADLoadingState } from '../../components/osad/OSADStateBlock'
import OSADAwardsAndCriteriaPage from './OSADAwardsAndCriteriaPage'
import OSADAwardDetailPage from './OSADAwardDetailPage'
import OSADEvaluationSummaryView from './OSADEvaluationSummaryView'

export default function OSADAwardRoutePage({ view = 'catalog' }) {
  const navigate = useNavigate()
  const { awardId, studentId } = useParams()
  const [award, setAward] = useState(null)
  const [loading, setLoading] = useState(view !== 'catalog')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (view === 'catalog' || view === 'candidates') return

    let active = true
    setLoading(true)
    setError(null)

    fetchAwards()
      .then((items) => {
        if (!active) return
        const match = Array.isArray(items) ? items.find((item) => String(item.id) === String(awardId)) : null
        if (!match) throw new Error('The requested award is unavailable or no longer visible.')
        setAward(match)
      })
      .catch((err) => active && setError(err.message || 'Unable to load the requested award.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [awardId, view])

  // Potential candidates now live in the Award Candidates module, filtered to this award.
  if (view === 'candidates') {
    return <Navigate to={`/osad/candidates?award=${encodeURIComponent(awardId || '')}`} replace />
  }

  if (view === 'catalog') {
    return (
      <OSADAwardsAndCriteriaPage onSelectAward={(item) => navigate(`/osad/awards/${item.id}`)} />
    )
  }

  if (loading) return <OSADLoadingState message="Loading award workspace…" />
  if (error || !award) {
    return <OSADErrorState title="Award unavailable" message={error || 'The award could not be found.'} onRetry={() => navigate('/osad/awards')} retryLabel="Return to awards" />
  }

  const catalog = () => navigate('/osad/awards')
  const detail = () => navigate(`/osad/awards/${award.id}`)
  const candidates = () => navigate(`/osad/candidates?award=${encodeURIComponent(award.id)}`)

  if (view === 'detail') {
    return <OSADAwardDetailPage award={award} onCatalog={catalog} onOpenCandidates={candidates} />
  }

  // View-only Student Evaluation Summary for this award (no manual scoring or decisions).
  return <OSADEvaluationSummaryView award={award} studentId={studentId} onBack={candidates} onAward={detail} onCatalog={catalog} />
}
