import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import StudioHeader from '../studio/StudioHeader'
import StudioDecisionBar from '../studio/StudioDecisionBar'
import PortfolioNavigator from '../studio/portfolio/PortfolioNavigator'
import CriterionEvaluation from '../studio/evaluation/CriterionEvaluation'
import NonTeachingCriterionEvaluation from '../studio/evaluation/NonTeachingCriterionEvaluation'
import NonTeachingAreaAEvaluation from '../studio/evaluation/NonTeachingAreaAEvaluation'
import { calculateNDMUScores } from './rating/NDMURatingEngine'
import { calculateNTFScores } from './rating/NTFRatingEngine'
import { usesFacultyAcademicPortfolio } from '../../../../utils/personnelPortfolioFormat'
import { isEvaluationItemReviewed, nextUnreviewedEvaluationItem } from '../../../../utils/evaluationNavigation'
import hrEvaluationService from '../../../../services/hrEvaluationService'
import PersonnelEvidencePreviewModal from '../../../personnel/modals/PersonnelEvidencePreviewModal'
import { fixedNonTeachingCriterion } from '../../../../utils/nonTeachingLockedCriterion'
import { nonTeachingAreaARows } from '../../../../utils/nonTeachingBooklet'

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

const evidenceFor = item => {
  const snapshot = item?.evidence_snapshot
  const rows = Array.isArray(snapshot) ? snapshot : item?.evidence_id ? [{ id: item.evidence_id, original_filename: item.file_name }] : []
  return rows.map(row => ({
    ...row,
    id: row.id || row.evidence_id,
    original_filename: row.original_filename || row.file_name || 'Supporting document',
    mime_type: row.mime_type || row.detected_mime_type || 'application/pdf'
  }))
}

export default function PortfolioEvaluationStudio({
  submission,
  onStartEvaluation,
  onClose,
  onSaveProgress,
  onOpenReturnModal,
  onOpenFinalizeModal,
  onOpenRankPreparation,
  finalizeLabel
}) {
  const hasRecordedServiceYears = submission?.tenure_years !== null && submission?.tenure_years !== undefined
  const tenureYears = hasRecordedServiceYears ? Number(submission.tenure_years) : 0

  const reviewOnly = ['submitted', 'pending'].includes(submission?.status) || (submission?.allowed_actions || []).includes('start_evaluation')
  const canEvaluate = ['in_evaluation', 'in_review'].includes(submission?.status) && !reviewOnly
  const canComplete = ['ready_for_finalization', 'ready_finalization'].includes(submission?.status)
  const isFaculty = usesFacultyAcademicPortfolio(submission)
  const [workspaceMode, setWorkspaceMode] = useState(canEvaluate ? 'split' : 'preview')
  const [mobilePane, setMobilePane] = useState('portfolio')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [previewEvidence, setPreviewEvidence] = useState(null)

  // Evidence items for the current evaluation
  const [evidenceItems, setEvidenceItems] = useState(() => {
    if (submission?.items && Array.isArray(submission.items) && submission.items.length > 0) {
      return submission.items.map(toStudioItem)
    }
    return []
  })

  const [selectedEvidence, setSelectedEvidence] = useState(() => evidenceItems[0] || null)
  const [standaloneAreaACode, setStandaloneAreaACode] = useState(null)
  const [draftRemarks, setDraftRemarks] = useState({})
  const [draftSaveMessage, setDraftSaveMessage] = useState('')
  const [draftSaveError, setDraftSaveError] = useState(false)

  // Live calculation of authoritative scores
  const scores = useMemo(() => {
    return isFaculty
      ? calculateNDMUScores(evidenceItems, tenureYears)
      : calculateNTFScores(evidenceItems, tenureYears)
  }, [evidenceItems, isFaculty, tenureYears])
  const serviceSnapshot = useMemo(() => {
    const raw = submission?.eligibility_snapshot
    if (!raw) return null
    if (typeof raw === 'object') return raw.service_requirement || null
    try { return JSON.parse(raw)?.service_requirement || null } catch { return null }
  }, [submission?.eligibility_snapshot])
  const servicePoints = isFaculty
    ? scores.areaC?.tenure
    : scores.areaB?.categoryTotals?.['B.3']

  const completedDecisionsCount = evidenceItems.filter(isEvaluationItemReviewed).length
  const totalCount = evidenceItems.length
  const isReadyForFinalize = completedDecisionsCount >= totalCount && totalCount > 0
  const areaAPoints = scores.areaA?.total ?? scores.areaA_score
  const areaBPoints = scores.areaB?.awardedTotal ?? scores.areaB?.total ?? scores.areaB_score
  const areaCPoints = scores.areaC?.total ?? scores.areaC_score
  const totalPoints = scores.grandTotalAwarded ?? scores.total_score ?? scores.totalScore
  const displayPoints = value => value == null ? 'Pending' : `${Number(value).toFixed(2)} pts`
  const selectedIndex = evidenceItems.findIndex(item => item.id === selectedEvidence?.id)
  const selectedAreaACode = !isFaculty && (standaloneAreaACode || (String(selectedEvidence?.categoryArea || '').toLowerCase() === 'areaa' ? String(selectedEvidence?.criterionCode || '').toUpperCase() : null))
  const selectedAreaARow = selectedAreaACode ? nonTeachingAreaARows({ items: evidenceItems }).find(row => row.code === selectedAreaACode) : null
  const selectEvidence = item => {
    if (!item) return
    setStandaloneAreaACode(null)
    setSelectedEvidence(item)
    if (canEvaluate) {
      setWorkspaceMode('split')
      setMobilePane('evaluation')
    }
  }
  const selectAreaARow = row => {
    if (row.item) selectEvidence(toStudioItem(row.item))
    else {
      setStandaloneAreaACode(row.code)
      setSelectedEvidence(null)
      setWorkspaceMode('split')
      setMobilePane('evaluation')
    }
  }
  const openEvidence = (item, selectedProof) => {
    const proof = selectedProof || evidenceFor(item)[0]
    if (proof) setPreviewEvidence(proof)
  }
  const moveSelection = direction => {
    const next = evidenceItems[selectedIndex + direction]
    if (next) selectEvidence(next)
  }

  const startEvaluation = async () => {
    if (!onStartEvaluation || starting) return
    setStarting(true)
    setStartError('')
    try {
      await onStartEvaluation()
    } catch (error) {
      setStartError(error?.response?.data?.error?.message || error?.error?.message || error?.message || 'Evaluation could not be started. Try again.')
    } finally {
      setStarting(false)
    }
  }

  const handleWorkspaceModeChange = (mode) => {
    if (['split', 'scoring', 'preview'].includes(mode)) {
      setWorkspaceMode(mode)
    }
  }

  if (!submission) return null

  // Rate & verify evidence item
  const handleVerify = async (itemId, awardedPts, payload = {}, remarks = '', classificationCode = '') => {
    const selected = evidenceItems.find(item => item.id === itemId)
    const verification = await hrEvaluationService.verifyItem(submission.id, itemId, 'verified', remarks, classificationCode)
    const classifiedItem = verification?.data?.classified_item ?? verification?.classified_item
    const saved = verification?.rating_status === 'rated' && verification?.awarded_points !== undefined
      ? verification
      : await hrEvaluationService.rateItem(
        submission.id,
        itemId,
        remarks,
        !classificationCode && selected?.evaluator_judgment_required && (isFaculty || !fixedNonTeachingCriterion(selected)) ? awardedPts : null
      )
    const serverPoints = saved?.data?.awarded_points ?? saved?.awarded_points
    const update = item => ({ ...item, ...(classifiedItem ? toStudioItem(classifiedItem) : {}), verificationStatus: 'verified', ratingStatus: 'rated', awardedPoints: serverPoints === undefined ? awardedPts : Number(serverPoints), scoringPayload: payload, evaluatorRemarks: remarks })
    setEvidenceItems(prev => prev.map(item => item.id === itemId ? update(item) : item))
    setSelectedEvidence(prev => prev?.id === itemId ? update(prev) : prev)
  }

  // Advance only after both verification and rating have persisted.
  const handleVerifyAndNext = async (itemId, awardedPts, payload = {}, remarks = '', classificationCode = '') => {
    await handleVerify(itemId, awardedPts, payload, remarks, classificationCode)
    const nextItem = nextUnreviewedEvaluationItem(evidenceItems, itemId)
    if (nextItem) selectEvidence(nextItem)
  }

  // Mark item ineligible
  const handleReject = async (itemId, remarks = '') => {
    if (!remarks.trim()) throw new Error('Enter a reason before rejecting this accomplishment.')
    await hrEvaluationService.verifyItem(submission.id, itemId, 'ineligible', remarks)
    const update = item => ({ ...item, verificationStatus: 'ineligible', ratingStatus: 'not_applicable', awardedPoints: 0, evaluatorRemarks: remarks })
    setEvidenceItems(prev => prev.map(item => item.id === itemId ? update(item) : item))
    setSelectedEvidence(prev => prev?.id === itemId ? update(prev) : prev)
    const nextItem = nextUnreviewedEvaluationItem(evidenceItems, itemId)
    if (nextItem) selectEvidence(nextItem)
  }

  // Non-Teaching Area A: HR types the DS; the server recalculates Points Earned (DS × weight).
  const canEditAreaADs = !isFaculty && submission?.status === 'in_evaluation' && Boolean(submission?.id)
  const handleUpdateAreaADs = async (code, ds) => {
    const saved = await hrEvaluationService.setAreaADs(submission.id, code, ds)
    if (!saved) throw new Error('The DS could not be saved.')
    const next = toStudioItem(saved)
    setEvidenceItems(prev => prev.some(item => item.id === next.id) ? prev.map(item => item.id === next.id ? next : item) : [...prev, next])
    if (standaloneAreaACode === code) {
      setStandaloneAreaACode(null)
      setSelectedEvidence(next)
    }
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
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-slate-50 font-sans dark:bg-slate-950">
      {/* 1. Top Header */}
      <StudioHeader
        submission={submission}
        onBack={onClose}
        onSave={canEvaluate ? handleSaveDraft : undefined}
        onClose={onClose}
      />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h1 className="text-lg font-bold text-slate-950 dark:text-white">Review Portfolio</h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">{submission.faculty_name || submission.full_name || 'Personnel'} · Version {submission.version_number || 1} · {reviewOnly ? 'Ready for HR review' : canEvaluate ? 'Evaluation in progress' : 'Read-only portfolio'}</p>
        </div>
      </div>
      <section aria-label="Approved score summary" className="shrink-0 border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xs font-bold text-slate-900 dark:text-white">Approved score summary</h2><div className="flex items-center gap-2"><span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">{completedDecisionsCount} of {totalCount} reviewed</span><div role="progressbar" aria-label="Evaluation progress" aria-valuemin={0} aria-valuemax={totalCount} aria-valuenow={completedDecisionsCount} className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 sm:block dark:bg-slate-800"><div className="h-full bg-emerald-700" style={{ width: `${totalCount ? completedDecisionsCount / totalCount * 100 : 0}%` }} /></div></div></div>
        <dl className={`mt-2 grid grid-cols-2 gap-2 ${isFaculty ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30"><dt className="text-xs text-slate-700 dark:text-slate-200">Total approved points</dt><dd className="text-base font-bold tabular-nums">{displayPoints(totalPoints)}</dd></div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"><dt className="text-xs text-slate-700 dark:text-slate-200">{isFaculty ? 'A. Professional Development' : 'A. Performance and Personal Indicators'}</dt><dd className="text-base font-bold tabular-nums">{displayPoints(areaAPoints)}</dd></div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"><dt className="text-xs text-slate-700 dark:text-slate-200">{isFaculty ? 'B. Productivity' : 'B. Service and Leadership'}</dt><dd className="text-base font-bold tabular-nums">{displayPoints(areaBPoints)}</dd></div>
          {isFaculty && <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"><dt className="text-xs text-slate-700 dark:text-slate-200">C. Service &amp; Leadership</dt><dd className="text-base font-bold tabular-nums">{displayPoints(areaCPoints)}</dd></div>}
        </dl>
        <details aria-label="Length of Service" className="group mt-2 text-xs text-slate-700 dark:text-slate-200">
          <summary className="w-fit cursor-pointer rounded font-semibold text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300">Length of Service · {hasRecordedServiceYears ? `${tenureYears} completed years` : 'Not captured'}{hasRecordedServiceYears && servicePoints != null ? ` · ${servicePoints} HR points` : ''}</summary>
          <dl className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-4 dark:bg-slate-900">
            <div><dt>Employment Start Date</dt><dd className="font-semibold">{serviceSnapshot?.employment_start_date || 'Not captured in this submission'}</dd></div>
            <div><dt>{serviceSnapshot?.cutoff_source === 'legacy_evaluation_end' ? 'Legacy Evaluation End Date' : 'Ranking Cycle Coverage End Date'}</dt><dd className="font-semibold">{serviceSnapshot?.reference_date || 'Not captured in this submission'}</dd></div>
            <div><dt>Calculated Years of Service</dt><dd className="font-semibold">{hasRecordedServiceYears ? `${tenureYears} completed years` : 'Not captured in this submission'}</dd></div>
            <div><dt>Applicable HR Criteria Points</dt><dd className="font-semibold">{hasRecordedServiceYears && servicePoints != null ? `${servicePoints} points` : 'Not available'}</dd></div>
          </dl>
          {serviceSnapshot?.requires_hr_verification && <p className="mt-2 font-semibold text-amber-800 dark:text-amber-300">Documented employment exception: credited service is preserved and needs HR verification.</p>}
        </details>
      </section>

      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#131e2e]">
        {reviewOnly && <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-emerald-50 px-5 py-3 dark:border-slate-800 dark:bg-emerald-950/20">
          <div><p className="text-sm font-bold text-slate-950 dark:text-white">Portfolio ready for inspection</p><p className="text-xs text-slate-600 dark:text-slate-300">Read the submitted booklet and evidence before starting the evaluation.</p></div>
          {onStartEvaluation && <button type="button" onClick={startEvaluation} disabled={starting} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50">{starting ? 'Starting…' : 'Start Evaluation'}</button>}
          {startError && <p role="alert" className="w-full text-sm font-semibold text-rose-700 dark:text-rose-300">{startError}</p>}
        </div>}
        {canEvaluate && workspaceMode === 'split' && <div className="flex shrink-0 border-b border-slate-200 bg-white p-2 lg:hidden dark:border-slate-800 dark:bg-slate-950" role="group" aria-label="Evaluation view">
          <button type="button" onClick={() => setMobilePane('portfolio')} aria-pressed={mobilePane === 'portfolio'} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mobilePane === 'portfolio' ? 'bg-emerald-800 text-white' : 'text-slate-700 dark:text-slate-200'}`}>Portfolio</button>
          <button type="button" onClick={() => setMobilePane('evaluation')} aria-pressed={mobilePane === 'evaluation'} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mobilePane === 'evaluation' ? 'bg-emerald-800 text-white' : 'text-slate-700 dark:text-slate-200'}`}>Evaluation</button>
        </div>}
        <div className="flex-1 grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-12">
          {/* Left: Document Preview & Portfolio Navigator */}
          <div
            className={`overflow-hidden border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ${
              workspaceMode === 'preview'
                ? 'col-span-12'
                : workspaceMode === 'scoring'
                ? 'hidden'
                : `${mobilePane === 'evaluation' ? 'hidden lg:block' : 'block'} col-span-12 lg:col-span-7`
            }`}
          >
            <PortfolioNavigator
              submission={submission}
              evidenceItems={evidenceItems}
              selectedEvidence={selectedEvidence}
              onSelectEvidence={canEvaluate ? selectEvidence : undefined}
              onSelectAreaARow={canEvaluate && !isFaculty ? selectAreaARow : undefined}
              selectedAreaACode={selectedAreaACode}
              onOpenEvidence={openEvidence}
              bookletOnly
              workspaceMode={workspaceMode}
              onWorkspaceModeChange={canEvaluate ? handleWorkspaceModeChange : undefined}
              onUpdateAreaADs={canEditAreaADs ? handleUpdateAreaADs : undefined}
            />
          </div>

          {/* Right: Active Dynamic Criterion Evaluation */}
          {canEvaluate && <div
            aria-label="Evaluation of selected accomplishment"
            className={`overflow-y-auto p-5 bg-white dark:bg-[#131e2e] transition-all duration-200 ${
              workspaceMode === 'scoring'
                ? 'col-span-12 max-w-4xl mx-auto w-full'
                : workspaceMode === 'preview'
                ? 'hidden'
                : `${mobilePane === 'portfolio' ? 'hidden lg:block' : 'block'} col-span-12 lg:col-span-5`
            }`}
          >
            {selectedAreaARow ? <NonTeachingAreaAEvaluation row={selectedAreaARow} onUpdateAreaADs={canEditAreaADs ? handleUpdateAreaADs : undefined} /> : (!isFaculty && String(selectedEvidence?.categoryArea || '').toLowerCase() === 'areab') ? <NonTeachingCriterionEvaluation
              selectedEvidence={selectedEvidence}
              evidence={evidenceFor(selectedEvidence)}
              categoryRaw={scores.areaB?.categoryTotals?.[String(selectedEvidence?.criterionCode || '').toUpperCase().slice(0, 3)] || 0}
              criteriaSnapshot={submission.criteria_snapshot}
              onVerifyAndNext={handleVerifyAndNext}
              onReject={handleReject}
              onOpenEvidence={setPreviewEvidence}
              onRemarksChange={(itemId, value) => {
                setDraftSaveMessage('')
                setDraftSaveError(false)
                setDraftRemarks(current => ({ ...current, [itemId]: value }))
                setEvidenceItems(current => current.map(item => item.id === itemId ? { ...item, evaluatorRemarks: value } : item))
              }}
            /> : <CriterionEvaluation
              selectedEvidence={selectedEvidence}
              evidence={evidenceFor(selectedEvidence)}
              onVerifyAndNext={handleVerifyAndNext}
              onReject={handleReject}
              onOpenEvidence={setPreviewEvidence}
              onRemarksChange={(itemId, value) => {
                setDraftSaveMessage('')
                setDraftSaveError(false)
                setDraftRemarks(current => ({ ...current, [itemId]: value }))
                setEvidenceItems(current => current.map(item => item.id === itemId ? { ...item, evaluatorRemarks: value } : item))
              }}
              workspaceMode={workspaceMode}
              onWorkspaceModeChange={handleWorkspaceModeChange}
              tenureYears={tenureYears}
            />}
            {isReadyForFinalize && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">All evidence decisions are complete. You can revisit any item or complete the evaluation.</p>}
            {selectedIndex >= 0 && <nav aria-label="Submitted accomplishments" className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button type="button" onClick={() => moveSelection(-1)} disabled={selectedIndex <= 0} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-700"><ChevronLeft className="h-4 w-4" />Previous</button>
              <span className="text-xs font-semibold tabular-nums">{totalCount ? selectedIndex + 1 : 0} of {totalCount}</span>
              <button type="button" onClick={() => moveSelection(1)} disabled={selectedIndex < 0 || selectedIndex >= totalCount - 1} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-slate-700">Next<ChevronRight className="h-4 w-4" /></button>
            </nav>}
            {draftSaveMessage && <p role="status" className={`mt-3 text-xs font-semibold ${draftSaveError ? 'text-rose-700' : 'text-emerald-700'}`}>{draftSaveMessage}</p>}
          </div>}
        </div>
      </div>

      {/* 3. Bottom Decision Bar */}
      {(canEvaluate || canComplete) && <StudioDecisionBar
        isReadyForFinalize={isReadyForFinalize}
        onOpenReturnModal={canEvaluate ? onOpenReturnModal : undefined}
        onOpenFinalizeModal={onOpenFinalizeModal ? handleFinalizeClicked : undefined}
        onOpenRankPreparation={onOpenRankPreparation}
        finalizeLabel={finalizeLabel}
      />}
      {previewEvidence && <PersonnelEvidencePreviewModal evidence={previewEvidence} onClose={() => setPreviewEvidence(null)} />}
    </div>
  )
}
