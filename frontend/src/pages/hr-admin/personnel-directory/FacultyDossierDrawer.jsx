import React, { useEffect } from 'react'
import {
  formatPersonnelPlacement,
  formatPersonnelClassification,
  formatFacultyEngagement,
  formatEmploymentStatus,
  isAcademicPersonnel
} from '../../../utils/personnelPlacement'
import { X, Building2, Award, ShieldCheck, KeyRound, Edit3, CheckCircle2, Briefcase } from 'lucide-react'
import { formatEmploymentStartDate } from '../../../utils/employmentDate'

export default function FacultyDossierDrawer({
  personnel,
  isOpen,
  onClose,
  onEditAssignment,
  onEditMasterData,
  onResetPassword,
  onManageRole
}) {
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen || !personnel) return null

  const handleEditMaster = () => {
    if (onEditMasterData) {
      onEditMasterData(personnel)
    } else if (onEditAssignment) {
      onEditAssignment(personnel)
    }
  }

  const initials = personnel.full_name
    ? personnel.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'P'
  const position = personnel.position_title || personnel.designation || 'Personnel'
  const rank = personnel.current_rank_title || personnel.academic_rank || ''
  const showRank = rank && rank.trim().toLowerCase() !== position.trim().toLowerCase()
  const readiness = personnel.login_readiness || { status: 'UNKNOWN', reason_codes: [] }
  const readinessLabels = {
    READY: 'Login Ready',
    NEEDS_PASSWORD_CHANGE: 'Password Change Required',
    NOT_READY: 'Login Not Ready',
    DISABLED: 'Login Disabled',
    IDENTITY_CONFLICT: 'Account Conflict',
    UNKNOWN: 'Readiness Unknown'
  }
  const reasonLabels = {
    MISSING_PERSONNEL_PROFILE: 'Personnel profile is missing',
    INACTIVE_PROFILE: 'Personnel profile is inactive',
    WRONG_ACCOUNT_TYPE: 'Account type is not Personnel',
    MISSING_CREDENTIAL: 'Authentication credential is missing',
    EMPTY_PASSWORD_HASH: 'Authentication credential is incomplete',
    INACTIVE_CREDENTIAL: 'Authentication credential is disabled',
    MISSING_PERSONNEL_ROLE: 'Base Personnel role is missing',
    MUST_CHANGE_PASSWORD: 'Password must be changed at next sign-in',
    DUPLICATE_EMAIL: 'Institutional email is assigned more than once',
    DUPLICATE_EMPLOYEE_ID: 'Employee ID is assigned more than once'
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-modal-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 font-sans animate-in fade-in duration-200"
    >
      {/* Backdrop click area */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-right duration-300">
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-20 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 text-xs font-black text-[#064e2b] dark:text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span id="dossier-modal-title">Personnel details</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close personnel details"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7">
          {/* Identity Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              {personnel.avatar_url ? (
                <img
                  src={personnel.avatar_url}
                  alt={personnel.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#064e2b] dark:bg-emerald-800 text-white font-extrabold text-xl flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                  {initials}
                </div>
              )}
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {personnel.full_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{personnel.email || personnel.institutional_email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {personnel.employee_id || personnel.institutional_id || 'ID Pending'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#064e2b] dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800">
                    {formatEmploymentStatus(personnel)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleEditMaster}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[#064e2b] dark:text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Master Data</span>
              </button>
            </div>
          </div>

          {/* 2-Column Responsive Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Official HR Master Data & Status */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>HR Master Data &amp; Status</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Faculty Engagement</p>
                    <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{formatFacultyEngagement(personnel)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Employment Status</p>
                    <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{formatEmploymentStatus(personnel)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Employment Start Date</p>
                    <p className="mt-0.5 font-extrabold text-slate-900 dark:text-white">{formatEmploymentStartDate(personnel.employment_start_date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Service Rendered</p>
                    <p className="mt-0.5 font-extrabold text-slate-900 dark:text-white">{personnel.service_duration?.display || 'Unavailable until recorded'}</p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Position Title</p>
                    <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{position}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Academic Rank</p>
                    <p className="font-extrabold text-[#064e2b] dark:text-emerald-400 mt-0.5">{showRank ? rank : 'Same as position'}</p>
                  </div>
                </div>

                {personnel.qualification_summary && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Qualifications (HR Record)</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{personnel.qualification_summary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Classification & Organizational Assignment */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Classification &amp; Assignment</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-3 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Personnel Classification</p>
                  <p className="font-extrabold text-[#064e2b] dark:text-emerald-400 mt-0.5">{formatPersonnelClassification(personnel)}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">College / Unit</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{personnel.college || personnel.college_name || personnel.administrative_unit_name || 'N/A'}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">{isAcademicPersonnel(personnel) ? 'College & Academic Programs' : 'Administrative Unit'}</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{formatPersonnelPlacement(personnel)}</p>
                </div>
              </div>
            </div>
          </div>

          <section aria-labelledby="account-access-title" className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h4 id="account-access-title" className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              Account Access
            </h4>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs sm:grid-cols-4">
              <div><dt className="text-slate-500 dark:text-slate-400">Profile status</dt><dd className="mt-0.5 font-bold capitalize text-slate-900 dark:text-white">{personnel.status || personnel.account_status || 'Unknown'}</dd></div>
              <div><dt className="text-slate-500 dark:text-slate-400">Login readiness</dt><dd className="mt-0.5 font-bold text-slate-900 dark:text-white">{readinessLabels[readiness.status] || readinessLabels.UNKNOWN}</dd></div>
              <div><dt className="text-slate-500 dark:text-slate-400">Credential</dt><dd className="mt-0.5 font-bold text-slate-900 dark:text-white">{readiness.reason_codes?.includes('MISSING_CREDENTIAL') ? 'Missing' : readiness.reason_codes?.includes('INACTIVE_CREDENTIAL') ? 'Disabled' : readiness.status === 'UNKNOWN' ? 'Unknown' : 'Ready'}</dd></div>
              <div><dt className="text-slate-500 dark:text-slate-400">Base Personnel role</dt><dd className="mt-0.5 font-bold text-slate-900 dark:text-white">{readiness.reason_codes?.includes('MISSING_PERSONNEL_ROLE') ? 'Missing' : readiness.status === 'UNKNOWN' ? 'Unknown' : 'Active'}</dd></div>
            </dl>
            {readiness.reason_codes?.length > 0 && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                <p className="font-bold">Attention required</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  {readiness.reason_codes.map(reason => <li key={reason}>{reasonLabels[reason] || reason.toLowerCase().replace(/_/g, ' ')}</li>)}
                </ul>
              </div>
            )}
          </section>

          {/* Row 2: Tenure & Credentials and Account Administration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Section 3: Academic Information & Credentials */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Tenure &amp; Verified Proofs</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Tenure</p>
                    <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{personnel.tenure_years || 0} Years</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-extrabold text-slate-400">Verified Proofs</p>
                    <p className="font-extrabold text-[#064e2b] dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{personnel.verified_accomplishments_count || 0} Credentials</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Account & Access Security */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Account &amp; Security Administration</span>
              </h4>

              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onResetPassword?.(personnel)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onManageRole?.(personnel)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Manage Role</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
