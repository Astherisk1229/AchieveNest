import React from 'react'

export default function ManualBoundedScoring({
  maxPoints = 40,
  payload = {},
  onChange,
  disabled = false
}) {
  const manualPoints = payload.manualPoints !== undefined ? payload.manualPoints : ''
  const justification = payload.justification || ''

  const handlePointsChange = (e) => {
    const rawVal = e.target.value
    if (rawVal === '') {
      onChange({ ...payload, manualPoints: '' }, 0)
      return
    }
    const num = Math.min(maxPoints, Math.max(0, parseFloat(rawVal) || 0))
    onChange({ ...payload, manualPoints: num }, num)
  }

  const handleJustificationChange = (e) => {
    const justText = e.target.value
    const pts = parseFloat(payload.manualPoints || 0)
    onChange({ ...payload, justification: justText }, pts)
  }

  const isJustificationValid = justification.trim().length >= 10

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
        <p className="font-bold">Manual HR Rating Required</p>
        <p className="text-[11px] mt-0.5 opacity-90">
          This criterion allows bounded points from <strong>0 to {maxPoints}</strong> and requires written evaluator justification.
        </p>
      </div>

      {/* Manual Points Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Points Awarded (Max: {maxPoints})
          </label>
          <span className="text-[11px] font-mono font-bold text-slate-400">0.00 – {maxPoints}.00</span>
        </div>
        <input
          type="number"
          min="0"
          max={maxPoints}
          step="0.5"
          value={manualPoints}
          onChange={handlePointsChange}
          disabled={disabled}
          placeholder={`Enter points (0 to ${maxPoints})`}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43] dark:focus:border-emerald-600 transition"
        />
      </div>

      {/* Evaluator Justification Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Evaluator Justification <span className="text-rose-500">*</span>
          </label>
          <span className={`text-[10px] font-semibold ${isJustificationValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {justification.trim().length} / 10 min chars
          </span>
        </div>
        <textarea
          rows={3}
          value={justification}
          onChange={handleJustificationChange}
          disabled={disabled}
          placeholder="State the institutional justification and basis for the awarded rating points..."
          className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43] dark:focus:border-emerald-600 transition"
        />
      </div>
    </div>
  )
}
