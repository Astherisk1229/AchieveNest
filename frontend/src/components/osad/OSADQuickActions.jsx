import React from 'react'
import { Building2, Users, ShieldCheck, Trophy, ChevronRight, Award, FileSpreadsheet, ShieldAlert, Sparkles, UserCheck } from 'lucide-react'

export default function OSADQuickActions({ onSelectTab }) {
  const primaryActions = [
    {
      tab: 'academic-programs',
      title: 'Academic Programs',
      description: 'View Colleges and manage their Academic Programs',
      icon: Building2,
      badge: 'College & Programs',
      badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
    },
    {
      tab: 'accounts',
      title: 'Student Accounts',
      description: 'Add student accounts and assign to Degree Programs',
      icon: Users,
      badge: 'Student Accounts',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
    },
    {
      tab: 'organizations',
      title: 'Student Organizations',
      description: 'Create student organizations and assign Organization Moderators',
      icon: Users,
      badge: 'Student Organizations',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
    },
    {
      tab: 'academic-programs',
      title: 'Program Coordinators',
      description: 'Assign eligible personnel as Program Coordinator for each Academic Program',
      icon: UserCheck,
      badge: 'Program Assignments',
      badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
    }
  ]

  const secondaryActions = [
    { tab: 'awards', title: 'Award Categories', icon: Award, desc: 'Honor roll categories' },
    { tab: 'candidate-review', title: 'Potential Candidates', icon: Trophy, desc: 'Review portfolio-based eligibility' },
    { tab: 'reports', title: 'Accreditation Reports', icon: FileSpreadsheet, desc: 'Print or export official PDF reports' },
    { tab: 'audit', title: 'OSAD Activity Log', icon: ShieldAlert, desc: 'Review administrative activity logs' }
  ]

  return (
    <div className="space-y-4 font-sans">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
          <span>Setup and Management</span>
        </h2>
        <span className="text-[10px] font-bold text-slate-400">4 setup areas</span>
      </div>

      {/* Primary Actions Bento Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryActions.map((action, idx) => {
          const Icon = action.icon
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectTab(action.tab)}
              className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 hover:border-[#064e2b] dark:hover:border-emerald-500 transition duration-150 text-left flex flex-col justify-between space-y-3 group cursor-pointer shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${action.badgeClass}`}>
                  {action.badge}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#064e2b] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#064e2b] dark:group-hover:text-emerald-400 transition flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-[#16834a] dark:text-emerald-400 shrink-0" />
                  <span>{action.title}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {action.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Secondary Actions Row */}
      <div className="pt-2">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Secondary Workflows:</span>
          <div className="flex flex-wrap items-center gap-2">
            {secondaryActions.map((sec, idx) => {
              const Icon = sec.icon
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectTab(sec.tab)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#131e2e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>{sec.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
