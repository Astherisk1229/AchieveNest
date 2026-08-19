import { useState, useMemo, useEffect } from 'react'
import HRAuditTrailController from '../controllers/HRAuditTrailController'
import exportSafeCsv from '../utils/safeCsvExport'

export function useHRAuditTrail(rawLogs = []) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Reset to page 1 whenever search, category, date filter, or page size changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, dateFilter, itemsPerPage])

  // Memoized filter and deterministic sort
  const filteredSortedLogs = useMemo(() => {
    const filtered = HRAuditTrailController.filterLogs(rawLogs, {
      searchTerm,
      categoryFilter,
      dateFilter
    })
    return HRAuditTrailController.sortLogs(filtered)
  }, [rawLogs, searchTerm, categoryFilter, dateFilter])

  // Memoized pagination
  const paginationData = useMemo(() => {
    return HRAuditTrailController.paginateLogs(filteredSortedLogs, currentPage, itemsPerPage)
  }, [filteredSortedLogs, currentPage, itemsPerPage])

  // Clear all active filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('ALL')
    setDateFilter('all')
    setCurrentPage(1)
  }

  // Export full filtered result set to safe CSV
  const handleExportFilteredCsv = () => {
    if (filteredSortedLogs.length === 0) return false

    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `NDMU_HR_Audit_Trail_${dateStr}.csv`
    const rows = HRAuditTrailController.prepareCsvRows(filteredSortedLogs)

    return exportSafeCsv(filename, rows)
  }

  return {
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
    pageLogs: paginationData.pageLogs,
    paginationData,
    totalCount: rawLogs.length,
    filteredCount: filteredSortedLogs.length,
    handleClearFilters,
    handleExportFilteredCsv
  }
}

export default useHRAuditTrail
