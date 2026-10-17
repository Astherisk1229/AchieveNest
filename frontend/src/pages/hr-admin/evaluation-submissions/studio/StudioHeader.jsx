import React from 'react'
import { ArrowLeft, Save, X } from 'lucide-react'

export default function StudioHeader({ submission, onBack, onSave, onClose }) {
  if (!submission) return null

  return <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-[#131e2e] px-4 py-2 text-white">
    <div className="flex min-w-0 items-center gap-3">
      <button type="button" onClick={onBack} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><ArrowLeft className="h-3.5 w-3.5" />Evaluation Queue</button>
      <p className="truncate text-sm font-bold">HR Evaluation</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {onSave && <button type="button" onClick={onSave} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Save className="h-3.5 w-3.5" />Save Draft</button>}
      <button type="button" onClick={onClose} aria-label="Exit Studio" className="rounded-full p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><X className="h-4 w-4" /></button>
    </div>
  </header>
}
