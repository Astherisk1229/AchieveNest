import React, { useState, useMemo } from 'react'
import {
  Search, ArrowUp, ArrowDown, ArrowUpDown, MoreVertical,
  Eye, Edit3, KeyRound, UserCheck, Award
} from 'lucide-react'

export default function FacultyDirectory({
  personnelList = [],
  onSelectFaculty,
  onEditAssignment,
  onManageRole,
  onResetPassword,
  onPromoteRank
}) {
  const [search, setSearch] = useState('')
  const [collegeFilter, setCollegeFilter] = useState('ALL')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortColumn, setSortColumn] = useState('full_name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [activeMenuId, setActiveMenuId] = useState(null)

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  // Available departments dynamically computed from college selection
  const availableDepartments = useMemo(() => {
    const filtered = collegeFilter === 'ALL'
      ? personnelList
      : personnelList.filter(p => p.college === collegeFilter || (p.college && p.college.startsWith(collegeFilter)))
    
    const depts = new Set()
    filtered.forEach(p => {
      if (p.department) depts.add(p.department)
    })
    return Array.from(depts)
  }, [collegeFilter, personnelList])

  // Filter & Sort Logic
  const filteredList = useMemo(() => {
    let list = [...personnelList]

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(p =>
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        (p.employee_id && p.employee_id.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q))
      )
    }

    if (collegeFilter !== 'ALL') {
      list = list.filter(p => p.college === collegeFilter || (p.college && p.college.startsWith(collegeFilter)))
    }

    if (deptFilter !== 'ALL') {
      list = list.filter(p => p.department === deptFilter)
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(p => p.employment_status === statusFilter)
    }

    list.sort((a, b) => {
      let valA = a[sortColumn] ?? ''
      let valB = b[sortColumn] ?? ''
      if (typeof valA === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })

    return list
  }, [personnelList, search, collegeFilter, deptFilter, statusFilter, sortColumn, sortDirection])

  const getCollegeAcronym = (collegeStr) => {
    if (!collegeStr) return 'NDMU'
    if (collegeStr.startsWith('CEAC')) return 'CEAC'
    if (collegeStr.startsWith('CBA')) return 'CBA'
    if (collegeStr.startsWith('CAS')) return 'CAS'
    return collegeStr.split(' ')[0]
  }

  const simplifyDepartment = (deptStr) => {
    if (!deptStr) return 'Department'
    return deptStr
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search personnel by name, employee ID, or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-normal text-slate-800 dark:text-white focus:outline-none focus:border-[#1b4332]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
            {/* College Filter */}
            <select
              value={collegeFilter}
              onChange={e => {
                setCollegeFilter(e.target.value)
                setDeptFilter('ALL')
              }}
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
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#1b4332]"
            >
              <option value="ALL">All Departments</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{simplifyDepartment(dept)}</option>
              ))}
            </select>

            {/* Employment Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#1b4332]"
            >
              <option value="ALL">All Employment Statuses</option>
              <option value="Full-Time Permanent">Full-Time Permanent</option>
              <option value="Full-Time Probationary">Full-Time Probationary</option>
              <option value="Part-Time Lecturer">Part-Time Lecturer</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5-Column Table */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-[0.04em] text-xs select-none">
                <th className="p-4">
                  <button
                    type="button"
                    onClick={() => handleSort('full_name')}
                    className="flex items-center gap-1.5 hover:text-[#1b4332] dark:hover:text-emerald-400 transition cursor-pointer group"
                  >
                    <span>Personnel Member</span>
                    {sortColumn === 'full_name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" /> : <ArrowDown className="w-3.5 h-3.5 text-[#1b4332] dark:text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>
                </th>
                <th className="p-4">Department &amp; College</th>
                <th className="p-4">Academic Rank</th>
                <th className="p-4">Employment Details</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-slate-400 font-normal">
                    No personnel records match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => onSelectFaculty(p)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition cursor-pointer group"
                  >
                    {/* Personnel Identity */}
                    <td className="p-4 flex items-center gap-3.5">
                      <img
                        src={p.avatar_url}
                        alt={p.full_name}
                        className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold leading-[1.35] text-slate-900 dark:text-white group-hover:text-[#1b4332] dark:group-hover:text-emerald-400 transition">
                          {p.full_name}
                        </p>
                        <p className="text-xs font-normal leading-[1.4] text-slate-600 dark:text-slate-400">{p.email}</p>
                        <p className="text-xs font-medium leading-[1.4] text-slate-500 dark:text-slate-500">
                          {p.employee_id}
                        </p>
                      </div>
                    </td>

                    {/* Department & Unit */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold leading-[1.35] text-slate-900 dark:text-white">
                          {simplifyDepartment(p.department)}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-[0.03em] text-slate-500 dark:text-slate-400">
                          {getCollegeAcronym(p.college)}
                        </p>
                      </div>
                    </td>

                    {/* Academic Rank */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-sm font-medium leading-[1.4] text-slate-800 dark:text-slate-200">
                        {p.academic_rank || '—'}
                      </span>
                    </td>

                    {/* Employment Details */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-[1.4] text-slate-800 dark:text-slate-200">
                          {p.employment_status}
                        </p>
                        <p className="text-xs font-normal leading-[1.4] text-slate-500 dark:text-slate-400">
                          {p.tenure_years} {p.tenure_years === 1 ? 'year of service' : 'years of service'}
                        </p>
                      </div>
                    </td>

                    {/* Actions Kebab */}
                    <td className="p-4 text-right relative" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
                          title="Actions Menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Floating Action Menu */}
                        {activeMenuId === p.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                            <div className="absolute right-4 top-12 z-50 w-52 rounded-2xl bg-white dark:bg-[#182638] border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-left divide-y divide-slate-100 dark:divide-slate-800">
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectFaculty(p)
                                    setActiveMenuId(null)
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                                >
                                  <Eye className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                                  <span>View Personnel Profile</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onEditAssignment(p)
                                    setActiveMenuId(null)
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                                >
                                  <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                  <span>Edit Assignment</span>
                                </button>
                              </div>

                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onPromoteRank(p)
                                    setActiveMenuId(null)
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                                >
                                  <Award className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                  <span>Record Rank Change</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onResetPassword(p)
                                    setActiveMenuId(null)
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                                >
                                  <KeyRound className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                  <span>Reset Password</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
