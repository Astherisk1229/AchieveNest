import React from 'react'
import { Select, SelectItem } from '../../../../../../components/ui/select'
import { calculateCriterionScore, SCORING_MODES } from '../NDMURatingEngine'

export default function MixedDegreeScoring({
  rule,
  payload = {},
  onChange,
  disabled = false
}) {
  const currentType = payload.type || 'degree'
  const currentDegree = payload.degree || 'phd'
  const currentProgram = payload.programLevel || 'phd'
  const currentUnits = payload.units !== undefined ? payload.units : 0

  const handleTypeChange = (typeVal) => {
    const updated = { ...payload, type: typeVal }
    const pts = calculateCriterionScore('A.1', SCORING_MODES.MIXED, updated)
    onChange(updated, pts)
  }

  const handleDegreeChange = (degVal) => {
    const updated = { ...payload, type: 'degree', degree: degVal }
    const pts = calculateCriterionScore('A.1', SCORING_MODES.MIXED, updated)
    onChange(updated, pts)
  }

  const handleProgramChange = (progVal) => {
    const updated = { ...payload, type: 'units', programLevel: progVal }
    const pts = calculateCriterionScore('A.1', SCORING_MODES.MIXED, updated)
    onChange(updated, pts)
  }

  const handleUnitsChange = (e) => {
    const num = Math.max(0, parseInt(e.target.value || 0, 10))
    const updated = { ...payload, type: 'units', units: num }
    const pts = calculateCriterionScore('A.1', SCORING_MODES.MIXED, updated)
    onChange(updated, pts)
  }

  return (
    <div className="space-y-4">
      {/* Qualification Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleTypeChange('degree')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${
            currentType === 'degree'
              ? 'bg-white dark:bg-slate-900 text-[#176B43] dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          Degree Holder
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleTypeChange('units')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${
            currentType === 'units'
              ? 'bg-white dark:bg-slate-900 text-[#176B43] dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          Graduate Units Earned
        </button>
      </div>

      {currentType === 'degree' ? (
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Highest Completed Degree
          </label>
          <Select
            value={currentDegree}
            onValueChange={handleDegreeChange}
            disabled={disabled}
            className="w-full"
            triggerClassName="py-2.5 text-xs font-semibold"
          >
            <SelectItem value="phd">Ph.D. / Doctorate Degree Holder (40 pts)</SelectItem>
            <SelectItem value="masters">Master's Degree Holder (20 pts)</SelectItem>
          </Select>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Graduate Program Level
            </label>
            <Select
              value={currentProgram}
              onValueChange={handleProgramChange}
              disabled={disabled}
              className="w-full"
              triggerClassName="py-2 text-xs"
            >
              <SelectItem value="phd">Doctorate Program Units (1.0 pt / unit)</SelectItem>
              <SelectItem value="masters">Master's Program Units (0.5 pt / unit)</SelectItem>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Verified Units Earned (Max: 10 pts)
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Points: {calculateCriterionScore('A.1', SCORING_MODES.MIXED, payload)} / 10
              </span>
            </div>
            <input
              type="number"
              min="0"
              max="50"
              value={currentUnits}
              onChange={handleUnitsChange}
              disabled={disabled}
              className="w-full px-3.5 py-2 text-sm font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43] dark:focus:border-emerald-600 transition"
            />
          </div>
        </div>
      )}
    </div>
  )
}
