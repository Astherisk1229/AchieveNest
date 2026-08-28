import React from 'react'
import { Building2, GraduationCap, Lock, Plus, ShieldCheck } from 'lucide-react'
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
      <div className="bg-white dark:bg-[#1D2A23] rounded-2xl p-5 sm:p-6 border border-[#DCE6DF] dark:border-[#374B3F] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E7F5EA] text-[#16834A] flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#102A43] dark:text-[#E6EFE9]">Academic Structure</h1>
            <p className="text-xs text-[#4F6475] dark:text-[#B1C0B6] mt-0.5">
              Academic Programs belong directly to Colleges. OSAD assigns each Program Coordinator at Academic Program scope.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5" aria-label="Academic structure creation actions">
          <button type="button" onClick={() => setIsAddCollegeOpen(true)} className="create-action-button create-action-button-primary text-xs">
            <Plus className="w-4 h-4" /> Create College
          </button>
          <button
            type="button"
            disabled={!canCreateAcademicProgram}
            title={academicProgramTooltip || undefined}
            onClick={() => canCreateAcademicProgram && setIsAddProgramOpen(true)}
            className={`create-action-button text-xs ${canCreateAcademicProgram ? 'create-action-button-secondary' : 'bg-[#E6ECE8] text-[#87958C] cursor-not-allowed'}`}
          >
            <Plus className="w-4 h-4" /> Create Academic Program
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {colleges.map((college) => {
          const programs = academicPrograms.filter((program) => program.collegeId === college.id || program.college_id === college.id)
          return (
            <section key={college.id} className="bg-white dark:bg-[#131e2e] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
              <header className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-black text-[#16834a] uppercase">{college.code} College</span>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">{college.name}</h2>
                <p className="mt-2 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> College Dean is designated by HR and is read-only here.
                </p>
              </header>
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Academic Programs ({programs.length})
                </p>
                {programs.length === 0 && <p className="text-xs text-slate-500">No Academic Programs configured.</p>}
                {programs.map((program) => (
                  <div key={program.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-[#16834a] uppercase">{program.code}</span>
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{program.name}</h3>
                      <span className="text-[10px] text-slate-500">Coordinator: {program.coordinatorName || program.coordinator_name || 'Unassigned'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPersonnelSelectorTarget({
                        title: 'Assign Program Coordinator',
                        targetId: program.id,
                        targetName: program.name,
                        roleType: 'coordinator'
                      })}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[#064e2b] font-extrabold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 shrink-0"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Assign
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
