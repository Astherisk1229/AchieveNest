import React from 'react'

export default function ManualBoundedControl({
  title = 'Manual Bounded Rating',
  maxPoints = 40,
  payload = {},
  onChange,
  disabled = false
}) {
  const manualPoints = payload.manualPoints !== undefined ? payload.manualPoints : (payload.points !== undefined ? payload.points : '')
  const justification = payload.justification || payload.manualJustification || ''

  const handlePointsChange = (e) => {
    const rawVal = e.target.value
    if (rawVal === '') {
      onChange({ ...payload, manualPoints: '', points: '' }, 0)
      return
    }
    const num = Math.min(maxPoints, Math.max(0, parseFloat(rawVal) || 0))
    onChange({ ...payload, manualPoints: num, points: num }, num)
  }

  const handleJustificationChange = (e) => {
    const justText = e.target.value
    const pts = parseFloat(payload.manualPoints || payload.points || 0)
    onChange({ ...payload, justification: justText, manualJustification: justText }, pts)
  }

  const isJustificationValid = justification.trim().length >= 10

  return (
    <div className="space-y-4 font-sans">
      {/* Notice Banner */}
      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
        <p className="font-bold">Manual HR Rating — Undefined Exact Formula</p>
        <p className="text-[11px] mt-0.5 opacity-90">
          The supplied rating sheet provides a maximum limit of <strong>{maxPoints}.00 points</strong> without an exact formula. Enter bounded score and required justification.
        </p>
      </div>

      {/* Manual Points Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Points Awarded (Max: {maxPoints}.00)
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
          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43]"
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
          placeholder="Document the institutional justification and factual basis for this manual score allocation..."
          className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43]"
        />
      </div>
    </div>
  )
}
