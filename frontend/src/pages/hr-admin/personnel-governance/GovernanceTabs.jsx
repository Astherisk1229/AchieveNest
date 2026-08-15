import React from 'react'
import { Users, Building2, Lock } from 'lucide-react'

export default function GovernanceTabs({ activeTab, setActiveTab, pendingResetCount = 0 }) {
  const tabs = [
    { id: 'directory', label: 'Faculty Directory', icon: Users },
    { id: 'departments', label: 'Department Assignments', icon: Building2 },
    { id: 'resets', label: 'Password Reset Queue', icon: Lock, badge: pendingResetCount },
  ]

  return (
    <div className="flex items-center gap-1 sm:gap-2 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-fit">
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
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
