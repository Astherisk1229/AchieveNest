import React from 'react'
import { TrendingUp } from 'lucide-react'
import OSADOperationalSummary from '../../components/osad/OSADOperationalSummary'
import PotentialAwardCandidatesPreview from '../../components/osad/PotentialAwardCandidatesPreview'

export default function OSADCommandCenterPage({
  setSearchParams,
  awardees = [],
  candidateDecisions = [],
  currentUser,
  metrics,
  awardCategories = [],
  getUsers
}) {
  const usersList = typeof getUsers === 'function' ? (getUsers('student', '') || []) : []

  return (
    <div className="space-y-5 animate-in fade-in duration-200 font-sans">
      {/* Derived Operational Header & Summary KPIs */}
      <OSADOperationalSummary metrics={metrics} />

      {/* Operations & Potential Candidates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Potential Award Candidates Preview */}
        <div className="lg:col-span-7">
          <PotentialAwardCandidatesPreview
            awardCategories={awardCategories}
            users={usersList}
            awardees={awardees}
            candidateDecisions={candidateDecisions}
            onViewAll={() => setSearchParams({ tab: 'candidate-review' })}
          />
        </div>

        {/* Right Column: Achievement Distribution by College */}
        <div className="lg:col-span-5 bg-white dark:bg-[#131E2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
              <span>Achievement Distribution</span>
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">AY 2025–2026</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">CEAC — Engineering, Arch. & Computing</span>
                <span className="font-semibold text-[#16834a] dark:text-emerald-400">420 (33.5%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#16834a] dark:bg-emerald-500 rounded-full" style={{ width: '33.5%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">CBA — Business & Accountancy</span>
                <span className="font-semibold text-[#16834a] dark:text-emerald-400">310 (24.7%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-600 dark:bg-emerald-600 rounded-full" style={{ width: '24.7%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">CAS — Arts & Sciences</span>
                <span className="font-semibold text-[#16834a] dark:text-emerald-400">280 (22.3%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 dark:bg-emerald-700 rounded-full" style={{ width: '22.3%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">CED — College of Education</span>
                <span className="font-semibold text-[#16834a] dark:text-emerald-400">244 (19.5%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-teal-600 dark:bg-teal-700 rounded-full" style={{ width: '19.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
