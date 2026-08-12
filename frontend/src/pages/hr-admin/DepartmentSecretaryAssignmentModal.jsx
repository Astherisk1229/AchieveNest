import React, { useState } from 'react'
import { X, Search, ShieldCheck, UserCheck, Building2, CheckCircle2, UserPlus } from 'lucide-react'
import HRModel from '../../models/HRModel'

export default function DepartmentSecretaryAssignmentModal({ isOpen, onClose, personnelList = [], onAssign }) {
  const departments = HRModel.ACADEMIC_DEPARTMENTS || []
  const [selectedDept, setSelectedDept] = useState(departments[0] || { code: 'CS', name: 'Department of Computer Studies', college: 'CEAC' })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonnel, setSelectedPersonnel] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  if (!isOpen) return null

  const filteredPersonnel = personnelList.filter(p => {
    const query = searchQuery.toLowerCase()
    return (
      p.full_name.toLowerCase().includes(query) ||
      p.employee_id.toLowerCase().includes(query) ||
      p.department.toLowerCase().includes(query)
    )
  })

  const handleConfirmAssignment = () => {
    if (!selectedPersonnel || !selectedDept) return
    onAssign(selectedPersonnel.id, selectedDept.name)
    setSuccessMsg(`Successfully assigned ${selectedPersonnel.full_name} as Department Secretary for ${selectedDept.name}.`)
    setTimeout(() => {
      setSuccessMsg(null)
      setSelectedPersonnel(null)
      onClose()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-[#1b4332] text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Assign Department Secretary</h2>
              <p className="text-xs text-emerald-200/90 font-medium">Designate faculty or personnel members for department verification oversight</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Toast */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Step 1: Select Academic Department */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              1. Select Target Academic Department
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {departments.map((dept) => {
                const isSelected = selectedDept.code === dept.code
                return (
                  <button
                    key={dept.code}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#eaf4ed] border-[#2d8a4e] text-[#1b4332] shadow-2xs font-extrabold'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-[#2d8a4e] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{dept.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{dept.college}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Search & Select Personnel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Select Personnel to Assign
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Showing {filteredPersonnel.length} personnel</span>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search personnel by name, employee ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#2d8a4e] focus:ring-1 focus:ring-[#2d8a4e]"
              />
            </div>

            {/* Personnel List Selection */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {filteredPersonnel.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  No personnel matching "{searchQuery}" found.
                </div>
              ) : (
                filteredPersonnel.map((p) => {
                  const isPicked = selectedPersonnel?.id === p.id
                  const isDeptSec = (p.assigned_roles || []).includes('department_secretary')
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPersonnel(p)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isPicked
                          ? 'bg-[#eaf4ed] border-[#2d8a4e] shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.avatar_url}
                          alt={p.full_name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">{p.full_name}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                              {p.employee_id}
                            </span>
                            {isDeptSec && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Active DepSec
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{p.academic_rank} • {p.department}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                          isPicked ? 'bg-[#2d8a4e] border-[#2d8a4e] text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isPicked && <UserCheck className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {selectedPersonnel ? (
              <span>Selected: <strong className="text-slate-800">{selectedPersonnel.full_name}</strong> for <strong className="text-[#1b4332]">{selectedDept.name}</strong></span>
            ) : (
              <span>Please select a personnel member above.</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedPersonnel}
              onClick={handleConfirmAssignment}
              className="px-5 py-2.5 rounded-xl bg-[#2d8a4e] hover:bg-[#236e3e] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Role</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
