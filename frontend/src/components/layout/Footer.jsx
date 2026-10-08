import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { AchieveNestLogo } from '../brand'

export default function Footer() {
  return (
    <footer className="mt-12 w-full shrink-0 border-t border-slate-200/80 bg-white/80 px-4 py-4 text-xs font-sans text-slate-500 transition-colors duration-200 dark:border-slate-800/80 dark:bg-[#0d1520]/80 dark:text-slate-400 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col items-center justify-between gap-3 pr-12 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="rounded bg-white px-1 py-0.5"><AchieveNestLogo variant="horizontal" size="compact" /></span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16834a]" /> Secure Portal
          </span>
          <span className="hidden sm:inline">&bull;</span>
          <span>Student &amp; Personnel Achievement Management</span>
        </div>
      </div>
    </footer>
  )
}
