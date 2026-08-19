import React from 'react'
import { ShieldCheck, Download, Lock, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { useHR } from '../../hooks/useHR'
import { useHRAuditTrail } from '../../hooks/useHRAuditTrail'
import AuditTrailFilterBar from './audit/AuditTrailFilterBar'
import AuditLogTimelineItem from './audit/AuditLogTimelineItem'
import AuditTrailPagination from './audit/AuditTrailPagination'

export function HRAuditTrailPage(props) {
  const hrHook = useHR()

  const rawAuditLogs = props.auditLogs || hrHook.auditLogs || []

  // Initialize custom hook for searching, filtering, pagination, and safe CSV export
  const {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    dateFilter,
    setDateFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    filteredSortedLogs,
    pageLogs,
    paginationData,
    totalCount,
    filteredCount,
    handleClearFilters,
    handleExportFilteredCsv
  } = useHRAuditTrail(rawAuditLogs)

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#1b4332] dark:text-emerald-400 shrink-0" />
            <span>Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 max-w-3xl">
            Review recorded HR actions involving personnel administration, faculty evaluation processing, account support, rank changes, and organizational assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportFilteredCsv}
          disabled={filteredCount === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs shadow-2xs transition cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title={`Export ${filteredCount} matching logs to CSV`}
        >
          <Download className="w-4 h-4" />
          <span>Export Audit History ({filteredCount})</span>
        </button>
      </div>

      {/* Interactive Search, Category & Date Filter Bar */}
      <AuditTrailFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        onClearFilters={handleClearFilters}
        filteredCount={filteredCount}
        totalCount={totalCount}
        onExportCsv={handleExportFilteredCsv}
      />

      {/* Security Audit Trail Container */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#2d8a4e] dark:text-emerald-400" />
            <span>Administrative Governance Log</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {filteredCount} {filteredCount === 1 ? 'Record' : 'Records'} Displayed
          </span>
        </div>

        {/* Log Entries View */}
        <div className="p-4 sm:p-5 space-y-3">
          {totalCount === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-medium rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-extrabold text-slate-700 dark:text-slate-300">No Audit Logs Recorded Yet</p>
              <p>Administrative actions such as account registrations, password resets, and evaluation seals will be logged here.</p>
            </div>
          ) : pageLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-medium rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-extrabold text-slate-700 dark:text-slate-300">No Matching Audit Logs Found</p>
              <p>No transactions match your current search query or category filters.</p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Clear Search &amp; Filters
              </button>
            </div>
          ) : (
            pageLogs.map(log => (
              <AuditLogTimelineItem key={log.id} log={log} />
            ))
          )}
        </div>
      </div>

      {/* Pagination Footer Controls */}
      <AuditTrailPagination
        currentPage={paginationData.currentPage}
        totalPages={paginationData.totalPages}
        totalItems={paginationData.totalItems}
        pageSize={paginationData.pageSize}
        startIndex={paginationData.startIndex}
        endIndex={paginationData.endIndex}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
      />
    </div>
  )
}

export const HRAuditTrail = HRAuditTrailPage
export default HRAuditTrailPage
