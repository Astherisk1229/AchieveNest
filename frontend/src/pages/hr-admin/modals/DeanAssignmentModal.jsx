import React, { useState } from 'react'
import { X, Search, ShieldCheck, UserCheck, Building2, CheckCircle2, UserPlus } from 'lucide-react'
import { assignDeanRole } from '../../../services/hrAdminService'

const COLLEGES = [
  { id: 'col_ceac', code: 'CEAC', name: 'College of Engineering, Architecture, and Computing' },
  { id: 'col_cba', code: 'CBA', name: 'College of Business Administration' },
  { id: 'col_cas', code: 'CAS', name: 'College of Arts and Sciences' },
  { id: 'col_cte', code: 'CTE', name: 'College of Teacher Education' },
  { id: 'col_chs', code: 'CHS', name: 'College of Health Sciences' }
]

export default function DeanAssignmentModal({ isOpen, onClose, personnelList = [], onAssign, showToast }) {
  const [selectedCollege, setSelectedCollege] = useState(COLLEGES[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonnel, setSelectedPersonnel] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  if (!isOpen) return null

  // Dean must be Academic personnel affiliated with the selected College
  const eligiblePersonnel = personnelList.filter(p => {
    const isAcademic = p.personnel_classification === 'academic'
    const matchesCollege = !p.college_code || p.college_code === selectedCollege.code || (p.college && p.college.includes(selectedCollege.code))
    const query = searchQuery.toLowerCase().trim()
    const matchesQuery = !query ||
      (p.full_name || '').toLowerCase().includes(query) ||
      (p.institutional_id || p.employee_id || '').toLowerCase().includes(query)
    return isAcademic && matchesCollege && matchesQuery
  })

  const handleConfirmAssignment = async () => {
    if (!selectedPersonnel || !selectedCollege) return
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      if (typeof onAssign === 'function') {
        await onAssign(selectedPersonnel.id, selectedCollege.id || selectedCollege.code)
      } else {
        await assignDeanRole(selectedPersonnel.id, selectedCollege.id)
      }
      setSuccessMsg(`Successfully assigned ${selectedPersonnel.full_name} as Dean of ${selectedCollege.name}.`)
      if (showToast) showToast(`Assigned ${selectedPersonnel.full_name} as Dean of ${selectedCollege.code}.`)
      setTimeout(() => {
        setSuccessMsg(null)
        setSelectedPersonnel(null)
        onClose()
      }, 1500)
    } catch (err) {
      setErrorMsg(err?.error?.message || err?.message || 'Failed to assign Dean role.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-[#EFF7F0] dark:bg-emerald-950/60 border-b border-[#69A97C] dark:border-emerald-800 text-[#17663B] dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] dark:bg-emerald-900/60 border border-[#B7DDC4] dark:border-emerald-700 flex items-center justify-center text-[#17663B] dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Assign College Dean</h2>
              <p className="text-xs opacity-80 font-medium">Designate academic faculty leader for college evaluation &amp; ranking review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error / Success Notice */}
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-bold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Step 1: Select College */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate-700 dark:text-slate-300">
              1. Select Target College
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COLLEGES.map((col) => {
                const isSelected = selectedCollege.code === col.code
                return (
                  <button
                    key={col.code}
                    type="button"
                    onClick={() => {
                      setSelectedCollege(col)
                      setSelectedPersonnel(null)
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-extrabold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold">{col.code}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{col.name}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Select Academic Faculty Member */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Select Academic Faculty Member to Assign
              </label>
              <span className="text-[11px] text-slate-500">{eligiblePersonnel.length} eligible faculty</span>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search faculty by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {eligiblePersonnel.length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 font-medium">
                  No eligible academic personnel found for {selectedCollege.code}.
                </div>
              ) : (
                eligiblePersonnel.map((p) => {
                  const isPicked = selectedPersonnel?.id === p.id
                  const isDean = (p.assigned_roles || []).includes('dean')
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPersonnel(p)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isPicked
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.full_name ? p.full_name.charAt(0) : 'P'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.full_name}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {p.institutional_id || p.employee_id}
                            </span>
                            {isDean && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                Active Dean
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{p.designation || 'Academic Faculty'} • {p.college_name || selectedCollege.name}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isPicked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white dark:bg-slate-800'
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

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {selectedPersonnel ? (
              <span>Assigning: <strong className="text-slate-800 dark:text-white">{selectedPersonnel.full_name}</strong> to <strong className="text-emerald-700 dark:text-emerald-400">{selectedCollege.code}</strong></span>
            ) : (
              <span>Select an academic faculty member above</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedPersonnel || isSubmitting}
              onClick={handleConfirmAssignment}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Assigning...' : 'Assign Dean'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
