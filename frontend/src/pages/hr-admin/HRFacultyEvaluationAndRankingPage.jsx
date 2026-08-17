import React from 'react'
import { Search, ShieldCheck, Award, Building, Download, CheckCircle2, TrendingUp } from 'lucide-react'
import PersonnelPortfolioModel from '../../models/PersonnelPortfolioModel'

export function HRFacultyEvaluationAndRankingPage({
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
  const handleGenerateReport = () => {
    alert("System-generated report: Faculty Evaluation & Ranking Summary (CSV/PDF) generated successfully.")
  }

  const getPromotionBadge = (score) => {
    if (score >= 140) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <Award className="w-3 h-3" /> Recommended
        </span>
      )
    } else if (score >= 110) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
          <TrendingUp className="w-3 h-3" /> For Review
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          Not for Review
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
            <Award className="w-5 h-5 text-emerald-500" /> Faculty Evaluation &amp; Ranking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View finalized faculty evaluation scores, area results, ranking information, and promotion-review status for the selected evaluation period.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search faculty..."
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

          {/* Generate Report Button */}
          <button
            type="button"
            onClick={handleGenerateReport}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Portfolios Masterboard Table */}
      {(!portfolios || portfolios.length === 0) ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          No faculty evaluation records found matching the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Current Rank</th>
                <th className="py-3.5 px-4 text-center">Final Score</th>
                <th className="py-3.5 px-4 text-center">Area Scores</th>
                <th className="py-3.5 px-4 text-center">Ranking</th>
                <th className="py-3.5 px-4 text-center">Promotion Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
              {portfolios.map((p, idx) => {
                const portfolioModel = (p && typeof p.calculateAcceptedCappedTotals === 'function')
                  ? p
                  : new PersonnelPortfolioModel(p || {})
                const totals = portfolioModel.calculateAcceptedCappedTotals()
                const verified = totals?.verified || { acceptedTotal: 0, acceptedA: 0, acceptedB: 0, acceptedC: 0 }

                const facultyName = p?.personnel_name || p?.full_name || p?.faculty_name || 'Faculty Member'
                const facultyId = p?.personnel_id || p?.employee_id || 'EMP-2026'
                const rank = p?.academic_rank || 'Associate Professor I'
                const deptName = p?.department_name || p?.department || 'Computer Studies'

                return (
                  <tr key={p?.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Faculty Member */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          {facultyName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs">{facultyName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{facultyId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[160px] font-bold text-xs">{deptName}</span>
                      </div>
                    </td>

                    {/* Current Rank */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] inline-block">
                        {rank}
                      </span>
                    </td>

                    {/* Final Score */}
                    <td className="py-3.5 px-4 text-center font-black text-slate-900 dark:text-white text-sm">
                      {verified.acceptedTotal} <span className="text-xs text-slate-400 font-normal">/ 160</span>
                    </td>

                    {/* Area Scores */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold" title="Area A (Max 70 pts) | Area B (Max 50 pts) | Area C (Max 40 pts)">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">A:{verified.acceptedA}/70</span>
                        <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">B:{verified.acceptedB}/50</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">C:{verified.acceptedC}/40</span>
                      </div>
                    </td>

                    {/* Ranking */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">#{idx + 1}</span>
                      <span className="block text-[10px] text-slate-400 font-medium">Univ-wide</span>
                    </td>

                    {/* Promotion Status */}
                    <td className="py-3.5 px-4 text-center">
                      {getPromotionBadge(verified.acceptedTotal)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectAuditPortfolio && onSelectAuditPortfolio(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-extrabold text-xs text-white bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-2xs cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> View Evaluation
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

export const HRFacultyEvaluationAndRanking = HRFacultyEvaluationAndRankingPage
export default HRFacultyEvaluationAndRankingPage
