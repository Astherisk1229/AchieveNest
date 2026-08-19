import React from 'react'
import { Search, X, Download, Filter, Calendar } from 'lucide-react'
import { AUDIT_CATEGORIES } from '../../../models/HRAuditEventRegistry'

export default function AuditTrailFilterBar({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  dateFilter,
  onDateChange,
  onClearFilters,
  filteredCount,
  totalCount,
  onExportCsv
}) {
  const hasActiveFilters = Boolean(searchTerm || categoryFilter !== 'ALL' || dateFilter !== 'all')

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-3 font-sans shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search logs by actor, target personnel, employee ID, event, or details..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#1b4332]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={e => onCategoryChange(e.target.value)}
              className="pl-8 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value={AUDIT_CATEGORIES.ACCOUNT.key}>{AUDIT_CATEGORIES.ACCOUNT.label}</option>
              <option value={AUDIT_CATEGORIES.SECURITY.key}>{AUDIT_CATEGORIES.SECURITY.label}</option>
              <option value={AUDIT_CATEGORIES.EVALUATION.key}>{AUDIT_CATEGORIES.EVALUATION.label}</option>
              <option value={AUDIT_CATEGORIES.RANK_ASSIGNMENT.key}>{AUDIT_CATEGORIES.RANK_ASSIGNMENT.label}</option>
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={e => onDateChange(e.target.value)}
              className="pl-8 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {/* Clear Filters Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          {/* Export Action */}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={filteredCount === 0}
            className="px-3.5 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143326] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title={`Export ${filteredCount} matching logs to CSV`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV ({filteredCount})</span>
          </button>
        </div>
      </div>

      {/* Active Filter Summary Indicator */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1">
        <span>
          Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredCount}</strong> of {totalCount} logged transactions
        </span>
        {hasActiveFilters && (
          <span className="text-amber-700 dark:text-amber-400 font-semibold">
            Filtered view active
          </span>
        )}
      </div>
    </div>
  )
}
