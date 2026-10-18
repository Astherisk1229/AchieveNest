import React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, AlertCircle, HelpCircle, FileText } from 'lucide-react'
import {
  NDMU_PERSONNEL_RATING_RULES,
  SOURCE_CONFIDENCE,
  SCORING_MODES,
  calculateCriterionScore
} from '../../evaluation/rating/NDMURatingEngine'
import ManualBoundedControl from '../../evaluation/rating/scoring/ManualBoundedControl'
import { getEvaluationCriterionContext } from '../../../../../utils/evaluationCriterionContext'

export default function CriterionEvaluation({
  selectedEvidence,
  evidence = [],
  onVerifyAndNext,
  onReject,
  onOpenEvidence,
  onRemarksChange,
  workspaceMode = 'split',
  onWorkspaceModeChange,
  tenureYears = 0
}) {
  const [scoringPayload, setScoringPayload] = useState({})
  const [calculatedPoints, setCalculatedPoints] = useState(0)
  const [remarks, setRemarks] = useState('')
  const [savingDecision, setSavingDecision] = useState(false)
  const [actionError, setActionError] = useState('')

  // Resolve authoritative criterion rule config
  const ruleConfig = useMemo(() => {
    if (!selectedEvidence) return null
    const rawArea = selectedEvidence.categoryArea || selectedEvidence.category_area || ''
    const code = selectedEvidence.criterionCode || selectedEvidence.criterion_code || 'A.1'
    const key = selectedEvidence.criterionKey || selectedEvidence.criterion_key || 'degrees'
    const normalize = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    const normalizedCode = normalize(code)
    const normalizedKey = normalize(key)
    const codeArea = normalizedCode.match(/^([ABC])(?:\d|$)/)?.[1]
    const areaLabel = String(rawArea).toLowerCase().replace(/[^a-z]/g, '')
    const areaFromLabel = ({ areaa: 'A', areab: 'B', areac: 'C', a: 'A', b: 'B', c: 'C' })[areaLabel]
    const areaCode = codeArea || areaFromLabel || 'A'
    const areaKey = `area${areaCode}`
    const areaRules = NDMU_PERSONNEL_RATING_RULES[areaKey]

    const findCriterion = rules => Object.entries(rules?.criteria || {}).find(([criterionKey, criterion]) =>
      normalize(criterion.code) === normalizedCode || normalize(criterionKey) === normalizedKey
    )?.[1]
    const foundCriterion = findCriterion(areaRules) || Object.entries(NDMU_PERSONNEL_RATING_RULES)
      .filter(([registryKey]) => registryKey.startsWith('area'))
      .map(([, rules]) => findCriterion(rules))
      .find(Boolean)

    return {
      areaRule: areaRules,
      criterionRule: foundCriterion || {
        code,
        title: selectedEvidence.criterionTitle || selectedEvidence.title,
        maxPoints: 40,
        scoringMode: SCORING_MODES.SINGLE_CATEGORY,
        sourceConfidence: SOURCE_CONFIDENCE.EXPLICIT
      },
      code: foundCriterion?.code || code
    }
  }, [selectedEvidence])

  useEffect(() => {
    if (selectedEvidence) {
      const initPayload = selectedEvidence.scoringPayload || selectedEvidence.scoring_payload || {}
      setScoringPayload(initPayload)
      const criterionContext = getEvaluationCriterionContext(selectedEvidence)
      setRemarks(selectedEvidence.evaluatorRemarks || selectedEvidence.evaluator_remarks || criterionContext.generatedRemark)
      setActionError('')
      
      const code = ruleConfig?.code || 'A.1'
      const mode = ruleConfig?.criterionRule?.scoringMode || SCORING_MODES.SINGLE_CATEGORY
      
      const pts = selectedEvidence.awardedPoints !== undefined && (selectedEvidence.ratingStatus === 'rated' || selectedEvidence.rating_status === 'rated')
        ? parseFloat(selectedEvidence.awardedPoints)
        : calculateCriterionScore(code, mode, code === 'C.3' ? { ...initPayload, tenureYears } : initPayload)
      
      setCalculatedPoints(pts)
    }
  }, [selectedEvidence, ruleConfig, tenureYears])

  if (!selectedEvidence) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 font-medium rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 space-y-2 font-sans">
        <HelpCircle className="w-6 h-6 mx-auto text-slate-300" />
        <p className="font-bold text-slate-700 dark:text-slate-300">No Evidence Selected</p>
        <p>Select any evidence item from the Attached Evidence navigator to inspect documents and evaluate criteria.</p>
      </div>
    )
  }

  const criterionRule = ruleConfig?.criterionRule
  const criterionCode = ruleConfig?.code || 'A.1'
  const scoringMode = criterionRule?.scoringMode || SCORING_MODES.SINGLE_CATEGORY
  const criterionContext = getEvaluationCriterionContext(selectedEvidence)
  const criterionSnapshot = (() => {
    const value = selectedEvidence.criterionSnapshot || selectedEvidence.criterion_snapshot
    if (typeof value === 'string') { try { return JSON.parse(value) } catch { return {} } }
    return value && typeof value === 'object' ? value : {}
  })()
  const ruleMaximum = Number(criterionRule?.maxPoints)
  const snapshotMaximum = Number(criterionSnapshot.criterion_cap ?? criterionContext.categoryCutoff)
  const availableMaximum = [ruleMaximum, snapshotMaximum].filter(value => Number.isFinite(value) && value > 0)
  const maxPoints = availableMaximum.length ? Math.min(...availableMaximum) : 40

  const handlePayloadChange = (newPayload, pts) => {
    setScoringPayload(newPayload)
    if (pts !== undefined) {
      setCalculatedPoints(pts)
    } else {
      const computed = calculateCriterionScore(criterionCode, scoringMode, newPayload)
      setCalculatedPoints(computed)
    }
  }

  const snapshotCategory = criterionSnapshot.category && typeof criterionSnapshot.category === 'object' ? criterionSnapshot.category : {}
  const snapshotSubcategory = criterionSnapshot.subcategory && typeof criterionSnapshot.subcategory === 'object' ? criterionSnapshot.subcategory : {}
  const hasNoScoringOptions = !Array.isArray(snapshotCategory.options) || snapshotCategory.options.length === 0
  const hasNoScoringBreakdown = (snapshotCategory.requires_manual_hr_rule === 1
    && (!Array.isArray(snapshotCategory.subcategories) || snapshotCategory.subcategories.length === 0))
    || (Object.keys(snapshotSubcategory).length > 0
      && (!Array.isArray(snapshotSubcategory.levels) || snapshotSubcategory.levels.length === 0)
      && Number(snapshotSubcategory.default_points) > 0)
  const autoAwardMaximum = criterionSnapshot.award_maximum_after_evidence_verification === true
    || (criterionSnapshot.evaluator_judgment_required === true && hasNoScoringBreakdown && hasNoScoringOptions)
  const isManual = !autoAwardMaximum && (scoringMode === SCORING_MODES.MANUAL_BOUNDED || criterionContext.manual || criterionSnapshot.evaluator_judgment_required === true)
  const effectiveMaximum = autoAwardMaximum
    ? Number(criterionSnapshot.criterion_cap || criterionSnapshot.category?.max_points || selectedEvidence.configuredPoints || selectedEvidence.configured_points_snapshot || maxPoints)
    : maxPoints
  const manualJustification = scoringPayload.justification || scoringPayload.manualJustification || ''
  const isConfirmDisabled = savingDecision || (isManual && (manualJustification.trim().length < 10 || calculatedPoints <= 0))

  const saveDecision = async callback => {
    if (!callback) return
    setActionError('')
    setSavingDecision(true)
    try { await callback() }
    catch (error) { setActionError(error?.response?.data?.error?.message || error?.error?.message || error?.message || 'The evaluation decision could not be saved. Try again.') }
    finally { setSavingDecision(false) }
  }

  const handleConfirmNextCurrent = () => saveDecision(() => onVerifyAndNext?.(selectedEvidence.id, calculatedPoints, scoringPayload, remarks))

  const handleMarkIneligible = () => {
    if (!remarks.trim()) { setActionError('Enter a reason before rejecting this accomplishment.'); return }
    saveDecision(() => onReject?.(selectedEvidence.id, remarks))
  }

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {(selectedEvidence.ratingStatus === 'rated' || selectedEvidence.rating_status === 'rated') && selectedEvidence.verificationStatus === 'verified' && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">{['A1_PHD_UNITS', 'A1_MA_UNITS', 'A.1.2', 'A.1.4'].includes(String(selectedEvidence.criterionKey || selectedEvidence.criterion_key || '').toUpperCase()) ? 'Graduate units already approved; their points are counted in the level total.' : `Already approved: ${Number(selectedEvidence.awardedPoints ?? selectedEvidence.awarded_points ?? 0).toFixed(2)} pts.`} The saved decision is loaded; no re-entry is needed.</div>}
      {/* Criterion Header & Source-of-Truth Confidence Badge */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wide text-slate-500 dark:text-slate-400">
              {criterionCode} · {criterionRule?.title}
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedEvidence.evidenceTitle || selectedEvidence.title}
            </h3>
          </div>

          {workspaceMode === 'scoring' && onWorkspaceModeChange && (
            <button
              type="button"
            onClick={() => onWorkspaceModeChange('preview')}
              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-[11px] font-bold shrink-0 transition cursor-pointer"
            >
            Show portfolio
            </button>
          )}
        </div>

      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <h4 className="text-sm font-bold">Supporting evidence</h4>
        {evidence.length ? <div className="mt-2 space-y-2">{evidence.map((proof, index) => <button key={proof.id || index} type="button" onClick={() => onOpenEvidence?.(proof)} className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:text-emerald-200 dark:hover:bg-emerald-950/20"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate">{proof.original_filename}</span></button>)}</div> : <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No supporting document is attached to this item.</p>}
      </section>

      {/* Only criteria that require a manually entered score show an input. Other criteria use their saved rule and need only an approve/reject decision. */}
      {isManual ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" aria-label="Score this accomplishment">
          <ManualBoundedControl maxPoints={maxPoints} payload={scoringPayload} onChange={handlePayloadChange} />
          <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">Current score: {calculatedPoints.toFixed(2)} of {maxPoints.toFixed(2)} points</p>
        </section>
      ) : (
        <section className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30" aria-label="Automatic score">
          <div>
            <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Score calculated automatically</p>
            <p className="mt-0.5 text-xs text-emerald-900 dark:text-emerald-300">Review the document, then approve or reject.</p>
          </div>
          <strong className="shrink-0 text-sm tabular-nums text-emerald-900 dark:text-emerald-200">{autoAwardMaximum ? effectiveMaximum.toFixed(2) : calculatedPoints.toFixed(2)} / {maxPoints.toFixed(2)} pts</strong>
        </section>
      )}

        {/* This context is frozen on the submitted item. Editable remarks never drive scoring. */}
        {actionError && <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{actionError}</p>}
        <div className="space-y-3 pt-2">
          <details className="group rounded-xl border border-slate-200 dark:border-slate-800">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-200">
              <span>About this criterion</span>
              <span className="text-[11px] font-semibold text-slate-500 group-open:hidden dark:text-slate-400">Show</span>
              <span className="hidden text-[11px] font-semibold text-slate-500 group-open:inline dark:text-slate-400">Hide</span>
            </summary>
            <dl className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50/70 p-3 text-[11px] dark:border-slate-800 dark:bg-slate-900/60">
            {[
              ['Category', criterionContext.category],
              ['Subcategory', criterionContext.subcategory],
              ['Level', criterionContext.level],
              ['Maximum points', maxPoints],
            ].filter(([, value]) => value !== '').map(([label, value]) => <div key={label} className="min-w-0"><dt className="font-bold text-slate-500">{label}</dt><dd className="mt-0.5 truncate font-semibold text-slate-800 dark:text-slate-200">{value}{label === 'Maximum points' ? ' pts' : ''}</dd></div>)}
            </dl>
          </details>
          <details className="group rounded-xl border border-slate-200 dark:border-slate-800">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-200">
              <span>Reason for rejection{remarks.trim() ? ' · added' : ''}</span>
              <span className="text-[11px] font-semibold text-slate-500 group-open:hidden dark:text-slate-400">Add or edit</span>
              <span className="hidden text-[11px] font-semibold text-slate-500 group-open:inline dark:text-slate-400">Hide</span>
            </summary>
            <div className="space-y-1.5 border-t border-slate-200 p-3 dark:border-slate-800">
              <p className="text-[11px] text-slate-500">A reason is required when rejecting.</p>
              {criterionContext.generatedRemark && <p className="text-[11px] leading-5 text-slate-500">Initial suggestion from the locked criteria version. Edit freely; it does not change scoring.</p>}
              <textarea
                rows={3}
                value={remarks}
                onChange={e => { setRemarks(e.target.value); onRemarksChange?.(selectedEvidence.id, e.target.value) }}
                placeholder="Add an evaluator observation for this evidence item..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43]"
              />
            </div>
          </details>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" disabled={savingDecision} onClick={handleMarkIneligible} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2.5 text-sm font-bold text-rose-800 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-50 dark:border-rose-800 dark:text-rose-200">
              <AlertCircle className="h-4 w-4" /><span>Reject</span>
            </button>
            <button type="button" disabled={isConfirmDisabled} onClick={handleConfirmNextCurrent} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" /><span>Approve</span>
            </button>
          </div>
        </div>
    </div>
  )
}
