import React, { useState, useEffect, useMemo } from 'react'
import { X, Check, ShieldCheck, Briefcase, GraduationCap, Building2, Sparkles } from 'lucide-react'
import { validatePersonnelMasterData, validatePersonnelPlacement, isAcademicPersonnel } from '../../../utils/personnelPlacement'
import { personnelMasterDataService } from '../../../services/personnelMasterDataService'
import { personnelRankRecommendationService } from '../../../services/personnelRankRecommendationService'

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

  // Master Data Catalogs State
  const [catalogs, setCatalogs] = useState({
    fullTimeRanks: [],
    partTimeTitles: [],
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

    Promise.all([
      personnelMasterDataService.getFacultyRanks(),
      personnelMasterDataService.getPartTimeTitles()
    ]).then(([ftRanks, ptTitles]) => {
      if (isMounted) {
        setCatalogs({
          fullTimeRanks: ftRanks || [],
          partTimeTitles: ptTitles || [],
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

  const programs = useMemo(
    () => (placementOptions.academicPrograms || []).filter(program => String(program.collegeId) === String(form.collegeId)),
    [placementOptions.academicPrograms, form.collegeId]
  )

  useEffect(() => {
    if (!personnel) return
    const engagement = personnel.faculty_engagement || 'full_time_faculty'
    const rankTitle = personnel.current_rank_title || personnel.academic_rank || ''
    setSavedOfficialRank(rankTitle)
    setRankWasManuallyChanged(false)
    setRankSelectionSource('saved')
    setForm({
      facultyEngagement: engagement,
      employmentStatus: personnel.employment_status || 'permanent',
      positionTitle: personnel.position_title || personnel.designation || '',
      currentRankTitle: rankTitle,
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

  const isPartTime = form.facultyEngagement === 'part_time_faculty'

  // Current Rank/Title Options based on Faculty Engagement
  const currentRankCatalog = useMemo(() => {
    if (isPartTime) {
      return (catalogs.partTimeTitles && catalogs.partTimeTitles.length > 0)
        ? catalogs.partTimeTitles
        : [
            { code: 'PT_PROFESSORIAL_LECTURER', label: 'Professorial Lecturer' },
            { code: 'PT_ASSISTANT_PROFESSORIAL_LECTURER', label: 'Assistant Professorial Lecturer' },
            { code: 'PT_SENIOR_LECTURER', label: 'Senior Lecturer' },
            { code: 'PT_LECTURER', label: 'Lecturer' }
          ]
    }
    return (catalogs.fullTimeRanks && catalogs.fullTimeRanks.length > 0)
      ? catalogs.fullTimeRanks
      : [
          { code: 'INSTRUCTOR_I', label: 'Instructor I' },
          { code: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor' },
          { code: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
          { code: 'PROFESSOR_I', label: 'Professor I' },
          { code: 'UNIVERSITY_PROFESSOR', label: 'University Professor' }
        ]
  }, [isPartTime, catalogs.fullTimeRanks, catalogs.partTimeTitles])

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

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleEngagementChange = (engagement) => {
    setForm(current => {
      const newIsPartTime = engagement === 'part_time_faculty'
      const ptLabels = ['Professorial Lecturer', 'Assistant Professorial Lecturer', 'Senior Lecturer', 'Lecturer', 'PT_PROFESSORIAL_LECTURER', 'PT_ASSISTANT_PROFESSORIAL_LECTURER', 'PT_SENIOR_LECTURER', 'PT_LECTURER']
      const isCurrentlyPt = ptLabels.some(l => l.toLowerCase() === (current.currentRankTitle || '').toLowerCase())

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
      if (apiError.code === 'CATALOG_CROSSOVER_REJECTED') {
        setErrors({ currentRankTitle: apiError.message || 'Incompatible rank/title catalog.' })
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

          {/* Section A: Account Information (Read-Only Summary) */}
          <section className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              A. Account Identity
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{personnel.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institutional ID</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{personnel.institutional_id || personnel.employee_id || 'N/A'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Institutional Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{personnel.institutional_email || personnel.email || 'N/A'}</span>
              </div>
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
              {/* Engagement */}
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Faculty Engagement (Workload)
                </legend>
                <div className="flex gap-3">
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editFacultyEngagement"
                      checked={form.facultyEngagement === 'full_time_faculty'}
                      onChange={() => handleEngagementChange('full_time_faculty')}
                    />
                    <span>Full-time Faculty</span>
                  </label>
                  <label className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editFacultyEngagement"
                      checked={form.facultyEngagement === 'part_time_faculty'}
                      onChange={() => handleEngagementChange('part_time_faculty')}
                    />
                    <span>Part-time Faculty</span>
                  </label>
                </div>
                {errors.facultyEngagement && <span className="text-xs text-rose-600 font-bold block">{errors.facultyEngagement}</span>}
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
                <fieldset className="space-y-1.5">
                  <legend className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic Program Affiliations</legend>
                  <div className="grid sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                    {programs.map(program => (
                      <label key={program.id} className="text-xs font-medium flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.academicProgramIds.includes(program.id)}
                          onChange={() => {
                            const id = program.id
                            setForm(curr => ({
                              ...curr,
                              academicProgramIds: curr.academicProgramIds.includes(id)
                                ? curr.academicProgramIds.filter(p => p !== id)
                                : [...curr.academicProgramIds, id]
                            }))
                          }}
                          className="rounded"
                        />
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
                  disabled={catalogs.loading}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium"
                >
                  <option value="">Select a Department</option>
                  {(placementOptions.administrativeUnits || []).map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} — ` : ''}{item.name || item.unit_name}
                    </option>
                  ))}
                </select>
                {errors.administrativeUnitId && <span className="text-rose-600 block mt-0.5 text-xs font-semibold">{errors.administrativeUnitId}</span>}
              </label>
            )}

            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Position / Job Title (Appointment)
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
              <span>D. Educational Qualification &amp; Academic Rank (Plan E)</span>
            </h3>

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

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isPartTime ? 'Part-Time Faculty Title (Plan E)' : 'Current Academic Rank (Plan E)'}
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
                  {catalogs.loading ? 'Loading Catalog...' : isPartTime ? 'Select Part-Time Title' : 'Select Academic Rank'}
                </option>
                {/* Preservation of legacy/saved rank if not in standard catalog */}
                {!isSavedRankInCatalog && form.currentRankTitle && (
                  <option value={form.currentRankTitle}>
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

