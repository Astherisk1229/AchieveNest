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
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900 dark:text-white">Choose a score</p>
        <p className="text-xs text-slate-600 dark:text-slate-300">Award up to {maxPoints} points for this accomplishment.</p>
      </div>

      {/* Manual Points Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Points to award
          </label>
          <span className="text-[11px] font-semibold text-slate-500">0–{maxPoints} points</span>
        </div>
        <input
          type="number"
          min="0"
          max={maxPoints}
          step="0.01"
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
            Why are you awarding this score? <span className="text-rose-500">*</span>
          </label>
          <span className={`text-[10px] font-semibold ${isJustificationValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {isJustificationValid ? 'Ready' : `At least 10 characters (${Math.max(0, 10 - justification.trim().length)} to go)`}
          </span>
        </div>
        <textarea
          rows={3}
          value={justification}
          onChange={handleJustificationChange}
          disabled={disabled}
          placeholder="Briefly explain the evidence for this score (at least 10 characters)."
          className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43]"
        />
      </div>
    </div>
  )
}
