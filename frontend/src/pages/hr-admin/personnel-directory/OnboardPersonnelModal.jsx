import React, { useState, useRef, useEffect } from 'react'
import {
  X, UserPlus, Check, ChevronRight, ChevronLeft, ShieldCheck,
  Building2, User, Award, RefreshCw, Sparkles, CheckCircle2, Edit3, Info, AlertCircle, Save
} from 'lucide-react'
import CustomDatePicker from './CustomDatePicker'
import { usePersonnelOnboardingDraft } from '../../../hooks/usePersonnelOnboardingDraft.js'
import OnboardingDraftRecoveryBanner from './OnboardingDraftRecoveryBanner'
import DiscardOnboardingDraftModal from './DiscardOnboardingDraftModal'

// Normalization Helpers (applied on blur and submission)
const normalizeHumanName = (val) => {
  if (!val || typeof val !== 'string') return ''
  return val.normalize('NFC').trim().replace(/\s+/g, ' ')
}

const normalizeEmployeeId = (val) => {
  if (!val || typeof val !== 'string') return ''
  return val.trim().toUpperCase()
}

const normalizeInstitutionalEmail = (val) => {
  if (!val || typeof val !== 'string') return ''
  return val.trim().toLowerCase()
}

// Smart Capitalization Engine
const LOWERCASE_PARTICLES = new Set(['da', 'de', 'del', 'dela', 'di', 'van', 'von'])
const ROMAN_NUMERALS = /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X)$/i
const ACRONYM_PATTERN = /^[A-Z\d]{2,8}$/

function capitalizeSegment(segment, index) {
  if (!segment) return segment
  if (ACRONYM_PATTERN.test(segment)) return segment
  if (ROMAN_NUMERALS.test(segment)) return segment.toUpperCase()

  const lower = segment.toLocaleLowerCase()
  if (index > 0 && LOWERCASE_PARTICLES.has(lower)) return lower

  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1)
}

function smartCapitalize(value) {
  if (!value || typeof value !== 'string') return ''
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ')
  return normalized
    .split(/([\s'-]+)/)
    .map((part, index) => (/^[\s'-]+$/.test(part) ? part : capitalizeSegment(part, index)))
    .join('')
}

// Unicode-aware validation regexes
const PERSON_NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u
const EMPLOYEE_ID_PATTERN = /^EMP-\d{4}-\d{4}$/

const validateInstitutionalDomain = (emailVal) => {
  if (!emailVal || typeof emailVal !== 'string') return false
  const trimmed = emailVal.trim().toLowerCase()
  const parts = trimmed.split('@')
  if (parts.length !== 2) return false
  return parts[1] === 'ndmu.edu.ph'
}

// Category-Driven Requirements Configuration
const PERSONNEL_REQUIREMENTS = {
  'Faculty Member': {
    college: true,
    department: true,
    academicRank: true,
    classification: true,
  },
  'Administrative Staff': {
    college: false,
    department: true,
    academicRank: false,
    classification: true,
  },
  'System Administrator': {
    college: false,
    department: false,
    academicRank: false,
    classification: true,
  },
}

export default function OnboardPersonnelModal({
  isOpen,
  onClose,
  onSubmit,
  evaluatorContext = { evaluatorId: 'HR-2010-001', role: 'hr_staff' }
}) {
  // Stepper State: activeStep (1 | 2 | 3 | 4) & completedSteps Set
  const [activeStep, setActiveStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Draft Recovery Hook Integration
  const draftHook = usePersonnelOnboardingDraft(evaluatorContext, isOpen)
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false)

  // Stage 1: Identity State
  const [honorific, setHonorific] = useState('Dr.')
  const [givenName, setGivenName] = useState('')
  const [middleName, setMiddleName] = useState('') // Optional
  const [surname, setSurname] = useState('')
  const [suffix, setSuffix] = useState('None') // Optional
  const [employeeId, setEmployeeId] = useState(`EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`)
  const [email, setEmail] = useState('')

  // Stage 2: Employment Placement State
  const [personnelCategory, setPersonnelCategory] = useState('Faculty Member')
  const [positionTitle, setPositionTitle] = useState('Faculty Member')
  const [college, setCollege] = useState('CEAC')
  const [department, setDepartment] = useState('Department of Computer Studies')
  const [employmentClassification, setEmploymentClassification] = useState('Full-Time Permanent')
  const [employmentStatus, setEmploymentStatus] = useState('Permanent')
  const [academicRank, setAcademicRank] = useState('Assistant Professor I')
  const [hireDate, setHireDate] = useState('2026-08-19')

  // Stage 3: Base Account Access State (Fixed Personnel Account Type)
  const baseRole = 'personnel'
  const [invitationOption, setInvitationOption] = useState('activation_link')
  const [tempPassword, setTempPassword] = useState('NDMU-Pass2026!')
  const [tempPasswordAck, setTempPasswordAck] = useState(false)

  // Field Refs for Auto-Focus & Stepper Auto-Scroll Reframing
  const givenNameRef = useRef(null)
  const surnameRef = useRef(null)
  const middleNameRef = useRef(null)
  const emailRef = useRef(null)
  const positionTitleRef = useRef(null)
  const tempPasswordRef = useRef(null)

  const stepRef1 = useRef(null)
  const stepRef2 = useRef(null)
  const stepRef3 = useRef(null)
  const stepRef4 = useRef(null)

  // Smooth Auto-Scroll Reframing to Active Step Panel
  useEffect(() => {
    const refsMap = { 1: stepRef1, 2: stepRef2, 3: stepRef3, 4: stepRef4 }
    const targetRef = refsMap[activeStep]
    if (targetRef && targetRef.current) {
      const timer = setTimeout(() => {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [activeStep])

  // Form State Reset Helper
  const resetFormState = () => {
    setActiveStep(1)
    setCompletedSteps(new Set())
    setErrors({})
    setHonorific('Dr.')
    setGivenName('')
    setMiddleName('')
    setSurname('')
    setSuffix('None')
    setEmployeeId(`EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`)
    setEmail('')
    setPersonnelCategory('Faculty Member')
    setPositionTitle('Faculty Member')
    setCollege('CEAC')
    setDepartment('Department of Computer Studies')
    setEmploymentClassification('Full-Time Permanent')
    setEmploymentStatus('Permanent')
    setAcademicRank('Assistant Professor I')
    setHireDate('2026-08-19')
    setInvitationOption('activation_link')
    setTempPassword('NDMU-Pass2026!')
    setTempPasswordAck(false)
  }

  // Auto-Save Debounced Draft Snapshot
  useEffect(() => {
    if (!isOpen || draftHook.recoveryDecisionPending) return
    draftHook.saveSnapshot({
      activeStep,
      completedSteps: Array.from(completedSteps),
      identity: { honorific, firstName: givenName, middleName, lastName: surname, suffix, employeeId, email },
      employment: { personnelCategory, positionTitle, college, department, academicRank, employmentClassification, hireDate },
      account: { invitationOption }
    })
  }, [isOpen, activeStep, completedSteps, honorific, givenName, middleName, surname, suffix, employeeId, email, personnelCategory, positionTitle, college, department, academicRank, employmentClassification, hireDate, invitationOption, draftHook])

  // Resume Draft Handler
  const handleResumeDraft = () => {
    const draft = draftHook.resumeDraft()
    if (draft) {
      if (draft.identity) {
        setHonorific(draft.identity.honorific || 'Dr.')
        setGivenName(draft.identity.firstName || '')
        setMiddleName(draft.identity.middleName || '')
        setSurname(draft.identity.lastName || '')
        setSuffix(draft.identity.suffix || 'None')
        if (draft.identity.employeeId) setEmployeeId(draft.identity.employeeId)
        if (draft.identity.email) setEmail(draft.identity.email)
      }
      if (draft.employment) {
        setPersonnelCategory(draft.employment.personnelCategory || 'Faculty Member')
        setPositionTitle(draft.employment.positionTitle || 'Faculty Member')
        setCollege(draft.employment.college || 'CEAC')
        setDepartment(draft.employment.department || 'Department of Computer Studies')
        setAcademicRank(draft.employment.academicRank || 'Assistant Professor I')
        setEmploymentClassification(draft.employment.employmentClassification || 'Full-Time Permanent')
        setHireDate(draft.employment.hireDate || '2026-08-19')
      }
      if (draft.account) {
        setInvitationOption(draft.account.invitationOption || 'activation_link')
        setTempPassword('NDMU-Pass2026!')
        setTempPasswordAck(false)
      }

      const completed = new Set()
      if (draft.identity?.firstName && draft.identity?.lastName && draft.identity?.email) completed.add(1)
      if (completed.has(1) && draft.employment?.positionTitle) completed.add(2)
      if (completed.has(2)) completed.add(3)
      setCompletedSteps(completed)
      setActiveStep(Math.min(draft.activeStep || 1, completed.size + 1))
    }
  }

  const handleRequestStartFresh = () => {
    setIsDiscardConfirmOpen(true)
  }

  const handleConfirmDiscard = () => {
    draftHook.clearDraft()
    setIsDiscardConfirmOpen(false)
    resetFormState()
  }

  const collegeDeptMap = {
    'CEAC': ['Department of Computer Studies', 'Department of Engineering', 'Department of Physical Sciences'],
    'CBA': ['Department of Business Management'],
    'CAS': ['Department of Arts & Humanities'],
  }

  const reqs = PERSONNEL_REQUIREMENTS[personnelCategory] || PERSONNEL_REQUIREMENTS['Faculty Member']

  const handleCollegeChange = (col) => {
    setCollege(col)
    const validDepts = collegeDeptMap[col] || []
    if (!validDepts.includes(department)) {
      setDepartment(validDepts[0] || '')
    }
  }

  const handleRegenerateEmployeeId = () => {
    const newId = `EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`
    setEmployeeId(newId)
    if (errors.employeeId) setErrors(prev => ({ ...prev, employeeId: null }))
  }

  const handleAutoGenerateEmail = () => {
    const cleanGiven = smartCapitalize(givenName)
    const cleanSurname = smartCapitalize(surname)
    if (!cleanGiven || !cleanSurname) return
    const firstInitial = cleanGiven.charAt(0).toLowerCase()
    const safeSurname = cleanSurname.toLowerCase().replace(/[^a-z]/g, '')
    const suggested = `${firstInitial}${safeSurname}@ndmu.edu.ph`
    setEmail(suggested)
    if (errors.email) setErrors(prev => ({ ...prev, email: null }))
  }

  const getFormattedFullName = () => {
    const parts = []
    if (honorific && honorific !== 'None') parts.push(honorific)
    const cleanGiven = smartCapitalize(givenName)
    const cleanMiddle = smartCapitalize(middleName)
    const cleanSurname = smartCapitalize(surname)
    if (cleanGiven) parts.push(cleanGiven)
    if (cleanMiddle) parts.push(cleanMiddle)
    if (cleanSurname) parts.push(cleanSurname)
    if (suffix && suffix !== 'None') parts.push(suffix)
    return parts.join(' ') || 'Unnamed Personnel'
  }

  // --- STEP VALIDATION ENGINE ---
  const validateStep1 = () => {
    const newErrors = {}
    const cleanGiven = smartCapitalize(givenName)
    const cleanSurname = smartCapitalize(surname)
    const cleanMiddle = smartCapitalize(middleName)
    const cleanEmail = normalizeInstitutionalEmail(email)
    const cleanEmpId = normalizeEmployeeId(employeeId)

    if (!cleanGiven) {
      newErrors.givenName = 'Enter the personnel member\'s given name.'
    } else if (!PERSON_NAME_PATTERN.test(cleanGiven) || cleanGiven.length < 2 || cleanGiven.length > 50) {
      newErrors.givenName = 'Use letters, spaces, apostrophes, periods, or hyphens (2–50 characters).'
    }

    if (!cleanSurname) {
      newErrors.surname = 'Enter the personnel member\'s surname.'
    } else if (!PERSON_NAME_PATTERN.test(cleanSurname) || cleanSurname.length < 2 || cleanSurname.length > 50) {
      newErrors.surname = 'Use letters, spaces, apostrophes, periods, or hyphens (2–50 characters).'
    }

    if (cleanMiddle && (!PERSON_NAME_PATTERN.test(cleanMiddle) || cleanMiddle.length > 50)) {
      newErrors.middleName = 'Middle name must use letters, spaces, apostrophes, periods, or hyphens (up to 50 characters).'
    }

    if (!cleanEmpId) {
      newErrors.employeeId = 'Employee ID is required to save.'
    } else if (!EMPLOYEE_ID_PATTERN.test(cleanEmpId)) {
      newErrors.employeeId = 'Employee ID must use the format EMP-YYYY-NNNN.'
    }

    if (!cleanEmail) {
      newErrors.email = 'Use an institutional email ending in @ndmu.edu.ph.'
    } else if (!validateInstitutionalDomain(cleanEmail)) {
      newErrors.email = 'Use an institutional email ending in @ndmu.edu.ph.'
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.givenName && givenNameRef.current) givenNameRef.current.focus()
      else if (newErrors.surname && surnameRef.current) surnameRef.current.focus()
      else if (newErrors.email && emailRef.current) emailRef.current.focus()
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const newErrors = {}
    const cleanPosition = smartCapitalize(positionTitle)
    if (!cleanPosition || cleanPosition.length < 2 || cleanPosition.length > 80) {
      newErrors.positionTitle = 'Select or enter a position title (2–80 characters).'
    }

    if (reqs.college && !college) {
      newErrors.college = 'Select a college before selecting a department.'
    }

    if (reqs.department && !department) {
      newErrors.department = 'Select a department configured for this college.'
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.positionTitle && positionTitleRef.current) positionTitleRef.current.focus()
      return false
    }
    return true
  }

  const validateStep3 = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = 'Add an institutional email before configuring account activation.'
    }

    if (invitationOption === 'temporary_passkey') {
      if (!tempPassword || tempPassword.length < 10) {
        newErrors.tempPassword = 'The temporary passkey must meet the current credential policy (at least 10 characters).'
      }
      if (!tempPasswordAck) {
        newErrors.tempPasswordAck = 'Confirm responsibility for secure passkey delivery.'
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }))
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.email && emailRef.current) {
        setActiveStep(1)
        setTimeout(() => emailRef.current.focus(), 100)
      } else if (newErrors.tempPassword && tempPasswordRef.current) {
        tempPasswordRef.current.focus()
      }
      return false
    }
    return true
  }

  // Handle Continuing from active step to next step
  const handleContinueStep = (currentStepNum) => {
    let isValid = false
    if (currentStepNum === 1) isValid = validateStep1()
    else if (currentStepNum === 2) isValid = validateStep2()
    else if (currentStepNum === 3) isValid = validateStep3()

    if (isValid) {
      setCompletedSteps(prev => new Set(prev).add(currentStepNum))
      setActiveStep(currentStepNum + 1)
    }
  }

  // Handle Clicking a Step Header (reopen for inline editing)
  const handleStepHeaderClick = (stepNum) => {
    if (completedSteps.has(stepNum) || stepNum === activeStep) {
      // Invalidate stepNum and all later completed steps when editing an earlier step
      setCompletedSteps(prev => {
        const next = new Set(prev)
        for (let i = stepNum; i <= 4; i++) {
          next.delete(i)
        }
        return next
      })
      setActiveStep(stepNum)
    }
  }

  if (!isOpen) return null

  // Save as Pending Placement (Requires all 3 steps to validate)
  const handleSavePending = async (e) => {
    if (e) e.preventDefault()
    const v1 = validateStep1()
    const v2 = validateStep2()
    const v3 = validateStep3()

    if (!v1) { setActiveStep(1); return }
    if (!v2) { setActiveStep(2); return }
    if (!v3) { setActiveStep(3); return }

    setIsSubmitting(true)
    const cleanGiven = smartCapitalize(givenName)
    const cleanMiddle = smartCapitalize(middleName)
    const cleanSurname = smartCapitalize(surname)
    const cleanEmail = normalizeInstitutionalEmail(email)
    const cleanEmpId = normalizeEmployeeId(employeeId)
    const formattedFullName = getFormattedFullName()

    const payload = {
      status: 'PENDING_PLACEMENT',
      action: 'save_pending',
      identity: {
        honorific: honorific === 'None' ? '' : honorific,
        given_name: cleanGiven,
        middle_name: cleanMiddle || null,
        surname: cleanSurname,
        suffix: suffix === 'None' ? '' : suffix,
        full_name: formattedFullName,
        employee_id: cleanEmpId,
        email: cleanEmail
      },
      employment: {
        personnel_category: personnelCategory,
        position_title: smartCapitalize(positionTitle) || null,
        college: reqs.college ? college : null,
        department: reqs.department ? department : null,
        academic_rank: reqs.academicRank ? academicRank : null,
        employment_classification: employmentClassification || null,
        employment_status: employmentStatus || null,
        hire_date: hireDate || null
      },
      account: {
        base_role: baseRole,
        account_status: 'pending_placement',
        invitation_option: invitationOption
      },
      // Root properties for backwards compatibility
      full_name: formattedFullName,
      email: cleanEmail,
      employee_id: cleanEmpId,
      college: reqs.college ? college : 'Pending placement',
      department: reqs.department ? department : 'Pending placement',
      academic_rank: reqs.academicRank ? academicRank : 'Not applicable',
      employment_status: employmentClassification || 'Pending placement',
      tenure_years: 1,
      user_type: baseRole,
      is_pending_placement: true
    }

    try {
      await Promise.resolve(onSubmit?.(payload))
      draftHook.clearDraft()
      resetFormState()
      setIsSubmitting(false)
      onClose()
    } catch (err) {
      console.error('Pending placement save failed:', err)
      setIsSubmitting(false)
    }
  }

  // Final Submission Handler (Full Account Creation & Invitation)
  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault()

    // Re-validate all steps before submitting
    const v1 = validateStep1()
    const v2 = validateStep2()
    const v3 = validateStep3()

    if (!v1) { setActiveStep(1); return }
    if (!v2) { setActiveStep(2); return }
    if (!v3) { setActiveStep(3); return }

    setIsSubmitting(true)
    const fullCollegeName = college === 'CEAC' ? 'CEAC - College of Engineering, Architecture, and Computing' :
      college === 'CBA' ? 'CBA - College of Business Administration' :
        'CAS - College of Arts and Sciences'

    const cleanGiven = smartCapitalize(givenName)
    const cleanMiddle = smartCapitalize(middleName)
    const cleanSurname = smartCapitalize(surname)
    const cleanEmail = normalizeInstitutionalEmail(email)
    const cleanEmpId = normalizeEmployeeId(employeeId)
    const formattedFullName = getFormattedFullName()

    const payload = {
      status: 'READY_FOR_INVITATION',
      action: 'create_and_invite',
      identity: {
        honorific: honorific === 'None' ? '' : honorific,
        given_name: cleanGiven,
        middle_name: cleanMiddle || null,
        surname: cleanSurname,
        suffix: suffix === 'None' ? '' : suffix,
        full_name: formattedFullName,
        employee_id: cleanEmpId,
        email: cleanEmail
      },
      employment: {
        personnel_category: personnelCategory,
        position_title: smartCapitalize(positionTitle),
        college: reqs.college ? fullCollegeName : null,
        department: reqs.department ? department : null,
        academic_rank: reqs.academicRank ? academicRank : null,
        employment_classification: employmentClassification,
        employment_status: employmentStatus,
        hire_date: hireDate
      },
      account: {
        base_role: baseRole,
        account_status: 'invited',
        invitation_option: invitationOption,
        temp_password: tempPassword
      },
      // Root properties for backwards compatibility
      full_name: formattedFullName,
      email: cleanEmail,
      employee_id: cleanEmpId,
      college: fullCollegeName,
      department,
      academic_rank: reqs.academicRank ? academicRank : 'Not applicable',
      employment_status: employmentClassification,
      tenure_years: 1,
      user_type: baseRole
    }

    try {
      await Promise.resolve(onSubmit?.(payload))
      draftHook.clearDraft()
      resetFormState()
      setIsSubmitting(false)
      onClose()
    } catch (err) {
      console.error('Final account creation failed:', err)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 font-sans max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-xs font-black text-[#064e2b] dark:text-emerald-400 uppercase tracking-wider">
              <UserPlus className="w-4 h-4" />
              <span>Onboard Personnel Account</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Unfinished Draft Recovery Alert Banner */}
          {draftHook.recoveryDecisionPending && (
            <OnboardingDraftRecoveryBanner
              draft={draftHook.recoverableDraft}
              onResume={handleResumeDraft}
              onRequestStartFresh={handleRequestStartFresh}
            />
          )}

          {/* Scrollable Vertical Accordion Stepper Body */}
          <div className="overflow-y-auto flex-1 pr-1 space-y-0">
            {/* STEP 1: IDENTITY */}
            <div ref={stepRef1} className="relative flex items-start gap-3 group">
              {/* Left Column: Node & Connecting Line */}
              <div className="flex flex-col items-center shrink-0 w-8 self-stretch">
                <button
                  type="button"
                  onClick={() => handleStepHeaderClick(1)}
                  disabled={!completedSteps.has(1) && activeStep !== 1}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition z-10 ${completedSteps.has(1)
                      ? 'bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700'
                      : activeStep === 1
                        ? 'bg-[#EFF7F0] dark:bg-emerald-500 text-white shadow-md'
                        : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400 bg-white dark:bg-[#131e2e]'
                    }`}
                >
                  {completedSteps.has(1) ? <Check className="w-4 h-4" /> : '1'}
                </button>
                {/* Vertical Line Connector */}
                <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
              </div>

              {/* Right Column: Step Content */}
              <div className="flex-1 pb-6 min-w-0">
                {/* Step Header */}
                <div
                  onClick={() => handleStepHeaderClick(1)}
                  className={`flex items-center justify-between transition ${completedSteps.has(1) ? 'cursor-pointer group/hdr' : ''
                    }`}
                >
                  <div>
                    <h3 className={`text-sm font-bold ${activeStep === 1 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      Step 1: Identity
                    </h3>
                    {activeStep !== 1 && completedSteps.has(1) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                        {getFormattedFullName()} • <span className="font-mono">{employeeId}</span> • {email || 'No email'}
                      </p>
                    )}
                    {activeStep === 1 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Enter the personnel member's official identifying and contact details.
                      </p>
                    )}
                  </div>

                  {completedSteps.has(1) && activeStep !== 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="text-xs font-bold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {/* Expanded Form Panel */}
                {activeStep === 1 && (
                  <div id="step-panel-1" className="mt-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                    {/* Title / Honorific & Suffix Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Title / Honorific <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <select
                          value={honorific}
                          onChange={e => setHonorific(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#69A97C]"
                        >
                          <option value="None">None</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Engr.">Engr.</option>
                          <option value="Prof.">Prof.</option>
                          <option value="Arch.">Arch.</option>
                          <option value="Rev.">Rev.</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Suffix <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <select
                          value={suffix}
                          onChange={e => setSuffix(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#69A97C]"
                        >
                          <option value="None">None</option>
                          <option value="Jr.">Jr.</option>
                          <option value="Sr.">Sr.</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                          <option value="IV">IV</option>
                          <option value="Ph.D.">Ph.D.</option>
                        </select>
                      </div>
                    </div>

                    {/* Given Name & Surname */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Given Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={givenNameRef}
                          name="givenName"
                          type="text"
                          required
                          maxLength={50}
                          autoComplete="given-name"
                          aria-invalid={Boolean(errors.givenName)}
                          aria-describedby={errors.givenName ? 'givenName-error' : undefined}
                          value={givenName}
                          onChange={e => {
                            setGivenName(e.target.value)
                            if (errors.givenName) setErrors(prev => ({ ...prev, givenName: null }))
                          }}
                          onBlur={() => setGivenName(prev => smartCapitalize(prev))}
                          placeholder="e.g. Ana"
                          className={`w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold focus:outline-none ${errors.givenName ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-[#69A97C]'
                            }`}
                        />
                        {errors.givenName && (
                          <p id="givenName-error" className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.givenName}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Surname <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={surnameRef}
                          name="surname"
                          type="text"
                          required
                          maxLength={50}
                          autoComplete="family-name"
                          aria-invalid={Boolean(errors.surname)}
                          aria-describedby={errors.surname ? 'surname-error' : undefined}
                          value={surname}
                          onChange={e => {
                            setSurname(e.target.value)
                            if (errors.surname) setErrors(prev => ({ ...prev, surname: null }))
                          }}
                          onBlur={() => setSurname(prev => smartCapitalize(prev))}
                          placeholder="e.g. Reyes"
                          className={`w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold focus:outline-none ${errors.surname ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-[#69A97C]'
                            }`}
                        />
                        {errors.surname && (
                          <p id="surname-error" className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.surname}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle Name (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Middle Name / Initial <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        ref={middleNameRef}
                        name="middleName"
                        type="text"
                        maxLength={50}
                        aria-invalid={Boolean(errors.middleName)}
                        aria-describedby={errors.middleName ? 'middleName-error' : undefined}
                        value={middleName}
                        onChange={e => {
                          setMiddleName(e.target.value)
                          if (errors.middleName) setErrors(prev => ({ ...prev, middleName: null }))
                        }}
                        onBlur={() => setMiddleName(prev => smartCapitalize(prev))}
                        placeholder="e.g. Santos or S."
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#69A97C]"
                      />
                      {errors.middleName && (
                        <p id="middleName-error" className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.middleName}</span>
                        </p>
                      )}
                    </div>

                    {/* Employee ID (Unique, Format EMP-YYYY-NNNN) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Employee ID <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleRegenerateEmployeeId}
                          className="text-[11px] font-semibold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Regenerate ID</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        name="employeeId"
                        required
                        maxLength={13}
                        aria-invalid={Boolean(errors.employeeId)}
                        aria-describedby={errors.employeeId ? 'employeeId-error' : undefined}
                        value={employeeId}
                        onChange={e => {
                          setEmployeeId(e.target.value)
                          if (errors.employeeId) setErrors(prev => ({ ...prev, employeeId: null }))
                        }}
                        onBlur={() => setEmployeeId(prev => normalizeEmployeeId(prev))}
                        className={`w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border font-mono text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none ${errors.employeeId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          }`}
                      />
                      {errors.employeeId && (
                        <p id="employeeId-error" className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.employeeId}</span>
                        </p>
                      )}
                    </div>

                    {/* Institutional Email with Suggestion Generator */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Institutional Email <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoGenerateEmail}
                          disabled={!givenName.trim() || !surname.trim()}
                          className="text-[11px] font-semibold text-[#064e2b] dark:text-emerald-400 hover:underline disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Auto-generate Suggestion</span>
                        </button>
                      </div>
                      <input
                        ref={emailRef}
                        name="institutionalEmail"
                        type="email"
                        required
                        maxLength={100}
                        autoComplete="email"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        value={email}
                        onChange={e => {
                          setEmail(e.target.value)
                          if (errors.email) setErrors(prev => ({ ...prev, email: null }))
                        }}
                        onBlur={() => setEmail(prev => normalizeInstitutionalEmail(prev))}
                        placeholder="e.g. areyes@ndmu.edu.ph"
                        className={`w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold focus:outline-none ${errors.email ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-[#69A97C]'
                          }`}
                      />
                      {errors.email ? (
                        <p id="email-error" className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.email}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Must use the official domain (@ndmu.edu.ph).</p>
                      )}
                    </div>

                    {/* Step Action */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleContinueStep(1)}
                        className="px-4 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white text-xs font-extrabold flex items-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        <span>Continue</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: EMPLOYMENT PLACEMENT */}
            <div ref={stepRef2} className="relative flex items-start gap-3 group">
              {/* Left Column: Node & Connector */}
              <div className="flex flex-col items-center shrink-0 w-8 self-stretch">
                <button
                  type="button"
                  onClick={() => handleStepHeaderClick(2)}
                  disabled={!completedSteps.has(2) && activeStep !== 2}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition z-10 ${completedSteps.has(2)
                      ? 'bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700'
                      : activeStep === 2
                        ? 'bg-[#EFF7F0] dark:bg-emerald-500 text-white shadow-md'
                        : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400 bg-white dark:bg-[#131e2e]'
                    }`}
                >
                  {completedSteps.has(2) ? <Check className="w-4 h-4" /> : '2'}
                </button>
                <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
              </div>

              {/* Right Column: Step Content */}
              <div className="flex-1 pb-6 min-w-0">
                <div
                  onClick={() => handleStepHeaderClick(2)}
                  className={`flex items-center justify-between transition ${completedSteps.has(2) ? 'cursor-pointer group/hdr' : ''
                    }`}
                >
                  <div>
                    <h3 className={`text-sm font-bold ${activeStep === 2 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      Step 2: Employment Placement
                    </h3>
                    {activeStep !== 2 && completedSteps.has(2) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                        {reqs.college ? college : 'College N/A'} • {reqs.department ? department : 'Dept N/A'} • {reqs.academicRank ? academicRank : 'Rank N/A'}
                      </p>
                    )}
                    {activeStep === 2 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Assign the personnel member to an organizational unit and classification.
                      </p>
                    )}
                  </div>

                  {completedSteps.has(2) && activeStep !== 2 && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="text-xs font-bold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {activeStep === 2 && (
                  <div id="step-panel-2" className="mt-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                    {/* Category & Title */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Personnel Category</label>
                        <select
                          value={personnelCategory}
                          onChange={e => setPersonnelCategory(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#69A97C]"
                        >
                          <option value="Faculty Member">Faculty Member</option>
                          <option value="Administrative Staff">Administrative Staff</option>
                          <option value="System Administrator">System Administrator</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Position / Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={positionTitleRef}
                          name="positionTitle"
                          type="text"
                          required
                          maxLength={80}
                          autoComplete="organization-title"
                          aria-invalid={Boolean(errors.positionTitle)}
                          aria-describedby={errors.positionTitle ? 'positionTitle-error' : undefined}
                          value={positionTitle}
                          onChange={e => {
                            setPositionTitle(e.target.value)
                            if (errors.positionTitle) setErrors(prev => ({ ...prev, positionTitle: null }))
                          }}
                          onBlur={() => setPositionTitle(prev => smartCapitalize(prev))}
                          placeholder="e.g. Assistant Professor"
                          className={`w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold focus:outline-none ${errors.positionTitle ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-[#69A97C]'
                            }`}
                        />
                        {errors.positionTitle && (
                          <p id="positionTitle-error" className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.positionTitle}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* College & Department Controls */}
                    {reqs.college || reqs.department ? (
                      <div className="grid grid-cols-2 gap-3">
                        {reqs.college ? (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">College</label>
                            <select
                              value={college}
                              onChange={e => handleCollegeChange(e.target.value)}
                              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#69A97C]"
                            >
                              <option value="CEAC">CEAC - Engineering &amp; Computing</option>
                              <option value="CBA">CBA - Business Administration</option>
                              <option value="CAS">CAS - Arts &amp; Sciences</option>
                            </select>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                            <p className="font-bold">College</p>
                            <p className="text-[11px] italic">Not applicable for {personnelCategory}</p>
                          </div>
                        )}

                        {reqs.department ? (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                            <select
                              value={department}
                              onChange={e => setDepartment(e.target.value)}
                              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#69A97C]"
                            >
                              {(collegeDeptMap[college] || []).map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                            <p className="font-bold">Department</p>
                            <p className="text-[11px] italic">Not applicable for {personnelCategory}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                        <p className="font-bold">Organizational Placement</p>
                        <p className="text-[11px] italic">College and Department assignment not applicable for {personnelCategory}.</p>
                      </div>
                    )}

                    {/* Academic Rank & Employment Classification */}
                    <div className="grid grid-cols-2 gap-3">
                      {reqs.academicRank ? (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Rank</label>
                          <select
                            value={academicRank}
                            onChange={e => setAcademicRank(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#69A97C]"
                          >
                            <option value="Instructor I">Instructor I</option>
                            <option value="Instructor II">Instructor II</option>
                            <option value="Instructor III">Instructor III</option>
                            <option value="Assistant Professor I">Assistant Professor I</option>
                            <option value="Assistant Professor II">Assistant Professor II</option>
                            <option value="Associate Professor I">Associate Professor I</option>
                            <option value="Associate Professor II">Associate Professor II</option>
                            <option value="Full Professor I">Full Professor I</option>
                          </select>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                          <p className="font-bold">Academic Rank</p>
                          <p className="text-[11px] italic">Not applicable</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Employment Classification</label>
                        <select
                          value={employmentClassification}
                          onChange={e => setEmploymentClassification(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#69A97C]"
                        >
                          <option value="Full-Time Permanent">Full-Time Permanent</option>
                          <option value="Full-Time Probationary">Full-Time Probationary</option>
                          <option value="Part-Time Lecturer">Part-Time Lecturer</option>
                          <option value="Contractual">Contractual</option>
                        </select>
                      </div>
                    </div>

                    {/* Employment Start Date */}
                    <div>
                      <CustomDatePicker
                        id="employmentStartDate"
                        label="Employment Start Date"
                        value={hireDate}
                        onChange={newDateStr => {
                          setHireDate(newDateStr)
                          if (errors.hireDate) setErrors(prev => ({ ...prev, hireDate: null }))
                        }}
                        minDate="1970-01-01"
                        helperText="Select the first day covered by this personnel employment record. Scheduled start dates up to one year in advance are allowed."
                        error={errors.hireDate}
                      />
                    </div>

                    {/* Step Action */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleContinueStep(2)}
                        className="px-4 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white text-xs font-extrabold flex items-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        <span>Continue</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: BASE ACCOUNT ACCESS */}
            <div ref={stepRef3} className="relative flex items-start gap-3 group">
              {/* Left Column: Node & Connector */}
              <div className="flex flex-col items-center shrink-0 w-8 self-stretch">
                <button
                  type="button"
                  onClick={() => handleStepHeaderClick(3)}
                  disabled={!completedSteps.has(3) && activeStep !== 3}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition z-10 ${completedSteps.has(3)
                      ? 'bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700'
                      : activeStep === 3
                        ? 'bg-[#EFF7F0] dark:bg-emerald-500 text-white shadow-md'
                        : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400 bg-white dark:bg-[#131e2e]'
                    }`}
                >
                  {completedSteps.has(3) ? <Check className="w-4 h-4" /> : '3'}
                </button>
                <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
              </div>

              {/* Right Column: Step Content */}
              <div className="flex-1 pb-6 min-w-0">
                <div
                  onClick={() => handleStepHeaderClick(3)}
                  className={`flex items-center justify-between transition ${completedSteps.has(3) ? 'cursor-pointer group/hdr' : ''
                    }`}
                >
                  <div>
                    <h3 className={`text-sm font-bold ${activeStep === 3 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      Step 3: Base Account Access
                    </h3>
                    {activeStep !== 3 && completedSteps.has(3) && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                        Account Type: Personnel • Delivery: {invitationOption === 'activation_link' ? 'One-Time Activation Link' : 'Temporary Passkey'}
                      </p>
                    )}
                    {activeStep === 3 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Configure the personnel member's login access and activation delivery method.
                      </p>
                    )}
                  </div>

                  {completedSteps.has(3) && activeStep !== 3 && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="text-xs font-bold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {activeStep === 3 && (
                  <div id="step-panel-3" className="mt-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                    {/* Fixed Personnel Account Type Card */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Type</label>
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#EFF7F0]/10 dark:bg-emerald-950/50 flex items-center justify-center text-[#064e2b] dark:text-emerald-400 shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Personnel Account (Standard)</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Standard institutional access for personnel profiles and accomplishments.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#245F42] uppercase tracking-wider shrink-0 ml-2">
                          Fixed
                        </span>
                      </div>
                    </div>

                    {/* Informational Governance Notice Banner */}
                    <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#064e2b] dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                        <p className="font-bold">Governance Separation Notice</p>
                        <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                          This account will receive standard Personnel access. Governance responsibilities are assigned separately after onboarding. HR manages Personnel designations such as <strong>Department Secretary</strong> and <strong>Dean</strong>. OSAD may assign eligible Personnel as <strong>Program Coordinators</strong> or <strong>Organization Moderators</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Activation Method Radio Cards */}
                    <div>
                      <fieldset>
                        <legend className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Activation Method *</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setInvitationOption('activation_link')
                              if (errors.tempPasswordAck) setErrors(prev => ({ ...prev, tempPasswordAck: null }))
                            }}
                            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${invitationOption === 'activation_link'
                                ? 'bg-[#EFF7F0]/10 border-[#69A97C] text-[#064e2b] dark:text-emerald-400 font-bold ring-1 ring-[#064e2b]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                              }`}
                          >
                            <div>
                              <p className="text-xs font-extrabold flex items-center justify-between">
                                <span>One-Time Activation Link</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-[#245F42] uppercase">Recommended</span>
                              </p>
                              <p className="text-[11px] font-normal opacity-80 mt-1">
                                Send a secure, single-use link to {email ? <span className="font-semibold">{email}</span> : 'institutional email'}.
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInvitationOption('temporary_passkey')}
                            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${invitationOption === 'temporary_passkey'
                                ? 'bg-[#EFF7F0]/10 border-[#69A97C] text-[#064e2b] dark:text-emerald-400 font-bold ring-1 ring-[#064e2b]'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                              }`}
                          >
                            <div>
                              <p className="text-xs font-extrabold">Temporary Passkey</p>
                              <p className="text-[11px] font-normal opacity-80 mt-1">
                                Generate a temporary credential for secure manual delivery. The user must replace it at first login.
                              </p>
                            </div>
                          </button>
                        </div>
                      </fieldset>
                    </div>

                    {/* Temporary Passkey Configuration & Acknowledgement */}
                    {invitationOption === 'temporary_passkey' && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2.5 animate-in fade-in duration-100">
                        <div>
                          <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                            Temporary Passkey <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={tempPasswordRef}
                            name="temporaryPasskey"
                            type="password"
                            maxLength={64}
                            autoComplete="new-password"
                            aria-invalid={Boolean(errors.tempPassword)}
                            aria-describedby={errors.tempPassword ? 'tempPassword-error' : undefined}
                            value={tempPassword}
                            onChange={e => {
                              setTempPassword(e.target.value)
                              if (errors.tempPassword) setErrors(prev => ({ ...prev, tempPassword: null }))
                            }}
                            className={`w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border font-mono text-xs font-bold focus:outline-none ${errors.tempPassword ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-amber-300 dark:border-amber-700 focus:border-[#69A97C]'
                              }`}
                          />
                          {errors.tempPassword && (
                            <p id="tempPassword-error" className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{errors.tempPassword}</span>
                            </p>
                          )}
                        </div>

                        {/* Passkey Delivery Acknowledgement */}
                        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={tempPasswordAck}
                            onChange={e => {
                              setTempPasswordAck(e.target.checked)
                              if (errors.tempPasswordAck) setErrors(prev => ({ ...prev, tempPasswordAck: null }))
                            }}
                            className="mt-0.5 rounded text-[#064e2b] focus:ring-[#064e2b] cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 leading-snug">
                            I understand that this passkey must be delivered securely and will only be displayed once.
                          </span>
                        </label>
                        {errors.tempPasswordAck && (
                          <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.tempPasswordAck}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Account Identity Preview Card */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account Identity Preview</p>
                      {givenName && surname && email ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#064e2b] dark:text-emerald-400 shrink-0" />
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {getFormattedFullName()}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 break-all">
                            {email} • {employeeId || 'EMP-ID Pending'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold pt-1">
                          <span>Account identity incomplete (missing name or email).</span>
                          <button
                            type="button"
                            onClick={() => setActiveStep(1)}
                            className="text-xs font-extrabold text-[#064e2b] dark:text-emerald-400 underline cursor-pointer"
                          >
                            Edit Identity
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step Action */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleContinueStep(3)}
                        className="px-4 py-2 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white text-xs font-extrabold flex items-center gap-1 transition cursor-pointer shadow-xs"
                      >
                        <span>Continue</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: REVIEW & CONFIRMATION */}
            <div ref={stepRef4} className="relative flex items-start gap-3 group">
              {/* Left Column: Node */}
              <div className="flex flex-col items-center shrink-0 w-8 self-stretch">
                <button
                  type="button"
                  onClick={() => handleStepHeaderClick(4)}
                  disabled={!completedSteps.has(1) || !completedSteps.has(2) || !completedSteps.has(3)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition z-10 ${activeStep === 4
                      ? 'bg-[#EFF7F0] dark:bg-emerald-500 text-white shadow-md'
                      : 'border-2 border-slate-300 dark:border-slate-700 text-slate-400 bg-white dark:bg-[#131e2e]'
                    }`}
                >
                  4
                </button>
              </div>

              {/* Right Column: Step Content */}
              <div className="flex-1 min-w-0">
                <div>
                  <h3 className={`text-sm font-bold ${activeStep === 4 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    Step 4: Review &amp; Confirmation
                  </h3>
                  {activeStep === 4 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Review the onboarding information before creating the account and sending the invitation.
                    </p>
                  )}
                </div>

                {activeStep === 4 && (
                  <div id="step-panel-4" className="mt-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                    {/* Identity Review Card */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">1. Identity</span>
                        <button
                          type="button"
                          onClick={() => setActiveStep(1)}
                          className="text-[11px] font-bold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <p><strong className="text-slate-500">Official Full Name:</strong> {getFormattedFullName()}</p>
                      {smartCapitalize(middleName) ? (
                        <p><strong className="text-slate-500">Middle Name:</strong> {smartCapitalize(middleName)}</p>
                      ) : (
                        <p><strong className="text-slate-500">Middle Name:</strong> <span className="italic text-slate-400">Not provided</span></p>
                      )}
                      {suffix && suffix !== 'None' ? (
                        <p><strong className="text-slate-500">Suffix:</strong> {suffix}</p>
                      ) : (
                        <p><strong className="text-slate-500">Suffix:</strong> <span className="italic text-slate-400">Not provided</span></p>
                      )}
                      <p><strong className="text-slate-500">Employee ID:</strong> <span className="font-mono">{normalizeEmployeeId(employeeId)}</span></p>
                      <p><strong className="text-slate-500">Institutional Email:</strong> {normalizeInstitutionalEmail(email)}</p>
                    </div>

                    {/* Employment Review Card */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">2. Employment Placement</span>
                        <button
                          type="button"
                          onClick={() => setActiveStep(2)}
                          className="text-[11px] font-bold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <p><strong className="text-slate-500">Category &amp; Position:</strong> {personnelCategory} — {smartCapitalize(positionTitle)}</p>
                      <p>
                        <strong className="text-slate-500">College:</strong>{' '}
                        {reqs.college ? (college || <span className="italic text-amber-600 font-semibold">Pending assignment</span>) : <span className="italic text-slate-400">Not applicable</span>}
                      </p>
                      <p>
                        <strong className="text-slate-500">Department:</strong>{' '}
                        {reqs.department ? (department || <span className="italic text-amber-600 font-semibold">Pending assignment</span>) : <span className="italic text-slate-400">Not applicable</span>}
                      </p>
                      <p>
                        <strong className="text-slate-500">Academic Rank:</strong>{' '}
                        {reqs.academicRank ? (academicRank || <span className="italic text-amber-600 font-semibold">Pending assignment</span>) : <span className="italic text-slate-400">Not applicable</span>}
                      </p>
                      <p><strong className="text-slate-500">Classification:</strong> {employmentClassification}</p>
                      <p><strong className="text-slate-500">Appointment Date:</strong> {hireDate}</p>
                    </div>

                    {/* Base Account Access Review Card */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">3. Base Account Access</span>
                        <button
                          type="button"
                          onClick={() => setActiveStep(3)}
                          className="text-[11px] font-bold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <p><strong className="text-slate-500">Account Type:</strong> Personnel Account (Standard)</p>
                      <p><strong className="text-slate-500">Activation Choice:</strong> {invitationOption === 'activation_link' ? 'One-Time Activation Link (Recommended)' : 'Temporary Passkey'}</p>
                      {invitationOption === 'temporary_passkey' && (
                        <p><strong className="text-slate-500">Passkey Security:</strong> Delivery acknowledged by HR verifier</p>
                      )}
                      <p className="text-[11px] text-slate-400 italic">Governance responsibilities (such as Department Secretary or Dean) are assigned separately through authorized modules.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2 ml-auto">
              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={() => handleContinueStep(activeStep)}
                  className="px-4 py-2.5 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSavePending}
                    disabled={isSubmitting}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200/80 dark:border-slate-700"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>Save as Pending Placement</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-[#EFF7F0] hover:bg-[#143326] text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Create Account and Send Invitation</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discard Draft Confirmation Modal */}
      <DiscardOnboardingDraftModal
        isOpen={isDiscardConfirmOpen}
        targetName={draftHook.recoverableDraft?.identity?.firstName ? `${draftHook.recoverableDraft.identity.firstName} ${draftHook.recoverableDraft.identity.lastName}` : 'Personnel Member'}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirmDiscard={handleConfirmDiscard}
      />
    </>
  )
}
