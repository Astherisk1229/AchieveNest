import React, { useState, useMemo } from 'react'
import StudioHeader from '../studio/StudioHeader'
import StudioDecisionBar from '../studio/StudioDecisionBar'
import PortfolioNavigator from '../studio/portfolio/PortfolioNavigator'
import CriterionEvaluation from '../studio/evaluation/CriterionEvaluation'
import { calculateNDMUScores } from './rating/NDMURatingEngine'

const WORKSPACE_MODE_KEY = 'achievenest_hr_evaluation_workspace_mode_v1'

const DEFAULT_STUDIO_EVIDENCE = Object.freeze([
  { id: 'ev-1', categoryArea: 'areaA', criterionCode: 'A.1', criterionKey: 'degrees', evidenceTitle: 'Ph.D. Computer Science Diploma', title: 'Ph.D. Computer Science Diploma', criterionTitle: 'A.1 Educational Degrees', awardedPoints: 40, verificationStatus: 'verified', ratingStatus: 'rated', scoringPayload: { type: 'degree', degree: 'phd' }, fileName: 'PhD_Diploma_Ana_Reyes.pdf', submittedDate: 'Aug 10, 2026' },
  { id: 'ev-2', categoryArea: 'areaA', criterionCode: 'A.2', criterionKey: 'memberships', evidenceTitle: 'IEEE Senior Professional Member', title: 'IEEE Senior Professional Member', criterionTitle: 'A.2 Professional Organization Memberships', awardedPoints: 5, verificationStatus: 'verified', ratingStatus: 'rated', scoringPayload: { role: 'member' }, fileName: 'IEEE_Membership_Cert.pdf', submittedDate: 'Aug 11, 2026' },
  { id: 'ev-3', categoryArea: 'areaA', criterionCode: 'A.3', criterionKey: 'seminars', evidenceTitle: 'International Conference on AI & Higher Education', title: 'International Conference on AI & Higher Education', criterionTitle: 'A.3 Seminars & Trainings', awardedPoints: 10, verificationStatus: 'verified', ratingStatus: 'rated', scoringPayload: { level: 'international' }, fileName: 'AI_Conference_Cert.pdf', submittedDate: 'Aug 12, 2026' },
  { id: 'ev-b1', categoryArea: 'areaB', criterionCode: 'B.1', criterionKey: 'lectures', evidenceTitle: 'National Computing Symposium Keynote Speaker', title: 'National Computing Symposium Keynote Speaker', criterionTitle: 'B.1 Guest Lecturer / Consultant / Judge / Resource Person', activityTitle: '2026 National Computing Symposium on AI Innovations', conductedBy: 'PSITE National Chapter', awardedPoints: 13, verificationStatus: 'verified', ratingStatus: 'rated', scoringPayload: { sponsoringOrg: 'external', extentOfTalk: '1_day', participantsScope: 'national', role: 'speaker' }, fileName: 'National_Symposium_Speaker_Certificate.pdf', submittedDate: 'Jul 28, 2026', evaluatorRemarks: 'Verified certificate of appreciation for 1-day national keynote address.' },
  { id: 'ev-4', categoryArea: 'areaB', criterionCode: 'B.2', criterionKey: 'publications', evidenceTitle: 'IEEE Transactions Scholarly Paper on Deep Learning', title: 'IEEE Transactions Scholarly Paper on Deep Learning', criterionTitle: 'B.2 Publications (Papers, Articles, Books)', awardedPoints: 18, verificationStatus: 'verified', ratingStatus: 'rated', scoringPayload: { scope: 'international', publicationScope: 'international', publicationType: 'book' }, fileName: 'IEEE_Transactions_Paper.pdf', submittedDate: 'Aug 13, 2026' },
  { id: 'ev-5', categoryArea: 'areaB', criterionCode: 'B.3', criterionKey: 'research', evidenceTitle: 'CHED Institutional Research Grant Final Report', title: 'CHED Institutional Research Grant Final Report', criterionTitle: 'B.3 Conduct of Research', awardedPoints: 10, verificationStatus: 'verified', ratingStatus: 'rated', scoringPayload: { manualPoints: 10, justification: 'Comprehensive institutional research output accepted by CHED.' }, fileName: 'CHED_Research_Report.pdf', submittedDate: 'Aug 13, 2026' },
  { id: 'ev-6', categoryArea: 'areaC', criterionCode: 'C.1.1', criterionKey: 'c1_moderator', evidenceTitle: 'Computer Society Club Moderator Appointment', title: 'Computer Society Club Moderator Appointment', criterionTitle: 'C.1.1 Moderator of Clubs / Organizations', awardedPoints: 20, verificationStatus: 'verified', ratingStatus: 'rated', scoringPayload: { manualPoints: 20, justification: 'Full academic year service as official moderator of the junior computing organization.' }, fileName: 'Moderator_Appointment.pdf', submittedDate: 'Aug 14, 2026' },
])

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
    return [...DEFAULT_STUDIO_EVIDENCE]
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
