import React from 'react'
import { Select, SelectItem } from '../../../../../../components/ui/select'
import { calculateCriterionScore, SCORING_MODES } from '../NDMURatingEngine'

export default function MultiFactorScoring({
  criterionCode,
  rule,
  payload = {},
  onChange,
  disabled = false
}) {
  const factors = rule.factors || {}

  const handleFactorChange = (factorKey, val) => {
    const updatedPayload = { ...payload, [factorKey]: val }
    const calculatedPoints = calculateCriterionScore(criterionCode, SCORING_MODES.MULTI_FACTOR, updatedPayload)
    onChange(updatedPayload, calculatedPoints)
  }

  return (
    <div className="space-y-4">
      {/* B.1 Guest Lecturer / Consultant / Judge */}
      {criterionCode === 'B.1' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Sponsoring Organization
            </label>
            <Select
              value={payload.sponsoringOrg || 'local'}
              onValueChange={(val) => handleFactorChange('sponsoringOrg', val)}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              {factors.sponsoringOrg?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} ({o.points} pts)</SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Extent of Talk / Duration
            </label>
            <Select
              value={payload.extentOfTalk || '1_hour'}
              onValueChange={(val) => handleFactorChange('extentOfTalk', val)}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              {factors.extentOfTalk?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} ({o.points} pts)</SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              3. Participants / Audience Scope
            </label>
            <Select
              value={payload.participantsScope || 'local'}
              onValueChange={(val) => handleFactorChange('participantsScope', val)}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              {factors.participantsScope?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} ({o.points} pts)</SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              4. Role of Personnel
            </label>
            <Select
              value={payload.role || 'speaker'}
              onValueChange={(val) => handleFactorChange('role', val)}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              {factors.role?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} ({o.points} pts)</SelectItem>
              ))}
            </Select>
          </div>
        </>
      )}

      {/* B.2 Publication of Scholarly Paper / Article / Book */}
      {criterionCode === 'B.2' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Publication Scope
            </label>
            <Select
              value={payload.publicationScope || 'local'}
              onValueChange={(val) => handleFactorChange('publicationScope', val)}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              {factors.publicationScope?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} ({o.multiplier}x multiplier)</SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Publication Type
            </label>
            <Select
              value={payload.publicationType || 'article'}
              onValueChange={(val) => handleFactorChange('publicationType', val)}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              {factors.publicationType?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} ({o.basePoints} base pts)</SelectItem>
              ))}
            </Select>
          </div>
        </>
      )}

      {/* B.4 Professional Recognition or Awards */}
      {criterionCode === 'B.4' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Recognition Status
            </label>
            <Select
              value={payload.recognitionStatus || 'awardee'}
              onValueChange={(val) => handleFactorChange('recognitionStatus', val)}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              {factors.recognitionStatus?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} ({o.basePoints} base pts)</SelectItem>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Award Conferring Scope
            </label>
            <Select
              value={payload.awardScope || 'local'}
              onValueChange={(val) => handleFactorChange('awardScope', val)}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              {factors.awardScope?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} ({o.multiplier}x multiplier)</SelectItem>
              ))}
            </Select>
          </div>
        </>
      )}
    </div>
  )
}
