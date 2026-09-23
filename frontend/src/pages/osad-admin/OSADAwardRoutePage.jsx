import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAwards } from '../../services/awardAdminService'
import { OSADErrorState, OSADLoadingState } from '../../components/osad/OSADStateBlock'
import OSADAwardsAndCriteriaPage from './OSADAwardsAndCriteriaPage'
import OSADAwardDetailPage from './OSADAwardDetailPage'
import OSADPotentialCandidatesView from './OSADPotentialCandidatesView'
import OSADStudentsForEvaluationView from './OSADStudentsForEvaluationView'
import OSADStudentAwardReviewWorkspace from './OSADStudentAwardReviewWorkspace'
import OSADEvaluationSummaryPreviewPage from './OSADEvaluationSummaryPreviewPage'

export default function OSADAwardRoutePage({ view = 'catalog' }) {
  const navigate = useNavigate()
  const { awardId, studentId } = useParams()
  const [award, setAward] = useState(null)
  const [loading, setLoading] = useState(!['catalog', 'summary-preview'].includes(view))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (['catalog', 'summary-preview'].includes(view)) return

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
      <OSADAwardsAndCriteriaPage
        onSelectAward={(item) => navigate(`/osad/awards/${item.id}`)}
        onPreviewEvaluationSummary={() => navigate('/osad/awards/evaluation-summary-preview')}
      />
    )
  }

  if (view === 'summary-preview') {
    return <OSADEvaluationSummaryPreviewPage onBack={() => navigate('/osad/awards')} />
  }

  if (loading) return <OSADLoadingState message="Loading award workspace…" />
  if (error || !award) {
    return <OSADErrorState title="Award unavailable" message={error || 'The award could not be found.'} onRetry={() => navigate('/osad/awards')} retryLabel="Return to awards" />
  }

  const catalog = () => navigate('/osad/awards')
  const detail = () => navigate(`/osad/awards/${award.id}`)
  const candidates = () => navigate(`/osad/awards/${award.id}/candidates`)
  const evaluationPool = () => navigate(`/osad/awards/${award.id}/evaluations`)

  if (view === 'detail') {
    return <OSADAwardDetailPage award={award} onCatalog={catalog} onOpenCandidates={candidates} onOpenEvaluationPool={evaluationPool} />
  }

  if (view === 'evaluations') {
    return <OSADStudentsForEvaluationView award={award} onBack={detail} onSelectStudent={(student) => navigate(`/osad/awards/${award.id}/candidates/${student.id || student.student_profile_id}/review`)} />
  }

  if (view === 'candidates') {
    return <OSADPotentialCandidatesView award={award} onBack={detail} onCatalog={catalog} onSelectStudent={(student) => navigate(`/osad/awards/${award.id}/candidates/${student.id || student.student_id || student.student_profile_id}/review`)} />
  }

  return (
    <OSADStudentAwardReviewWorkspace
      award={award}
      awardId={award.id}
      studentId={studentId}
      onBack={candidates}
      onFinalized={() => {}}
    />
  )
}
