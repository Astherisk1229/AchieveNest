import React from 'react'
import { Select, SelectItem } from '../../../../../../components/ui/select'

export default function QuantityDerivedControl({
  payload = {},
  onChange,
  disabled = false
}) {
  const qualificationType = payload.qualificationType || payload.type || 'phd_units'
  const units = parseInt(payload.verifiedUnits ?? payload.units ?? 0, 10)

  const isPhd = qualificationType === 'phd_units'
  const pointsPerBlock = isPhd ? 2 : 1
  const completedBlocks = Math.floor(Math.max(0, units) / 3)
  const calculatedPoints = Math.min(10, completedBlocks * pointsPerBlock)

  const handleTypeChange = (val) => {
    const updated = {
      ...payload,
      qualificationType: val,
      type: val,
      verifiedUnits: units,
      units
    }
    const pts = Math.min(10, Math.floor(Math.max(0, units) / 3) * (val === 'phd_units' ? 2 : 1))
    onChange(updated, pts)
  }

  const handleUnitsChange = (e) => {
    const rawVal = e.target.value
    const num = Math.max(0, parseInt(rawVal || 0, 10))
    const updated = {
      ...payload,
      qualificationType,
      type: qualificationType,
      verifiedUnits: num,
      units: num
    }
    const pts = Math.min(10, Math.floor(num / 3) * (qualificationType === 'phd_units' ? 2 : 1))
    onChange(updated, pts)
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          Graduate Program Level
        </label>
        <Select
          value={qualificationType}
          onValueChange={handleTypeChange}
          disabled={disabled}
          className="w-full"
          triggerClassName="py-2 text-xs"
        >
          <SelectItem value="phd_units">Ph.D. Units (2 pts per 3 completed units, max 10)</SelectItem>
          <SelectItem value="ma_units">MA / Master's Units (1 pt per 3 completed units, max 10)</SelectItem>
        </Select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Verified Units Earned
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            Max: 10.00 pts
          </span>
        </div>
        <input
          type="number"
          min="0"
          max="60"
          value={units}
          onChange={handleUnitsChange}
          disabled={disabled}
          placeholder="Enter completed units..."
          className="w-full px-3.5 py-2 text-sm font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43]"
        />
      </div>

      {/* Breakdown Box */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
        <p className="text-[10px] uppercase font-bold text-slate-400">Calculation Breakdown</p>
        <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
          <span>{units} units → {completedBlocks} completed 3-unit blocks × {pointsPerBlock} pt(s)</span>
          <strong className="text-[#176B43] dark:text-emerald-400 font-bold">= {calculatedPoints}.00 pts</strong>
        </div>
      </div>
    </div>
  )
}
