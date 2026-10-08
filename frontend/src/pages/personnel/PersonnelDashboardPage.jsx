import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EditBasicInfoModal from './modals/EditBasicInfoModal'
import PersonnelEvidencePreviewModal from './modals/PersonnelEvidencePreviewModal'
import AchievementPreviewModal from './modals/AchievementPreviewModal'
import PersonnelSubmissionModal from './modals/PersonnelSubmissionModal'
import FacultyAcademicSubmissionModal from './modals/FacultyAcademicSubmissionModal'
import CoordinatorDashboardPage from './program-coordinator/CoordinatorDashboardPage'
import OrganizationModeratorDashboardPage from './organization-moderator/OrganizationModeratorDashboardPage'
import { HREvaluationSubmissionsPage } from '../hr-admin/HREvaluationSubmissionsPage'

import {
  AlertTriangle,
  Award,
  BookOpen,
  Plus,
  ShieldCheck,
  FileCheck2,
  Edit3,
  Search,
  ArrowDownUp,
  MoreVertical,
  Trash2,
  Users,
  Building2,
  IdCard,
  Briefcase,
  Mail
} from 'lucide-react'

import { getCurrentUser } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import PersonnelDashboardController from '../../controllers/PersonnelDashboardController'
import { formatPersonnelPlacement } from '../../utils/personnelPlacement'
import PersonnelProfilePhotoService from '../../services/PersonnelProfilePhotoService'
import personnelAccomplishmentService from '../../services/personnelAccomplishmentService'
import campusBanner from '../../assets/ndmu_campus_banner.png'
import { AchieveNestLogo } from '../../components/brand'
import AchievementReuseBadge from '../../components/common/AchievementReuseBadge'
import { isPersonnelAreaEntryAllowed, usesFacultyAcademicPortfolio } from '../../utils/personnelPortfolioFormat'
import { ALL_FILTER_KEY, normalizeTimelineFilterKey, timelineCategoryState, timelineFiltersFor, timelineFormatFor } from '../../config/personnelTimelineFilters'
import { fetchOwnProfileFields } from '../../services/personnelProfileService'
import { alertDialog, confirmDialog } from '../../components/ui/DialogProvider'

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

  // Modals state
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER_KEY)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [editingAccomplishment, setEditingAccomplishment] = useState(null)
  const [viewingAccomplishment, setViewingAccomplishment] = useState(null)
  const [openActionsId, setOpenActionsId] = useState(null)
  const actionButtonRefs = useRef(new Map())
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
    setProfile(prev => ({ ...prev, ...updatedData }))
  }

  // Persists the entry (unless the modal already saved it), then refreshes from the server.
  // Errors are re-thrown so the submission modal can show them.
  const handleAddNewAccomplishment = async (newEntry, file = null, persistence = null) => {
    if (persistence?.alreadyPersisted) {
      // Faculty forms persist the record themselves; refresh the permanent repository.
    } else if (editingAccomplishment) {
      await PersonnelAchievementController.updateAchievement([], editingAccomplishment.id, newEntry, file)
    } else {
      await PersonnelDashboardController.saveAccomplishment(newEntry, file)
    }
    await reloadAccomplishments()
    setEditingAccomplishment(null)
    return true
  }

  const openAccomplishmentEditor = (item) => {
    setEditingAccomplishment(item)
    setViewingAccomplishment(null)
    setIsSubmitOpen(true)
  }

  const handleDeleteAccomplishment = async (item) => {
    const confirmed = await confirmDialog({
      title: 'Delete accomplishment?',
      message: `Are you sure you want to delete “${item.title}”? The accomplishment and its attached proof document will be removed. This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'destructive'
    })
    if (!confirmed) return
    try {
      await personnelAccomplishmentService.deleteAccomplishment(item.id)
      setAccomplishments((current) => current.filter((accomplishment) => accomplishment.id !== item.id))
      if (viewingAccomplishment?.id === item.id) setViewingAccomplishment(null)
    } catch (error) {
      await alertDialog({ title: 'Could not delete accomplishment', message: error?.message || 'The accomplishment could not be deleted. It may be locked by an active evaluation.', tone: 'destructive' })
    }
  }

  useEffect(() => {
    if (!openActionsId) return undefined
    const handlePointerDown = (event) => {
      if (!event.target.closest?.('[data-accomplishment-actions]')) setOpenActionsId(null)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenActionsId(null)
        actionButtonRefs.current.get(openActionsId)?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openActionsId])

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
    () => accomplishments.map((item) => {
      const area = String(item.category_area || item.category_code || item.category || '').match(/^\s*([ABC])(?:\.|\s|$)/i)?.[1]?.toUpperCase()
        || (usesFacultyAcademicPortfolio(currentUser) ? 'A' : 'B')
      return {
        ...item,
        is_editable: Boolean(item.is_editable && isPersonnelAreaEntryAllowed(currentUser, area)),
        categoryState: timelineCategoryState(item, timelineFormat)
      }
    }),
    [accomplishments, currentUser, timelineFormat]
  )
  // Drafts without a category are listed under "Needs attention" instead of the timeline.
  const needsAttentionEntries = categorizedAccomplishments.filter((item) => item.categoryState.kind === 'needs_category')
  const timelineEntries = categorizedAccomplishments
  const filteredByCategory = PersonnelDashboardController.filterAccomplishments(timelineEntries, activeFilterKey, timelineFormat)
  const filteredAccomplishments = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase()
    const filtered = filteredByCategory.filter((item) => !query || [item.title, item.category, item.issuer, item.description]
      .some((value) => String(value || '').toLocaleLowerCase().includes(query)))
    const dateValue = (item) => {
      const time = Date.parse(item.date || '')
      return Number.isFinite(time) ? time : null
    }
    return filtered.sort((a, b) => {
      if (sortOrder === 'title') return String(a.title || '').localeCompare(String(b.title || ''))
      const first = dateValue(a)
      const second = dateValue(b)
      if (first === null || second === null) return first === null ? (second === null ? 0 : 1) : -1
      return sortOrder === 'oldest' ? first - second : second - first
    })
  }, [filteredByCategory, searchQuery, sortOrder])
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
  const editingAreaCode = editingAccomplishment?.category_area?.replace('area', '')
    || String(editingAccomplishment?.category_code || editingAccomplishment?.category || '').match(/^\s*([ABC])(?:\.|\s|$)/i)?.[1]?.toUpperCase()
    || (usesFacultyAcademicPortfolio(currentUser) ? 'A' : 'B')
  const profileDetails = [
    { label: 'Employee ID', value: profile.employee_id || 'Not recorded by HR', Icon: IdCard },
    { label: 'Current Rank', value: profile.current_rank_title || profile.academic_rank || profile.position_title || profile.designation || 'Not recorded by HR', Icon: Award },
    { label: 'Years of Service', value: profile.length_of_service?.display || 'Not recorded by HR', Icon: Briefcase },
    { label: 'Institutional Email', value: profile.institutional_email || profile.email || 'Not recorded by HR', Icon: Mail }
  ]

  return (
    <div>
      {activeRoleContext === 'program_coordinator' && activeTabParam !== 'faculty_view' ? (
        <CoordinatorDashboardPage key={activeTabParam || 'overview'} currentUser={currentUser} />
      ) : activeRoleContext === 'organization_moderator' && activeTabParam !== 'faculty_view' ? (
        <OrganizationModeratorDashboardPage key={activeTabParam || 'overview'} currentUser={currentUser} />
      ) : activeRoleContext === 'dean' && activeTabParam === 'workspace' ? (
        <HREvaluationSubmissionsPage key="dean-evaluation-workspace" />
      ) : (
        <div className="space-y-8 font-sans">

          {/* Profile identity and permanent accomplishment repository share one destination. */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 260" preserveAspectRatio="none">
              <defs>
                <clipPath id="personnel-profile-banner-curve">
                  <path d="M0 0H180C166 52 148 103 127 151C105 202 76 238 44 260H0Z" />
                </clipPath>
              </defs>
              <image href={campusBanner} x="0" y="0" width="250" height="260" preserveAspectRatio="xMidYMid slice" clipPath="url(#personnel-profile-banner-curve)" opacity="0.55" />
              <path d="M0 0H180C166 52 148 103 127 151C105 202 76 238 44 260H0Z" fill="#064e2b" fillOpacity="0.82" />
            </svg>
            <div className="relative min-h-[290px] p-5 pt-24 sm:min-h-[280px] sm:px-8 sm:pt-7 sm:pb-5 sm:pl-[16%]">
              <div className="absolute left-4 top-4 z-10 rounded-lg bg-white px-2 py-1 sm:left-8 sm:top-7">
                <AchieveNestLogo variant="horizontal" size="compact" />
              </div>
              <span className="absolute right-6 top-7 hidden text-right font-serif text-sm italic text-slate-500 dark:text-slate-400 lg:block">Character, Competence and Culture in harmony</span>
              <div className="mb-6 flex items-center gap-3 sm:absolute sm:left-8 sm:top-1/2 sm:mb-0 sm:-translate-y-1/2">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-white bg-emerald-950 text-lg font-black text-emerald-100 shadow-md sm:h-28 sm:w-28 sm:border-4">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.full_name || 'Personnel profile'} className="h-full w-full object-cover" />
                    : <span>{PersonnelProfilePhotoService.getInitials(profile.full_name)}</span>}
                </div>
              </div>
              <div className="sm:mt-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-3xl">{profile.full_name || 'Personnel Profile'}</h1>
                      </div>
                      <p className="mt-1 text-sm font-extrabold text-emerald-800 dark:text-emerald-400">{formatPersonnelPlacement(profile)}</p>
                    </div>
                  </div>
                <button
                  type="button"
                  onClick={() => setIsEditInfoOpen(true)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-300 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-900 sm:self-center"
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />Edit Profile
                </button>
              </div>
                <div className="mt-4 flex w-fit max-w-full flex-wrap items-center gap-y-3">
                  {profileDetails.map(({ label, value, Icon }, index) => (
                    <div key={label} className={`flex min-w-0 max-w-full items-center gap-2.5 pr-3 ${index > 0 ? 'xl:ml-1 xl:border-l xl:border-slate-200/70 xl:pl-3.5 dark:xl:border-slate-700/70' : ''}`}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className={`min-w-0 ${label === 'Institutional Email' ? 'max-w-[24rem]' : ''}`}>
                        <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</span>
                        <span className={`mt-0.5 block text-[13px] font-medium leading-snug text-slate-800 dark:text-slate-200 ${label === 'Institutional Email' ? 'break-all' : 'break-words'}`}>{value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ================= PERMANENT ACCOMPLISHMENT REPOSITORY ================= */}
          <section id="achievements-timeline" aria-labelledby="accomplishments-timeline-title" className="scroll-mt-6">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 id="accomplishments-timeline-title" className="text-xl font-extrabold text-slate-900 dark:text-white">My Accomplishments</h2>
                <div className="mt-0.5 max-w-2xl text-xs text-slate-500 dark:text-slate-400">
                  <p>Your permanent repository of professional accomplishments.</p>
                  <p>These records remain here even if they have been used in previous evaluations.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitOpen(true)}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#16834a] hover:bg-[#236c3d] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add Accomplishment</span>
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
                      const optionCount = option.key === ALL_FILTER_KEY
                        ? timelineEntries.length
                        : timelineEntries.filter((item) => PersonnelDashboardController.filterAccomplishments([item], option.key, timelineFormat).length > 0).length
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
                          {option.label}{option.key === ALL_FILTER_KEY ? ` (${optionCount})` : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {!accomplishmentsLoading && timelineEntries.length > 0 && (
              <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="relative block">
                  <span className="sr-only">Search accomplishments</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search accomplishments..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </label>
                <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <ArrowDownUp className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span className="sr-only">Sort accomplishments</span>
                  <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort accomplishments" className="h-full min-w-32 bg-transparent text-sm text-slate-800 outline-none dark:text-slate-200">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title A–Z</option>
                  </select>
                </label>
              </div>
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
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{searchQuery ? 'No accomplishments match your search' : activeTimelineFilter.emptyHeading}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Adjust the search or choose another category to see more records.</p>
                  <button
                    type="button"
                    onClick={() => { setActiveFilter(ALL_FILTER_KEY); setSearchQuery('') }}
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
                      className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900 sm:px-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${item.iconColor || 'border-[#cbe6d2] bg-[#E7F3E9] text-[#16834a] dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'}`}>
                            <IconComponent className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setViewingAccomplishment(item)}
                              className="block max-w-full truncate text-left text-sm font-bold leading-tight text-slate-900 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-100 dark:hover:text-emerald-300"
                              aria-label={`View details for ${item.title}`}
                            >{item.title}</button>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              {item.date && <span>{item.date}</span>}
                              {item.date && item.issuer && <span aria-hidden="true">•</span>}
                              {item.issuer && <span className="truncate">{item.issuer}</span>}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <AchievementReuseBadge accomplishment={item} />
                              {item.status === 'Returned' && <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Returned for revision</span>}
                              <TimelineCategoryBadge state={item.categoryState} />
                            </div>
                            {item.categoryState.kind === 'needs_review' && <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-200">{item.categoryState.message}</p>}
                          </div>
                        </div>

                        {(item.evidence_id || item.is_editable || item.is_deletable) && <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 md:border-0 md:pt-0">
                          <div className="relative" data-accomplishment-actions>
                            <button
                              ref={(node) => { if (node) actionButtonRefs.current.set(item.id, node); else actionButtonRefs.current.delete(item.id) }}
                              type="button"
                              aria-label={`Actions for ${item.title}`}
                              aria-expanded={openActionsId === item.id}
                              aria-controls={openActionsId === item.id ? `accomplishment-actions-${item.id}` : undefined}
                              onClick={() => setOpenActionsId((current) => current === item.id ? null : item.id)}
                              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                            >
                              <MoreVertical className="h-4 w-4" aria-hidden="true" />
                            </button>
                            {openActionsId === item.id && <div id={`accomplishment-actions-${item.id}`} role="group" aria-label={`${item.title} actions`} className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                              {item.evidence_id && <button type="button" onClick={() => { setOpenActionsId(null); handleViewProof(item) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"><FileCheck2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />View proof</button>}
                              {item.is_editable && <button type="button" onClick={() => { setOpenActionsId(null); openAccomplishmentEditor(item) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-200 dark:hover:bg-slate-800"><Edit3 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />Edit</button>}
                              {item.is_deletable && <button type="button" onClick={() => { setOpenActionsId(null); handleDeleteAccomplishment(item) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:text-rose-300 dark:hover:bg-rose-950/40"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</button>}
                            </div>}
                          </div>
                        </div>}
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
      <AchievementPreviewModal
        isOpen={Boolean(viewingAccomplishment)}
        achievement={viewingAccomplishment}
        onClose={() => setViewingAccomplishment(null)}
        onEdit={openAccomplishmentEditor}
        onResubmit={openAccomplishmentEditor}
        onDownload={(item) => personnelAccomplishmentService.downloadEvidenceBlob(item.evidence_id, item.attached_file_name)}
      />
      <EditBasicInfoModal
        isOpen={isEditInfoOpen}
        onClose={() => setIsEditInfoOpen(false)}
        currentInfo={profile}
        onSave={handleSaveBasicInfo}
      />

      {usesFacultyAcademicPortfolio(currentUser) ? (
        <FacultyAcademicSubmissionModal
          isOpen={isSubmitOpen}
          onClose={() => { setIsSubmitOpen(false); setEditingAccomplishment(null) }}
          onSubmitAccomplishment={handleAddNewAccomplishment}
          editingItem={editingAccomplishment}
          currentUser={currentUser}
          areaCode={editingAreaCode}
          areaName={editingAccomplishment?.category || 'Professional Development'}
        />
      ) : (
        <PersonnelSubmissionModal
          isOpen={isSubmitOpen}
          onClose={() => { setIsSubmitOpen(false); setEditingAccomplishment(null) }}
          onSubmitAccomplishment={handleAddNewAccomplishment}
          initialCategory={editingAccomplishment?.category || 'B.1 Guest Lecturer / Consultant / Judge'}
          editingItem={editingAccomplishment}
          existingAchievements={accomplishments}
          areaCode={editingAreaCode}
          areaName={editingAccomplishment?.category || 'Service & Leadership'}
        />
      )}
    </div>
  )
}
