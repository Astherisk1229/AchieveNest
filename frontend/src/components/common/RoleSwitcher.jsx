import React, { useState } from 'react'
import { ChevronDown, UserCheck, Building2, ShieldCheck, Users, Check, Sparkles } from 'lucide-react'
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

  const allPersonnelRoles = [
    {
      id: 'personnel',
      title: 'Personnel / Faculty',
      subtitle: 'Primary Employee Portfolio & Achievements',
      badge: 'Faculty',
      icon: UserCheck,
      color: 'text-[#17663B] bg-[#EFF7F0] border-[#BBDCC3] dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60'
    },
    {
      id: 'program_coordinator',
      title: 'Program Coordinator',
      subtitle: 'Degree Program Verification & Curricula',
      badge: 'Coordinator',
      icon: ShieldCheck,
      color: 'text-[#17663B] bg-[#EFF7F0] border-[#BBDCC3] dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60'
    },
    {
      id: 'organization_moderator',
      title: 'Organization Moderator',
      subtitle: 'Org Events & Attendance Scanner',
      badge: 'Moderator',
      icon: Users,
      color: 'text-[#17663B] bg-[#EFF7F0] border-[#BBDCC3] dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60'
    },
    {
      id: 'department_secretary',
      title: 'Dean (Dep Sec)',
      subtitle: 'Faculty Endorsement & Review Panel',
      badge: 'Dean / DepSec',
      icon: Building2,
      color: 'text-[#17663B] bg-[#EFF7F0] border-[#BBDCC3] dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800/60'
    }
  ]

  const currentRoleContext = normalizeRoleContext(currentUser.active_role_context || 'personnel')
  const currentRoleObj = allPersonnelRoles.find(r => r.id === currentRoleContext) || allPersonnelRoles[0]
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EFF7F0] dark:bg-emerald-950/40 hover:bg-[#E3F2E5] dark:hover:bg-emerald-900/40 border border-[#BBDCC3] dark:border-emerald-800/50 text-[#17663B] dark:text-emerald-300 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-[0.98]"
        title="Demo: Switch Personnel Working Role Context"
      >
        <div className="p-1 rounded-lg bg-[#149653] text-white shadow-2xs">
          <CurrentIcon className="w-3.5 h-3.5" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[9px] text-[#245F42] dark:text-emerald-400/80 uppercase tracking-wider font-extrabold leading-none flex items-center gap-1">
            <span>Demo Context</span>
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
          </p>
          <p className="text-xs font-black text-[#17663B] dark:text-white truncate max-w-[130px]">{currentRoleObj.title}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#17663B] dark:text-emerald-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-72 rounded-3xl bg-white dark:bg-[#131e2e] text-[#123D2A] dark:text-slate-100 shadow-2xl border border-[#dde6dd] dark:border-slate-800 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-black tracking-wider text-[#17663B] dark:text-emerald-400">Switch Personnel Role</p>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">Demo</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Select active working context to preview views</p>
            </div>

            <div className="space-y-1">
              {allPersonnelRoles.map((role) => {
                const RoleIcon = role.icon
                const isSelected = currentRoleContext === role.id
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role.id)}
                    className={`w-full p-2.5 rounded-2xl text-left transition flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-[#EFF7F0] dark:bg-emerald-950/60 border border-[#BBDCC3] dark:border-emerald-800/60'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl border shrink-0 ${role.color}`}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-black truncate ${isSelected ? 'text-[#17663B] dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                            {role.title}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{role.subtitle}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#149653] text-white flex items-center justify-center shrink-0 shadow-2xs">
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
