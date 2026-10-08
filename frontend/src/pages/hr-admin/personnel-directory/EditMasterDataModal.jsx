import React, { useState, useEffect, useMemo } from 'react'
import { X, Check, ShieldCheck, Briefcase, GraduationCap, Building2, Sparkles } from 'lucide-react'
import { validatePersonnelMasterData, validatePersonnelPlacement } from '../../../utils/personnelPlacement'
import { personnelMasterDataService } from '../../../services/personnelMasterDataService'
import { personnelRankRecommendationService } from '../../../services/personnelRankRecommendationService'
import { localToday, validateEmploymentStartDate } from '../../../utils/employmentDate'
import DepartmentSelect from './DepartmentSelect'

export default function EditMasterDataModal({
  personnel,
  isOpen,
  onClose,
  onSave,
  placementOptions = { colleges: [], academicPrograms: [], administrativeUnits: [] }
}) {
  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    facultyEngagement: 'full_time_faculty',
    employmentStatus: 'permanent',
    employmentStartDate: '',
    positionTitle: '',
    currentRankTitle: '',
    qualificationSummary: '',
    personnelGroup: '',
    organizationalSide: 'academic',
    collegeId: '',
    academicProgramIds: [],
    administrativeUnitId: '',
    reason: ''
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Master Data Catalogs State
  const [catalogs, setCatalogs] = useState({
    fullTimeRanks: [],
    loading: false,
    error: null
  })

  // Preferred Rank/Title Recommendation State (Plan D2 — Phase D2-2 Advisory Only)
  const [recommendation, setRecommendation] = useState({
    status: 'idle',
    recommendedCode: null,
    recommendedLabel: null,
    reasonCode: null,
    message: null,
    source: 'plan_e'
  })

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setCatalogs(prev => ({ ...prev, loading: true, error: null }))

    personnelMasterDataService.getFacultyRanks().then(ftRanks => {
      if (isMounted) {
        setCatalogs({
          fullTimeRanks: ftRanks || [],
          loading: false,
          error: null
        })
      }
    }).catch(err => {
      if (isMounted) {
        setCatalogs(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load rank catalogs.'
        }))
      }
    })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const [savedOfficialRank, setSavedOfficialRank] = useState('')
  const [rankWasManuallyChanged, setRankWasManuallyChanged] = useState(false)
  const [rankSelectionSource, setRankSelectionSource] = useState('saved')

  const teachingDepartments = useMemo(() => (placementOptions.administrativeUnits || []).filter(item => String(item.collegeId || item.college_id || '') === String(form.collegeId)), [placementOptions.administrativeUnits, form.collegeId])
  const standaloneDepartments = useMemo(() => (placementOptions.administrativeUnits || []).filter(item => !(item.collegeId || item.college_id)), [placementOptions.administrativeUnits])

  useEffect(() => {
    if (!personnel) return
    const rankTitle = personnel.current_rank_title || personnel.academic_rank || ''
    setSavedOfficialRank(rankTitle)
    setRankWasManuallyChanged(false)
    setRankSelectionSource('saved')
    setForm({
      fullName: personnel.full_name || '',
      contactNumber: personnel.contact_number || '',
      facultyEngagement: 'full_time_faculty',
      employmentStatus: personnel.employment_status || 'permanent',
      employmentStartDate: personnel.employment_start_date || '',
      positionTitle: personnel.position_title || personnel.designation || '',
      currentRankTitle: rankTitle,
      qualificationSummary: personnel.qualification_summary || '',
      personnelGroup: personnel.personnel_group || '',
      organizationalSide: personnel.personnel_group === 'faculty'
        ? 'academic'
        : personnel.personnel_group === 'non_teaching_faculty'
          ? 'non_academic'
          : personnel.organizational_side || personnel.personnel_classification || 'academic',
      collegeId: personnel.college_id || '',
      academicProgramIds: (personnel.program_affiliations || []).map(p => p.academic_program_id || p.id).filter(Boolean),
      administrativeUnitId: personnel.department_id || personnel.administrative_unit_id || '',
      reason: ''
    })
    setErrors({})
  }, [personnel, isOpen])

  // Teaching faculty use the full-time academic rank catalog.
  const currentRankCatalog = useMemo(() => {
    return (catalogs.fullTimeRanks && catalogs.fullTimeRanks.length > 0)
      ? catalogs.fullTimeRanks
      : [
          { code: 'INSTRUCTOR_I', label: 'Instructor I' },
          { code: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor' },
          { code: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
          { code: 'PROFESSOR_I', label: 'Professor I' },
          { code: 'UNIVERSITY_PROFESSOR', label: 'University Professor' }
        ]
  }, [catalogs.fullTimeRanks])

  // Check if existing saved rank matches the catalog
  const isSavedRankInCatalog = useMemo(() => {
    if (!form.currentRankTitle) return true
    return currentRankCatalog.some(
      r => (r.label && r.label.toLowerCase() === form.currentRankTitle.toLowerCase()) ||
           (r.code && r.code.toLowerCase() === form.currentRankTitle.toLowerCase())
    )
  }, [form.currentRankTitle, currentRankCatalog])

  const handleRankChange = (value) => {
    setForm(prev => ({ ...prev, currentRankTitle: value }))
    const isDifferent = value !== savedOfficialRank
    setRankWasManuallyChanged(isDifferent)
    setRankSelectionSource(isDifferent ? 'manual' : 'saved')
  }

  const handleApplyRecommendation = () => {
    if (recommendation.recommendedLabel) {
      setForm(prev => ({ ...prev, currentRankTitle: recommendation.recommendedLabel }))
      const isDifferent = recommendation.recommendedLabel !== savedOfficialRank
      setRankWasManuallyChanged(isDifferent)
      setRankSelectionSource('recommended')
    }
  }

  // Reactively resolve Plan E rank recommendation when qualification, engagement, or group changes (advisory only)
  useEffect(() => {
    if (!isOpen || !personnel) return
    const qual = (form.qualificationSummary || '').trim()
    if (!qual) {
      setRecommendation({
        status: 'idle',
        recommendedCode: null,
        recommendedLabel: null,
        reasonCode: null,
        message: null,
        source: 'plan_e'
      })
      return
    }

    let isMounted = true
    setRecommendation(prev => ({ ...prev, status: 'loading' }))

    personnelRankRecommendationService.resolveRecommendation({
      qualificationText: qual,
      facultyEngagement: form.facultyEngagement,
      personnelGroup: form.personnelGroup,
      activeCatalog: currentRankCatalog
    }).then(res => {
      if (isMounted && personnelRankRecommendationService.isLatest(res.sequenceId)) {
        setRecommendation({
          status: res.status,
          recommendedCode: res.recommendedCode,
          recommendedLabel: res.recommendedLabel,
          reasonCode: res.reasonCode,
          message: res.message,
          source: res.source
        })
        // CRITICAL INVARIANT: DO NOT OVERWRITE form.currentRankTitle.
        // Existing saved current rank remains authoritative.
      }
    }).catch(err => {
      if (isMounted) {
        setRecommendation({
          status: 'error',
          recommendedCode: null,
          recommendedLabel: null,
          reasonCode: 'resolver_error',
          message: 'Resolver error: Failed to calculate rank recommendation.',
          source: 'plan_e'
        })
      }
    })

    return () => {
      isMounted = false
    }
  }, [isOpen, personnel, form.qualificationSummary, form.facultyEngagement, form.personnelGroup, currentRankCatalog])

  if (!isOpen || !personnel) return null

  const update = (key, value) => setForm(prev => {
    if (key !== 'personnelGroup') return { ...prev, [key]: value }
    const side = value === 'faculty' ? 'academic' : 'non_academic'
    return {
      ...prev,
      personnelGroup: value,
      organizationalSide: side,
      collegeId: side === 'academic' ? prev.collegeId : '',
      academicProgramIds: side === 'academic' ? prev.academicProgramIds : [],
      administrativeUnitId: ''
    }
  })

  const submit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!['faculty', 'non_teaching_faculty'].includes(form.personnelGroup)) {
      nextErrors.personnelGroup = 'Select Teaching or Non-Teaching. Unit placement does not determine Personnel Type.'
    }
    const fullName = form.fullName.replace(/\s+/g, ' ').trim()
    const contactNumber = form.contactNumber.trim()

    if (!fullName) {
      nextErrors.fullName = 'Full name is required.'
    } else if (fullName.length > 255) {
      nextErrors.fullName = 'Full name must be 255 characters or fewer.'
    }
    if (contactNumber.length > 40 || (contactNumber && !/^[0-9+()\-.\s]{5,40}$/.test(contactNumber))) {
      nextErrors.contactNumber = 'Enter 5–40 characters using digits, spaces, +, parentheses, hyphens, or periods.'
    }

    const mdValidation = validatePersonnelMasterData({
      facultyEngagement: form.facultyEngagement,
      employmentStatus: form.employmentStatus
    })
    Object.assign(nextErrors, mdValidation.errors)
    const employmentStartDateError = validateEmploymentStartDate(form.employmentStartDate)
    if (employmentStartDateError) nextErrors.employmentStartDate = employmentStartDateError

    const placementValidation = validatePersonnelPlacement({
      group: form.personnelGroup,
      side: form.organizationalSide,
      classification: form.organizationalSide,
      collegeId: form.collegeId,
      academicProgramIds: [],
      departmentId: form.administrativeUnitId,
      administrativeUnitId: form.organizationalSide === 'non_academic' ? form.administrativeUnitId : null,
      requireDepartment: true
    }, placementOptions)
    Object.assign(nextErrors, placementValidation.errors)

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const payload = {
        full_name: fullName,
        contact_number: contactNumber || null,
        faculty_engagement: form.facultyEngagement,
        employment_status: form.employmentStatus,
        employment_start_date: form.employmentStartDate || null,
        position_title: form.positionTitle.trim() || 'Personnel',
        current_rank_title: form.currentRankTitle.trim() || null,
        qualification_summary: form.qualificationSummary.trim() || null,
        personnel_group: form.personnelGroup,
        organizational_side: form.organizationalSide,
        college_id: form.organizationalSide === 'academic' ? form.collegeId : null,
        academic_program_ids: form.organizationalSide === 'academic' ? form.academicProgramIds : [],
        department_id: form.organizationalSide === 'academic' ? form.administrativeUnitId : null,
        administrative_unit_id: form.organizationalSide === 'non_academic' ? form.administrativeUnitId : null,
        reason: form.reason.trim() || 'Official HR master data update'
      }

      await onSave?.(personnel.id || personnel.profile_id, payload)
      onClose()
    } catch (err) {
      const apiError = err?.response?.data?.error || err?.error || {}
      if (apiError.code === 'CATALOG_CROSSOVER_REJECTED') {
        setErrors({ currentRankTitle: apiError.message || 'Incompatible rank/title catalog.' })
      } else if (apiError.code === 'INVALID_EMPLOYMENT_START_DATE') {
        setErrors({ employmentStartDate: apiError.message || 'Enter a valid employment start date.' })
      } else if (apiError.message) {
        setErrors({ general: apiError.message })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <form
          onSubmit={submit}
          className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
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
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 font-bold">
              {errors.general}
            </div>
          )}

          {catalogs.error && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
              {catalogs.error}
            </div>
          )}

          {/* Section A: Account identity */}
          <section className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              A. Account Identity
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={event => update('fullName', event.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? 'full-name-error' : undefined}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                {errors.fullName && <span id="full-name-error" className="mt-1 block text-xs font-bold text-rose-600">{errors.fullName}</span>}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institutional ID</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{personnel.institutional_id || personnel.employee_id || 'N/A'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institutional Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{personnel.institutional_email || personnel.email || 'N/A'}</span>
              </div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Contact Phone
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={40}
                  value={form.contactNumber}
                  onChange={event => update('contactNumber', event.target.value)}
                  aria-invalid={Boolean(errors.contactNumber)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                {errors.contactNumber && <span className="mt-1 block text-xs font-bold text-rose-600">{errors.contactNumber}</span>}
              </label>
            </div>
          </section>

          {/* Section B: Employment Classification */}
          <section className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#064e2b] dark:text-emerald-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>B. Employment Classification (Plan D2)</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                Strictly Independent
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <fieldset className="space-y-1.5 sm:col-span-2">
                <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">Personnel Type (required)</legend>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold"><input type="radio" name="editPersonnelGroup" checked={form.personnelGroup === 'faculty'} onChange={() => update('personnelGroup', 'faculty')}/><span>Teaching</span></label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold"><input type="radio" name="editPersonnelGroup" checked={form.personnelGroup === 'non_teaching_faculty'} onChange={() => update('personnelGroup', 'non_teaching_faculty')}/><span>Non-Teaching</span></label>
                </div>
                {errors.personnelGroup && <span role="alert" className="text-[11px] text-rose-600">{errors.personnelGroup}</span>}
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
                      name="editEmploymentStatus"
                      checked={form.employmentStatus === 'permanent'}
                      onChange={() => update('employmentStatus', 'permanent')}
                    />
                    <span>Permanent</span>
                  </label>
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editEmploymentStatus"
                      checked={form.employmentStatus === 'probationary'}
                      onChange={() => update('employmentStatus', 'probationary')}
                    />
                    <span>Probationary</span>
                  </label>
                </div>
                {errors.employmentStatus && <span className="text-xs text-rose-600 font-bold block">{errors.employmentStatus}</span>}
              </fieldset>

              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">
                Employment Start Date
                <input
                  type="date"
                  max={localToday()}
                  value={form.employmentStartDate}
                  onChange={event => update('employmentStartDate', event.target.value)}
                  aria-invalid={Boolean(errors.employmentStartDate)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="mt-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Official date employment at NDMU began. Leave blank only when the legacy record has not yet been verified.</span>
                {errors.employmentStartDate && <span className="mt-1 block text-xs font-bold text-rose-600">{errors.employmentStartDate}</span>}
              </label>
            </div>
          </section>

          {/* Section C: Institutional Assignment */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>C. Institutional Assignment</span>
            </h3>

            {form.personnelGroup === 'faculty' ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  College
                  <select
                    value={form.collegeId}
                    onChange={e => update('collegeId', e.target.value)}
                    disabled={catalogs.loading}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
                  >
                    <option value="">Select a College</option>
                    {(placementOptions.colleges || []).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.code ? `${item.code} — ` : ''}{item.name}
                      </option>
                    ))}
                  </select>
                  {errors.collegeId && <span className="text-rose-600 block mt-0.5 text-xs font-semibold">{errors.collegeId}</span>}
                </label>
                <DepartmentSelect
                  departments={teachingDepartments}
                  value={form.administrativeUnitId}
                  onChange={id => setForm(curr => ({ ...curr, administrativeUnitId: id }))}
                  disabled={!form.collegeId}
                  error={errors.departmentId}
                />
              </div>
            ) : form.personnelGroup === 'non_teaching_faculty' ? (
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Department
                <select
                  value={form.administrativeUnitId}
                  onChange={e => update('administrativeUnitId', e.target.value)}
                  disabled={catalogs.loading}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="">Select a Department</option>
                  {standaloneDepartments.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} — ` : ''}{item.name || item.unit_name}
                    </option>
                  ))}
                </select>
                {errors.departmentId && <span className="text-rose-600 block mt-0.5 text-xs font-semibold">{errors.departmentId}</span>}
              </label>
            ) : null}

            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Specific Job
              <input
                type="text"
                value={form.positionTitle}
                onChange={e => update('positionTitle', e.target.value)}
                placeholder="e.g. Instructor I, Assistant Dean"
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </label>
          </section>

          {/* Section D: Qualification & Academic Rank */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>D. Educational Qualification &amp; Academic Rank</span>
            </h3>

            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Educational Qualifications (Completed and In Progress)
              <input
                type="text"
                value={form.qualificationSummary}
                onChange={e => update('qualificationSummary', e.target.value)}
                placeholder="e.g. MS in Computer Science (completed); PhD in progress"
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </label>

            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Current Academic Rank
                </label>
                {rankWasManuallyChanged && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                    HR Override
                  </span>
                )}
              </div>
              <select
                value={form.currentRankTitle}
                onChange={e => handleRankChange(e.target.value)}
                disabled={catalogs.loading}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
              >
                <option value="">
                  {catalogs.loading ? 'Loading Catalog...' : 'Select Academic Rank'}
                </option>
                {/* Preservation of legacy/saved rank if not in standard catalog */}
                {!isSavedRankInCatalog && form.currentRankTitle && (
                  <option value={form.currentRankTitle} disabled>
                    {form.currentRankTitle} (Saved / Legacy Record - Reconciliation Required)
                  </option>
                )}
                {currentRankCatalog.map(rank => (
                  <option key={rank.code || rank.label} value={rank.label}>
                    {rank.label} {rank.tier ? `(${rank.tier})` : ''}
                  </option>
                ))}
              </select>

              {!isSavedRankInCatalog && form.currentRankTitle && (
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                  ⚠️ Saved legacy rank is not in the current catalog. It will remain unchanged unless HR explicitly selects a valid current value.
                </div>
              )}

              {recommendation.status === 'loading' && (
                <span className="text-[11px] text-slate-400 italic block mt-1">
                  Resolving preferred academic rank recommendation...
                </span>
              )}
              {recommendation.status === 'resolved' && recommendation.recommendedLabel && (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5 mt-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
                    <span className="font-medium flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Suggested from qualification: <strong>{recommendation.recommendedLabel}</strong>
                      </span>
                    </span>
                    {form.currentRankTitle !== recommendation.recommendedLabel && (
                      <button
                        type="button"
                        onClick={handleApplyRecommendation}
                        className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 underline cursor-pointer ml-2"
                      >
                        Use Suggested Rank
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                    Suggested from qualification. The saved official rank remains unchanged unless HR explicitly changes it.
                  </p>
                </div>
              )}
              {errors.currentRankTitle && <span className="text-rose-600 block mt-0.5 text-xs font-semibold">{errors.currentRankTitle}</span>}
            </div>

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
          </section>

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
