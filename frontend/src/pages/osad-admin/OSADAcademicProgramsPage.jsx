import React from 'react'
import { Building2, GraduationCap, Lock, Plus, ShieldCheck, UserCheck } from 'lucide-react'
import { getActionAvailability } from './OSADAcademicHeaderActions'

export default function OSADAcademicProgramsPage({
  colleges = [],
  academicPrograms = [],
  setIsAddCollegeOpen,
  setIsAddProgramOpen,
  setPersonnelSelectorTarget
}) {
  const { canCreateAcademicProgram, academicProgramTooltip } = getActionAvailability({
    collegeCount: colleges.length
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Compact Page Header */}
      <div className="bg-white dark:bg-[#131E2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#16834a] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Academic Structure</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Academic Programs belong directly to Colleges. OSAD assigns each Program Coordinator at Academic Program scope.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2" aria-label="Academic structure creation actions">
          <button
            type="button"
            onClick={() => setIsAddCollegeOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#1B4D3E] hover:bg-[#143B30] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create College</span>
          </button>
          <button
            type="button"
            disabled={!canCreateAcademicProgram}
            title={academicProgramTooltip || undefined}
            onClick={() => canCreateAcademicProgram && setIsAddProgramOpen(true)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
              canCreateAcademicProgram
                ? 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 cursor-pointer shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Academic Program</span>
          </button>
        </div>
      </div>

      {/* College & Academic Program Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {colleges.map((college) => {
          const programs = academicPrograms.filter((program) => program.collegeId === college.id || program.college_id === college.id)
          return (
            <section key={college.id} className="bg-white dark:bg-[#131E2E] rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs">
              {/* College Header */}
              <header className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                    {college.code}
                  </span>
                  <h2 className="font-bold text-base text-slate-900 dark:text-white mt-1">{college.name}</h2>
                  <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Dean designated by HR (read-only in OSAD)
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-800 shrink-0">
                  {programs.length} {programs.length === 1 ? 'Program' : 'Programs'}
                </span>
              </header>

              {/* Programs List / Table Format */}
              <div className="space-y-2">
                {programs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center italic">No Academic Programs configured yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-lg border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                    {programs.map((program) => {
                      const coordName = program.coordinatorName || program.coordinator_name
                      const isAssigned = Boolean(coordName && coordName !== 'Unassigned')

                      return (
                        <div
                          key={program.id}
                          className="p-3 bg-white dark:bg-[#131E2E] hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{program.code}</span>
                              <span className="text-xs text-slate-600 dark:text-slate-300 truncate font-normal">{program.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-400">Coordinator:</span>
                              {isAssigned ? (
                                <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  {coordName}
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPersonnelSelectorTarget({
                              title: 'Assign Program Coordinator',
                              targetId: program.id,
                              targetName: program.name,
                              roleType: 'coordinator'
                            })}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1B4D3E] dark:text-emerald-400 font-semibold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 shrink-0 shadow-2xs transition cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{isAssigned ? 'Reassign' : 'Assign'}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
