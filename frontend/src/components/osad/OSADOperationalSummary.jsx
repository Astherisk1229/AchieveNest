import React from 'react'
import { Building2, Users, Award, AlertTriangle, CheckCircle2 } from 'lucide-react'

import OSADPageHeader from './OSADPageHeader'

export default function OSADOperationalSummary({ metrics = {} }) {
  const {
    collegesCount = 3,
    programsCount = 4,
    activeStudentsCount = 3840,
    activeOrganizationsCount = 24,
    organizationsWithModeratorCount = 22,
    pendingAssignmentsCount = 2
  } = metrics

  const hasUnassigned = pendingAssignmentsCount > 0

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      {/* Standardized Operational Header */}
      <OSADPageHeader
        title="OSAD Dashboard"
        description="Manage academic structure, student accounts, organizations, and award reviews."
        eyebrow={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/40">
              OSAD Admin Portal
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              AY 2025–2026 • Main Campus
            </span>
          </div>
        }
      />

      {/* Simplified Operational KPI Strip */}
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
            {programsCount} Programs
          </p>
        </div>

        {/* KPI 2: Students */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Students</span>
            <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeStudentsCount.toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enrolled
          </p>
        </div>

        {/* KPI 3: Organizations */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#131E2E] border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Organizations</span>
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

        {/* KPI 4: Unassigned Roles */}
        <div className={`p-4 rounded-xl bg-white dark:bg-[#131E2E] border space-y-1 shadow-2xs ${
          hasUnassigned ? 'border-amber-300 dark:border-amber-800/80' : 'border-slate-200/80 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unassigned Roles</span>
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
            {hasUnassigned ? 'Action needed' : 'All active'}
          </p>
        </div>

      </div>
    </div>
  )
}
