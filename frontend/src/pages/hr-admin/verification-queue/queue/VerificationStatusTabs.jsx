import React from 'react'
import { Clock, ShieldCheck, RotateCcw, CheckCircle2 } from 'lucide-react'

export default function VerificationStatusTabs({ activeTab, setActiveTab, counts = {} }) {
  const tabs = [
    { id: 'pending', label: 'Pending Review', icon: Clock, count: counts.pending ?? 8 },
    { id: 'in_review', label: 'In Review', icon: ShieldCheck, count: counts.inReview ?? 2 },
    { id: 'returned', label: 'Returned', icon: RotateCcw, count: counts.returned ?? 3 },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: counts.completed ?? 24 },
  ]

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-fit flex-wrap">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              isActive
                ? 'bg-[#1b4332] text-white shadow-2xs dark:bg-emerald-600'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
