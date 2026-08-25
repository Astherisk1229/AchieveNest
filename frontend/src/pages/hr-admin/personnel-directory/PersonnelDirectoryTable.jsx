import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, ArrowUp, ArrowDown, ArrowUpDown, MoreVertical,
  Eye, Edit3, KeyRound, Award, Copy, Check, Download, X,
  ChevronLeft, ChevronRight, User, AlertCircle, RefreshCw
} from 'lucide-react'
import PersonnelActionsMenu from './PersonnelActionsMenu'
import { Select, SelectItem } from '../../../components/ui/select'

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

// Normalized search string helper
const normalizeSearchValue = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

// Comprehensive multi-attribute search matcher
const matchesPersonnelSearch = (person, query) => {
  if (!query) return true
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return true

  const compositeName = [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(' ')

  const searchValues = [
    person.first_name,
    person.middle_name,
    person.last_name,
    person.full_name,
    compositeName,
    person.employee_id,
    person.institutional_id,
    person.email,
    person.institutional_email,
    person.department,
    person.department_name,
    person.department_code,
    person.college
  ].filter(Boolean).map(normalizeSearchValue)

  // Direct full substring match
  if (searchValues.some(val => val.includes(normalizedQuery))) {
    return true
  }

  // Multi-token match (e.g. "Evelyn Mercado" matching first_name + last_name across fields)
  const tokens = normalizedQuery.split(' ').filter(Boolean)
  if (tokens.length > 1) {
    return tokens.every(token =>
      searchValues.some(val => val.includes(token))
    )
  }

  return false
}

/**
 * PersonnelDirectoryTable Component
 * Displays the primary 5-column grid table of personnel members with search, filters,
 * single-column sorting, pagination, row selection, copy email, and CSV export.
 */
export default function PersonnelDirectoryTable({
  personnelList = [],
  sortConfig,
  onSortChange,
  newlyCreatedId,
  revealRequestKey,
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

  const searchInputRef = useRef(null)

  // Controlled Sorting State
  const sortColumn = sortConfig?.column || 'full_name'
  const sortDirection = sortConfig?.direction || 'asc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Selection & Action Menu State
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [copiedEmailId, setCopiedEmailId] = useState(null)

  const triggerRefs = useRef({})

  const activePersonnel = useMemo(() => {
    if (!activeMenuId) return null
    return personnelList.find(p => p.id === activeMenuId) || null
  }, [personnelList, activeMenuId])

  // Reset to page 1 & close active menu on filter, search, sort, or rowsPerPage changes
  useEffect(() => {
    setCurrentPage(1)
    setActiveMenuId(null)
  }, [search, collegeFilter, deptFilter, statusFilter, sortColumn, sortDirection, rowsPerPage])

  // Reset department filter when college changes
  useEffect(() => {
    setDeptFilter('ALL')
  }, [collegeFilter])

  // Reveal Request Effect: Clear search, filters, and reset to Page 1
  useEffect(() => {
    if (revealRequestKey) {
      setSearch('')
      setCollegeFilter('ALL')
      setDeptFilter('ALL')
      setStatusFilter('ALL')
      setCurrentPage(1)
    }
  }, [revealRequestKey])

  // Close action menu on Escape key press or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveMenuId(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
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

  // Safe timestamp parser for Recently Added sorting
  const getCreatedTime = (value) => {
    const time = Date.parse(value || '')
    return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
  }

  // Filter & Sort Pipeline
  const filteredSortedList = useMemo(() => {
    let list = [...personnelList]

    // 1. Search Query with Multi-Attribute Matching
    if (search.trim()) {
      list = list.filter(p => matchesPersonnelSearch(p, search))
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
      if (sortColumn === 'created_at') {
        comparison = getCreatedTime(a.created_at) - getCreatedTime(b.created_at)
      } else if (sortColumn === 'full_name') {
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

  // Handle Header Column Sort Toggle
  const handleSort = (col) => {
    if (!onSortChange) return
    let newDir = 'asc'
    if (sortColumn === col) {
      newDir = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      if (col === 'academic_rank' || col === 'created_at') newDir = 'desc'
      else newDir = 'asc'
    }
    onSortChange({ column: col, direction: newDir })
  }

  // Handle Quick Sort Selector Change
  const handleQuickSortChange = (valueOrEvent) => {
    const rawVal = typeof valueOrEvent === 'string' ? valueOrEvent : valueOrEvent?.target?.value
    if (!rawVal) return
    const [col, dir] = rawVal.split(':')
    if (onSortChange) {
      onSortChange({ column: col, direction: dir })
    }
  }

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  // Handle Clear Search with Focus Restoration
  const handleClearSearch = () => {
    setSearch('')
    setCurrentPage(1)
    requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
  }

  // Handle College Filter Change
  const handleCollegeChange = (valueOrEvent) => {
    const val = typeof valueOrEvent === 'string' ? valueOrEvent : valueOrEvent?.target?.value
    setCollegeFilter(val || 'ALL')
    setDeptFilter('ALL')
    setCurrentPage(1)
  }

  // Handle Department Filter Change
  const handleDeptChange = (valueOrEvent) => {
    const val = typeof valueOrEvent === 'string' ? valueOrEvent : valueOrEvent?.target?.value
    setDeptFilter(val || 'ALL')
    setCurrentPage(1)
  }

  // Handle Status Filter Change
  const handleStatusChange = (valueOrEvent) => {
    const val = typeof valueOrEvent === 'string' ? valueOrEvent : valueOrEvent?.target?.value
    setStatusFilter(val || 'ALL')
    setCurrentPage(1)
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
    setCurrentPage(1)
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
      badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#245F42] border-emerald-200 dark:border-emerald-800'
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
      <div className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-none space-y-4">
        {/* Row 1: Search Input (Left) & Quick Sort Selector (Right) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, employee ID, or email..."
              aria-label="Search personnel by name, employee ID, or email"
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-normal text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43] dark:focus:border-emerald-600 transition"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                aria-label="Clear personnel search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Sort Selector with Shadcn Select */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto lg:shrink-0">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Sort by:</label>
            <Select
              value={`${sortColumn}:${sortDirection}`}
              onValueChange={handleQuickSortChange}
              ariaLabel="Sort personnel directory"
              className="w-full sm:w-[280px]"
              triggerClassName="py-2 text-sm font-semibold text-[#176B43] dark:text-emerald-400"
            >
              <SelectItem value="created_at:desc">Recently Added (Newest First)</SelectItem>
              <SelectItem value="full_name:asc">Name (A to Z)</SelectItem>
              <SelectItem value="full_name:desc">Name (Z to A)</SelectItem>
              <SelectItem value="academic_rank:desc">Academic Rank (Highest First)</SelectItem>
              <SelectItem value="department:asc">Department &amp; College (A to Z)</SelectItem>
            </Select>
          </div>
        </div>

        {/* Row 2: Category Filter Bar with Shadcn Selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* College Filter */}
          <div>
            <Select
              value={collegeFilter}
              onValueChange={handleCollegeChange}
              ariaLabel="Filter by college"
              className="w-full"
              triggerClassName="py-2 text-sm font-medium"
            >
              <SelectItem value="ALL">All Colleges</SelectItem>
              <SelectItem value="CEAC">CEAC - Engineering &amp; Computing</SelectItem>
              <SelectItem value="CBA">CBA - Business Administration</SelectItem>
              <SelectItem value="CAS">CAS - Arts &amp; Sciences</SelectItem>
            </Select>
          </div>

          {/* Department Filter */}
          <div>
            <Select
              value={deptFilter}
              onValueChange={handleDeptChange}
              disabled={availableDepartments.length === 0 && collegeFilter !== 'ALL'}
              placeholder={availableDepartments.length === 0 && collegeFilter !== 'ALL' ? 'No departments available' : 'All Departments'}
              ariaLabel="Filter by department"
              className="w-full"
              triggerClassName="py-2 text-sm font-medium"
            >
              <SelectItem value="ALL">All Departments</SelectItem>
              {availableDepartments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Employment Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onValueChange={handleStatusChange}
              ariaLabel="Filter by employment status"
              className="w-full"
              triggerClassName="py-2 text-sm font-medium"
            >
              <SelectItem value="ALL">All Employment Statuses</SelectItem>
              <SelectItem value="Full-Time Permanent">Full-Time Permanent</SelectItem>
              <SelectItem value="Full-Time Probationary">Full-Time Probationary</SelectItem>
              <SelectItem value="Part-Time Lecturer">Part-Time Lecturer</SelectItem>
              <SelectItem value="Contractual">Contractual</SelectItem>
            </Select>
          </div>
        </div>

        {/* Row 3: Result Count & Active Filter Chips Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-800 dark:text-white font-bold">{filteredSortedList.length}</strong> of <strong className="text-slate-800 dark:text-white font-bold">{personnelList.length}</strong> personnel
            </span>

            {activeFilterCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="font-semibold text-slate-500 dark:text-slate-400">Active filters:</span>
                {search.trim() && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    Search: "{search}"
                    <button type="button" onClick={handleClearSearch} className="hover:text-red-500 cursor-pointer" aria-label="Clear search filter">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {collegeFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium">
                    College: {collegeFilter}
                    <button type="button" onClick={() => handleCollegeChange('ALL')} className="hover:text-red-500 cursor-pointer" aria-label="Clear college filter">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {deptFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-medium">
                    Dept: {deptFilter}
                    <button type="button" onClick={() => handleDeptChange('ALL')} className="hover:text-red-500 cursor-pointer" aria-label="Clear department filter">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-[#245F42] font-medium">
                    Status: {statusFilter}
                    <button type="button" onClick={() => handleStatusChange('ALL')} className="hover:text-red-500 cursor-pointer" aria-label="Clear employment status filter">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-[#176B43] dark:text-emerald-400 hover:underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="p-3 px-4 rounded-xl bg-[#176B43] text-white flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-[#245F42] font-bold">
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
              className="text-xs font-medium text-[#245F42] hover:text-white transition cursor-pointer"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* 5-Column Directory Table Shell */}
      <section className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full min-w-[900px] table-fixed text-left text-xs border-collapse">
            <colgroup>
              <col className="w-[52px]" />
              <col className="w-[280px]" />
              <col className="w-[240px]" />
              <col className="w-[180px]" />
              <col className="w-[210px]" />
              <col className="w-[72px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs select-none">
                {/* Header Checkbox */}
                <th className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={el => { if (el) el.indeterminate = isSomePageSelected }}
                    onChange={handleToggleSelectAllPage}
                    aria-label="Select all personnel on current page"
                    className="w-4 h-4 rounded border-slate-300 text-[#064e2b] focus:ring-[#064e2b] cursor-pointer"
                  />
                </th>

                {/* Personnel Member Header */}
                <th className="p-4 text-left" aria-sort={sortColumn === 'full_name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => handleSort('full_name')}
                    aria-label="Sort by personnel member full name"
                    className="flex items-center gap-1.5 hover:text-[#064e2b] dark:hover:text-emerald-400 transition cursor-pointer group font-semibold text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span>Personnel member</span>
                    {sortColumn === 'full_name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 shrink-0" />
                    )}
                  </button>
                </th>

                {/* Department and College Header */}
                <th className="p-4 text-left" aria-sort={sortColumn === 'department' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => handleSort('department')}
                    aria-label="Sort by department and college"
                    className="flex items-center gap-1.5 hover:text-[#064e2b] dark:hover:text-emerald-400 transition cursor-pointer group font-semibold text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span>Department and college</span>
                    {sortColumn === 'department' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 shrink-0" />
                    )}
                  </button>
                </th>

                {/* Academic Rank Header */}
                <th className="p-4 text-left" aria-sort={sortColumn === 'academic_rank' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => handleSort('academic_rank')}
                    aria-label="Sort by academic rank"
                    className="flex items-center gap-1.5 hover:text-[#064e2b] dark:hover:text-emerald-400 transition cursor-pointer group font-semibold text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span>Academic rank</span>
                    {sortColumn === 'academic_rank' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 shrink-0" />
                    )}
                  </button>
                </th>

                {/* Employment Details Header */}
                <th className="p-4 text-left" aria-sort={sortColumn === 'employment_status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button
                    type="button"
                    onClick={() => handleSort('employment_status')}
                    aria-label="Sort by employment details"
                    className="flex items-center gap-1.5 hover:text-[#064e2b] dark:hover:text-emerald-400 transition cursor-pointer group font-semibold text-xs text-slate-600 dark:text-slate-300"
                  >
                    <span>Employment details</span>
                    {sortColumn === 'employment_status' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" /> : <ArrowDown className="w-3.5 h-3.5 text-[#064e2b] dark:text-emerald-400 shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 shrink-0" />
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
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching personnel found</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No records match your search query or filter selections. Try adjusting your search or filters.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Clear search and filters</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedList.map(p => {
                  const isSelected = selectedIds.has(p.id)
                  const isNewlyCreated = p.id === newlyCreatedId

                  return (
                    <tr
                      key={p.id}
                      onClick={() => typeof handleSelect === 'function' && handleSelect(p)}
                      className={`transition-colors duration-500 cursor-pointer group ${
                        isNewlyCreated
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-l-4 border-l-emerald-500 shadow-xs'
                          : isSelected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectRow(p.id, e)}
                          aria-label={`Select ${p.full_name || 'personnel member'}`}
                          className="w-4 h-4 rounded border-slate-300 text-[#064e2b] focus:ring-[#064e2b] cursor-pointer"
                        />
                      </td>

                      {/* Personnel Identity & Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt={p.full_name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                              {p.full_name ? p.full_name.charAt(0) : 'P'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-[#064e2b] dark:group-hover:text-emerald-400 transition">
                                {p.full_name}
                              </p>
                              {isNewlyCreated && (
                                <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 shrink-0">
                                  New
                                </span>
                              )}
                            </div>
                            
                            {/* Email with Hover Copy Icon */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <span className="truncate">{p.email}</span>
                              {p.email && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyEmail(p.email, p.id, e)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                                  aria-label={`Copy email address for ${p.full_name}`}
                                  title="Copy email to clipboard"
                                >
                                  {copiedEmailId === p.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Employee ID Subtext */}
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {p.employee_id || p.institutional_id || 'ID Pending'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department and College */}
                      <td className="p-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {p.department || 'Unassigned'}
                        </p>
                        <div className="mt-1">
                          {renderCollegeBadge(p.college)}
                        </div>
                      </td>

                      {/* Academic Rank */}
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                          {p.academic_rank || 'No Rank'}
                        </span>
                      </td>

                      {/* Employment Status & Tenure */}
                      <td className="p-4">
                        <div>
                          {renderStatusBadge(p.employment_status)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {p.tenure_years !== undefined ? `${p.tenure_years} years of service` : 'Service years not set'}
                        </p>
                      </td>

                      {/* Row Actions Menu Button */}
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            ref={el => { triggerRefs.current[p.id] = el }}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuId(activeMenuId === p.id ? null : p.id)
                            }}
                            aria-label={`Open action menu for ${p.full_name}`}
                            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
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

          {/* Rows Per Page & Pagination Buttons with Shadcn Select */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rows per page:</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(val) => {
                  setRowsPerPage(Number(val))
                  setCurrentPage(1)
                }}
                ariaLabel="Select rows per page"
                className="w-20"
                triggerClassName="py-1 px-2.5 min-h-[32px] text-xs font-semibold rounded-lg"
              >
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </Select>
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

      </section>

      {/* Floating Action Menu Popover Portal */}
      {activePersonnel && triggerRefs.current[activePersonnel.id] && (
        <PersonnelActionsMenu
          personnel={activePersonnel}
          triggerRef={{ current: triggerRefs.current[activePersonnel.id] }}
          isOpen={true}
          onClose={() => setActiveMenuId(null)}
          onViewDossier={() => {
            setActiveMenuId(null)
            if (typeof handleSelect === 'function') handleSelect(activePersonnel)
          }}
          onEditAssignment={() => {
            setActiveMenuId(null)
            if (typeof onEditAssignment === 'function') onEditAssignment(activePersonnel)
          }}
          onPromoteRank={() => {
            setActiveMenuId(null)
            if (typeof onPromoteRank === 'function') onPromoteRank(activePersonnel)
          }}
          onResetPassword={() => {
            setActiveMenuId(null)
            if (typeof onResetPassword === 'function') onResetPassword(activePersonnel)
          }}
          onManageRole={(roleKey) => {
            setActiveMenuId(null)
            if (typeof onManageRole === 'function') onManageRole(activePersonnel, roleKey)
          }}
        />
      )}
    </div>
  )
}
