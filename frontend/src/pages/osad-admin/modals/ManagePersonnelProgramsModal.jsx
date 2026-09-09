import React, { useState, useEffect } from 'react'
import { Check, X, Shield, ShieldCheck, AlertCircle, Sparkles, Building2, User } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { getAccessibleTextColor } from '../../../utils/colorContrast'
import {
  fetchPersonnelCoordinatorContext,
  updatePersonnelCoordinatorAssignments
} from '../../../services/collegeAdminService'

export default function ManagePersonnelProgramsModal({
  isOpen,
  onClose,
  collegeId,
  personnel,
  onSuccess
}) {
  const [context, setContext] = useState(null)
  const [selectedProgramIds, setSelectedProgramIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const profileId = personnel?.profile_id || personnel?.id

  useEffect(() => {
    if (isOpen && collegeId && profileId) {
      setLoading(true)
      setError(null)
      fetchPersonnelCoordinatorContext(collegeId, profileId)
        .then((data) => {
          setContext(data)
          const currentlyAssigned = (data.eligible_programs || [])
            .filter((p) => p.currently_assigned)
            .map((p) => p.program_id)
          setSelectedProgramIds(currentlyAssigned)
        })
        .catch((err) => {
          setError(err?.response?.data?.error?.message || err.message || 'Failed to load assignment context.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, collegeId, profileId])

  if (!isOpen) return null

  const college = context?.college || {}
  const badgeBg = college.acronym_badge_color || '#16834A'
  const badgeTextColor = getAccessibleTextColor(badgeBg)
  const eligiblePrograms = context?.eligible_programs || []

  const toggleProgram = (progId) => {
    setSelectedProgramIds((prev) =>
      prev.includes(progId)
        ? prev.filter((id) => id !== progId)
        : [...prev, progId]
    )
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await updatePersonnelCoordinatorAssignments(collegeId, profileId, selectedProgramIds)
      setSaving(false)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to update coordinator assignments.'
      )
      setSaving(false)
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose() }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#131e2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Manage Program Coordinator Assignments</h3>
              <p className="text-[11px] text-slate-400">
                Multi-program assignment editor under {college.code || 'College'}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            disabled={saving}
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Personnel & College Summary Banner */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {context?.personnel?.name || personnel?.name || 'Personnel'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {context?.personnel?.designation || personnel?.designation || 'Academic Faculty'}
              </p>
            </div>
          </div>

          <span
            className="px-2.5 py-1 rounded-lg text-xs font-extrabold shadow-2xs shrink-0"
            style={{ backgroundColor: badgeBg, color: badgeTextColor }}
          >
            {college.code || 'COLLEGE'}
          </span>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs font-medium">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Eligible Academic Programs (HR Affiliated)</span>
              </label>

              <span className="text-[11px] font-bold text-[#16834a] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                {selectedProgramIds.length} of {eligiblePrograms.length} Selected
              </span>
            </div>

            <p className="text-[10px] text-slate-400">
              Only programs where this personnel has an active HR-established affiliation are available for assignment.
            </p>

            {loading ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold">Loading eligible programs...</p>
              </div>
            ) : eligiblePrograms.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                No active HR personnel-program affiliations found under {college.code} for this personnel.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {eligiblePrograms.map((prog) => {
                  const isSelected = selectedProgramIds.includes(prog.program_id)
                  const hasOther = Boolean(prog.other_coordinator && !isSelected)

                  return (
                    <label
                      key={prog.program_id}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProgram(prog.program_id)}
                          className="w-4 h-4 rounded text-[#16834a] border-slate-300 focus:ring-emerald-500"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {prog.program_code}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                              {prog.program_name}
                            </span>
                          </div>

                          {hasOther && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                              Current Coordinator: {prog.other_coordinator}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-[#16834a] dark:text-emerald-400 shrink-0">
                          Assigned
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || loading || eligiblePrograms.length === 0}
              className="gap-1.5 shadow-xs px-5 py-2 font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Assignments...' : 'Save Assignments'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
