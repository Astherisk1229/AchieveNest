import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, ArrowUp, ArrowDown, ArrowUpDown, MoreVertical,
  Eye, Edit3, KeyRound, Award, Copy, Check, Download, X,
  ChevronLeft, ChevronRight, User, AlertCircle, RefreshCw
} from 'lucide-react'

// Rank weight calculation for stable sorting
const getRankWeight = (rankStr = '') => {
  if (!rankStr) return 0
  const r = rankStr.toLowerCase()
  let baseWeight = 0
  if (r.includes('instructor')) baseWeight = 10
  else if (r.includes('assistant professor')) baseWeight = 20
  else if (r.includes('associate professor')) baseWeight = 30
  else if (r.includes('full professor') || r.includes('professor')) baseWeight = 40

  let subWeight = 0
  if (r.includes(' iv') || r.includes(' 4')) subWeight = 4
  else if (r.includes(' iii') || r.includes(' 3')) subWeight = 3
  else if (r.includes(' ii') || r.includes(' 2')) subWeight = 2
  else if (r.includes(' i') || r.includes(' 1')) subWeight = 1

  return baseWeight + subWeight
}

/**
 * PersonnelDirectoryTable Component
 * Displays the primary 5-column grid table of personnel members with search, filters,
 * single-column sorting, pagination, row selection, copy email, and CSV export.
 */
export default function PersonnelDirectoryTable({
  personnelList = [],
  onSelectPersonnel,
  onSelectFaculty,
  onEditAssignment,
  onPromoteRank,
  onResetPassword,
  onManageRole,
  showToast
}) {
  const handleSelect = onSelectPersonnel || onSelectFaculty

  // Filter & Search State
  const [search, setSearch] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Sorting State
  const [sortColumn, setSortColumn] = useState('full_name')
  const [sortDirection, setSortDirection] = useState('asc')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Selection & Action Menu State
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [copiedEmailId, setCopiedEmailId] = useState(null)

  const menuRef = useRef(null)

  // Reset to page 1 on filter, search, sort, or rowsPerPage changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, collegeFilter, deptFilter, statusFilter, sortColumn, sortDirection, rowsPerPage])

  // Reset department filter when college changes
  useEffect(() => {
    setDeptFilter('ALL')
  }, [collegeFilter])

  // Close action menu on Escape key press or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveMenuId(null)
    }
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Dynamic department dropdown list based on selected college
  const availableDepartments = useMemo(() => {
    const filtered = collegeFilter === 'ALL'
      ? personnelList
      : personnelList.filter(p => p.college === collegeFilter || (p.college && p.college.startsWith(collegeFilter)))
    
    const depts = new Set()
    filtered.forEach(p => {
      if (p.department) depts.add(p.department)
    })
    return Array.from(depts).sort()
  }, [collegeFilter, personnelList])

  // Filter & Sort Pipeline
  const filteredSortedList = useMemo(() => {
    let list = [...personnelList]

    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(p =>
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        (p.employee_id && p.employee_id.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q))
      )
    }

    // 2. Filters
    if (collegeFilter !== 'ALL') {
      list = list.filter(p => p.college === collegeFilter || (p.college && p.college.startsWith(collegeFilter)))
    }
    if (deptFilter !== 'ALL') {
      list = list.filter(p => p.department === deptFilter)
    }
    if (statusFilter !== 'ALL') {
      list = list.filter(p => p.employment_status === statusFilter)
    }

    // 3. Stable Single-Column Sort
    list.sort((a, b) => {
      let comparison = 0
      if (sortColumn === 'full_name') {
        const valA = a.full_name || ''
        const valB = b.full_name || ''
        comparison = valA.localeCompare(valB)
      } else if (sortColumn === 'department') {
        const valA = a.department || ''
        const valB = b.department || ''
        comparison = valA.localeCompare(valB)
        if (comparison === 0) {
          const colA = a.college || ''
          const colB = b.college || ''
          comparison = colA.localeCompare(colB)
        }
      } else if (sortColumn === 'academic_rank') {
        const weightA = getRankWeight(a.academic_rank)
        const weightB = getRankWeight(b.academic_rank)
        comparison = weightA - weightB
      } else if (sortColumn === 'employment_status') {
        const statusA = a.employment_status || ''
        const statusB = b.employment_status || ''
        comparison = statusA.localeCompare(statusB)
        if (comparison === 0) {
          comparison = (a.tenure_years || 0) - (b.tenure_years || 0)
        }
      }

      // Secondary tie-breaker: Full Name, then ID
      if (comparison === 0) {
        comparison = (a.full_name || '').localeCompare(b.full_name || '')
      }
      if (comparison === 0) {
        comparison = String(a.id || '').localeCompare(String(b.id || ''))
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return list
  }, [personnelList, search, collegeFilter, deptFilter, statusFilter, sortColumn, sortDirection])

  // Pagination Slice
  const totalItems = filteredSortedList.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  
  const paginatedList = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * rowsPerPage
    return filteredSortedList.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredSortedList, safeCurrentPage, rowsPerPage])

  // Current page row selection calculations
  const currentPageIds = useMemo(() => paginatedList.map(p => p.id), [paginatedList])
  const isAllPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id))
  const isSomePageSelected = currentPageIds.some(id => selectedIds.has(id)) && !isAllPageSelected

  // Handle Sort Header Toggle
  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  // Handle Header Checkbox Toggle (Current Page Only)
  const handleToggleSelectAllPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (isAllPageSelected) {
        currentPageIds.forEach(id => next.delete(id))
      } else {
        currentPageIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  // Handle Single Row Checkbox Toggle
  const handleToggleSelectRow = (id, e) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Copy Email Handler
  const handleCopyEmail = (email, id, e) => {
    e.stopPropagation()
    if (!email) return
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopiedEmailId(id)
        if (showToast) showToast(`Copied ${email} to clipboard!`)
        setTimeout(() => setCopiedEmailId(null), 2000)
      })
      .catch(() => {
        if (showToast) showToast('Failed to copy email to clipboard.')
      })
  }

  // Client-Side CSV Export for Selected Rows
  const handleExportCSV = () => {
    const selectedList = personnelList.filter(p => selectedIds.has(p.id))
    if (selectedList.length === 0) return

    const headers = ['Employee ID', 'Full Name', 'Email', 'Department', 'College', 'Academic Rank', 'Employment Status', 'Years of Service']
    
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""'
      const stringified = String(str).replace(/"/g, '""')
      return `"${stringified}"`
    }

    const rows = selectedList.map(p => [
      escapeCSV(p.employee_id),
      escapeCSV(p.full_name),
      escapeCSV(p.email),
      escapeCSV(p.department),
      escapeCSV(p.college),
      escapeCSV(p.academic_rank),
      escapeCSV(p.employment_status),
      escapeCSV(p.tenure_years)
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const dateStr = new Date().toISOString().split('T')[0]
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `personnel-directory-selected-${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    if (showToast) showToast(`Exported ${selectedList.length} selected personnel record(s) to CSV.`)
  }

  // Clear Filters Handler
  const handleResetFilters = () => {
    setSearch('')
    setCollegeFilter('ALL')
    setDeptFilter('ALL')
    setStatusFilter('ALL')
  }

  // Helper Badge Renderers
  const getCollegeAcronym = (collegeStr = '') => {
    if (!collegeStr) return 'NDMU'
    if (collegeStr.startsWith('CEAC')) return 'CEAC'
    if (collegeStr.startsWith('CBA')) return 'CBA'
    if (collegeStr.startsWith('CAS')) return 'CAS'
    return collegeStr.split(' ')[0]
  }

  const renderStatusBadge = (statusStr = '') => {
    let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    let dotStyle = 'bg-slate-400'

    if (statusStr.includes('Permanent')) {
      badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      dotStyle = 'bg-emerald-500'
    } else if (statusStr.includes('Probationary')) {
      badgeStyle = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      dotStyle = 'bg-amber-500'
    } else if (statusStr.includes('Part-Time') || statusStr.includes('Lecturer')) {
      badgeStyle = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
      dotStyle = 'bg-sky-500'
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
        <span>{statusStr || 'Not Specified'}</span>
      </span>
    )
  }

  const renderCollegeBadge = (collegeStr = '') => {
    const acronym = getCollegeAcronym(collegeStr)
    let colorStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    
    if (acronym === 'CEAC') {
      colorStyle = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800'
    } else if (acronym === 'CBA') {
      colorStyle = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
    } else if (acronym === 'CAS') {
      colorStyle = 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800'
    }

    return (
      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${colorStyle}`}>
        {acronym}
      </span>
    )
  }

  const activeFilterCount = (collegeFilter !== 'ALL' ? 1 : 0) +
                            (deptFilter !== 'ALL' ? 1 : 0) +
                            (statusFilter !== 'ALL' ? 1 : 0) +
                            (search.trim() ? 1 : 0)

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
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
              placeholder="Search personnel by name, employee ID, or email..."
              aria-label="Search personnel by name, employee ID, or email"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-normal text-slate-800 dark:text-white focus:outline-none focus:border-[#1b4332]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            {/* College Filter */}
            <select
              value={collegeFilter}
              onChange={e => setCollegeFilter(e.target.value)}
              aria-label="Filter by college"
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#1b4332]"
            >
              <option value="ALL">All Colleges</option>
              <option value="CEAC">CEAC - Engineering &amp; Computing</option>
              <option value="CBA">CBA - Business Administration</option>
              <option value="CAS">CAS - Arts &amp; Sciences</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              aria-label="Filter by department"
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#1b4332]"
            >
              <option value="ALL">All Departments</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Employment Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter by employment status"
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#1b4332]"
            >
              <option value="ALL">All Employment Statuses</option>
              <option value="Full-Time Permanent">Full-Time Permanent</option>
              <option value="Full-Time Probationary">Full-Time Probationary</option>
              <option value="Part-Time Lecturer">Part-Time Lecturer</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Active filters:</span>
            {search.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                Search: "{search}"
                <button type="button" onClick={() => setSearch('')} className="hover:text-red-500 cursor-pointer" aria-label="Clear search filter">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {collegeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium">
                College: {collegeFilter}
                <button type="button" onClick={() => setCollegeFilter('ALL')} className="hover:text-red-500 cursor-pointer" aria-label="Clear college filter">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {deptFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-medium">
                Dept: {deptFilter}
                <button type="button" onClick={() => setDeptFilter('ALL')} className="hover:text-red-500 cursor-pointer" aria-label="Clear department filter">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('ALL')} className="hover:text-red-500 cursor-pointer" aria-label="Clear employment status filter">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#1b4332] dark:text-emerald-400 hover:underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Sticky Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="p-3 px-4 rounded-xl bg-[#1b4332] text-white flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 font-bold">
              {selectedIds.size}
            </span>
            <span>personnel member(s) selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-medium text-emerald-200 hover:text-white transition cursor-pointer"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* 5-Column Directory Table */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs select-none">
                {/* Header Checkbox */}
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={el => { if (el) el.indeterminate = isSomePageSelected }}
                    onChange={handleToggleSelectAllPage}
                    aria-label="Select all personnel on current page"
                    className="w-4 h-4 rounded border-slate-300 text-[#1b4332] focus:ring-[#1b4332] cursor-pointer"
                  />
                </th>

                {/* Personnel Member Header */}
                <th className="p-4" aria-sort={sortColumn === 'full_name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => handleSort('full_name')}
                    aria-label="Sort by personnel member full name"
                    className="flex items-center gap-1.5 hover:text-[#1b4332] dark:hover:text-emerald-400 transition cursor-pointer group font-semibold text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span>Personnel member</span>
                    {sortColumn === 'full_name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>
                </th>

                {/* Department and College Header */}
                <th className="p-4" aria-sort={sortColumn === 'department' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => handleSort('department')}
                    aria-label="Sort by department and college"
                    className="flex items-center gap-1.5 hover:text-[#1b4332] dark:hover:text-emerald-400 transition cursor-pointer group font-semibold text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span>Department and college</span>
                    {sortColumn === 'department' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>
                </th>

                {/* Academic Rank Header */}
                <th className="p-4" aria-sort={sortColumn === 'academic_rank' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => handleSort('academic_rank')}
                    aria-label="Sort by academic rank"
                    className="flex items-center gap-1.5 hover:text-[#1b4332] dark:hover:text-emerald-400 transition cursor-pointer group font-semibold text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span>Academic rank</span>
                    {sortColumn === 'academic_rank' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>
                </th>

                {/* Employment Details Header */}
                <th className="p-4" aria-sort={sortColumn === 'employment_status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => handleSort('employment_status')}
                    aria-label="Sort by employment details"
                    className="flex items-center gap-1.5 hover:text-[#1b4332] dark:hover:text-emerald-400 transition cursor-pointer group font-semibold text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span>Employment details</span>
                    {sortColumn === 'employment_status' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>
                </th>

                {/* Actions Header */}
                <th className="p-4 text-right font-semibold text-xs text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    {personnelList.length === 0 ? (
                      <div className="space-y-3 max-w-md mx-auto">
                        <User className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No personnel records yet</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Personnel records will appear here once new accounts are onboarded.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-w-md mx-auto">
                        <AlertCircle className="w-10 h-10 text-amber-500/80 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching personnel</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No records match your search query or filter selections. Try clearing your active filters.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset search and filters</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedList.map(p => {
                  const isSelected = selectedIds.has(p.id)
                  return (
                    <tr
                      key={p.id}
                      onClick={() => typeof handleSelect === 'function' && handleSelect(p)}
                      className={`transition cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="p-4 w-10" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectRow(p.id, e)}
                          aria-label={`Select ${p.full_name || 'personnel member'}`}
                          className="w-4 h-4 rounded border-slate-300 text-[#1b4332] focus:ring-[#1b4332] cursor-pointer"
                        />
                      </td>

                      {/* Personnel Identity & Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-3.5">
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt={p.full_name || 'Personnel Avatar'}
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 font-bold text-sm">
                              {p.full_name ? p.full_name.charAt(0) : 'U'}
                            </div>
                          )}

                          <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white group-hover:text-[#1b4332] dark:group-hover:text-emerald-400 transition truncate">
                              {p.full_name || 'Unnamed Personnel'}
                            </p>

                            {/* Interactive Email with Mailto & Copy */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 group/email" onClick={e => e.stopPropagation()}>
                              {p.email ? (
                                <>
                                  <a
                                    href={`mailto:${p.email}`}
                                    aria-label={`Email ${p.full_name}`}
                                    className="hover:text-[#1b4332] dark:hover:text-emerald-400 hover:underline truncate"
                                  >
                                    {p.email}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyEmail(p.email, p.id, e)}
                                    aria-label={`Copy ${p.full_name}'s email`}
                                    title="Copy Email"
                                    className="opacity-0 group-hover/email:opacity-100 focus:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
                                  >
                                    {copiedEmailId === p.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                <span className="italic text-slate-400">No email on record</span>
                              )}
                            </div>

                            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                              {p.employee_id || 'ID Pending'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department and College */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {p.department || 'Unassigned Department'}
                          </p>
                          <div>
                            {renderCollegeBadge(p.college)}
                          </div>
                        </div>
                      </td>

                      {/* Academic Rank */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                          {p.academic_rank || 'Unassigned Rank'}
                        </span>
                      </td>

                      {/* Employment Details */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div>
                            {renderStatusBadge(p.employment_status)}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {p.tenure_years != null ? `${p.tenure_years} ${p.tenure_years === 1 ? 'year' : 'years'} of service` : 'Service length pending'}
                          </p>
                        </div>
                      </td>

                      {/* Actions Menu Kebab */}
                      <td className="p-4 text-right relative" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                            aria-haspopup="menu"
                            aria-expanded={activeMenuId === p.id}
                            aria-label={`Actions for ${p.full_name || 'personnel'}`}
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Floating Kebab Dropdown Menu */}
                          {activeMenuId === p.id && (
                            <div
                              ref={menuRef}
                              role="menu"
                              className="absolute right-4 top-12 z-50 w-52 rounded-2xl bg-white dark:bg-[#182638] border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-left divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150"
                            >
                              <div className="py-1">
                                {typeof handleSelect === 'function' && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      handleSelect(p)
                                      setActiveMenuId(null)
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                                    <span>View personnel profile</span>
                                  </button>
                                )}

                                {typeof onEditAssignment === 'function' && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      onEditAssignment(p)
                                      setActiveMenuId(null)
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    <span>Edit assignment</span>
                                  </button>
                                )}
                              </div>

                              <div className="py-1">
                                {typeof onPromoteRank === 'function' && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      onPromoteRank(p)
                                      setActiveMenuId(null)
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                                  >
                                    <Award className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    <span>Record rank change</span>
                                  </button>
                                )}

                                {typeof onResetPassword === 'function' && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      onResetPassword(p)
                                      setActiveMenuId(null)
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                                  >
                                    <KeyRound className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    <span>Reset password</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary & Pagination */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          {/* Result Summary */}
          <div>
            {totalItems === 0 ? (
              <span>0 matching records</span>
            ) : (
              <span>
                Showing <strong className="text-slate-900 dark:text-white font-bold">{((safeCurrentPage - 1) * rowsPerPage) + 1}–{Math.min(safeCurrentPage * rowsPerPage, totalItems)}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalItems}</strong> matching personnel
                {totalItems !== personnelList.length && ` (out of ${personnelList.length} total)`}
              </span>
            )}
          </div>

          {/* Rows Per Page & Pagination Buttons */}
          <div className="flex items-center gap-4">
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={e => setRowsPerPage(Number(e.target.value))}
                aria-label="Select rows per page"
                className="py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#1b4332]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-semibold text-slate-800 dark:text-slate-200">
                Page {safeCurrentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const FacultyDirectory = PersonnelDirectoryTable
