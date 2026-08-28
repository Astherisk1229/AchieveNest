import React from 'react'
import { Users, Lock } from 'lucide-react'

export default function GovernanceTabs({ activeTab, setActiveTab, pendingResetsCount = 0, pendingResetCount = 0 }) {
  const badgeCount = pendingResetsCount || pendingResetCount
  const tabs = [
    { id: 'directory', label: 'Personnel Records', icon: Users },
    { id: 'resets', label: 'Password Reset Queue', icon: Lock, badge: badgeCount },
  ]

  return (
    <div className="flex items-center gap-1 sm:gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#1D2A23] border border-[#D9E5DC] dark:border-[#374B3F] w-fit shadow-xs">
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
            className={`px-4 py-2 rounded-xl text-sm font-semibold leading-[1.2] flex items-center gap-2 transition cursor-pointer ${
              isActive
                ? 'bg-[#176B43] text-white shadow-xs'
                : 'bg-[#F4F7F5] dark:bg-[#121A16] text-[#344A5E] dark:text-[#E6EFE9] hover:bg-[#EAF4EC] hover:text-[#145C39] border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#4F6475] dark:text-[#B1C0B6]'}`} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive
                  ? 'bg-[#DDF3E5] text-[#145C39]'
                  : 'bg-[#FFF4D6] text-[#9A5A00] border border-[#FFE3B3]'
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
