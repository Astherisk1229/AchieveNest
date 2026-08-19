import React, { useState, useMemo } from 'react'
import StudioHeader from '../studio/StudioHeader'
import StudioDecisionBar from '../studio/StudioDecisionBar'
import PortfolioNavigator from '../studio/portfolio/PortfolioNavigator'
import CriterionEvaluation from '../studio/evaluation/CriterionEvaluation'
import { calculateNDMUScores } from './rating/NDMURatingEngine'

const WORKSPACE_MODE_KEY = 'achievenest_hr_evaluation_workspace_mode_v1'

const DEFAULT_STUDIO_EVIDENCE = Object.freeze([
  { id: 'ev-1', categoryArea: 'areaA', criterionKey: 'degrees', title: 'Ph.D. Computer Science Diploma', criterionTitle: 'A.1 Educational Degrees', eligiblePoints: 40, awardedPoints: 40, verificationStatus: 'verified', fileName: 'PhD_Diploma_Ana_Reyes.pdf', submittedDate: 'Aug 10, 2026' },
  { id: 'ev-2', categoryArea: 'areaA', criterionKey: 'memberships', title: 'IEEE Senior Professional Member', criterionTitle: 'A.2 Professional Organization Memberships', eligiblePoints: 5, awardedPoints: 5, verificationStatus: 'verified', fileName: 'IEEE_Membership_Cert.pdf', submittedDate: 'Aug 11, 2026' },
  { id: 'ev-3', categoryArea: 'areaA', criterionKey: 'seminars', title: 'International Conference on AI & Higher Education', criterionTitle: 'A.3 Seminars & Trainings', eligiblePoints: 10, awardedPoints: 10, verificationStatus: 'verified', fileName: 'AI_Conference_Cert.pdf', submittedDate: 'Aug 12, 2026' },
  { id: 'ev-4', categoryArea: 'areaB', criterionKey: 'publications', title: 'IEEE Transactions Scholarly Paper on Deep Learning', criterionTitle: 'B.2 Publications (Papers, Articles, Books)', eligiblePoints: 8, awardedPoints: 8, verificationStatus: 'verified', fileName: 'IEEE_Transactions_Paper.pdf', submittedDate: 'Aug 13, 2026' },
  { id: 'ev-5', categoryArea: 'areaB', criterionKey: 'research', title: 'CHED Institutional Research Grant Final Report', criterionTitle: 'B.3 Conduct of Research', eligiblePoints: 10, awardedPoints: 10, verificationStatus: 'verified', fileName: 'CHED_Research_Report.pdf', submittedDate: 'Aug 13, 2026' },
  { id: 'ev-6', categoryArea: 'areaC', criterionKey: 'extracurricular', title: 'Department Secretary & Computer Society Moderator', criterionTitle: 'C.1 Extracurricular / Club Moderation', eligiblePoints: 20, awardedPoints: 20, verificationStatus: 'verified', fileName: 'Moderator_Appointment.pdf', submittedDate: 'Aug 14, 2026' },
])

export default function PortfolioEvaluationStudio({
  submission,
  onClose,
  onSaveProgress,
  onOpenReturnModal,
  onOpenFinalizeModal
}) {
  const tenureYears = submission?.tenure_years ?? 7

  // Initialize workspace mode state ('split' | 'scoring' | 'preview')
  const [workspaceMode, setWorkspaceMode] = useState(() => {
    try {
      const saved = sessionStorage.getItem(WORKSPACE_MODE_KEY)
      if (saved && ['split', 'scoring', 'preview'].includes(saved)) {
        return saved
      }
    } catch (e) {
      // Fallback
    }
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'scoring' : 'split'
  })

  // Initialize evidence items for the portfolio
  const [evidenceItems, setEvidenceItems] = useState(() => [...DEFAULT_STUDIO_EVIDENCE])
  const [selectedEvidence, setSelectedEvidence] = useState(() => DEFAULT_STUDIO_EVIDENCE[0])

  // Live calculation of scores using NDMURatingEngine
  const scores = useMemo(() => {
    return calculateNDMUScores(evidenceItems, tenureYears)
  }, [evidenceItems, tenureYears])

  const reviewedCount = evidenceItems.filter(i => i.verificationStatus && i.verificationStatus !== 'pending').length
  const totalCount = evidenceItems.length

  const handleWorkspaceModeChange = (mode) => {
    if (['split', 'scoring', 'preview'].includes(mode)) {
      setWorkspaceMode(mode)
      try {
        sessionStorage.setItem(WORKSPACE_MODE_KEY, mode)
      } catch (e) {
        // Storage fail fallback
      }
    }
  }

  if (!submission) return null

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
      {/* 1. Unified Responsive Top Header */}
      <StudioHeader
        submission={submission}
        scores={scores}
        workspaceMode={workspaceMode}
        onWorkspaceModeChange={handleWorkspaceModeChange}
        onBack={onClose}
        onSave={onSaveProgress}
        onClose={onClose}
      />

      {/* 2. Responsive Workspace Container (Split | Scoring Focus | Preview Focus) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#131e2e]">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Pane: Document Preview & Portfolio Navigator */}
          <div
            className={`overflow-hidden border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ${
              workspaceMode === 'preview'
                ? 'col-span-12'
                : workspaceMode === 'scoring'
                ? 'hidden'
                : 'md:col-span-5 col-span-12'
            }`}
          >
            <PortfolioNavigator
              submission={submission}
              evidenceItems={evidenceItems}
              selectedEvidence={selectedEvidence}
              onSelectEvidence={setSelectedEvidence}
              workspaceMode={workspaceMode}
              onWorkspaceModeChange={handleWorkspaceModeChange}
            />
          </div>

          {/* Right Pane: Active Criterion Scoring Workspace */}
          <div
            className={`overflow-y-auto p-5 bg-white dark:bg-[#131e2e] transition-all duration-200 ${
              workspaceMode === 'scoring'
                ? 'col-span-12 max-w-4xl mx-auto w-full'
                : workspaceMode === 'preview'
                ? 'hidden'
                : 'md:col-span-7 col-span-12'
            }`}
          >
            <CriterionEvaluation
              selectedEvidence={selectedEvidence}
              onVerifyAndNext={handleVerifyAndNext}
              onVerify={handleVerify}
              onReject={handleReject}
              hasNextItem={Boolean(evidenceItems.find(i => (!i.verificationStatus || i.verificationStatus === 'pending') && i.id !== selectedEvidence?.id))}
              workspaceMode={workspaceMode}
              onWorkspaceModeChange={handleWorkspaceModeChange}
            />
          </div>
        </div>
      </div>

      {/* 3. Flat Sticky Decision Bar */}
      <StudioDecisionBar
        reviewedCount={reviewedCount}
        totalCount={totalCount}
        onOpenReturnModal={() => onOpenReturnModal(submission)}
        onOpenFinalizeModal={() => onOpenFinalizeModal(submission, scores)}
      />
    </div>
  )
}
