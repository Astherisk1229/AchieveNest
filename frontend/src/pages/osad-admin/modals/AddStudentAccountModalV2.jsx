import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Calendar, GraduationCap, Hash, LoaderCircle, Lock, Mail, RefreshCw, ShieldCheck, User, UserPlus, X } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../../hooks/useConfirmableClose'
import { useProvisioningCredential } from '../../../hooks/useProvisioningCredential'
import OneTimeCredentialModal from '../../../components/credentials/OneTimeCredentialModal'
import CredentialDeliveryFaultModal from '../../../components/credentials/CredentialDeliveryFaultModal'
import { fetchAcademicPrograms, fetchColleges } from '../../../services/collegeAdminService'
import provisioningService from '../../../services/provisioningService'
import {
  STUDENT_SEX_OPTIONS,
  STUDENT_SEX_SELECT_OPTIONS,
  STUDENT_SUFFIX_SELECT_OPTIONS,
  STUDENT_YEAR_LEVELS,
  getAcademicYearValues,
  getDefaultAcademicYear,
  isActiveAcademicReference,
  isValidStudentName,
  normalizeInstitutionalEmail,
  programBelongsToCollege,
  sanitizeStudentName,
  sanitizeStudentNumber
} from '../../../contracts/studentAccountContract'

const YEAR_LEVEL_OPTIONS = STUDENT_YEAR_LEVELS
const ACADEMIC_YEAR_OPTIONS = getAcademicYearValues()
const DEFAULT_ACADEMIC_YEAR = getDefaultAcademicYear()
const SEX_OPTIONS = STUDENT_SEX_SELECT_OPTIONS
const SUFFIX_OPTIONS = STUDENT_SUFFIX_SELECT_OPTIONS
const NAME_MAX_LENGTH = 255
const EMAIL_MAX_LENGTH = 255
const STUDENT_NUMBER_MAX_LENGTH = 50

const emptyForm = () => ({
  institutionalId: '',
  institutionalEmail: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  sex: '',
  collegeId: '',
  academicProgramId: '',
  yearLevel: '',
  academicYear: DEFAULT_ACADEMIC_YEAR
})

export default function AddStudentAccountModalV2({
  isOpen,
  onClose,
  onSubmit,
  colleges = [],
  degreePrograms = []
}) {
  const credentialHook = useProvisioningCredential()
  const [loadedColleges, setLoadedColleges] = useState(colleges)
  const [loadedPrograms, setLoadedPrograms] = useState(degreePrograms)
  const [isLoadingReferences, setIsLoadingReferences] = useState(false)
  const [referenceError, setReferenceError] = useState(null)
  const [referenceReloadKey, setReferenceReloadKey] = useState(0)
  const [formData, setFormData] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailAvailability, setEmailAvailability] = useState('empty')
  const availabilityRequestRef = useRef({ sequence: 0, controller: null })

  const refs = {
    institutionalId: useRef(null),
    institutionalEmail: useRef(null),
    firstName: useRef(null),
    middleName: useRef(null),
    lastName: useRef(null),
    suffix: useRef(null),
    sex: useRef(null),
    collegeId: useRef(null),
    academicProgramId: useRef(null),
    yearLevel: useRef(null),
    academicYear: useRef(null)
  }

  const focusFirstError = (errors) => {
    for (const key of Object.keys(refs)) {
      if (errors[key] && refs[key].current) {
        refs[key].current.focus()
        return
      }
    }
  }

  const resetForm = () => {
    availabilityRequestRef.current.controller?.abort()
    setFormData(emptyForm())
    setFieldErrors({})
    setServerError(null)
    setReferenceError(null)
    setIsSubmitting(false)
    setEmailAvailability('empty')
  }

  const isDirty = () => JSON.stringify(formData) !== JSON.stringify(emptyForm())
  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen,
    isDirty,
    onClose,
    onDiscard: resetForm
  })

  useEffect(() => {
    if (!isOpen) return
    resetForm()
    const timer = setTimeout(() => refs.institutionalId.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    const load = async () => {
      setIsLoadingReferences(true)
      setReferenceError(null)
      try {
        const [cols, progs] = await Promise.all([
          colleges.length ? colleges : fetchColleges({ status: 'active' }),
          degreePrograms.length ? degreePrograms : fetchAcademicPrograms()
        ])
        if (mounted) {
          setLoadedColleges((cols || []).filter(isActiveAcademicReference))
          setLoadedPrograms((progs || []).filter(isActiveAcademicReference))
        }
      } catch (error) {
        if (mounted) setReferenceError('Academic references could not be loaded.')
      } finally {
        if (mounted) setIsLoadingReferences(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [isOpen, colleges, degreePrograms, referenceReloadKey])

  const filteredPrograms = useMemo(() => {
    if (!formData.collegeId) return []
    return loadedPrograms.filter((program) => {
      return programBelongsToCollege(program, formData.collegeId)
    })
  }, [loadedPrograms, formData.collegeId])

  const normalizeForField = (field, value) => {
    if (field === 'institutionalId') return sanitizeStudentNumber(value).slice(0, STUDENT_NUMBER_MAX_LENGTH)
    if (field === 'institutionalEmail') return normalizeInstitutionalEmail(value).slice(0, EMAIL_MAX_LENGTH)
    if (['firstName', 'middleName', 'lastName'].includes(field)) return sanitizeStudentName(value).slice(0, NAME_MAX_LENGTH)
    return value
  }

  const handleInputChange = (field, rawValue) => {
    const value = normalizeForField(field, rawValue)
    setFormData(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => ({ ...prev, [field]: null }))
    setServerError(null)
    if (field === 'institutionalEmail') {
      availabilityRequestRef.current.controller?.abort()
      availabilityRequestRef.current.sequence += 1
      setEmailAvailability(value ? 'unchecked' : 'empty')
    }
  }

  const handleCollegeChange = (collegeId) => {
    setFormData(prev => ({ ...prev, collegeId, academicProgramId: '' }))
    setFieldErrors(prev => ({ ...prev, collegeId: null, academicProgramId: null }))
    setServerError(null)
  }

  const validateSingleField = (field, inputValue = formData[field]) => {
    const value = typeof inputValue === 'string' ? inputValue.trim() : inputValue
    switch (field) {
      case 'institutionalId':
        if (!value) return 'Student Number is required.'
        if (!/^[0-9]{5,50}$/.test(value)) return 'Student Number must contain 5 to 50 digits.'
        return null
      case 'institutionalEmail': {
        if (!value) return 'Institutional email is required.'
        const email = normalizeInstitutionalEmail(value)
        if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@ndmu\.edu\.ph$/.test(email)) return 'Enter a valid NDMU institutional email.'
        return null
      }
      case 'firstName':
        if (!isValidStudentName(value, true)) return 'Enter a valid first name.'
        return null
      case 'middleName':
        if (!isValidStudentName(value, false)) return 'Enter a valid middle name.'
        return null
      case 'lastName':
        if (!isValidStudentName(value, true)) return 'Enter a valid last name.'
        return null
      case 'sex':
        if (!STUDENT_SEX_OPTIONS.includes(value)) return 'Select a valid sex value.'
        return null
      case 'collegeId':
        if (!value) return 'Select an academic college.'
        if (!loadedColleges.some(c => String(c.id) === String(value))) return 'Selected academic college is unavailable.'
        return null
      case 'academicProgramId': {
        if (!value) return formData.collegeId ? 'Select an academic degree program.' : 'Select an academic college first.'
        if (!filteredPrograms.some(p => String(p.id) === String(value))) return 'Select a program assigned to the selected college.'
        return null
      }
      case 'yearLevel':
        if (!STUDENT_YEAR_LEVELS.includes(value)) return 'Select a valid year level.'
        return null
      case 'academicYear':
        if (!ACADEMIC_YEAR_OPTIONS.includes(value)) return 'Select a valid academic year.'
        return null
      default:
        return null
    }
  }

  const validateClient = () => {
    const errors = {}
    for (const key of ['institutionalId', 'institutionalEmail', 'firstName', 'middleName', 'lastName', 'sex', 'collegeId', 'academicProgramId', 'yearLevel', 'academicYear']) {
      const error = validateSingleField(key)
      if (error) errors[key] = error
    }
    return errors
  }

  const checkEmailAvailability = async () => {
    const email = normalizeInstitutionalEmail(formData.institutionalEmail)
    if (validateSingleField('institutionalEmail', email)) {
      setEmailAvailability(email ? 'invalid_syntax' : 'empty')
      return
    }
    const sequence = availabilityRequestRef.current.sequence + 1
    availabilityRequestRef.current.controller?.abort()
    const controller = new AbortController()
    availabilityRequestRef.current = { sequence, controller }
    setEmailAvailability('checking')
    try {
      const result = await provisioningService.checkAvailability('institutional_email', email, { signal: controller.signal })
      if (availabilityRequestRef.current.sequence !== sequence) return
      if (result.available) {
        setEmailAvailability('available')
      } else {
        const message = result.conflict_state === 'active'
          ? 'An account with this email already exists.'
          : 'This email is reserved by an inactive account. Restore that account instead of creating a duplicate.'
        setEmailAvailability('unavailable')
        setFieldErrors(prev => ({ ...prev, institutionalEmail: message }))
      }
    } catch (error) {
      if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED') setEmailAvailability('network_unknown')
    }
  }

  const clientErrors = validateClient()
  const formValid = Object.keys(clientErrors).length === 0
  const emailBlocksSubmit = ['checking', 'unavailable', 'invalid_syntax'].includes(emailAvailability)
  const canSubmit = formValid && !emailBlocksSubmit && !isSubmitting && !isLoadingReferences && !referenceError

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = validateClient()
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      focusFirstError(errors)
      return
    }

    setIsSubmitting(true)
    setServerError(null)
    setFieldErrors({})
    const payload = {
      institutional_id: formData.institutionalId.trim(),
      institutional_email: normalizeInstitutionalEmail(formData.institutionalEmail),
      first_name: formData.firstName.trim(),
      middle_name: formData.middleName.trim() || null,
      last_name: formData.lastName.trim(),
      suffix: formData.suffix || null,
      college_id: formData.collegeId,
      academic_program_id: formData.academicProgramId,
      year_level: formData.yearLevel,
      academic_year: formData.academicYear,
      sex: formData.sex
    }

    try {
      const response = onSubmit ? await onSubmit(payload) : await provisioningService.provisionManualStudent(payload)
      resetForm()
      if (response) credentialHook.handleProvisioningSuccess(response, 'student')
      else onClose()
    } catch (error) {
      const body = error?.response?.data || error
      const code = body?.error?.code || error?.code
      const fields = body?.error?.fields || {}
      const mapped = {
        ...(fields.institutional_email ? { institutionalEmail: fields.institutional_email } : {}),
        ...(fields.institutional_id ? { institutionalId: fields.institutional_id } : {}),
        ...(fields.college_id ? { collegeId: fields.college_id } : {}),
        ...(fields.academic_program_id ? { academicProgramId: fields.academic_program_id } : {}),
        ...(fields.year_level ? { yearLevel: fields.year_level } : {}),
        ...(fields.academic_year ? { academicYear: fields.academic_year } : {})
      }
      if (code === 'EMAIL_ALREADY_EXISTS') mapped.institutionalEmail = 'This institutional email is already assigned to an account.'
      if (code === 'INSTITUTIONAL_ID_ALREADY_EXISTS') mapped.institutionalId = 'This Student Number is already assigned to an account.'
      if (code === 'INVALID_INSTITUTIONAL_ID') mapped.institutionalId = body?.error?.message || 'Enter a valid Student Number.'
      if (code === 'INVALID_COLLEGE') mapped.collegeId = 'Selected academic college is inactive or invalid.'
      if (code === 'INVALID_ACADEMIC_PROGRAM' || code === 'ACADEMIC_PROGRAM_NOT_FOUND' || code === 'PROGRAM_COLLEGE_MISMATCH') mapped.academicProgramId = 'Select an active program assigned to the selected college.'
      if (Object.keys(mapped).length) {
        setFieldErrors(mapped)
        focusFirstError(mapped)
      } else {
        setServerError(body?.error?.message || error?.message || 'Failed to provision Student account.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const fieldClass = (key, extra = '') => `h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition duration-150 placeholder:text-slate-500 hover:border-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800 ${fieldErrors[key] ? 'border-red-500 focus:border-red-600 focus:ring-red-500/15' : 'border-slate-300 dark:border-slate-700 focus:border-emerald-600 focus:ring-emerald-600/20'} ${extra}`
  const ErrorText = ({ field }) => fieldErrors[field] ? <p id={`${field}-error`} role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{fieldErrors[field]}</p> : null
  const helperClass = 'mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400'
  const programLabel = (program) => `${program.code || 'Program'} — ${program.name}`

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-6 ${credentialHook.isOpen || credentialHook.deliveryFault ? 'hidden' : ''}`} role="dialog" aria-modal="true" aria-labelledby="add-student-title" aria-describedby="add-student-description" onClick={(e) => { if (e.target === e.currentTarget) requestClose() }}>
        <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/25 dark:bg-[#131e2e]">
          <div className="flex items-start justify-between gap-4 border-b border-emerald-900/10 bg-[#EFF7F0] px-5 py-4 sm:px-7 sm:py-5 dark:border-emerald-800/40 dark:bg-[#162720]">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#176B43] text-white shadow-sm"><UserPlus aria-hidden="true" className="h-5 w-5" /></div>
              <div className="min-w-0"><h2 id="add-student-title" className="text-lg font-extrabold tracking-[-0.02em] text-[#145C39] dark:text-white">Add Student Account</h2><p id="add-student-description" className="mt-1 max-w-2xl text-sm leading-relaxed text-[#245F42] dark:text-emerald-300">Create a validated academic record and secure first-login credentials.</p></div>
            </div>
            <button type="button" aria-label="Close dialog" onClick={requestClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800"><X aria-hidden="true" className="h-5 w-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-7">
              {serverError && <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{serverError}</div>}
              {referenceError && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"><span className="flex items-start gap-2.5"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{referenceError}</span><button type="button" onClick={() => setReferenceReloadKey(key => key + 1)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-bold text-amber-950 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"><RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />Retry</button></div>}

              <section className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 dark:border-slate-800"><User aria-hidden="true" className="h-4 w-4 text-emerald-700 dark:text-emerald-400" /><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Student Identity Information</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label htmlFor="student-number" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Student Number <span aria-hidden="true" className="text-red-600">*</span></label><div className="relative"><Hash aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="student-number" ref={refs.institutionalId} value={formData.institutionalId} onChange={e => handleInputChange('institutionalId', e.target.value)} onBlur={() => setFieldErrors(prev => ({ ...prev, institutionalId: validateSingleField('institutionalId') }))} inputMode="numeric" maxLength={STUDENT_NUMBER_MAX_LENGTH} aria-invalid={Boolean(fieldErrors.institutionalId)} aria-describedby={fieldErrors.institutionalId ? 'institutionalId-error' : 'student-number-help'} className={fieldClass('institutionalId', 'pl-9 tabular-nums')} placeholder="e.g. 202610492" /></div><ErrorText field="institutionalId" />{!fieldErrors.institutionalId && <p id="student-number-help" className={helperClass}>Digits only · 5–50 characters</p>}</div>
                  <div><label htmlFor="student-email" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Institutional Email <span aria-hidden="true" className="text-red-600">*</span></label><div className="relative"><Mail aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="student-email" ref={refs.institutionalEmail} type="email" value={formData.institutionalEmail} onChange={e => handleInputChange('institutionalEmail', e.target.value)} onBlur={() => { const err = validateSingleField('institutionalEmail'); setFieldErrors(prev => ({ ...prev, institutionalEmail: err })); if (!err) checkEmailAvailability() }} maxLength={EMAIL_MAX_LENGTH} aria-invalid={Boolean(fieldErrors.institutionalEmail)} aria-describedby={fieldErrors.institutionalEmail ? 'institutionalEmail-error' : 'student-email-help'} className={fieldClass('institutionalEmail', 'pl-9')} placeholder="student@ndmu.edu.ph" /></div><ErrorText field="institutionalEmail" />{!fieldErrors.institutionalEmail && emailAvailability === 'checking' && <p className={helperClass}>Checking availability…</p>}{!fieldErrors.institutionalEmail && emailAvailability === 'available' && <p className="mt-1.5 text-xs font-medium text-emerald-700">Email is available.</p>}{!fieldErrors.institutionalEmail && emailAvailability === 'network_unknown' && <p className="mt-1.5 text-xs text-amber-700">Availability check unavailable; the server will verify on submit.</p>}{!fieldErrors.institutionalEmail && !['checking', 'available', 'network_unknown'].includes(emailAvailability) && <p id="student-email-help" className={helperClass}>Use your institutional @ndmu.edu.ph address</p>}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><label htmlFor="student-first-name" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">First Name <span aria-hidden="true" className="text-red-600">*</span></label><input id="student-first-name" ref={refs.firstName} value={formData.firstName} onChange={e => handleInputChange('firstName', e.target.value)} onBlur={() => setFieldErrors(prev => ({ ...prev, firstName: validateSingleField('firstName') }))} maxLength={NAME_MAX_LENGTH} aria-invalid={Boolean(fieldErrors.firstName)} aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined} className={fieldClass('firstName')} /><ErrorText field="firstName" /></div>
                  <div><label htmlFor="student-middle-name" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Middle Name <span className="font-normal text-slate-500">(Optional)</span></label><input id="student-middle-name" ref={refs.middleName} value={formData.middleName} onChange={e => handleInputChange('middleName', e.target.value)} onBlur={() => setFieldErrors(prev => ({ ...prev, middleName: validateSingleField('middleName') }))} maxLength={NAME_MAX_LENGTH} aria-invalid={Boolean(fieldErrors.middleName)} aria-describedby={fieldErrors.middleName ? 'middleName-error' : undefined} className={fieldClass('middleName')} /><ErrorText field="middleName" /></div>
                  <div><label htmlFor="student-last-name" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Last Name <span aria-hidden="true" className="text-red-600">*</span></label><input id="student-last-name" ref={refs.lastName} value={formData.lastName} onChange={e => handleInputChange('lastName', e.target.value)} onBlur={() => setFieldErrors(prev => ({ ...prev, lastName: validateSingleField('lastName') }))} maxLength={NAME_MAX_LENGTH} aria-invalid={Boolean(fieldErrors.lastName)} aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined} className={fieldClass('lastName')} /><ErrorText field="lastName" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label htmlFor="student-suffix" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Name Suffix <span className="font-normal text-slate-500">(Optional)</span></label><select id="student-suffix" ref={refs.suffix} value={formData.suffix} onChange={e => handleInputChange('suffix', e.target.value)} className={fieldClass('suffix')}>{SUFFIX_OPTIONS.map(opt => <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>)}</select></div>
                  <div><label htmlFor="student-sex" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Sex <span aria-hidden="true" className="text-red-600">*</span></label><select id="student-sex" ref={refs.sex} value={formData.sex} onChange={e => handleInputChange('sex', e.target.value)} onBlur={() => setFieldErrors(prev => ({ ...prev, sex: validateSingleField('sex') }))} aria-invalid={Boolean(fieldErrors.sex)} aria-describedby={fieldErrors.sex ? 'sex-error' : undefined} className={fieldClass('sex')}>{SEX_OPTIONS.map(opt => <option key={opt.value || 'placeholder'} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}</select><ErrorText field="sex" /></div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 dark:border-slate-800"><GraduationCap aria-hidden="true" className="h-4 w-4 text-emerald-700 dark:text-emerald-400" /><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Academic Placement &amp; Enrollment</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label htmlFor="academic-college" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Academic College <span aria-hidden="true" className="text-red-600">*</span></label><select id="academic-college" ref={refs.collegeId} value={formData.collegeId} onChange={e => handleCollegeChange(e.target.value)} onBlur={() => setFieldErrors(prev => ({ ...prev, collegeId: validateSingleField('collegeId') }))} disabled={isLoadingReferences || Boolean(referenceError)} aria-invalid={Boolean(fieldErrors.collegeId)} aria-describedby={fieldErrors.collegeId ? 'collegeId-error' : undefined} className={fieldClass('collegeId')}><option value="" disabled>{isLoadingReferences ? 'Loading colleges…' : 'Select Academic College'}</option>{loadedColleges.map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ''}{c.name}</option>)}</select><ErrorText field="collegeId" /></div>
                  <div><label htmlFor="academic-program" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Academic Degree Program <span aria-hidden="true" className="text-red-600">*</span></label><SearchableSelect id="academic-program" ref={refs.academicProgramId} value={formData.academicProgramId} options={filteredPrograms} onChange={value => handleInputChange('academicProgramId', value)} disabled={!formData.collegeId || isLoadingReferences || Boolean(referenceError)} placeholder={isLoadingReferences ? 'Loading programs…' : !formData.collegeId ? 'Select a College first' : filteredPrograms.length ? 'Search or select a program' : 'No active programs available'} searchPlaceholder="Search by program code or name" getOptionLabel={programLabel} getOptionValue={program => program.id} emptyMessage={filteredPrograms.length ? 'No matching programs' : 'No active programs available for this college'} aria-invalid={Boolean(fieldErrors.academicProgramId)} aria-describedby={fieldErrors.academicProgramId ? 'academicProgramId-error' : 'academic-program-help'} /><ErrorText field="academicProgramId" />{!fieldErrors.academicProgramId && <p id="academic-program-help" className={helperClass}>{formData.collegeId ? 'Choose an official active program for this College' : 'Select a College first'}</p>}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label htmlFor="student-year-level" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Current Year Level <span aria-hidden="true" className="text-red-600">*</span></label><select id="student-year-level" ref={refs.yearLevel} value={formData.yearLevel} onChange={e => handleInputChange('yearLevel', e.target.value)} onBlur={() => setFieldErrors(prev => ({ ...prev, yearLevel: validateSingleField('yearLevel') }))} aria-invalid={Boolean(fieldErrors.yearLevel)} aria-describedby={fieldErrors.yearLevel ? 'yearLevel-error' : undefined} className={fieldClass('yearLevel')}><option value="" disabled>Select Year Level</option>{YEAR_LEVEL_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}</select><ErrorText field="yearLevel" /></div>
                  <div><label htmlFor="student-academic-year" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Academic Year <span aria-hidden="true" className="text-red-600">*</span></label><div className="relative"><Calendar aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select id="student-academic-year" ref={refs.academicYear} value={formData.academicYear} onChange={e => handleInputChange('academicYear', e.target.value)} className={fieldClass('academicYear', 'pl-9')}>{ACADEMIC_YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}</select></div><ErrorText field="academicYear" /></div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 dark:border-slate-800"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-700 dark:text-emerald-400" /><h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Account Security &amp; Credentials</h3></div>
                <div className="flex gap-3 rounded-xl bg-emerald-50/80 p-4 dark:bg-emerald-950/30"><Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" /><div><p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">Secure first-login setup</p><p className="mt-1 text-xs leading-relaxed text-emerald-900 dark:text-emerald-300">The Student record begins <strong>Active/Enrolled</strong>. A secure temporary credential is generated, while authentication remains <strong>Pending First Login</strong> until the Student sets a permanent password.</p></div></div>
              </section>
            </div>

            <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:px-7 dark:border-slate-800 dark:bg-slate-900"><Button type="button" variant="secondary" onClick={requestClose} disabled={isSubmitting}>Cancel</Button><Button type="submit" disabled={!canSubmit} className="min-w-48">{isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <UserPlus aria-hidden="true" className="h-4 w-4" />}{isSubmitting ? 'Creating…' : 'Create Student Account'}</Button></div>
          </form>
        </div>
      </div>

      <ConfirmDialog open={isConfirmOpen} title="Discard Student Account Changes?" message="Are you sure you want to close? Your unsaved Student account draft will be lost." confirmLabel="Discard Changes" cancelLabel="Keep Editing" onConfirm={confirmDiscard} onCancel={cancelDiscard} />
      <OneTimeCredentialModal isOpen={credentialHook.isOpen} credential={credentialHook.credential} hasCopied={credentialHook.hasCopied} hasPrinted={credentialHook.hasPrinted} copyFeedback={credentialHook.copyFeedback} onCopy={credentialHook.handleCopy} onPrint={credentialHook.handlePrint} isPrintPrepared={credentialHook.printHook.isPrintPrepared} printedAtLabel={credentialHook.printHook.printedAtLabel} printAttemptCount={credentialHook.printHook.printAttemptCount} onRequestClose={() => credentialHook.requestClose(() => onClose())} isConfirmDiscardOpen={credentialHook.isConfirmDiscardOpen} onConfirmDiscard={() => credentialHook.confirmDiscard(() => onClose())} onCancelDiscard={credentialHook.cancelDiscard} />
      <CredentialDeliveryFaultModal isOpen={Boolean(credentialHook.deliveryFault)} fault={credentialHook.deliveryFault} onRefreshAndClose={() => credentialHook.clearDeliveryFault(() => onClose())} />
    </>
  )
}
