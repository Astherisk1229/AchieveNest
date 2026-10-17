import React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, AlertCircle, HelpCircle, FileText, ShieldAlert, Check } from 'lucide-react'
import {
  NDMU_PERSONNEL_RATING_RULES,
  SOURCE_CONFIDENCE,
  SCORING_MODES,
  calculateCriterionScore
} from '../../evaluation/rating/NDMURatingEngine'
import FixedScoreControl from '../../evaluation/rating/scoring/FixedScoreControl'
import QuantityDerivedControl from '../../evaluation/rating/scoring/QuantityDerivedControl'
import SingleCategoryControl from '../../evaluation/rating/scoring/SingleCategoryControl'
import MultiFactorControl from '../../evaluation/rating/scoring/MultiFactorControl'
import MatrixLookupControl from '../../evaluation/rating/scoring/MatrixLookupControl'
import ManualBoundedControl from '../../evaluation/rating/scoring/ManualBoundedControl'
import AutomaticDerivedControl from '../../evaluation/rating/scoring/AutomaticDerivedControl'
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
  const [a1Mode, setA1Mode] = useState('phd_degree') // for A.1 qualification switcher

  // Resolve authoritative criterion rule config
  const ruleConfig = useMemo(() => {
    if (!selectedEvidence) return null
    const area = selectedEvidence.categoryArea || selectedEvidence.category_area || 'areaA'
    const code = selectedEvidence.criterionCode || selectedEvidence.criterion_code || 'A.1'
    const key = selectedEvidence.criterionKey || selectedEvidence.criterion_key || 'degrees'

    const areaRules = NDMU_PERSONNEL_RATING_RULES[area]
    if (!areaRules) return null

    const foundCriterion = Object.values(areaRules.criteria || {}).find(
      (c) => c.code === code || c.title?.includes(code)
    )

    return {
      areaRule: areaRules,
      criterionRule: foundCriterion || areaRules.criteria?.[key] || {
        code,
        title: selectedEvidence.criterionTitle || selectedEvidence.title,
        maxPoints: 40,
        scoringMode: SCORING_MODES.SINGLE_CATEGORY,
        sourceConfidence: SOURCE_CONFIDENCE.EXPLICIT
      },
      code
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
      
      if (code === 'A.1') {
        const qType = initPayload.qualificationType || initPayload.type || 'phd_degree'
        setA1Mode(qType)
      }

      const pts = selectedEvidence.awardedPoints !== undefined && (selectedEvidence.ratingStatus === 'rated' || selectedEvidence.rating_status === 'rated')
        ? parseFloat(selectedEvidence.awardedPoints)
        : calculateCriterionScore(code, mode, initPayload)
      
      setCalculatedPoints(pts)
    }
  }, [selectedEvidence, ruleConfig])

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
  const confidence = criterionRule?.sourceConfidence || SOURCE_CONFIDENCE.EXPLICIT
  const maxPoints = criterionRule?.maxPoints || 40
  const criterionContext = getEvaluationCriterionContext(selectedEvidence)

  const handlePayloadChange = (newPayload, pts) => {
    setScoringPayload(newPayload)
    if (pts !== undefined) {
      setCalculatedPoints(pts)
    } else {
      const computed = calculateCriterionScore(criterionCode, scoringMode, newPayload)
      setCalculatedPoints(computed)
    }
  }

  const handleA1TypeSwitch = (typeKey) => {
    setA1Mode(typeKey)
    const updated = { ...scoringPayload, qualificationType: typeKey, type: typeKey }
    const pts = calculateCriterionScore('A.1', SCORING_MODES.QUANTITY_DERIVED, updated)
    handlePayloadChange(updated, pts)
  }

  const isManual = scoringMode === SCORING_MODES.MANUAL_BOUNDED
  const criterionSnapshot = (() => {
    const value = selectedEvidence.criterionSnapshot || selectedEvidence.criterion_snapshot
    if (typeof value === 'string') { try { return JSON.parse(value) } catch { return {} } }
    return value && typeof value === 'object' ? value : {}
  })()
  const autoAwardMaximum = criterionSnapshot.award_maximum_after_evidence_verification === true
  const effectiveMaximum = autoAwardMaximum
    ? Number(criterionSnapshot.criterion_cap || criterionSnapshot.category?.max_points || selectedEvidence.configuredPoints || selectedEvidence.configured_points_snapshot || maxPoints)
    : maxPoints
  const manualJustification = scoringPayload.justification || scoringPayload.manualJustification || ''
  const isConfirmDisabled = savingDecision || (isManual && (manualJustification.trim().length < 10 || calculatedPoints < 0))

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

  // Area A items of Non-Teaching Faculty come from the confirmed NTF annual-review workbook and are read-only.
  const lockedPayload = (() => { const raw = selectedEvidence.scoring_payload ?? selectedEvidence.scoringPayload; if (!raw) return {}; if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } } return raw })()
  if (selectedEvidence.domain === 'ntf_annual_review' || (lockedPayload.locked === true && lockedPayload.source === 'ntf_annual_review_workbook')) {
    const years = lockedPayload.school_years || []
    const points = Number(selectedEvidence.accepted_points ?? selectedEvidence.awarded_points ?? selectedEvidence.awardedPoints ?? 0)
    return (
      <section aria-label="Locked annual review score" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black text-slate-950 dark:text-white">{selectedEvidence.criterion_code || selectedEvidence.criterionCode} {selectedEvidence.criterion_title || selectedEvidence.criterionTitle}</h2><span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200">Locked</span></div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">This Area A score comes from the confirmed NTF annual-review workbook: the average of DS × weight over the two required school years. It cannot be changed in the evaluation. To correct it, HR re-imports the workbook before the portfolio is submitted.</p>
        <dl className="grid gap-3 rounded-xl border border-slate-200 p-4 text-sm sm:grid-cols-3 dark:border-slate-800">
          {[0, 1].map(i => <div key={i}><dt className="text-slate-500">SY {years[i] || '—'}</dt><dd className="mt-1 font-bold tabular-nums">DS {lockedPayload.ds?.[i] ?? '—'} → {lockedPayload.points?.[i] ?? '—'} pts</dd></div>)}
          <div><dt className="text-slate-500">Locked Area A points</dt><dd className="mt-1 text-lg font-black tabular-nums text-emerald-800 dark:text-emerald-300">{points.toFixed(2)}</dd></div>
        </dl>
      </section>
    )
  }
  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {(selectedEvidence.ratingStatus === 'rated' || selectedEvidence.rating_status === 'rated') && selectedEvidence.verificationStatus === 'verified' && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">{['A1_PHD_UNITS', 'A1_MA_UNITS', 'A.1.2', 'A.1.4'].includes(String(selectedEvidence.criterionKey || selectedEvidence.criterion_key || '').toUpperCase()) ? 'Graduate units already approved; their points are counted in the level total.' : `Already approved: ${Number(selectedEvidence.awardedPoints ?? selectedEvidence.awarded_points ?? 0).toFixed(2)} pts.`} The saved decision is loaded; no re-entry is needed.</div>}
      {/* Criterion Header & Source-of-Truth Confidence Badge */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              NDMU CRITERION {criterionCode}: {criterionRule?.title}
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

        {/* Source Confidence & Gate Status Tag */}
        <div className="flex items-center gap-2 pt-1">
          {confidence === SOURCE_CONFIDENCE.EXPLICIT && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Official Rating Sheet (Explicit Rule)
            </span>
          )}
          {confidence === SOURCE_CONFIDENCE.STRUCTURALLY_IMPLIED && (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" /> Provisional Score (Structurally Implied Rule)
            </span>
          )}
          {confidence === SOURCE_CONFIDENCE.UNDEFINED && (
            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
              Manual HR Rating (Undefined Exact Allocation)
            </span>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <h4 className="text-sm font-bold">Supporting evidence</h4>
        {evidence.length ? <div className="mt-2 space-y-2">{evidence.map((proof, index) => <button key={proof.id || index} type="button" onClick={() => onOpenEvidence?.(proof)} className="flex w-full items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:text-emerald-200 dark:hover:bg-emerald-950/20"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate">{proof.original_filename}</span></button>)}</div> : <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No supporting document is attached to this item.</p>}
      </section>

      {/* Dynamic Criterion Rating Control */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-4">
        {/* Special A.1 Degrees vs Units Multi-Path Selector */}
        {autoAwardMaximum ? (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            <p className="font-bold">Automatic full-maximum scoring</p>
            <p className="mt-1">If you verify this evidence as qualifying, the system awards <strong>{effectiveMaximum.toFixed(2)} points</strong> from the locked criteria version. The category and Area caps still apply.</p>
          </div>
        ) : criterionCode === 'A.1' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Educational Qualification Path
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleA1TypeSwitch('phd_degree')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    a1Mode === 'phd_degree'
                      ? 'bg-[#176B43] text-white border-[#176B43]'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  Ph.D. Degree Holder (40 pts)
                </button>
                <button
                  type="button"
                  onClick={() => handleA1TypeSwitch('ma_degree')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    a1Mode === 'ma_degree'
                      ? 'bg-[#176B43] text-white border-[#176B43]'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  MA Degree Holder (20 pts)
                </button>
                <button
                  type="button"
                  onClick={() => handleA1TypeSwitch('phd_units')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    a1Mode === 'phd_units'
                      ? 'bg-[#176B43] text-white border-[#176B43]'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  Ph.D. Units (2 pts / 3 units)
                </button>
                <button
                  type="button"
                  onClick={() => handleA1TypeSwitch('ma_units')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    a1Mode === 'ma_units'
                      ? 'bg-[#176B43] text-white border-[#176B43]'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  MA Units (1 pt / 3 units)
                </button>
              </div>
            </div>

            {a1Mode === 'phd_degree' && (
              <FixedScoreControl
                title="Ph.D. Qualification Score"
                points={40}
                maxPoints={40}
                label="Ph.D. / Doctorate Degree Holder"
              />
            )}
            {a1Mode === 'ma_degree' && (
              <FixedScoreControl
                title="Master's Qualification Score"
                points={20}
                maxPoints={40}
                label="Master's (MA/MS) Degree Holder"
              />
            )}
            {(a1Mode === 'phd_units' || a1Mode === 'ma_units') && (
              <QuantityDerivedControl
                payload={{ ...scoringPayload, qualificationType: a1Mode }}
                onChange={handlePayloadChange}
              />
            )}
          </div>
        ) : scoringMode === SCORING_MODES.SINGLE_CATEGORY ? (
          <SingleCategoryControl
            title={criterionRule?.inputLabel || criterionRule?.input_label || criterionRule?.classificationLabel || criterionRule?.classification_label || 'Applicable classification'}
            options={criterionRule?.options || []}
            value={scoringPayload}
            onChange={handlePayloadChange}
          />
        ) : scoringMode === SCORING_MODES.MULTI_FACTOR ? (
          <MultiFactorControl
            payload={scoringPayload}
            factors={criterionRule?.factors || {}}
            onChange={handlePayloadChange}
          />
        ) : scoringMode === SCORING_MODES.MATRIX_LOOKUP ? (
          <MatrixLookupControl
            criterionCode={criterionCode}
            payload={scoringPayload}
            onChange={handlePayloadChange}
          />
        ) : scoringMode === SCORING_MODES.MANUAL_BOUNDED ? (
          <ManualBoundedControl
            maxPoints={maxPoints}
            payload={scoringPayload}
            onChange={handlePayloadChange}
          />
        ) : scoringMode === SCORING_MODES.AUTOMATIC_DERIVED ? (
          <AutomaticDerivedControl
            tenureYears={tenureYears}
            maxPoints={maxPoints}
          />
        ) : null}

        {/* Calculated Points Earned Bar */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Points Earned for Criterion</span>
          <span className="text-sm font-extrabold text-[#176B43] dark:text-emerald-400">
            {autoAwardMaximum ? `${effectiveMaximum.toFixed(2)} / ${effectiveMaximum.toFixed(2)} Points after verification` : `${calculatedPoints.toFixed(2)} / ${maxPoints}.00 Points Max`}
          </span>
        </div>

        {/* This context is frozen on the submitted item. Editable remarks never drive scoring. */}
        {actionError && <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">{actionError}</p>}
        <div className="space-y-3 pt-2">
          <details className="group rounded-xl border border-slate-200 dark:border-slate-800">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-200">
              <span>Criterion details</span>
              <span className="text-[11px] font-semibold text-slate-500 group-open:hidden dark:text-slate-400">Show</span>
              <span className="hidden text-[11px] font-semibold text-slate-500 group-open:inline dark:text-slate-400">Hide</span>
            </summary>
            <dl className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50/70 p-3 text-[11px] dark:border-slate-800 dark:bg-slate-900/60">
            {[
              ['Category', criterionContext.category],
              ['Subcategory', criterionContext.subcategory],
              ['Level', criterionContext.level],
              ['Configured points', criterionContext.configuredPoints],
              ['Category cut-off', criterionContext.categoryCutoff],
              ['Criteria version ID', criterionContext.criteriaVersionId],
            ].filter(([, value]) => value !== '').map(([label, value]) => <div key={label} className="min-w-0"><dt className="font-bold text-slate-500">{label}</dt><dd className="mt-0.5 truncate font-semibold text-slate-800 dark:text-slate-200">{value}{['Configured points', 'Category cut-off'].includes(label) ? ' pts' : ''}</dd></div>)}
            </dl>
          </details>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500">Evaluator Item Remarks</label>
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
    </div>
  )
}
