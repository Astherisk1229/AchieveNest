import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, ArrowUp, ArrowDown, ArrowUpDown, MoreVertical,
  Copy, Check, X, ChevronLeft, ChevronRight, User, RefreshCw,
  ShieldCheck, KeyRound
} from 'lucide-react'
import PersonnelActionsMenu from './PersonnelActionsMenu'
import { Select, SelectItem } from '../../../components/ui/select'
import { isAcademicPersonnel, formatPersonnelClassification } from '../../../utils/personnelPlacement'

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
  onManageRole,
  showToast
}) {
  const handleSelect = onSelectPersonnel || onSelectFaculty

  // Filter & Search State
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('ALL')
  const [sideFilter, setSideFilter] = useState('ALL')
  const [engagementFilter, setEngagementFilter] = useState('ALL')
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState('ALL')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [unitFilter, setUnitFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

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

  const activePersonnel = useMemo(() => {
    if (!activeMenuId) return null
    return personnelList.find(p => p.id === activeMenuId) || null
  }, [personnelList, activeMenuId])

  const collegeOptions = useMemo(() => Array.from(new Map(personnelList
    .filter(person => person?.college_id && person?.college_name)
    .map(person => [person.college_id, { id: person.college_id, code: person.college_code, name: person.college_name }])).values())
    .sort((a, b) => a.name.localeCompare(b.name)), [personnelList])
  const departmentOptions = useMemo(() => Array.from(new Map(personnelList
    .filter(person => person?.administrative_unit_id && person?.administrative_unit_name)
    .map(person => [person.administrative_unit_id, { id: person.administrative_unit_id, code: person.administrative_unit_code, name: person.administrative_unit_name }])).values())
    .sort((a, b) => a.name.localeCompare(b.name)), [personnelList])

  useEffect(() => {
    setCurrentPage(1)
    setActiveMenuId(null)
  }, [search, groupFilter, sideFilter, engagementFilter, employmentStatusFilter, collegeFilter, unitFilter, roleFilter, statusFilter, sortColumn, sortDirection, rowsPerPage])

  useEffect(() => {
    if (revealRequestKey) {
      setSearch('')
      setGroupFilter('ALL')
      setSideFilter('ALL')
      setEngagementFilter('ALL')
      setEmploymentStatusFilter('ALL')
      setCollegeFilter('ALL')
      setUnitFilter('ALL')
      setRoleFilter('ALL')
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
    if (search.trim()) {
      list = list.filter(p => matchesPersonnelSearch(p, search))
    }

    // 2. Personnel Group Filter (Plan D1)
    if (groupFilter !== 'ALL') {
      list = list.filter(p => {
        const grp = (p.personnel_group || (p.personnel_classification === 'academic' ? 'faculty' : 'non_teaching_faculty')).toLowerCase()
        return grp === groupFilter
      })
    }

    // 3. Organizational Side Filter (Plan D1)
    if (sideFilter !== 'ALL') {
      list = list.filter(p => {
        const side = (p.organizational_side || p.personnel_classification || 'academic').toLowerCase()
        return side === sideFilter
      })
    }

    // 4. Faculty Engagement Filter (Plan D2)
    if (engagementFilter !== 'ALL') {
      list = list.filter(p => {
        const eng = (p.faculty_engagement || '').toLowerCase()
        return eng === engagementFilter
      })
    }

    // 5. Employment Status Filter (Plan D2)
    if (employmentStatusFilter !== 'ALL') {
      list = list.filter(p => {
        const emp = (p.employment_status || '').toLowerCase()
        return emp === employmentStatusFilter
      })
    }

    // 6. College Filter
    if (collegeFilter !== 'ALL') {
      list = list.filter(p => p.college_code === collegeFilter || p.college_id === collegeFilter)
    }

    // 7. Administrative Unit Filter
    if (unitFilter !== 'ALL') {
      list = list.filter(p => p.administrative_unit_code === unitFilter || p.administrative_unit_id === unitFilter)
    }

    // 8. Governance Role Filter
    if (roleFilter !== 'ALL') {
      list = list.filter(p => (p.assigned_roles || []).some(r => {
        const key = typeof r === 'object' ? (r?.role_key || r?.name || '') : String(r || '')
        return key === roleFilter
      }))
    }

    // 9. Status Filter
    if (statusFilter !== 'ALL') {
      list = list.filter(p => (p.status || p.employment_status) === statusFilter)
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
  }, [personnelList, search, groupFilter, sideFilter, engagementFilter, employmentStatusFilter, collegeFilter, unitFilter, roleFilter, statusFilter, sortColumn, sortDirection])

  const totalItems = filteredSortedList.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  
  const paginatedList = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * rowsPerPage
    return filteredSortedList.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredSortedList, safeCurrentPage, rowsPerPage])

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
    setEngagementFilter('ALL')
    setEmploymentStatusFilter('ALL')
    setCollegeFilter('ALL')
    setUnitFilter('ALL')
    setRoleFilter('ALL')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

  const hasActiveFilters = Boolean(
    search || groupFilter !== 'ALL' || sideFilter !== 'ALL' ||
    engagementFilter !== 'ALL' || employmentStatusFilter !== 'ALL' ||
    collegeFilter !== 'ALL' || unitFilter !== 'ALL' ||
    roleFilter !== 'ALL' || statusFilter !== 'ALL'
  )

  const renderStatusBadge = (statusStr = 'active') => {
    const s = String(statusStr).toLowerCase()
    let badgeStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    let dotStyle = 'bg-emerald-500'

    if (s === 'suspended') {
      badgeStyle = 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      dotStyle = 'bg-red-500'
    } else if (s === 'archived') {
      badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
      dotStyle = 'bg-slate-400'
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${badgeStyle}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
        <span>{statusStr || 'Active'}</span>
      </span>
    )
  }

  const renderLoginReadiness = (readiness) => {
    const status = readiness?.status || 'UNKNOWN'
    const config = {
      READY: ['Login Ready', 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'],
      NEEDS_PASSWORD_CHANGE: ['Password Change Required', 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'],
      DISABLED: ['Login Disabled', 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'],
      IDENTITY_CONFLICT: ['Account Conflict', 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'],
      NOT_READY: ['Login Not Ready', 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'],
      UNKNOWN: ['Readiness Unknown', 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'],
    }[status] || ['Readiness Unknown', 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700']
    const reasons = (readiness?.reason_codes || []).map(reason => reason.toLowerCase().replace(/_/g, ' ')).join(', ')

    return (
      <span
        className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${config[1]}`}
        title={reasons ? `${config[0]}: ${reasons}` : config[0]}
      >
        <KeyRound className="h-2.5 w-2.5" aria-hidden="true" />
        {config[0]}
      </span>
    )
  }

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 w-full min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, ID, assignment, or position"
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-normal text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#176B43] dark:focus:border-emerald-600 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* Personnel Group Filter */}
          <Select
            value={groupFilter}
            onValueChange={setGroupFilter}
            ariaLabel="Filter by personnel group"
            className="w-full"
            triggerClassName="py-2 text-xs font-medium"
          >
            <SelectItem value="ALL">All Groups</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="non_teaching_faculty">Non-Teaching Faculty</SelectItem>
          </Select>

          {/* Employment type */}
          <Select
            value={engagementFilter}
            onValueChange={setEngagementFilter}
            ariaLabel="Filter by faculty engagement"
            className="w-full"
            triggerClassName="py-2 text-xs font-medium"
          >
            <SelectItem value="ALL">All Employment Types</SelectItem>
            <SelectItem value="full_time_faculty">Full-time Faculty</SelectItem>
            <SelectItem value="part_time_faculty">Part-time Faculty</SelectItem>
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

          {/* Governance Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
            ariaLabel="Filter by governance role"
            className="w-full"
            triggerClassName="py-2 text-xs font-medium"
          >
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="dean">Dean</SelectItem>
            <SelectItem value="program_coordinator">Program Coordinator</SelectItem>
            <SelectItem value="organization_moderator">Organization Moderator</SelectItem>
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
            <SelectItem value="archived">Archived</SelectItem>
          </Select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Primary Directory Table Shell */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto min-w-full max-h-[70vh]">
          <table className="w-full min-w-[760px] text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold text-xs select-none">
                <th className="p-4 w-12 text-center">
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

                <th className="p-4 text-left">
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

                <th className="p-4 text-left">Assignment</th>
                <th className="hidden lg:table-cell p-4 text-left">Employment</th>
                <th className="hidden md:table-cell p-4 text-left">Job Title</th>
                <th className="hidden md:table-cell p-4 text-left">Academic Rank</th>
                <th className="hidden lg:table-cell p-4 text-left">Appointment</th>
                <th className="p-4 text-left">Status &amp; Responsibilities</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="space-y-3 max-w-md mx-auto">
                      <User className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No personnel records found</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No records match your active search or filter criteria.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Clear filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map(p => {
                  const isSelected = selectedIds.has(p.id)
                  const isNewlyCreated = p.id === newlyCreatedId
                  const isAcademic = isAcademicPersonnel(p)

                  const engagementLabel = (p.faculty_engagement === 'part_time_faculty') ? 'Part-time Faculty' : 'Full-time Faculty'
                  const employmentStatusLabel = (p.employment_status === 'probationary') ? 'Probationary' : 'Permanent'

                  return (
                    <tr
                      key={p.id}
                      onClick={() => typeof handleSelect === 'function' && handleSelect(p)}
                      className={`transition-colors duration-200 cursor-pointer ${
                        isNewlyCreated
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-l-4 border-l-emerald-500'
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
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                            {p.full_name ? p.full_name.charAt(0) : 'P'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); handleSelect?.(p) }}
                              className="block max-w-full truncate text-left font-bold text-slate-900 hover:text-emerald-800 hover:underline hover:underline-offset-4 dark:text-white dark:hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
                            >
                              {p.full_name}
                            </button>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              {p.institutional_id || p.employee_id || 'ID Pending'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Assignment */}
                      <td className="p-4">
                        <div className="max-w-[240px] space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{isAcademic ? (p.college_code || 'College') : (p.administrative_unit_code || 'Unit')}</p>
                          <p className="truncate text-slate-600 dark:text-slate-300" title={isAcademic ? (p.college_name || p.college) : p.administrative_unit_name}>
                            {isAcademic ? (p.college_name || p.college || 'Unassigned') : (p.administrative_unit_name || 'Unassigned')}
                          </p>
                          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">{formatPersonnelClassification(p)}</p>
                        </div>
                      </td>

                      {/* Engagement & Employment Status (Plan D2) */}
                      <td className="hidden lg:table-cell p-4">
                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                          <p className="font-semibold">{engagementLabel.replace(' Faculty', '')}</p>
                          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">{employmentStatusLabel}</p>
                        </div>
                      </td>

                      {/* Job title */}
                      <td className="hidden md:table-cell p-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.position_title || p.designation || 'Personnel'}
                        </p>
                      </td>

                      <td className="hidden md:table-cell p-4 font-semibold text-slate-800 dark:text-slate-200">{p.current_rank_title || p.academic_rank || 'Unassigned'}</td>

                      <td className="hidden lg:table-cell p-4 font-semibold text-slate-800 dark:text-slate-200">
                        {(p.assigned_roles || []).some(role => (typeof role === 'object' ? role?.role_key : role) === 'dean') ? 'College Dean' : 'None'}
                      </td>

                      {/* Status & Governance Roles */}
                      <td className="p-4">
                        <div>{renderStatusBadge(p.status || p.account_status || 'active')}</div>
                        <div>{renderLoginReadiness(p.login_readiness)}</div>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {(p.assigned_roles || []).filter(r => {
                            const key = typeof r === 'object' ? (r?.role_key || r?.name || '') : String(r || '')
                            return ['program_coordinator', 'organization_moderator'].includes(key)
                          }).slice(0, 1).map((r, idx) => {
                            const roleKey = typeof r === 'object' ? (r?.role_key || r?.name || '') : String(r || '')
                            if (!roleKey) return null
                            const roleDisplay = roleKey.replace(/_/g, ' ')
                            return (
                              <span
                                key={roleKey || idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              >
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span className="capitalize">{roleDisplay}</span>
                              </span>
                            )
                          })}
                          {(p.assigned_roles || []).filter(r => {
                            const key = typeof r === 'object' ? (r?.role_key || r?.name || '') : String(r || '')
                            return ['program_coordinator', 'organization_moderator'].includes(key)
                          }).length > 1 && (
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">+1 responsibility</span>
                          )}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
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
          onManageRole={(roleKey) => {
            setActiveMenuId(null)
            if (typeof onManageRole === 'function') onManageRole(activePersonnel, roleKey)
          }}
        />
      )}
    </div>
  )
}
