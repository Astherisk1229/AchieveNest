import React from 'react'
import { Building2, Users, ShieldCheck, AlertCircle, Award, CheckCircle2 } from 'lucide-react'

export default function OSADOperationalSummary({ currentUser, metrics = {} }) {
  const userName = currentUser?.full_name || 'Director Marcus Vance, Ph.D.'
  const userRole = currentUser?.designation || 'Director of Student Affairs & Services'

  const {
    collegesCount = 3,
    programsCount = 4,
    activeStudentsCount = 3840,
    activeOrganizationsCount = 24,
    programsWithCoordinatorCount = 2,
    organizationsWithModeratorCount = 22,
    pendingAssignmentsCount = 2,
    setupCoveragePercent = 93
  } = metrics

  const assignedCount = (programsWithCoordinatorCount || 0) + (organizationsWithModeratorCount || 0)

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* Restrained Operational Header Banner */}
      <div className="bg-[#064e2b] dark:bg-[#0a2417] text-white p-5 sm:p-6 rounded-xl border border-slate-700/60 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                OSAD Portal
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold">
                AY 2025-2026 • Main Campus
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              OSAD Dashboard
            </h1>
            <p className="text-xs text-emerald-200/90 font-medium max-w-3xl leading-relaxed">
              {userName} • {userRole}. Central operational workspace for university academic structure, student account placement, organization moderation, and honor roll recognition.
            </p>
          </div>

          {/* Operational Setup Coverage Badge */}
          <div className="p-3 rounded-xl bg-[#033d23] border border-[#033d23] shrink-0 self-start md:self-auto space-y-1 text-right">
            <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">OSAD Setup Progress</p>
            <div className="flex items-center justify-end gap-2 text-sm font-black text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{setupCoveragePercent}% Configured</span>
            </div>
            <p className="text-[10px] text-emerald-300/80 font-mono">
              {assignedCount} assigned
            </p>
          </div>
        </div>
      </div>

      {/* Derived Operational KPI Strip (4 Bento Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Academic Structure */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Academic Structure</span>
            <Building2 className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {collegesCount} <span className="text-xs font-semibold text-slate-500">Colleges</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {programsCount} Academic Programs
          </p>
        </div>

        {/* KPI 2: Student Enrollment */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Students</span>
            <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {activeStudentsCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Enrolled in verified degree programs
          </p>
        </div>

        {/* KPI 3: Student Organizations */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Student Organizations</span>
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {activeOrganizationsCount} <span className="text-xs font-semibold text-slate-500">Active</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {organizationsWithModeratorCount} assigned moderators
          </p>
        </div>

        {/* KPI 4: Unassigned Roles */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131e2e] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Unassigned OSAD Roles</span>
            {pendingAssignmentsCount > 0 ? (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {pendingAssignmentsCount} <span className="text-xs font-semibold text-slate-500">Unassigned</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {pendingAssignmentsCount > 0 ? 'Requires coordinator / moderator assignment' : 'All required assignments complete'}
          </p>
        </div>

      </div>
    </div>
  )
}
