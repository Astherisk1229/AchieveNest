import React from 'react'
import { Users, Plus } from 'lucide-react'

export default function OSADStudentOrganizationsPage({ 
  organizations, 
  clubs, 
  setIsAddOrgOpen, 
  setIsAddClubOpen, 
  setPersonnelSelectorTarget 
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Student Organizations &amp; Clubs
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Create Recognized Student Organizations &amp; Assign Faculty Program Coordinators / Moderators
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddClubOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-bold text-xs transition flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create Student Club</span>
          </button>

          <button
            onClick={() => setIsAddOrgOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white font-bold text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </button>
        </div>
      </div>

      {/* Student Organization Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {organizations.map(org => (
          <div key={org.id} className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between hover:shadow-lg transition duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-extrabold">
                  {org.category}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{org.member_count} Active Members</span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">{org.name}</h3>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Assigned Moderator:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{org.moderator_name || 'Unassigned'}</span>
              </div>

              <button
                onClick={() => {
                  setPersonnelSelectorTarget({
                    title: 'Select Organization Moderator',
                    targetName: org.name,
                    roleType: 'moderator'
                  })
                }}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-[#2d8a4e] dark:hover:text-emerald-300 text-xs font-extrabold transition cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                + Reassign Org Moderator
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
