import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Building2, ChevronRight, GraduationCap, LoaderCircle, Pencil, Plus, Search, ShieldCheck, UserPlus, X } from 'lucide-react'
import OSADPageHeader from '../../components/osad/OSADPageHeader'
import { OSADEmptyState } from '../../components/osad/OSADStateBlock'
import AddStudentAccountModal from './modals/AddStudentAccountModal'
import CreateProgramModal from './modals/CreateProgramModal'
import EditProgramModal from './modals/EditProgramModal'
import OSADCoordinatorManagerView from './OSADCoordinatorManagerView'
import { createAcademicProgram, getCollegeLogoUrl, updateAcademicProgram } from '../../services/collegeAdminService'
import { provisioningService } from '../../services/provisioningService'

export function filterStudentsByProgram(students, programId) {
  if (!programId || programId === 'all') return students
  return students.filter((student) => String(student.academic_program_id || '') === String(programId))
}

export default function OSADAcademicProgramsPage({
  colleges = [],
  academicPrograms = [],
  onProgramsChanged = null,
  showToast = null,
  selectedCollegeId: externalSelectedCollegeId,
  onSelectCollege = null,
  selectedProgramId: externalSelectedProgramId,
  onSelectProgram = null,
  onViewStudent = null
}) {
  const [internalSelectedCollegeId, setInternalSelectedCollegeId] = useState(null)
  const selectedCollegeId = externalSelectedCollegeId === undefined ? internalSelectedCollegeId : externalSelectedCollegeId
  const updateSelectedCollege = (collegeId) => {
    if (onSelectCollege) onSelectCollege(collegeId)
    else setInternalSelectedCollegeId(collegeId)
  }
  const [search, setSearch] = useState('')
  const [internalSelectedProgramId, setInternalSelectedProgramId] = useState('all')
  const selectedProgramId = externalSelectedProgramId === undefined ? internalSelectedProgramId : externalSelectedProgramId
  const previousCollegeId = useRef(selectedCollegeId)
  const updateSelectedProgram = (programId) => {
    if (onSelectProgram) onSelectProgram(programId)
    else setInternalSelectedProgramId(programId)
  }
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [savingProgramId, setSavingProgramId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [isManagingCoordinators, setIsManagingCoordinators] = useState(false)
  const [collegeStudents, setCollegeStudents] = useState([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [studentsReloadKey, setStudentsReloadKey] = useState(0)
  const [viewingStudent, setViewingStudent] = useState(null)
  const isProgramActive = (program) => !program.status || program.status === 'active'
  const selectedCollege = colleges.find((college) => college.id === selectedCollegeId) || null
  const collegePrograms = useMemo(() => academicPrograms
    .filter((program) => program.collegeId === selectedCollegeId || program.college_id === selectedCollegeId)
    .sort((a, b) => `${a.name || ''}`.localeCompare(`${b.name || ''}`)), [academicPrograms, selectedCollegeId])
  const selectedProgram = collegePrograms.find((program) => String(program.id) === String(selectedProgramId)) || null
  const collegeHasActivePrograms = collegePrograms.some(isProgramActive)
  const canAddStudent = selectedProgramId === 'all' ? collegeHasActivePrograms : Boolean(selectedProgram && isProgramActive(selectedProgram))
  const filteredColleges = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return colleges
    return colleges.filter((college) => `${college.name || ''} ${college.code || ''}`.toLowerCase().includes(query))
  }, [colleges, search])
  const visibleStudents = useMemo(
    () => filterStudentsByProgram(collegeStudents, selectedProgramId),
    [collegeStudents, selectedProgramId]
  )

  useEffect(() => {
    if (previousCollegeId.current !== selectedCollegeId) {
      previousCollegeId.current = selectedCollegeId
      if (externalSelectedProgramId === undefined) setInternalSelectedProgramId('all')
      else onSelectProgram?.('all')
    }
  // Reset the program filter when navigating between colleges.
  }, [selectedCollegeId, externalSelectedProgramId, onSelectProgram])

  useEffect(() => {
    if (!selectedCollegeId) {
      setCollegeStudents([])
      return undefined
    }
    const controller = new AbortController()
    let active = true
    const loadCollegeStudents = async () => {
      setIsLoadingStudents(true)
      setStudentsError('')
      try {
        const firstPage = await provisioningService.fetchStudentsPage(
          { college_id: selectedCollegeId, page: 1, per_page: 100 },
          { signal: controller.signal }
        )
        const allStudents = firstPage?.students || []
        const total = Number(firstPage?.total || 0)
        const pageSize = Number(firstPage?.per_page || 100)
        for (let page = 2; allStudents.length < total && pageSize > 0; page += 1) {
          const nextPage = await provisioningService.fetchStudentsPage(
            { college_id: selectedCollegeId, page, per_page: pageSize },
            { signal: controller.signal }
          )
          const nextStudents = nextPage?.students || []
          if (!nextStudents.length) break
          allStudents.push(...nextStudents)
        }
        if (active) setCollegeStudents(allStudents)
      } catch (error) {
        if (active && error?.code !== 'ERR_CANCELED' && error?.name !== 'CanceledError') {
          setStudentsError(error?.response?.data?.error?.message || error?.message || 'Student list could not be loaded.')
        }
      } finally {
        if (active) setIsLoadingStudents(false)
      }
    }
    loadCollegeStudents()
    return () => { active = false; controller.abort() }
  }, [selectedCollegeId, studentsReloadKey])

  const handleAddStudent = async (payload) => {
    const result = await provisioningService.provisionManualStudent(payload)
    setStudentsReloadKey((key) => key + 1)
    showToast?.(`Student account created for ${payload.first_name} ${payload.last_name}.`)
    return result
  }

  const handleCreateProgram = async (payload) => {
    await createAcademicProgram(payload)
    await onProgramsChanged?.()
    showToast?.('Program added successfully.')
  }

  const handleToggleProgram = async (program) => {
    setSavingProgramId(program.id)
    setActionError('')
    try {
      await updateAcademicProgram(program.id, { status: isProgramActive(program) ? 'inactive' : 'active' })
      await onProgramsChanged?.()
      showToast?.(isProgramActive(program) ? 'Program disabled.' : 'Program enabled.')
    } catch (error) {
      setActionError(error?.response?.data?.error?.message || error?.message || 'Could not update this program.')
    } finally {
      setSavingProgramId(null)
    }
  }

  if (selectedCollege && isManagingCoordinators) {
    return <OSADCoordinatorManagerView
      collegeId={selectedCollege.id}
      fallbackCollege={selectedCollege}
      onBack={() => setIsManagingCoordinators(false)}
      onAssignmentsUpdated={() => onProgramsChanged?.()}
    />
  }

  return (
    <div className="space-y-5 font-sans">
      {selectedCollege ? (
        <>
          <button
            type="button"
            onClick={() => { updateSelectedCollege(null); setSearch('') }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to colleges
          </button>
          <OSADPageHeader
            title={`${selectedCollege.code ? `${selectedCollege.code} — ` : ''}${selectedCollege.name}`}
            description="View students enrolled in this college by program. OSAD can add student accounts here."
            icon={Building2}
            secondaryActions={(
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsManagingCoordinators(true)}
                  disabled={selectedCollege.status && selectedCollege.status !== 'active'}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-slate-800"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Manage Program Coordinators
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  disabled={!(selectedCollege.status === undefined || selectedCollege.status === null || selectedCollege.status === 'active') || !canAddStudent}
                  title={!canAddStudent ? (selectedProgram ? 'Enable this program before adding students to it.' : 'Add or enable a program before adding students.') : undefined}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Add student
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddProgramOpen(true)}
                  disabled={selectedCollege.status && selectedCollege.status !== 'active'}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add program
                </button>
              </div>
            )}
          />
          {actionError && <p role="alert" className="text-sm font-medium text-rose-700 dark:text-rose-300">{actionError}</p>}
          <section aria-label="Program selection" className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <label className="block min-w-0 flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Program
                <select
                  value={selectedProgramId}
                  onChange={(event) => updateSelectedProgram(event.target.value)}
                  aria-label="Filter students by program"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="all">All programs</option>
                  {collegePrograms.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.code ? `${program.code} — ` : ''}{program.name}{isProgramActive(program) ? '' : ' (Disabled)'}
                    </option>
                  ))}
                </select>
              </label>
              {selectedProgram && (
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 xl:min-w-[min(100%,38rem)] xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{selectedProgram.name}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {[selectedProgram.code, selectedProgram.status || 'active', `${visibleStudents.length} ${visibleStudents.length === 1 ? 'student' : 'students'}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditingProgram(selectedProgram); setActionError('') }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit program
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleProgram(selectedProgram)}
                      disabled={savingProgramId === selectedProgram.id}
                      className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-wait disabled:opacity-60 dark:text-emerald-300 dark:hover:bg-slate-800"
                    >
                      {savingProgramId === selectedProgram.id ? 'Saving…' : isProgramActive(selectedProgram) ? 'Disable program' : 'Enable program'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
          <section aria-labelledby="college-students-heading" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="college-students-heading" className="text-lg font-semibold text-slate-900 dark:text-white">Students</h2>
              {!isLoadingStudents && !studentsError && <p className="text-sm text-slate-600 dark:text-slate-300">{visibleStudents.length} {visibleStudents.length === 1 ? 'student' : 'students'}</p>}
            </div>
            {isLoadingStudents ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Loading students…
              </div>
            ) : studentsError ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200" role="alert">
                <span>{studentsError}</span>
                <button type="button" onClick={() => setStudentsReloadKey((key) => key + 1)} className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100 dark:border-rose-800 dark:hover:bg-rose-900/40">Retry</button>
              </div>
            ) : visibleStudents.length ? (
              <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
                {visibleStudents.map((student) => {
                  const studentProgram = collegePrograms.find((program) => String(program.id) === String(student.academic_program_id))
                  const studentProgramName = student.program_name || student.program || studentProgram?.name || 'No active enrollment'
                  const studentProgramCode = student.program_code || studentProgram?.code
                  return (
                    <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}</p>
                        <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-300">{student.institutional_id || 'No student ID'} · {student.year_level || 'Year level not recorded'} · {student.status || 'active'}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-right text-sm text-slate-600 dark:text-slate-300">
                          <span className="block font-medium text-slate-900 dark:text-white">{studentProgramName}</span>
                          {studentProgramCode && <span className="block text-xs">{studentProgramCode}</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => onViewStudent ? onViewStudent(student) : setViewingStudent(student)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          View details
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <OSADEmptyState
                icon={GraduationCap}
                title={selectedProgram ? 'No students in this program' : 'No students in this college'}
                description={selectedProgram ? 'Students assigned to this program will appear here.' : 'Students enrolled in this college will appear here.'}
              />
            )}
          </section>
          <CreateProgramModal
            isOpen={isAddProgramOpen}
            onClose={() => setIsAddProgramOpen(false)}
            onSubmit={handleCreateProgram}
            colleges={colleges}
            initialCollegeId={selectedCollegeId}
          />
          <EditProgramModal
            isOpen={Boolean(editingProgram)}
            onClose={() => setEditingProgram(null)}
            program={editingProgram}
            college={selectedCollege}
            onSuccess={() => { onProgramsChanged?.(); showToast?.('Program updated successfully.') }}
          />
          <AddStudentAccountModal
            isOpen={isAddStudentOpen}
            onClose={() => setIsAddStudentOpen(false)}
            initialCollegeId={selectedCollegeId}
            initialProgramId={selectedProgramId === 'all' ? '' : selectedProgramId}
            onSubmit={handleAddStudent}
          />
          {viewingStudent && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="college-student-details-title"
              onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingStudent(null) }}
            >
              <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <header className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 id="college-student-details-title" className="truncate text-lg font-bold text-slate-900 dark:text-white">{viewingStudent.full_name || `${viewingStudent.first_name || ''} ${viewingStudent.last_name || ''}`.trim()}</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{viewingStudent.institutional_id || 'No student ID'}</p>
                  </div>
                  <button type="button" onClick={() => setViewingStudent(null)} aria-label="Close student details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
                </header>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-xs font-semibold text-slate-500">Email</dt><dd className="mt-1 break-all text-sm text-slate-900 dark:text-white">{viewingStudent.email || '—'}</dd></div>
                  <div><dt className="text-xs font-semibold text-slate-500">Program</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{viewingStudent.program_name || viewingStudent.program || collegePrograms.find((program) => String(program.id) === String(viewingStudent.academic_program_id))?.name || 'No active enrollment'}</dd></div>
                  <div><dt className="text-xs font-semibold text-slate-500">Year level</dt><dd className="mt-1 text-sm text-slate-900 dark:text-white">{viewingStudent.year_level || 'Not recorded'}</dd></div>
                  <div><dt className="text-xs font-semibold text-slate-500">Account status</dt><dd className="mt-1 text-sm capitalize text-slate-900 dark:text-white">{viewingStudent.status || 'active'}</dd></div>
                </dl>
              </section>
            </div>
          )}
        </>
      ) : (
        <>
          <OSADPageHeader
            title="College and Programs"
            description="Browse colleges and manage the academic programs under each one. HR maintains colleges and departments."
            icon={Building2}
          />
          <label className="relative block max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search colleges"
              aria-label="Search colleges"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
          {filteredColleges.length ? (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
              {filteredColleges.map((college) => {
                const count = academicPrograms.filter((program) => program.collegeId === college.id || program.college_id === college.id).length
                const logoUrl = college.has_logo || college.logo_storage_key
                  ? `${getCollegeLogoUrl(college.id)}?v=${encodeURIComponent(college.logo_updated_at || '')}`
                  : null
                return (
                  <li key={college.id}>
                    <button
                      type="button"
                      onClick={() => { updateSelectedCollege(college.id); setSearch('') }}
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 dark:hover:bg-slate-800"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-300">
                          {logoUrl ? (
                            <>
                              <Building2 aria-hidden="true" className="h-5 w-5" />
                              <img
                                src={logoUrl}
                                alt={`${college.name} logo`}
                                className="absolute inset-0 h-full w-full bg-white object-contain p-1 dark:bg-slate-900"
                                onError={(event) => { event.currentTarget.hidden = true }}
                              />
                            </>
                          ) : (
                            <span className="text-xs font-bold" aria-label={`${college.code || 'College'} logo unavailable`}>
                              {college.code?.slice(0, 3) || <Building2 aria-hidden="true" className="h-5 w-5" />}
                            </span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900 dark:text-white">{college.name}</span>
                          <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{college.code} · {count} {count === 1 ? 'program' : 'programs'} · {college.status || 'Active'}</span>
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-500" />
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <OSADEmptyState icon={Building2} title={search ? 'No colleges found' : 'No colleges available'} description={search ? 'Try a different search.' : 'College records managed by HR will appear here.'} />
          )}
        </>
      )}
    </div>
  )
}
