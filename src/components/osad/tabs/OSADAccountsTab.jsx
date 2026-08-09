import React, { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Building2,
  ChevronDown,
  ShieldCheck,
  Edit,
  Eye,
  CheckCircle2
} from 'lucide-react'
import PersonnelSelectorModal from '../PersonnelSelectorModal'

export default function OSADAccountsTab({
  userRoleFilter,
  setUserRoleFilter,
  userSearchTerm,
  setUserSearchTerm,
  selectedCollege,
  setSelectedCollege,
  selectedSort,
  setSelectedSort,
  getUsers,
  getPersonnelList,
  assignProgramCoordinator,
  assignOrganizationModerator
}) {
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [selectedUserForRole, setSelectedUserForRole] = useState(null)
  const [roleModalType, setRoleModalType] = useState(null) // 'coordinator' | 'moderator'
  const [assignedProgram, setAssignedProgram] = useState('BS Computer Science')
  const [assignedOrg, setAssignedOrg] = useState('Computer Society NDMU')

  const usersList = getUsers(userRoleFilter, userSearchTerm, selectedCollege, selectedSort)

  const handleOpenRoleAssignment = (user, type) => {
    setSelectedUserForRole(user)
    setRoleModalType(type)
  }

  const handleConfirmRoleAssignment = (personnel, roleType, payload) => {
    if (roleType === 'coordinator') {
      assignProgramCoordinator(personnel.id || personnel.employee_id, payload.program || assignedProgram)
    } else if (roleType === 'moderator') {
      assignOrganizationModerator(personnel.id || personnel.employee_id, payload.org || assignedOrg)
    }
    setRoleModalType(null)
    setSelectedUserForRole(null)
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header & Role Switch Filter Pills */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2d8a4e] dark:text-emerald-400" />
              Account &amp; Role Governance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage student records and assign Program Coordinator &amp; Org Moderator roles to faculty.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setUserRoleFilter('student')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                userRoleFilter === 'student'
                  ? 'bg-[#1b4332] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Student Directory
            </button>

            <button
              type="button"
              onClick={() => setUserRoleFilter('personnel')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                userRoleFilter === 'personnel'
                  ? 'bg-[#1b4332] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Faculty Directory
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder={userRoleFilter === 'student' ? 'Search by student name or ID...' : 'Search by faculty name or ID...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-[#2d8a4e]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* College Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCollegeDropdownOpen(!isCollegeDropdownOpen)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <span>College: {selectedCollege.toUpperCase()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {isCollegeDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-xl z-20 p-1">
                  {['all', 'CEAC', 'CBA', 'CAS', 'CED'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setSelectedCollege(c); setIsCollegeDropdownOpen(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-[#2d8a4e]"
                    >
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Order */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <span>Sort: {selectedSort}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 shadow-xl z-20 p-1">
                  {['name', 'id', 'points'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSelectedSort(s); setIsSortDropdownOpen(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-[#2d8a4e]"
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="p-4">User Details</th>
                <th className="p-4">College &amp; Program</th>
                <th className="p-4">Role Context</th>
                <th className="p-4">Points &amp; Proofs</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No accounts found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                usersList.map((user) => (
                  <tr key={user.id || user.student_id || user.employee_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#2d8a4e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{user.full_name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.student_id || user.employee_id || user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold">{user.college || 'CITE'}</p>
                      <p className="text-[11px] text-slate-500">{user.program || user.department || 'General'}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-100 dark:border-emerald-800/50">
                        {user.active_role_context || user.user_type || userRoleFilter}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#2d8a4e]">{user.total_points || 30} pts</p>
                      <p className="text-[11px] text-slate-500">{user.verified_count || 3} verified proofs</p>
                    </td>
                    <td className="p-4 text-right">
                      {userRoleFilter === 'personnel' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenRoleAssignment(user, 'coordinator')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 text-[11px] font-extrabold hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Assign Coordinator
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenRoleAssignment(user, 'moderator')}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold hover:bg-slate-200 transition cursor-pointer"
                          >
                            Assign Moderator
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">Student Account</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {roleModalType && (
        <PersonnelSelectorModal
          isOpen={!!roleModalType}
          onClose={() => setRoleModalType(null)}
          title={roleModalType === 'coordinator' ? 'Assign Program Coordinator' : 'Assign Organization Moderator'}
          personnelList={getPersonnelList()}
          onSelect={(personnel) => handleConfirmRoleAssignment(personnel, roleModalType, { program: assignedProgram, org: assignedOrg })}
        />
      )}

    </div>
  )
}
