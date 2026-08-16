import React, { useState } from 'react'
import { Building2, Plus, UserCheck, Edit3, GraduationCap, ArrowLeft, ShieldCheck, X } from 'lucide-react'

export default function OSADDepartmentsProgramsPage({ departments, setIsAddDeptOpen, setPersonnelSelectorTarget }) {
  const [selectedCollege, setSelectedCollege] = useState(null)
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [newProgramCode, setNewProgramCode] = useState('')
  const [newProgramTitle, setNewProgramTitle] = useState('')

  const handleAddProgramSubmit = (e) => {
    e.preventDefault()
    if (!newProgramTitle.trim() || !selectedCollege) return

    const codeStr = newProgramCode.trim() ? `${newProgramCode.trim().toUpperCase()} — ` : ''
    const fullProgStr = `${codeStr}${newProgramTitle.trim()}`

    if (!selectedCollege.programs.includes(fullProgStr)) {
      selectedCollege.programs.push(fullProgStr)
    }
    setNewProgramCode('')
    setNewProgramTitle('')
    setIsAddProgramOpen(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      
      {/* Dynamic Header Banner (Only shown in main Colleges grid view) */}
      {!selectedCollege && (
        <div className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Colleges &amp; Programs
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Manage university colleges, degree programs, and assigned faculty Deans
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddDeptOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] active:scale-[0.99] text-white font-extrabold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create College Department</span>
          </button>
        </div>
      )}

      {/* ================= VIEW MODE 1: DRILL-DOWN SINGLE COLLEGE PROGRAM INSPECTOR ================= */}
      {selectedCollege ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Single Unified College Header Banner */}
          <div className="p-6 bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCollege(null)}
                    className="text-xs font-bold text-[#2d8a4e] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Colleges &amp; Programs</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-700 text-xs">/</span>
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{selectedCollege.code}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedCollege.name}</h2>
                <p className="text-xs text-slate-500 font-medium">{selectedCollege.student_count} Total Enrolled Students across {selectedCollege.programs.length} degree programs</p>
              </div>
            </div>

            {/* College Dean Leadership Ribbon */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-[#2d8a4e] border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#2d8a4e] dark:text-emerald-400 uppercase tracking-wider block">COLLEGE DEAN LEADERSHIP</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">{selectedCollege.dean_name || 'Unassigned'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPersonnelSelectorTarget({
                    title: 'Select College Dean',
                    targetName: selectedCollege.code,
                    roleType: 'dean'
                  })
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-[#2d8a4e] dark:text-emerald-300 hover:bg-emerald-100 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800 cursor-pointer transition shadow-2xs"
              >
                Reassign Dean ✏️
              </button>
            </div>
          </div>

          {/* Program Roster Directory Card */}
          <div className="bg-white dark:bg-[#131e2e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#2d8a4e]" />
                  <span>Enrolled Degree Programs ({selectedCollege.programs.length})</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Faculty Program Coordinators verify student achievement submissions</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddProgramOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Add Program</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {selectedCollege.programs.map((prog) => (
                <div key={prog} className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#2d8a4e] shrink-0" />
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{prog}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Degree Program • {selectedCollege.code} Academic Unit</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Program Coordinator</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {selectedCollege.dean_name || 'Dr. Maria Santos'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPersonnelSelectorTarget({
                          title: 'Select Program Coordinator',
                          targetName: prog,
                          roleType: 'coordinator'
                        })
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 text-[#2d8a4e] dark:text-emerald-400 font-extrabold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Assign Coordinator</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        
        /* ================= VIEW MODE 2: INTERACTIVE COLLEGE DIRECTORY CARDS GRID ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div 
              key={dept.id}
              onClick={() => setSelectedCollege(dept)}
              className="bg-white dark:bg-[#131e2e] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5 flex flex-col justify-between hover:border-[#2d8a4e] dark:hover:border-emerald-600 transition-all duration-200 cursor-pointer group hover:shadow-md"
            >
              <div className="space-y-4">
                
                {/* College Header */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#2d8a4e] dark:text-emerald-400 tracking-wider uppercase group-hover:underline">
                      {dept.code}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      {dept.student_count} Enrolled
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug group-hover:text-[#2d8a4e] dark:group-hover:text-emerald-400 transition">
                    {dept.name}
                  </h3>
                </div>

                {/* Program List */}
                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#2d8a4e] dark:text-emerald-400" />
                    <span>Degree Programs ({dept.programs.length})</span>
                  </p>

                  <ul className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 pt-1">
                    {dept.programs.map((prog) => (
                      <li key={prog} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2d8a4e] dark:bg-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{prog}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 shrink-0 ml-2">Program</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* College Card Footer Action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-400 uppercase block">Dean</span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate block">
                        {dept.dean_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPersonnelSelectorTarget({
                        title: 'Select College Dean',
                        targetName: dept.code,
                        roleType: 'dean'
                      })
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-[#2d8a4e] dark:text-emerald-400 font-extrabold text-[11px] border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Reassign</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ================= ADD DEGREE PROGRAM MODAL ================= */}
      {isAddProgramOpen && selectedCollege && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#2d8a4e]" />
                <span>Add Degree Program ({selectedCollege.code})</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAddProgramOpen(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProgramSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Program Code / Acronym (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BSDS or BSCS"
                  value={newProgramCode}
                  onChange={(e) => setNewProgramCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#2d8a4e] outline-none transition uppercase tracking-wider font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Degree Program Full Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. BS Data Science"
                  value={newProgramTitle}
                  onChange={(e) => setNewProgramTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#2d8a4e] outline-none transition"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Enrolls a new degree program under {selectedCollege.name}.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProgramOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2d8a4e] hover:bg-[#236e3e] shadow-xs cursor-pointer"
                >
                  Add Degree Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
