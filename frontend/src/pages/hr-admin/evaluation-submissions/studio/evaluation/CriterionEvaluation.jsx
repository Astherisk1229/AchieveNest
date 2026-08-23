import React, { useState, useEffect, useMemo } from 'react'
import { CheckCircle2, AlertCircle, HelpCircle, ChevronRight, MessageSquare, ExternalLink, FileText, ShieldAlert, Check } from 'lucide-react'
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

export default function CriterionEvaluation({
  selectedEvidence,
  onVerifyAndNext,
  onVerify,
  onReject,
  hasNextItem = false,
  workspaceMode = 'split',
  onWorkspaceModeChange,
  tenureYears = 0
}) {
  const [scoringPayload, setScoringPayload] = useState({})
  const [calculatedPoints, setCalculatedPoints] = useState(0)
  const [remarks, setRemarks] = useState('')
  const [showRemarks, setShowRemarks] = useState(false)
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
      setRemarks(selectedEvidence.evaluatorRemarks || selectedEvidence.evaluator_remarks || '')
      
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
  const manualJustification = scoringPayload.justification || scoringPayload.manualJustification || ''
  const isConfirmDisabled = isManual && (manualJustification.trim().length < 10 || calculatedPoints < 0)

  const handleConfirmCurrent = () => {
    if (onVerify) {
      onVerify(selectedEvidence.id, calculatedPoints, scoringPayload, remarks)
    }
  }

  const handleConfirmNextCurrent = () => {
    if (onVerifyAndNext) {
      onVerifyAndNext(selectedEvidence.id, calculatedPoints, scoringPayload, remarks)
    }
  }

  const handleMarkIneligible = () => {
    if (onReject) {
      onReject(selectedEvidence.id, remarks)
    }
  }

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
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
              onClick={() => onWorkspaceModeChange('split')}
              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-[11px] font-bold shrink-0 transition cursor-pointer"
            >
              Show Preview
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

      {/* Document Proof Preview Shell */}
      <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <FileText className="w-4 h-4 text-[#176B43] dark:text-emerald-400" />
            <span className="truncate">{selectedEvidence.fileName || `${selectedEvidence.title || 'Evidence'}_Proof.pdf`}</span>
          </div>
          <a
            href={selectedEvidence.fileUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => { if (!selectedEvidence.fileUrl) e.preventDefault() }}
            className="text-[11px] font-bold text-[#176B43] dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Open Original</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="h-40 p-4 bg-white dark:bg-slate-950 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#176B43] dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Official Institutional Evidence Document</p>
            <p className="text-[10px] text-slate-400 font-mono">Authenticated Attachment</p>
          </div>
        </div>
      </div>

      {/* Dynamic Criterion Rating Control */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-4">
        {/* Special A.1 Degrees vs Units Multi-Path Selector */}
        {criterionCode === 'A.1' ? (
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
            title={criterionCode === 'A.2' ? 'Organization Role' : (criterionCode === 'A.3' ? 'Seminar / Training Level' : 'Instructional Material Type')}
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
            {calculatedPoints.toFixed(2)} / {maxPoints}.00 Points Max
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {hasNextItem ? (
            <button
              type="button"
              disabled={isConfirmDisabled}
              onClick={handleConfirmNextCurrent}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#176B43] hover:bg-[#125334] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Rating &amp; Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isConfirmDisabled}
              onClick={handleConfirmCurrent}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#176B43] hover:bg-[#125334] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Rating (+{calculatedPoints} pts)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleMarkIneligible}
            className="py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer border border-rose-200 dark:border-rose-800"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Mark Evidence Ineligible</span>
          </button>
        </div>

        {/* Contextual Evaluator Remarks */}
        <div className="pt-2">
          {!showRemarks ? (
            <button
              type="button"
              onClick={() => setShowRemarks(true)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>+ Add Evaluator Item Remark</span>
            </button>
          ) : (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-[11px] font-bold text-slate-500">
                Evaluator Item Remarks
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optional verification/rating observation for this evidence item..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
