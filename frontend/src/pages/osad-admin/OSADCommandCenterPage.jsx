import React from 'react'
import { TrendingUp, Award, ChevronRight } from 'lucide-react'
import OSADOperationalSummary from '../../components/osad/OSADOperationalSummary'

export default function OSADCommandCenterPage({ setSearchParams, awardees = [], currentUser, metrics }) {
  const handleSelectTab = (tabId) => {
    setSearchParams({ tab: tabId })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Derived Operational Header & Summary KPIs */}
      <OSADOperationalSummary currentUser={currentUser} metrics={metrics} />

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white dark:bg-[#131e2e] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-2xs dark:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
              <span>University Achievement Distribution by College</span>
            </h3>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AY 2025-2026</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800 dark:text-slate-200">CEAC - Engineering, Architecture & Computing</span>
                <span className="text-[#16834a] dark:text-emerald-400 font-extrabold">420 Achievements (33.5%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#EFF7F0] dark:bg-emerald-500 rounded-full" style={{ width: '33.5%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800 dark:text-slate-200">CBA - Business & Accountancy</span>
                <span className="text-[#16834a] dark:text-emerald-400 font-extrabold">310 Achievements (24.7%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#16834a] dark:bg-emerald-600 rounded-full" style={{ width: '24.7%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800 dark:text-slate-200">CAS - Arts & Sciences</span>
                <span className="text-[#16834a] dark:text-emerald-400 font-extrabold">280 Achievements (22.3%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-600 dark:bg-emerald-700 rounded-full" style={{ width: '22.3%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-800 dark:text-slate-200">CED - College of Education</span>
                <span className="text-[#16834a] dark:text-emerald-400 font-extrabold">244 Achievements (19.5%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 dark:bg-emerald-800 rounded-full" style={{ width: '19.5%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Stage 1 Candidate Decisions List Card */}
        <div className="lg:col-span-5 bg-white dark:bg-[#131e2e] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs dark:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
              <span>Recent Stage 1 Candidate Decisions</span>
            </h3>
            <button
              onClick={() => setSearchParams({ tab: 'candidate-review' })}
              className="text-xs font-bold text-[#16834a] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
            {awardees.map(awd => (
              <div key={awd.id} className="p-3.5 bg-white dark:bg-[#131e2e] hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex items-center justify-between">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{awd.student_name}</p>
                  <p className="text-[11px] font-bold text-[#16834a] dark:text-emerald-400 truncate">{awd.award_title}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{awd.program} • {awd.total_score || awd.stage1_score || 85} pts</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-[#245F42] text-[10px] font-extrabold border border-emerald-100 dark:border-emerald-800/50 shrink-0">
                  Advanced to Interview
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
