import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DigitalBarcodeIDCardModal from '../student/modals/DigitalBarcodeIDCardModal'
import EditBasicInfoModal from './modals/EditBasicInfoModal'
import PersonnelSubmissionModal from './modals/PersonnelSubmissionModal'
import CoordinatorDashboardPage from './program-coordinator/CoordinatorDashboardPage'
import OrganizationModeratorDashboardPage from './organization-moderator/OrganizationModeratorDashboardPage'
import DepartmentSecretaryDashboardPage from './department-secretary/DepartmentSecretaryDashboardPage'

import {
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Plus,
  QrCode,
  ShieldCheck,
  Filter,
  FileCheck2,
  Share2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Users,
  Building2,
  Edit3
} from 'lucide-react'

import { getCurrentUser } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { usePersonnelPortfolio } from '../../hooks/usePersonnelPortfolio'
import PersonnelDashboardController from '../../controllers/PersonnelDashboardController'

export default function PersonnelDashboardPage({ currentUser: propUser, onRoleChange }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeTabParam = searchParams.get('tab')
  const { user: authUser, activeRoleContext: authRoleContext } = useAuth() || {}
  const currentUser = propUser || authUser || getCurrentUser()
  const activeRoleContext = currentUser?.active_role_context || authRoleContext || 'personnel'

  const { portfolio, totals } = usePersonnelPortfolio(currentUser?.employee_id || 'EMP-2021-0842')

  // Modals state
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false)
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  // User Profile
  const [profile, setProfile] = useState(() => PersonnelDashboardController.getDefaultProfile(currentUser))

  useEffect(() => {
    if (currentUser) {
      setProfile(prev => PersonnelDashboardController.mergeProfile(prev, currentUser))
    }
  }, [currentUser])

  const handleRoleChange = (newRole, updatedUser) => {
    if (onRoleChange) onRoleChange(newRole, updatedUser)
  }

  // Accomplishments Mock / State
  const [accomplishments, setAccomplishments] = useState(() => PersonnelDashboardController.getDefaultAccomplishments())

  const handleSaveBasicInfo = (updatedData) => {
    setProfile(prev => ({
      ...prev,
      ...updatedData,
      student_id: updatedData.employee_id || prev.student_id
    }))
  }

  const handleAddNewAccomplishment = (newEntry) => {
    setAccomplishments(prev => PersonnelDashboardController.addNewAccomplishment(prev, newEntry))
  }

  const filteredAccomplishments = PersonnelDashboardController.filterAccomplishments(accomplishments, activeFilter)
  const accomplishmentIconMap = {
    BookOpen,
    Users,
    Building2,
    Award,
    ShieldCheck
  }

  return (
    <div key={activeRoleContext + '_' + (activeTabParam || 'overview')}>
      {activeRoleContext === 'program_coordinator' && activeTabParam !== 'faculty_view' ? (
        <CoordinatorDashboardPage key={activeTabParam || 'overview'} currentUser={currentUser} />
      ) : activeRoleContext === 'organization_moderator' && activeTabParam !== 'faculty_view' ? (
        <OrganizationModeratorDashboardPage key={activeTabParam || 'overview'} currentUser={currentUser} />
      ) : activeRoleContext === 'department_secretary' && activeTabParam !== 'faculty_view' ? (
        <DepartmentSecretaryDashboardPage key={activeTabParam || 'overview'} currentUser={currentUser} />
      ) : (
        <div className="space-y-8 font-sans">

          {/* ================= HERO SUMMARY BANNER ================= */}
          <div className="bg-[#EFF7F0] p-6 sm:p-8 rounded-3xl shadow-xs border border-[#69A97C] relative overflow-hidden">

            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#149653] border border-emerald-300/30 flex items-center justify-center text-white shadow-md shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-[#17663B] tracking-tight">Personnel Professional Portfolio</h1>
                  </div>
                  <p className="text-xs text-[#245F42] font-medium mt-0.5">
                    {profile.full_name} • {profile.employee_id} • {profile.department}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBarcodeOpen(true)}
                className="px-3 py-2 rounded-2xl bg-[#149653] hover:bg-[#125536] border border-[#149653] text-white flex items-center gap-2 transition text-xs font-bold shadow-xs group shrink-0"
                title="Click to expand Faculty Digital ID Barcode"
              >
                <QrCode className="w-4 h-4 text-white group-hover:scale-110 transition" />
                <span className="hidden sm:inline">Digital ID Barcode</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10 w-full">
              {/* Card 1: Attached Proof Files */}
              <Link
                to="/personnel/portfolio/edit"
                className="group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#D9E5DC] dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 text-left overflow-hidden cursor-pointer flex flex-col justify-between w-full"
              >
                <div className="absolute left-0 top-3.5 h-8 w-1 bg-[#159552] rounded-r-full"></div>

                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#E7F3E9] dark:bg-emerald-950/80 text-[#159552] dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileCheck2 className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-s font-bold text-slate-800 dark:text-slate-100 truncate">
                    Attached Proofs
                  </h3>
                </div>

                <div className="translate-x-2.5 flex items-center gap-2 z-10 relative">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#159552] dark:text-emerald-400 font-heading leading-none">
                    {accomplishments.filter(a => a.proof_file || a.attached_file_name).length}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E7F3E9] dark:bg-emerald-950/80 text-[#17663B] dark:text-[#245F42] text-[13px] font-bold">
                    Proof PDFs
                  </span>
                </div>

                <div className="absolute -bottom-1 -right-1 w-16 h-16 pointer-events-none opacity-20 text-[#159552] dark:text-emerald-400">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                    <path d="M40 95 Q 65 50 95 15 M95 15 C 75 28 55 45 40 95 M95 15 C 82 38 68 58 40 95" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M62 55 Q 78 38 88 40 M62 55 C 74 46 82 42 88 40" strokeWidth="2" strokeLinecap="round" />
                    <path d="M50 70 Q 35 52 24 58 M50 70 C 38 60 30 55 24 58" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </Link>

              {/* Card 2: Evaluation Period */}
              <div className="group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#D9E5DC] dark:border-slate-800 shadow-xs transition-all duration-200 text-left overflow-hidden flex flex-col justify-between w-full">
                <div className="absolute left-0 top-3.5 h-8 w-1 bg-[#159552] rounded-r-full"></div>

                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#E7F3E9] dark:bg-emerald-950/80 text-[#159552] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-s font-bold text-slate-800 dark:text-slate-100 truncate">
                    Evaluation Period
                  </h3>
                </div>

                <div className="flex items-center z-10 relative">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#159552]/40 dark:border-emerald-500/40 text-[#17663B] dark:text-[#245F42] text-[13px] font-bold bg-white dark:bg-slate-900">
                    <span className="w-2 h-2 rounded-full bg-[#159552] dark:bg-emerald-400"></span>
                    AY 2025–2026
                  </span>
                </div>

                <div className="absolute -bottom-1 -right-1 w-16 h-16 pointer-events-none opacity-20 text-[#159552] dark:text-emerald-400">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                    <path d="M40 95 Q 65 50 95 15 M95 15 C 75 28 55 45 40 95 M95 15 C 82 38 68 58 40 95" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M62 55 Q 78 38 88 40 M62 55 C 74 46 82 42 88 40" strokeWidth="2" strokeLinecap="round" />
                    <path d="M50 70 Q 35 52 24 58 M50 70 C 38 60 30 55 24 58" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Portfolio Status */}
              <Link
                to="/personnel/portfolio"
                className="group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#D9E5DC] dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 text-left overflow-hidden cursor-pointer flex flex-col justify-between w-full"
              >
                <div className="absolute left-0 top-3.5 h-8 w-1 bg-[#159552] rounded-r-full"></div>

                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#E7F3E9] dark:bg-emerald-950/80 text-[#159552] dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-s font-bold text-slate-800 dark:text-slate-100 truncate">
                    Portfolio Status
                  </h3>
                </div>

                <div className="flex items-center z-10 relative">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[13px] font-bold ${portfolio?.status === 'HR_APPROVED' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-[#245F42]' :
                    portfolio?.status === 'ENDORSED_TO_HR' ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                      portfolio?.status === 'SUBMITTED_TO_DEP_SEC' ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                        'border-amber-400 bg-amber-50/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${portfolio?.status === 'HR_APPROVED' ? 'bg-[#16834a]' :
                      portfolio?.status === 'ENDORSED_TO_HR' ? 'bg-blue-500' :
                        'bg-amber-500 animate-pulse'
                      }`}></span>
                    <span className="truncate">
                      {portfolio?.status === 'SUBMITTED_TO_DEP_SEC' ? 'Submitted to Sec' :
                        portfolio?.status === 'ENDORSED_TO_HR' ? 'Dept Endorsed' :
                          portfolio?.status === 'HR_APPROVED' ? 'HR Approved' : 'Draft Portfolio'}
                    </span>
                  </span>
                </div>

                <div className="absolute -bottom-1 -right-1 w-16 h-16 pointer-events-none opacity-20 text-[#16834a] dark:text-emerald-400">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                    <path d="M40 95 Q 65 50 95 15 M95 15 C 75 28 55 45 40 95 M95 15 C 82 38 68 58 40 95" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M62 55 Q 78 38 88 40 M62 55 C 74 46 82 42 88 40" strokeWidth="2" strokeLinecap="round" />
                    <path d="M50 70 Q 35 52 24 58 M50 70 C 38 60 30 55 24 58" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          {/* ================= ACHIEVEMENTS TIMELINE SECTION ================= */}
          <div id="achievements-timeline" className="scroll-mt-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Accomplishments Timeline</span>
                {activeFilter !== 'All' && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E7F3E9] dark:bg-emerald-950/60 text-[#064e2b] dark:text-[#245F42] border border-[#cbe6d2] dark:border-emerald-800">
                    Filtered: {activeFilter}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#16834a] hover:bg-[#236c3d] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Accomplishment</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Showing {filteredAccomplishments.length} of {accomplishments.length} records</span>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
              {[
                'All',
                'Degrees & Orgs',
                'Seminars & Trainings',
                'Lectures & Publications',
                'Research & Awards',
                'Instructional Materials',
                'Service & Community'
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${activeFilter === cat
                    ? 'bg-[#176B43] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Timeline Card Items */}
            <div className="space-y-3">
              {filteredAccomplishments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No accomplishment entries found under "{activeFilter}" category filter.
                </div>
              ) : (
                filteredAccomplishments.map((item) => {
                  const IconComponent = accomplishmentIconMap[item.icon] || Award
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${item.iconColor || 'text-[#16834a] bg-[#E7F3E9] border-[#cbe6d2]'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{item.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">📅 {item.date}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Verified'
                                ? 'bg-[#E7F3E9] dark:bg-emerald-950/60 text-[#064e2b] dark:text-[#245F42] border border-[#cbe6d2] dark:border-emerald-800'
                                : item.status === 'Endorsed'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                              {item.statusLabel || item.status}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.issuer}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => alert(`Viewing attached proof: ${item.attached_file_name}`)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" />
                          <span>Proof</span>
                        </button>
                        <span className="text-xs font-semibold px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#245F42] border border-emerald-100 dark:border-emerald-800 shrink-0">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>

        </div>
      )}

      {/* MODALS */}
      <DigitalBarcodeIDCardModal
        user={profile}
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
      />

      <EditBasicInfoModal
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        currentInfo={profile}
        onSave={handleSaveBasicInfo}
      />

      <PersonnelSubmissionModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmitAccomplishment={handleAddNewAccomplishment}
      />
    </div>
  )
}
