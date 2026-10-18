import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DeanAnnualReviewEligibilityPage from '../../dean/DeanAnnualReviewEligibilityPage'
import useRankingWorkspaceStage from './useRankingWorkspaceStage'

export default function AnnualReviewsStage({ cycleId, trackKey, trackKeys = null, embedded = false, hideCategoryFilter = false }) {
  const navigate = useNavigate()
  const submissions = useRankingWorkspaceStage(cycleId, trackKeys || trackKey, 'submissions')
  const portfolioByPersonnel = useMemo(() => Object.fromEntries(
    (submissions.data?.rows || [])
      .filter(row => row.evaluation?.id)
      .map(row => [String(row.personnel.id), row.evaluation]),
  ), [submissions.data?.rows])
  const viewPortfolio = personnelId => {
    const params = new URLSearchParams({
      tab: 'portfolio-evaluation',
      period: cycleId,
      track: Array.isArray(trackKeys) && trackKeys.length ? trackKeys[0] : trackKey,
      personnel_id: String(personnelId),
    })
    navigate(`/hr/ranking-cycles?${params.toString()}`)
  }

  if (!embedded) return <DeanAnnualReviewEligibilityPage cycleId={cycleId} trackKey={trackKey} portfolioByPersonnel={portfolioByPersonnel} onViewPortfolio={viewPortfolio}/>
  return <main className="space-y-5 py-4">
    <DeanAnnualReviewEligibilityPage cycleId={cycleId} trackKey={trackKey} trackKeys={trackKeys} embedded hideCategoryFilter={hideCategoryFilter} portfolioByPersonnel={portfolioByPersonnel} onViewPortfolio={viewPortfolio}/>
  </main>
}
