import React, { useMemo, useState } from 'react'
import { X, UserPlus, Briefcase, GraduationCap, Award } from 'lucide-react'
import { validatePersonnelPlacement, validatePersonnelMasterData } from '../../../utils/personnelPlacement'
import { useProvisioningCredential } from '../../../hooks/useProvisioningCredential'
import OneTimeCredentialModal from '../../../components/credentials/OneTimeCredentialModal'
import CredentialDeliveryFaultModal from '../../../components/credentials/CredentialDeliveryFaultModal'

export default function OnboardPersonnelModal({ isOpen, onClose, onSubmit, placementOptions = { colleges: [], academicPrograms: [], administrativeUnits: [] } }) {
  const [form, setForm] = useState({
    institutionalId: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    designation: '',
    positionTitle: '',
    currentRankTitle: '',
    qualificationSummary: '',
    facultyEngagement: 'full_time_faculty',
    employmentStatus: 'permanent',
    personnelGroup: 'faculty',
    organizationalSide: 'academic',
    collegeId: '',
    academicProgramIds: [],
    administrativeUnitId: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const credentialHook = useProvisioningCredential()

  const programs = useMemo(() => placementOptions.academicPrograms.filter(program => program.collegeId === form.collegeId), [placementOptions.academicPrograms, form.collegeId])
  if (!isOpen) return null

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))
  
  const setPersonnelGroup = (group) => {
    setForm(current => {
      // If switching to faculty, organizationalSide must be academic
      const nextSide = (group === 'faculty') ? 'academic' : current.organizationalSide
      return {
        ...current,
        personnelGroup: group,
        organizationalSide: nextSide,
        collegeId: nextSide === 'academic' ? current.collegeId : '',
        academicProgramIds: nextSide === 'academic' ? current.academicProgramIds : [],
        administrativeUnitId: nextSide === 'non_academic' ? current.administrativeUnitId : ''
      }
    })
  }

  const setOrganizationalSide = (side) => {
    setForm(current => ({
      ...current,
      organizationalSide: side,
      collegeId: side === 'academic' ? current.collegeId : '',
      academicProgramIds: side === 'academic' ? current.academicProgramIds : [],
      administrativeUnitId: side === 'non_academic' ? current.administrativeUnitId : ''
    }))
  }

  const setCollege = collegeId => setForm(current => ({ ...current, collegeId, academicProgramIds: current.academicProgramIds.filter(id => placementOptions.academicPrograms.some(program => program.id === id && program.collegeId === collegeId)) }))
  const toggleProgram = id => setForm(current => ({ ...current, academicProgramIds: current.academicProgramIds.includes(id) ? current.academicProgramIds.filter(item => item !== id) : [...current.academicProgramIds, id] }))

  const submit = async event => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.institutionalId.trim()) nextErrors.institutionalId = 'Institutional ID is required.'
    if (!form.email.trim().toLowerCase().endsWith('@ndmu.edu.ph')) nextErrors.email = 'Use an @ndmu.edu.ph email.'
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.'
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.'
    
    const placement = validatePersonnelPlacement({
      group: form.personnelGroup,
      side: form.organizationalSide,
      classification: form.organizationalSide,
      collegeId: form.collegeId,
      academicProgramIds: form.academicProgramIds,
      administrativeUnitId: form.administrativeUnitId
    }, placementOptions)
    
    Object.assign(nextErrors, placement.errors)

    const masterDataValidation = validatePersonnelMasterData({
      facultyEngagement: form.facultyEngagement,
      employmentStatus: form.employmentStatus
    })
    Object.assign(nextErrors, masterDataValidation.errors)

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      const res = await onSubmit({
        institutional_id: form.institutionalId.trim(),
        institutional_email: form.email.trim().toLowerCase(),
        first_name: form.firstName.trim(), middle_name: form.middleName.trim() || null,
        last_name: form.lastName.trim(), suffix: form.suffix.trim() || null,
        designation: form.designation.trim() || form.positionTitle.trim() || 'Personnel',
        position_title: form.positionTitle.trim() || form.designation.trim() || 'Personnel',
        current_rank_title: form.currentRankTitle.trim() || null,
        qualification_summary: form.qualificationSummary.trim() || null,
        faculty_engagement: form.facultyEngagement,
        employment_status: form.employmentStatus,
        personnel_group: form.personnelGroup,
        organizational_side: form.organizationalSide,
        personnel_classification: form.organizationalSide,
        college_id: form.organizationalSide === 'academic' ? form.collegeId : null,
        academic_program_ids: form.organizationalSide === 'academic' ? form.academicProgramIds : [],
        administrative_unit_id: form.organizationalSide === 'non_academic' ? form.administrativeUnitId : null
      })

      if (res && (res.data || res.temporary_password)) {
        credentialHook.handleProvisioningSuccess(res, 'personnel')
      } else {
        onClose()
      }
    } catch (error) {
      const apiError = error?.response?.data?.error || error?.error || {}
      if (apiError.code === 'EMAIL_ALREADY_EXISTS') setErrors({ email: 'An account with this email already exists.' })
      else if (apiError.code === 'INSTITUTIONAL_ID_ALREADY_EXISTS') setErrors({ institutionalId: 'An account with this institutional ID already exists.' })
      else if (apiError.code === 'INVALID_PERSONNEL_CLASSIFICATION') setErrors({ classificationPair: apiError.message || 'Invalid classification combination.' })
      else if (apiError.code === 'INVALID_FACULTY_ENGAGEMENT') setErrors({ facultyEngagement: apiError.message || 'Invalid faculty engagement.' })
      else if (apiError.code === 'INVALID_EMPLOYMENT_STATUS') setErrors({ employmentStatus: apiError.message || 'Invalid employment status.' })
      else if (apiError.code === 'VALIDATION_FAILED') {
        setErrors({
          ...(apiError.fields?.institutional_email ? { email: apiError.fields.institutional_email } : {}),
          ...(apiError.fields?.institutional_id ? { institutionalId: apiError.fields.institutional_id } : {})
        })
      } else throw error
    } finally { setSubmitting(false) }
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
      {label}
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => update(key, e.target.value)}
        className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
      />
      {errors[key] && <span className="text-rose-600 block mt-0.5">{errors[key]}</span>}
    </label>
  )

  const isFaculty = form.personnelGroup === 'faculty'

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/50 z-50 ${credentialHook.isOpen || credentialHook.deliveryFault ? 'hidden' : ''}`} onClick={onClose} />
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${credentialHook.isOpen || credentialHook.deliveryFault ? 'hidden' : ''}`}>
        <form onSubmit={submit} className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <header className="flex items-center justify-between border-b pb-3">
            <h2 className="font-black flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Onboard Personnel Account
            </h2>
            <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Identity Fields */}
          <div className="grid sm:grid-cols-2 gap-3">
            {field('Institutional ID', 'institutionalId', 'text', 'e.g. 2026-0042')}
            {field('Institutional Email', 'email', 'email', 'username@ndmu.edu.ph')}
            {field('First Name', 'firstName')}
            {field('Middle Name', 'middleName')}
            {field('Last Name', 'lastName')}
            {field('Suffix', 'suffix', 'text', 'Jr., III, etc.')}
          </div>

          {/* Plan D2: Engagement & Employment Status (Independent Dimensions) */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#064e2b] dark:text-emerald-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Faculty Engagement &amp; Employment Status (Plan D2)</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                Independent HR Dimensions
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Engagement Dimension */}
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Faculty Engagement (Workload/Appointment)
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

              {/* Employment Status Dimension */}
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Employment Status (Tenure Track)
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
              * Note: Full-time/Part-time and Permanent/Probationary are independent. All 4 combinations are valid.
            </p>
          </div>

          {/* Position, Academic Rank & Qualifications */}
          <div className="grid sm:grid-cols-2 gap-3">
            {field('Position / Job Title', 'positionTitle', 'text', 'e.g. Instructor I, Associate Dean')}
            {field('Current Academic Rank', 'currentRankTitle', 'text', 'e.g. Assistant Professor II')}
          </div>
          {field('Qualifications Summary', 'qualificationSummary', 'text', 'e.g. MS in Computer Science (Ongoing PhD)')}

          {/* Classification Model: Group & Side */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Personnel Classification (Plan D1)
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">Personnel Group</legend>
                <div className="flex gap-3">
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="personnelGroup" checked={form.personnelGroup === 'faculty'} onChange={() => setPersonnelGroup('faculty')} />
                    <span>Faculty</span>
                  </label>
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="personnelGroup" checked={form.personnelGroup === 'non_teaching_faculty'} onChange={() => setPersonnelGroup('non_teaching_faculty')} />
                    <span>Non-Teaching Faculty</span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="space-y-1.5">
                <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">Organizational Side</legend>
                <div className="flex gap-3">
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="organizationalSide" checked={form.organizationalSide === 'academic'} onChange={() => setOrganizationalSide('academic')} />
                    <span>Academic</span>
                  </label>
                  <label className={`text-xs font-semibold flex items-center gap-1.5 ${isFaculty ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input type="radio" name="organizationalSide" disabled={isFaculty} checked={form.organizationalSide === 'non_academic'} onChange={() => setOrganizationalSide('non_academic')} />
                    <span>Non-Academic</span>
                  </label>
                </div>
                {isFaculty && <p className="text-[10px] text-slate-400 italic">Faculty members are strictly on the Academic side.</p>}
              </fieldset>
            </div>
            {errors.classificationPair && <span className="text-xs text-rose-600 font-bold">{errors.classificationPair}</span>}
          </div>

          {form.organizationalSide === 'academic' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold">College
                <select value={form.collegeId} onChange={e => setCollege(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <option value="">Select a College</option>
                  {placementOptions.colleges.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
                </select>
                {errors.collegeId && <span className="text-rose-600">{errors.collegeId}</span>}
              </label>
              <fieldset>
                <legend className="text-xs font-bold">Academic Program affiliations</legend>
                {programs.map(program => (
                  <label key={program.id} className="block text-xs py-1">
                    <input type="checkbox" checked={form.academicProgramIds.includes(program.id)} onChange={() => toggleProgram(program.id)} /> {program.code} — {program.name}
                  </label>
                ))}
                {errors.academicProgramIds && <span className="text-xs text-rose-600">{errors.academicProgramIds}</span>}
              </fieldset>
            </div>
          ) : (
            <label className="block text-xs font-bold">Administrative Unit
              <select value={form.administrativeUnitId} onChange={e => update('administrativeUnitId', e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <option value="">Select an Administrative Unit</option>
                {placementOptions.administrativeUnits.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
              </select>
              {errors.administrativeUnitId && <span className="text-rose-600">{errors.administrativeUnitId}</span>}
            </label>
          )}

          <p className="text-[11px] text-slate-500">
            Governance roles are assigned separately. HR manages official engagement, status, position, rank, and College assignments; OSAD owns Program Coordinator and Organization Moderator assignments.
          </p>
          <footer className="flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
              Cancel
            </button>
            <button disabled={submitting} className="px-4 py-2 rounded-xl bg-[#176B43] text-white font-bold text-xs disabled:opacity-50 hover:bg-[#125333] transition">
              {submitting ? 'Creating…' : 'Create Personnel'}
            </button>
          </footer>
        </form>
      </div>

      {/* One-Time Credential Delivery Modal */}
      <OneTimeCredentialModal
        isOpen={credentialHook.isOpen}
        credential={credentialHook.credential}
        hasCopied={credentialHook.hasCopied}
        hasPrinted={credentialHook.hasPrinted}
        copyFeedback={credentialHook.copyFeedback}
        onCopy={credentialHook.handleCopy}
        onPrint={credentialHook.handlePrint}
        isPrintPrepared={credentialHook.printHook.isPrintPrepared}
        printedAtLabel={credentialHook.printHook.printedAtLabel}
        printAttemptCount={credentialHook.printHook.printAttemptCount}
        onRequestClose={() => credentialHook.requestClose(() => onClose())}
        isConfirmDiscardOpen={credentialHook.isConfirmDiscardOpen}
        onConfirmDiscard={() => credentialHook.confirmDiscard(() => onClose())}
        onCancelDiscard={credentialHook.cancelDiscard}
      />

      {/* Credential Delivery Fault Modal */}
      <CredentialDeliveryFaultModal
        isOpen={Boolean(credentialHook.deliveryFault)}
        fault={credentialHook.deliveryFault}
        onRefreshAndClose={() => credentialHook.clearDeliveryFault(() => onClose())}
      />
    </>
  )
}
