import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  UserPlus,
  X,
  GraduationCap,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Lock,
  Mail,
  User,
  Hash,
  LoaderCircle
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { SearchableSelect } from '../../../components/ui/SearchableSelect'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useConfirmableClose } from '../../../hooks/useConfirmableClose'
import { useProvisioningCredential } from '../../../hooks/useProvisioningCredential'
import OneTimeCredentialModal from '../../../components/credentials/OneTimeCredentialModal'
import CredentialDeliveryFaultModal from '../../../components/credentials/CredentialDeliveryFaultModal'
import { fetchColleges, fetchAcademicPrograms } from '../../../services/collegeAdminService'
import { provisioningService } from '../../../services/provisioningService'
import {
  STUDENT_YEAR_LEVELS,
  STUDENT_SEX_OPTIONS,
  STUDENT_SEX_SELECT_OPTIONS,
  STUDENT_YEAR_LEVEL_SELECT_OPTIONS,
  getAcademicYearValues,
  getDefaultAcademicYear,
  STUDENT_SUFFIX_OPTIONS
} from '../../../contracts/studentAccountContract'
import {
  filterPrograms,
  getProgramCollegeId,
  getProgramLabel,
  isActiveReference,
  isInstitutionalEmail,
  normalizeInstitutionalEmail,
  sanitizePersonName,
  sanitizeStudentNumber
} from '../../../utils/studentRegistrationValidation'

const ACADEMIC_YEAR_OPTIONS = getAcademicYearValues()
const DEFAULT_ACADEMIC_YEAR = getDefaultAcademicYear()
const SEX_OPTIONS = STUDENT_SEX_SELECT_OPTIONS

export default function AddStudentAccountModal({
  isOpen,
  onClose,
  onSubmit,
  colleges = [],
  degreePrograms = []
}) {
  const [loadedColleges, setLoadedColleges] = useState(colleges)
  const [loadedPrograms, setLoadedPrograms] = useState(degreePrograms)
  const [isLoadingReferences, setIsLoadingReferences] = useState(false)
  const [referenceError, setReferenceError] = useState('')

  const credentialHook = useProvisioningCredential()

  // Field Refs for First Invalid Field Focus Management
  const instIdRef = useRef(null)
  const emailRef = useRef(null)
  const firstNameRef = useRef(null)
  const middleNameRef = useRef(null)
  const lastNameRef = useRef(null)
  const suffixRef = useRef(null)
  const sexRef = useRef(null)
  const collegeRef = useRef(null)
  const programRef = useRef(null)
  const yearLevelRef = useRef(null)
  const academicYearRef = useRef(null)
  const firstInputRef = instIdRef

  const fieldRefOrder = [
    { key: 'institutionalId', ref: instIdRef },
    { key: 'institutionalEmail', ref: emailRef },
    { key: 'firstName', ref: firstNameRef },
    { key: 'middleName', ref: middleNameRef },
    { key: 'lastName', ref: lastNameRef },
    { key: 'suffix', ref: suffixRef },
    { key: 'sex', ref: sexRef },
    { key: 'collegeId', ref: collegeRef },
    { key: 'academicProgramId', ref: programRef },
    { key: 'yearLevel', ref: yearLevelRef },
    { key: 'academicYear', ref: academicYearRef }
  ]

  const focusFirstError = (errors) => {
    for (const item of fieldRefOrder) {
      if (errors[item.key] && item.ref.current) {
        item.ref.current.focus()
        break
      }
    }
  }

  // Form State
  const [formData, setFormData] = useState({
    institutionalId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    institutionalEmail: '',
    sex: '',
    collegeId: '',
    academicProgramId: '',
    yearLevel: '',
    academicYear: DEFAULT_ACADEMIC_YEAR
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailAvailability, setEmailAvailability] = useState('empty')
  const availabilityRequestRef = useRef({ sequence: 0, controller: null })


  // Load references when modal opens if not already provided
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const loadData = async () => {
      if (colleges.length > 0 && degreePrograms.length > 0) {
        setLoadedColleges(colleges)
        setLoadedPrograms(degreePrograms)
        return
      }

      setIsLoadingReferences(true)
      setReferenceError('')
      try {
        const [fetchedCols, fetchedProgs] = await Promise.all([
          colleges.length > 0 ? colleges : fetchColleges({ status: 'active' }),
          degreePrograms.length > 0 ? degreePrograms : fetchAcademicPrograms()
        ])
        if (isMounted) {
          setLoadedColleges(fetchedCols)
          setLoadedPrograms(fetchedProgs)
        }
      } catch (err) {
        console.warn('Failed to load colleges/programs for student modal:', err)
        if (isMounted) setReferenceError('Reference data could not be loaded. Close and reopen the form to try again.')
      } finally {
        if (isMounted) setIsLoadingReferences(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [isOpen, colleges, degreePrograms])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        institutionalId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        institutionalEmail: '',
        sex: '',
        collegeId: '',
        academicProgramId: '',
        yearLevel: '',
        academicYear: DEFAULT_ACADEMIC_YEAR
      })
      setFieldErrors({})
      setServerError(null)
      setIsSubmitting(false)
      setEmailAvailability('empty')
      availabilityRequestRef.current.controller?.abort()

      const timer = setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, firstInputRef])

  // Filter programs based on selected college
  const filteredPrograms = useMemo(
    () => filterPrograms(loadedPrograms, formData.collegeId),
    [loadedPrograms, formData.collegeId]
  )

  const isDirty = () => {
    return (
      formData.institutionalId.trim() !== '' ||
      formData.firstName.trim() !== '' ||
      formData.middleName.trim() !== '' ||
      formData.lastName.trim() !== '' ||
      formData.suffix.trim() !== '' ||
      formData.institutionalEmail.trim() !== '' ||
      formData.sex !== '' ||
      formData.collegeId !== '' ||
      formData.academicProgramId !== '' ||
      formData.yearLevel !== '' ||
      formData.academicYear !== DEFAULT_ACADEMIC_YEAR
    )
  }

  const handleReset = () => {
    setFormData({
      institutionalId: '',
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      institutionalEmail: '',
      sex: '',
      collegeId: '',
      academicProgramId: '',
      yearLevel: '',
      academicYear: DEFAULT_ACADEMIC_YEAR
    })
    setFieldErrors({})
    setServerError(null)
    setIsSubmitting(false)
  }

  const { isConfirmOpen, requestClose, confirmDiscard, cancelDiscard } = useConfirmableClose({
    isOpen,
    isDirty,
    onClose,
    onDiscard: handleReset
  })

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, requestClose])

  if (!isOpen) return null

  const handleInputChange = (field, value) => {
    let nextValue = value
    if (field === 'institutionalId') nextValue = sanitizeStudentNumber(value)
    if (['firstName', 'middleName', 'lastName'].includes(field)) nextValue = sanitizePersonName(value)
    if (field === 'institutionalEmail') nextValue = normalizeInstitutionalEmail(value)
    setFormData((prev) => ({ ...prev, [field]: nextValue }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }))
    }
    if (serverError) {
      setServerError(null)
    }
    if (field === 'institutionalEmail') {
      availabilityRequestRef.current.controller?.abort()
      availabilityRequestRef.current.sequence += 1
      setEmailAvailability(nextValue ? 'unchecked' : 'empty')
    }
  }

  const checkEmailAvailability = async () => {
    const email = formData.institutionalEmail.trim().toLowerCase()
    if (!isInstitutionalEmail(email)) {
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
      if (availabilityRequestRef.current.sequence !== sequence || formData.institutionalEmail.trim().toLowerCase() !== email) return
      if (result.available) {
        setEmailAvailability('available')
      } else {
        setEmailAvailability(result.conflict_state === 'active' ? 'unavailable_existing' : 'unavailable_inactive')
        setFieldErrors((prev) => ({ ...prev, institutionalEmail: result.conflict_state === 'active'
          ? 'An account with this email already exists.'
          : 'This email is reserved by an inactive account. Restore that account instead of creating a duplicate.' }))
      }
    } catch (error) {
      if (error?.name !== 'CanceledError' && error?.code !== 'ERR_CANCELED' && availabilityRequestRef.current.sequence === sequence) {
        setEmailAvailability('network_unknown')
      }
    }
  }

  const handleCollegeChange = (newCollegeId) => {
    setFormData((prev) => {
      // If currently selected program does not belong to new college, clear it
      const currentProg = loadedPrograms.find(
        (p) => p.id === prev.academicProgramId
      )
      const progCollegeId = currentProg?.college_id || currentProg?.collegeId
      const shouldResetProg = !newCollegeId || !currentProg || progCollegeId !== newCollegeId

      return {
        ...prev,
        collegeId: newCollegeId,
        academicProgramId: shouldResetProg ? '' : prev.academicProgramId
      }
    })
  }

  const validateSingleField = (field, val) => {
    const value = val !== undefined ? val : formData[field]
    switch (field) {
      case 'institutionalId': {
        const clean = (value || '').trim()
        if (!clean) return 'Institutional ID is required.'
        if (!/^[0-9]{5,50}$/.test(clean)) return 'Institutional ID must contain 5 to 50 ASCII digits.'
        return null
      }
      case 'firstName': {
        const clean = (value || '').trim()
        if (!clean) return 'First name is required.'
        return null
      }
      case 'middleName':
      case 'lastName': {
        const clean = (value || '').trim()
        if (field === 'lastName' && !clean) return 'Last name is required.'
        return null
      }
      case 'institutionalEmail': {
        const clean = (value || '').trim().toLowerCase()
        if (!clean) return 'Institutional email is required.'
        if (!isInstitutionalEmail(clean)) return 'Use a valid @ndmu.edu.ph institutional email.'
        return null
      }
      case 'suffix': {
        if (!STUDENT_SUFFIX_OPTIONS.includes(value)) return 'Select an approved name suffix.'
        return null
      }
      case 'sex': {
        if (!value || !value.trim()) return 'Sex is required.'
        if (!STUDENT_SEX_OPTIONS.includes(value)) return 'Sex must be Male, Female, or Prefer not to say.'
        return null
      }
      case 'collegeId': {
        const college = loadedColleges.find((item) => item.id === value)
        if (!college || !isActiveReference(college)) return 'Select an active Academic College.'
        return null
      }
      case 'academicProgramId': {
        if (!value || !value.trim()) return 'Please select an Academic Degree Program.'
        const program = loadedPrograms.find((item) => item.id === value)
        if (!program || !isActiveReference(program) || getProgramCollegeId(program) !== formData.collegeId) {
          return 'Select an active Program from the chosen College.'
        }
        return null
      }
      case 'yearLevel': {
        if (!value || !value.trim()) return 'Current year level is required.'
        if (!STUDENT_YEAR_LEVELS.includes(value)) return 'Year level must be 1st Year through 5th Year.'
        return null
      }
      case 'academicYear': {
        if (!ACADEMIC_YEAR_OPTIONS.includes(value)) return 'Select a valid consecutive Academic Year.'
        return null
      }
      default:
        return null
    }
  }

  const handleBlur = (field) => {
    const error = validateSingleField(field)
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const validateClient = () => {
    const errors = {}
    const fieldsToValidate = [
      'institutionalId',
      'firstName',
      'lastName',
      'institutionalEmail',
      'suffix',
      'sex',
      'collegeId',
      'academicProgramId',
      'yearLevel',
      'academicYear'
    ]

    for (const field of fieldsToValidate) {
      const err = validateSingleField(field)
      if (err) {
        errors[field] = err
      }
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateClient()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      focusFirstError(errors)
      return
    }

    setIsSubmitting(true)
    setServerError(null)
    setFieldErrors({})

    const payload = {
      institutional_id: formData.institutionalId.trim(),
      institutional_email: formData.institutionalEmail.trim().toLowerCase(),
      first_name: formData.firstName.trim(),
      middle_name: formData.middleName.trim() || null,
      last_name: formData.lastName.trim(),
      suffix: formData.suffix.trim() || null,
      college_id: formData.collegeId.trim(),
      academic_program_id: formData.academicProgramId.trim(),
      year_level: formData.yearLevel,
      academic_year: formData.academicYear.trim() || DEFAULT_ACADEMIC_YEAR,
      sex: formData.sex || null
    }

    try {
      let res
      if (onSubmit) {
        res = await onSubmit(payload)
      } else {
        res = await provisioningService.provisionManualStudent(payload)
      }
      handleReset()
      if (res) {
        credentialHook.handleProvisioningSuccess(res, 'student')
      } else {
        onClose()
      }
    } catch (err) {
      const errRes = err?.response?.data || err
      const errCode = errRes?.error?.code || err?.code
      const errMsg = errRes?.error?.message || err?.message || 'Failed to provision student account.'
      let mappedErrors = {}

      if (errCode === 'EMAIL_ALREADY_EXISTS') {
        mappedErrors = { institutionalEmail: errRes?.error?.conflict_state === 'active'
          ? 'An account with this email already exists.'
          : 'This email is reserved by an inactive account. Restore that account instead of creating a duplicate.' }
      } else if (errCode === 'INSTITUTIONAL_ID_ALREADY_EXISTS') {
        mappedErrors = { institutionalId: 'An account with this institutional ID already exists.' }
      } else if (errCode === 'INVALID_INSTITUTIONAL_ID') {
        mappedErrors = { institutionalId: errMsg }
      } else if (errCode === 'INVALID_SEX' || errRes?.error?.field === 'sex') {
        mappedErrors = { sex: 'Sex must be Male, Female, or Prefer not to say.' }
      } else if (errCode === 'VALIDATION_FAILED' && errRes?.error?.fields) {
        const fields = errRes.error.fields
        mappedErrors = {
          ...(fields.institutional_email ? { institutionalEmail: fields.institutional_email } : {}),
          ...(fields.institutional_id ? { institutionalId: fields.institutional_id } : {}),
          ...(fields.suffix ? { suffix: fields.suffix } : {}),
          ...(fields.college_id ? { collegeId: fields.college_id } : {}),
          ...(fields.sex ? { sex: fields.sex } : {}),
          ...(fields.academic_program_id ? { academicProgramId: fields.academic_program_id } : {}),
          ...(fields.year_level ? { yearLevel: fields.year_level } : {}),
          ...(fields.academic_year ? { academicYear: fields.academic_year } : {})
        }
      } else if (errCode === 'INVALID_EMAIL_DOMAIN') {
        mappedErrors = { institutionalEmail: 'Institutional email must end with @ndmu.edu.ph.' }
      } else if (errCode === 'INVALID_ACADEMIC_PROGRAM' || errCode === 'ACADEMIC_PROGRAM_NOT_FOUND') {
        mappedErrors = { academicProgramId: 'Selected Academic Program is inactive or invalid.' }
      } else if (errCode === 'COLLEGE_NOT_FOUND') {
        mappedErrors = { collegeId: 'Selected Academic College is inactive or invalid.' }
      } else {
        setServerError(errMsg)
      }

      if (Object.keys(mappedErrors).length > 0) {
        setFieldErrors(mappedErrors)
        focusFirstError(mappedErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formErrors = validateClient()
  const formIsValid = Object.keys(formErrors).length === 0
    && emailAvailability !== 'checking'
    && !isLoadingReferences
    && !referenceError
    && !isSubmitting


  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose()
        }}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 ${credentialHook.isOpen || credentialHook.deliveryFault ? 'hidden' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
        aria-describedby="add-student-description"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#131e2e] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-6 bg-[#EFF7F0] dark:bg-[#162720] border-b border-[#69A97C]/50 dark:border-emerald-800/40 text-[#17663B] dark:text-emerald-300 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#176B43] text-white flex items-center justify-center font-extrabold text-sm shrink-0 border border-[#176B43] shadow-xs">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 id="add-student-title" className="font-extrabold text-base text-[#17663B] dark:text-white">
                  Add Student Account
                </h3>
                <p id="add-student-description" className="text-xs text-[#245F42] dark:text-emerald-400 font-medium mt-0.5">
                  Provision a new student account with academic program placement and initial credentials.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close dialog"
              onClick={requestClose}
              className="w-8 h-8 rounded-full bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 flex items-center justify-center text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Server Error Alert Banner */}
              {serverError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{serverError}</span>
                </div>
              )}
              {referenceError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="font-medium">{referenceError}</span>
                </div>
              )}

              {/* Section 1: Identity Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs">
                  <User className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                  <span>1. Student Identity Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Institutional ID */}
                  <div>
                    <label htmlFor="student-institutional-id-input" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Institutional ID <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        ref={instIdRef}
                        id="student-institutional-id-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={50}
                        required
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.institutionalId)}
                        aria-describedby={fieldErrors.institutionalId ? 'error-student-institutional-id' : undefined}
                        value={formData.institutionalId}
                        onBlur={() => handleBlur('institutionalId')}
                        onChange={(e) => handleInputChange('institutionalId', e.target.value)}
                        placeholder="e.g. 202610492"
                        className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none transition ${
                          fieldErrors.institutionalId
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-800 focus:border-[#16834a]'
                        }`}
                      />
                    </div>
                    {fieldErrors.institutionalId && (
                      <p id="error-student-institutional-id" className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {fieldErrors.institutionalId}
                      </p>
                    )}
                    {!fieldErrors.institutionalId && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Digits only, 5–50 characters</p>}
                  </div>

                  {/* Institutional Email */}
                  <div>
                    <label htmlFor="student-institutional-email-input" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Institutional Email <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        ref={emailRef}
                        id="student-institutional-email-input"
                        type="email"
                        autoCapitalize="none"
                        spellCheck="false"
                        required
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.institutionalEmail)}
                        aria-describedby={fieldErrors.institutionalEmail ? 'error-student-institutional-email' : undefined}
                        value={formData.institutionalEmail}
                        onChange={(e) => handleInputChange('institutionalEmail', e.target.value)}
                        onBlur={() => {
                          handleBlur('institutionalEmail')
                          checkEmailAvailability()
                        }}
                        placeholder="e.g. j.delacruz@ndmu.edu.ph"
                        className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition ${
                          fieldErrors.institutionalEmail
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-800 focus:border-[#16834a]'
                        }`}
                      />
                    </div>
                    {fieldErrors.institutionalEmail && (
                      <p id="error-student-institutional-email" className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {fieldErrors.institutionalEmail}
                      </p>
                    )}
                    {!fieldErrors.institutionalEmail && emailAvailability === 'checking' && <p className="text-[11px] text-slate-500 mt-1">Checking availability…</p>}
                    {!fieldErrors.institutionalEmail && emailAvailability === 'available' && <p className="text-[11px] text-emerald-600 mt-1">Email is available. Final verification occurs when you submit.</p>}
                    {!fieldErrors.institutionalEmail && emailAvailability === 'network_unknown' && <p className="text-[11px] text-amber-700 mt-1">Availability could not be checked. It will be verified when you submit.</p>}
                    {!fieldErrors.institutionalEmail && ['empty', 'unchecked', 'invalid_syntax'].includes(emailAvailability) && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Use your institutional @ndmu.edu.ph address</p>}
                  </div>
                </div>

                {/* Name Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* First Name */}
                  <div>
                    <label htmlFor="student-first-name-input" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      First Name <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      ref={firstNameRef}
                      id="student-first-name-input"
                      type="text"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.firstName)}
                      aria-describedby={fieldErrors.firstName ? 'error-student-first-name' : undefined}
                      value={formData.firstName}
                      onBlur={() => handleBlur('firstName')}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="e.g. Juan"
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition ${
                        fieldErrors.firstName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:border-[#16834a]'
                      }`}
                    />
                    {fieldErrors.firstName && (
                      <p id="error-student-first-name" className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label htmlFor="student-middle-name-input" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      ref={middleNameRef}
                      id="student-middle-name-input"
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                      placeholder="e.g. Protacio"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#16834a] transition"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="student-last-name-input" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      ref={lastNameRef}
                      id="student-last-name-input"
                      type="text"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.lastName)}
                      aria-describedby={fieldErrors.lastName ? 'error-student-last-name' : undefined}
                      value={formData.lastName}
                      onBlur={() => handleBlur('lastName')}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="e.g. Dela Cruz"
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition ${
                        fieldErrors.lastName
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:border-[#16834a]'
                      }`}
                    />
                    {fieldErrors.lastName && (
                      <p id="error-student-last-name" className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Suffix */}
                  <div>
                    <label htmlFor="student-suffix-input" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Name Suffix <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      ref={suffixRef}
                      id="student-suffix-select"
                      value={formData.suffix}
                      onChange={(e) => handleInputChange('suffix', e.target.value)}
                      className="min-h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-950"
                    >
                      {STUDENT_SUFFIX_OPTIONS.map((suffix) => <option key={suffix || 'none'} value={suffix}>{suffix || 'None'}</option>)}
                    </select>
                  </div>

                  {/* Sex */}
                  <div>
                    <label htmlFor="student-sex-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sex <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <select
                      ref={sexRef}
                      id="student-sex-select"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.sex)}
                      aria-describedby={fieldErrors.sex ? 'error-student-sex' : undefined}
                      value={formData.sex}
                      onBlur={() => handleBlur('sex')}
                      onChange={(e) => handleInputChange('sex', e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition cursor-pointer ${
                        fieldErrors.sex
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:border-[#16834a]'
                      }`}
                    >
                      {SEX_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.sex && (
                      <p id="error-student-sex" className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {fieldErrors.sex}
                      </p>
                    )}
                    {!fieldErrors.sex && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        Sex is stored with the Student profile and can be updated through authorized profile workflows.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Academic Placement & Enrollment */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs">
                  <GraduationCap className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                  <span>2. Academic Placement &amp; Enrollment</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* College Scope */}
                  <div>
                    <label htmlFor="student-college-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Academic College <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <select
                        ref={collegeRef}
                        id="student-college-select"
                        required
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.collegeId)}
                        aria-describedby={fieldErrors.collegeId ? 'error-student-college' : 'hint-student-college'}
                        value={formData.collegeId}
                        disabled={isLoadingReferences || Boolean(referenceError)}
                        onBlur={() => handleBlur('collegeId')}
                        onChange={(e) => handleCollegeChange(e.target.value)}
                        className={`min-h-11 w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900 ${fieldErrors.collegeId ? 'border-red-500 focus:ring-2 focus:ring-red-100' : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:focus:ring-emerald-950'}`}
                      >
                        <option value="">{isLoadingReferences ? 'Loading colleges…' : 'Select Academic College'}</option>
                        {loadedColleges.filter(isActiveReference).map((c) => (
                          <option key={c.id} value={c.id}>
                            [{c.code}] {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {fieldErrors.collegeId
                      ? <p id="error-student-college" className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">{fieldErrors.collegeId}</p>
                      : <p id="hint-student-college" className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Choose a College to load its Programs</p>}
                  </div>

                  {/* Academic Degree Program */}
                  <div>
                    <label htmlFor="student-program-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Academic Degree Program <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <SearchableSelect
                      ref={programRef}
                      id="student-program-select"
                      value={formData.academicProgramId}
                      options={filteredPrograms}
                      disabled={!formData.collegeId || isLoadingReferences || Boolean(referenceError)}
                      invalid={Boolean(fieldErrors.academicProgramId)}
                      describedBy={fieldErrors.academicProgramId ? 'error-student-program' : 'hint-student-program'}
                      onBlur={() => handleBlur('academicProgramId')}
                      onChange={(value) => handleInputChange('academicProgramId', value)}
                      placeholder={!formData.collegeId ? 'Select a College first' : isLoadingReferences ? 'Loading programs…' : 'Search or select a program'}
                      searchPlaceholder="Search by Program code or name"
                      getOptionLabel={getProgramLabel}
                      getOptionValue={(program) => program.id}
                      emptyMessage={filteredPrograms.length === 0 ? 'No active programs available for this college' : 'No matching programs'}
                    />
                    {fieldErrors.academicProgramId && (
                      <p id="error-student-program" className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {fieldErrors.academicProgramId}
                      </p>
                    )}
                    {!fieldErrors.academicProgramId && <p id="hint-student-program" className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Only active Programs from the selected College can be submitted</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Year Level */}
                  <div>
                    <label htmlFor="student-year-level-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Current Year Level <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <select
                      ref={yearLevelRef}
                      id="student-year-level-select"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.yearLevel)}
                      aria-describedby={fieldErrors.yearLevel ? 'error-student-year-level' : undefined}
                      value={formData.yearLevel}
                      onBlur={() => handleBlur('yearLevel')}
                      onChange={(e) => handleInputChange('yearLevel', e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition cursor-pointer ${
                        fieldErrors.yearLevel
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-slate-200 dark:border-slate-800 focus:border-[#16834a]'
                      }`}
                    >
                      {STUDENT_YEAR_LEVEL_SELECT_OPTIONS.map((option) => (
                        <option key={option.value || 'placeholder'} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.yearLevel && (
                      <p id="error-student-year-level" className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {fieldErrors.yearLevel}
                      </p>
                    )}
                  </div>

                  {/* Academic Year */}
                  <div>
                    <label htmlFor="student-academic-year-select" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Academic Year <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        ref={academicYearRef}
                        id="student-academic-year-select"
                        required
                        aria-required="true"
                        aria-invalid={Boolean(fieldErrors.academicYear)}
                        aria-describedby={fieldErrors.academicYear ? 'error-student-academic-year' : undefined}
                        value={formData.academicYear}
                        onBlur={() => handleBlur('academicYear')}
                        onChange={(e) => handleInputChange('academicYear', e.target.value)}
                        className={`w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition cursor-pointer ${
                          fieldErrors.academicYear
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-800 focus:border-[#16834a]'
                        }`}
                      >
                        {ACADEMIC_YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </div>
                    {fieldErrors.academicYear && (
                      <p id="error-student-academic-year" className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">
                        {fieldErrors.academicYear}
                      </p>
                    )}
                  </div>
                </div>
              </div>


              {/* Section 3: Account Governance & Initial Credentials */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#16834a] dark:text-emerald-400" />
                  <span>3. Account Security &amp; Credentials</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-[#17663B] dark:text-emerald-300 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
                    <span>Automatic Credential Bootstrap</span>
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-400 text-[11px] leading-relaxed">
                    The Student record begins <span className="font-bold">Active / Enrolled</span>. A secure temporary credential is generated, while authentication remains <span className="font-bold">Pending First Login</span> until the Student establishes a permanent password.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                OSAD Governance
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={requestClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <Button
                  type="submit"
                  disabled={!formIsValid}
                  size="sm"
                  className="gap-1.5 shadow-2xs font-bold"
                >
                  {isSubmitting ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? 'Creating…' : 'Create Student Account'}</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        title="Discard Student Account Changes?"
        message="Are you sure you want to close? Your unsaved student account draft will be lost."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        onConfirm={confirmDiscard}
        onCancel={cancelDiscard}
      />

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
