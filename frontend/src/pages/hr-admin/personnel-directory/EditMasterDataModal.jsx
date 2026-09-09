import React, { useState, useEffect, useMemo } from 'react'
import { X, Check, ShieldCheck, Briefcase, GraduationCap, Building2 } from 'lucide-react'
import { validatePersonnelMasterData, validatePersonnelPlacement, isAcademicPersonnel } from '../../../utils/personnelPlacement'

export default function EditMasterDataModal({
  personnel,
  isOpen,
  onClose,
  onSave,
  placementOptions = { colleges: [], academicPrograms: [], administrativeUnits: [] }
}) {
  const [form, setForm] = useState({
    facultyEngagement: 'full_time_faculty',
    employmentStatus: 'permanent',
    positionTitle: '',
    currentRankTitle: '',
    qualificationSummary: '',
    personnelGroup: 'faculty',
    organizationalSide: 'academic',
    collegeId: '',
    academicProgramIds: [],
    administrativeUnitId: '',
    reason: ''
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const programs = useMemo(
    () => placementOptions.academicPrograms.filter(program => program.collegeId === form.collegeId),
    [placementOptions.academicPrograms, form.collegeId]
  )

  useEffect(() => {
    if (!personnel) return
    setForm({
      facultyEngagement: personnel.faculty_engagement || 'full_time_faculty',
      employmentStatus: personnel.employment_status || 'permanent',
      positionTitle: personnel.position_title || personnel.designation || '',
      currentRankTitle: personnel.current_rank_title || personnel.academic_rank || '',
      qualificationSummary: personnel.qualification_summary || '',
      personnelGroup: personnel.personnel_group || (isAcademicPersonnel(personnel) ? 'faculty' : 'non_teaching_faculty'),
      organizationalSide: personnel.organizational_side || personnel.personnel_classification || 'academic',
      collegeId: personnel.college_id || '',
      academicProgramIds: (personnel.program_affiliations || []).map(p => p.academic_program_id || p.id).filter(Boolean),
      administrativeUnitId: personnel.administrative_unit_id || '',
      reason: ''
    })
    setErrors({})
  }, [personnel, isOpen])

  if (!isOpen || !personnel) return null

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const submit = async (e) => {
    e.preventDefault()
    const nextErrors = {}

    const mdValidation = validatePersonnelMasterData({
      facultyEngagement: form.facultyEngagement,
      employmentStatus: form.employmentStatus
    })
    Object.assign(nextErrors, mdValidation.errors)

    const placementValidation = validatePersonnelPlacement({
      group: form.personnelGroup,
      side: form.organizationalSide,
      classification: form.organizationalSide,
      collegeId: form.collegeId,
      academicProgramIds: form.academicProgramIds,
      administrativeUnitId: form.administrativeUnitId
    }, placementOptions)
    Object.assign(nextErrors, placementValidation.errors)

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const payload = {
        faculty_engagement: form.facultyEngagement,
        employment_status: form.employmentStatus,
        position_title: form.positionTitle.trim() || 'Personnel',
        current_rank_title: form.currentRankTitle.trim() || null,
        qualification_summary: form.qualificationSummary.trim() || null,
        college_id: form.organizationalSide === 'academic' ? form.collegeId : null,
        academic_program_ids: form.organizationalSide === 'academic' ? form.academicProgramIds : [],
        administrative_unit_id: form.organizationalSide === 'non_academic' ? form.administrativeUnitId : null,
        reason: form.reason.trim() || 'Official HR master data update'
      }

      await onSave?.(personnel.id || personnel.profile_id, payload)
      onClose()
    } catch (err) {
      const apiError = err?.response?.data?.error || err?.error || {}
      if (apiError.message) {
        setErrors({ general: apiError.message })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form
          onSubmit={submit}
          className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#064e2b] dark:text-emerald-400" />
                <span>Edit Personnel Master Data (HR Control)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official canonical profile for <strong>{personnel.full_name}</strong> ({personnel.institutional_id || personnel.employee_id})
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 font-bold">
              {errors.general}
            </div>
          )}

          {/* Section 1: Engagement & Employment Status (Plan D2 Strict Independence) */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#064e2b] dark:text-emerald-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Faculty Engagement &amp; Employment Status (Plan D2)</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                Strictly Independent
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Engagement */}
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Faculty Engagement (Workload)
                </legend>
                <div className="flex gap-3">
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="facultyEngagement"
                      checked={form.facultyEngagement === 'full_time_faculty'}
                      onChange={() => update('facultyEngagement', 'full_time_faculty')}
                    />
                    <span>Full-time Faculty</span>
                  </label>
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="facultyEngagement"
                      checked={form.facultyEngagement === 'part_time_faculty'}
                      onChange={() => update('facultyEngagement', 'part_time_faculty')}
                    />
                    <span>Part-time Faculty</span>
                  </label>
                </div>
                {errors.facultyEngagement && <span className="text-xs text-rose-600 font-bold">{errors.facultyEngagement}</span>}
              </fieldset>

              {/* Employment Status */}
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Employment Status (Tenure)
                </legend>
                <div className="flex gap-3">
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="employmentStatus"
                      checked={form.employmentStatus === 'permanent'}
                      onChange={() => update('employmentStatus', 'permanent')}
                    />
                    <span>Permanent</span>
                  </label>
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="employmentStatus"
                      checked={form.employmentStatus === 'probationary'}
                      onChange={() => update('employmentStatus', 'probationary')}
                    />
                    <span>Probationary</span>
                  </label>
                </div>
                {errors.employmentStatus && <span className="text-xs text-rose-600 font-bold">{errors.employmentStatus}</span>}
              </fieldset>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Full-time/Part-time and Permanent/Probationary are independent. Neither is derived from the other or from free-text titles.
            </p>
          </div>

          {/* Section 2: Position Title vs Academic Rank */}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Position / Job Title (Appointment)
              <input
                type="text"
                value={form.positionTitle}
                onChange={e => update('positionTitle', e.target.value)}
                placeholder="e.g. Instructor I, Assistant Dean"
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </label>

            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Current Academic Rank Title
              <input
                type="text"
                value={form.currentRankTitle}
                onChange={e => update('currentRankTitle', e.target.value)}
                placeholder="e.g. Assistant Professor II"
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </label>
          </div>

          {/* Qualifications Summary */}
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Qualifications Summary (HR Structured Record)
            <input
              type="text"
              value={form.qualificationSummary}
              onChange={e => update('qualificationSummary', e.target.value)}
              placeholder="e.g. MS in Information Technology, Ongoing Ph.D. in Computer Science"
              className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </label>

          {/* Reason for Audit Log */}
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Audit Reason / Authority Reference
            <input
              type="text"
              value={form.reason}
              onChange={e => update('reason', e.target.value)}
              placeholder="e.g. Official Board Resolution No. 2026-042 / Reclassification"
              className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </label>

          <p className="text-[11px] text-slate-500">
            Every update is validated server-side, timestamped, and audited with prior/current values. Past Plan C submission snapshots remain completely immutable.
          </p>

          {/* Footer */}
          <footer className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#176B43] text-white font-bold text-xs disabled:opacity-50 hover:bg-[#125333] transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving…' : 'Save Master Data'}</span>
            </button>
          </footer>
        </form>
      </div>
    </>
  )
}
