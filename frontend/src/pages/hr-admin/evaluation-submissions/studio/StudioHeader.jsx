import React from 'react'
import { ArrowLeft, Save, X, ShieldCheck } from 'lucide-react'

export default function StudioHeader({ submission, onBack, onSave, onClose, lastSavedText = 'Saved 10:42 PM' }) {
  if (!submission) return null

  return (
    <div className="px-6 py-2.5 bg-[#131e2e] border-b border-slate-800 flex items-center justify-between text-white shrink-0 font-sans">
      {/* Left: Back to Queue Button */}
      <button
        type="button"
        onClick={onBack}
        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Verification Queue</span>
      </button>

      {/* Center: Single Source of Truth Faculty Identity */}
      <div className="flex items-center gap-3">
        <img
          src={submission.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={submission.faculty_name}
          className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
        />
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black text-white">{submission.faculty_name}</h2>
          <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-md">
            {submission.employee_id}
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md">
            {submission.college || 'CEAC'} · {submission.department || 'Computer Studies'}
          </span>
        </div>
      </div>

      {/* Right: Session Actions & Save Status */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[10px] font-extrabold text-slate-400 font-mono hidden sm:inline-block">
          {lastSavedText}
        </span>

        <button
          type="button"
          onClick={onSave}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition cursor-pointer"
          title="Exit Studio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
