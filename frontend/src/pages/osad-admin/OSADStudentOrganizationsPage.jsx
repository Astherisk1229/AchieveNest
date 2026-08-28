import React, { useState } from 'react'
import { Users, Plus, ShieldCheck, Globe } from 'lucide-react'

export default function OSADStudentOrganizationsPage({ 
  organizations = [], 
  setIsAddOrgOpen, 
  setPersonnelSelectorTarget 
}) {
  const [scopeFilter, setScopeFilter] = useState('all')

  const filteredOrgs = organizations.filter(o => {
    if (scopeFilter === 'all') return true
    return o.scopeType === scopeFilter || o.category === scopeFilter
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#064e2b] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Student Organizations
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-[#16834a] dark:text-emerald-400 text-[10px] font-black uppercase">
                Scope & Hierarchy Validated
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Manage Student Organizations and assign Organization Moderators by Academic Scope.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsAddOrgOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white font-extrabold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Student Organization</span>
          </button>
        </div>
      </div>

      {/* Scope Filter Bar */}
      <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2 shadow-2xs">
        <span className="text-xs font-black text-slate-500 mr-2">Filter Scope:</span>
          {['all', 'university', 'college'].map((scope) => (
          <button
            key={scope}
            type="button"
            onClick={() => setScopeFilter(scope)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer capitalize ${
              scopeFilter === scope
                ? 'bg-[#16834a] text-white shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {scope.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Student Organization Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrgs.length === 0 ? (
          <div className="col-span-full p-8 bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-xs font-semibold">
            No Student Organizations match the selected scope filter.
          </div>
        ) : (
          filteredOrgs.map(org => {
            const scopeLabel = (org.scopeType || 'university').replace('_', ' ')
            const moderatorName = org.coordinator_name || org.moderatorName || 'Unassigned'

            return (
              <div
                key={org.id}
                className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-extrabold uppercase flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {scopeLabel} Scope
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{org.member_count || 0} Members</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{org.name}</h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Code: {org.code || org.id}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Organization Moderator</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{moderatorName}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof setPersonnelSelectorTarget === 'function') {
                          setPersonnelSelectorTarget({
                            title: 'Assign Organization Moderator',
                            targetName: org.name,
                            roleType: 'moderator'
                          })
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 text-[#064e2b] dark:text-[#245F42] font-extrabold text-[11px] border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <ShieldCheck className="w-3 h-3 text-[#16834a]" />
                      <span>Assign</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
