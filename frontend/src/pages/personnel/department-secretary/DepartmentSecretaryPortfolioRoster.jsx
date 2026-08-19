import React from 'react'
import { Search, Filter, ShieldCheck, Clock, AlertTriangle, CheckCircle2, ChevronRight, Eye, User } from 'lucide-react'

export default function DepartmentSecretaryPortfolioRoster({
  portfolios = [],
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onSelectPortfolio,
  selectedPortfolio,
  currentUser
}) {
  const isSelfPortfolio = (p) => {
    if (!p) return false
    if (currentUser?.id && p.personnel_id === currentUser.id) return true
    return p.personnel_name.toLowerCase().includes('secretary')
  }

  const getStatusBadge = (status, isSelf = false) => {
    if (isSelf) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#eef7f0] dark:bg-emerald-950/60 text-[#1b4332] dark:text-emerald-300 border border-[#d2e8d7] dark:border-emerald-800/60">
          <ShieldCheck className="w-3 h-3" /> Self-Portfolio (HR Direct)
        </span>
      )
    }

    switch (status) {
      case 'HR_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#eef7f0] dark:bg-emerald-950/60 text-[#1b4332] dark:text-emerald-300 border border-[#d2e8d7] dark:border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" /> HR Approved
          </span>
        )
      case 'ENDORSED_TO_HR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#eef7f0] dark:bg-emerald-950/60 text-[#1b4332] dark:text-emerald-300 border border-[#d2e8d7] dark:border-emerald-800/60">
            <ShieldCheck className="w-3 h-3" /> Endorsed to HR
          </span>
        )
      case 'UNDER_DEP_SEC_REVIEW':
      case 'SUBMITTED_TO_DEP_SEC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3 text-[#2d8a4e]" /> Pending Review
          </span>
        )
      case 'RETURNED_TO_PERSONNEL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <AlertTriangle className="w-3 h-3" /> Revision Requested
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Draft
          </span>
        )
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mb-6">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Department Personnel Ranking Portfolios
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            First-level evaluation & score verification for assigned department faculty.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search faculty name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="SUBMITTED_TO_DEP_SEC">Submitted for Review</option>
            <option value="UNDER_DEP_SEC_REVIEW">Under Review</option>
            <option value="ENDORSED_TO_HR">Endorsed to HR</option>
            <option value="RETURNED_TO_PERSONNEL">Returned</option>
            <option value="HR_APPROVED">HR Approved</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      {portfolios.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No personnel portfolios match the current search or status filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Academic Rank</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Verified Score</th>
                <th className="py-3.5 px-4 text-center">Area A/B/C Breakdown</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {portfolios.map((p) => {
                const totals = p.calculateAcceptedCappedTotals()
                const { verified } = totals
                const isSelected = selectedPortfolio?.id === p.id
                const isSelf = isSelfPortfolio(p)

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-emerald-500/5 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                          {p.personnel_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {p.personnel_name}
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{p.personnel_id} • {p.academic_year}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {p.academic_rank}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.status, isSelf)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 dark:text-white text-sm">
                      {verified.acceptedTotal} <span className="text-xs text-slate-400 font-normal">/ 160</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          A: {verified.acceptedA}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          B: {verified.acceptedB}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          C: {verified.acceptedC}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isSelf ? (
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 italic block">
                          Bypasses to HR
                        </span>
                      ) : (
                        <button
                          onClick={() => onSelectPortfolio(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all shadow"
                        >
                          <Eye className="w-3.5 h-3.5" /> Evaluate
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
