import React, { useState, useMemo } from 'react'
import {
  FileCheck2, Search, Filter, Download, ArrowRight, Award,
  CheckCircle2, Clock, Building2, User, ChevronLeft, ChevronRight,
  TrendingUp, ShieldCheck, RefreshCw, X, Eye
} from 'lucide-react'
import { useHR } from '../../hooks/useHR'

const DEFAULT_RANK_LOGS = [
  {
    id: 'rnk_log_001',
    employee_id: 'EMP-2021-0842',
    faculty_name: 'Dr. Maria Santos',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    affiliation_snapshot: 'CEAC • BSCS',
    college: 'CEAC',
    action_type: 'Promotion',
    previous_rank: 'Associate Professor I',
    conferred_rank: 'Associate Professor II',
    employment_status: 'Full-Time Permanent',
    effective_date: '2026-03-01',
    authorized_by: 'Director Evelyn Tan (HR Office)',
    resolution_no: 'BOT-RES-2026-042',
    remarks: 'Approved following 2025-2026 Faculty Evaluation and Scopus Publication merit points.'
  },
  {
    id: 'rnk_log_002',
    employee_id: 'EMP-2015-0120',
    faculty_name: 'Prof. Ricardo Gomez',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    affiliation_snapshot: 'CEAC • BSCE',
    college: 'CEAC',
    action_type: 'Promotion',
    previous_rank: 'Assistant Professor III',
    conferred_rank: 'Assistant Professor IV',
    employment_status: 'Full-Time Permanent',
    effective_date: '2026-01-15',
    authorized_by: 'Director Evelyn Tan (HR Office)',
    resolution_no: 'BOT-RES-2026-011',
    remarks: 'Rank elevation concurred based on 11 years of dedicated service & extension leadership.'
  },
  {
    id: 'rnk_log_003',
    employee_id: 'EMP-2019-0881',
    faculty_name: 'Dr. Ana Reyes',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    affiliation_snapshot: 'CEAC • BSCS',
    college: 'CEAC',
    action_type: 'Reclassification',
    previous_rank: 'Assistant Professor IV',
    conferred_rank: 'Associate Professor I',
    employment_status: 'Full-Time Permanent',
    effective_date: '2025-11-01',
    authorized_by: 'Vice President for Academic Affairs',
    resolution_no: 'VPAA-RNK-2025-089',
    remarks: 'Completed Doctorate degree in Information Technology; reclassified to Associate level.'
  },
  {
    id: 'rnk_log_004',
    employee_id: 'EMP-2018-0412',
    faculty_name: 'Dr. Gabriel Mendoza',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    affiliation_snapshot: 'CBA • BSBA',
    college: 'CBA',
    action_type: 'Promotion',
    previous_rank: 'Associate Professor III',
    conferred_rank: 'Full Professor I',
    employment_status: 'Full-Time Permanent',
    effective_date: '2025-09-01',
    authorized_by: 'President & Board of Trustees',
    resolution_no: 'BOT-RES-2025-104',
    remarks: 'Conferred Full Professorship rank following institutional research output and 15-year tenure.'
  },
  {
    id: 'rnk_log_005',
    employee_id: 'EMP-2022-0901',
    faculty_name: 'Engr. Sarah Cruz',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    affiliation_snapshot: 'CAS • BSPHY',
    college: 'CAS',
    action_type: 'Initial Placement',
    previous_rank: 'Instructor I',
    conferred_rank: 'Instructor III',
    employment_status: 'Full-Time Probationary',
    effective_date: '2025-06-01',
    authorized_by: 'Director Evelyn Tan (HR Office)',
    resolution_no: 'HR-OFF-2025-032',
    remarks: 'Initial academic placement upon onboarding with Master’s degree credentials.'
  }
]

export function HRRankAssignmentLogsPage(props) {
  const hrHook = useHR()
  const auditLogs = props.auditLogs || hrHook.auditLogs || []

  // Combine static default logs with dynamic RANK_PROMOTION audit logs from HR controller
  const combinedRankLogs = useMemo(() => {
    const dynamicRankLogs = auditLogs
      .filter(log => log.action_type === 'RANK_PROMOTION' || log.action_type === 'RANK_ASSIGNMENT')
      .map((log, index) => {
        return {
          id: `dyn_rnk_${log.id || index}`,
          employee_id: log.target_personnel?.match(/\(EMP-[^)]+\)/)?.[0]?.replace(/[()]/g, '') || 'EMP-2026',
          faculty_name: log.target_personnel?.split(' (')[0] || 'Personnel Member',
          avatar_url: null,
          affiliation_snapshot: 'Academic affiliation recorded at decision time',
          college: 'NDMU',
          action_type: 'Promotion',
          previous_rank: 'Previous Rank',
          conferred_rank: log.details?.match(/"([^"]+)"/)?.[1] || 'Updated Academic Rank',
          employment_status: 'Full-Time Permanent',
          effective_date: new Date(log.timestamp).toISOString().split('T')[0],
          authorized_by: log.admin_name || 'Director Evelyn Tan',
          resolution_no: `HR-REC-${log.id}`,
          remarks: log.details || 'Rank modification recorded in audit trail.'
        }
      })

    return [...dynamicRankLogs, ...DEFAULT_RANK_LOGS]
  }, [auditLogs])

  // Filter & Search State
  const [search, setSearch] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [selectedLog, setSelectedLog] = useState(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Filter Pipeline
  const filteredLogs = useMemo(() => {
    return combinedRankLogs.filter(log => {
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || (
        (log.faculty_name && log.faculty_name.toLowerCase().includes(q)) ||
        (log.employee_id && log.employee_id.toLowerCase().includes(q)) ||
        (log.conferred_rank && log.conferred_rank.toLowerCase().includes(q)) ||
        (log.previous_rank && log.previous_rank.toLowerCase().includes(q))
      )
      const matchesCollege = collegeFilter === 'ALL' || log.college === collegeFilter
      const matchesAction = actionFilter === 'ALL' || log.action_type === actionFilter

      return matchesSearch && matchesCollege && matchesAction
    })
  }, [combinedRankLogs, search, collegeFilter, actionFilter])

  // Pagination Calculations
  const totalItems = filteredLogs.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage
    return filteredLogs.slice(start, start + rowsPerPage)
  }, [filteredLogs, safePage, rowsPerPage])

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return
    const headers = ['Employee ID', 'Faculty Name', 'Historical Affiliation Snapshot', 'Action Type', 'Previous Rank', 'Conferred Rank', 'Effective Date', 'Authorized By', 'Resolution No', 'Remarks']
    const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`
    const rows = filteredLogs.map(l => [
      escapeCSV(l.employee_id),
      escapeCSV(l.faculty_name),
      escapeCSV(l.affiliation_snapshot),
      escapeCSV(l.action_type),
      escapeCSV(l.previous_rank),
      escapeCSV(l.conferred_rank),
      escapeCSV(l.effective_date),
      escapeCSV(l.authorized_by),
      escapeCSV(l.resolution_no),
      escapeCSV(l.remarks)
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `rank-assignment-logs-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#DDE7DF] dark:border-[#374B3F]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#102A43] dark:text-[#E6EFE9] tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-[#176B43] dark:text-[#59AD7C] shrink-0" />
            <span>Rank Assignment Logs</span>
          </h1>
          <p className="text-xs text-[#4F6475] dark:text-[#B1C0B6] font-medium mt-0.5 max-w-3xl">
            Official institutional register of faculty academic rank assignments, promotions, reclassifications, and Board of Trustees approval resolutions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={filteredLogs.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#159552] hover:bg-[#117A43] text-white font-extrabold text-xs shadow-xs border border-[#159552] transition cursor-pointer shrink-0 disabled:bg-[#E6ECE8] disabled:text-[#87958C] disabled:border-[#D4DED7] disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Export Logs ({filteredLogs.length})</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1D2A23] border border-[#DCE6DF] dark:border-[#374B3F] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#4F6475] dark:text-[#B1C0B6]">
            <span className="text-xs font-semibold">Total Logs Recorded</span>
            <FileCheck2 className="w-4 h-4 text-[#16834A] dark:text-[#59AD7C]" />
          </div>
          <p className="text-2xl font-extrabold text-[#123D2A] dark:text-[#E6EFE9]">{combinedRankLogs.length}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Rank change transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Promotions Conferred</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {combinedRankLogs.filter(l => l.action_type === 'Promotion').length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Academic rank elevations</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Reclassifications</span>
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {combinedRankLogs.filter(l => l.action_type === 'Reclassification').length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Degree &amp; tenure adjustments</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Governance Compliance</span>
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">100%</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Verified by HR &amp; BOT Resolution</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-none space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by faculty name, employee ID, or rank title..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#69A97C]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* College filter */}
          <select
            value={collegeFilter}
            onChange={e => setCollegeFilter(e.target.value)}
            className="w-full md:w-56 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#69A97C]"
          >
            <option value="ALL">All Colleges</option>
            <option value="CEAC">CEAC</option>
            <option value="CBA">CBA</option>
            <option value="CAS">CAS</option>
          </select>

          {/* Action Type Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full md:w-48 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#69A97C]"
          >
            <option value="ALL">All Action Types</option>
            <option value="Promotion">Promotion</option>
            <option value="Reclassification">Reclassification</option>
            <option value="Initial Placement">Initial Placement</option>
          </select>
        </div>
      </div>

      {/* Rank Assignment Table */}
      <section className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full min-w-[900px] table-fixed text-left text-xs border-collapse">
            <colgroup>
              <col className="w-[260px]" />
              <col className="w-[140px]" />
              <col className="w-[280px]" />
              <col className="w-[120px]" />
              <col className="w-[180px]" />
              <col className="w-[80px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs select-none">
                <th className="p-4">Faculty Member</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Rank Transition</th>
                <th className="p-4">Effective Date</th>
                <th className="p-4">Authorized By</th>
                <th className="p-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No rank assignment logs match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                    {/* Faculty Member */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {log.avatar_url ? (
                          <img src={log.avatar_url} alt={log.faculty_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {log.faculty_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{log.faculty_name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{log.affiliation_snapshot}</p>
                          <p className="text-[10px] font-mono text-slate-400">{log.employee_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Action Type */}
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        log.action_type === 'Promotion'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#245F42] border border-emerald-200 dark:border-emerald-800'
                          : log.action_type === 'Reclassification'
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>

                    {/* Rank Transition */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 min-w-0 text-xs">
                        <span className="truncate px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold" title={log.previous_rank}>
                          {log.previous_rank}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#245F42] font-extrabold border border-emerald-200/60 dark:border-emerald-800/60" title={log.conferred_rank}>
                          {log.conferred_rank}
                        </span>
                      </div>
                    </td>

                    {/* Effective Date */}
                    <td className="p-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                      {log.effective_date}
                    </td>

                    {/* Authorized By */}
                    <td className="p-4 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={log.authorized_by}>
                        {log.authorized_by}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 truncate" title={log.resolution_no}>
                        {log.resolution_no}
                      </p>
                    </td>

                    {/* Details Action Button */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer inline-flex items-center justify-center"
                        title="View Resolution & Decision Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-900 dark:text-white font-bold">{((safePage - 1) * rowsPerPage) + 1}–{Math.min(safePage * rowsPerPage, totalItems)}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalItems}</strong> rank log records
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Resolution Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Rank Assignment Decision Log</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">{selectedLog.faculty_name}</p>
                <p className="text-slate-500 dark:text-slate-400">{selectedLog.affiliation_snapshot} • {selectedLog.employee_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Previous Academic Rank</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{selectedLog.previous_rank}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Conferred Academic Rank</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{selectedLog.conferred_rank}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Action / Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.action_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Effective Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.effective_date}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Authorized By / Authority</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedLog.authorized_by}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Board Resolution / Reference No</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{selectedLog.resolution_no}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">HR Governance Remarks</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 italic">
                    "{selectedLog.remarks}"
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HRRankAssignmentLogsPage
