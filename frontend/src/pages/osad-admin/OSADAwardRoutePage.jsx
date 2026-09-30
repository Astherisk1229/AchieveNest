import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAwards } from '../../services/awardAdminService'
import { OSADErrorState, OSADLoadingState } from '../../components/osad/OSADStateBlock'
import OSADAwardsAndCriteriaPage from './OSADAwardsAndCriteriaPage'
import OSADAwardDetailPage from './OSADAwardDetailPage'
import OSADPotentialCandidatesView from './OSADPotentialCandidatesView'
import OSADEvaluationSummaryView from './OSADEvaluationSummaryView'

export default function OSADAwardRoutePage({ view = 'catalog' }) {
  const navigate = useNavigate()
  const { awardId, studentId } = useParams()
  const [award, setAward] = useState(null)
  const [loading, setLoading] = useState(view !== 'catalog')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (view === 'catalog') return

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
  const candidates = () => navigate(`/osad/awards/${award.id}/candidates`)

  if (view === 'detail') {
    return <OSADAwardDetailPage award={award} onCatalog={catalog} onOpenCandidates={candidates} />
  }

  if (view === 'candidates') {
    return <OSADPotentialCandidatesView award={award} onBack={detail} onCatalog={catalog} onSelectStudent={(student) => navigate(`/osad/awards/${award.id}/candidates/${student.id || student.student_id || student.student_profile_id}/review`)} />
  }

  // View-only Student Evaluation Summary for this award (no manual scoring or decisions).
  return <OSADEvaluationSummaryView award={award} studentId={studentId} onBack={candidates} onAward={detail} onCatalog={catalog} />
}
