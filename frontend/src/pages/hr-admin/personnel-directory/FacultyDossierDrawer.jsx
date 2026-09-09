import React from 'react'
import {
  formatPersonnelPlacement,
  formatPersonnelClassification,
  formatFacultyEngagement,
  formatEmploymentStatus,
  isAcademicPersonnel
} from '../../../utils/personnelPlacement'
import { X, Building2, Award, ShieldCheck, KeyRound, Edit3, CheckCircle2, Briefcase, GraduationCap } from 'lucide-react'

export default function FacultyDossierDrawer({
  personnel,
  isOpen,
  onClose,
  onEditAssignment,
  onEditMasterData,
  onPromoteRank,
  onResetPassword,
  onManageRole
}) {
  if (!isOpen || !personnel) return null

  const handleEditMaster = () => {
    if (onEditMasterData) {
      onEditMasterData(personnel)
    } else if (onEditAssignment) {
      onEditAssignment(personnel)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Container */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-[#131e2e] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col font-sans overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-xs font-black text-[#064e2b] dark:text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Personnel Profile Dossier</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content Body (Independently Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identity Header */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <img
              src={personnel.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(personnel.full_name || 'P')}&background=064e2b&color=fff`}
              alt={personnel.full_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
            />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {personnel.full_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{personnel.email}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {personnel.employee_id || personnel.institutional_id}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#064e2b] dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800">
                  {formatEmploymentStatus(personnel)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Official HR Master Data (Plan D2) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>HR Master Data &amp; Status (Plan D2)</span>
              </h4>
              <button
                type="button"
                onClick={handleEditMaster}
                className="text-xs font-extrabold text-[#064e2b] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit Master Data</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Faculty Engagement</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{formatFacultyEngagement(personnel)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Employment Status</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{formatEmploymentStatus(personnel)}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Position Title (Job)</p>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{personnel.position_title || personnel.designation || 'Personnel'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Academic Rank</p>
                  <p className="font-extrabold text-[#064e2b] dark:text-emerald-400 mt-0.5">{personnel.current_rank_title || personnel.academic_rank || 'N/A'}</p>
                </div>
              </div>

              {personnel.qualification_summary && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Qualifications (HR Record)</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{personnel.qualification_summary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Classification & Organizational Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Classification &amp; Assignment (Plan D1)</span>
              </h4>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-2 text-xs">
              <div>
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Personnel Classification</p>
                <p className="font-extrabold text-[#064e2b] dark:text-emerald-400">{formatPersonnelClassification(personnel)}</p>
              </div>
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">College / Unit</p>
                <p className="font-extrabold text-slate-900 dark:text-white">{personnel.college || personnel.college_name || personnel.administrative_unit_name || 'N/A'}</p>
              </div>
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">{isAcademicPersonnel(personnel) ? 'College & Academic Programs' : 'Administrative Unit'}</p>
                <p className="font-extrabold text-slate-900 dark:text-white">{formatPersonnelPlacement(personnel)}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Academic Information & Credentials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Tenure &amp; Verified Proofs</span>
              </h4>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Tenure</p>
                  <p className="font-extrabold text-slate-900 dark:text-white">{personnel.tenure_years || 0} Years</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400">Verified Proofs</p>
                  <p className="font-extrabold text-[#064e2b] dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{personnel.verified_accomplishments_count || 0} Credentials</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Account & Access Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Account &amp; Security Administration</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onResetPassword(personnel)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Password</span>
              </button>

              <button
                type="button"
                onClick={() => onManageRole(personnel)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Manage Role</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
