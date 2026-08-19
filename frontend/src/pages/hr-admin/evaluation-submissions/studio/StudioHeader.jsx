import React from 'react'
import { ArrowLeft, Save, X, Columns, Edit3, Eye } from 'lucide-react'

export default function StudioHeader({
  submission,
  scores = {},
  workspaceMode = 'split',
  onWorkspaceModeChange,
  onBack,
  onSave,
  onClose,
  lastSavedText = 'Saved 10:42 PM'
}) {
  if (!submission) return null

  const areaA = scores.areaA?.total || 55
  const areaBAwarded = scores.areaB?.awardedTotal || 18
  const areaBRaw = scores.areaB?.rawTotal || 18
  const areaC = scores.areaC?.total || 23
  const grandTotal = scores.grandTotalAwarded || 96

  return (
    <div className="h-14 px-4 bg-[#131e2e] border-b border-slate-800 flex items-center justify-between gap-3 text-white shrink-0 font-sans overflow-hidden">
      {/* Left: Back Button & Candidate Identity (Single Line) */}
      <div className="flex items-center gap-2.5 min-w-0 shrink">
        <button
          type="button"
          onClick={onBack}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Verification Queue</span>
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={submission.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={submission.faculty_name}
            className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white truncate">{submission.faculty_name}</h2>
              <span className="font-mono text-[9px] text-slate-400 font-medium bg-slate-800/80 px-1.5 py-0.5 rounded shrink-0">
                {submission.employee_id || 'EMP-2019-8881'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {submission.college || 'CEAC'} · {submission.department || 'Computer Studies'}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Inline Score Summary (Quiet A/B/C + Prominent Total) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/50 text-[11px] font-medium text-slate-300">
          <span>A: <strong className="text-white font-bold">{areaA}</strong>/70</span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-0.5">
            B: <strong className="text-white font-bold">{areaBAwarded}</strong>/50
            {areaBRaw > areaBAwarded && (
              <span className="text-[9px] text-amber-400 font-semibold ml-0.5">
                (Capped)
              </span>
            )}
          </span>
          <span className="text-slate-600">|</span>
          <span>C: <strong className="text-white font-bold">{areaC}</strong>/40</span>
        </div>

        <div className="px-3 py-1 rounded-lg bg-[#1b4332] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs shrink-0">
          <span className="text-[9px] text-emerald-300 uppercase tracking-wider font-extrabold">TOTAL</span>
          <span className="text-xs font-black text-emerald-200">{grandTotal} / 160 pts</span>
        </div>
      </div>

      {/* Right: Workspace Mode Controls & Actions (Never Wraps) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Segmented Mode Switcher */}
        {onWorkspaceModeChange && (
          <div className="flex items-center p-0.5 rounded-lg bg-slate-800 border border-slate-700">
            <button
              type="button"
              onClick={() => onWorkspaceModeChange('split')}
              title="Split View (Dual Pane)"
              className={`p-1.5 rounded text-xs font-extrabold flex items-center gap-1 transition cursor-pointer ${
                workspaceMode === 'split'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onWorkspaceModeChange('scoring')}
              title="Scoring Focus Mode"
              className={`p-1.5 rounded text-xs font-extrabold flex items-center gap-1 transition cursor-pointer ${
                workspaceMode === 'scoring'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onWorkspaceModeChange('preview')}
              title="Preview Focus Mode"
              className={`p-1.5 rounded text-xs font-extrabold flex items-center gap-1 transition cursor-pointer ${
                workspaceMode === 'preview'
                  ? 'bg-[#1b4332] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <span className="text-[10px] font-medium text-slate-400 font-mono hidden xl:inline-block">
          {lastSavedText}
        </span>

        <button
          type="button"
          onClick={onSave}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700/60"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Exit Studio"
          className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          title="Exit Studio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
