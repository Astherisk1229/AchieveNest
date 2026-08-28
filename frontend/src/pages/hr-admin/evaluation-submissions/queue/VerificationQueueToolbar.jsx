import React from 'react'
import { Search } from 'lucide-react'

export default function VerificationQueueToolbar({
  search, setSearch,
  collegeFilter, setCollegeFilter,
  submissionType, setSubmissionType
}) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search faculty by name, employee ID ("EMP-2019-0881"), email...'
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#69A97C]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          <select
            value={collegeFilter}
            onChange={e => setCollegeFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#69A97C]"
          >
            <option value="ALL">All Colleges</option>
            <option value="CEAC">CEAC - Engineering &amp; Computing</option>
            <option value="CBA">CBA - Business Administration</option>
            <option value="CAS">CAS - Arts &amp; Sciences</option>
          </select>

          <select
            value={submissionType}
            onChange={e => setSubmissionType(e.target.value)}
            className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#69A97C]"
          >
            <option value="ALL">All Submission Types</option>
            <option value="ranking">Ranking &amp; Promotion</option>
            <option value="tenure">Tenure Evaluation</option>
            <option value="accreditation">Accreditation Audit</option>
          </select>
        </div>
      </div>
    </div>
  )
}
