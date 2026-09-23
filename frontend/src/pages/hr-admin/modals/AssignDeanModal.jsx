import React, { useState, useEffect } from 'react'
import { X, Search, ShieldCheck, UserCheck, UserPlus, Calendar, AlertTriangle } from 'lucide-react'
import { assignDeanRole } from '../../../services/hrAdminService'
import { isAcademicPersonnel } from '../../../utils/personnelPlacement'

export default function AssignDeanModal({ isOpen, onClose, targetCollege = null, personnelList = [], onAssigned }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonnel, setSelectedPersonnel] = useState(null)
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])
  const [isConfirmStep, setIsConfirmStep] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedPersonnel(null)
      setEffectiveDate(new Date().toISOString().split('T')[0])
      setIsConfirmStep(false)
      setErrorMsg('')
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !targetCollege) return null

  // Eligible academic personnel affiliated with this College
  const eligiblePersonnel = personnelList.filter(p => {
    if (!p) return false
    const isAcademic = isAcademicPersonnel(p) || p.organizational_side === 'academic' || p.personnel_classification === 'academic'
    const matchesCollege = Boolean(p.college_id) && p.college_id === targetCollege.id
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery = !q ||
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.institutional_id || p.employee_id || '').toLowerCase().includes(q)
    return isAcademic && matchesCollege && matchesQuery
  })

  const handleSubmit = async () => {
    if (!selectedPersonnel) return
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      await assignDeanRole(selectedPersonnel.id, targetCollege.id, {
        effective_date: effectiveDate,
        reason: `Initial Dean assignment for ${targetCollege.name}.`
      })
      if (onAssigned) onAssigned()
      onClose()
    } catch (err) {
      setErrorMsg(err?.error?.message || err?.message || 'Failed to assign Dean.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Assign Dean for ${targetCollege.name}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#EFF7F0] dark:bg-emerald-950/60 border-b border-[#69A97C] dark:border-emerald-800 text-[#17663B] dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F5EA] dark:bg-emerald-900/60 border border-[#B7DDC4] dark:border-emerald-700 flex items-center justify-center text-[#17663B] dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#17663B] dark:text-emerald-300">Assign College Dean</h2>
              <p className="text-xs text-[#245F42] dark:text-emerald-400/80 font-medium">{targetCollege.name} ({targetCollege.code})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white flex items-center justify-center transition cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          {!isConfirmStep ? (
            <>
              {/* Step 1: Candidate Search */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Select Academic Faculty Member
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {eligiblePersonnel.length} eligible in {targetCollege.code}
                  </span>
                </div>

                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search candidate by name or employee ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {eligiblePersonnel.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 font-medium">
                      No eligible academic faculty found for {targetCollege.name}. Ensure faculty have active affiliation with this College in the Personnel Directory.
                    </div>
                  ) : (
                    eligiblePersonnel.map((p) => {
                      const isSelected = selectedPersonnel?.id === p.id
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPersonnel(p)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-700 ring-1 ring-emerald-600'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {p.full_name ? p.full_name.charAt(0) : 'P'}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.full_name}</h4>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {p.institutional_id || 'ID N/A'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {p.position_title || p.current_rank_title || 'Academic Faculty'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-700'
                            }`}>
                              {isSelected && <UserCheck className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Effective Date */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider block mb-1 text-slate-700 dark:text-slate-300">
                  Effective Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Confirmation Step */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Confirm Dean Assignment</h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Target College:</span>
                    <strong className="text-slate-900 dark:text-white">{targetCollege.name} ({targetCollege.code})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Effective Date:</span>
                    <strong className="text-slate-900 dark:text-white">{effectiveDate}</strong>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">Designated Dean:</span>
                    <strong className="text-base text-emerald-800 dark:text-emerald-300">{selectedPersonnel.full_name}</strong>
                    <p className="text-[11px] text-slate-500">Employee ID: {selectedPersonnel.institutional_id}</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium leading-relaxed">
                This action will designate {selectedPersonnel.full_name} as the active College Dean. The assignment will be recorded in the HR Audit Trail.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={isConfirmStep ? () => setIsConfirmStep(false) : onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
          >
            {isConfirmStep ? 'Back' : 'Cancel'}
          </button>

          {!isConfirmStep ? (
            <button
              type="button"
              disabled={!selectedPersonnel}
              onClick={() => setIsConfirmStep(true)}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <span>Review Assignment</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming...' : 'Confirm Assignment'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
