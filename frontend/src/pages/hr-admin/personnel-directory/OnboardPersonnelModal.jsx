import React, { useState } from 'react'
import {
  X, UserPlus, Check, ChevronRight, ChevronLeft, ShieldCheck,
  Building2, User, Award, RefreshCw, Sparkles, CheckCircle2, Edit3, Lock, Info
} from 'lucide-react'

export default function OnboardPersonnelModal({
  isOpen,
  onClose,
  onSubmit
}) {
  const [step, setStep] = useState(1)

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

  // Stage 3: Base Account Access State
  const [baseRole, setBaseRole] = useState('faculty')
  const [accountStatus, setAccountStatus] = useState('invited')
  const [invitationOption, setInvitationOption] = useState('activation_link')
  const [tempPassword, setTempPassword] = useState('NDMU-Pass2026!')

  const collegeDeptMap = {
    'CEAC': ['Department of Computer Studies', 'Department of Engineering', 'Department of Physical Sciences'],
    'CBA': ['Department of Business Management'],
    'CAS': ['Department of Arts & Humanities'],
  }

  const handleCollegeChange = (col) => {
    setCollege(col)
    const validDepts = collegeDeptMap[col] || []
    setDepartment(validDepts[0] || '')
  }

  const handleRegenerateEmployeeId = () => {
    const newId = `EMP-2026-${Math.floor(1000 + Math.random() * 9000)}`
    setEmployeeId(newId)
  }

  const handleAutoGenerateEmail = () => {
    if (!givenName.trim() || !surname.trim()) return
    const firstInitial = givenName.trim().charAt(0).toLowerCase()
    const cleanSurname = surname.trim().toLowerCase().replace(/[^a-z]/g, '')
    setEmail(`${firstInitial}${cleanSurname}@ndmu.edu.ph`)
  }

  const getFormattedFullName = () => {
    const parts = []
    if (honorific && honorific !== 'None') parts.push(honorific)
    if (givenName.trim()) parts.push(givenName.trim())
    if (middleName.trim()) parts.push(middleName.trim())
    if (surname.trim()) parts.push(surname.trim())
    if (suffix && suffix !== 'None') parts.push(suffix)
    return parts.join(' ') || 'Unnamed Personnel'
  }

  if (!isOpen) return null

  const handleFinalSubmit = (e) => {
    e.preventDefault()
    const fullCollegeName = college === 'CEAC' ? 'CEAC - College of Engineering, Architecture, and Computing' :
                           college === 'CBA' ? 'CBA - College of Business Administration' :
                           'CAS - College of Arts and Sciences'

    const formattedFullName = getFormattedFullName()

    if (onSubmit) {
      onSubmit({
        identity: {
          honorific: honorific === 'None' ? '' : honorific,
          given_name: givenName,
          middle_name: middleName,
          surname,
          suffix: suffix === 'None' ? '' : suffix,
          full_name: formattedFullName,
          employee_id: employeeId,
          email
        },
        employment: {
          personnel_category: personnelCategory,
          position_title: positionTitle,
          college: fullCollegeName,
          department,
          academic_rank: academicRank,
          employment_classification: employmentClassification,
          employment_status: employmentStatus,
          hire_date: hireDate
        },
        account: {
          base_role: baseRole,
          account_status: accountStatus,
          invitation_option: invitationOption,
          temp_password: tempPassword
        },
        // Root properties for backwards compatibility with parent components
        full_name: formattedFullName,
        email,
        employee_id: employeeId,
        college: fullCollegeName,
        department,
        academic_rank: academicRank,
        employment_status: employmentClassification,
        tenure_years: 1,
        user_type: baseRole
      })
    }
    onClose()
  }

  const handleNextStep = (e) => {
    e.preventDefault()
    if (step < 4) {
      setStep(prev => prev + 1)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#131e2e] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 font-sans max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 text-xs font-black text-[#1b4332] dark:text-emerald-400 uppercase tracking-wider">
              <UserPlus className="w-4 h-4" />
              <span>Onboard Personnel (Stage {step} of 4)</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4-Stage Interactive Wizard Stepper Header */}
          <div className="grid grid-cols-4 gap-2 shrink-0">
            {[
              { id: 1, label: 'Identity', icon: User },
              { id: 2, label: 'Employment', icon: Building2 },
              { id: 3, label: 'Base Access', icon: ShieldCheck },
              { id: 4, label: 'Review & Create', icon: CheckCircle2 }
            ].map((s) => {
              const Icon = s.icon
              const isCompleted = s.id < step
              const isCurrent = s.id === step

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => isCompleted && setStep(s.id)}
                  disabled={!isCompleted && !isCurrent}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition ${
                    isCurrent
                      ? 'bg-[#1b4332]/10 dark:bg-emerald-950/40 border-[#1b4332] dark:border-emerald-500 text-[#1b4332] dark:text-emerald-300'
                      : isCompleted
                      ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 cursor-pointer'
                      : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-3.5 h-3.5" />
                    {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <span className="text-[11px] font-bold tracking-tight">{s.id}. {s.label}</span>
                </button>
              )
            })}
          </div>

          {/* Scrollable Form Stage Body */}
          <div className="overflow-y-auto flex-1 pr-1">
            <form id="onboard-form" onSubmit={step === 4 ? handleFinalSubmit : handleNextStep} className="space-y-4">
              {/* STAGE 1: IDENTITY */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Formatted Name Preview</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{getFormattedFullName()}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      Stage 1
                    </span>
                  </div>

                  {/* Title / Honorific & Suffix Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Title / Honorific <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={honorific}
                        onChange={e => setHonorific(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
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
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
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
                        type="text"
                        required
                        value={givenName}
                        onChange={e => setGivenName(e.target.value)}
                        placeholder="e.g. Ana"
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Surname <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={surname}
                        onChange={e => setSurname(e.target.value)}
                        placeholder="e.g. Reyes"
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                      />
                    </div>
                  </div>

                  {/* Middle Name (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Middle Name / Initial <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={e => setMiddleName(e.target.value)}
                      placeholder="e.g. Santos or S."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                    />
                  </div>

                  {/* Employee ID (Unique, Read-Only with Generator) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateEmployeeId}
                        className="text-[11px] font-semibold text-[#1b4332] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate ID</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      readOnly
                      value={employeeId}
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                    />
                  </div>

                  {/* Institutional Email with Generator Shortcut */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Institutional Email <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoGenerateEmail}
                        disabled={!givenName.trim() || !surname.trim()}
                        className="text-[11px] font-semibold text-[#1b4332] dark:text-emerald-400 hover:underline disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-generate Suggestion</span>
                      </button>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. areyes@ndmu.edu.ph"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Must be a valid institutional domain (@ndmu.edu.ph).</p>
                  </div>
                </div>
              )}

              {/* STAGE 2: EMPLOYMENT & ORGANIZATIONAL PLACEMENT */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Building2 className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                    <span>Stage 2: Employment &amp; Organizational Placement</span>
                  </div>

                  {/* Personnel Category & Position Title */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Personnel Category</label>
                      <select
                        value={personnelCategory}
                        onChange={e => setPersonnelCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                      >
                        <option value="Faculty Member">Faculty Member</option>
                        <option value="Administrative Staff">Administrative Staff</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Position / Job Title</label>
                      <input
                        type="text"
                        required
                        value={positionTitle}
                        onChange={e => setPositionTitle(e.target.value)}
                        placeholder="e.g. Assistant Professor"
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                      />
                    </div>
                  </div>

                  {/* College & Department */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">College</label>
                      <select
                        value={college}
                        onChange={e => handleCollegeChange(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                      >
                        <option value="CEAC">CEAC - Engineering &amp; Computing</option>
                        <option value="CBA">CBA - Business Administration</option>
                        <option value="CAS">CAS - Arts &amp; Sciences</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                      <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                      >
                        {(collegeDeptMap[college] || []).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Academic Rank & Employment Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Rank</label>
                      <select
                        value={academicRank}
                        onChange={e => setAcademicRank(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Employment Classification</label>
                      <select
                        value={employmentClassification}
                        onChange={e => setEmploymentClassification(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                      >
                        <option value="Full-Time Permanent">Full-Time Permanent</option>
                        <option value="Full-Time Probationary">Full-Time Probationary</option>
                        <option value="Part-Time Lecturer">Part-Time Lecturer</option>
                      </select>
                    </div>
                  </div>

                  {/* Hire Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hire / Appointment Date</label>
                    <input
                      type="date"
                      value={hireDate}
                      onChange={e => setHireDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                    />
                  </div>
                </div>
              )}

              {/* STAGE 3: BASE ACCOUNT ACCESS */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                    <span>Stage 3: Base Account Access</span>
                  </div>

                  {/* Base System Role */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Base System Role</label>
                    <select
                      value={baseRole}
                      onChange={e => setBaseRole(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:border-[#1b4332]"
                    >
                      <option value="faculty">Faculty / Academic Personnel</option>
                      <option value="staff">Administrative Staff</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>

                  {/* Governance Role Separation Informative Callout */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      <p className="font-bold">Governance Role Appointment Separation</p>
                      <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                        Governance positions (such as <strong>College Dean</strong>) are appointed separately by <strong>OSAD</strong> after account creation. HR onboarding creates base account identity and employment placement only.
                      </p>
                    </div>
                  </div>

                  {/* Invitation Option */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Activation Invitation Delivery</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInvitationOption('activation_link')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          invitationOption === 'activation_link'
                            ? 'bg-[#1b4332]/10 border-[#1b4332] text-[#1b4332] dark:text-emerald-400 font-bold'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <p className="text-xs font-bold">One-Time Activation Link</p>
                        <p className="text-[10px] font-normal opacity-80 mt-0.5">Secure email link (Recommended)</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInvitationOption('temporary_passkey')}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          invitationOption === 'temporary_passkey'
                            ? 'bg-[#1b4332]/10 border-[#1b4332] text-[#1b4332] dark:text-emerald-400 font-bold'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <p className="text-xs font-bold">Temporary Passkey</p>
                        <p className="text-[10px] font-normal opacity-80 mt-0.5">Requires change at 1st login</p>
                      </button>
                    </div>
                  </div>

                  {invitationOption === 'temporary_passkey' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Temporary Passkey</label>
                      <input
                        type="text"
                        value={tempPassword}
                        onChange={e => setTempPassword(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs font-bold focus:outline-none focus:border-[#1b4332]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 4: REVIEW & CREATE */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-[#1b4332] dark:text-emerald-400" />
                      <span>Stage 4: Review Account Creation Summary</span>
                    </div>
                  </div>

                  {/* Summary Card 1: Identity */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">1. Identity Details</span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[11px] font-bold text-[#1b4332] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p><strong className="text-slate-500">Official Full Name:</strong> {getFormattedFullName()}</p>
                    {middleName && <p><strong className="text-slate-500">Middle Name:</strong> {middleName}</p>}
                    {suffix && suffix !== 'None' && <p><strong className="text-slate-500">Suffix:</strong> {suffix}</p>}
                    <p><strong className="text-slate-500">Employee ID:</strong> <span className="font-mono">{employeeId}</span></p>
                    <p><strong className="text-slate-500">Institutional Email:</strong> {email}</p>
                  </div>

                  {/* Summary Card 2: Employment */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">2. Employment Placement</span>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-[11px] font-bold text-[#1b4332] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p><strong className="text-slate-500">Category &amp; Title:</strong> {personnelCategory} — {positionTitle}</p>
                    <p><strong className="text-slate-500">College:</strong> {college}</p>
                    <p><strong className="text-slate-500">Department:</strong> {department}</p>
                    <p><strong className="text-slate-500">Academic Rank:</strong> {academicRank}</p>
                    <p><strong className="text-slate-500">Status &amp; Class:</strong> {employmentClassification}</p>
                    <p><strong className="text-slate-500">Appointment Date:</strong> {hireDate}</p>
                  </div>

                  {/* Summary Card 3: Account Access */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">3. Base Account Access</span>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="text-[11px] font-bold text-[#1b4332] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <p><strong className="text-slate-500">Base System Role:</strong> {baseRole.toUpperCase()}</p>
                    <p><strong className="text-slate-500">Delivery Choice:</strong> {invitationOption === 'activation_link' ? 'One-Time Activation Link' : 'Temporary Passkey'}</p>
                    <p className="text-[11px] text-slate-400 italic">Governance positions (e.g. Dean) will be appointed separately by OSAD.</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Navigation Controls Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(prev => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                type="submit"
                form="onboard-form"
                className="px-4 py-2 rounded-xl bg-[#1b4332] hover:bg-[#143326] text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer ml-auto shadow-xs"
              >
                <span>Next Stage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                form="onboard-form"
                className="px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#143326] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer ml-auto"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Create personnel account and send invitation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
