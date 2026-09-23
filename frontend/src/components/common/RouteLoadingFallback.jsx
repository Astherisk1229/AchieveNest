import React from 'react'
import { Loader2 } from 'lucide-react'
import { AchieveNestLogo } from '../brand'

export default function RouteLoadingFallback() {
  return (
    <div 
      role="status" 
      aria-label="Loading page content" 
      className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3 font-sans animate-in fade-in duration-150"
    >
      <div className="rounded-xl bg-white p-1.5"><AchieveNestLogo variant="mark" size="compact" /></div>
      <div className="flex items-center gap-2 text-[#064e2b] dark:text-emerald-400"><Loader2 className="w-5 h-5 animate-spin" /><span className="sr-only">Loading</span></div>
      <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">
        Loading view...
      </p>
    </div>
  )
}
