import React from 'react'
import { Printer, Download, Globe, ShieldCheck } from 'lucide-react'

export function AwardRosterActions({
  cycleStatus = 'ready_for_review',
  onPrintDraft,
  onExportCsv,
  onPublishRoster,
  onPrintOfficial
}) {
  const isPublished = cycleStatus === 'published' || cycleStatus === 'archived'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPublished ? (
        <>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#1b4332] dark:text-emerald-300 text-xs font-black flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[#2d8a4e]" />
            <span>Published Roster v1.0</span>
          </span>

          <button
            type="button"
            onClick={onPrintOfficial}
            className="px-3 py-1.5 rounded-xl bg-[#1b4332] hover:bg-[#2d8a4e] text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-300" />
            <span>Print Official Roster</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onPrintDraft}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Draft Roster</span>
          </button>

          <button
            type="button"
            onClick={() => onExportCsv && onExportCsv(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Draft CSV</span>
          </button>

          <button
            type="button"
            onClick={onPublishRoster}
            className="px-3 py-1.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
            <span>Publish Official Roster</span>
          </button>
        </>
      )}
    </div>
  )
}

export default AwardRosterActions
