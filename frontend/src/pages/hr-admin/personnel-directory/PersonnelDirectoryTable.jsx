import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, ArrowUp, ArrowDown, ArrowUpDown, MoreVertical,
  Copy, Check, X, ChevronLeft, ChevronRight, User, RefreshCw,
  Filter, ChevronDown, AlertTriangle
} from 'lucide-react'
import PersonnelActionsMenu from './PersonnelActionsMenu'
import { Select, SelectItem } from '../../../components/ui/select'
import { isAcademicPersonnel, formatPersonnelClassification } from '../../../utils/personnelPlacement'
import { applyPersonnelFilters, NOT_RECORDED } from '../../../utils/personnelDirectoryFilters'

// Normalized search string helper
const normalizeSearchValue = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

// Multi-attribute search matcher for target schema personnel
const matchesPersonnelSearch = (person, query) => {
  if (!query) return true
  if (!person || typeof person !== 'object') return false
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return true

  const compositeName = [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(' ')

  const progCodes = (person.program_affiliations || []).map(p => p?.code || p?.name).filter(Boolean).join(' ')

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
    person.college_code,
    person.college_name,
    person.administrative_unit_code,
    person.administrative_unit_name,
    person.designation,
    person.personnel_group,
    person.organizational_side,
    person.personnel_classification,
    progCodes
  ].filter(Boolean).map(normalizeSearchValue)

  if (searchValues.some(val => val.includes(normalizedQuery))) {
    return true
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean)
  if (tokens.length > 1) {
    return tokens.every(token =>
      searchValues.some(val => val.includes(token))
    )
  }

  return false
}

export default function PersonnelDirectoryTable({
  personnelList = [],
  initialSearch = '',
  sortConfig,
  onSortChange,
  newlyCreatedId,
  revealRequestKey,
  onSelectPersonnel,
  onSelectFaculty,
  onEditAssignment,
  onEditMasterData,
  onPromoteRank,
  onResetPassword,
  onDeletePersonnel,
  onManageRole,
  onRefresh,
  showToast,
  serverTotal = null,
  onServerQueryChange,
  isLoading = false,
  directoryCollegeOptions = [],
  directoryDepartmentOptions = []
}) {
  const handleSelect = onSelectPersonnel || onSelectFaculty

  // Filter & Search State
  const [search, setSearch] = useState(initialSearch)
  const [groupFilter, setGroupFilter] = useState('ALL')
  const [sideFilter, setSideFilter] = useState('ALL')
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState('ALL')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [unitFilter, setUnitFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const searchInputRef = useRef(null)

  // Controlled Sorting State
  const sortColumn = sortConfig?.column || 'full_name'
  const sortDirection = sortConfig?.direction || 'asc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Selection & Action Menu State
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [copiedEmailId, setCopiedEmailId] = useState(null)

  const triggerRefs = useRef({})

  useEffect(() => {
    setSearch(initialSearch || '')
    setGroupFilter('ALL')
    setSideFilter('ALL')
    setEmploymentStatusFilter('ALL')
    setCollegeFilter('ALL')
    setUnitFilter('ALL')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }, [initialSearch])

  const activePersonnel = useMemo(() => {
    if (!activeMenuId) return null
    return personnelList.find(p => p.id === activeMenuId) || null
  }, [personnelList, activeMenuId])

  const derivedCollegeOptions = useMemo(() => Array.from(new Map(personnelList
    .filter(person => person?.college_id && person?.college_name)
    .map(person => [person.college_id, { id: person.college_id, code: person.college_code, name: person.college_name }])).values())
    .sort((a, b) => a.name.localeCompare(b.name)), [personnelList])
  const derivedDepartmentOptions = useMemo(() => Array.from(new Map(personnelList
    .filter(person => person?.administrative_unit_id && person?.administrative_unit_name)
    .map(person => [person.administrative_unit_id, { id: person.administrative_unit_id, code: person.administrative_unit_code, name: person.administrative_unit_name }])).values())
    .sort((a, b) => a.name.localeCompare(b.name)), [personnelList])
  const collegeOptions = directoryCollegeOptions.length ? directoryCollegeOptions : derivedCollegeOptions
  const departmentOptions = directoryDepartmentOptions.length ? directoryDepartmentOptions : derivedDepartmentOptions

  useEffect(() => {
    setCurrentPage(1)
    setActiveMenuId(null)
  }, [search, groupFilter, sideFilter, employmentStatusFilter, collegeFilter, unitFilter, statusFilter, sortColumn, sortDirection, rowsPerPage])

  useEffect(() => {
    if (!onServerQueryChange) return undefined
    const timer = window.setTimeout(() => {
      const query = {
        search,
        sort_by: sortColumn === 'classification' ? 'full_name' : sortColumn,
        sort_dir: sortDirection,
        page: currentPage,
        per_page: rowsPerPage
      }
      if (groupFilter !== 'ALL') query.personnel_group = groupFilter
      if (sideFilter !== 'ALL') query.personnel_classification = sideFilter
      if (employmentStatusFilter !== 'ALL') query.employment_status = employmentStatusFilter
      if (collegeFilter !== 'ALL') query.college_id = collegeFilter
      if (unitFilter !== 'ALL') query.administrative_unit_id = unitFilter
      if (statusFilter !== 'ALL') query.status = statusFilter
      onServerQueryChange(query)
    }, 220)
    return () => window.clearTimeout(timer)
  }, [onServerQueryChange, search, groupFilter, sideFilter, employmentStatusFilter, collegeFilter, unitFilter, statusFilter, sortColumn, sortDirection, currentPage, rowsPerPage])

  useEffect(() => {
    if (revealRequestKey) {
      setSearch('')
      setGroupFilter('ALL')
      setSideFilter('ALL')
      setEmploymentStatusFilter('ALL')
      setCollegeFilter('ALL')
      setUnitFilter('ALL')
      setStatusFilter('ALL')
      setCurrentPage(1)
    }
  }, [revealRequestKey])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveMenuId(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter & Sort Pipeline
  const filteredSortedList = useMemo(() => {
    let list = [...personnelList]

    // 1. Search Query
    if (!onServerQueryChange && search.trim()) {
      list = list.filter(p => matchesPersonnelSearch(p, search))
    }

    // 2–9. Structured filters (see utils/personnelDirectoryFilters.js)
    if (!onServerQueryChange) {
      list = applyPersonnelFilters(list, {
        group: groupFilter,
        appointment: employmentStatusFilter,
        college: collegeFilter,
        department: unitFilter,
        status: statusFilter
      })
      if (sideFilter !== 'ALL') {
        list = list.filter(p => (p.organizational_side || p.personnel_classification || '').toLowerCase() === sideFilter)
      }
    }

    // 10. Sorting
    list.sort((a, b) => {
      let comparison = 0
      if (sortColumn === 'created_at') {
        const timeA = Date.parse(a.created_at || a.provisioned_at || '') || 0
        const timeB = Date.parse(b.created_at || b.provisioned_at || '') || 0
        comparison = timeA - timeB
      } else if (sortColumn === 'full_name') {
        comparison = (a.full_name || '').localeCompare(b.full_name || '')
      } else if (sortColumn === 'classification') {
        const classA = formatPersonnelClassification(a)
        const classB = formatPersonnelClassification(b)
        comparison = classA.localeCompare(classB)
      } else if (sortColumn === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '')
      }

      if (comparison === 0) {
        comparison = (a.full_name || '').localeCompare(b.full_name || '')
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return list
  }, [personnelList, search, groupFilter, sideFilter, employmentStatusFilter, collegeFilter, unitFilter, statusFilter, sortColumn, sortDirection, onServerQueryChange])

  const totalItems = serverTotal == null ? filteredSortedList.length : serverTotal
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  
  const paginatedList = useMemo(() => {
    if (serverTotal != null) return filteredSortedList
    const startIndex = (safeCurrentPage - 1) * rowsPerPage
    return filteredSortedList.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredSortedList, safeCurrentPage, rowsPerPage, serverTotal])

  const currentPageIds = useMemo(() => paginatedList.map(p => p.id), [paginatedList])
  const isAllPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id))
  const isSomePageSelected = currentPageIds.some(id => selectedIds.has(id)) && !isAllPageSelected

  const handleSort = (col) => {
    if (!onSortChange) return
    const newDir = sortColumn === col ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'
    onSortChange({ column: col, direction: newDir })
  }

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

  const handleResetFilters = () => {
    setSearch('')
    setGroupFilter('ALL')
    setSideFilter('ALL')
    setEmploymentStatusFilter('ALL')
    setCollegeFilter('ALL')
    setUnitFilter('ALL')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

  const activeFilterItems = [
    groupFilter !== 'ALL' && { label: groupFilter === 'faculty' ? 'Teaching Faculty' : 'Non-Teaching Faculty', clear: () => setGroupFilter('ALL') },
    employmentStatusFilter !== 'ALL' && { label: employmentStatusFilter === NOT_RECORDED ? 'Appointment: Not recorded' : `Appointment: ${employmentStatusFilter}`, clear: () => setEmploymentStatusFilter('ALL') },
    collegeFilter !== 'ALL' && { label: `College: ${collegeOptions.find(item => String(item.id) === String(collegeFilter))?.code || collegeOptions.find(item => String(item.id) === String(collegeFilter))?.name || 'Selected'}`, clear: () => setCollegeFilter('ALL') },
    unitFilter !== 'ALL' && { label: `Department: ${departmentOptions.find(item => String(item.id) === String(unitFilter))?.code || departmentOptions.find(item => String(item.id) === String(unitFilter))?.name || 'Selected'}`, clear: () => setUnitFilter('ALL') },
    statusFilter !== 'ALL' && { label: `Status: ${statusFilter}`, clear: () => setStatusFilter('ALL') }
  ].filter(Boolean)
  const hasActiveFilters = activeFilterItems.length > 0 || Boolean(search)

  const loginReadiness = (readiness) => {
    const status = readiness?.status || 'UNKNOWN'
    const config = {
      READY: ['Login ready', false],
      NEEDS_PASSWORD_CHANGE: ['Password change required', true],
      DISABLED: ['Login disabled', false],
      IDENTITY_CONFLICT: ['Account conflict', true],
      NOT_READY: ['Login not ready', true],
      UNKNOWN: ['Readiness unknown', false]
    }[status] || ['Readiness unknown', false]
    const reasons = (readiness?.reason_codes || []).map(reason => reason.toLowerCase().replace(/_/g, ' ')).join(', ')
    return { label: config[0], needsAttention: config[1], title: reasons ? `${config[0]}: ${reasons}` : config[0] }
  }

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search personnel"
              placeholder="Search personnel by name, email, ID, assignment, or position"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="personnel-directory-filters"
            onClick={() => setFiltersOpen(open => !open)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <Filter aria-hidden="true" className="h-4 w-4" />
            Filters
            {activeFilterItems.length > 0 && <span className="rounded-full bg-emerald-100 px-1.5 text-xs font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">{activeFilterItems.length}</span>}
            <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div id="personnel-directory-filters" role="region" aria-label="Personnel filters" className={`${filtersOpen ? 'grid' : 'hidden'} grid-cols-1 gap-3 border-t border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 dark:border-slate-800`}>
          {/* Personnel Group Filter */}
          <Select
            value={groupFilter}
            onValueChange={setGroupFilter}
            ariaLabel="Filter by personnel group"
            className="w-full"
            triggerClassName="py-2 text-xs font-medium"
          >
            <SelectItem value="ALL">All Groups</SelectItem>
            <SelectItem value="faculty">Teaching Faculty</SelectItem>
            <SelectItem value="non_teaching_faculty">Non-Teaching Faculty</SelectItem>
          </Select>

          {/* Appointment status */}
          <Select
            value={employmentStatusFilter}
            onValueChange={setEmploymentStatusFilter}
            ariaLabel="Filter by employment status"
            className="w-full"
            triggerClassName="py-2 text-xs font-medium"
          >
            <SelectItem value="ALL">All Appointments</SelectItem>
            <SelectItem value="permanent">Permanent</SelectItem>
            <SelectItem value="probationary">Probationary</SelectItem>
            <SelectItem value={NOT_RECORDED}>Not recorded</SelectItem>
          </Select>

          {/* College Filter */}
          <Select
            value={collegeFilter}
            onValueChange={setCollegeFilter}
            ariaLabel="Filter by college"
            className="w-full"
            triggerClassName="py-2 text-xs font-medium"
          >
            <SelectItem value="ALL">All Colleges</SelectItem>
            {collegeOptions.map(college => <SelectItem key={college.id} value={college.id}>{college.code ? `${college.code} — ` : ''}{college.name}</SelectItem>)}
          </Select>

          {/* Administrative Unit Filter */}
          <Select
            value={unitFilter}
            onValueChange={setUnitFilter}
            ariaLabel="Filter by department"
            className="w-full"
            triggerClassName="py-2 text-xs font-medium"
          >
            <SelectItem value="ALL">All Departments</SelectItem>
            {departmentOptions.map(department => <SelectItem key={department.id} value={department.id}>{department.code ? `${department.code} — ` : ''}{department.name}</SelectItem>)}
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            ariaLabel="Filter by status"
            className="w-full"
            triggerClassName="py-2 text-xs font-medium"
          >
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </Select>

        </div>

        {hasActiveFilters && <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2.5 dark:border-slate-800">
          <span className="mr-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Applied</span>
          {search && <button type="button" onClick={() => setSearch('')} aria-label={`Remove search ${search}`} className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><span className="max-w-56 truncate">Search: {search}</span><X aria-hidden="true" className="h-3 w-3 shrink-0" /></button>}
          {activeFilterItems.map((item, index) => <button key={`${item.label}-${index}`} type="button" onClick={item.clear} aria-label={`Remove ${item.label} filter`} className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><span className="max-w-56 truncate">{item.label}</span><X aria-hidden="true" className="h-3 w-3 shrink-0" /></button>)}
          <button type="button" onClick={handleResetFilters} className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Reset filters</button>
        </div>}
      </div>

      {/* Primary Directory Table Shell */}
      <section aria-busy={isLoading} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading && paginatedList.length > 0 && <p role="status" className="border-b border-slate-200 px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">Updating personnel records…</p>}
        <div className="overflow-x-auto min-w-full max-h-[70vh]">
          <table className="w-full min-w-[1080px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-10" />
              <col className="w-[23%]" />
              <col className="w-[15%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[22%]" />
              <col className="w-14" />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 select-none dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                <th className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={el => { if (el) el.indeterminate = isSomePageSelected }}
                    onChange={() => {
                      setSelectedIds(prev => {
                        const next = new Set(prev)
                        if (isAllPageSelected) {
                          currentPageIds.forEach(id => next.delete(id))
                        } else {
                          currentPageIds.forEach(id => next.add(id))
                        }
                        return next
                      })
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#064e2b] focus:ring-[#064e2b] cursor-pointer"
                  />
                </th>

                <th className="px-3 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => handleSort('full_name')}
                    className="flex items-center gap-1.5 hover:text-[#064e2b] dark:hover:text-emerald-400 font-semibold text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <span>Personnel</span>
                    {sortColumn === 'full_name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#064e2b]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#064e2b]" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </button>
                </th>

                <th className="px-3 py-3 text-left">Assignment</th>
                <th className="px-3 py-3 text-left">Job Title</th>
                <th className="px-3 py-3 text-left">Academic Rank</th>
                <th className="px-3 py-3 text-left">Status &amp; Responsibilities</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-normal text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    {isLoading ? <span role="status" className="text-sm text-slate-600 dark:text-slate-300">Updating personnel records…</span> : <div className="space-y-3 max-w-md mx-auto">
                      <User className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No personnel records found</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {hasActiveFilters ? 'No records match your active search or filter criteria.' : 'No personnel records were returned. Refresh the directory to try again.'}
                      </p>
                      <button
                        type="button"
                        onClick={hasActiveFilters ? handleResetFilters : (onRefresh || handleResetFilters)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{hasActiveFilters ? 'Clear filters' : 'Refresh directory'}</span>
                      </button>
                    </div>}
                  </td>
                </tr>
              ) : (
                paginatedList.map(p => {
                  const isSelected = selectedIds.has(p.id)
                  const isNewlyCreated = p.id === newlyCreatedId
                  const isAcademic = isAcademicPersonnel(p)
                  const organizationName = isAcademic
                    ? (p.college_name || p.college || '')
                    : (p.administrative_unit_name || '')
                  const organizationCode = isAcademic
                    ? (p.college_code || '')
                    : (p.administrative_unit_code || '')
                  const personnelStatus = p.status || p.account_status || 'active'
                  const normalizedStatus = String(personnelStatus).toLowerCase()
                  const readiness = loginReadiness(p.login_readiness)
                  const responsibilities = (p.assigned_roles || []).filter(role => {
                    const key = typeof role === 'object' ? (role?.role_key || role?.name || '') : String(role || '')
                    return ['program_coordinator', 'organization_moderator'].includes(key)
                  }).map(role => {
                    const key = typeof role === 'object' ? (role?.role_key || role?.name || '') : String(role || '')
                    return key.replace(/_/g, ' ')
                  })

                  return (
                    <tr
                      key={p.id}
                      onClick={() => typeof handleSelect === 'function' && handleSelect(p)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60 ${
                        isNewlyCreated
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/50'
                          : isSelected
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            setSelectedIds(prev => {
                              const next = new Set(prev)
                              if (next.has(p.id)) next.delete(p.id)
                              else next.add(p.id)
                              return next
                            })
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-[#064e2b] focus:ring-[#064e2b] cursor-pointer"
                        />
                      </td>

                      {/* Personnel Identity */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {p.full_name ? p.full_name.charAt(0) : 'P'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); handleSelect?.(p) }}
                              className="block max-w-full truncate rounded text-left text-sm font-semibold text-slate-900 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 dark:text-white dark:hover:text-emerald-300"
                            >
                              {p.full_name}
                            </button>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                              <span className="truncate">{p.institutional_email || p.email}</span>
                              {(p.institutional_email || p.email) && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyEmail(p.institutional_email || p.email, p.id, e)}
                                  className="hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                                  title="Copy email"
                                >
                                  {copiedEmailId === p.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {p.institutional_id || p.employee_id || 'ID Pending'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Assignment */}
                      <td className="px-3 py-3 align-top">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100" title={organizationName || 'Unassigned'} aria-label={organizationCode ? `${organizationCode}, ${organizationName}` : organizationName || 'Unassigned'}>{organizationCode || organizationName || 'Unassigned'}</p>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{formatPersonnelClassification(p)}</p>
                        </div>
                      </td>

                      {/* Job title */}
                      <td className="px-3 py-3 align-top">
                        <p className="break-words text-sm leading-5 text-slate-700 dark:text-slate-300" title={p.position_title || p.designation || 'Personnel'}>
                          {p.position_title || p.designation || 'Personnel'}
                        </p>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <p className="break-words text-sm leading-5 text-slate-700 dark:text-slate-300">{p.academic_rank_applicable === false ? 'Not applicable' : (p.current_rank_title || p.academic_rank || 'Unassigned')}</p>
                        {p.academic_rank_review_required && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300" title="Academic rank needs HR review"><AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />HR review required</p>}
                      </td>

                      {/* Status & Governance Roles */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-5">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${normalizedStatus === 'active' ? 'bg-emerald-600' : normalizedStatus === 'suspended' ? 'bg-rose-600' : normalizedStatus === 'archived' || normalizedStatus === 'inactive' ? 'bg-slate-400' : 'bg-amber-500'}`} aria-hidden="true" />
                          <span className="font-medium capitalize text-slate-800 dark:text-slate-100">{personnelStatus}</span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          {readiness.needsAttention && <AlertTriangle aria-label="Attention required" title={readiness.title} className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-300" />}
                          <span className={readiness.needsAttention ? 'font-medium text-amber-800 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400'} title={readiness.title}>{readiness.label}</span>
                        </div>
                        {responsibilities.length > 0 && <p className="mt-1 break-words text-xs capitalize leading-4 text-slate-600 dark:text-slate-400" title={responsibilities.join(' · ')}>{responsibilities.join(' · ')}</p>}
                      </td>

                      {/* Row Actions */}
                      <td className="px-3 py-3 text-right align-top" onClick={e => e.stopPropagation()}>
                        <button
                          ref={el => { triggerRefs.current[p.id] = el }}
                          type="button"
                          aria-label={`Open actions for ${p.full_name || 'personnel'}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuId(activeMenuId === p.id ? null : p.id)
                          }}
                          className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-900 dark:text-white font-bold">{totalItems === 0 ? 0 : ((safeCurrentPage - 1) * rowsPerPage) + 1}–{Math.min(safeCurrentPage * rowsPerPage, totalItems)}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalItems}</strong> matching records
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Floating Action Menu */}
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
          onEditMasterData={() => {
            setActiveMenuId(null)
            if (typeof onEditMasterData === 'function') onEditMasterData(activePersonnel)
            else if (typeof onEditAssignment === 'function') onEditAssignment(activePersonnel)
          }}
          onPromoteRank={() => {
            setActiveMenuId(null)
            if (typeof onPromoteRank === 'function') onPromoteRank(activePersonnel)
          }}
          onResetPassword={() => {
            setActiveMenuId(null)
            if (typeof onResetPassword === 'function') onResetPassword(activePersonnel)
          }}
          onDeletePersonnel={onDeletePersonnel ? () => onDeletePersonnel(activePersonnel) : undefined}
          onManageRole={(roleKey) => {
            setActiveMenuId(null)
            if (typeof onManageRole === 'function') onManageRole(activePersonnel, roleKey)
          }}
        />
      )}
    </div>
  )
}
