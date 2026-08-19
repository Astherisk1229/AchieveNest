import React from 'react'
import { Loader2 } from 'lucide-react'

export default function RouteLoadingFallback() {
  return (
    <div 
      role="status" 
      aria-label="Loading page content" 
      className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3 font-sans animate-in fade-in duration-150"
    >
      <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-[#1b4332] dark:text-emerald-400 shadow-2xs">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">
        Loading view...
      </p>
    </div>
  )
}
