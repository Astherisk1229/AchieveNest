import React from 'react'
import { Clock, ShieldCheck, RotateCcw, CheckCircle2 } from 'lucide-react'

export default function VerificationStatusTabs({ activeTab, setActiveTab, counts = {} }) {
  const tabs = [
    { id: 'pending', label: 'Awaiting HR Review', icon: Clock, count: counts.pending ?? 2 },
    { id: 'ready_finalization', label: 'Ready for Finalization', icon: CheckCircle2, count: counts.ready_finalization ?? 1 },
    { id: 'returned', label: 'Returned for Revision', icon: RotateCcw, count: counts.returned ?? 1 },
    { id: 'completed', label: 'Completed', icon: ShieldCheck, count: counts.completed ?? 24 },
  ]

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#1D2A23] border border-[#D9E5DC] dark:border-[#374B3F] w-fit flex-wrap shadow-xs">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              isActive
                ? 'bg-[#176B43] text-white shadow-xs'
                : 'bg-[#F4F7F5] dark:bg-[#121A16] text-[#344A5E] dark:text-[#E6EFE9] hover:bg-[#EAF4EC] hover:text-[#145C39]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#4F6475] dark:text-[#B1C0B6]'}`} />
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              isActive ? 'bg-[#DDF3E5] text-[#145C39]' : 'bg-[#E9EEF2] dark:bg-slate-800 text-[#40566A] dark:text-slate-300'
            }`}>
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
