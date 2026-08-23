import React, { useState } from 'react'
import { ChevronDown, UserCheck, Building2, BookOpen, Users, Check } from 'lucide-react'
import { getCurrentUser } from '../../services/authService'
import { normalizeAccountType, normalizeRoleContext } from '../../utils/roleContext'

export default function RoleSwitcher({ currentUser: propUser, onSwitchRole }) {
  const [isOpen, setIsOpen] = useState(false)
  const currentUser = propUser || getCurrentUser()

  const accountType = normalizeAccountType(currentUser?.account_type || currentUser?.user_type)
  const isPersonnel = accountType === 'personnel'

  if (!currentUser || !isPersonnel) {
    return null
  }

  const assignedRoles = (Array.isArray(currentUser.assigned_roles || currentUser.roles) ? (currentUser.assigned_roles || currentUser.roles) : [])
    .map(r => (typeof r === 'object' ? r.role_key : r))
    .map(r => normalizeRoleContext(r))

  const allPersonnelRoles = [
    {
      id: 'personnel',
      title: 'Personnel Account',
      subtitle: 'Primary Employee Portfolio & Achievements',
      icon: UserCheck,
      color: 'text-[#064e2b] bg-[#eef7f0] border-[#d2e8d7]'
    },
    {
      id: 'department_secretary',
      title: 'Department Secretary',
      subtitle: 'Faculty Endorsement & Review Panel',
      icon: Building2,
      color: 'text-[#064e2b] bg-[#eef7f0] border-[#d2e8d7]'
    },
    {
      id: 'program_coordinator',
      title: 'Program Coordinator',
      subtitle: 'Degree Program Verification',
      icon: BookOpen,
      color: 'text-[#064e2b] bg-[#eef7f0] border-[#d2e8d7]'
    },
    {
      id: 'organization_moderator',
      title: 'Organization Moderator',
      subtitle: 'Org Events & Scanner Management',
      icon: Users,
      color: 'text-[#064e2b] bg-[#eef7f0] border-[#d2e8d7]'
    }
  ]

  // Filter available roles strictly by normalized assigned_roles
  const availableRoles = allPersonnelRoles.filter(role => assignedRoles.includes(role.id))

  if (availableRoles.length <= 1) {
    return null
  }

  const currentRoleContext = normalizeRoleContext(currentUser.active_role_context || 'personnel')
  const currentRoleObj = availableRoles.find(r => r.id === currentRoleContext) || availableRoles[0]
  const CurrentIcon = currentRoleObj.icon

  const handleSelectRole = (roleId) => {
    onSwitchRole(roleId)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition backdrop-blur-md shadow-sm"
      >
        <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300">
          <CurrentIcon className="w-3.5 h-3.5" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] text-emerald-200/70 uppercase tracking-wider font-bold leading-none">Working Context</p>
          <p className="text-xs font-bold text-white truncate max-w-[140px]">{currentRoleObj.title}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Switch Personnel Working Role</p>
              <p className="text-xs text-slate-600 font-medium">Select active context without logging out</p>
            </div>

            <div className="space-y-1">
              {availableRoles.map((role) => {
                const RoleIcon = role.icon
                const isSelected = currentRoleContext === role.id
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between group ${
                      isSelected ? 'bg-[#eef7f0] border border-[#cbe6d2]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg border ${role.color}`}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-[#064e2b]' : 'text-slate-800'}`}>
                          {role.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{role.subtitle}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#16834a] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
