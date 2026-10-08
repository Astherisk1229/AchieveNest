import React, { useState, useMemo } from 'react'
import StudioHeader from '../studio/StudioHeader'
import StudioDecisionBar from '../studio/StudioDecisionBar'
import PortfolioNavigator from '../studio/portfolio/PortfolioNavigator'
import CriterionEvaluation from '../studio/evaluation/CriterionEvaluation'
import { calculateNDMUScores } from './rating/NDMURatingEngine'
import { calculateNTFScores } from './rating/NTFRatingEngine'
import { usesFacultyAcademicPortfolio } from '../../../../utils/personnelPortfolioFormat'
import hrEvaluationService from '../../../../services/hrEvaluationService'
import { promptDialog } from '../../../../components/ui/DialogProvider'

// Server rows are snake_case; keep their recorded decisions (including locked NTF Area A items) visible to the progress count.
const toStudioItem = item => ({
  ...item,
  categoryArea: item.categoryArea ?? item.category_area,
  criterionCode: item.criterionCode ?? item.criterion_code,
  criterionKey: item.criterionKey ?? item.criterion_key,
  title: item.title ?? item.item_description ?? item.achievement ?? item.criterion_code,
  evidenceTitle: item.evidenceTitle ?? item.evidence_title,
  fileName: item.fileName ?? item.file_name,
  verificationStatus: item.verificationStatus ?? item.verification_status,
  ratingStatus: item.ratingStatus ?? item.rating_status,
  awardedPoints: item.awardedPoints ?? (item.awarded_points === null || item.awarded_points === undefined ? undefined : Number(item.awarded_points)),
})

const WORKSPACE_MODE_KEY = 'achievenest_hr_evaluation_workspace_mode_v1'

export default function PortfolioEvaluationStudio({
  submission,
  onClose,
  onSaveProgress,
  onOpenReturnModal,
  onOpenFinalizeModal,
  finalizeLabel
}) {
  const tenureYears = submission?.tenure_years || 0

  // Workspace layout mode ('split' | 'scoring' | 'preview')
  const [workspaceMode, setWorkspaceMode] = useState(() => {
    try {
      const saved = sessionStorage.getItem(WORKSPACE_MODE_KEY)
      if (saved && ['split', 'scoring', 'preview'].includes(saved)) {
        return saved
      }
    } catch {
      // Fallback
    }
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'scoring' : 'split'
  })

  // Evidence items for the current evaluation
  const [evidenceItems, setEvidenceItems] = useState(() => {
    if (submission?.items && Array.isArray(submission.items) && submission.items.length > 0) {
      return submission.items.map(toStudioItem)
    }
    return []
  })

  const [selectedEvidence, setSelectedEvidence] = useState(() => evidenceItems[0] || null)
  const [draftRemarks, setDraftRemarks] = useState({})
  const [draftSaveMessage, setDraftSaveMessage] = useState('')
  const [draftSaveError, setDraftSaveError] = useState(false)

  // Live calculation of authoritative scores
  const scores = useMemo(() => {
    return usesFacultyAcademicPortfolio(submission)
      ? calculateNDMUScores(evidenceItems, tenureYears)
      : calculateNTFScores(evidenceItems, tenureYears)
  }, [evidenceItems, submission, tenureYears])

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
      } catch {
        // Storage fail fallback
      }
    }
  }

  if (!submission) return null

  // Rate & verify evidence item
  const handleVerify = async (itemId, awardedPts, payload = {}, remarks = '') => {
    const selected = evidenceItems.find(item => item.id === itemId)
    await hrEvaluationService.verifyItem(submission.id, itemId, 'verified', remarks)
    const saved = await hrEvaluationService.rateItem(
      submission.id,
      itemId,
      remarks,
      selected?.evaluator_judgment_required ? awardedPts : null
    )
    const serverPoints = saved?.data?.awarded_points ?? saved?.awarded_points
    setEvidenceItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            verificationStatus: 'verified',
            ratingStatus: 'rated',
            awardedPoints: serverPoints === undefined ? awardedPts : Number(serverPoints),
            scoringPayload: payload,
            evaluatorRemarks: remarks
          }
        }
        return item
      })
    )
  }

  // Rate & advance to next item
  const handleVerifyAndNext = async (itemId, awardedPts, payload = {}, remarks = '') => {
    await handleVerify(itemId, awardedPts, payload, remarks)

    const currentIndex = evidenceItems.findIndex((i) => i.id === itemId)
    const nextItem =
      evidenceItems.slice(currentIndex + 1).find((i) => i.verificationStatus === 'pending' || i.ratingStatus !== 'rated') ||
      evidenceItems.find((i) => (i.verificationStatus === 'pending' || i.ratingStatus !== 'rated') && i.id !== itemId)

    if (nextItem) {
      setSelectedEvidence(nextItem)
    }
  }

  // Mark item ineligible
  const handleReject = async (itemId, remarks = '') => {
    await hrEvaluationService.verifyItem(submission.id, itemId, 'ineligible', remarks)
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

  // Non-Teaching Area A: HR types the DS; the server recalculates Points Earned (DS × weight).
  const canEditAreaADs = !usesFacultyAcademicPortfolio(submission) && submission?.status === 'in_evaluation' && Boolean(submission?.id)
  const handleUpdateAreaADs = async (code, ds) => {
    const current = evidenceItems.find(item => item.categoryArea === 'areaA' && String(item.criterionCode || '').toUpperCase() === code)
    let reason = ''
    if (current) {
      reason = await promptDialog({
        title: `Change DS for ${code}?`,
        message: 'This replaces the DS from the annual review. The original value stays in the evaluation history.',
        inputLabel: 'Reason for the change',
        placeholder: 'e.g. Corrected per HR records',
        required: true,
        confirmLabel: 'Save DS',
      })
      if (reason === null) return false
    }
    const saved = await hrEvaluationService.setAreaADs(submission.id, code, ds, reason)
    if (!saved) throw new Error('The DS could not be saved.')
    const next = toStudioItem(saved)
    setEvidenceItems(prev => prev.some(item => item.id === next.id) ? prev.map(item => item.id === next.id ? next : item) : [...prev, next])
    return true
  }

  const handleSaveDraft = async () => {
    setDraftSaveMessage('')
    setDraftSaveError(false)
    try {
      await Promise.all(Object.entries(draftRemarks).map(([itemId, remarks]) => hrEvaluationService.saveItemRemarks(submission.id, itemId, remarks)))
      if (Object.keys(draftRemarks).length) {
        setEvidenceItems(prev => prev.map(item => Object.prototype.hasOwnProperty.call(draftRemarks, item.id) ? { ...item, evaluatorRemarks: draftRemarks[item.id] } : item))
        setDraftRemarks({})
      }
      onSaveProgress?.(evidenceItems, scores)
      setDraftSaveMessage('Evaluator remarks saved.')
    } catch (error) {
      setDraftSaveError(true)
      setDraftSaveMessage(error?.response?.data?.error?.message || error?.error?.message || error?.message || 'Evaluator remarks could not be saved.')
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
              onUpdateAreaADs={canEditAreaADs ? handleUpdateAreaADs : undefined}
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
              onRemarksChange={(itemId, value) => {
                setDraftSaveMessage('')
                setDraftSaveError(false)
                setDraftRemarks(current => ({ ...current, [itemId]: value }))
                setEvidenceItems(current => current.map(item => item.id === itemId ? { ...item, evaluatorRemarks: value } : item))
              }}
              hasNextItem={Boolean(
                evidenceItems.find(
                  (i) => (i.verificationStatus === 'pending' || i.ratingStatus !== 'rated') && i.id !== selectedEvidence?.id
                )
              )}
              workspaceMode={workspaceMode}
              onWorkspaceModeChange={handleWorkspaceModeChange}
              tenureYears={tenureYears}
            />
            {draftSaveMessage && <p role="status" className={`mt-3 text-xs font-semibold ${draftSaveError ? 'text-rose-700' : 'text-emerald-700'}`}>{draftSaveMessage}</p>}
          </div>
        </div>
      </div>

      {/* 3. Bottom Decision Bar */}
      <StudioDecisionBar
        reviewedCount={completedDecisionsCount}
        totalCount={totalCount}
        isReadyForFinalize={isReadyForFinalize}
        onOpenReturnModal={onOpenReturnModal}
        onOpenFinalizeModal={onOpenFinalizeModal ? handleFinalizeClicked : undefined}
        finalizeLabel={finalizeLabel}
      />
    </div>
  )
}
