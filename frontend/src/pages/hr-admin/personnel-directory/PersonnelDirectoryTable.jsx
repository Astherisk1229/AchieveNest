import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search, ArrowUp, ArrowDown, ArrowUpDown, MoreVertical,
  Eye, Edit3, KeyRound, Award, Copy, Check, Download, X,
  ChevronLeft, ChevronRight, User, AlertCircle, RefreshCw,
  Building2, Briefcase, ShieldCheck, GraduationCap
} from 'lucide-react'
import PersonnelActionsMenu from './PersonnelActionsMenu'
import { Select, SelectItem } from '../../../components/ui/select'

// Normalized search string helper
const normalizeSearchValue = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')

// Multi-attribute search matcher for target schema personnel
const matchesPersonnelSearch = (person, query) => {
  if (!query) return true
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return true

  const compositeName = [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(' ')

  const progCodes = (person.program_affiliations || []).map(p => p.code || p.name).join(' ')

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
  onPromoteRank,
  onResetPassword,
  onManageRole,
  showToast
}) {
  const handleSelect = onSelectPersonnel || onSelectFaculty

  // Filter & Search State
  const [search, setSearch] = useState('')
  const [classificationFilter, setClassificationFilter] = useState('ALL')
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

  useEffect(() => {
    setCurrentPage(1)
    setActiveMenuId(null)
  }, [search, classificationFilter, collegeFilter, unitFilter, roleFilter, statusFilter, sortColumn, sortDirection, rowsPerPage])

  useEffect(() => {
    if (revealRequestKey) {
      setSearch('')
      setClassificationFilter('ALL')
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

    // 2. Classification Filter
    if (classificationFilter !== 'ALL') {
      list = list.filter(p => p.personnel_classification === classificationFilter)
    }

    // 3. College Filter
    if (collegeFilter !== 'ALL') {
      list = list.filter(p => p.college_code === collegeFilter || p.college_id === collegeFilter)
    }

    // 4. Administrative Unit Filter
    if (unitFilter !== 'ALL') {
      list = list.filter(p => p.administrative_unit_code === unitFilter || p.administrative_unit_id === unitFilter)
    }

    // 5. Governance Role Filter
    if (roleFilter !== 'ALL') {
      list = list.filter(p => (p.assigned_roles || []).includes(roleFilter))
    }

    // 6. Status Filter
    if (statusFilter !== 'ALL') {
      list = list.filter(p => (p.status || p.employment_status) === statusFilter)
    }

    // 7. Sorting
    list.sort((a, b) => {
      let comparison = 0
      if (sortColumn === 'created_at') {
        const timeA = Date.parse(a.created_at || a.provisioned_at || '') || 0
        const timeB = Date.parse(b.created_at || b.provisioned_at || '') || 0
        comparison = timeA - timeB
      } else if (sortColumn === 'full_name') {
        comparison = (a.full_name || '').localeCompare(b.full_name || '')
      } else if (sortColumn === 'classification') {
        comparison = (a.personnel_classification || '').localeCompare(b.personnel_classification || '')
      } else if (sortColumn === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '')
      }

      if (comparison === 0) {
        comparison = (a.full_name || '').localeCompare(b.full_name || '')
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return list
  }, [personnelList, search, classificationFilter, collegeFilter, unitFilter, roleFilter, statusFilter, sortColumn, sortDirection])

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
    setClassificationFilter('ALL')
    setCollegeFilter('ALL')
    setUnitFilter('ALL')
    setRoleFilter('ALL')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

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

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 space-y-4">
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
              placeholder="Search by name, institutional ID, email, affiliation, or designation..."
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

        {/* Row 2: Target-Schema Category Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* Classification Filter */}
          <Select
            value={classificationFilter}
            onValueChange={setClassificationFilter}
            ariaLabel="Filter by classification"
            className="w-full"
            triggerClassName="py-2 text-sm font-medium"
          >
            <SelectItem value="ALL">All Classifications</SelectItem>
            <SelectItem value="academic">Academic Faculty</SelectItem>
            <SelectItem value="non_academic">Non-Academic Personnel</SelectItem>
          </Select>

          {/* College Filter */}
          <Select
            value={collegeFilter}
            onValueChange={setCollegeFilter}
            ariaLabel="Filter by college"
            className="w-full"
            triggerClassName="py-2 text-sm font-medium"
          >
            <SelectItem value="ALL">All Colleges</SelectItem>
            <SelectItem value="CEAC">CEAC - Engineering &amp; Computing</SelectItem>
            <SelectItem value="CBA">CBA - Business Administration</SelectItem>
            <SelectItem value="CAS">CAS - Arts &amp; Sciences</SelectItem>
            <SelectItem value="CTE">CTE - Teacher Education</SelectItem>
            <SelectItem value="CHS">CHS - Health Sciences</SelectItem>
          </Select>

          {/* Administrative Unit Filter */}
          <Select
            value={unitFilter}
            onValueChange={setUnitFilter}
            ariaLabel="Filter by administrative unit"
            className="w-full"
            triggerClassName="py-2 text-sm font-medium"
          >
            <SelectItem value="ALL">All Admin Units</SelectItem>
            <SelectItem value="PPS">Physical Plant &amp; Security</SelectItem>
            <SelectItem value="HRMD">Human Resource Management</SelectItem>
            <SelectItem value="ICTO">ICT Operations</SelectItem>
            <SelectItem value="REG">Registrar's Office</SelectItem>
            <SelectItem value="FIN">Finance Office</SelectItem>
          </Select>

          {/* Governance Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
            ariaLabel="Filter by governance role"
            className="w-full"
            triggerClassName="py-2 text-sm font-medium"
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
            triggerClassName="py-2 text-sm font-medium"
          >
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </Select>
        </div>
      </div>

      {/* Primary Directory Table Shell */}
      <section className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full min-w-[960px] text-left text-xs border-collapse">
            <thead>
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
                    <span>Personnel Member</span>
                    {sortColumn === 'full_name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#064e2b]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#064e2b]" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                    )}
                  </button>
                </th>

                <th className="p-4 text-left">Classification &amp; Primary Affiliation</th>
                <th className="p-4 text-left">Program Affiliations</th>
                <th className="p-4 text-left">Designation &amp; Governance Roles</th>
                <th className="p-4 text-left">Status &amp; Qualification</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
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
                  const isAcademic = p.personnel_classification === 'academic'

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
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {p.full_name}
                            </p>
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

                      {/* Classification & Primary Affiliation */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            isAcademic
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80'
                          }`}>
                            {isAcademic ? 'Academic' : 'Non-Academic'}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {isAcademic
                              ? (p.college_name ? `${p.college_code || ''} — ${p.college_name}` : (p.college || 'College Unassigned'))
                              : (p.administrative_unit_name ? `${p.administrative_unit_code || ''} — ${p.administrative_unit_name}` : 'Unit Unassigned')
                            }
                          </p>
                        </div>
                      </td>

                      {/* Program Affiliations (Academic only) */}
                      <td className="p-4">
                        {isAcademic && Array.isArray(p.program_affiliations) && p.program_affiliations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.program_affiliations.map(prog => (
                              <span
                                key={prog.academic_program_id || prog.code}
                                className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                                title={prog.name}
                              >
                                {prog.code}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Designation & Governance Roles */}
                      <td className="p-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{p.designation || 'Personnel'}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(p.assigned_roles || []).map(r => (
                            <span
                              key={r}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                r === 'dean'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200'
                                  : r === 'program_coordinator'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                                  : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200'
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {r.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status & Qualification */}
                      <td className="p-4">
                        <div>{renderStatusBadge(p.status || p.employment_status)}</div>
                        {p.latest_qualification_decision && (
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 capitalize">
                            Gate: {p.latest_qualification_decision.replace('_', ' ')}
                          </p>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          ref={el => { triggerRefs.current[p.id] = el }}
                          type="button"
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
