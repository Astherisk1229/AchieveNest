import React, { useState, useMemo } from 'react'
import StudioHeader from '../studio/StudioHeader'
import StudioDecisionBar from '../studio/StudioDecisionBar'
import PortfolioNavigator from '../studio/portfolio/PortfolioNavigator'
import CriterionEvaluation from '../studio/evaluation/CriterionEvaluation'
import { calculateNDMUScores } from './rating/NDMURatingEngine'

const WORKSPACE_MODE_KEY = 'achievenest_hr_evaluation_workspace_mode_v1'

export default function PortfolioEvaluationStudio({
  submission,
  onClose,
  onSaveProgress,
  onOpenReturnModal,
  onOpenFinalizeModal
}) {
  const tenureYears = submission?.tenure_years || 0

  // Workspace layout mode ('split' | 'scoring' | 'preview')
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

  // Evidence items for the current evaluation
  const [evidenceItems, setEvidenceItems] = useState(() => {
    if (submission?.items && Array.isArray(submission.items) && submission.items.length > 0) {
      return submission.items
    }
    return []
  })

  const [selectedEvidence, setSelectedEvidence] = useState(() => evidenceItems[0] || null)

  // Live calculation of authoritative scores
  const scores = useMemo(() => {
    return calculateNDMUScores(evidenceItems, tenureYears)
  }, [evidenceItems, tenureYears])

  const completedDecisionsCount = evidenceItems.filter(
    (i) => (i.verificationStatus === 'verified' && i.ratingStatus === 'rated') ||
           i.verificationStatus === 'ineligible' ||
           i.verificationStatus === 'needs_revision'
  ).length
  const totalCount = evidenceItems.length
  const isReadyForFinalize = completedDecisionsCount >= totalCount && totalCount > 0

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

  // Rate & verify evidence item
  const handleVerify = (itemId, awardedPts, payload = {}, remarks = '') => {
    setEvidenceItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            verificationStatus: 'verified',
            ratingStatus: 'rated',
            awardedPoints: awardedPts,
            scoringPayload: payload,
            evaluatorRemarks: remarks
          }
        }
        return item
      })
    )
  }

  // Rate & advance to next item
  const handleVerifyAndNext = (itemId, awardedPts, payload = {}, remarks = '') => {
    handleVerify(itemId, awardedPts, payload, remarks)

    const currentIndex = evidenceItems.findIndex((i) => i.id === itemId)
    const nextItem =
      evidenceItems.slice(currentIndex + 1).find((i) => i.verificationStatus === 'pending' || i.ratingStatus !== 'rated') ||
      evidenceItems.find((i) => (i.verificationStatus === 'pending' || i.ratingStatus !== 'rated') && i.id !== itemId)

    if (nextItem) {
      setSelectedEvidence(nextItem)
    }
  }

  // Mark item ineligible
  const handleReject = (itemId, remarks = '') => {
    setEvidenceItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            verificationStatus: 'ineligible',
            ratingStatus: 'not_applicable',
            awardedPoints: 0,
            evaluatorRemarks: remarks
          }
        }
        return item
      })
    )
  }

  const handleSaveDraft = () => {
    if (onSaveProgress) {
      onSaveProgress(evidenceItems, scores)
    }
  }

  const handleFinalizeClicked = () => {
    if (onOpenFinalizeModal) {
      onOpenFinalizeModal(scores)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col font-sans overflow-hidden">
      {/* 1. Top Header */}
      <StudioHeader
        submission={submission}
        scores={scores}
        workspaceMode={workspaceMode}
        onWorkspaceModeChange={handleWorkspaceModeChange}
        onBack={onClose}
        onSave={handleSaveDraft}
        onClose={onClose}
      />

      {/* 2. Dual Workspace Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#131e2e]">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left: Document Preview & Portfolio Navigator */}
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

          {/* Right: Active Dynamic Criterion Evaluation */}
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
              hasNextItem={Boolean(
                evidenceItems.find(
                  (i) => (i.verificationStatus === 'pending' || i.ratingStatus !== 'rated') && i.id !== selectedEvidence?.id
                )
              )}
              workspaceMode={workspaceMode}
              onWorkspaceModeChange={handleWorkspaceModeChange}
              tenureYears={tenureYears}
            />
          </div>
        </div>
      </div>

      {/* 3. Bottom Decision Bar */}
      <StudioDecisionBar
        reviewedCount={completedDecisionsCount}
        totalCount={totalCount}
        isReadyForFinalize={isReadyForFinalize}
        onOpenReturnModal={onOpenReturnModal}
        onOpenFinalizeModal={handleFinalizeClicked}
      />
    </div>
  )
}
