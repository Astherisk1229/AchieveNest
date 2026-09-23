import React, { useMemo, useState, useEffect } from 'react'
import { X, UserPlus, Briefcase, GraduationCap, Building2, Sparkles } from 'lucide-react'
import { validatePersonnelPlacement, validatePersonnelMasterData } from '../../../utils/personnelPlacement'
import { useProvisioningCredential } from '../../../hooks/useProvisioningCredential'
import OneTimeCredentialModal from '../../../components/credentials/OneTimeCredentialModal'
import CredentialDeliveryFaultModal from '../../../components/credentials/CredentialDeliveryFaultModal'
import { personnelMasterDataService } from '../../../services/personnelMasterDataService'
import { personnelRankRecommendationService } from '../../../services/personnelRankRecommendationService'
import { localToday, validateEmploymentStartDate } from '../../../utils/employmentDate'

export default function OnboardPersonnelModal({
  isOpen,
  onClose,
  onSubmit,
  placementOptions = { colleges: [], academicPrograms: [], administrativeUnits: [] }
}) {
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
    employmentStartDate: '',
    personnelGroup: 'faculty',
    organizationalSide: 'academic',
    collegeId: '',
    academicProgramIds: [],
    administrativeUnitId: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Master Data Catalogs State
  const [masterData, setMasterData] = useState({
    colleges: [],
    departments: [],
    fullTimeRanks: [],
    partTimeTitles: [],
    loading: false,
    error: null
  })

  // Preferred Rank/Title Recommendation State (Plan D2 — Phase D2-2)
  const [recommendation, setRecommendation] = useState({
    status: 'idle', // 'idle' | 'loading' | 'resolved' | 'unresolved' | 'error'
    recommendedCode: null,
    recommendedLabel: null,
    reasonCode: null,
    message: null,
    source: 'plan_e',
    isUserOverridden: false
  })

  useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    setMasterData(prev => ({ ...prev, loading: true, error: null }))

    Promise.all([
      personnelMasterDataService.getColleges(),
      personnelMasterDataService.getDepartments(),
      personnelMasterDataService.getFacultyRanks(),
      personnelMasterDataService.getPartTimeTitles()
    ]).then(([colleges, departments, fullTimeRanks, partTimeTitles]) => {
      if (isMounted) {
        setMasterData({
          colleges: colleges || [],
          departments: departments || [],
          fullTimeRanks: fullTimeRanks || [],
          partTimeTitles: partTimeTitles || [],
          loading: false,
          error: null
        })
      }
    }).catch(err => {
      if (isMounted) {
        setMasterData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load authoritative master data catalogs.'
        }))
      }
    })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const credentialHook = useProvisioningCredential()

  // Effective Colleges & Departments (Prioritize direct institutional API, fallback to props)
  const effectiveColleges = useMemo(() => {
    if (masterData.colleges && masterData.colleges.length > 0) return masterData.colleges
    return placementOptions.colleges || []
  }, [masterData.colleges, placementOptions.colleges])

  const effectiveDepartments = useMemo(() => {
    if (masterData.departments && masterData.departments.length > 0) return masterData.departments
    return placementOptions.administrativeUnits || []
  }, [masterData.departments, placementOptions.administrativeUnits])

  const effectivePrograms = useMemo(() => {
    return placementOptions.academicPrograms || []
  }, [placementOptions.academicPrograms])

  const programs = useMemo(() => {
    return effectivePrograms.filter(program => String(program.collegeId) === String(form.collegeId))
  }, [effectivePrograms, form.collegeId])

  // Current Rank/Title Options based on Faculty Engagement
  const currentRankCatalog = useMemo(() => {
    if (form.facultyEngagement === 'part_time_faculty') {
      return (masterData.partTimeTitles && masterData.partTimeTitles.length > 0)
        ? masterData.partTimeTitles
        : [
            { code: 'PT_PROFESSORIAL_LECTURER', label: 'Professorial Lecturer' },
            { code: 'PT_ASSISTANT_PROFESSORIAL_LECTURER', label: 'Assistant Professorial Lecturer' },
            { code: 'PT_SENIOR_LECTURER', label: 'Senior Lecturer' },
            { code: 'PT_LECTURER', label: 'Lecturer' }
          ]
    }
    return (masterData.fullTimeRanks && masterData.fullTimeRanks.length > 0)
      ? masterData.fullTimeRanks
      : [
          { code: 'INSTRUCTOR_I', label: 'Instructor I' },
          { code: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor' },
          { code: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
          { code: 'PROFESSOR_I', label: 'Professor I' },
          { code: 'UNIVERSITY_PROFESSOR', label: 'University Professor' }
        ]
  }, [form.facultyEngagement, masterData.fullTimeRanks, masterData.partTimeTitles])

  // Reactively resolve Plan E rank recommendation when qualification, engagement, or group changes
  useEffect(() => {
    if (!isOpen) return
    const qual = (form.qualificationSummary || '').trim()
    if (!qual) {
      setRecommendation({
        status: 'idle',
        recommendedCode: null,
        recommendedLabel: null,
        reasonCode: null,
        message: null,
        source: 'plan_e',
        isUserOverridden: false
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
        setRecommendation(prev => ({
          ...prev,
          status: res.status,
          recommendedCode: res.recommendedCode,
          recommendedLabel: res.recommendedLabel,
          reasonCode: res.reasonCode,
          message: res.message,
          source: res.source
        }))

        // For NEW personnel: preselect resolved recommendation if not manually overridden or rank is empty
        if (res.status === 'resolved' && res.recommendedLabel) {
          setForm(current => {
            if (!current.currentRankTitle || !recommendation.isUserOverridden) {
              return { ...current, currentRankTitle: res.recommendedLabel }
            }
            return current
          })
        }
      }
    }).catch(err => {
      if (isMounted) {
        setRecommendation(prev => ({
          ...prev,
          status: 'error',
          message: 'Resolver error: Failed to calculate rank recommendation.'
        }))
      }
    })

    return () => {
      isMounted = false
    }
  }, [isOpen, form.qualificationSummary, form.facultyEngagement, form.personnelGroup, currentRankCatalog])

  if (!isOpen) return null

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const handleEngagementChange = (engagement) => {
    setForm(current => {
      // Check if current rank is compatible with new catalog
      const newIsPartTime = engagement === 'part_time_faculty'
      const ptLabels = ['Professorial Lecturer', 'Assistant Professorial Lecturer', 'Senior Lecturer', 'Lecturer']
      const isCurrentlyPt = ptLabels.some(l => l.toLowerCase() === current.currentRankTitle.toLowerCase())

      let nextRank = current.currentRankTitle
      if (newIsPartTime && !isCurrentlyPt) {
        nextRank = '' // Clear incompatible Full-Time rank
      } else if (!newIsPartTime && isCurrentlyPt) {
        nextRank = '' // Clear incompatible Part-Time title
      }

      return {
        ...current,
        facultyEngagement: engagement,
        currentRankTitle: nextRank
      }
    })
  }

  const setPersonnelGroup = (group) => {
    setForm(current => ({
      ...current,
      personnelGroup: group
    }))
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

  const setCollege = collegeId => setForm(current => ({
    ...current,
    collegeId,
    academicProgramIds: current.academicProgramIds.filter(id =>
      effectivePrograms.some(program => String(program.id) === String(id) && String(program.collegeId) === String(collegeId))
    )
  }))

  const toggleProgram = id => setForm(current => ({
    ...current,
    academicProgramIds: current.academicProgramIds.includes(id)
      ? current.academicProgramIds.filter(item => item !== id)
      : [...current.academicProgramIds, id]
  }))

  const submit = async event => {
    event.preventDefault()
    const nextErrors = {}
    const trimmedId = form.institutionalId.trim()
    const trimmedEmail = form.email.trim().toLowerCase()
    const trimmedFirstName = form.firstName.trim()
    const trimmedLastName = form.lastName.trim()

    if (!trimmedId) {
      nextErrors.institutionalId = 'Institutional ID is required.'
    } else if (!/^\d{1,50}$/.test(trimmedId)) {
      nextErrors.institutionalId = 'Institutional ID must contain digits only (maximum 50).'
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Institutional email is required.'
    } else {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@ndmu\.edu\.ph$/
      if (!emailPattern.test(trimmedEmail)) {
        nextErrors.email = 'Use an @ndmu.edu.ph institutional email.'
      }
    }

    const namePattern = /^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*\.?$/u
    if (!trimmedFirstName) nextErrors.firstName = 'First name is required.'
    else if (!namePattern.test(trimmedFirstName)) nextErrors.firstName = 'Use letters, spaces, hyphens, apostrophes, or periods only.'
    if (!trimmedLastName) nextErrors.lastName = 'Last name is required.'
    else if (!namePattern.test(trimmedLastName)) nextErrors.lastName = 'Use letters, spaces, hyphens, apostrophes, or periods only.'
    if (form.middleName.trim() && !namePattern.test(form.middleName.trim())) nextErrors.middleName = 'Use letters, spaces, hyphens, apostrophes, or periods only.'

    const mergedOptions = {
      colleges: effectiveColleges,
      academicPrograms: effectivePrograms,
      administrativeUnits: effectiveDepartments
    }

    const placement = validatePersonnelPlacement({
      group: form.personnelGroup,
      side: form.organizationalSide,
      classification: form.organizationalSide,
      collegeId: form.collegeId,
      academicProgramIds: form.academicProgramIds,
      administrativeUnitId: form.administrativeUnitId
    }, mergedOptions)

    Object.assign(nextErrors, placement.errors)

    const masterDataValidation = validatePersonnelMasterData({
      facultyEngagement: form.facultyEngagement,
      employmentStatus: form.employmentStatus
    })
    Object.assign(nextErrors, masterDataValidation.errors)
    const employmentStartDateError = validateEmploymentStartDate(form.employmentStartDate, { required: true })
    if (employmentStartDateError) nextErrors.employmentStartDate = employmentStartDateError

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      const res = await onSubmit({
        institutional_id: trimmedId,
        institutional_email: trimmedEmail,
        first_name: trimmedFirstName,
        middle_name: form.middleName.trim() || null,
        last_name: trimmedLastName,
        suffix: form.suffix.trim() || null,
        designation: form.designation.trim() || form.positionTitle.trim() || 'Personnel',
        position_title: form.positionTitle.trim() || form.designation.trim() || 'Personnel',
        current_rank_title: form.currentRankTitle.trim() || null,
        qualification_summary: form.qualificationSummary.trim() || null,
        faculty_engagement: form.facultyEngagement,
        employment_status: form.employmentStatus,
        employment_start_date: form.employmentStartDate,
        personnel_group: form.personnelGroup,
        organizational_side: form.organizationalSide,
        personnel_classification: form.organizationalSide,
        college_id: form.organizationalSide === 'academic' ? form.collegeId : null,
        academic_program_ids: form.organizationalSide === 'academic' ? form.academicProgramIds : [],
        department_id: form.organizationalSide === 'non_academic' ? form.administrativeUnitId : null
      })

      if (res && (res.data || res.temporary_password)) {
        credentialHook.handleProvisioningSuccess(res, 'personnel')
      } else {
        onClose()
      }
    } catch (error) {
      const apiError = error?.response?.data?.error || error?.error || error || {}
      const mappedErrors = {}

      if (apiError.code === 'EMAIL_ALREADY_EXISTS') {
        mappedErrors.email = 'This institutional email is already reserved by an account.'
      } else if (apiError.code === 'INSTITUTIONAL_ID_ALREADY_EXISTS') {
        mappedErrors.institutionalId = 'This Institutional ID is already assigned to an account.'
      } else if (apiError.code === 'MISSING_ACADEMIC_AFFILIATION') {
        mappedErrors.collegeId = 'Academic Personnel require a college and at least one program.'
        mappedErrors.academicProgramIds = 'Select at least one academic program.'
      } else if (apiError.code === 'INVALID_PROGRAM_AFFILIATION') {
        mappedErrors.academicProgramIds = 'Every Academic Program must belong to the selected College.'
      } else if (['MISSING_DEPARTMENT', 'INVALID_DEPARTMENT', 'MISSING_ADMINISTRATIVE_UNIT', 'INVALID_ADMINISTRATIVE_UNIT'].includes(apiError.code)) {
        mappedErrors.administrativeUnitId = apiError.message || 'Select an active Department.'
      } else if (apiError.code === 'INVALID_PERSONNEL_CLASSIFICATION') {
        mappedErrors.classificationPair = apiError.message || 'Invalid classification combination.'
      } else if (apiError.code === 'INVALID_FACULTY_ENGAGEMENT') {
        mappedErrors.facultyEngagement = apiError.message || 'Invalid faculty engagement.'
      } else if (apiError.code === 'INVALID_EMPLOYMENT_STATUS') {
        mappedErrors.employmentStatus = apiError.message || 'Invalid employment status.'
      } else if (apiError.code === 'INVALID_EMPLOYMENT_START_DATE') {
        mappedErrors.employmentStartDate = apiError.message || 'Enter a valid employment start date.'
      } else if (apiError.code === 'CATALOG_CROSSOVER_REJECTED') {
        mappedErrors.currentRankTitle = apiError.message || 'Incompatible rank/title catalog.'
      } else if (apiError.code === 'POSITION_OCCUPIED') {
        const holder = apiError.current_holder
        const placement = holder?.placement?.name || 'this organizational placement'
        mappedErrors.positionTitle = 'Choose another job title.'
        mappedErrors.general = `Department Secretary position is already occupied. ${holder?.name || 'Another active personnel member'} currently holds this position in ${placement}. Only one active personnel member may hold this position at a time.`
      } else if (apiError.code === 'VALIDATION_FAILED' && apiError.fields) {
        if (apiError.fields.institutional_email) mappedErrors.email = apiError.fields.institutional_email
        if (apiError.fields.institutional_id) mappedErrors.institutionalId = apiError.fields.institutional_id
        if (apiError.fields.name) mappedErrors.firstName = apiError.fields.name
        if (apiError.fields.employment_start_date) mappedErrors.employmentStartDate = apiError.fields.employment_start_date
      } else {
        mappedErrors.general = apiError.message || error?.message || 'Personnel account was not created. Please retry or contact the system administrator.'
      }

      setErrors(mappedErrors)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
      {label}
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => {
          const value = key === 'institutionalId' ? e.target.value.replace(/\D/g, '').slice(0, 50) : e.target.value
          update(key, value)
          if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
        }}
        inputMode={key === 'institutionalId' ? 'numeric' : undefined}
        maxLength={key === 'institutionalId' ? 50 : key.toLowerCase().includes('name') ? 100 : 255}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
      />
      {errors[key] && <span id={`${key}-error`} role="alert" className="text-rose-600 block mt-0.5">{errors[key]}</span>}
    </label>
  )

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/50 z-50 transition-opacity ${credentialHook.isOpen || credentialHook.deliveryFault ? 'hidden' : ''}`} onClick={onClose} />
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${credentialHook.isOpen || credentialHook.deliveryFault ? 'hidden' : ''}`}>
        <form onSubmit={submit} className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto font-sans">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#064e2b] dark:text-emerald-400" />
                <span>Onboard Personnel Account</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Create an authoritative Personnel profile with institutional placement and Plan E rank recommendation.
              </p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition" aria-label="Close modal">
              <X className="w-4 h-4" />
            </button>
          </header>

          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {errors.general}
            </div>
          )}

          {masterData.error && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
              {masterData.error}
            </div>
          )}

          {/* Section A: Account Information */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span>A. Account Information</span>
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {field('Institutional ID', 'institutionalId', 'text', 'e.g. 20260042')}
              {field('Institutional Email', 'email', 'email', 'username@ndmu.edu.ph')}
              {field('First Name', 'firstName')}
              {field('Middle Name', 'middleName')}
              {field('Last Name', 'lastName')}
              {field('Suffix', 'suffix', 'text', 'Jr., III, etc.')}
            </div>
          </section>

          {/* Section B: Employment Classification */}
          <section className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#064e2b] dark:text-emerald-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>B. Employment Classification (Plans D1 &amp; D2)</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                Authoritative Master Data
              </span>
            </div>

            {/* Personnel Group & Side */}
            <div className="grid sm:grid-cols-2 gap-4 pt-1 border-t border-emerald-200/40 dark:border-emerald-800/40">
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
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="organizationalSide" checked={form.organizationalSide === 'non_academic'} onChange={() => setOrganizationalSide('non_academic')} />
                    <span>Non-Academic</span>
                  </label>
                </div>
              </fieldset>
            </div>
            {errors.classificationPair && <span className="text-xs text-rose-600 font-bold block">{errors.classificationPair}</span>}

            {/* Engagement & Employment Status */}
            <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-emerald-200/40 dark:border-emerald-800/40">
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
                      onChange={() => handleEngagementChange('full_time_faculty')}
                    />
                    <span>Full-time Faculty</span>
                  </label>
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="facultyEngagement"
                      checked={form.facultyEngagement === 'part_time_faculty'}
                      onChange={() => handleEngagementChange('part_time_faculty')}
                    />
                    <span>Part-time Faculty</span>
                  </label>
                </div>
                {errors.facultyEngagement && <span className="text-xs text-rose-600 font-bold block">{errors.facultyEngagement}</span>}
              </fieldset>

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
                {errors.employmentStatus && <span className="text-xs text-rose-600 font-bold block">{errors.employmentStatus}</span>}
              </fieldset>

              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 sm:col-span-2">
                Employment Start Date <span className="text-rose-600" aria-hidden="true">*</span>
                <input
                  type="date"
                  required
                  max={localToday()}
                  value={form.employmentStartDate}
                  onChange={event => update('employmentStartDate', event.target.value)}
                  aria-invalid={Boolean(errors.employmentStartDate)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="mt-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Official date employment at NDMU began.</span>
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

            {form.organizationalSide === 'academic' ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  College
                  <select
                    value={form.collegeId}
                    onChange={e => setCollege(e.target.value)}
                    disabled={masterData.loading}
                    className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
                  >
                    <option value="">{masterData.loading ? 'Loading Colleges...' : 'Select a College'}</option>
                    {effectiveColleges.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.code ? `${item.code} — ` : ''}{item.name}
                      </option>
                    ))}
                    {!masterData.loading && effectiveColleges.length === 0 && (
                      <option value="" disabled>No institutional colleges found</option>
                    )}
                  </select>
                  {errors.collegeId && <span className="text-rose-600 block mt-0.5 text-xs font-semibold">{errors.collegeId}</span>}
                </label>
                <fieldset className="space-y-1.5">
                  <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic Program Affiliations</legend>
                  <div className="grid sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                    {programs.map(program => (
                      <label key={program.id} className="text-xs font-medium flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer">
                        <input type="checkbox" checked={form.academicProgramIds.includes(program.id)} onChange={() => toggleProgram(program.id)} className="rounded" />
                        <span>{program.code ? `${program.code} — ` : ''}{program.name}</span>
                      </label>
                    ))}
                    {programs.length === 0 && (
                      <span className="text-xs text-slate-400 italic col-span-2 p-1">
                        {form.collegeId ? 'No programs found for selected college.' : 'Select a college to view academic programs.'}
                      </span>
                    )}
                  </div>
                  {errors.academicProgramIds && <span className="text-xs text-rose-600 block mt-0.5 font-semibold">{errors.academicProgramIds}</span>}
                </fieldset>
              </div>
            ) : (
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Department
                <select
                  value={form.administrativeUnitId}
                  onChange={e => update('administrativeUnitId', e.target.value)}
                  disabled={masterData.loading}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="">{masterData.loading ? 'Loading Departments...' : 'Select a Department'}</option>
                  {effectiveDepartments.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} — ` : ''}{item.name || item.unit_name}
                    </option>
                  ))}
                </select>
                {errors.administrativeUnitId && <span className="text-rose-600 block mt-0.5 text-xs font-semibold">{errors.administrativeUnitId}</span>}
              </label>
            )}

            {field('Position / Job Title (Appointment)', 'positionTitle', 'text', 'e.g. Instructor I, Assistant Dean')}
          </section>

          {/* Section D: Qualification & Academic Rank */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>D. Educational Qualification &amp; Academic Rank (Plan E)</span>
            </h3>

            {field('Educational Qualification Summary', 'qualificationSummary', 'text', 'e.g. MS in Computer Science (Ongoing PhD)')}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {form.facultyEngagement === 'part_time_faculty' ? 'Part-Time Faculty Title (Plan E Catalog)' : 'Current Academic Rank (Plan E Catalog)'}
                </label>
                {recommendation.isUserOverridden && form.currentRankTitle && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                    HR Override
                  </span>
                )}
              </div>
              <select
                value={form.currentRankTitle}
                onChange={e => {
                  const val = e.target.value
                  update('currentRankTitle', val)
                  setRecommendation(prev => ({ ...prev, isUserOverridden: Boolean(val) }))
                }}
                disabled={masterData.loading}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
              >
                <option value="">
                  {masterData.loading ? 'Loading Catalog...' : form.facultyEngagement === 'part_time_faculty' ? 'Select Part-Time Title' : 'Select Academic Rank'}
                </option>
                {currentRankCatalog.map(rank => (
                  <option key={rank.code || rank.label} value={rank.label}>
                    {rank.label} {rank.tier ? `(${rank.tier})` : ''}
                  </option>
                ))}
              </select>
              {recommendation.status === 'loading' && (
                <span className="text-[11px] text-slate-400 italic block mt-1">
                  Resolving preferred recommendation from Plan E...
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
                        onClick={() => {
                          update('currentRankTitle', recommendation.recommendedLabel)
                          setRecommendation(prev => ({ ...prev, isUserOverridden: false }))
                        }}
                        className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 underline cursor-pointer ml-2"
                      >
                        Use Suggested Rank
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                    Preferred initial rank based on the selected qualification. HR may change this if an existing official rank applies.
                  </p>
                </div>
              )}
              {recommendation.status === 'unresolved' && form.qualificationSummary.trim() && (
                <span className="text-[11px] text-slate-400 italic block mt-1">
                  No preferred rank could be determined from the current qualification data.
                </span>
              )}
              {errors.currentRankTitle && <span className="text-rose-600 block mt-0.5 text-xs font-semibold">{errors.currentRankTitle}</span>}
            </div>
          </section>

          <p className="text-[11px] text-slate-500">
            Governance roles are assigned separately. HR manages official engagement, status, position, rank, and institutional assignments; OSAD owns Program Coordinator and Organization Moderator assignments.
          </p>
          <footer className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
              Cancel
            </button>
            <button disabled={submitting} className="px-4 py-2 rounded-xl bg-[#176B43] text-white font-bold text-xs disabled:opacity-50 hover:bg-[#125333] transition flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating…' : 'Create Personnel'}</span>
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
