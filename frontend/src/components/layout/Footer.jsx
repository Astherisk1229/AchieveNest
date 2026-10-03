import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { AchieveNestLogo } from '../brand'

export default function Footer() {
  return (
    <footer className="bg-white/80 dark:bg-[#0d1520]/80 border-t border-slate-200/80 dark:border-slate-800/80 px-6 py-4 mt-auto text-xs text-slate-500 dark:text-slate-400 font-sans transition-colors duration-200 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
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
