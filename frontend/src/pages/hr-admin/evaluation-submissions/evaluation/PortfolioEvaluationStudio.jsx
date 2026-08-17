import React, { useState, useMemo } from 'react'
import StudioHeader from '../studio/StudioHeader'
import EvaluationScoreStrip from '../studio/EvaluationScoreStrip'
import StudioDecisionBar from '../studio/StudioDecisionBar'
import PortfolioNavigator from '../studio/portfolio/PortfolioNavigator'
import CriterionEvaluation from '../studio/evaluation/CriterionEvaluation'
import { calculateNDMUScores } from './rating/NDMURatingEngine'

export default function PortfolioEvaluationStudio({
  submission,
  onClose,
  onSaveProgress,
  onOpenReturnModal,
  onOpenFinalizeModal
}) {
  if (!submission) return null

  // Initialize mock evidence items for the portfolio
  const [evidenceItems, setEvidenceItems] = useState([
    { id: 'ev-1', categoryArea: 'areaA', criterionKey: 'degrees', title: 'Ph.D. Computer Science Diploma', criterionTitle: 'A.1 Educational Degrees', eligiblePoints: 40, awardedPoints: 40, verificationStatus: 'verified', fileName: 'PhD_Diploma_Ana_Reyes.pdf', submittedDate: 'Aug 10, 2026' },
    { id: 'ev-2', categoryArea: 'areaA', criterionKey: 'memberships', title: 'IEEE Senior Professional Member', criterionTitle: 'A.2 Professional Organization Memberships', eligiblePoints: 5, awardedPoints: 5, verificationStatus: 'verified', fileName: 'IEEE_Membership_Cert.pdf', submittedDate: 'Aug 11, 2026' },
    { id: 'ev-3', categoryArea: 'areaA', criterionKey: 'seminars', title: 'International Conference on AI & Higher Education', criterionTitle: 'A.3 Seminars & Trainings', eligiblePoints: 10, awardedPoints: 10, verificationStatus: 'verified', fileName: 'AI_Conference_Cert.pdf', submittedDate: 'Aug 12, 2026' },
    { id: 'ev-4', categoryArea: 'areaB', criterionKey: 'publications', title: 'IEEE Transactions Scholarly Paper on Deep Learning', criterionTitle: 'B.2 Publications (Papers, Articles, Books)', eligiblePoints: 8, awardedPoints: 8, verificationStatus: 'verified', fileName: 'IEEE_Transactions_Paper.pdf', submittedDate: 'Aug 13, 2026' },
    { id: 'ev-5', categoryArea: 'areaB', criterionKey: 'research', title: 'CHED Institutional Research Grant Final Report', criterionTitle: 'B.3 Conduct of Research', eligiblePoints: 10, awardedPoints: 10, verificationStatus: 'verified', fileName: 'CHED_Research_Report.pdf', submittedDate: 'Aug 13, 2026' },
    { id: 'ev-6', categoryArea: 'areaC', criterionKey: 'extracurricular', title: 'Department Secretary & Computer Society Moderator', criterionTitle: 'C.1 Extracurricular / Club Moderation', eligiblePoints: 20, awardedPoints: 20, verificationStatus: 'verified', fileName: 'Moderator_Appointment.pdf', submittedDate: 'Aug 14, 2026' },
  ])

  const [selectedEvidence, setSelectedEvidence] = useState(evidenceItems[0])

  // Live calculation of scores using NDMURatingEngine
  const scores = useMemo(() => {
    return calculateNDMUScores(evidenceItems, submission.tenure_years || 7)
  }, [evidenceItems, submission.tenure_years])

  const reviewedCount = evidenceItems.filter(i => i.verificationStatus && i.verificationStatus !== 'pending').length
  const totalCount = evidenceItems.length

  // High-Volume Review Accelerator: Verify & Next
  const handleVerifyAndNext = (itemId, awardedPts) => {
    setEvidenceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, verificationStatus: 'verified', awardedPoints: awardedPts }
      }
      return item
    }))

    // Find next unreviewed item
    const currentIndex = evidenceItems.findIndex(i => i.id === itemId)
    const nextItem = evidenceItems.slice(currentIndex + 1).find(i => !i.verificationStatus || i.verificationStatus === 'pending') ||
                     evidenceItems.find(i => (!i.verificationStatus || i.verificationStatus === 'pending') && i.id !== itemId)
    
    if (nextItem) {
      setSelectedEvidence(nextItem)
    }
  }

  const handleVerify = (itemId, awardedPts) => {
    setEvidenceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, verificationStatus: 'verified', awardedPoints: awardedPts }
      }
      return item
    }))
  }

  const handleReject = (itemId) => {
    setEvidenceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, verificationStatus: 'rejected', awardedPoints: 0 }
      }
      return item
    }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col font-sans overflow-hidden">
      {/* 1. Slim Studio Header (Single Faculty Identity, No Duplication) */}
      <StudioHeader
        submission={submission}
        onBack={onClose}
        onSave={onSaveProgress}
        onClose={onClose}
      />

      {/* 2. Two-Pane Workspace Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#131e2e]">
        {/* Sticky Compact Score Strip */}
        <EvaluationScoreStrip scores={scores} />

        {/* Resizable Two-Pane Workspace */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Pane (5 Columns): Portfolio Navigator */}
          <div className="md:col-span-5 overflow-hidden border-r border-slate-200 dark:border-slate-800">
            <PortfolioNavigator
              submission={submission}
              evidenceItems={evidenceItems}
              selectedEvidence={selectedEvidence}
              onSelectEvidence={setSelectedEvidence}
            />
          </div>

          {/* Right Pane (7 Columns): Focused Evaluation Workspace */}
          <div className="md:col-span-7 overflow-y-auto p-5 bg-white dark:bg-[#131e2e]">
            <CriterionEvaluation
              selectedEvidence={selectedEvidence}
              onVerifyAndNext={handleVerifyAndNext}
              onVerify={handleVerify}
              onReject={handleReject}
              hasNextItem={Boolean(evidenceItems.find(i => (!i.verificationStatus || i.verificationStatus === 'pending') && i.id !== selectedEvidence?.id))}
            />
          </div>
        </div>
      </div>

      {/* 3. Studio Decision Bar */}
      <StudioDecisionBar
        reviewedCount={reviewedCount}
        totalCount={totalCount}
        onOpenReturnModal={() => onOpenReturnModal(submission)}
        onOpenFinalizeModal={() => onOpenFinalizeModal(submission, scores)}
      />
    </div>
  )
}
