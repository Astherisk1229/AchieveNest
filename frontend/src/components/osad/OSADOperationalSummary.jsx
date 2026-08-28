import React from 'react'
import { Building2, Users, Award, AlertTriangle, CheckCircle2 } from 'lucide-react'

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

  const totalGovernanceSlots = (programsCount || 0) + (activeOrganizationsCount || 0)
  const assignedCount = (programsWithCoordinatorCount || 0) + (organizationsWithModeratorCount || 0)
  const hasUnassigned = pendingAssignmentsCount > 0

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* Restrained & Compact Operational Header */}
      <div className="bg-white dark:bg-[#131E2E] p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/40">
                OSAD Admin Portal
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                AY 2025–2026 • Main Campus
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              OSAD Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              {userName} • {userRole}
            </p>
          </div>

          {/* Compact Setup Progress Indicator */}
          <div className="flex items-center gap-3 self-start sm:self-auto px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-[#16834a] dark:text-emerald-400 shrink-0" />
            <div className="text-right sm:text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Setup Coverage</span>
                <span className="text-xs font-bold text-[#16834a] dark:text-emerald-400">{setupCoveragePercent}%</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {assignedCount} of {totalGovernanceSlots} assigned
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Derived Operational KPI Strip (Clean, High-Scannability Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Academic Structure */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Academic Structure</span>
            <Building2 className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{collegesCount}</span>
            <span className="text-xs font-medium text-slate-500">Colleges</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {programsCount} Academic Programs
          </p>
        </div>

        {/* KPI 2: Student Enrollment */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Active Students</span>
            <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeStudentsCount.toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enrolled across all programs
          </p>
        </div>

        {/* KPI 3: Student Organizations */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Student Organizations</span>
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeOrganizationsCount}</span>
            <span className="text-xs font-medium text-slate-500">Active</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {organizationsWithModeratorCount} assigned moderators
          </p>
        </div>

        {/* KPI 4: Actionable Governance Slots */}
        <div className={`p-4 rounded-xl bg-white dark:bg-[#131E2E] border space-y-1 shadow-2xs ${
          hasUnassigned ? 'border-amber-300 dark:border-amber-800/80' : 'border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unassigned OSAD Roles</span>
            {hasUnassigned ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${hasUnassigned ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {pendingAssignmentsCount}
            </span>
            <span className="text-xs font-medium text-slate-500">Positions</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {hasUnassigned ? 'Action required in Academic/Orgs' : 'All positions active'}
          </p>
        </div>

      </div>
    </div>
  )
}
