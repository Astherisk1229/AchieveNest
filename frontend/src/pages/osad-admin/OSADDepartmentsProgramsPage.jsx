import React, { useState } from 'react'
import { Building2, Plus, GraduationCap, ShieldCheck, Lock, ArrowLeft, ChevronRight } from 'lucide-react'
import { getRecommendedCreationAction, getActionAvailability } from './OSADAcademicHeaderActions'

export default function OSADDepartmentsProgramsPage({
  colleges = [],
  departments = [],
  degreePrograms = [],
  setIsAddCollegeOpen,
  setIsAddDeptOpen,
  setIsAddProgramOpen,
  setPersonnelSelectorTarget
}) {
  const [selectedDepartmentDetail, setSelectedDepartmentDetail] = useState(null)

  const activeCollegeCount = (colleges || []).length
  const activeDepartmentCount = (departments || []).length
  const activeDegreeProgramCount = (degreePrograms || []).length

  const recommendedAction = getRecommendedCreationAction({
    collegeCount: activeCollegeCount,
    departmentCount: activeDepartmentCount,
    degreeProgramCount: activeDegreeProgramCount
  })

  const {
    canCreateDepartment,
    canCreateDegreeProgram,
    departmentTooltip,
    degreeProgramTooltip
  } = getActionAvailability({
    collegeCount: activeCollegeCount,
    departmentCount: activeDepartmentCount
  })

  // If a department card is clicked and selected, render the detailed drill-down view
  if (selectedDepartmentDetail) {
    const dept = selectedDepartmentDetail
    const coordinatorName = dept.coordinator_name || dept.assigned_coordinator_name || 'Unassigned'

    return (
      <div className="space-y-6 animate-in fade-in duration-200 font-sans">
        
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedDepartmentDetail(null)}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#131e2e] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-extrabold text-xs border border-slate-200/80 dark:border-slate-800 transition cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
            <span>Back to Academic Structure</span>
          </button>

          <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
            <span>Academic Structure</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#1b4332] dark:text-emerald-400 font-black">{dept.code}</span>
          </div>
        </div>

        {/* Department Header Banner */}
        <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#1b4332] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black">
                  {dept.code} DEPARTMENT
                </span>
                <span className="text-[10px] font-bold text-slate-400">{dept.student_count || 320} Total Enrolled Students</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {dept.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canCreateDegreeProgram}
                onClick={() => {
                  if (canCreateDegreeProgram) setIsAddProgramOpen(true)
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs ${
                  !canCreateDegreeProgram
                    ? 'bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200/70 dark:border-slate-800 cursor-not-allowed opacity-70'
                    : 'bg-[#1b4332] hover:bg-[#143326] text-white border border-transparent cursor-pointer'
                }`}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Create Degree Program</span>
              </button>
            </div>
          </div>

          {/* College Dean Leadership Row (Read-Only HR Designation) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  College Dean (Designated by HR • Read-only)
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {dept.dean_name || 'Not yet designated by HR'}
                </span>
              </div>
            </div>

            <div className="text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              Managed by HR
            </div>
          </div>
        </div>

        {/* Degree Programs Detail List */}
        <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
              <span>Degree Programs ({(dept.programs || []).length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Program Coordinators verify student achievement submissions</span>
          </div>

          <div className="space-y-3">
            {(dept.programs || []).map((prog) => (
              <div
                key={prog}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332] shrink-0" />
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{prog}</h4>
                    <span className="text-[10px] text-slate-400 font-bold">Degree Program under {dept.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold text-[#2d8a4e] dark:text-emerald-400 uppercase block">Program Coordinator</span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{coordinatorName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPersonnelSelectorTarget({
                        title: 'Assign Program Coordinator',
                        targetName: dept.name,
                        roleType: 'coordinator'
                      })
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 text-[#1b4332] dark:text-emerald-300 font-extrabold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Assign Program Coordinator</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#1b4332] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Structure
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Select a Department to view its Degree Programs and assigned Program Coordinator.
            </p>
          </div>
        </div>

        {/* Action Buttons for Academic Hierarchy Creation */}
        <div 
          className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto self-start md:self-auto"
          aria-label="Academic structure creation actions"
        >
          {/* Create College Button */}
          <button
            type="button"
            onClick={() => setIsAddCollegeOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs ${
              recommendedAction === 'college'
                ? 'bg-[#1b4332] hover:bg-[#143326] text-white border border-transparent'
                : 'bg-[#f4f8f4] dark:bg-emerald-950/40 text-[#1b4332] dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 hover:bg-[#1b4332] hover:text-white hover:border-[#1b4332] dark:hover:bg-emerald-600 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
            <span>Create College</span>
          </button>

          {/* Create Department Button */}
          <div className="relative group" title={departmentTooltip || undefined}>
            <button
              type="button"
              disabled={!canCreateDepartment}
              aria-describedby={!canCreateDepartment ? 'dept-create-prereq-desc' : undefined}
              onClick={() => {
                if (canCreateDepartment) setIsAddDeptOpen(true)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs ${
                !canCreateDepartment
                  ? 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                  : recommendedAction === 'department'
                    ? 'bg-[#1b4332] hover:bg-[#143326] text-white border border-transparent cursor-pointer'
                    : 'bg-[#f4f8f4] dark:bg-emerald-950/40 text-[#1b4332] dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 hover:bg-[#1b4332] hover:text-white hover:border-[#1b4332] dark:hover:bg-emerald-600 dark:hover:text-white cursor-pointer'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Create Department</span>
            </button>
            {!canCreateDepartment && (
              <span 
                id="dept-create-prereq-desc"
                className="hidden group-hover:block absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap z-20"
              >
                Create a College first.
              </span>
            )}
          </div>

          {/* Create Degree Program Button */}
          <div className="relative group" title={degreeProgramTooltip || undefined}>
            <button
              type="button"
              disabled={!canCreateDegreeProgram}
              aria-describedby={!canCreateDegreeProgram ? 'prog-create-prereq-desc' : undefined}
              onClick={() => {
                if (canCreateDegreeProgram) setIsAddProgramOpen(true)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-2xs ${
                !canCreateDegreeProgram
                  ? 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60'
                  : recommendedAction === 'degree_program'
                    ? 'bg-[#1b4332] hover:bg-[#143326] text-white border border-transparent cursor-pointer'
                    : 'bg-[#f4f8f4] dark:bg-emerald-950/40 text-[#1b4332] dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 hover:bg-[#1b4332] hover:text-white hover:border-[#1b4332] dark:hover:bg-emerald-600 dark:hover:text-white cursor-pointer'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Create Degree Program</span>
            </button>
            {!canCreateDegreeProgram && (
              <span 
                id="prog-create-prereq-desc"
                className="hidden group-hover:block absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap z-20"
              >
                Create a Department first.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Academic Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const coordinatorName = dept.coordinator_name || dept.assigned_coordinator_name || 'Unassigned'

          return (
            <div 
              key={dept.id}
              onClick={() => setSelectedDepartmentDetail(dept)}
              className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#1b4332] dark:hover:border-emerald-600 cursor-pointer transition duration-150 group"
            >
              <div className="space-y-3">
                
                {/* Department Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#2d8a4e] dark:text-emerald-400 tracking-wider uppercase group-hover:underline">
                      {dept.code} DEPARTMENT
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {dept.student_count || 0} Enrolled
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-[#1b4332] dark:group-hover:text-emerald-400 transition">
                    {dept.name}
                  </h3>
                </div>

                {/* Degree Programs List */}
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#2d8a4e] dark:text-emerald-400" />
                    <span>Degree Programs ({(dept.programs || []).length})</span>
                  </p>

                  <ul className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 pt-0.5">
                    {(dept.programs || []).map((prog) => (
                      <li key={prog} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2d8a4e] shrink-0" />
                          <span className="text-slate-800 dark:text-slate-200 truncate">{prog}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">Program</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Department Governance Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2" onClick={(e) => e.stopPropagation()}>
                
                {/* College Dean (Read-Only HR Assignment) */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>College Dean:</span>
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {dept.dean_name || 'Not yet designated by HR'}
                  </span>
                </div>

                {/* Program Coordinator (OSAD Assignment) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-[#2d8a4e] dark:text-emerald-400 uppercase block">
                      Program Coordinator
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate block">
                      {coordinatorName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPersonnelSelectorTarget({
                        title: 'Assign Program Coordinator',
                        targetName: dept.name,
                        roleType: 'coordinator'
                      })
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 text-[#1b4332] dark:text-emerald-400 font-extrabold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Assign</span>
                  </button>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
