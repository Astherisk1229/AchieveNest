import React from 'react'
import { Search, ShieldCheck, CheckCircle2, AlertTriangle, Clock, Award, Building, Lock } from 'lucide-react'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel'

export default function HRRankingMasterboardPage({
  portfolios = [],
  searchQuery,
  setSearchQuery,
  departmentFilter,
  setDepartmentFilter,
  statusFilter,
  setStatusFilter,
  onSelectAuditPortfolio,
  selectedAuditPortfolio
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'HR_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Lock className="w-3 h-3" /> Locked & Approved
          </span>
        )
      case 'ENDORSED_TO_HR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3 h-3" /> Endorsed for HR Audit
          </span>
        )
      case 'UNDER_DEP_SEC_REVIEW':
      case 'SUBMITTED_TO_DEP_SEC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Dept. Sec Review
          </span>
        )
      case 'RETURNED_TO_PERSONNEL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Returned to Faculty
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Draft
          </span>
        )
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mb-6">
      {/* Top Bar Controls */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" /> University Faculty Ranking Masterboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Institutional HR audit, Department Secretary sign-off verification, and official score locking.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search faculty name, ID, rank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter && setDepartmentFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="All">All Departments</option>
            <option value="DEP-CEAC">CEAC - Engineering &amp; Computing</option>
            <option value="DEP-CABM">CABM - Business &amp; Management</option>
            <option value="DEP-CAS">CAS - Arts &amp; Sciences</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter && setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="ENDORSED_TO_HR">Endorsed for Audit</option>
            <option value="HR_APPROVED">HR Approved &amp; Locked</option>
            <option value="UNDER_DEP_SEC_REVIEW">Pending Dept. Sec</option>
            <option value="RETURNED_TO_PERSONNEL">Returned</option>
          </select>
        </div>
      </div>

      {/* Portfolios Masterboard Table */}
      {(!portfolios || portfolios.length === 0) ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No faculty portfolios found matching the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Dept. Sec Evaluator</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Accepted Score</th>
                <th className="py-3.5 px-4 text-center">Area A/B/C</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {portfolios.map((p, idx) => {
                const portfolioModel = (p && typeof p.calculateAcceptedCappedTotals === 'function')
                  ? p
                  : new PersonnelPortfolioModel(p || {})
                const totals = portfolioModel.calculateAcceptedCappedTotals()
                const verified = totals?.verified || { acceptedTotal: 0, acceptedA: 0, acceptedB: 0, acceptedC: 0 }

                const facultyName = p?.personnel_name || p?.full_name || p?.faculty_name || 'Faculty Member'
                const facultyId = p?.personnel_id || p?.employee_id || 'EMP-2026'
                const rank = p?.academic_rank || 'Faculty'
                const deptName = p?.department_name || p?.department || 'Academic Department'

                return (
                  <tr key={p?.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          {facultyName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{facultyName}</div>
                          <div className="text-[11px] text-slate-400">{facultyId} • {rank}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[160px]">{deptName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {p?.dep_sec_evaluator_name || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(p?.status)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 dark:text-white text-sm">
                      {verified.acceptedTotal} <span className="text-xs text-slate-400 font-normal">/ 160</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">A:{verified.acceptedA}</span>
                        <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-600">B:{verified.acceptedB}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600">C:{verified.acceptedC}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectAuditPortfolio && onSelectAuditPortfolio(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Audit &amp; Lock
                      </button>
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
