import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import EditBasicInfoModal from './modals/EditBasicInfoModal'
import PersonnelEvidencePreviewModal from './modals/PersonnelEvidencePreviewModal'
import PersonnelSubmissionModal from './modals/PersonnelSubmissionModal'
import FacultyAcademicSubmissionModal from './modals/FacultyAcademicSubmissionModal'
import CoordinatorDashboardPage from './program-coordinator/CoordinatorDashboardPage'
import OrganizationModeratorDashboardPage from './organization-moderator/OrganizationModeratorDashboardPage'
import { HREvaluationSubmissionsPage } from '../hr-admin/HREvaluationSubmissionsPage'

import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Plus,
  QrCode,
  ShieldCheck,
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
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import { usesFacultyAcademicPortfolio } from '../../utils/personnelPortfolioFormat'
import { ALL_FILTER_KEY, normalizeTimelineFilterKey, timelineCategoryState, timelineFiltersFor, timelineFormatFor } from '../../config/personnelTimelineFilters'
import { fetchOwnProfileFields } from '../../services/personnelProfileService'
import { getCurrentPersonnelEvaluationPeriod } from '../../services/personnelEvaluationPeriodService'

const accomplishmentCount = (count) => `${count} ${count === 1 ? 'accomplishment' : 'accomplishments'}`

/** Category badge: a readable type, or a warning with icon + text (never color alone). */
function TimelineCategoryBadge({ state }) {
  if (state.kind === 'classified') {
    return <span title={`Official category: ${state.official}`} className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 shrink-0">{state.label}</span>
  }
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-800 shrink-0"><AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />{state.label}</span>
}

export default function PersonnelDashboardPage({ currentUser: propUser, onRoleChange, initialAccomplishments = null }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeTabParam = searchParams.get('tab')
  const { user: authUser, activeRoleContext: authRoleContext } = useAuth() || {}
  const currentUser = propUser || authUser || getCurrentUser()
  const activeRoleContext = currentUser?.active_role_context || authRoleContext || 'personnel'

  const { portfolio, totals } = usePersonnelPortfolio(currentUser?.employee_id || currentUser?.id)

  // Modals state
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER_KEY)
  const [evaluationPeriod, setEvaluationPeriod] = useState(null)

  useEffect(() => { getCurrentPersonnelEvaluationPeriod().then((data) => setEvaluationPeriod(data?.period || null)).catch(() => setEvaluationPeriod(null)) }, [])

  // User Profile
  const [profile, setProfile] = useState(() => PersonnelDashboardController.getDefaultProfile(currentUser))

  useEffect(() => {
    if (currentUser) {
      setProfile(prev => PersonnelDashboardController.mergeProfile(prev, currentUser))
    }
  }, [currentUser])

  // Saved contact number, location and about-me come from the server so they survive a refresh.
  useEffect(() => {
    let active = true
    fetchOwnProfileFields().then(fields => { if (active) setProfile(prev => ({ ...prev, ...fields })) }).catch(() => {})
    return () => { active = false }
  }, [])

  const handleRoleChange = (newRole, updatedUser) => {
    if (onRoleChange) onRoleChange(newRole, updatedUser)
  }

  // Accomplishments loaded from the backend for the signed-in personnel
  const [accomplishments, setAccomplishments] = useState(() => initialAccomplishments || [])
  const [accomplishmentsLoading, setAccomplishmentsLoading] = useState(!initialAccomplishments)

  const reloadAccomplishments = async () => {
    setAccomplishmentsLoading(true)
    try {
      setAccomplishments(await PersonnelDashboardController.loadAccomplishments())
    } finally {
      setAccomplishmentsLoading(false)
    }
  }

  useEffect(() => {
    if (!initialAccomplishments) reloadAccomplishments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveBasicInfo = (updatedData) => {
    setProfile(prev => ({
      ...prev,
      ...updatedData,
      student_id: updatedData.employee_id || prev.student_id
    }))
  }

  // Persists the entry (unless the modal already saved it), then refreshes from the server.
  // Errors are re-thrown so the submission modal can show them.
  const handleAddNewAccomplishment = async (newEntry, file = null, persistence = null) => {
    if (!persistence?.alreadyPersisted) {
      await PersonnelDashboardController.saveAccomplishment(newEntry, file)
    }
    await reloadAccomplishments()
    return true
  }

  // "View proof" opens the secure in-app preview (images inline, PDFs in a viewer); download stays available there.
  const [previewEvidence, setPreviewEvidence] = useState(null)
  const handleViewProof = (item) => {
    const filename = item.attached_file_name || 'Proof document'
    const mimeType = item.evidence_mime_type || (/\.(png|jpe?g|gif|webp)$/i.test(filename) ? `image/${filename.split('.').pop().toLowerCase().replace('jpg', 'jpeg')}` : 'application/pdf')
    setPreviewEvidence({ id: item.evidence_id, original_filename: filename, mime_type: mimeType })
  }

  // Faculty and Non-Teaching Faculty see different filters, chosen from the authoritative personnel group.
  const timelineFormat = timelineFormatFor(currentUser)
  const timelineFilters = timelineFiltersFor(timelineFormat)
  const activeFilterKey = normalizeTimelineFilterKey(activeFilter, timelineFormat)
  const activeTimelineFilter = timelineFilters.find((option) => option.key === activeFilterKey)
  const categorizedAccomplishments = useMemo(
    () => accomplishments.map((item) => ({ ...item, categoryState: timelineCategoryState(item, timelineFormat) })),
    [accomplishments, timelineFormat]
  )
  // Drafts without a category are listed under "Needs attention" instead of the timeline.
  const needsAttentionEntries = categorizedAccomplishments.filter((item) => item.categoryState.kind === 'needs_category')
  const timelineEntries = categorizedAccomplishments.filter((item) => item.categoryState.kind !== 'needs_category')
  const filteredAccomplishments = PersonnelDashboardController.filterAccomplishments(timelineEntries, activeFilterKey, timelineFormat)
  const timelineCountText = activeFilterKey === ALL_FILTER_KEY
    ? accomplishmentCount(timelineEntries.length)
    : `${filteredAccomplishments.length} of ${accomplishmentCount(timelineEntries.length)}`

  // A role-context or personnel-group change never keeps the previous selection.
  useEffect(() => { setActiveFilter(ALL_FILTER_KEY) }, [activeRoleContext, timelineFormat])
  useEffect(() => { if (activeFilter !== activeFilterKey) setActiveFilter(activeFilterKey) }, [activeFilter, activeFilterKey])
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
      ) : activeRoleContext === 'dean' && activeTabParam === 'workspace' ? (
        <HREvaluationSubmissionsPage key="dean-evaluation-workspace" />
      ) : (
        <div className="space-y-8 font-sans">

          {/* ================= HERO SUMMARY BANNER ================= */}
          <div className="bg-[#EFF7F0] dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-xs border border-[#69A97C] dark:border-emerald-900/60 relative overflow-hidden">

            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#149653] dark:bg-emerald-600 border border-emerald-300/30 flex items-center justify-center text-white shadow-md shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-extrabold text-[#17663B] dark:text-emerald-300 tracking-tight">Personnel Professional Portfolio</h1>
                  </div>
                  <p className="text-xs text-[#245F42] dark:text-slate-300 font-medium mt-0.5">
                    {[profile.full_name, profile.employee_id || 'Employee ID not set', formatPersonnelPlacement(profile)].filter(Boolean).join(' • ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10 w-full">
              {/* Card 1: Attached Proof Files */}
              <Link
                to="/personnel/portfolio/edit"
                className="group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#D9E5DC] dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 text-left overflow-hidden cursor-pointer flex flex-col justify-between w-full"
              >
                <div className="absolute left-0 top-3.5 h-8 w-1 bg-[#159552] dark:bg-emerald-500 rounded-r-full"></div>

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
                    {accomplishments.filter(a => a.evidence_id).length}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E7F3E9] dark:bg-emerald-950/60 text-[#17663B] dark:text-emerald-300 border border-[#cbe6d2] dark:border-emerald-800 text-[13px] font-bold">
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
                <div className="absolute left-0 top-3.5 h-8 w-1 bg-[#159552] dark:bg-emerald-500 rounded-r-full"></div>

                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#E7F3E9] dark:bg-emerald-950/80 text-[#159552] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-s font-bold text-slate-800 dark:text-slate-100 truncate">
                    Evaluation Period
                  </h3>
                </div>

                <div className="flex items-center z-10 relative">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#159552]/40 dark:border-emerald-500/40 text-[#17663B] dark:text-emerald-300 text-[13px] font-bold bg-white dark:bg-slate-900">
                    <span className="w-2 h-2 rounded-full bg-[#159552] dark:bg-emerald-400"></span>
                    {evaluationPeriod?.academic_year_label || 'No open period'}
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
                <div className="absolute left-0 top-3.5 h-8 w-1 bg-[#159552] dark:bg-emerald-500 rounded-r-full"></div>

                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#E7F3E9] dark:bg-emerald-950/80 text-[#159552] dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4.5 h-4.5 stroke-[2.2]" />
                  </div>
                  <h3 className="text-s font-bold text-slate-800 dark:text-slate-100 truncate">
                    Portfolio Status
                  </h3>
                </div>

                <div className="flex items-center z-10 relative">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[13px] font-bold ${(portfolio?.status === 'HR_APPROVED' || portfolio?.status === 'completed') ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' :
                    (portfolio?.status === 'ENDORSED_TO_HR' || portfolio?.status === 'ready_for_finalization') ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' :
                      (portfolio?.status === 'SUBMITTED_TO_DEP_SEC' || portfolio?.status === 'submitted' || portfolio?.status === 'in_evaluation') ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' :
                        'border-amber-400 bg-amber-50/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${(portfolio?.status === 'HR_APPROVED' || portfolio?.status === 'completed') ? 'bg-[#16834a] dark:bg-emerald-400' :
                      (portfolio?.status === 'ENDORSED_TO_HR' || portfolio?.status === 'ready_for_finalization') ? 'bg-blue-500' :
                        'bg-amber-500 animate-pulse'
                      }`}></span>
                    <span className="truncate">
                      {(portfolio?.status === 'submitted' || portfolio?.status === 'SUBMITTED_TO_DEP_SEC') ? 'Submitted' :
                        portfolio?.status === 'in_evaluation' ? 'In Evaluation' :
                          (portfolio?.status === 'ENDORSED_TO_HR' || portfolio?.status === 'ready_for_finalization') ? 'Ready for Finalization' :
                            (portfolio?.status === 'HR_APPROVED' || portfolio?.status === 'completed') ? 'Approved' : 'Draft Portfolio'}
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

          {/* ================= ACCOMPLISHMENTS TIMELINE SECTION ================= */}
          <section id="achievements-timeline" aria-labelledby="accomplishments-timeline-title" className="scroll-mt-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 id="accomplishments-timeline-title" className="text-base font-bold text-slate-800 dark:text-white">Accomplishments Timeline</h2>
                {!accomplishmentsLoading && timelineEntries.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5" aria-live="polite">{timelineCountText}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitOpen(true)}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#16834a] hover:bg-[#236c3d] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add accomplishment</span>
              </button>
            </div>

            {!accomplishmentsLoading && timelineEntries.length > 0 && (
              <>
                {/* Mobile: a labeled select, so no filter is hidden behind horizontal scrolling. */}
                <div className="sm:hidden mb-4">
                  <label htmlFor="accomplishment-filter-select" className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">Show accomplishments</label>
                  <select
                    id="accomplishment-filter-select"
                    value={activeFilterKey}
                    onChange={(event) => setActiveFilter(event.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  >
                    {timelineFilters.map((option) => (
                      <option key={option.key} value={option.key}>{option.key === ALL_FILTER_KEY ? 'All accomplishments' : option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tablet / desktop: wrapping filter chips. */}
                <div className="hidden sm:flex items-start gap-2.5 mb-4">
                  <span id="accomplishment-filter-label" className="pt-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Show:</span>
                  <div role="group" aria-label="Filter accomplishments by type" className="flex flex-wrap gap-2">
                    {timelineFilters.map((option) => {
                      const selected = option.key === activeFilterKey
                      return (
                        <button
                          key={option.key}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setActiveFilter(option.key)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${selected
                            ? 'bg-[#176B43] dark:bg-emerald-600 text-white shadow-xs border border-[#176B43] dark:border-emerald-600'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Drafts that cannot be submitted until a category is chosen. */}
            {!accomplishmentsLoading && needsAttentionEntries.length > 0 && (
              <section aria-labelledby="timeline-needs-attention-title" className="mb-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 p-4">
                <h3 id="timeline-needs-attention-title" className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Needs attention
                </h3>
                <ul className="mt-3 space-y-2">
                  {needsAttentionEntries.map((item) => (
                    <li key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <TimelineCategoryBadge state={item.categoryState} />
                          <span>{item.categoryState.message}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/personnel/portfolio/edit')}
                        className="shrink-0 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-100 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                      >
                        Finish details
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Timeline Card Items */}
            <div className="space-y-3">
              {accomplishmentsLoading ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs" aria-busy="true">
                  Loading your accomplishments...
                </div>
              ) : accomplishments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">No accomplishments yet</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add your first accomplishment and attach supporting proof.</p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16834a] hover:bg-[#236c3d] text-white text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add accomplishment
                  </button>
                </div>
              ) : filteredAccomplishments.length === 0 && timelineEntries.length > 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{activeTimelineFilter.emptyHeading}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No accomplishments match this type.</p>
                  <button
                    type="button"
                    onClick={() => setActiveFilter(ALL_FILTER_KEY)}
                    className="mt-4 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  >
                    Show all
                  </button>
                </div>
              ) : (
                filteredAccomplishments.map((item) => {
                  const IconComponent = accomplishmentIconMap[item.icon] || Award
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${item.iconColor || 'text-[#16834a] dark:text-emerald-400 bg-[#E7F3E9] dark:bg-emerald-950/60 border-[#cbe6d2] dark:border-emerald-800'}`}>
                          <IconComponent className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{item.title}</h3>
                          {item.description && <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 line-clamp-1">{item.description}</p>}
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">📅 {item.date}</span>
                            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Verified'
                                ? 'bg-[#E7F3E9] dark:bg-emerald-950/60 text-[#064e2b] dark:text-emerald-300 border border-[#cbe6d2] dark:border-emerald-800'
                                : item.status === 'Endorsed'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}
                            >
                              {item.statusLabel || item.status}
                            </span>
                            {item.issuer && <>
                              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.issuer}</span>
                            </>}
                          </div>
                          {item.categoryState.kind === 'classified'
                            ? <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Official category: {item.categoryState.official}</p>
                            : <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-200">{item.categoryState.message}</p>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        {item.evidence_id && (
                        <button
                          type="button"
                          onClick={() => handleViewProof(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-[#16834a] dark:text-emerald-400" aria-hidden="true" />
                          <span>View proof</span>
                        </button>
                        )}
                        <TimelineCategoryBadge state={item.categoryState} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </section>

        </div>
      )}

      {/* MODALS */}
      <PersonnelEvidencePreviewModal evidence={previewEvidence} onClose={() => setPreviewEvidence(null)} />
      <EditBasicInfoModal
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        currentInfo={profile}
        onSave={handleSaveBasicInfo}
      />

      {usesFacultyAcademicPortfolio(currentUser) ? (
        <FacultyAcademicSubmissionModal
          isOpen={isSubmitOpen}
          onClose={() => setIsSubmitOpen(false)}
          onSubmitAccomplishment={handleAddNewAccomplishment}
          currentUser={currentUser}
          areaCode="A"
          areaName="Professional Development"
        />
      ) : (
        <PersonnelSubmissionModal
          isOpen={isSubmitOpen}
          onClose={() => setIsSubmitOpen(false)}
          onSubmitAccomplishment={handleAddNewAccomplishment}
        />
      )}
    </div>
  )
}
