import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AuditTrailPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange
}) {
  if (totalItems === 0) return null

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans shadow-2xs">
      {/* Items per Page & Range Metadata */}
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(parseInt(e.target.value, 10))}
            className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
        </div>

        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

        <span>
          Showing <strong className="text-slate-800 dark:text-slate-200 font-bold">{startIndex}–{endIndex}</strong> of {totalItems} logs
        </span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1.5 rounded-xl bg-[#EFF7F0] dark:bg-emerald-600 text-white font-extrabold text-xs shadow-2xs">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
