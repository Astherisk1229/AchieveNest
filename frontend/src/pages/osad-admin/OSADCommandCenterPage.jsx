import React from 'react'
import { TrendingUp, Award, ChevronRight } from 'lucide-react'
import OSADOperationalSummary from '../../components/osad/OSADOperationalSummary'

export default function OSADCommandCenterPage({ setSearchParams, awardees = [], currentUser, metrics }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200 font-sans">
      {/* Derived Operational Header & Summary KPIs */}
      <OSADOperationalSummary currentUser={currentUser} metrics={metrics} />

      {/* Operations & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Column: Achievement Distribution by College */}
        <div className="lg:col-span-7 bg-white dark:bg-[#131E2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
              <span>University Achievement Distribution by College</span>
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">AY 2025–2026</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">CEAC — Engineering, Architecture & Computing</span>
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

        {/* Right Column: Recent Stage 1 Candidate Decisions */}
        <div className="lg:col-span-5 bg-white dark:bg-[#131E2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
              <span>Recent Candidate Decisions</span>
            </h3>
            <button
              onClick={() => setSearchParams({ tab: 'candidate-review' })}
              className="text-xs font-semibold text-[#16834a] dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
            {awardees.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 text-center">No recent candidate evaluations found.</p>
            ) : (
              awardees.slice(0, 4).map(awd => (
                <div key={awd.id} className="p-3 bg-white dark:bg-[#131E2E] hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{awd.student_name}</p>
                    <p className="text-xs text-[#16834a] dark:text-emerald-400 font-medium truncate">{awd.award_title}</p>
                    <p className="text-[11px] text-slate-400 font-normal">{awd.program} • {awd.total_score || awd.stage1_score || 85} pts</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-300 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/50 shrink-0">
                    Eligible
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
