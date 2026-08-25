import React from 'react'
import { Select, SelectItem } from '../../../../../../components/ui/select'
import { calculateCriterionScore, SCORING_MODES } from '../NDMURatingEngine'

export default function MatrixLookupControl({
  criterionCode = 'B.4',
  payload = {},
  onChange,
  disabled = false
}) {
  if (criterionCode === 'B.2') {
    const scope = payload.scope || payload.publicationScope || 'national'
    const pubType = payload.publicationType || 'scholarly_paper'

    const scopeMap = { local: 3, regional: 4, national: 6, international: 8 }
    const typeMap = {
      book: 10,
      research_output: 10,
      scholarly_paper: 8,
      monograph: 8,
      compilation: 5,
      article: 5,
      reviews: 4,
      commentary: 2
    }

    const scopePts = scopeMap[scope] || 6
    const typePts = typeMap[pubType] || 8
    const calculatedPoints = Math.min(40, scopePts + typePts)

    const handleScopeChange = (val) => {
      const updated = { ...payload, scope: val, publicationScope: val }
      const pts = calculateCriterionScore('B.2', SCORING_MODES.MATRIX_LOOKUP, updated)
      onChange(updated, pts)
    }

    const handleTypeChange = (val) => {
      const updated = { ...payload, publicationType: val }
      const pts = calculateCriterionScore('B.2', SCORING_MODES.MATRIX_LOOKUP, updated)
      onChange(updated, pts)
    }

    return (
      <div className="space-y-4 font-sans">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            1. Publication Location / Scope
          </label>
          <Select
            value={scope}
            onValueChange={handleScopeChange}
            disabled={disabled}
            className="w-full"
            triggerClassName="py-2 text-xs"
          >
            <SelectItem value="international">International Publication (8 pts)</SelectItem>
            <SelectItem value="national">National Publication (6 pts)</SelectItem>
            <SelectItem value="regional">Regional Publication (4 pts)</SelectItem>
            <SelectItem value="local">Local Publication (3 pts)</SelectItem>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            2. Type of Publication
          </label>
          <Select
            value={pubType}
            onValueChange={handleTypeChange}
            disabled={disabled}
            className="w-full"
            triggerClassName="py-2 text-xs"
          >
            <SelectItem value="book">Authored Book (10 pts)</SelectItem>
            <SelectItem value="research_output">Research Output (10 pts)</SelectItem>
            <SelectItem value="scholarly_paper">Scholarly Paper in Refereed Journal (8 pts)</SelectItem>
            <SelectItem value="monograph">Monograph (8 pts)</SelectItem>
            <SelectItem value="compilation">Research Compilation (5 pts)</SelectItem>
            <SelectItem value="article">Journal Article / Academic Essay (5 pts)</SelectItem>
            <SelectItem value="reviews">Reviews (4 pts)</SelectItem>
            <SelectItem value="commentary">Commentary (2 pts)</SelectItem>
          </Select>
        </div>

        {/* Breakdown Box */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Provisional Calculated Score</span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Structurally Implied Rule</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
            <span>{scopePts} (Scope) + {typePts} (Type)</span>
            <strong className="text-[#176B43] dark:text-emerald-400 font-bold">= {calculatedPoints}.00 pts</strong>
          </div>
        </div>
      </div>
    )
  }

  // B.4 Professional Recognition or Awards (Matrix Lookup)
  const status = payload.recognitionStatus || 'awardee'
  const awardScope = payload.awardScope || payload.scope || 'national'

  const handleStatusChange = (val) => {
    const updated = { ...payload, recognitionStatus: val }
    const pts = calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, updated)
    onChange(updated, pts)
  }

  const handleAwardScopeChange = (val) => {
    const updated = { ...payload, awardScope: val, scope: val }
    const pts = calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, updated)
    onChange(updated, pts)
  }

  const currentPts = calculateCriterionScore('B.4', SCORING_MODES.MATRIX_LOOKUP, { recognitionStatus: status, awardScope })

  return (
    <div className="space-y-4 font-sans">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          1. Recognition Status
        </label>
        <Select
          value={status}
          onValueChange={handleStatusChange}
          disabled={disabled}
          className="w-full"
          triggerClassName="py-2 text-xs"
        >
          <SelectItem value="awardee">Awardee / Recipient</SelectItem>
          <SelectItem value="nominee">Nominee / Finalist</SelectItem>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          2. Award Scope / Body
        </label>
        <Select
          value={awardScope}
          onValueChange={handleAwardScopeChange}
          disabled={disabled}
          className="w-full"
          triggerClassName="py-2 text-xs"
        >
          <SelectItem value="international">International Body ({status === 'awardee' ? 40 : 20} pts)</SelectItem>
          <SelectItem value="national">National Body ({status === 'awardee' ? 40 : 20} pts)</SelectItem>
          <SelectItem value="provincial_regional">Provincial / Regional Body ({status === 'awardee' ? 30 : 15} pts)</SelectItem>
          <SelectItem value="local">Local / Institutional Body ({status === 'awardee' ? 10 : 5} pts)</SelectItem>
        </Select>
      </div>

      {/* Breakdown Box */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Matrix Lookup Result</span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Explicit Matrix</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
          <span>{status === 'awardee' ? 'Awardee' : 'Nominee'} × {awardScope}</span>
          <strong className="text-[#176B43] dark:text-emerald-400 font-bold">= {currentPts}.00 pts</strong>
        </div>
      </div>
    </div>
  )
}
