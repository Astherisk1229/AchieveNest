import React from 'react'
import { TrendingUp } from 'lucide-react'
import OSADOperationalSummary from '../../components/osad/OSADOperationalSummary'
import PotentialAwardCandidatesPreview from '../../components/osad/PotentialAwardCandidatesPreview'

export default function OSADCommandCenterPage({
  setSearchParams,
  metrics,
  studentsByCollege = []
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200 font-sans">
      {/* Derived Operational Header & Summary KPIs */}
      <OSADOperationalSummary metrics={metrics} />

      {/* Operations & Potential Candidates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Potential Award Candidates Preview */}
        <div className="lg:col-span-7">
          <PotentialAwardCandidatesPreview onViewAll={() => setSearchParams({ tab: 'awards' })} />
        </div>

        {/* Right Column: Students by College (real enrolled-student counts) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#131E2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
              <span>Students by College</span>
            </h3>
          </div>

          {studentsByCollege.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No student accounts are assigned to a college yet.</p>
          ) : (
            <div className="space-y-3.5">
              {studentsByCollege.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                    <span className="font-semibold text-[#16834a] dark:text-emerald-400">{row.count} ({row.percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#16834a] dark:bg-emerald-500 rounded-full" style={{ width: `${row.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
